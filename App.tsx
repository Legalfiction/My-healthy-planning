
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
  Zap,
  Check,
  AlertCircle,
  GlassWater,
  Search,
  ChevronDown,
  X,
  Footprints,
  Turtle,
  Flame,
  Settings,
  FileDown,
  FileUp,
  Laptop,
  Hammer,
  Briefcase,
  ListFilter,
  Info
} from 'lucide-react';
import { 
  AppState, 
  MealMoment, 
  LoggedMealItem,
  Language,
  MealOption,
  ActivityType,
  DailyLog,
  UserProfile,
  LoggedActivity
} from './types';
import { 
  MEAL_OPTIONS, 
  ACTIVITY_TYPES, 
  PRODUCT_TRANSLATIONS,
  MEAL_MOMENTS,
  KCAL_PER_KG_FAT
} from './constants';
import { 
  calculateTDEE,
  calculateActivityBurn, 
  calculateTargetDate,
  calculateBudgetFromTargetDate
} from './services/calculator';
import { translations } from './translations';

const DB_NAME = 'GezondPlanningDB';
const STORE_NAME = 'appState';
const STATE_KEY = 'mainState';

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const idb = {
  open: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 4);
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
    return new Promise(resolve => {
      tx.oncomplete = () => resolve();
    });
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
    dailyBudget: 2129, 
    weightLossSpeed: 'average',
    activityLevel: 'light'
  },
  dailyLogs: {},
  customOptions: MEAL_OPTIONS,
  customActivities: [],
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
        type === 'error' ? 'bg-red-900 border-red-700 text-white' : 'bg-slate-900 border-slate-700 text-white'
      }`}>
        {type === 'error' ? <AlertCircle size={16} className="text-red-400" /> : <Check size={16} className="text-emerald-400" />}
        <span className="text-[10px] font-black uppercase tracking-widest">{message}</span>
      </div>
    </div>
  );
};

const LANGUAGE_FLAGS: Record<Language, string> = {
  nl: '🇳🇱', en: '🇺🇸', es: '🇪🇸', de: '🇩🇪', pt: '🇵🇹', 
  zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷', hi: '🇮🇳', ar: '🇸🇦'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'activity' | 'profile'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [toast, setToast] = useState<{msg: string, type?: 'success' | 'error' | 'info'} | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  // Modals / List views
  const [showMyList, setShowMyList] = useState(false);
  const [showMyActivityList, setShowMyActivityList] = useState(false);
  
  // Meals Tab States
  const [searchTerm, setSearchTerm] = useState('');
  const [openPickerMoment, setOpenPickerMoment] = useState<MealMoment | null>(null);
  const [showProductList, setShowProductList] = useState(false);

  // Activity Tab State
  const [selectedActivityId, setSelectedActivityId] = useState<string>(ACTIVITY_TYPES[0].id);

  // Custom Creation States
  const [newFood, setNewFood] = useState({ name: '', kcal: '', unit: '', cats: [] as string[], isDrink: false });
  const [newAct, setNewAct] = useState({ name: '', met: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = useMemo(() => {
    const lang = state.language || 'nl';
    const base = (translations as any)['nl'];
    const selected = (translations as any)[lang] || {};
    return { ...base, ...selected };
  }, [state.language]);

  const getTranslatedName = (id: string, originalName: string) => {
    const lang = state.language || 'nl';
    return PRODUCT_TRANSLATIONS[lang]?.[id] || PRODUCT_TRANSLATIONS['nl']?.[id] || originalName;
  };

  useEffect(() => {
    idb.get().then(saved => {
      if (saved) {
        setState({
          ...saved,
          profile: { ...INITIAL_STATE.profile, ...saved.profile },
          customOptions: saved.customOptions || MEAL_OPTIONS,
          customActivities: saved.customActivities || [],
          language: saved.language || 'nl'
        });
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) idb.set(state);
  }, [state, isLoaded]);

  const globalLatestWeight = useMemo((): number => {
    const datesWithWeight = Object.keys(state.dailyLogs)
      .filter(d => (state.dailyLogs[d] as DailyLog).weight && (state.dailyLogs[d] as DailyLog).weight! > 0)
      .sort((a, b) => b.localeCompare(a));
    return datesWithWeight.length > 0 ? (state.dailyLogs[datesWithWeight[0]] as DailyLog).weight! : (Number(state.profile.startWeight) || 86);
  }, [state.dailyLogs, state.profile.startWeight]);

  const weightForSelectedDate = useMemo((): number => {
    const manual = (state.dailyLogs[selectedDate] as DailyLog)?.weight;
    if (manual) return manual;
    const previous = Object.keys(state.dailyLogs)
      .filter(d => d <= selectedDate && (state.dailyLogs[d] as DailyLog).weight)
      .sort((a,b) => b.localeCompare(a));
    return previous.length > 0 ? (state.dailyLogs[previous[0]] as DailyLog).weight! : (Number(state.profile.startWeight) || 86);
  }, [state.dailyLogs, state.profile.startWeight, selectedDate]);

  const maintenanceKcal = useMemo(() => {
    return Math.round(calculateTDEE(state.profile, 0, globalLatestWeight));
  }, [state.profile, globalLatestWeight]);

  const totals = useMemo(() => {
    const log = (state.dailyLogs[selectedDate] as DailyLog) || { meals: {}, activities: [] };
    const activityBurn = Number((log.activities as LoggedActivity[]).reduce((sum: number, a: LoggedActivity) => sum + (Number(a.burnedKcal) || 0), 0));
    const intakeGoal = Number(state.profile.dailyBudget) || 1800;
    const actualIntake = Number(Object.values(log.meals || {}).reduce((acc: number, items: any) => acc + (items as LoggedMealItem[]).reduce((sum: number, m: LoggedMealItem) => sum + m.kcal, 0), 0));
    const currentAdjustedGoal = intakeGoal + activityBurn;
    const intakePercent = currentAdjustedGoal > 0 ? (actualIntake / currentAdjustedGoal) * 100 : 0;
    
    const startW = Number(state.profile.startWeight) || 0;
    const targetW = Number(state.profile.targetWeight) || 0;
    const weightJourneyTotal = Math.abs(startW - targetW) || 1;
    const weightLostSoFar = startW - globalLatestWeight;
    const weightProgressPercent = Math.min(Math.max((weightLostSoFar / weightJourneyTotal) * 100, 0), 100);

    return { 
      activityBurn, actualIntake, currentAdjustedGoal, intakeGoal, intakePercent, 
      weightProgressPercent, weightLostSoFar, 
      calorieStatusColor: actualIntake > currentAdjustedGoal ? 'bg-red-500' : intakePercent > 85 ? 'bg-amber-500' : 'bg-green-500',
      targetDate: state.profile.weightLossSpeed === 'custom' && state.profile.customTargetDate ? state.profile.customTargetDate : calculateTargetDate({ ...state.profile, currentWeight: globalLatestWeight }, intakeGoal)
    };
  }, [state.profile, state.dailyLogs, selectedDate, globalLatestWeight]);

  const currentLog = useMemo(() => {
    return (state.dailyLogs[selectedDate] as DailyLog) || { meals: {}, activities: [] };
  }, [state.dailyLogs, selectedDate]);

  const dateParts = useMemo(() => {
    const d = new Date(selectedDate);
    const locale = state.language === 'nl' ? 'nl-NL' : 'en-US';
    const parts = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(d);
    return { 
      day: parts.find(p => p.type === 'day')?.value || '', 
      month: (parts.find(p => p.type === 'month')?.value || '').toUpperCase(), 
      weekday: (parts.find(p => p.type === 'weekday')?.value || '').toUpperCase() 
    };
  }, [selectedDate, state.language]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setState(prev => {
      const newProfile = { ...prev.profile, ...updates };
      let newBudget = newProfile.dailyBudget;
      if (newProfile.weightLossSpeed !== 'custom') {
        const speedMap: Record<string, number> = { slow: 0.25, average: 0.5, fast: 1.0 };
        const kgPerWeek = speedMap[newProfile.weightLossSpeed!] || 0.5;
        const dailyDeficit = (kgPerWeek * KCAL_PER_KG_FAT) / 7;
        const maintenance = calculateTDEE(newProfile, 0, Number(newProfile.currentWeight) || Number(newProfile.startWeight));
        newBudget = Math.round(maintenance - dailyDeficit);
        newBudget = Math.max(newBudget, newProfile.gender === 'man' ? 1500 : 1200);
      }
      return { ...prev, profile: { ...newProfile, dailyBudget: newBudget } };
    });
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
    const burn = calculateActivityBurn({ typeId, value }, weightForSelectedDate, state.customActivities);
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] };
      logs[selectedDate] = { ...log, activities: [...log.activities, { id: generateId(), typeId, value, burnedKcal: burn }] };
      return { ...prev, dailyLogs: logs };
    });
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      try {
        const parsed = JSON.parse(re.target?.result as string);
        setState(parsed);
      } catch (err) { alert('Fout bij laden bestand'); }
    };
    reader.readAsText(file);
  };

  const addCustomFood = () => {
    if (!newFood.name || !newFood.kcal || newFood.cats.length === 0) return;
    const item: MealOption = { 
      id: 'cust_' + generateId(), 
      name: newFood.name, 
      kcal: Number(newFood.kcal), 
      unitName: newFood.unit.toUpperCase() || 'STUK', 
      isDrink: newFood.isDrink, 
      isCustom: true 
    };

    const finalCats: MealMoment[] = [];
    newFood.cats.forEach(c => {
      if (c === 'Snack') {
        finalCats.push('Ochtend snack', 'Middag snack', 'Avondsnack');
      } else {
        finalCats.push(c as MealMoment);
      }
    });

    setState(prev => {
      const newOptions = { ...prev.customOptions };
      finalCats.forEach(cat => {
        newOptions[cat] = [...(newOptions[cat] || []), item];
      });
      return { ...prev, customOptions: newOptions };
    });
    setNewFood({ name: '', kcal: '', unit: '', cats: [], isDrink: false });
    setToast({ msg: t.addProduct + ' ' + t.save });
  };

  const birthYears = useMemo(() => {
    const years = [];
    const cur = new Date().getFullYear();
    for (let i = cur; i >= cur - 90; i--) years.push(i);
    return years;
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="max-w-md mx-auto h-screen bg-white flex flex-col shadow-2xl relative overflow-hidden text-slate-900">
      {toast && <Toast message={toast.msg} type={toast.type} onHide={() => setToast(null)} />}
      
      {/* Information Modal Overlay */}
      {showInfo && (
        <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-md p-6 overflow-y-auto animate-in fade-in duration-300">
          <button onClick={() => setShowInfo(false)} className="fixed top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-500 active:scale-95"><X size={24}/></button>
          <div className="space-y-8 pb-12">
            <div className="pt-8">
              <h2 className="text-3xl font-black text-orange-500 uppercase tracking-tight leading-none mb-1">{t.infoModal.title}</h2>
              <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">{t.infoModal.manualTitle}</p>
            </div>
            
            <section className="space-y-4">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">{t.infoModal.manualText}</p>
              <div className="grid grid-cols-1 gap-3">
                {t.infoModal.steps.map((step: any, i: number) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-[20px] border border-slate-100 flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-black shrink-0">{i+1}</span>
                    <div className="flex flex-col">
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-widest">{step.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-orange-50 rounded-[24px] p-6 border border-orange-100 space-y-3">
              <h3 className="font-black text-xs text-orange-600 uppercase tracking-widest flex items-center gap-2"><Activity size={16}/> {t.infoModal.howItWorksTitle}</h3>
              <p className="text-[11px] text-orange-700 leading-relaxed font-medium">{t.infoModal.howItWorksText}</p>
              <div className="bg-white/50 p-3 rounded-xl">
                 <p className="text-[10px] font-bold text-orange-600 italic leading-tight">{t.infoModal.caloriesNote}</p>
              </div>
            </section>

            <footer className="pt-8 border-t border-slate-100 flex flex-col items-center gap-2 opacity-30">
               <Target size={32} className="text-slate-300" />
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.infoModal.copyright}</p>
            </footer>
          </div>
        </div>
      )}

      <header className="bg-white sticky top-0 z-40 p-3 px-4 border-b border-slate-50 flex flex-col gap-1.5 shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
             <h1 className="text-xl font-black text-orange-500 leading-none">{t.title}</h1>
             <h2 className="text-[10px] font-black text-slate-400 tracking-[0.1em] uppercase">{t.subtitle}</h2>
          </div>
          <div className="flex items-center gap-2">
             <div className="relative">
                <select value={state.language} onChange={(e) => setState(prev => ({ ...prev, language: e.target.value as Language }))} className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[9px] font-black appearance-none pr-5 outline-none uppercase shadow-sm">
                  {Object.keys(LANGUAGE_FLAGS).map(l => <option key={l} value={l}>{LANGUAGE_FLAGS[l as Language]} {l.toUpperCase()}</option>)}
                </select>
                <ChevronDown size={8} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
             <div className="bg-white border border-slate-100 px-3 py-1 rounded-2xl flex items-center gap-1 shadow-sm">
                <TrendingDown size={10} className="text-orange-400" />
                <span className="text-sm font-black tabular-nums">{globalLatestWeight.toFixed(1)} <span className="text-[8px] text-slate-300 uppercase">KG</span></span>
             </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-2">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1 text-slate-300 active:text-orange-500"><ChevronLeft size={20}/></button>
          <div className="flex items-center gap-2">
             <span className="text-2xl font-black text-orange-500 tabular-nums leading-none">{dateParts.day}</span>
             <div className="flex flex-col leading-none">
               <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">{dateParts.weekday}</span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dateParts.month}</span>
             </div>
          </div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1 text-slate-300 active:text-orange-500"><ChevronRight size={20}/></button>
        </div>
      </header>

      <main className="p-2 flex-grow space-y-1 overflow-y-auto pb-24 custom-scrollbar">
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-500 h-full">
            <div className="bg-orange-50/40 rounded-[22px] p-2.5 border border-orange-100/50 flex items-center justify-between shadow-sm shrink-0">
               <div className="flex flex-col">
                 <span className="text-orange-400 text-[8px] font-black uppercase tracking-widest mb-0.5">{t.targetReached}</span>
                 <h2 className="text-lg font-black tracking-tight">{totals.targetDate ? new Intl.DateTimeFormat(state.language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(totals.targetDate)) : '--'}</h2>
               </div>
               <div className="relative">
                 <Target size={24} className="text-orange-200" />
                 <div className="absolute -inset-2 bg-orange-100/30 rounded-full animate-pulse blur-md -z-10" />
               </div>
            </div>

            <div className="bg-white rounded-[24px] p-3 border border-slate-100 shadow-sm space-y-2.5 shrink-0">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5"><Zap size={14} className="text-amber-400 fill-amber-400" /><h3 className="font-black text-[9px] uppercase tracking-widest text-slate-400">{t.dailyBudget}</h3></div>
                  <span className="text-[10px] font-black text-orange-500 uppercase">{totals.actualIntake} / {totals.currentAdjustedGoal} KCAL</span>
               </div>
               <div className="flex items-center justify-center gap-2 bg-slate-50/50 py-2.5 rounded-2xl font-black tabular-nums tracking-tighter">
                  <span className="text-2xl text-slate-300">{totals.intakeGoal}</span>
                  <span className="text-2xl text-emerald-500">+{totals.activityBurn}</span>
                  <span className="text-2xl text-orange-500">={totals.currentAdjustedGoal}</span>
               </div>
               
               <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div className={`h-full transition-all duration-1000 ${totals.calorieStatusColor}`} style={{ width: `${Math.min(totals.intakePercent, 100)}%` }} />
               </div>

               <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{t.remainingToday}</span>
                    <span className="text-xl font-black text-orange-500 tabular-nums">{Math.max(0, totals.currentAdjustedGoal - totals.actualIntake)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">PER DAG</span>
                    <span className="text-xl font-black text-orange-500 tabular-nums">{totals.intakeGoal}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">ACTIVITEITEN</span>
                    <span className="text-xl font-black text-orange-500 tabular-nums">{totals.activityBurn}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">VERBRUIKT</span>
                    <span className="text-xl font-black text-orange-500 tabular-nums">{Math.round(totals.intakePercent)}%</span>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[24px] p-3 border border-slate-100 shadow-sm space-y-2 shrink-0">
               <div className="flex justify-between items-center">
                 <h3 className="font-black text-[9px] uppercase tracking-widest text-slate-400">{t.myJourney}</h3>
                 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${currentLog.weight ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                   {currentLog.weight ? t.save : 'Nog geen metingen'}
                 </span>
               </div>
               <div className="grid grid-cols-3 text-center">
                 <div className="flex flex-col"><span className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{t.startWeight}</span><span className="text-[12px] font-black text-slate-700">{state.profile.startWeight} KG</span></div>
                 <div className="flex flex-col"><span className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{t.nowWeight}</span><span className="text-[12px] font-black text-orange-500">{globalLatestWeight.toFixed(1)} KG</span></div>
                 <div className="flex flex-col"><span className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{t.goalWeight}</span><span className="text-[12px] font-black text-slate-700">{state.profile.targetWeight} KG</span></div>
               </div>
               <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${totals.weightProgressPercent}%` }} />
               </div>
            </div>

            <div className="bg-white rounded-[24px] p-2.5 border border-slate-100 shadow-sm flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2"><div className="bg-orange-50 p-1.5 rounded-xl text-orange-500"><Scale size={14} /></div><h3 className="font-black text-[9px] uppercase tracking-widest text-slate-400">{t.weighMoment.toUpperCase()}</h3></div>
              <div className="flex items-center gap-1 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-100 shadow-inner max-w-[110px]">
                <input type="number" step="0.1" placeholder="00.0" value={currentLog?.weight || ''} onChange={(e) => {
                   const val = e.target.value ? Number(e.target.value) : undefined;
                   setState(prev => {
                     const logs = { ...prev.dailyLogs };
                     logs[selectedDate] = { ...((logs[selectedDate] as DailyLog) || { date: selectedDate, meals: {}, activities: [] }), weight: val };
                     return { ...prev, dailyLogs: logs };
                   });
                }} className="w-full bg-transparent border-none p-0 text-lg font-black text-orange-500 focus:ring-0 text-right placeholder:text-slate-200" /><span className="text-[9px] font-black text-slate-300 uppercase">kg</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-2 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">ETEN & DRINKEN</h2>
              <button onClick={() => setShowMyList(!showMyList)} className={`flex items-center gap-1 px-3 py-1 rounded-xl font-black text-[10px] uppercase shadow-sm transition-all border ${showMyList ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-50 text-orange-500 border-slate-200'}`}><ListFilter size={14} /> {t.myList}</button>
            </div>

            {showMyList ? (
              <div className="bg-orange-50/10 rounded-[24px] p-3 border border-orange-100/30 shadow-sm space-y-3">
                <div className="space-y-2">
                   <div className="flex gap-2">
                     <button onClick={() => setNewFood(p => ({...p, isDrink: false}))} className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-2 border transition-all font-black text-[10px] uppercase ${!newFood.isDrink ? 'bg-white border-orange-500 shadow-sm text-orange-600' : 'bg-white/50 border-slate-100 text-slate-300'}`}><Utensils size={14}/> ETEN</button>
                     <button onClick={() => setNewFood(p => ({...p, isDrink: true}))} className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-2 border transition-all font-black text-[10px] uppercase ${newFood.isDrink ? 'bg-white border-orange-500 shadow-sm text-orange-600' : 'bg-white/50 border-slate-100 text-slate-300'}`}><GlassWater size={14}/> DRINKEN</button>
                   </div>

                   <input type="text" placeholder="PRODUCTNAAM" value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} className="w-full bg-white border border-slate-100 p-2.5 rounded-xl font-black text-[10px] uppercase placeholder:text-slate-200 outline-none shadow-sm" />
                   
                   <div className="grid grid-cols-2 gap-2">
                     <input type="number" placeholder="Kcal" value={newFood.kcal} onChange={e => setNewFood({...newFood, kcal: e.target.value})} className="bg-white border border-slate-100 p-2.5 rounded-xl font-black text-[10px] uppercase placeholder:text-slate-200 outline-none shadow-sm" />
                     <input type="text" placeholder="PORTIE (BIJV 100G)" value={newFood.unit} onChange={e => setNewFood({...newFood, unit: e.target.value})} className="bg-white border border-slate-100 p-2.5 rounded-xl font-black text-[10px] uppercase placeholder:text-slate-200 outline-none shadow-sm" />
                   </div>

                   <div className="flex flex-wrap gap-1 pt-0.5">
                      {['Ontbijt', 'Snack', 'Lunch', 'Diner'].map(m => (
                        <button key={m} onClick={() => setNewFood(p => ({...p, cats: p.cats.includes(m) ? p.cats.filter(x => x!==m) : [...p.cats, m]}))} className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase border transition-all ${newFood.cats.includes(m) ? 'bg-white border-orange-500 text-orange-600 shadow-sm' : 'bg-white text-slate-300 border-slate-100'}`}>{m.toUpperCase()}</button>
                      ))}
                   </div>

                   <button onClick={addCustomFood} disabled={!newFood.name || !newFood.kcal || newFood.cats.length === 0} className={`w-full py-2.5 rounded-xl font-black text-[11px] uppercase flex items-center justify-center gap-2 transition-all ${(!newFood.name || !newFood.kcal || newFood.cats.length === 0) ? 'bg-slate-300 text-white cursor-not-allowed' : 'bg-slate-900 text-white active:scale-95 shadow-md'}`}>
                     <Plus size={14} strokeWidth={3}/> VOEG TOE AAN LIJST
                   </button>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                   {(Object.values(state.customOptions).flat() as MealOption[]).filter(o => o.isCustom).filter((v,i,a) => a.findIndex(t=>t.id===v.id)===i).map(opt => (
                     <div key={opt.id} className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 truncate">
                          <div className="text-orange-400 shrink-0">{opt.isDrink ? <GlassWater size={12}/> : <Utensils size={12}/>}</div>
                          <div className="flex flex-col truncate"><span className="text-[9px] font-black uppercase truncate text-slate-700">{opt.name}</span><span className="text-[7px] font-bold text-orange-400">{opt.kcal} KCAL / {opt.unitName}</span></div>
                        </div>
                        <button onClick={() => {
                          setState(prev => {
                            const newOpts = { ...prev.customOptions };
                            Object.keys(newOpts).forEach(k => { newOpts[k as MealMoment] = newOpts[k as MealMoment].filter(x => x.id !== opt.id); });
                            return { ...prev, customOptions: newOpts };
                          });
                        }} className="text-slate-200 hover:text-red-500 p-1.5 shrink-0"><Trash2 size={14}/></button>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/50 p-3 rounded-[24px] border border-slate-100 space-y-2 shadow-inner">
                 <div className="relative">
                   <select 
                     className="w-full bg-white px-3 py-2.5 rounded-xl font-black border border-slate-200 text-[12px] outline-none appearance-none cursor-pointer uppercase tracking-widest shadow-sm"
                     onChange={(e) => { setOpenPickerMoment(e.target.value as MealMoment); setSearchTerm(''); setShowProductList(true); }}
                     value={openPickerMoment || ''}
                   >
                     <option value="" disabled>{t.placeholders.select}</option>
                     {MEAL_MOMENTS.map(moment => <option key={moment} value={moment}>{t.moments[moment]}</option>)}
                   </select>
                   <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" />
                 </div>

                 {openPickerMoment && (
                   <div className="bg-orange-50/40 rounded-[20px] p-3 border border-orange-100 space-y-2 animate-in slide-in-from-top-2 duration-300">
                     <div className="relative">
                        <div className="relative bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 min-h-[44px] shadow-sm">
                           <Search size={14} className="text-orange-500" />
                           <input type="text" className="bg-transparent border-none text-[12px] w-full focus:ring-0 font-black uppercase placeholder:text-slate-300 outline-none" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowProductList(true); }} onFocus={() => setShowProductList(true)} />
                        </div>
                        {showProductList && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-orange-100 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[220px] z-50 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar overflow-y-auto">
                             {(state.customOptions[openPickerMoment] || []).filter(o => getTranslatedName(o.id, o.name).toLowerCase().includes(searchTerm.toLowerCase())).map(opt => (
                               <button key={opt.id} onClick={() => { addMealItem(openPickerMoment, { name: opt.name, kcal: opt.kcal, quantity: 1, mealId: opt.id, isDrink: opt.isDrink }); setShowProductList(false); setOpenPickerMoment(null); }} className="w-full text-left px-3 py-2.5 hover:bg-orange-50 border-b border-slate-50 flex items-center justify-between group transition-colors">
                                  <div className="flex items-center gap-2 truncate">
                                    <div className="text-slate-300 group-hover:text-orange-500 transition-colors shrink-0">{opt.isDrink ? <GlassWater size={14}/> : <Utensils size={14}/>}</div>
                                    <div className="flex flex-col truncate">
                                      <span className="text-[11px] font-black text-slate-800 uppercase truncate">{getTranslatedName(opt.id, opt.name)}</span>
                                      <span className="text-[8px] font-black text-slate-400 uppercase">{opt.unitName}</span>
                                    </div>
                                  </div>
                                  <div className="text-orange-500 font-black text-[10px] tabular-nums shrink-0">{opt.kcal} KCAL</div>
                               </button>
                             ))}
                          </div>
                        )}
                     </div>
                   </div>
                 )}
              </div>
            )}

            <div className="space-y-1">
              {Object.keys(currentLog.meals).map(moment => (currentLog.meals[moment] as LoggedMealItem[]).map(item => (
                <div key={item.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-2 truncate pr-2">
                     <div className="bg-orange-50 p-1.5 rounded-xl text-orange-500 shrink-0">{item.isDrink ? <GlassWater size={14} /> : <Utensils size={14} />}</div>
                     <div className="flex flex-col truncate leading-tight">
                       <span className="text-[10px] font-black text-slate-800 uppercase truncate">{getTranslatedName(item.mealId || '', item.name)}</span>
                       <span className="text-[8px] font-bold text-orange-400 uppercase">{item.kcal.toFixed(0)} KCAL <span className="text-slate-300 mx-1">•</span> {t.moments[moment as MealMoment]}</span>
                     </div>
                   </div>
                   <button onClick={() => {
                      setState(prev => {
                        const logs = { ...prev.dailyLogs };
                        const log = logs[selectedDate];
                        if (log) log.meals[moment] = (log.meals[moment] as LoggedMealItem[]).filter(i => i.id !== item.id);
                        return { ...prev, dailyLogs: logs };
                      });
                   }} className="text-slate-200 hover:text-red-500 p-1.5 shrink-0"><Trash2 size={16}/></button>
                </div>
              )))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-2 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1">
               <h2 className="text-lg font-black text-slate-800 tracking-tight">{t.movement}</h2>
               <button onClick={() => setShowMyActivityList(!showMyActivityList)} className={`flex items-center gap-1 px-3 py-1 rounded-xl font-black text-[10px] uppercase shadow-sm transition-all border ${showMyActivityList ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-50 text-orange-500 border-slate-200'}`}><ListFilter size={14} /> {t.myList}</button>
            </div>

            {showMyActivityList ? (
              <div className="bg-white rounded-[24px] p-3 border border-slate-100 shadow-sm space-y-3">
                 <div className="bg-orange-50/50 p-2.5 rounded-2xl border border-orange-100 space-y-1.5">
                    <input type="text" placeholder="Activiteitnaam" value={newAct.name} onChange={e => setNewAct({...newAct, name: e.target.value})} className="w-full bg-white border border-slate-100 p-2 rounded-xl font-black text-[10px] uppercase shadow-sm" />
                    <input type="number" placeholder="Kcal per 60 min" value={newAct.met} onChange={e => setNewAct({...newAct, met: e.target.value})} className="w-full bg-white border border-slate-100 p-2 rounded-xl font-black text-[10px] shadow-sm" />
                    <button onClick={() => {
                      if (!newAct.name || !newAct.met) return;
                      const item: ActivityType = { id: 'act_cust_' + generateId(), name: newAct.name, met: Number(newAct.met), unit: 'minuten', isCustom: true };
                      setState(prev => ({ ...prev, customActivities: [...prev.customActivities, item] }));
                      setNewAct({ name: '', met: '' });
                      setToast({ msg: t.addActivity + ' ' + t.save });
                    }} className="w-full bg-slate-900 text-white p-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-md"><Plus size={12}/> VOEG TOE</button>
                 </div>
                 <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {state.customActivities.map(act => (
                      <div key={act.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                         <div className="flex flex-col truncate"><span className="text-[9px] font-black uppercase truncate text-slate-700">{act.name}</span><span className="text-[7px] font-bold text-orange-400">{act.met} KCAL/UUR</span></div>
                         <button onClick={() => setState(prev => ({ ...prev, customActivities: prev.customActivities.filter(a => a.id !== act.id) }))} className="text-slate-200 hover:text-red-500 p-1.5"><Trash2 size={14}/></button>
                      </div>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="bg-slate-50/50 p-3 rounded-[24px] border border-slate-100 space-y-2 shadow-inner">
                 <select value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)} className="w-full bg-white p-2.5 rounded-xl font-black border border-slate-200 text-[12px] outline-none appearance-none cursor-pointer uppercase shadow-sm">
                   {[...ACTIVITY_TYPES, ...(state.customActivities || [])].map(act => <option key={act.id} value={act.id}>{getTranslatedName(act.id, act.name)}</option>)}
                 </select>
                 <div className="flex gap-2">
                   <input id="act-val" type="number" placeholder={t.amount} className="flex-grow bg-white p-2.5 rounded-xl font-black border border-slate-200 text-[12px] outline-none text-center shadow-sm" />
                   <button onClick={() => { const val = (document.getElementById('act-val') as HTMLInputElement).value; if (val) { addActivity(selectedActivityId, Number(val)); (document.getElementById('act-val') as HTMLInputElement).value = ''; } }} className="bg-orange-500 text-white p-2.5 rounded-xl shadow-lg active:scale-95 transition-all"><Plus size={20} strokeWidth={4} /></button>
                 </div>
              </div>
            )}

            <div className="space-y-1">
              {currentLog.activities.map(act => {
                const type = [...ACTIVITY_TYPES, ...(state.customActivities || [])].find(t => t.id === act.typeId);
                return (
                  <div key={act.id} className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                    <div className="flex flex-col leading-tight"><span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{getTranslatedName(act.typeId, type?.name || '')}</span><span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{act.value} {t.amount} • <span className="text-emerald-500">+{Math.round(act.burnedKcal)} KCAL</span></span></div>
                    <button onClick={() => setState(prev => {
                       const logs = { ...prev.dailyLogs };
                       const log = logs[selectedDate];
                       if (log) log.activities = log.activities.filter(a => a.id !== act.id);
                       return { ...prev, dailyLogs: logs };
                    })} className="text-slate-200 hover:text-red-500 p-1.5 shrink-0"><Trash2 size={16}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-300 h-full">
             <section className="bg-white rounded-[22px] p-2.5 border border-slate-100 shadow-sm space-y-2 shrink-0">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none">GESLACHT</label>
                   <button onClick={() => setShowInfo(true)} className="p-1.5 bg-slate-50 rounded-full text-slate-400 active:scale-95 shadow-sm transition-all hover:bg-slate-100"><Info size={14}/></button>
                </div>
                
                <div className="flex gap-2 px-1">
                  <button onClick={() => updateProfile({ gender: 'man' })} className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase border transition-all ${state.profile.gender === 'man' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-slate-50 text-slate-300 border-transparent opacity-60'}`}>{t.man}</button>
                  <button onClick={() => updateProfile({ gender: 'woman' })} className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase border transition-all ${state.profile.gender === 'woman' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-slate-50 text-slate-300 border-transparent opacity-60'}`}>{t.woman}</button>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1 px-1">
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block text-center truncate leading-none">GEBOORTE</label>
                    <div className="relative">
                      <select value={state.profile.birthYear} onChange={(e) => updateProfile({ birthYear: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 py-2 px-1 rounded-xl font-black text-[10px] outline-none appearance-none cursor-pointer text-center shadow-inner">{birthYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
                      <ChevronDown size={6} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block text-center truncate leading-none">LENGTE</label>
                    <input type="number" value={state.profile.height} onChange={(e) => updateProfile({ height: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 py-2 px-1 rounded-xl font-black text-[10px] outline-none text-center shadow-inner" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block text-center truncate leading-none">START</label>
                    <input type="number" value={state.profile.startWeight} onChange={(e) => updateProfile({ startWeight: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 py-2 px-1 rounded-xl font-black text-[10px] outline-none text-center shadow-inner" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-orange-400 uppercase tracking-widest block text-center truncate leading-none">DOEL</label>
                    <input type="number" value={state.profile.targetWeight} onChange={(e) => updateProfile({ targetWeight: Number(e.target.value) })} className="w-full bg-orange-50 border border-orange-200 py-2 px-1 rounded-xl font-black text-[10px] outline-none text-orange-600 text-center shadow-inner" />
                  </div>
                </div>
             </section>

             <section className="bg-white rounded-[22px] p-2.5 border border-slate-100 shadow-sm space-y-1.5 shrink-0">
                <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block px-1 leading-none">DAGELIJKSE ACTIVITEIT (BASIS)</label>
                <div className="grid grid-cols-3 gap-1.5 px-1">
                  {[
                    { id: 'light', icon: Laptop, label: 'ZITTEND' },
                    { id: 'moderate', icon: Briefcase, label: 'GEMIDDELD' },
                    { id: 'heavy', icon: Hammer, label: 'ZWAAR WERK' }
                  ].map(lvl => (
                    <button key={lvl.id} onClick={() => updateProfile({ activityLevel: lvl.id as any })} className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all ${state.profile.activityLevel === lvl.id ? 'bg-white border-orange-500 shadow-sm scale-100' : 'bg-slate-50 border-transparent opacity-40 scale-[0.98]'}`}>
                      <lvl.icon size={12} className={state.profile.activityLevel === lvl.id ? 'text-orange-500' : 'text-slate-300'} />
                      <span className={`text-[7px] font-black uppercase mt-0.5 tracking-tight text-center leading-none ${state.profile.activityLevel === lvl.id ? 'text-slate-800' : 'text-slate-300'}`}>{lvl.label}</span>
                    </button>
                  ))}
                </div>
             </section>

             <section className="bg-white rounded-[22px] p-2.5 border border-slate-100 shadow-sm space-y-1.5 shrink-0">
                <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block px-1 leading-none">STREEF TEMPO</label>
                <div className="grid grid-cols-3 gap-1.5 px-1">
                  {[
                    { id: 'slow', icon: Turtle, label: 'RUSTIG' },
                    { id: 'average', icon: Footprints, label: 'GEMIDDELD' },
                    { id: 'fast', icon: Flame, label: 'SNEL' }
                  ].map(sp => (
                    <button key={sp.id} onClick={() => updateProfile({ weightLossSpeed: sp.id as any })} className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all ${state.profile.weightLossSpeed === sp.id ? 'bg-white border-orange-500 shadow-sm scale-100' : 'bg-slate-50 border-transparent opacity-40 scale-[0.98]'}`}>
                      <sp.icon size={12} className={state.profile.weightLossSpeed === sp.id ? 'text-orange-500' : 'text-slate-300'} />
                      <span className={`text-[7px] font-black uppercase mt-0.5 tracking-tight text-center leading-none ${state.profile.weightLossSpeed === sp.id ? 'text-slate-800' : 'text-slate-300'}`}>{sp.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => updateProfile({ weightLossSpeed: 'custom' })} className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border transition-all ${state.profile.weightLossSpeed === 'custom' ? 'bg-white border-orange-500 shadow-sm' : 'bg-slate-50 border-transparent opacity-40'}`}>
                  <Settings size={10} />
                  <span className="text-[7px] font-black uppercase tracking-widest">EIGEN TEMPO</span>
                </button>
             </section>

             <section className="bg-orange-50/50 border border-orange-100 rounded-[22px] p-3 flex flex-col gap-2 shadow-inner shrink-0">
                <div className="flex flex-col gap-1.5 border-b border-orange-100 pb-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[7px] font-black text-orange-400 uppercase tracking-widest">OUD BUDGET (ONDERHOUD)</span>
                    <span className="text-[11px] font-black text-orange-600/50 tabular-nums">{maintenanceKcal} KCAL</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">NIEUW DAGBUDGET</span>
                    <span className="text-xl font-black text-orange-600 tabular-nums leading-none">{state.profile.dailyBudget} KCAL</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">STREEFDATUM</span>
                  {state.profile.weightLossSpeed === 'custom' ? (
                    <div className="relative inline-flex"><input type="date" value={state.profile.customTargetDate || ''} onChange={(e) => updateProfile({ customTargetDate: e.target.value })} className="bg-white border border-orange-200 py-1 px-2 rounded-lg font-black text-[9px] text-orange-600 outline-none shadow-sm" /></div>
                  ) : (
                    <span className="text-[13px] font-black text-orange-600 tracking-tight uppercase leading-none">{totals.targetDate ? new Intl.DateTimeFormat(state.language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(totals.targetDate)) : '--'}</span>
                  )}
                </div>
             </section>

             <section className="bg-white rounded-[22px] p-2 px-3 border border-slate-100 shadow-sm flex items-center justify-between shrink-0">
                <span className="font-black text-slate-800 text-[8px] uppercase tracking-widest">DATA & OPSLAG</span>
                <div className="flex gap-2.5">
                  <button onClick={handleExportData} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 shadow-sm"><FileDown size={14} /></button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 shadow-sm"><FileUp size={14} /></button>
                  <button onClick={async () => { if(confirm(t.dataManagement.clearConfirm)){ await idb.clear(); window.location.reload(); } }} className="p-1.5 rounded-lg bg-red-50 text-red-200 transition-colors hover:bg-red-100 shadow-sm"><Trash2 size={14} /></button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleRestoreData} accept=".json" className="hidden" />
             </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4 py-2 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[28px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom,10px)]">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: t.tabs.dashboard.toUpperCase() }, 
          { id: 'meals', icon: Utensils, label: 'ETEN & DRINKEN' }, 
          { id: 'activity', icon: Activity, label: 'BEWEEG' }, 
          { id: 'profile', icon: UserIcon, label: t.tabs.profile.toUpperCase() }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all w-20 ${activeTab === tab.id ? 'text-orange-500 scale-110' : 'text-slate-300 scale-100'}`}>
            <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
            <span className="text-[7.5px] font-black uppercase tracking-[0.1em] text-center leading-none">{tab.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 20px; }
        input[type="number"] { -moz-appearance: textfield; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent; bottom: 0; color: transparent; cursor: pointer; height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto;
        }
      `}</style>
    </div>
  );
}
