
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Utensils, 
  Activity, 
  User as UserIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Scale,
  Target,
  TrendingDown,
  Info,
  Database,
  ListFilter,
  ShieldCheck, 
  CheckCircle2,
  Globe,
  Coffee,
  Sun,
  Moon,
  Zap,
  Cloud,
  Download,
  Upload,
  Share2,
  Check,
  AlertCircle,
  GlassWater,
  Search,
  ChevronDown,
  X
} from 'lucide-react';
import { 
  UserProfile, 
  DailyLog, 
  AppState, 
  MealMoment, 
  LoggedMealItem,
  MealOption,
  ActivityType,
  Language
} from './types';
import { 
  MEAL_OPTIONS, 
  ACTIVITY_TYPES, 
  DAILY_KCAL_INTAKE_GOAL,
  PRODUCT_TRANSLATIONS,
  MEAL_MOMENTS
} from './constants';
import { 
  calculateTDEE,
  calculateActivityBurn, 
  calculateTargetDate
} from './services/calculator';
import { translations } from './translations';

const DB_NAME = 'GezondPlanningDB';
const STORE_NAME = 'appState';
const STATE_KEY = 'mainState';

const idb = {
  open: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 3);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  get: async (): Promise<AppState | null> => {
    try {
      const db = await idb.open();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(STATE_KEY);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (e) { return null; }
  },
  set: async (state: AppState): Promise<void> => {
    try {
      const db = await idb.open();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(state, STATE_KEY);
        tx.oncomplete = () => resolve();
      });
    } catch (e) { console.error("DB Save Fail", e); }
  },
  clear: async (): Promise<void> => {
    const db = await idb.open();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    return new Promise(resolve => tx.oncomplete = () => resolve());
  }
};

const INITIAL_STATE: AppState = {
  profile: { age: 55, height: 194, startWeight: 92, currentWeight: 92, targetWeight: 80 },
  dailyLogs: {},
  customOptions: MEAL_OPTIONS,
  customActivities: ACTIVITY_TYPES,
  language: 'nl'
};

