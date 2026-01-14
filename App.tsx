
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
  Globe,
  Coffee,
  Sun,
  Moon,
  Zap,
  Download,
  Upload,
  Check,
  AlertCircle,
  GlassWater,
  Search,
  ChevronDown,
  X,
  Calendar,
  Footprints,
  Baby,
  Turtle,
  Flame
} from 'lucide-react';
import { 
  UserProfile, 
  AppState, 
  MealMoment, 
  LoggedMealItem,
  MealOption,
  ActivityType,
  Language,
  WeightLossSpeed
} from './types';
import { 
  MEAL_OPTIONS, 
  ACTIVITY_TYPES, 
  PRODUCT_TRANSLATIONS,
  MEAL_MOMENTS
} from './constants';
import { 
  calculateTDEE,
  calculateActivityBurn, 
  calculateTargetDate,
  calculateBMI
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
  profile: { age: 44, height: 170, startWeight: 86, currentWeight: 86, targetWeight: 78, dailyBudget: 1800, weightLossSpeed: 'average' },
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
  const [showMyList, setShowMyList] = useState(false);
  const [showMyActivityList, setShowMyActivityList] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(ACTIVITY_TYPES[0].id);
  const [toast, setToast] = useState<{msg: string, type?: 'success' | 'error' | 'info'} | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [openPickerMoment, setOpenPickerMoment] = useState<MealMoment | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [mealInputs, setMealInputs] = useState<Record<string, { mealId: string; qty: number }>>({});

  const [newMeal, setNewMeal] = useState({ name: '', kcal: '', isDrink: false, moment: 'Ontbijt' as MealMoment });
  const [newActivity, setNewActivity] = useState({ name: '', kcalPerHour: '' });

  const t = useMemo(() => {
    const lang = state.language || 'nl';
    const base = translations['nl'];
    const selected = translations[lang] || {};
    return { ...base, ...selected };
  }, [state.language]);

  useEffect(() => {
    idb.get().then(saved => {
      if (saved) {
        setState({
          ...saved,
          profile: { ...INITIAL_STATE.profile, ...saved.profile },
          customActivities: (saved.customActivities && saved.customActivities.length > 0) ? saved.customActivities : ACTIVITY_TYPES
        });
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) idb.set(state);
  }, [state, isLoaded]);

  const currentLog = useMemo(() => state.dailyLogs[selectedDate] || { date: selectedDate, meals: {}, activities: [] }, [state.dailyLogs, selectedDate]);
  
  const latestWeight = useMemo((): number => {
    const manualLogWeight = state.dailyLogs[selectedDate]?.weight;
    if (typeof manualLogWeight === 'number' && manualLogWeight > 0) return manualLogWeight;
    
    const sortedDates = Object.keys(state.dailyLogs).filter(d => d <= selectedDate).sort((a,b) => b.localeCompare(a));
    for (const d of sortedDates) {
      if (state.dailyLogs[d]?.weight) return state.dailyLogs[d].weight as number;
    }
    
    return Number(state.profile.currentWeight) || 86;
  }, [state.dailyLogs, state.profile.currentWeight, selectedDate]);

  const bmi = useMemo(() => calculateBMI(latestWeight, state.profile.height), [latestWeight, state.profile.height]);

  const bmiColor = useMemo(() => {
    if (bmi < 18.5) return 'text-sky-400';
    if (bmi < 25) return 'text-green-500';
    if (bmi < 30) return 'text-amber-500';
    return 'text-red-500';
  }, [bmi]);

  const totals = useMemo(() => {
    const activityBurn = Number(currentLog.activities.reduce((sum: number, a) => sum + (Number(a.burnedKcal) || 0), 0));
    const startW = Number(state.profile.startWeight) || 0;
    const targetW = Number(state.profile.targetWeight) || 0;
    const currentW = Number(latestWeight);
    
    const effectiveProfile: UserProfile = { ...state.profile, currentWeight: currentW };
    const intakeGoal = Number(state.profile.dailyBudget) || 1800;
    const autoTargetDate = calculateTargetDate(effectiveProfile, intakeGoal);
    
    const weightJourneyTotal = Math.max(startW - targetW, 0.1);
    const weightLostSoFar = startW - currentW;
    const weightProgressPercent = (weightLostSoFar / weightJourneyTotal) * 100;
    
    const currentAdjustedGoal = Number(intakeGoal + activityBurn);
    const actualIntake = Number(Object.values(currentLog.meals).reduce((acc: number, items: any) => {
      const mealItems = items as LoggedMealItem[];
      return acc + Number(mealItems.reduce((sum: number, m: LoggedMealItem) => sum + (Number(m.kcal) || 0), 0));
    }, 0));
    
    const intakePercent = currentAdjustedGoal > 0 ? (actualIntake / currentAdjustedGoal) * 100 : 0;
    let calorieStatusColor = 'bg-green-500';
    if (actualIntake > currentAdjustedGoal) calorieStatusColor = 'bg-red-500';
    else if (intakePercent > 85) calorieStatusColor = 'bg-amber-500';

    return { 
      activityBurn, 
      actualIntake, 
      targetDate: state.profile.customTargetDate || autoTargetDate, 
      weightProgressPercent, 
      currentAdjustedGoal,
      intakeGoal,
      intakePercent,
      calorieStatusColor,
      baselineTdee: calculateTDEE(effectiveProfile, 0)
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

  const getTranslatedName = (id: string, originalName: string) => {
    return PRODUCT_TRANSLATIONS[state.language]?.[id] || PRODUCT_TRANSLATIONS['en']?.[id] || originalName;
  };

  /**
   * Refined splitting logic for 2nd line display.
   * Splits (Description, Unit) into Line 1: Name (Description) and Line 2: Unit
   */
  const splitProductName = (fullName: string) => {
    const match = fullName.match(/^(.*?)\s*\((.*)\)$/);
    if (match) {
      const namePart = match[1];
      const bracketContent = match[2];
      
      // If bracket content has a comma, like "Regular, 250 ml"
      if (bracketContent.includes(',')) {
        const parts = bracketContent.split(',');
        const unitPart = parts[parts.length - 1].trim(); // Take the last part as unit
        const descPart = parts.slice(0, parts.length - 1).join(',').trim(); // Take everything else as desc
        return { info: `${namePart} (${descPart})`, unit: unitPart };
      }
      
      // If it's just unit like "(250 ml)"
      const unitKeywords = ['ml', 'gr', 'g', 'st', 'pk', 'gram', 'mililiter'];
      const isLikelyUnit = unitKeywords.some(k => bracketContent.toLowerCase().includes(k));
      
      if (isLikelyUnit) {
        return { info: namePart, unit: bracketContent };
      } else {
        return { info: fullName, unit: '' };
      }
    }
    return { info: fullName, unit: '' };
  };

  const setLossSpeed = (speed: WeightLossSpeed) => {
    const tdee = calculateTDEE({ ...state.profile, currentWeight: latestWeight }, 0);
    let deficit = 500;
    if (speed === 'slow') deficit = 250;
    if (speed === 'fast') deficit = 750;

    const newBudget = Math.round(tdee - deficit);
    setState(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        weightLossSpeed: speed,
        dailyBudget: newBudget,
        customTargetDate: undefined 
      }
    }));
    setToast({ msg: `Planning bijgewerkt naar: ${speed === 'slow' ? t.speedSlow : speed === 'average' ? t.speedAverage : t.speedFast}`, type: 'info' });
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

  const addActivity = (typeId: string, value: number) => {
    const burn = calculateActivityBurn({ typeId, value }, latestWeight);
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] };
      logs[selectedDate] = { ...log, activities: [...log.activities, { id: Math.random().toString(36).substr(2, 9), typeId, value, burnedKcal: burn }] };
      return { ...prev, dailyLogs: logs };
    });
    const input = document.getElementById('act-val') as HTMLInputElement;
    if (input) input.value = '';
  };

  const formatTargetDateDisplay = (isoDate: string) => {
    if (!isoDate) return "...";
    const date = new Date(isoDate);
    return date.toLocaleDateString(state.language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `doelgewicht_backup_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
    setToast({msg: "Download gestart"});
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
          setToast({msg: 'Gegevens hersteld!'});
        }
      } catch (err) {
        setToast({msg: "Herstel mislukt", type: 'error'});
      }
    };
    reader.readAsText(file);
  };

  const resetAllData = async () => {
    if (confirm(t.dataManagement.clearConfirm)) {
      await idb.clear();
      setState(INITIAL_STATE);
      setActiveTab('dashboard');
      setToast({msg: 'Alles gewist'});
    }
  };

  const saveCustomMeal = () => {
    if (!newMeal.name || !newMeal.kcal) return;
    const item: MealOption = {
      id: 'custom_' + Math.random().toString(36).substr(2, 9),
      name: newMeal.name,
      kcal: Number(newMeal.kcal),
      isCustom: true,
      isDrink: newMeal.isDrink
    };
    setState(prev => {
      const customOptions = { ...prev.customOptions };
      customOptions[newMeal.moment] = [...(customOptions[newMeal.moment] || []), item];
      return { ...prev, customOptions };
    });
    setNewMeal({ ...newMeal, name: '', kcal: '' });
    setToast({ msg: 'Product opgeslagen' });
  };

  const saveCustomActivity = () => {
    if (!newActivity.name || !newActivity.kcalPerHour) return;
    const met = Number(newActivity.kcalPerHour) / 70;
    const item: ActivityType = {
      id: 'custom_act_' + Math.random().toString(36).substr(2, 9),
      name: newActivity.name,
      met: met,
      unit: 'minuten',
      isCustom: true
    };
    setState(prev => ({ ...prev, customActivities: [...prev.customActivities, item] }));
    setNewActivity({ name: '', kcalPerHour: '' });
    setToast({ msg: 'Activiteit opgeslagen' });
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
              <div className="flex flex-col">
                <span className="text-sm font-black text-sky-600 leading-tight">{latestWeight.toFixed(1)} <span className="text-[10px] opacity-60 font-bold">KG</span></span>
                <span className={`text-[9px] font-black uppercase ${bmiColor} leading-none tracking-tighter`}>BMI: {bmi}</span>
              </div>
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
            <div className="bg-[#e0f2fe] rounded-[24px] p-5 text-slate-800 relative overflow-hidden border border-sky-100 shadow-sm">
               <Target size={60} className="absolute -right-2 -top-2 text-sky-200/30" />
               <p className="text-sky-500 text-[10px] font-black uppercase tracking-widest mb-1">{t.targetReached}</p>
               <h2 className="text-xl font-black mb-4 text-slate-800">{formatTargetDateDisplay(totals.targetDate)}</h2>
               <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white/50 backdrop-blur-md rounded-2xl p-3 border border-white/60">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" dangerouslySetInnerHTML={{ __html: t.oldIntake }} />
                   <p className="text-sm font-black text-slate-700">{Math.round(totals.baselineTdee)} <span className="text-xs font-normal">kcal</span></p>
                 </div>
                 <div className="bg-white/50 backdrop-blur-md rounded-2xl p-3 border border-white/60">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" dangerouslySetInnerHTML={{ __html: t.newIntake }} />
                   <p className="text-sm font-black text-slate-700">{state.profile.dailyBudget} <span className="text-xs font-normal">kcal</span></p>
                 </div>
               </div>
            </div>

            <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm">
               <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400 fill-amber-400" />
                      <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">{t.dailyBudget}</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-sm font-bold text-slate-400">{totals.intakeGoal}</span>
                       <span className="text-[10px] font-black text-emerald-500">+{totals.activityBurn}</span>
                       <span className="text-slate-200 mx-1">=</span>
                       <span className="text-xl font-black text-slate-800">{totals.currentAdjustedGoal}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Verbruikt</span>
                    <span className={`text-xl font-black ${totals.actualIntake > totals.currentAdjustedGoal ? 'text-red-500' : 'text-sky-500'}`}>
                      {totals.actualIntake} <span className="text-[10px] opacity-40 uppercase">Kcal</span>
                    </span>
                  </div>
               </div>
               
               <div className="relative pt-0.5 pb-0.5">
                 <div className="h-4 w-full bg-white rounded-full overflow-hidden shadow-inner border border-slate-200 relative mb-3">
                    <div className={`h-full transition-all duration-1000 shadow-md ${totals.calorieStatusColor}`} style={{ width: `${Math.min(totals.intakePercent, 100)}%` }} />
                 </div>
                 <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Budget Over</span>
                      <span className={`text-sm font-black ${totals.actualIntake > totals.currentAdjustedGoal ? 'text-red-600' : 'text-slate-800'}`}>
                        {Math.max(0, totals.currentAdjustedGoal - totals.actualIntake)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${totals.intakePercent > 100 ? 'bg-red-50 text-red-500' : 'bg-sky-50 text-sky-500'}`}>
                         {Math.round(totals.intakePercent)}%
                       </span>
                    </div>
                 </div>
               </div>
            </div>

            <div className="bg-slate-50 rounded-[24px] pt-4 px-5 pb-3 border border-slate-200 shadow-sm overflow-visible">
               <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">{t.myJourney}</h3>
                  <span className="text-[10px] font-black text-green-600 bg-white px-2 py-0.5 rounded-lg border border-green-100">-{ Math.max(0, (Number(state.profile.startWeight) - latestWeight)).toFixed(1) } KG</span>
               </div>
               <div className="relative pt-0.5 pb-0.5 px-1">
                 <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{t.startWeight}</span>
                      <span className="text-sm font-black text-slate-600">{state.profile.startWeight} KG</span>
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest leading-none">{t.nowWeight}</span>
                       <span className="text-sm font-black text-black">{latestWeight.toFixed(1)} KG</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest leading-none">{t.goalWeight}</span>
                      <span className="text-sm font-black text-sky-500">{state.profile.targetWeight} KG</span>
                    </div>
                 </div>
                 <div className="h-3.5 w-full bg-white rounded-full overflow-hidden shadow-inner border border-slate-200 relative mb-2">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-md" style={{ width: `${Math.min(Math.max(totals.weightProgressPercent, 0), 100)}%` }} />
                 </div>
               </div>
            </div>

            <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-4 flex items-center gap-1.5"><Scale size={15} className="text-sky-400" /> {t.weighMoment}</h3>
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-inner">
                <input type="number" step="0.1" placeholder={t.placeholders.weight} value={state.dailyLogs[selectedDate]?.weight || ''} onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setState(prev => {
                    const logs = { ...prev.dailyLogs };
                    logs[selectedDate] = { ...(logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] }), weight: val };
                    return { ...prev, dailyLogs: logs };
                  });
                }} className="w-full bg-transparent border-none p-0 text-2xl font-black text-sky-500 focus:ring-0" />
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
                    const title = selectedOption ? selectedOption.name : t.placeholders.select;

                    return (
                      <div key={moment} className="bg-sky-50 rounded-[20px] p-3 shadow-sm border border-sky-100">
                        <h4 className="font-black text-[9px] text-sky-400 uppercase mb-2.5 tracking-widest">{t.moments[moment]}</h4>
                        <div className="flex gap-1.5 mb-2.5 items-center flex-nowrap relative">
                          <div className="flex-grow min-w-0 relative">
                            <button onClick={() => { setOpenPickerMoment(openPickerMoment === moment ? null : moment); setSearchTerm(''); }} className="w-full bg-white border border-sky-100 rounded-xl p-2 text-[13px] font-bold shadow-sm flex items-center justify-between min-w-0">
                              <span className="truncate">{title}</span>
                              <ChevronDown size={14} className={`text-sky-300 transition-transform ${openPickerMoment === moment ? 'rotate-180' : ''}`} />
                            </button>
                            {openPickerMoment === moment && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[320px] animate-in fade-in duration-200">
                                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                  <Search size={14} className="text-slate-400" />
                                  <input autoFocus className="bg-transparent border-none text-[13px] w-full focus:ring-0 font-bold" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="overflow-y-auto py-2">
                                  {availableOptions.filter(o => getTranslatedName(o.id, o.name).toLowerCase().includes(searchTerm.toLowerCase())).map(opt => {
                                    const { info, unit } = splitProductName(getTranslatedName(opt.id, opt.name));
                                    return (
                                      <button key={opt.id} onClick={() => { setMealInputs({ ...mealInputs, [moment]: { ...currentInput, mealId: opt.id } }); setOpenPickerMoment(null); }} className="w-full text-left px-4 py-3 hover:bg-sky-50 transition-colors flex items-start gap-3 border-b border-slate-50">
                                        <div className="pt-1">{opt.isDrink ? <GlassWater size={14} className="text-sky-400" /> : <Utensils size={14} className="text-slate-400" />}</div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-[13px] font-black text-slate-800 truncate leading-tight mb-1">{info}</span>
                                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 leading-none uppercase tracking-widest">
                                            {unit && <span>{unit}</span>}
                                            {unit && <span className="opacity-30">•</span>}
                                            <span className="text-sky-500">{opt.kcal} kcal</span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          <input type="number" min="0" step="0.1" className="w-12 flex-shrink-0 bg-white border border-sky-100 rounded-xl p-2 text-[13px] font-black text-center shadow-sm" value={currentInput.qty} onChange={(e) => setMealInputs({ ...mealInputs, [moment]: { ...currentInput, qty: Math.max(0, Number(e.target.value)) } })} />
                          <button className="flex-shrink-0 bg-sky-400 text-white p-2 rounded-xl shadow-md" disabled={!currentInput.mealId} onClick={() => {
                              const opt = availableOptions.find(o => o.id === currentInput.mealId);
                              if (opt) addMealItem(moment, { name: opt.name, kcal: opt.kcal * currentInput.qty, quantity: currentInput.qty, mealId: opt.id, isDrink: opt.isDrink });
                              setMealInputs({ ...mealInputs, [moment]: { mealId: '', qty: 1 } });
                            }}><Plus size={18} strokeWidth={3} /></button>
                        </div>
                        <div className="space-y-1.5">
                          {items.map(item => {
                            const { info, unit } = splitProductName(getTranslatedName(item.mealId || '', item.name));
                            return (
                              <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-sky-100 shadow-sm animate-in fade-in duration-300">
                                <div className="flex flex-col flex-grow min-w-0 pr-2">
                                  <span className="text-[13px] font-black text-slate-800 truncate leading-tight mb-1">{info}</span>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 leading-none">
                                    {unit && <span>{unit}</span>}
                                    {unit && <span className="opacity-30">•</span>}
                                    <span className="text-sky-500 font-black">{item.kcal} KCAL</span>
                                  </div>
                                </div>
                                <button onClick={() => setState(prev => {
                                  const logs = { ...prev.dailyLogs };
                                  const meals = { ...logs[selectedDate].meals };
                                  meals[moment] = meals[moment].filter(m => m.id !== item.id);
                                  logs[selectedDate] = { ...logs[selectedDate], meals };
                                  return { ...prev, dailyLogs: logs };
                                })} className="flex-shrink-0 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                              </div>
                            );
                          })}
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
            
            <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.activity}</label>
                <select value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm focus:ring-2 focus:ring-sky-100 outline-none appearance-none">
                  {state.customActivities.map(act => (
                    <option key={act.id} value={act.id}>{getTranslatedName(act.id, act.name)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-grow space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.amount}</label>
                  <input id="act-val" type="number" placeholder="0" className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm focus:ring-2 focus:ring-sky-100 outline-none" />
                </div>
                <div className="flex items-end">
                  <button onClick={() => {
                    const val = (document.getElementById('act-val') as HTMLInputElement).value;
                    if (val) addActivity(selectedActivityId, Number(val));
                  }} className="bg-sky-500 text-white p-4 rounded-2xl shadow-lg shadow-sky-100 hover:bg-sky-600 transition-all"><Plus size={24} strokeWidth={3} /></button>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-1 pt-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.todayPlanning}</h3>
              {currentLog.activities.length === 0 ? (
                <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Activity size={32} strokeWidth={1.5} className="opacity-30" />
                  <span className="text-xs font-black uppercase tracking-widest">{t.nothingPlanned}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentLog.activities.map(act => (
                    <div key={act.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center animate-in slide-in-from-left-4 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500"><Zap size={18} fill="currentColor" /></div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-slate-800">{getTranslatedName(act.typeId, state.customActivities.find(t => t.id === act.typeId)?.name || '')}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{act.value} {state.customActivities.find(t => t.id === act.typeId)?.unit}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-emerald-500">+{Math.round(act.burnedKcal)} <span className="text-[9px] font-normal opacity-60">kcal</span></span>
                        <button onClick={() => setState(prev => {
                          const logs = { ...prev.dailyLogs };
                          logs[selectedDate] = { ...logs[selectedDate], activities: logs[selectedDate].activities.filter(a => a.id !== act.id) };
                          return { ...prev, dailyLogs: logs };
                        })} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <h2 className="text-xl font-black text-slate-800 px-1 tracking-tight">{t.settings}</h2>
             
             <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block leading-none">{t.age}</label>
                    <input type="number" value={state.profile.age} onChange={e => setState({...state, profile: {...state.profile, age: Number(e.target.value)}})} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm focus:ring-2 focus:ring-sky-100 outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block leading-none">{t.height}</label>
                    <input type="number" value={state.profile.height} onChange={e => setState({...state, profile: {...state.profile, height: Number(e.target.value)}})} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm focus:ring-2 focus:ring-sky-100 outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block leading-none truncate">{t.startWeight}</label>
                    <input type="number" value={state.profile.startWeight} onChange={e => setState({...state, profile: {...state.profile, startWeight: Number(e.target.value)}})} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm focus:ring-2 focus:ring-sky-100 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5 block">{t.targetWeight}</label>
                    <input type="number" value={state.profile.targetWeight} onChange={e => setState({...state, profile: {...state.profile, targetWeight: Number(e.target.value)}})} className="w-full bg-sky-50 p-3 rounded-2xl font-black text-sky-500 border border-sky-100 text-base shadow-sm focus:ring-2 focus:ring-sky-100 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5 block">{t.dailyBudgetLabel}</label>
                    <input type="number" value={state.profile.dailyBudget} onChange={e => setState({...state, profile: {...state.profile, dailyBudget: Number(e.target.value)}})} className="w-full bg-sky-50 p-3 rounded-2xl font-black text-sky-500 border border-sky-100 text-base shadow-sm focus:ring-2 focus:ring-sky-100 outline-none" />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">{t.speedSlow} / {t.speedAverage} / {t.speedFast}</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setLossSpeed('slow')} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${state.profile.weightLossSpeed === 'slow' ? 'bg-white border-sky-400 shadow-md' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                      <Turtle size={24} className={state.profile.weightLossSpeed === 'slow' ? 'text-sky-500' : ''} />
                      <span className="text-[9px] font-black uppercase">{t.speedSlow}</span>
                    </button>
                    <button onClick={() => setLossSpeed('average')} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${state.profile.weightLossSpeed === 'average' ? 'bg-white border-sky-400 shadow-md' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                      <Footprints size={24} className={state.profile.weightLossSpeed === 'average' ? 'text-sky-500' : ''} />
                      <span className="text-[9px] font-black uppercase">{t.speedAverage}</span>
                    </button>
                    <button onClick={() => setLossSpeed('fast')} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${state.profile.weightLossSpeed === 'fast' ? 'bg-white border-sky-400 shadow-md' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                      <Zap size={24} className={state.profile.weightLossSpeed === 'fast' ? 'text-amber-400 fill-amber-400' : ''} />
                      <span className="text-[9px] font-black uppercase">{t.speedFast}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1.5"><Calendar size={12} className="text-sky-400" /> {t.projectedDate}</label>
                  <div className="relative">
                    <div className="w-full bg-white p-4 pl-12 rounded-2xl font-black border border-slate-100 text-base shadow-sm flex justify-between items-center">
                      <span>{formatTargetDateDisplay(totals.targetDate)}</span>
                      <input 
                        type="date" 
                        value={state.profile.customTargetDate || totals.targetDate} 
                        onChange={e => setState({...state, profile: {...state.profile, customTargetDate: e.target.value}})}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Calendar size={18} className="text-slate-300 mr-1" />
                    </div>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-sky-100 rounded-lg p-1.5 text-sky-500 pointer-events-none">
                      <Zap size={14} className={state.profile.customTargetDate ? "opacity-30" : "fill-current"} />
                    </div>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">
                    {state.profile.customTargetDate ? "Handmatig aangepast" : "Automatische projectie op basis van tekort"}
                  </p>
                </div>
             </div>

             <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-200 shadow-sm space-y-4">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Database size={16} className="text-sky-400" /> {t.dataManagement.title}</h3>
               <div className="grid grid-cols-1 gap-2">
                 <button onClick={exportData} className="w-full flex items-center justify-between px-4 py-3 bg-white text-sky-600 border border-sky-100 rounded-xl hover:bg-sky-50 transition-all shadow-sm">
                   <div className="flex items-center gap-2"><Download size={16} /><span className="text-xs font-black uppercase tracking-widest">{t.dataManagement.export}</span></div>
                   <ChevronRight size={14} />
                 </button>
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

      {/* MODAL: Mijn Lijst (Voeding & Drank) */}
      {showMyList && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-0">
          <div className="w-full max-w-md bg-white h-full flex flex-col p-4 animate-in slide-in-from-bottom duration-300 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">{t.myList} - Voeding</h2>
              <button onClick={() => setShowMyList(false)} className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 mb-6 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nieuw product toevoegen</h3>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Naam" value={newMeal.name} onChange={e => setNewMeal({...newMeal, name: e.target.value})} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm outline-none focus:ring-2 focus:ring-sky-100" />
                <input type="number" placeholder="Kcal" value={newMeal.kcal} onChange={e => setNewMeal({...newMeal, kcal: e.target.value})} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm outline-none focus:ring-2 focus:ring-sky-100" />
              </div>
              <div className="flex gap-3">
                <select value={newMeal.moment} onChange={e => setNewMeal({...newMeal, moment: e.target.value as MealMoment})} className="flex-grow bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm outline-none focus:ring-2 focus:ring-sky-100">
                  {MEAL_MOMENTS.map(m => <option key={m} value={m}>{t.moments[m]}</option>)}
                </select>
                <button onClick={() => setNewMeal({...newMeal, isDrink: !newMeal.isDrink})} className={`px-4 rounded-2xl font-black border transition-all ${newMeal.isDrink ? 'bg-sky-500 text-white border-sky-400' : 'bg-white text-slate-400 border-slate-100'}`}>{t.drink}</button>
              </div>
              <button onClick={saveCustomMeal} className="w-full py-3 bg-sky-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-sky-100 hover:bg-sky-600 transition-colors">Opslaan</button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 pr-1">
              {Object.entries(state.customOptions).map(([moment, options]) => {
                const customs = options.filter(o => o.isCustom);
                if (customs.length === 0) return null;
                return (
                  <div key={moment} className="space-y-2">
                    <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest px-2">{t.moments[moment as MealMoment]}</h4>
                    {customs.map(opt => {
                      const { info, unit } = splitProductName(opt.name);
                      return (
                        <div key={opt.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-left-4 duration-300">
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-0.5">
                              {opt.isDrink ? <GlassWater size={14} className="text-sky-400" /> : <Utensils size={14} className="text-slate-400" />}
                              <span className="font-black text-slate-800 text-[13px] truncate leading-none">{info}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-sky-500 leading-none">
                              {unit && <span>{unit}</span>}
                              {unit && <span className="opacity-30">•</span>}
                              <span>{opt.kcal} kcal</span>
                            </div>
                          </div>
                          <button onClick={() => setState(prev => {
                            const customOptions = { ...prev.customOptions };
                            customOptions[moment] = customOptions[moment].filter(o => o.id !== opt.id);
                            return { ...prev, customOptions };
                          })} className="flex-shrink-0 text-red-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Mijn Lijst (Beweeg) */}
      {showMyActivityList && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-0">
          <div className="w-full max-w-md bg-white h-full flex flex-col p-4 animate-in slide-in-from-bottom duration-300 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">{t.myList} - Bewegen</h2>
              <button onClick={() => setShowMyActivityList(false)} className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 mb-6 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eigen activiteit toevoegen</h3>
              <div className="grid grid-cols-1 gap-3">
                <input type="text" placeholder="Naam van de activiteit" value={newActivity.name} onChange={e => setNewActivity({...newActivity, name: e.target.value})} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-100" />
                <input type="number" placeholder="Calorieverbruik per uur" value={newActivity.kcalPerHour} onChange={e => setNewActivity({...newActivity, kcalPerHour: e.target.value})} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-100" />
              </div>
              <button onClick={saveCustomActivity} className="w-full py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-colors">Toevoegen</button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 pr-1">
              {state.customActivities.map(act => (
                <div key={act.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-3">
                    <Activity size={16} className="text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-[13px] leading-tight">{act.name}</span>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{Math.round(act.met * 70)} kcal/uur</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {act.isCustom && (
                      <button onClick={() => setState(prev => ({ ...prev, customActivities: prev.customActivities.filter(a => a.id !== act.id) }))} className="text-red-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-6 py-4 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[28px] shadow-2xl">
        {[{ id: 'dashboard', icon: LayoutDashboard, label: t.tabs.dashboard }, { id: 'meals', icon: Utensils, label: t.tabs.meals }, { id: 'activity', icon: Activity, label: t.tabs.activity }, { id: 'profile', icon: UserIcon, label: t.tabs.profile }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-sky-500 scale-110' : 'text-slate-300'}`}>
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 3 : 2} /><span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
