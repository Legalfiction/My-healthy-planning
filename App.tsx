
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
  Flame,
  Settings2,
  Laptop,
  Hammer,
  Briefcase
} from 'lucide-react';
import { 
  UserProfile, 
  AppState, 
  MealMoment, 
  LoggedMealItem,
  MealOption,
  ActivityType,
  Language,
  WeightLossSpeed,
  ActivityLevel
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
  calculateBudgetFromTargetDate,
  calculateBMI
} from './services/calculator';
import { translations } from './translations';

const DB_NAME = 'GezondPlanningDB';
const STORE_NAME = 'appState';
const STATE_KEY = 'mainState';

// Helper for generating truly unique IDs
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const idb = {
  open: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 4); // Increment version for schema stability
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
  profile: { 
    gender: 'man',
    birthYear: 1980,
    height: 170, 
    startWeight: 86, 
    currentWeight: 86, 
    targetWeight: 80, 
    dailyBudget: 2058, 
    weightLossSpeed: 'average',
    activityLevel: 'light'
  },
  dailyLogs: {},
  customOptions: MEAL_OPTIONS,
  customActivities: ACTIVITY_TYPES,
  language: 'nl'
};

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'nl', name: 'NL', flag: '🇳🇱' },
  { code: 'en', name: 'EN', flag: '🇬🇧' },
  { code: 'es', name: 'ES', flag: '🇪🇸' },
  { code: 'de', name: 'DE', flag: '🇩🇪' },
  { code: 'pt', name: 'PT', flag: '🇵🇹' },
  { code: 'zh', name: 'ZH', flag: '🇨🇳' },
  { code: 'ja', name: 'JA', flag: '🇯🇵' },
  { code: 'ko', name: 'KO', flag: '🇰🇷' },
  { code: 'hi', name: 'HI', flag: '🇮🇳' },
  { code: 'ar', name: 'AR', flag: '🇸🇦' },
];