const Toast = ({ message, type = 'success', onHide }: { message: string, type?: 'success' | 'error' | 'info', onHide: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onHide, 3000);
    return () => clearTimeout(timer);
  }, [onHide]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-bottom-4 duration-300 w-max max-w-[90vw]">
      <div className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border backdrop-blur-md bg-opacity-95 ${
        type === 'error' ? 'bg-red-900 border-red-700 text-white' : 
        type === 'info' ? 'bg-sky-900 border-sky-700 text-white' :
        'bg-slate-900 border-slate-700 text-white'
      }`}>
        {type === 'error' ? <AlertCircle size={16} className="text-red-400" /> : <Check size={16} className="text-emerald-400" />}
        <span className="text-xs font-black uppercase tracking-widest">{message}</span>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'activity' | 'profile'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [showInfo, setShowInfo] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showMyList, setShowMyList] = useState(false);
  const [showMyActivityList, setShowMyActivityList] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(ACTIVITY_TYPES[0].id);
  const [toast, setToast] = useState<{msg: string, type?: 'success' | 'error' | 'info'} | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [openPickerMoment, setOpenPickerMoment] = useState<MealMoment | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const t = useMemo(() => {
    const lang = state.language || 'nl';
    const base = translations['nl'];
    const selected = translations[lang] || {};
    
    const merge = (b: any, s: any) => {
      if (!s) return b;
      const result = { ...b };
      for (const key in b) {
        if (s[key] && typeof s[key] === 'object' && !Array.isArray(s[key])) {
          result[key] = { ...b[key], ...s[key] };
        } else if (s[key]) {
          result[key] = s[key];
        }
      }
      return result;
    };

    return merge(base, selected);
  }, [state.language]);

  const [newProductName, setNewProductName] = useState('');
  const [newProductGram, setNewProductGram] = useState('');
  const [newProductKcal, setNewProductKcal] = useState('');
  const [newProductCats, setNewProductCats] = useState<string[]>([]);
  const [newProductIsDrink, setNewProductIsDrink] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityKcalMin, setNewActivityKcalMin] = useState('');

  const [mealInputs, setMealInputs] = useState<Record<string, { mealId: string, qty: number }>>({});

  const flagEmojis: Record<Language, string> = { 
    nl: '🇳🇱', en: '🇬🇧', es: '🇪🇸', de: '🇩🇪', pt: '🇵🇹', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷', hi: '🇮🇳', ar: '🇸🇦'
  };

  useEffect(() => {
    idb.get().then(saved => {
      if (saved) {
        setState({
          ...saved,
          customActivities: saved.customActivities && saved.customActivities.length > 0 ? saved.customActivities : ACTIVITY_TYPES
        });
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) idb.set(state);
  }, [state, isLoaded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpenPickerMoment(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLog = useMemo(() => state.dailyLogs[selectedDate] || { date: selectedDate, meals: {}, activities: [] }, [state.dailyLogs, selectedDate]);
  
  const latestWeight = useMemo((): number => {
    const dates = Object.keys(state.dailyLogs).sort().reverse();
    const todayWeight = state.dailyLogs[selectedDate]?.weight;
    if (typeof todayWeight === 'number') return todayWeight;
    
    for (const d of dates) { 
      const weight = state.dailyLogs[d]?.weight;
      if (d <= selectedDate && typeof weight === 'number') return weight; 
    }
    return Number(state.profile.currentWeight) || 0;
  }, [state.dailyLogs, state.profile.currentWeight, selectedDate]);

  const totals = useMemo(() => {
    const activityBurn = Number(currentLog.activities.reduce((sum: number, a) => sum + (Number(a.burnedKcal) || 0), 0));
    const startW = Number(state.profile.startWeight) || 0;
    const targetW = Number(state.profile.targetWeight) || 0;
    const currentW = Number(latestWeight) || Number(state.profile.currentWeight) || 0;
    
    const effectiveProfile: UserProfile = { ...state.profile, currentWeight: currentW };
    const baselineTdee = Number(calculateTDEE(effectiveProfile, 0));
    
    const actualIntake = Number(Object.values(currentLog.meals).reduce((acc: number, items: any) => {
      const mealItems = items as LoggedMealItem[];
      return acc + Number(mealItems.reduce((sum: number, m: LoggedMealItem) => sum + (Number(m.kcal) || 0), 0));
    }, 0));
    
    const intakeGoal = Number(DAILY_KCAL_INTAKE_GOAL) || 1800;
    const currentAdjustedGoal = Number(intakeGoal + activityBurn);
    const deficit = Number((baselineTdee + activityBurn) - intakeGoal);
    const targetDateStr = calculateTargetDate(effectiveProfile, deficit);
    
    const weightJourneyTotal = Number(startW - targetW);
    const weightLostSoFar = Number(startW - currentW);
    const weightProgressPercent = weightJourneyTotal > 0 ? (weightLostSoFar / weightJourneyTotal) * 100 : 0;
    
    const intakePercent = currentAdjustedGoal > 0 ? (actualIntake / currentAdjustedGoal) * 100 : 0;
    let calorieStatusColor = 'bg-green-500';
    if (actualIntake > currentAdjustedGoal) calorieStatusColor = 'bg-red-500';
    else if (intakePercent > 85) calorieStatusColor = 'bg-amber-500';

    return { 
      activityBurn, 
      baselineTdee, 
      actualIntake, 
      targetDate: targetDateStr, 
      weightProgressPercent, 
      currentAdjustedGoal,
      intakePercent,
      calorieStatusColor
    };
  }, [state.profile, currentLog, latestWeight]);

  const dateParts = useMemo(() => {
    const dateObj = new Date(selectedDate);
    const locale = state.language === 'en' ? 'en-US' : (state.language === 'es' ? 'es-ES' : (state.language === 'de' ? 'de-DE' : 'nl-NL'));
    const parts = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(dateObj);
    return {
      day: parts.find(p => p.type === 'day')?.value || '',
      month: parts.find(p => p.type === 'month')?.value || '',
      weekday: parts.find(p => p.type === 'weekday')?.value || ''
    };
  }, [selectedDate, state.language]);

  const mealGroups = useMemo(() => [
    { label: t.timeGroups.morning, icon: Coffee, moments: ['Ontbijt', 'Ochtend snack'] as MealMoment[] },
    { label: t.timeGroups.afternoon, icon: Sun, moments: ['Lunch', 'Middag snack'] as MealMoment[] },
    { label: t.timeGroups.evening, icon: Moon, moments: ['Diner', 'Avondsnack'] as MealMoment[] }
  ], [t]);

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(state, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `doelgewicht_backup_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      setToast({msg: state.language === 'nl' ? "Download gestart" : "Download started"});
    } catch (e) {
      setToast({msg: "Download mislukt", type: 'error'});
    }
  };

  const handleCloudExport = async (provider: string) => {
    const dataStr = JSON.stringify(state, null, 2);
    const fileName = `doelgewicht_backup.json`;
    setToast({msg: `${t.dataManagement.googleDrive.split(' ')[0]} back-up...`, type: 'info'});
    try {
      const file = new File([dataStr], fileName, { type: 'application/json' });
      if (navigator.share) {
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: `Doelgewicht ${provider} Back-up`, text: `Handmatige back-up voor ${provider}` });
          } else {
            await navigator.share({ title: `Doelgewicht ${provider} Back-up`, text: dataStr });
          }
          setToast({msg: state.language === 'nl' ? "Deelmenu geopend" : "Share menu opened"});
        } catch (shareErr) {
          exportData();
        }
      } else {
        exportData();
      }
    } catch (err) {
      exportData();
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.profile && json.dailyLogs) {
          setState(json);
          setToast({msg: state.language === 'nl' ? 'Gegevens hersteld!' : 'Data restored!'});
        }
      } catch (err) {
        setToast({msg: "Herstel mislukt: ongeldig bestand", type: 'error'});
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const resetAllData = async () => {
    if (confirm(t.dataManagement.clearConfirm)) {
      await idb.clear();
      setState(INITIAL_STATE);
      setActiveTab('dashboard');
      setToast({msg: state.language === 'nl' ? 'Alles gewist' : 'Cleared all'});
    }
  };

  const getTranslatedName = (id: string, originalName: string) => {
    const lang = state.language || 'nl';
    const translated = PRODUCT_TRANSLATIONS[lang]?.[id];
    if (translated) return translated;
    
    const engTranslated = PRODUCT_TRANSLATIONS['en']?.[id];
    if (engTranslated) return engTranslated;

    return originalName;
  };

  const splitProductName = (fullName: string) => {
    const unitRegex = /(\d+\s*(ml|g|gr|gram|liter|l|cl))/i;
    const match = fullName.match(unitRegex);
    let title = fullName;
    let unitInfo = null;
    if (match) {
      unitInfo = match[1].trim();
      title = fullName.replace(match[0], '').trim();
      title = title.replace(/,\s*\)/g, ')')
                   .replace(/\(\s*,/g, '(')
                   .replace(/\(\s*\)/g, '')
                   .replace(/,\s*$/, '')
                   .replace(/\s+/g, ' ')
                   .trim();
    }
    return { title, unitInfo };
  };

  const setDailyWeight = (weight: number | undefined) => {
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      logs[selectedDate] = { ...(logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] }), weight };
      return { ...prev, dailyLogs: logs };
    });
  };

  const addMealItem = (moment: MealMoment, item: Omit<LoggedMealItem, 'id'>) => {
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] };
      const meals = { ...log.meals };
      meals[moment] = [...(meals[moment] || []), { ...item, id: Math.random().toString(36).substr(2, 9) }];
      logs[selectedDate] = { ...log, meals };
      return { ...prev, dailyLogs: logs };
    });
  };

  const removeMealItem = (moment: MealMoment, id: string) => {
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      if (!logs[selectedDate]) return prev;
      const meals = { ...logs[selectedDate].meals };
      meals[moment] = (meals[moment] || []).filter(m => m.id !== id);
      logs[selectedDate] = { ...logs[selectedDate], meals };
      return { ...prev, dailyLogs: logs };
    });
  };

  const addActivity = (typeId: string, value: number) => {
    const burn = calculateActivityBurn({ typeId, value }, latestWeight || state.profile.currentWeight);
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] };
      logs[selectedDate] = { ...log, activities: [...log.activities, { id: Math.random().toString(36).substr(2, 9), typeId, value, burnedKcal: burn }] };
      return { ...prev, dailyLogs: logs };
    });
    const input = document.getElementById('act-val') as HTMLInputElement;
    if (input) input.value = '';
  };

  const removeActivity = (id: string) => {
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      if (!logs[selectedDate]) return prev;
      logs[selectedDate] = { ...logs[selectedDate], activities: logs[selectedDate].activities.filter(a => a.id !== id) };
      return { ...prev, dailyLogs: logs };
    });
  };

  const removeProductFromMomentInLibrary = (moment: MealMoment, productId: string) => {
    setState((prev: AppState) => {
      const newOptions = { ...prev.customOptions };
      if (newOptions[moment]) newOptions[moment] = newOptions[moment].filter(o => o.id !== productId);
      return { ...prev, customOptions: newOptions };
    });
  };

  const addCustomOptionCentral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductKcal || newProductCats.length === 0) return;
    const kcalValue = Number(newProductKcal);
    const displayName = newProductGram ? `${newProductName} (${newProductGram}g)` : newProductName;
    const newItemId = 'c_' + Math.random().toString(36).substr(2, 9);
    const newOption: MealOption = { id: newItemId, name: displayName, kcal: kcalValue, isCustom: true, isDrink: newProductIsDrink };
    setState(prev => {
      const customOptions = { ...prev.customOptions };
      const momentsToUpdate: MealMoment[] = [];
      if (newProductCats.includes('Ontbijt')) momentsToUpdate.push('Ontbijt');
      if (newProductCats.includes('Lunch')) momentsToUpdate.push('Lunch');
      if (newProductCats.includes('Diner')) momentsToUpdate.push('Diner');
      if (newProductCats.includes('Snacks')) momentsToUpdate.push('Ochtend snack', 'Middag snack', 'Avondsnack');
      momentsToUpdate.forEach(m => {
        const momentOpts = customOptions[m] || [];
        customOptions[m] = [newOption, ...momentOpts];
      });
      return { ...prev, customOptions };
    });
    setNewProductName(''); setNewProductGram(''); setNewProductKcal(''); setNewProductCats([]); setNewProductIsDrink(false);
    setToast({msg: "Product opgeslagen"});
  };

  if (!isLoaded) return <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center font-black text-sky-500 uppercase tracking-widest text-lg">...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 bg-white flex flex-col shadow-2xl relative overflow-hidden">
      {toast && <Toast message={toast.msg} type={toast.type} onHide={() => setToast(null)} />}
      
      <header className="bg-white border-b sticky top-0 z-30 p-3 shadow-sm">
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex flex-col">
             <h1 className="text-xl font-black text-sky-500 leading-none tracking-tight">{t.title}</h1>
             <h2 className="text-[10px] font-black text-slate-400 tracking-[0.2em]">{t.subtitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInfo(true)} className="p-1.5 text-sky-400 hover:bg-sky-50 rounded-xl transition-all"><Info size={20} /></button>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-2xl flex items-center gap-1.5 shadow-sm">
              <TrendingDown size={14} className="text-sky-400" />
              <span className="text-sm font-black text-sky-600">{latestWeight.toFixed(1)} <span className="text-[10px] opacity-60">KG</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between bg-slate-50 rounded-[18px] p-1.5 border border-slate-200 shadow-sm mx-1">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"><ChevronLeft size={20} className="text-slate-400"/></button>
          <div className="flex items-center gap-3">
             <span className="text-3xl font-black text-sky-500 tabular-nums leading-none tracking-tighter">{dateParts.day}</span>
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-sky-300 uppercase tracking-widest leading-none">{dateParts.weekday}</span>
               <span className="text-xs font-black text-slate-600 uppercase tracking-widest leading-none mt-1">{dateParts.month}</span>
             </div>
          </div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"><ChevronRight size={20} className="text-slate-400"/></button>
        </div>
      </header>

      <main className="p-3 flex-grow space-y-3">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#e0f2fe] rounded-[24px] p-5 text-slate-800 relative overflow-hidden border border-sky-100">
               <Target size={60} className="absolute -right-2 -top-2 text-sky-200/30" />
               <p className="text-sky-500 text-[10px] font-black uppercase tracking-widest mb-1">{t.targetReached}</p>
               <h2 className="text-xl font-black mb-4 text-slate-800">{totals.targetDate || '...'}</h2>
               <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white/50 backdrop-blur-md rounded-2xl p-3 border border-white/60">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" dangerouslySetInnerHTML={{ __html: t.oldIntake }} />
                   <p className="text-sm font-black text-slate-700">{Math.round(totals.baselineTdee)} <span className="text-xs font-normal">kcal</span></p>
                 </div>
                 <div className="bg-white/50 backdrop-blur-md rounded-2xl p-3 border border-white/60">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" dangerouslySetInnerHTML={{ __html: t.newIntake }} />
                   <p className="text-sm font-black text-slate-700">{DAILY_KCAL_INTAKE_GOAL} <span className="text-xs font-normal">kcal</span></p>
                 </div>
               </div>
            </div>

            <div className="bg-slate-50 rounded-[24px] pt-4 px-5 pb-3 border border-slate-200 shadow-sm overflow-visible">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-400 fill-amber-400" />
                    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">{t.dailyBudget}</h3>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${totals.actualIntake > totals.currentAdjustedGoal ? 'text-red-600 bg-red-50' : 'text-slate-400 bg-white shadow-xs border border-slate-100'}`}>
                    {totals.actualIntake > totals.currentAdjustedGoal ? '!' : `${Math.round(totals.currentAdjustedGoal - totals.actualIntake)} kcal`}
                  </span>
               </div>
               
               <div className="relative pt-0.5 pb-0.5">
                 <div className="flex justify-between items-center mb-1 px-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{t.dailyBudget}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-black text-slate-600">1800</span>
                        {totals.activityBurn > 0 && <span className="text-sm font-black text-emerald-500">+ {Math.round(totals.activityBurn)}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{t.tabs.meals}</span>
                      <span className={`text-sm font-black ${totals.actualIntake > totals.currentAdjustedGoal ? 'text-red-500' : 'text-slate-600'}`}>
                        {Math.round(totals.actualIntake)} <span className="text-[9px] font-normal opacity-50">kcal</span>
                      </span>
                    </div>
                 </div>
                 <div className="h-3.5 w-full bg-white rounded-full overflow-hidden shadow-inner border border-slate-200 relative mb-2">
                    <div className={`h-full transition-all duration-1000 shadow-md ${totals.calorieStatusColor}`} style={{ width: `${Math.min(totals.intakePercent, 100)}%` }} />
                 </div>
                 <div className="flex justify-center">
                   <div className="flex items-center gap-2 whitespace-nowrap bg-white px-3 py-0.5 rounded-xl border border-slate-200 shadow-sm">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">STATUS</span>
                     <span className={`text-sm font-black ${totals.actualIntake > totals.currentAdjustedGoal ? 'text-red-600' : 'text-black'}`}>{Math.round(totals.intakePercent)}%</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="bg-slate-50 rounded-[24px] pt-4 px-5 pb-3 border border-slate-200 shadow-sm overflow-visible">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">{t.myJourney}</h3>
                  <span className="text-[10px] font-black text-green-600 bg-white px-2 py-0.5 rounded-lg border border-green-100">-{ (Number(state.profile.startWeight) - Number(latestWeight)).toFixed(1) } KG</span>
               </div>
               <div className="relative pt-0.5 pb-0.5">
                 <div className="flex justify-between items-center mb-1 px-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{t.startWeight}</span>
                      <span className="text-sm font-black text-slate-600">{state.profile.startWeight} KG</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest leading-none">{t.goalWeight}</span>
                      <span className="text-sm font-black text-sky-500">{state.profile.targetWeight} KG</span>
                    </div>
                 </div>
                 <div className="h-3.5 w-full bg-white rounded-full overflow-hidden shadow-inner border border-slate-200 relative mb-2">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-md" style={{ width: `${Math.min(Math.max(totals.weightProgressPercent, 0), 100)}%` }} />
                 </div>
                 <div className="flex justify-center">
                   <div className="flex items-center gap-2 whitespace-nowrap bg-white px-3 py-0.5 rounded-xl border border-slate-200 shadow-sm">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.nowWeight}</span>
                     <span className="text-sm font-black text-black">{latestWeight.toFixed(1)} KG</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-4 flex items-center gap-1.5"><Scale size={15} className="text-sky-400" /> {t.weighMoment}</h3>
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-inner">
                <input type="number" step="0.1" placeholder={t.placeholders.weight} value={currentLog.weight || ''} onChange={(e) => setDailyWeight(e.target.value ? Number(e.target.value) : undefined)} className="w-full bg-transparent border-none p-0 text-2xl font-black text-sky-500 focus:ring-0" />
                <span className="text-sm font-black text-slate-400 uppercase">kg</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-4 pb-12 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1">
              <div><h2 className="text-xl font-black text-slate-800 tracking-tight">{t.mealSchedule}</h2><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.todayPlanning}</span></div>
              <button onClick={() => setShowMyList(true)} className="flex items-center gap-1.5 bg-slate-50 text-sky-500 border border-slate-200 shadow-sm px-3 py-1.5 rounded-xl font-black text-xs uppercase"><ListFilter size={16} /> {t.myList}</button>
            </div>
            {mealGroups.map((group) => (
              <div key={group.label} className="bg-slate-100/40 rounded-[24px] p-4 border border-slate-200/50 space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="p-1 bg-white rounded-lg shadow-sm border border-slate-100"><group.icon size={12} className="text-sky-400" /></div>
                  <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{group.label}</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {group.moments.map(moment => {
                    const items = currentLog.meals[moment] || [];
                    const availableOptions = state.customOptions[moment] || [];
                    const currentInput = mealInputs[moment] || { mealId: '', qty: 1 };
                    const selectedOption = availableOptions.find(o => o.id === currentInput.mealId);
                    const { title, unitInfo } = selectedOption ? splitProductName(getTranslatedName(selectedOption.id, selectedOption.name)) : { title: t.placeholders.select, unitInfo: null };

                    return (
                      <div key={moment} className="bg-sky-50 rounded-[20px] p-3 shadow-sm border border-sky-100">
                        <h4 className="font-black text-[9px] text-sky-400 uppercase mb-2.5 tracking-widest">{t.moments[moment]}</h4>
                        <div className="flex gap-1.5 mb-2.5 items-center flex-nowrap relative">
                          <div className="flex-grow min-w-0 relative" ref={openPickerMoment === moment ? pickerRef : null}>
                            <button onClick={() => { setOpenPickerMoment(openPickerMoment === moment ? null : moment); setSearchTerm(''); }} className="w-full bg-white border border-sky-100 rounded-xl p-2 text-[13px] font-bold shadow-sm flex items-center justify-between min-w-0">
                              <span className="truncate">{title}</span>
                              <ChevronDown size={14} className={`text-sky-300 transition-transform ${openPickerMoment === moment ? 'rotate-180' : ''}`} />
                            </button>
                            {openPickerMoment === moment && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[320px] animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                  <Search size={14} className="text-slate-400" />
                                  <input autoFocus className="bg-transparent border-none text-[13px] w-full focus:ring-0 font-bold" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="overflow-y-auto py-2">
                                  {['Eten', 'Drinken'].map(type => {
                                    const isDrinkSection = type === 'Drinken';
                                    const sectionItems = availableOptions.filter(o => !!o.isDrink === isDrinkSection && getTranslatedName(o.id, o.name).toLowerCase().includes(searchTerm.toLowerCase()));
                                    if (sectionItems.length === 0) return null;
                                    return (
                                      <div key={type} className="mb-2">
                                        <div className="px-3 py-1 flex items-center gap-1.5">
                                          {isDrinkSection ? <GlassWater size={10} className="text-sky-400" /> : <Utensils size={10} className="text-slate-400" />}
                                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{isDrinkSection ? t.drink : t.food}</span>
                                        </div>
                                        {sectionItems.map(opt => {
                                          const nameData = splitProductName(getTranslatedName(opt.id, opt.name));
                                          return (
                                            <button key={opt.id} onClick={() => { setMealInputs({ ...mealInputs, [moment]: { ...currentInput, mealId: opt.id } }); setOpenPickerMoment(null); }} className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-sky-50 transition-colors ${currentInput.mealId === opt.id ? 'bg-sky-50' : ''}`}>
                                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                                <div className={`p-1 rounded-lg border shrink-0 ${opt.isDrink ? 'bg-sky-100/50 border-sky-200 text-sky-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                                  {opt.isDrink ? <GlassWater size={12} /> : <Utensils size={12} />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                  <span className="text-[13px] font-black text-slate-800 leading-tight truncate">{nameData.title}</span>
                                                  <span className="text-[9px] font-bold text-slate-400 uppercase">{nameData.unitInfo && `${nameData.unitInfo} • `}{opt.kcal} kcal</span>
                                                </div>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          <input type="number" min="0" step="0.1" className="w-12 flex-shrink-0 bg-white border border-sky-100 rounded-xl p-2 text-[13px] font-black text-center shadow-sm" value={currentInput.qty} onChange={(e) => setMealInputs({ ...mealInputs, [moment]: { ...currentInput, qty: Math.max(0, Number(e.target.value)) } })} />
                          <button className="flex-shrink-0 bg-sky-400 text-white p-2 rounded-xl shadow-md disabled:opacity-40" disabled={!currentInput.mealId} onClick={() => {
                              const opt = availableOptions.find(o => o.id === currentInput.mealId);
                              if (opt) {
                                addMealItem(moment, { name: opt.name, kcal: opt.kcal * currentInput.qty, quantity: currentInput.qty, mealId: opt.id, isDrink: opt.isDrink });
                                setMealInputs({ ...mealInputs, [moment]: { mealId: '', qty: 1 } });
                              }
                            }}><Plus size={18} strokeWidth={3} /></button>
                        </div>
                        <div className="space-y-1.5">
                          {items.map(item => {
                            const nameData = splitProductName(getTranslatedName(item.mealId || '', item.name));
                            return (
                              <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-xl border border-sky-100 shadow-sm animate-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <div className={`p-1 rounded-lg border shrink-0 ${item.isDrink ? 'bg-sky-50 border-sky-100 text-sky-400' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{item.isDrink ? <GlassWater size={12} /> : <Utensils size={12} />}</div>
                                  <div className="flex flex-col min-w-0">
                                    <p className="text-[13px] font-black text-slate-800 leading-tight truncate">{nameData.title}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{nameData.unitInfo && `${nameData.unitInfo} • `}{item.quantity}x • {item.kcal} kcal</p>
                                  </div>
                                </div>
                                <button onClick={() => removeMealItem(moment, item.id)} className="text-slate-300 hover:text-red-500 p-1 transition-colors shrink-0"><Trash2 size={14} /></button>
                              </div>
                            );
                          })}
                          {items.length === 0 && <p className="text-[9px] text-slate-300 font-bold uppercase text-center py-1.5">{t.nothingPlanned}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
           <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex justify-between items-center px-1">
                <div><h2 className="text-xl font-black text-slate-800 tracking-tight">{t.movement}</h2><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.planActivities}</span></div>
                <button onClick={() => setShowMyActivityList(true)} className="flex items-center gap-1.5 bg-slate-50 text-sky-500 border border-slate-200 shadow-sm px-3 py-1.5 rounded-xl font-black text-xs uppercase"><ListFilter size={16} /> {t.myList}</button>
             </div>
             <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-5 text-slate-800 shadow-sm">
                <select className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-bold mb-3 shadow-sm" value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)}>
                   {state.customActivities.map(act => <option key={act.id} value={act.id}>{getTranslatedName(act.id, act.name)}</option>)}
                </select>
                <div className="flex gap-2">
                   <input type="number" id="act-val" placeholder={t.amount} className="flex-grow bg-white border border-slate-100 rounded-xl p-3 text-sm font-black shadow-sm" />
                   <button onClick={() => {
                     const val = Number((document.getElementById('act-val') as HTMLInputElement).value);
                     if (val > 0) addActivity(selectedActivityId, val);
                   }} className="bg-sky-400 text-white px-5 rounded-xl font-black shadow-md"><Plus size={20} strokeWidth={3}/></button>
                </div>
             </div>
             <div className="space-y-2">
               {currentLog.activities.map(a => (
                 <div key={a.id} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 shadow-sm flex justify-between items-center">
                   <div><p className="font-black text-slate-800 text-base">{getTranslatedName(a.typeId, state.customActivities.find(x => x.id === a.typeId)?.name || '')}</p><p className="text-xs font-bold text-slate-400 uppercase">{a.value} {state.customActivities.find(x => x.id === a.typeId)?.unit} • <span className="text-green-600">+{a.burnedKcal} kcal</span></p></div>
                   <button onClick={() => removeActivity(a.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={18}/></button>
                 </div>
               ))}
               {currentLog.activities.length === 0 && <p className="text-xs text-slate-300 font-bold uppercase text-center py-8">{t.nothingPlanned}</p>}
             </div>
           </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <h2 className="text-xl font-black text-slate-800 px-1 tracking-tight">{t.settings}</h2>
             <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-200 shadow-sm space-y-2">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5"><Globe size={14} className="text-sky-400" /> {t.language}</h3>
               <div className="grid grid-cols-5 gap-2" dir="ltr">
                 {(Object.keys(flagEmojis) as Language[]).map(lang => (
                   <button key={lang} onClick={() => setState(prev => ({ ...prev, language: lang }))} className={`text-xl p-1.5 rounded-xl transition-all border-2 ${state.language === lang ? 'border-sky-400 bg-white shadow-sm' : 'border-transparent hover:bg-white/50'}`}>{flagEmojis[lang]}</button>
                 ))}
               </div>
             </div>
             <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{t.age}</label><input type="number" value={state.profile.age} onChange={e => setState({...state, profile: {...state.profile, age: Number(e.target.value)}})} className="w-full bg-white p-3 rounded-xl font-black border border-slate-100 text-sm shadow-sm" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{t.height}</label><input type="number" value={state.profile.height} onChange={e => setState({...state, profile: {...state.profile, height: Number(e.target.value)}})} className="w-full bg-white p-3 rounded-xl font-black border border-slate-100 text-sm shadow-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{t.startWeight}</label><input type="number" value={state.profile.startWeight} onChange={e => setState({...state, profile: {...state.profile, startWeight: Number(e.target.value)}})} className="w-full bg-white p-3 rounded-xl font-black border border-slate-100 text-sm shadow-sm" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{t.targetWeight}</label><input type="number" value={state.profile.targetWeight} onChange={e => setState({...state, profile: {...state.profile, targetWeight: Number(e.target.value)}})} className="w-full bg-sky-50 p-3 rounded-xl font-black text-sky-500 border border-sky-100 text-sm shadow-sm" /></div>
                </div>
             </div>
             <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-200 shadow-sm space-y-4">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Database size={16} className="text-sky-400" /> {t.dataManagement.title}</h3>
               <div className="grid grid-cols-1 gap-2">
                 <button onClick={exportData} className="w-full flex items-center justify-between px-4 py-3 bg-white text-sky-600 border border-sky-100 rounded-xl hover:bg-sky-50 transition-all shadow-sm">
                   <div className="flex items-center gap-2"><Download size={16} /><span className="text-xs font-black uppercase tracking-widest">{t.dataManagement.export}</span></div>
                   <ChevronRight size={14} />
                 </button>
                 
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleCloudExport('Google Drive')} className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-600 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                      <Cloud size={16} className="text-sky-400" /><span className="text-[9px] font-black uppercase tracking-widest">{t.dataManagement.googleDrive}</span>
                    </button>
                    <button onClick={() => handleCloudExport('Dropbox')} className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-600 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                      <Cloud size={16} className="text-blue-500" /><span className="text-[9px] font-black uppercase tracking-widest">{t.dataManagement.dropbox}</span>
                    </button>
                 </div>

                 <label className="w-full flex items-center justify-between px-4 py-3 bg-white text-emerald-600 border border-emerald-100 rounded-xl cursor-pointer hover:bg-emerald-50 transition-all shadow-sm">
                   <div className="flex items-center gap-2"><Upload size={16} /><span className="text-xs font-black uppercase tracking-widest">{t.dataManagement.restore}</span></div>
                   <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                 </label>
                 
                 <button onClick={resetAllData} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all shadow-sm">
                   <Trash2 size={16} /><span className="text-xs font-black uppercase tracking-widest">{t.dataManagement.clearAll}</span>
                 </button>
               </div>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-6 py-4 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[28px] shadow-2xl">
        {[{ id: 'dashboard', icon: LayoutDashboard, label: t.tabs.dashboard }, { id: 'meals', icon: Utensils, label: t.tabs.meals }, { id: 'activity', icon: Activity, label: t.tabs.activity }, { id: 'profile', icon: UserIcon, label: t.tabs.profile }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-sky-500 scale-110' : 'text-slate-300'}`}>
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 3 : 2} /><span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>

      {showMyList && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-5" onClick={() => { setShowMyList(false); setSearchTerm(''); }}>
           <div className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-slate-800 uppercase">{t.products}</h3>
                <button onClick={() => { setShowMyList(false); setSearchTerm(''); }} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
              </div>
              <div className="relative mb-6">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none transition-all" />
              </div>
              <form onSubmit={addCustomOptionCentral} className="space-y-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.add}</h4>
                  <input type="text" placeholder={t.productName} value={newProductName} onChange={e => setNewProductName(e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-bold shadow-sm" required />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder={t.placeholders.gram} value={newProductGram} onChange={e => setNewProductGram(e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-bold shadow-sm" />
                    <input type="number" placeholder={t.kcal} value={newProductKcal} onChange={e => setNewProductKcal(e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-black shadow-sm" required />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">{t.isDrinkQuestion}</span>
                    <button type="button" onClick={() => setNewProductIsDrink(!newProductIsDrink)} className={`w-12 h-6 rounded-full transition-all relative ${newProductIsDrink ? 'bg-sky-400' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newProductIsDrink ? 'left-7' : 'left-1'}`} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Ontbijt','Lunch','Diner','Snacks'].map(cat => <button key={cat} type="button" onClick={() => setNewProductCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} className={`px-2 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${newProductCats.includes(cat) ? 'bg-sky-400 text-white shadow-md' : 'bg-white text-sky-300 border border-sky-100 shadow-sm'}`}>{cat}</button>)}
                  </div>
                  <button type="submit" className="w-full bg-sky-400 text-white py-3 rounded-xl font-black uppercase text-xs shadow-md tracking-widest mt-2">{t.saveInList}</button>
              </form>
              <div className="space-y-8">
                {MEAL_MOMENTS.map(moment => {
                  const options = state.customOptions[moment] || [];
                  const filteredOptions = options.filter(o => getTranslatedName(o.id, o.name).toLowerCase().includes(searchTerm.toLowerCase()));
                  if (filteredOptions.length === 0) return null;
                  return (
                    <div key={moment} className="space-y-5">
                      <h4 className="text-[13px] font-black text-sky-600 uppercase tracking-widest border-b-2 border-sky-100 pb-1 flex items-center gap-2">{moment}</h4>
                      <div className="space-y-2">
                        {filteredOptions.map(opt => {
                          const { title, unitInfo } = splitProductName(getTranslatedName(opt.id, opt.name));
                          return (
                            <div key={`${moment}-${opt.id}`} className="p-2.5 bg-slate-50/50 rounded-2xl flex justify-between items-center border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                                <div className={`p-1.5 bg-white rounded-xl border border-slate-100 shrink-0 ${opt.isDrink ? 'text-sky-400' : 'text-slate-400'}`}>{opt.isDrink ? <GlassWater size={12} /> : <Utensils size={12} />}</div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[13px] font-black text-slate-800 leading-tight truncate">{title}</span>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold">{unitInfo && `${unitInfo} • `}{opt.kcal} kcal</span>
                                </div>
                              </div>
                              <button onClick={() => removeProductFromMomentInLibrary(moment, opt.id)} className="flex-shrink-0 p-1.5 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => { setShowMyList(false); setSearchTerm(''); }} className="w-full mt-10 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-transform">{t.close}</button>
           </div>
        </div>
      )}
    </div>
  );
}