const Toast = ({ message, type = 'success', onHide }: { message: string, type?: 'success' | 'error' | 'info', onHide: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onHide, 3000);
    return () => clearTimeout(timer);
  }, [onHide]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-bottom-4 duration-300 w-max max-w-[90vw]">
      <div className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border backdrop-blur-md bg-opacity-95 ${
        type === 'error' ? 'bg-red-900 border-red-700 text-white' : 
        type === 'info' ? 'bg-orange-900 border-orange-700 text-white' :
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
  const [mealInputs, setMealInputs] = useState<Record<string, { mealId: string; qty: number }>>({});

  const t = useMemo(() => {
    const lang = state.language || 'nl';
    const base = translations['nl'];
    const selected = translations[lang] || {};
    const result = { ...base };
    Object.keys(selected).forEach(key => {
        if (selected[key] && (typeof selected[key] !== 'object' || Object.keys(selected[key]).length > 0)) {
            result[key] = selected[key];
        }
    });
    return result;
  }, [state.language]);

  useEffect(() => {
    idb.get().then(saved => {
      if (saved) {
        // Migration logic: merge new default activities and meal options into saved state
        const mergedActivities = [...(saved.customActivities || [])];
        ACTIVITY_TYPES.forEach(defAct => {
          if (!mergedActivities.find(a => a.id === defAct.id)) {
            mergedActivities.push(defAct);
          }
        });

        const mergedOptions = { ...(saved.customOptions || MEAL_OPTIONS) };
        MEAL_MOMENTS.forEach(moment => {
          const savedForMoment = mergedOptions[moment] || [];
          const defaultsForMoment = MEAL_OPTIONS[moment] || [];
          defaultsForMoment.forEach(defOpt => {
            if (!savedForMoment.find(o => o.id === defOpt.id)) {
              savedForMoment.push(defOpt);
            }
          });
          mergedOptions[moment] = savedForMoment;
        });

        const updatedProfile = { 
          ...INITIAL_STATE.profile, 
          ...saved.profile,
          gender: saved.profile.gender || 'man',
          birthYear: saved.profile.birthYear || (saved.profile.age ? (new Date().getFullYear() - saved.profile.age) : 1980),
          activityLevel: saved.profile.activityLevel || 'light'
        };

        setState({
          ...saved,
          profile: updatedProfile,
          customOptions: mergedOptions,
          customActivities: mergedActivities,
          language: saved.language || 'nl'
        });
      } else {
          // If no saved data, ensure initial data is properly formatted
          setSelectedDate(new Date().toISOString().split('T')[0]);
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (state.profile.weightLossSpeed === 'custom') {
      if (state.profile.customTargetDate) {
        const newBudget = calculateBudgetFromTargetDate({ ...state.profile, currentWeight: state.profile.startWeight }, state.profile.customTargetDate);
        if (newBudget !== state.profile.dailyBudget) {
          setState(prev => ({
            ...prev,
            profile: { ...prev.profile, dailyBudget: newBudget }
          }));
        }
      }
    } else {
      const targetMaintenance = calculateTDEE(state.profile, 0, Number(state.profile.targetWeight));
      let adjustment = 0;
      if (state.profile.weightLossSpeed === 'slow') adjustment = 200;
      else if (state.profile.weightLossSpeed === 'fast') adjustment = -250;

      const calculatedBudget = Math.round(targetMaintenance + adjustment);
      
      if (calculatedBudget !== state.profile.dailyBudget) {
        setState(prev => ({
          ...prev,
          profile: { ...prev.profile, dailyBudget: Math.max(calculatedBudget, 1200) }
        }));
      }
    }
  }, [
    isLoaded, 
    state.profile.gender, 
    state.profile.birthYear, 
    state.profile.height, 
    state.profile.startWeight, 
    state.profile.weightLossSpeed,
    state.profile.targetWeight,
    state.profile.activityLevel
  ]);

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
    if (bmi < 18.5) return 'text-orange-400';
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
    
    const projectionProfile = activeTab === 'profile' 
      ? { ...state.profile, currentWeight: Number(state.profile.startWeight) } 
      : effectiveProfile;

    const autoTargetDate = calculateTargetDate(projectionProfile, intakeGoal);
    
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
  }, [state.profile, currentLog, latestWeight, activeTab]);

  const dateParts = useMemo(() => {
    const dateObj = new Date(selectedDate);
    const locale = state.language === 'en' ? 'en-US' : (state.language === 'es' ? 'es-ES' : (state.language === 'de' ? 'de-DE' : (state.language === 'pt' ? 'pt-PT' : 'nl-NL')));
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

  const splitProductName = (fullName: string) => {
    const match = fullName.match(/^(.*?)\s*\((.*)\)$/);
    if (match) {
      const namePart = match[1];
      const bracketContent = match[2];
      
      if (bracketContent.includes(',')) {
        const parts = bracketContent.split(',');
        const unitPart = parts[parts.length - 1].trim();
        const descPart = parts.slice(0, parts.length - 1).join(',').trim();
        return { info: `${namePart} (${descPart})`, unit: unitPart };
      }
      
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
    setState(prev => ({
      ...prev,
      profile: { ...prev.profile, weightLossSpeed: speed, customTargetDate: speed === 'custom' ? prev.profile.customTargetDate : undefined }
    }));
    
    const label = speed === 'slow' ? t.speedSlow : speed === 'average' ? t.speedAverage : speed === 'fast' ? t.speedFast : t.speedCustom;
    setToast({ msg: `Planning: ${label}`, type: 'info' });
  };

  const setActivityLevel = (level: ActivityLevel) => {
    setState(prev => ({
      ...prev,
      profile: { ...prev.profile, activityLevel: level }
    }));
    const label = level === 'light' ? t.levelLight : level === 'moderate' ? t.levelModerate : level === 'heavy';
    setToast({ msg: `Daginvulling: ${label}`, type: 'info' });
  };

  const addMealItem = (moment: MealMoment, item: Omit<LoggedMealItem, 'id'>) => {
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] };
      const meals = { ...log.meals };
      meals[moment] = [...(meals[moment] || []), { ...item, id: generateId() }];
      logs[selectedDate] = { ...log, meals };
      return { ...prev, dailyLogs: logs };
    });
  };

  const addActivity = (typeId: string, value: number) => {
    const burn = calculateActivityBurn({ typeId, value }, latestWeight);
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] };
      logs[selectedDate] = { ...log, activities: [...log.activities, { id: generateId(), typeId, value, burnedKcal: burn }] };
      return { ...prev, dailyLogs: logs };
    });
    const input = document.getElementById('act-val') as HTMLInputElement;
    if (input) input.value = '';
  };

  const formatTargetDateDisplay = (isoDate: string) => {
    if (!isoDate) return "...";
    const date = new Date(isoDate);
    const locale = state.language === 'en' ? 'en-US' : (state.language === 'es' ? 'es-ES' : (state.language === 'de' ? 'de-DE' : (state.language === 'pt' ? 'pt-PT' : 'nl-NL')));
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
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

  const birthYears = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i >= currentYear - 100; i--) {
      years.push(i);
    }
    return years;
  }, []);

  if (!isLoaded) return <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center font-black text-orange-500 uppercase tracking-widest text-lg">...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 bg-white flex flex-col shadow-2xl relative overflow-hidden">
      {toast && <Toast message={toast.msg} type={toast.type} onHide={() => setToast(null)} />}
      
      <header className="bg-white border-b sticky top-0 z-30 p-3 shadow-sm">
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex flex-col">
             <h1 className="text-xl font-black text-orange-500 leading-none tracking-tight">{t.title}</h1>
             <h2 className="text-[12px] font-black text-slate-400 tracking-[0.2em] uppercase">{t.subtitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInfo(true)} className="p-1.5 text-orange-400 hover:bg-orange-50 rounded-xl transition-all"><Info size={20} /></button>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-2xl flex items-center gap-1.5 shadow-sm">
              <TrendingDown size={14} className="text-orange-400" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-black leading-tight">{latestWeight.toFixed(1)} <span className="text-[10px] opacity-60 font-bold">KG</span></span>
                <span className={`text-[10px] font-black uppercase ${bmiColor} leading-none tracking-tighter`}>BMI: {bmi}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between bg-slate-50 rounded-[18px] p-1.5 border border-slate-200 shadow-sm mx-1">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"><ChevronLeft size={20} className="text-slate-400"/></button>
          <div className="flex items-center gap-3">
             <span className="text-3xl font-black text-orange-500 tabular-nums leading-none tracking-tighter">{dateParts.day}</span>
             <div className="flex flex-col">
               <span className="text-[11px] font-black text-orange-300 uppercase tracking-widest leading-none">{dateParts.weekday}</span>
               <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest leading-none mt-1">{dateParts.month}</span>
             </div>
          </div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"><ChevronRight size={20} className="text-slate-400"/></button>
        </div>
      </header>

      <main className="p-3 flex-grow space-y-3">
        {activeTab === 'dashboard' && (
          <div className="space-y-3 animate-in fade-in duration-500">
            <div className="bg-orange-50 rounded-[24px] p-5 text-slate-800 relative overflow-hidden border border-orange-100 shadow-sm">
               <Target size={60} className="absolute -right-2 -top-2 text-orange-200/30" />
               <p className="text-orange-500 text-[11px] font-black uppercase tracking-widest mb-1">{t.targetReached}</p>
               <h2 className="text-xl font-black mb-1 text-slate-800">{formatTargetDateDisplay(totals.targetDate)}</h2>
            </div>

            <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm">
               <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400 fill-amber-400" />
                      <h3 className="font-black text-slate-800 text-[12px] uppercase tracking-widest">{t.dailyBudget}</h3>
                    </div>
                    <div className="flex items-baseline">
                       <span className="text-2xl font-black text-slate-400">{totals.intakeGoal}</span>
                       <span className="text-2xl font-black text-green-500">+{totals.activityBurn}</span>
                       <span className="text-2xl font-black text-orange-500">={totals.currentAdjustedGoal}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">Verbruikt</span>
                    <span className={`text-2xl font-black ${totals.actualIntake > totals.currentAdjustedGoal ? 'text-red-500' : 'text-orange-500'}`}>
                      {totals.actualIntake} <span className="text-[10px] opacity-40 uppercase">Kcal</span>
                    </span>
                  </div>
               </div>
               
               <div className="relative pt-0.5 pb-0.5">
                 <div className="h-5 w-full bg-white rounded-full overflow-hidden shadow-inner border border-slate-200 relative mb-3">
                    <div className={`h-full transition-all duration-1000 shadow-md ${totals.calorieStatusColor}`} style={{ width: `${Math.min(totals.intakePercent, 100)}%` }} />
                 </div>
                 <div className="grid grid-cols-2 gap-y-4 gap-x-3 px-0.5 mt-2">
                    <div className="flex flex-col">
                       <span className="text-[13px] font-black text-slate-500 uppercase tracking-tighter leading-tight whitespace-normal min-h-[2.1em] mb-0">{t.remainingToday}</span>
                       <span className={`text-[20px] font-black text-orange-500 leading-none`}>
                         {Math.max(0, totals.currentAdjustedGoal - totals.actualIntake)}
                       </span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[13px] font-black text-slate-500 uppercase tracking-tighter leading-tight whitespace-normal min-h-[2.1em] mb-0">{t.caloriesPerDay}</span>
                       <span className="text-[20px] font-black text-orange-500 leading-none">
                         {totals.intakeGoal}
                       </span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[13px] font-black text-slate-500 uppercase tracking-tighter leading-tight whitespace-normal min-h-[2.1em] mb-0">{t.activityCalories}</span>
                       <span className="text-[20px] font-black text-orange-500 leading-none">
                         {totals.activityBurn}
                       </span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[13px] font-black text-slate-500 uppercase tracking-tighter leading-tight whitespace-normal min-h-[2.1em] mb-0">{t.consumedTodayLabel}</span>
                       <span className={`text-[20px] font-black uppercase tracking-widest text-orange-500 leading-none`}>
                         {Math.round(totals.intakePercent)}%
                       </span>
                    </div>
                 </div>
               </div>
            </div>

            <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm overflow-visible">
               <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-black text-slate-800 text-[12px] uppercase tracking-widest">{t.myJourney}</h3>
                  <span className="text-[11px] font-black text-green-600 px-2 py-0.5">-{ Math.max(0, (Number(state.profile.startWeight) - latestWeight)).toFixed(1) } KG</span>
               </div>
               <div className="relative pt-0.5 pb-0.5 px-1">
                 <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{t.startWeight}</span>
                      <span className="text-sm font-black text-slate-600">{state.profile.startWeight} KG</span>
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{t.nowWeight}</span>
                       <span className="text-sm font-black text-slate-600">{latestWeight.toFixed(1)} KG</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{t.goalWeight}</span>
                      <span className="text-sm font-black text-slate-600">{state.profile.targetWeight} KG</span>
                    </div>
                 </div>
                 <div className="h-4 w-full bg-white rounded-full overflow-hidden shadow-inner border border-slate-200 relative mb-2">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-md" style={{ width: `${Math.min(Math.max(totals.weightProgressPercent, 0), 100)}%` }} />
                 </div>
               </div>
            </div>

            <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-[12px] uppercase tracking-widest mb-4 flex items-center gap-1.5"><Scale size={15} className="text-orange-400" /> {t.weighMoment}</h3>
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-inner">
                <input type="number" step="0.1" placeholder={t.placeholders.weight} value={state.dailyLogs[selectedDate]?.weight || ''} onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setState(prev => {
                    const logs = { ...prev.dailyLogs };
                    logs[selectedDate] = { ...(logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] }), weight: val };
                    return { ...prev, dailyLogs: logs };
                  });
                }} className="w-full bg-transparent border-none p-0 text-2xl font-black text-orange-500 focus:ring-0" />
                <span className="text-sm font-black text-slate-400 uppercase">kg</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-3 pb-12 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1">
              <div><h2 className="text-xl font-black text-slate-800 tracking-tight">{t.mealSchedule}</h2><span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.todayPlanning}</span></div>
              <button onClick={() => setShowMyList(true)} className="flex items-center gap-1.5 bg-slate-50 text-orange-500 border border-slate-200 shadow-sm px-3 py-1.5 rounded-xl font-black text-xs uppercase"><ListFilter size={16} /> {t.myList}</button>
            </div>
            {mealGroups.map((group) => (
              <div key={group.label} className="bg-slate-100/40 rounded-[24px] p-4 border border-slate-200/50 space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="p-1 bg-white rounded-lg shadow-sm border border-slate-100"><group.icon size={12} className="text-orange-400" /></div>
                  <h3 className="font-black text-slate-800 text-[12px] uppercase tracking-widest">{group.label}</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {group.moments.map(moment => {
                    const items = currentLog.meals[moment] || [];
                    const availableOptions = state.customOptions[moment] || [];
                    const currentInput = mealInputs[moment] || { mealId: '', qty: 1 };
                    const selectedOption = availableOptions.find(o => o.id === currentInput.mealId);
                    const title = selectedOption ? selectedOption.name : t.placeholders.select;

                    return (
                      <div key={moment} className="bg-orange-50 rounded-[20px] p-3 shadow-sm border border-orange-100">
                        <h4 className="font-black text-[11px] text-orange-400 uppercase mb-2.5 tracking-widest">{t.moments[moment]}</h4>
                        <div className="flex gap-1.5 mb-2.5 items-center flex-nowrap relative">
                          <div className="flex-grow min-w-0 relative">
                            <button onClick={() => { setOpenPickerMoment(openPickerMoment === moment ? null : moment); setSearchTerm(''); }} className="w-full bg-white border border-orange-100 rounded-xl p-2 text-[14px] font-bold shadow-sm flex items-center justify-between min-w-0">
                              <span className="truncate">{title}</span>
                              <ChevronDown size={14} className={`text-orange-300 transition-transform ${openPickerMoment === moment ? 'rotate-180' : ''}`} />
                            </button>
                            {openPickerMoment === moment && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[320px] animate-in fade-in duration-200">
                                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                  <Search size={14} className="text-slate-400" />
                                  <input autoFocus className="bg-transparent border-none text-[14px] w-full focus:ring-0 font-bold" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="overflow-y-auto py-2">
                                  {availableOptions.filter(o => getTranslatedName(o.id, o.name).toLowerCase().includes(searchTerm.toLowerCase())).map(opt => {
                                    const { info, unit } = splitProductName(getTranslatedName(opt.id, opt.name));
                                    return (
                                      <button key={opt.id} onClick={() => { setMealInputs({ ...mealInputs, [moment]: { ...currentInput, mealId: opt.id } }); setOpenPickerMoment(null); }} className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-start gap-3 border-b border-slate-50">
                                        <div className="pt-1">{opt.isDrink ? <GlassWater size={14} className="text-orange-400" /> : <Utensils size={14} className="text-slate-400" />}</div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-[14px] font-black text-slate-800 truncate leading-tight mb-1">{info}</span>
                                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 leading-none uppercase tracking-widest">
                                            {unit && <span>{unit}</span>}
                                            {unit && <span className="opacity-30">•</span>}
                                            <span className="text-orange-500">{opt.kcal} kcal</span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          <input type="number" min="0" step="0.1" className="w-12 flex-shrink-0 bg-white border border-orange-100 rounded-xl p-2 text-[14px] font-black text-center shadow-sm" value={currentInput.qty} onChange={(e) => setMealInputs({ ...mealInputs, [moment]: { ...currentInput, qty: Math.max(0, Number(e.target.value)) } })} />
                          <button className="flex-shrink-0 bg-orange-400 text-white p-2 rounded-xl shadow-md" disabled={!currentInput.mealId} onClick={() => {
                              const opt = availableOptions.find(o => o.id === currentInput.mealId);
                              if (opt) addMealItem(moment, { name: opt.name, kcal: opt.kcal * currentInput.qty, quantity: currentInput.qty, mealId: opt.id, isDrink: opt.isDrink });
                              setMealInputs({ ...mealInputs, [moment]: { mealId: '', qty: 1 } });
                            }}><Plus size={18} strokeWidth={3} /></button>
                        </div>
                        <div className="space-y-1.5">
                          {items.map(item => {
                            const { info, unit } = splitProductName(getTranslatedName(item.mealId || '', item.name));
                            return (
                              <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-orange-100 shadow-sm animate-in fade-in duration-300">
                                <div className="flex flex-col flex-grow min-w-0 pr-2">
                                  <span className="text-[14px] font-black text-slate-800 truncate leading-tight mb-1">{info}</span>
                                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 leading-none">
                                    {<span>{item.quantity}x </span>}
                                    {unit && <span>{item.quantity} {unit}</span>}
                                    {<span> • </span>}
                                    <span className="text-orange-500 font-black">{item.kcal} KCAL</span>
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
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1">
              <div><h2 className="text-xl font-black text-slate-800 tracking-tight">{t.movement}</h2><span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.planActivities}</span></div>
              <button onClick={() => setShowMyActivityList(true)} className="flex items-center gap-1.5 bg-slate-50 text-orange-500 border border-slate-200 shadow-sm px-3 py-1.5 rounded-xl font-black text-xs uppercase"><ListFilter size={16} /> {t.myList}</button>
            </div>
            
            <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.activity}</label>
                <select value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm focus:ring-2 focus:ring-orange-100 outline-none appearance-none">
                  {state.customActivities.map(act => (
                    <option key={act.id} value={act.id}>{getTranslatedName(act.id, act.name)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-grow space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.amount}</label>
                  <input id="act-val" type="number" placeholder="0" className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm focus:ring-2 focus:ring-orange-100 outline-none" />
                </div>
                <div className="flex items-end">
                  <button onClick={() => {
                    const val = (document.getElementById('act-val') as HTMLInputElement).value;
                    if (val) addActivity(selectedActivityId, Number(val));
                  }} className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"><Plus size={24} strokeWidth={3} /></button>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-1 pt-2">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.todayPlanning}</h3>
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
                          <span className="text-[14px] font-black text-slate-800">{getTranslatedName(act.typeId, state.customActivities.find(t => t.id === act.typeId)?.name || '')}</span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase">{act.value} {state.customActivities.find(t => t.id === act.typeId)?.unit}</span>
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
          <div className="space-y-3 animate-in fade-in duration-300 pb-10">
             <h2 className="text-xl font-black text-orange-500 px-1 tracking-tight">{t.settings}</h2>
             
             <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm">
                <label className="text-[11px] font-black text-black uppercase tracking-widest mb-3 block leading-none">{t.language}</label>
                <div className="grid grid-cols-5 gap-2">
                  {languages.map(lang => (
                    <button 
                      key={lang.code} 
                      onClick={() => setState(prev => ({ ...prev, language: lang.code }))}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${state.language === lang.code ? 'bg-white border-orange-400 scale-105 shadow-sm' : 'bg-slate-100 border-transparent grayscale opacity-60'}`}
                    >
                      <span className="text-xl mb-1">{lang.flag}</span>
                      <span className="text-[9px] font-black">{lang.name}</span>
                    </button>
                  ))}
                </div>
             </div>

             <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-black uppercase tracking-widest block">{t.gender}</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    <button 
                      onClick={() => setState({ ...state, profile: { ...state.profile, gender: 'man' } })}
                      className={`py-2.5 rounded-xl font-black uppercase text-xs transition-all ${state.profile.gender === 'man' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}
                    >
                      {t.man}
                    </button>
                    <button 
                      onClick={() => setState({ ...state, profile: { ...state.profile, gender: 'woman' } })}
                      className={`py-2.5 rounded-xl font-black uppercase text-xs transition-all ${state.profile.gender === 'woman' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
                    >
                      {t.woman}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-black uppercase tracking-widest mb-1.5 block leading-none">{t.age}</label>
                    <select 
                      value={state.profile.birthYear} 
                      onChange={e => setState({...state, profile: {...state.profile, birthYear: Number(e.target.value)}})} 
                      className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm focus:ring-2 focus:ring-orange-100 outline-none"
                    >
                      {birthYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-black uppercase tracking-widest mb-1.5 block leading-none">{t.height}</label>
                    <input type="number" value={state.profile.height} onChange={e => setState({...state, profile: {...state.profile, height: Number(e.target.value)}})} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm focus:ring-2 focus:ring-orange-100 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-black uppercase tracking-widest mb-1.5 block leading-none truncate">{t.startWeight}</label>
                    <input type="number" value={state.profile.startWeight} onChange={e => {
                        const val = Number(e.target.value);
                        setState({...state, profile: {...state.profile, startWeight: val, currentWeight: val}});
                    }} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm focus:ring-2 focus:ring-orange-100 outline-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-black uppercase tracking-widest mb-1.5 block">{t.targetWeight}</label>
                    <input type="number" value={state.profile.targetWeight} onChange={e => setState({...state, profile: {...state.profile, targetWeight: Number(e.target.value)}})} className="w-full bg-orange-50 p-3 rounded-2xl font-black text-orange-500 border border-orange-100 text-base shadow-sm focus:ring-2 focus:ring-orange-100 outline-none" />
                  </div>
                </div>
             </div>

             <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-black uppercase tracking-widest block">{t.activityLevelLabel}</label>
                  <p className="text-[10px] font-bold text-orange-500 leading-tight uppercase tracking-tight">{t.activityLevelDesc}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setActivityLevel('light')} className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border-2 transition-all ${state.profile.activityLevel === 'light' ? 'bg-white border-orange-400 shadow-md' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                    <Laptop size={20} className={state.profile.activityLevel === 'light' ? 'text-orange-500' : ''} />
                    <span className="text-[9px] font-black uppercase text-center leading-tight whitespace-nowrap">{t.levelLight}</span>
                  </button>
                  <button onClick={() => setActivityLevel('moderate')} className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border-2 transition-all ${state.profile.activityLevel === 'moderate' ? 'bg-white border-orange-400 shadow-md' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                    <Briefcase size={20} className={state.profile.activityLevel === 'moderate' ? 'text-orange-500' : ''} />
                    <span className="text-[9px] font-black uppercase text-center leading-tight whitespace-nowrap">{t.levelModerate}</span>
                  </button>
                  <button onClick={() => setActivityLevel('heavy')} className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border-2 transition-all ${state.profile.activityLevel === 'heavy' ? 'bg-white border-orange-400 shadow-md' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                    <Hammer size={20} className={state.profile.activityLevel === 'heavy' ? 'text-orange-500' : ''} />
                    <span className="text-[9px] font-black uppercase text-center leading-tight whitespace-nowrap">{t.levelHeavy}</span>
                  </button>
                </div>
             </div>

             <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-black uppercase tracking-widest block">{t.dailyBudgetLabel}</label>
                  <input 
                    type="number" 
                    value={state.profile.dailyBudget} 
                    readOnly
                    className="w-full p-3 rounded-2xl font-black border text-base shadow-sm bg-slate-100 text-slate-500 border-slate-200 outline-none cursor-default" 
                  />
                </div>

                <div className="pt-2">
                  <p className="text-[11px] font-black text-orange-500 uppercase tracking-widest mb-3 text-left">{t.chooseSpeed}</p>
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => setLossSpeed('slow')} className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border-2 transition-all ${state.profile.weightLossSpeed === 'slow' ? 'bg-white border-orange-400 shadow-md' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                      <Turtle size={20} className={state.profile.weightLossSpeed === 'slow' ? 'text-orange-500' : ''} />
                      <span className="text-[9px] font-black uppercase text-center leading-tight whitespace-nowrap">{t.speedSlow}</span>
                    </button>
                    <button onClick={() => setLossSpeed('average')} className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border-2 transition-all ${state.profile.weightLossSpeed === 'average' ? 'bg-white border-orange-400 shadow-md' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                      <Footprints size={20} className={state.profile.weightLossSpeed === 'average' ? 'text-orange-500' : ''} />
                      <span className="text-[9px] font-black uppercase text-center leading-tight whitespace-nowrap">{t.speedAverage}</span>
                    </button>
                    <button onClick={() => setLossSpeed('fast')} className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border-2 transition-all ${state.profile.weightLossSpeed === 'fast' ? 'bg-white border-orange-400 shadow-md' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                      <Zap size={20} className={state.profile.weightLossSpeed === 'fast' ? 'text-amber-400 fill-amber-400' : ''} />
                      <span className="text-[9px] font-black uppercase text-center leading-tight whitespace-nowrap">{t.speedFast}</span>
                    </button>
                    <button onClick={() => setLossSpeed('custom')} className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border-2 transition-all ${state.profile.weightLossSpeed === 'custom' ? 'bg-white border-orange-400 shadow-md' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                      <Settings2 size={20} className={state.profile.weightLossSpeed === 'custom' ? 'text-orange-500' : ''} />
                      <span className="text-[9px] font-black uppercase text-center leading-tight whitespace-nowrap">{t.speedCustom}</span>
                    </button>
                  </div>
                </div>
             </div>

             <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm">
                <label className="text-[11px] font-black text-black uppercase tracking-widest mb-3 block flex items-center gap-1.5"><Calendar size={12} className="text-orange-400" /></label>
                <div className="relative group overflow-hidden rounded-2xl border">
                  <div className={`w-full p-4 pl-12 font-black text-base shadow-sm flex justify-between items-center transition-all ${state.profile.weightLossSpeed === 'custom' ? 'bg-orange-50 border-orange-400 shadow-lg shadow-orange-100/50' : 'bg-white border-slate-100'}`}>
                    <span className="truncate">{formatTargetDateDisplay(totals.targetDate)}</span>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className={`${state.profile.weightLossSpeed === 'custom' ? 'text-orange-500' : 'text-slate-300'} mr-1`} />
                    </div>
                  </div>
                  <input 
                    type="date" 
                    value={state.profile.customTargetDate || totals.targetDate} 
                    disabled={state.profile.weightLossSpeed !== 'custom'}
                    onChange={e => {
                      const newDate = e.target.value;
                      if (!newDate) return;
                      const newBudget = calculateBudgetFromTargetDate({ ...state.profile, currentWeight: state.profile.startWeight }, newDate);
                      setState(prev => ({
                        ...prev,
                        profile: {
                          ...prev.profile,
                          customTargetDate: newDate,
                          dailyBudget: newBudget
                        }
                      }));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full disabled:cursor-default"
                  />
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg p-1.5 transition-colors pointer-events-none z-10 ${state.profile.weightLossSpeed === 'custom' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'}`}>
                    {state.profile.weightLossSpeed === 'custom' ? <Settings2 size={14} /> : <Zap size={14} className={state.profile.customTargetDate ? "opacity-30" : "fill-current"} />}
                  </div>
                </div>
             </div>

             <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-200 shadow-sm space-y-3">
               <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2"><Database size={16} className="text-orange-400" /> {t.dataManagement.title}</h3>
               <div className="grid grid-cols-1 gap-2">
                 <button onClick={exportData} className="w-full flex items-center justify-between px-4 py-3 bg-white text-orange-600 border border-orange-100 rounded-xl hover:bg-orange-50 transition-all shadow-sm">
                   <div className="flex items-center gap-2"><Download size={16} /><span className="text-xs font-black uppercase tracking-widest text-black">{t.dataManagement.export}</span></div>
                   <ChevronRight size={14} />
                 </button>
                 <label className="w-full flex items-center justify-between px-4 py-3 bg-white text-emerald-600 border border-emerald-100 rounded-xl cursor-pointer hover:bg-emerald-50 transition-all shadow-sm">
                   <div className="flex items-center gap-2"><Upload size={16} /><span className="text-xs font-black uppercase tracking-widest text-black">{t.dataManagement.restore}</span></div>
                   <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                 </label>
                 <button onClick={resetAllData} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all shadow-sm">
                   <Trash2 size={16} /><span className="text-xs font-black uppercase tracking-widest text-black">{t.dataManagement.clearAll}</span>
                 </button>
               </div>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-6 py-4 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[28px] shadow-2xl">
        {[{ id: 'dashboard', icon: LayoutDashboard, label: t.tabs.dashboard }, { id: 'meals', icon: Utensils, label: t.tabs.meals }, { id: 'activity', icon: Activity, label: t.tabs.activity }, { id: 'profile', icon: UserIcon, label: t.tabs.profile }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-orange-500 scale-110' : 'text-slate-300'}`}>
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 3 : 2} /><span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
