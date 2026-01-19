
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Utensils, 
  Activity, 
  User as UserIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus,
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
  Info,
  Clock,
  Sun,
  Moon,
  Apple,
  Cherry,
  Cookie,
  Beer,
  CalendarDays,
  BarChart3
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
  const [showWeeklyPopover, setShowWeeklyPopover] = useState(false);
  
  const [showMyList, setShowMyList] = useState(false);
  const [showMyActivityList, setShowMyActivityList] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [openPickerMoment, setOpenPickerMoment] = useState<MealMoment | null>(null);
  const [stagedProduct, setStagedProduct] = useState<{ opt: MealOption, currentKcal: number } | null>(null);
  const [pickerFilter, setPickerFilter] = useState<'all' | 'breakfast' | 'lunch' | 'diner' | 'snacks' | 'drink' | 'fruit' | 'alcohol'>('all');

  const [selectedActivityId, setSelectedActivityId] = useState<string>(ACTIVITY_TYPES[0].id);
  const [selectedCustomIds, setSelectedCustomIds] = useState<string[]>([]);
  const [selectedCustomActivityIds, setSelectedCustomActivityIds] = useState<string[]>([]);

  const [newFood, setNewFood] = useState({ name: '', kcal: '', unit: '', cats: [] as string[], isDrink: false });
  const [newActivityInput, setNewActivityInput] = useState({ name: '', kcalPerHour: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowWeeklyPopover(false);
      }
    };
    if (showWeeklyPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWeeklyPopover]);

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

  const minSafeDate = useMemo(() => {
    const maintenance = maintenanceKcal;
    const floor = state.profile.gender === 'man' ? 1500 : 1200;
    const maxDeficit = Math.min(1000, maintenance - floor);
    
    const weightToLose = globalLatestWeight - Number(state.profile.targetWeight);
    if (weightToLose <= 0) return new Date().toISOString().split('T')[0];
    
    const totalKcalToLose = weightToLose * KCAL_PER_KG_FAT;
    const minDaysNeeded = Math.ceil(totalKcalToLose / maxDeficit);
    
    const date = new Date();
    date.setDate(date.getDate() + minDaysNeeded);
    return date.toISOString().split('T')[0];
  }, [maintenanceKcal, globalLatestWeight, state.profile.targetWeight, state.profile.gender]);

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

  const weeklyStats = useMemo(() => {
    const stats = {
      totalIntake: 0,
      avgDailyIntake: 0,
      totalBurned: 0,
      weightChange: 0
    };
    
    const end = new Date(selectedDate);
    const windowWeights: {date: string, weight: number}[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const log = (state.dailyLogs[ds] as DailyLog);
      
      if (log) {
        const dayIntake = Object.values(log.meals || {}).reduce((acc, items) => 
          acc + (items as LoggedMealItem[]).reduce((sum, m) => sum + m.kcal, 0), 0);
        stats.totalIntake += dayIntake;
        
        const dayBurn = (log.activities || []).reduce((sum, a) => sum + (Number(a.burnedKcal) || 0), 0);
        stats.totalBurned += dayBurn;

        if (log.weight) {
          windowWeights.push({date: ds, weight: log.weight});
        }
      }
    }

    stats.avgDailyIntake = Math.round(stats.totalIntake / 7);
    
    if (windowWeights.length >= 2) {
      windowWeights.sort((a,b) => a.date.localeCompare(b.date));
      stats.weightChange = windowWeights[windowWeights.length - 1].weight - windowWeights[0].weight;
    }

    return stats;
  }, [state.dailyLogs, selectedDate]);

  const currentLog = useMemo(() => {
    return (state.dailyLogs[selectedDate] as DailyLog) || { meals: {}, activities: [] };
  }, [state.dailyLogs, selectedDate]);

  const dateParts = useMemo(() => {
    const d = new Date(selectedDate);
    const locale = state.language === 'nl' ? 'nl-NL' : (state.language === 'en' ? 'en-US' : state.language);
    const parts = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(d);
    return { 
      day: parts.find(p => p.type === 'day')?.value || '', 
      month: (parts.find(p => p.type === 'month')?.value || '').toUpperCase(), 
      weekday: (parts.find(p => p.type === 'weekday')?.value || '').toUpperCase() 
    };
  }, [selectedDate, state.language]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    const floor = (updates.gender || state.profile.gender) === 'man' ? 1500 : 1200;

    if (updates.customTargetDate && updates.customTargetDate < minSafeDate) {
      setToast({ msg: t.invalidDate, type: 'error' });
      return;
    }

    setState(prev => {
      const newProfile = { ...prev.profile, ...updates };
      let newBudget = newProfile.dailyBudget;

      if (newProfile.weightLossSpeed !== 'custom') {
        const speedMap: Record<string, number> = { slow: 0.25, average: 0.5, fast: 1.0 };
        const kgPerWeek = speedMap[newProfile.weightLossSpeed!] || 0.5;
        const dailyDeficit = (kgPerWeek * KCAL_PER_KG_FAT) / 7;
        const maintenance = calculateTDEE(newProfile, 0, globalLatestWeight);
        newBudget = Math.round(maintenance - dailyDeficit);
        newBudget = Math.max(newBudget, floor);
      } else if (newProfile.customTargetDate) {
        const profileWithWeight = { ...newProfile, currentWeight: globalLatestWeight };
        newBudget = calculateBudgetFromTargetDate(profileWithWeight, newProfile.customTargetDate);
        newBudget = Math.max(newBudget, floor);
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

  const updateMealItemKcal = (moment: string, itemId: string, newKcal: number) => {
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate];
      if (!log) return prev;
      const meals = { ...log.meals };
      if (!meals[moment]) return prev;
      meals[moment] = (meals[moment] as LoggedMealItem[]).map(item => 
        item.id === itemId ? { ...item, kcal: Math.max(0, newKcal) } : item
      );
      logs[selectedDate] = { ...log, meals };
      return { ...prev, dailyLogs: logs };
    });
  };

  const deleteCustomOptions = () => {
    if (selectedCustomIds.length === 0) return;
    setState(prev => {
      const newOptions = { ...prev.customOptions };
      MEAL_MOMENTS.forEach(moment => {
        if (newOptions[moment]) {
          newOptions[moment] = newOptions[moment].filter(opt => !selectedCustomIds.includes(opt.id));
        }
      });
      return { ...prev, customOptions: newOptions };
    });
    setSelectedCustomIds([]);
    setToast({ msg: t.removeItems });
  };

  const deleteCustomActivities = () => {
    if (selectedCustomActivityIds.length === 0) return;
    setState(prev => ({
      ...prev,
      customActivities: prev.customActivities.filter(act => !selectedCustomActivityIds.includes(act.id))
    }));
    setSelectedCustomActivityIds([]);
    setToast({ msg: t.removeItems });
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

  const addCustomActivity = () => {
    if (!newActivityInput.name || !newActivityInput.kcalPerHour) return;
    const newAct: any = {
      id: 'custom_act_' + generateId(),
      name: newActivityInput.name,
      met: 0,
      kcalPer60: Number(newActivityInput.kcalPerHour),
      unit: 'minuten',
      isCustom: true
    };
    setState(prev => ({
      ...prev,
      customActivities: [...(prev.customActivities || []), newAct]
    }));
    setNewActivityInput({ name: '', kcalPerHour: '' });
    setToast({ msg: t.newActivity + ' ' + t.save });
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
      } catch (err) { alert('Error loading file'); }
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
      if (c === 'ONTBIJT') finalCats.push('Ontbijt');
      else if (c === 'SNACK') finalCats.push('Ochtend Snack', 'Middag Snack', 'Avond Snack');
      else if (c === 'LUNCH') finalCats.push('Lunch');
      else if (c === 'DINER') finalCats.push('Diner');
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

  const allAvailableProducts = useMemo(() => {
    const seenIds = new Set<string>();
    const list: MealOption[] = [];
    MEAL_MOMENTS.forEach(m => {
      (state.customOptions[m] || []).forEach(o => {
        if (!seenIds.has(o.id)) {
          seenIds.add(o.id);
          list.push(o);
        }
      });
    });
    return list.sort((a, b) => getTranslatedName(a.id, a.name).localeCompare(getTranslatedName(b.id, b.name)));
  }, [state.customOptions, state.language]);

  const allProductsForManagement = useMemo(() => {
    return allAvailableProducts;
  }, [allAvailableProducts]);

  if (!isLoaded) return null;

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-white flex flex-col shadow-2xl relative overflow-hidden text-slate-900">
      {toast && <Toast message={toast.msg} type={toast.type} onHide={() => setToast(null)} />}
      
      {showInfo && (
        <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-md p-6 overflow-y-auto animate-in fade-in duration-300">
          <button onClick={() => setShowInfo(false)} className="fixed top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-500 active:scale-95 z-[210]"><X size={24}/></button>
          <div className="space-y-8 pb-12 max-w-sm mx-auto">
            <div className="pt-8">
              <h2 className="text-3xl font-black text-orange-500 uppercase tracking-tight leading-none mb-1">{t.infoModal.title}</h2>
              <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">My Healthy Planning</p>
            </div>

            <section className="space-y-3">
              <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-4 border-orange-200 pl-4">
                {t.infoModal.aboutText}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-orange-500" /> {t.infoModal.scienceTitle}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {t.infoModal.scienceText}
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Settings size={14} className="text-orange-500" /> {t.infoModal.manualTitle}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {t.infoModal.steps.map((step: any, i: number) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-[20px] border border-slate-100 flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-black shrink-0 text-xs shadow-sm">{i+1}</span>
                    <div className="flex flex-col">
                      <h4 className="font-black text-[10px] text-slate-800 uppercase tracking-widest">{step.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-red-50 p-5 rounded-[24px] border border-red-100 space-y-2">
              <h3 className="font-black text-[10px] text-red-600 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} /> {t.infoModal.disclaimerTitle}
              </h3>
              <p className="text-[10px] text-red-400 font-medium leading-relaxed">
                {t.infoModal.disclaimerText}
              </p>
            </section>

            <footer className="pt-8 border-t border-slate-100 flex flex-col items-center gap-3 opacity-40">
               <Target size={32} className="text-slate-300" />
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center px-4 leading-relaxed">
                 {t.infoModal.copyright}
               </p>
            </footer>
          </div>
        </div>
      )}

      <header className="bg-white sticky top-0 z-40 p-4 px-5 border-b border-slate-50 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
             <h1 className="text-2xl font-black text-orange-500 leading-none mb-1">{t.title}</h1>
             <h2 className="text-[11px] font-black text-slate-400 tracking-[0.15em] uppercase">{t.subtitle}</h2>
          </div>
          <div className="flex items-center gap-2.5 relative">
             <div className="relative">
                <select 
                  value={state.language} 
                  onChange={(e) => setState(prev => ({ ...prev, language: e.target.value as Language }))} 
                  className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 text-[10px] font-black appearance-none pr-7 outline-none uppercase shadow-sm active:bg-slate-100"
                >
                  {Object.keys(LANGUAGE_FLAGS).map(l => <option key={l} value={l}>{LANGUAGE_FLAGS[l as Language]} {l.toUpperCase()}</option>)}
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
             
             {/* Interactive Weight Button & Popover */}
             <div className="relative" ref={popoverRef}>
               <button 
                  onClick={() => setShowWeeklyPopover(!showWeeklyPopover)}
                  className={`bg-white border px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${showWeeklyPopover ? 'border-orange-500 bg-orange-50/20' : 'border-slate-100'}`}
               >
                  <TrendingDown size={12} className="text-orange-400" />
                  <span className="text-sm font-black tabular-nums">{globalLatestWeight.toFixed(1)} <span className="text-[8px] text-slate-300 uppercase">KG</span></span>
                  <ChevronDown size={10} className={`text-slate-400 transition-transform ${showWeeklyPopover ? 'rotate-180' : ''}`} />
               </button>

               {/* Weekly Summary Popover */}
               {showWeeklyPopover && (
                 <div className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-5 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarDays size={16} className="text-orange-500" />
                      <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-800">{t.weeklySummary}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                       <div className="bg-slate-50/50 p-3 rounded-[18px] border border-slate-50 flex justify-between items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest shrink">{t.totalIntake}</span>
                          <span className="text-sm font-black text-slate-700 tabular-nums whitespace-nowrap shrink-0 ml-2">
                            {weeklyStats.totalIntake.toLocaleString()} <span className="text-[8px] font-bold uppercase ml-0.5">KCAL</span>
                          </span>
                       </div>
                       <div className="bg-slate-50/50 p-3 rounded-[18px] border border-slate-50 flex justify-between items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest shrink">{t.avgDaily}</span>
                          <span className="text-sm font-black text-slate-700 tabular-nums whitespace-nowrap shrink-0 ml-2">
                            {weeklyStats.avgDailyIntake.toLocaleString()} <span className="text-[8px] font-bold uppercase ml-0.5">KCAL</span>
                          </span>
                       </div>
                       <div className="bg-slate-50/50 p-3 rounded-[18px] border border-slate-50 flex justify-between items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest shrink">{t.totalBurn}</span>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <Flame size={12} className="text-emerald-500" />
                            <span className="text-sm font-black text-emerald-500 tabular-nums whitespace-nowrap">
                              {weeklyStats.totalBurned.toLocaleString()} <span className="text-[8px] font-bold uppercase ml-0.5">KCAL</span>
                            </span>
                          </div>
                       </div>
                       <div className="bg-slate-50/50 p-3 rounded-[18px] border border-slate-50 flex justify-between items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest shrink">{t.weeklyWeightChange}</span>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <Scale size={12} className={weeklyStats.weightChange <= 0 ? "text-emerald-500" : "text-red-500"} />
                            <span className={`text-sm font-black tabular-nums whitespace-nowrap ${weeklyStats.weightChange <= 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {weeklyStats.weightChange > 0 ? '+' : ''}{weeklyStats.weightChange.toFixed(1)} <span className="text-[9px] font-black uppercase ml-0.5">KG</span>
                            </span>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
             </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-1 bg-slate-50/30 rounded-2xl py-1">
          <button 
            onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} 
            className="p-2 text-slate-300 active:text-orange-500 transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          
          <div className="flex items-center gap-3">
             <span className="text-4xl font-black text-orange-500 tabular-nums leading-none tracking-tighter">
               {dateParts.day}
             </span>
             <div className="flex flex-col leading-tight pt-0.5">
               <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.1em]">
                 {dateParts.weekday}
               </span>
               <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
                 {dateParts.month}
               </span>
             </div>
          </div>
          
          <button 
            onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} 
            className="p-2 text-slate-300 active:text-orange-500 transition-colors"
          >
            <ChevronRight size={24} strokeWidth={3} />
          </button>
        </div>
      </header>

      <main className="p-2 flex-grow overflow-y-auto pb-24 custom-scrollbar bg-slate-50/10">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-3 py-2 animate-in fade-in duration-500 min-h-full">
            <div className="bg-orange-50/40 rounded-[32px] p-4 border border-orange-100/50 flex items-center justify-between shadow-sm">
               <div className="flex flex-col">
                 <span className="text-orange-400 text-[12px] font-black uppercase tracking-widest mb-1">{t.targetReached}</span>
                 <h2 className="text-xl font-black tracking-tight">{totals.targetDate ? new Intl.DateTimeFormat(state.language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(totals.targetDate)) : '--'}</h2>
               </div>
               <div className="relative">
                 <Target size={32} className="text-orange-200" />
               </div>
            </div>

            <div className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm space-y-4">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><Zap size={16} className="text-amber-400 fill-amber-400" /><h3 className="font-black text-[12px] uppercase tracking-widest text-slate-400">{t.dailyBudget}</h3></div>
                  <span className="text-[13px] font-black text-orange-500 uppercase tracking-wide">{totals.actualIntake} / {totals.currentAdjustedGoal} KCAL</span>
               </div>
               <div className="flex items-center justify-center gap-3 bg-slate-50/70 py-4 rounded-[20px] font-black tabular-nums tracking-tighter">
                  <span className="text-3xl text-slate-300">{totals.intakeGoal}</span>
                  <span className="text-3xl text-emerald-500">+ {totals.activityBurn}</span>
                  <span className="text-3xl text-orange-500">= {totals.currentAdjustedGoal}</span>
               </div>
               <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                  <div className={`h-full transition-all duration-1000 ${totals.calorieStatusColor}`} style={{ width: `${Math.min(totals.intakePercent, 100)}%` }} />
               </div>
               <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.remainingToday}</span>
                    <span className="text-2xl font-black text-orange-500 tabular-nums leading-none">{Math.max(0, totals.currentAdjustedGoal - totals.actualIntake)}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.caloriesPerDay}</span>
                    <span className="text-2xl font-black text-orange-500 tabular-nums leading-none">{totals.intakeGoal}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.activityCalories.toUpperCase()}</span>
                    <span className="text-2xl font-black text-orange-500 tabular-nums leading-none">{totals.activityBurn}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.consumedTodayLabel.toUpperCase()}</span>
                    <span className="text-2xl font-black text-orange-500 tabular-nums leading-none">{Math.round(totals.intakePercent)}%</span>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm space-y-4">
               <h3 className="font-black text-[12px] uppercase tracking-widest text-slate-400">{t.myJourney}</h3>
               <div className="grid grid-cols-3 text-center gap-2">
                 <div className="flex flex-col"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.startWeight}</span><span className="text-[14px] font-black text-slate-700">{state.profile.startWeight} KG</span></div>
                 <div className="flex flex-col"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.nowWeight}</span><span className="text-[14px] font-black text-orange-500">{globalLatestWeight.toFixed(1)} KG</span></div>
                 <div className="flex flex-col"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.goalWeight}</span><span className="text-[14px] font-black text-slate-700">{state.profile.targetWeight} KG</span></div>
               </div>
               <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${totals.weightProgressPercent}%` }} />
               </div>
            </div>

            <div className="bg-white rounded-[28px] p-4 border border-slate-100 shadow-sm flex items-center justify-between mb-4">
              <div className="flex items-center gap-3"><div className="bg-orange-50 p-2 rounded-[16px] text-orange-500 shadow-sm"><Scale size={20} /></div><h3 className="font-black text-[12px] uppercase tracking-widest text-slate-400">{t.weighMoment.toUpperCase()}</h3></div>
              <div className="flex items-center gap-2 bg-slate-50 p-2 px-4 rounded-[20px] border border-slate-100 shadow-inner max-w-[130px]">
                <input type="number" step="0.1" placeholder="00.0" value={(state.dailyLogs[selectedDate] as DailyLog)?.weight || ''} onChange={(e) => {
                   const val = e.target.value ? Number(e.target.value) : undefined;
                   setState(prev => {
                     const logs = { ...prev.dailyLogs };
                     logs[selectedDate] = { ...((logs[selectedDate] as DailyLog) || { date: selectedDate, meals: {}, activities: [] }), weight: val };
                     return { ...prev, dailyLogs: logs };
                   });
                }} className="w-full bg-transparent border-none p-0 text-xl font-black text-orange-500 focus:ring-0 text-right placeholder:text-slate-200" /><span className="text-[10px] font-black text-slate-300 uppercase">kg</span>
              </div>
            </div>
          </div>
        )}

        {/* Eten & Drinken Tab */}
        {activeTab === 'meals' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300 min-h-full">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-[#1e293b] tracking-tight uppercase">{t.mealSchedule}</h2>
              <button onClick={() => setShowMyList(!showMyList)} className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[10px] uppercase shadow-sm transition-all border ${showMyList ? 'bg-[#ff7300] text-white border-[#ff7300]' : 'bg-white text-[#ff7300] border-slate-200'}`}>
                <ListFilter size={16} className={showMyList ? 'text-white' : 'text-[#ff7300]'} /> {t.myList.toUpperCase()}
              </button>
            </div>

            {showMyList ? (
              <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex gap-2">
                    <button onClick={() => setNewFood(p => ({...p, isDrink: false}))} className={`flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 border transition-all font-black text-[11px] uppercase ${!newFood.isDrink ? 'border-[#ff7300] text-[#ff7300] bg-white' : 'border-slate-100 text-slate-300 bg-slate-50/50'}`}>
                      <Utensils size={18} className={!newFood.isDrink ? 'text-[#ff7300]' : 'text-slate-200'} /> {t.mealLabel}
                    </button>
                    <button onClick={() => setNewFood(p => ({...p, isDrink: true}))} className={`flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 border transition-all font-black text-[11px] uppercase ${newFood.isDrink ? 'border-[#ff7300] text-[#ff7300] bg-white' : 'border-slate-100 text-slate-300 bg-slate-50/50'}`}>
                      <GlassWater size={18} className={newFood.isDrink ? 'text-[#ff7300]' : 'text-slate-200'} /> {t.drinkLabel}
                    </button>
                  </div>

                  <input type="text" placeholder={t.productName} value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl font-black text-[12px] uppercase placeholder:text-slate-300 outline-none" />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder={t.kcalLabel} value={newFood.kcal} onChange={e => setNewFood({...newFood, kcal: e.target.value})} className="bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl font-black text-[12px] uppercase placeholder:text-slate-300 outline-none" />
                    <input type="text" placeholder={t.portionPlaceholder} value={newFood.unit} onChange={e => setNewFood({...newFood, unit: e.target.value})} className="bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl font-black text-[12px] uppercase placeholder:text-slate-300 outline-none" />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {['ONTBIJT', 'LUNCH', 'DINER', 'SNACK'].map(m => {
                      const isSnack = m === 'SNACK';
                      const isSelected = newFood.cats.includes(m);
                      return (
                        <button 
                          key={m} 
                          onClick={() => setNewFood(p => ({...p, cats: p.cats.includes(m) ? p.cats.filter(x => x!==m) : [...p.cats, m]}))} 
                          className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase border transition-all ${
                            isSelected 
                              ? isSnack ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-white border-[#ff7300] text-[#ff7300]' 
                              : isSnack ? 'bg-amber-50 text-slate-400 border-amber-100' : 'bg-white text-slate-300 border-slate-100'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={addCustomFood} disabled={!newFood.name || !newFood.kcal || newFood.cats.length === 0} className={`w-full py-4 rounded-2xl font-black text-[12px] uppercase flex items-center justify-center gap-2 transition-all ${(!newFood.name || !newFood.kcal || newFood.cats.length === 0) ? 'bg-[#cbd5e1] text-white' : 'bg-[#ff7300] text-white active:scale-95 shadow-xl shadow-orange-100'}`}>
                    <Plus size={18} strokeWidth={4} /> {t.addToMyList}
                  </button>
                </div>

                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">{t.manageDb}</h3>
                      <p className="text-[7px] font-bold text-slate-300 uppercase">{t.removeItems}</p>
                    </div>
                    {selectedCustomIds.length > 0 && (
                      <button onClick={deleteCustomOptions} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-xl font-black text-[9px] uppercase active:scale-95 transition-all animate-in zoom-in duration-200">
                        <Trash2 size={14} /> {t.delete} ({selectedCustomIds.length})
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {allProductsForManagement.map(opt => (
                      <div key={opt.id} className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-[20px] border border-slate-50 group hover:border-orange-100 transition-all">
                        <div className="relative flex items-center justify-center shrink-0">
                          <input 
                            type="checkbox" 
                            checked={selectedCustomIds.includes(opt.id)}
                            onChange={() => setSelectedCustomIds(prev => prev.includes(opt.id) ? prev.filter(id => id !== opt.id) : [...prev, opt.id])}
                            className="w-5 h-5 rounded-md border-slate-200 text-[#ff7300] focus:ring-[#ff7300] transition-all cursor-pointer"
                          />
                        </div>
                        <div className="flex flex-col flex-grow truncate">
                           <span className="text-[11px] font-black text-[#1e293b] uppercase truncate leading-none mb-1">
                             {getTranslatedName(opt.id, opt.name)}
                           </span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                             {opt.kcal} {t.kcalLabel} • {opt.unitName} {opt.isCustom ? '• EIGEN' : ''}
                           </span>
                        </div>
                        <button 
                          onClick={() => { setSelectedCustomIds([opt.id]); setTimeout(deleteCustomOptions, 0); }} 
                          className="text-slate-200 active:text-red-500 transition-colors p-2 shrink-0"
                        >
                           <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {allProductsForManagement.length === 0 && (
                      <p className="text-center py-8 text-[10px] font-black uppercase tracking-widest text-slate-300">{t.noDataYet}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col flex-grow relative">
                <div className="relative shrink-0">
                   {openPickerMoment ? (
                     <div className="bg-white rounded-[28px] p-4 border border-slate-100 shadow-sm animate-in slide-in-from-top duration-300">
                        <div className="flex justify-between items-center mb-3">
                           <h3 className="font-black text-[14px] text-[#1e293b] uppercase tracking-widest">{t.moments[openPickerMoment]}</h3>
                           <button onClick={() => { setOpenPickerMoment(null); setStagedProduct(null); setSearchTerm(''); setPickerFilter('all'); }} className="p-1.5 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all"><X size={16}/></button>
                        </div>
                        
                        {!stagedProduct ? (
                          <>
                            <div className="flex justify-between items-center w-full gap-1 mb-4 overflow-x-auto pb-1 no-scrollbar">
                               {[
                                 { id: 'all', icon: LayoutDashboard, label: 'ALLES' },
                                 { id: 'breakfast', icon: Sun, label: 'ONTBIJT' },
                                 { id: 'lunch', icon: Utensils, label: 'LUNCH' },
                                 { id: 'diner', icon: Moon, label: 'DINER' },
                                 { id: 'snacks', icon: Cookie, label: 'SNACKS' },
                                 { id: 'drink', icon: GlassWater, label: 'DRINKEN' },
                                 { id: 'alcohol', icon: Beer, label: 'ALCOHOL' },
                                 { id: 'fruit', icon: Cherry, label: 'FRUIT' }
                               ].map(f => (
                                 <button 
                                   key={f.id} 
                                   onClick={() => setPickerFilter(f.id as any)} 
                                   className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all shrink-0 min-w-[58px] ${
                                     pickerFilter === f.id ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-slate-50 text-slate-300 border-transparent hover:bg-slate-100'
                                   }`}
                                 >
                                   <f.icon size={18} />
                                   <span className="text-[7px] font-black uppercase tracking-tighter">{f.label}</span>
                                 </button>
                               ))}
                            </div>

                            <div className="relative bg-[#f8fafc] border border-slate-100 rounded-[22px] px-5 py-3 flex items-center gap-3 mb-2">
                               <Search size={18} className="text-slate-300" />
                               <input type="text" className="bg-transparent border-none text-[13px] w-full focus:ring-0 font-black uppercase placeholder:text-slate-300 outline-none" placeholder={t.searchProduct} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-1 border-t border-slate-50 pt-3">
                              {(state.customOptions[openPickerMoment] || [])
                                .filter(o => {
                                  const name = getTranslatedName(o.id, o.name).toLowerCase();
                                  const matchesSearch = name.includes(searchTerm.toLowerCase());
                                  
                                  if (pickerFilter === 'all') return matchesSearch;

                                  // DETERMINISTISCHE FILTERS OP BASIS VAN PREFIX + CUSTOM CHECK
                                  let matchesFilter = true;
                                  const isCustom = o.id.startsWith('cust_');
                                  
                                  if (pickerFilter === 'breakfast') {
                                    matchesFilter = o.id.startsWith('b_') || (isCustom && openPickerMoment === 'Ontbijt');
                                  }
                                  else if (pickerFilter === 'lunch') {
                                    matchesFilter = o.id.startsWith('l_') || (isCustom && openPickerMoment === 'Lunch');
                                  }
                                  else if (pickerFilter === 'diner') {
                                    matchesFilter = o.id.startsWith('m_') || (isCustom && openPickerMoment === 'Diner');
                                  }
                                  else if (pickerFilter === 'drink') {
                                    matchesFilter = o.id.startsWith('d_') || o.isDrink;
                                  }
                                  else if (pickerFilter === 'alcohol') {
                                    matchesFilter = o.id.startsWith('a_') || o.isAlcohol;
                                  }
                                  else if (pickerFilter === 'fruit') {
                                    matchesFilter = o.id.startsWith('f_');
                                  }
                                  else if (pickerFilter === 'snacks') {
                                    matchesFilter = o.id.startsWith('s_') || (isCustom && openPickerMoment.includes('Snack'));
                                  }
                                  
                                  return matchesSearch && matchesFilter;
                                })
                                .map(opt => (
                                  <button key={opt.id} onClick={() => setStagedProduct({ opt, currentKcal: opt.kcal })} className="w-full text-left px-4 py-3.5 hover:bg-orange-50/50 rounded-2xl flex items-center justify-between group transition-all border border-transparent hover:border-orange-100">
                                    <div className="flex items-center gap-3 truncate">
                                      <div className="bg-slate-50 p-2 rounded-xl text-slate-400 group-hover:bg-white group-hover:text-[#ff7300] transition-colors">
                                        {opt.isAlcohol ? <Beer size={16} /> : opt.isDrink ? <GlassWater size={16} /> : <Utensils size={16} />}
                                      </div>
                                      <div className="flex flex-col truncate leading-none">
                                        <span className="text-[12px] font-black text-[#1e293b] uppercase truncate mb-0.5">{getTranslatedName(opt.id, opt.name)}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{opt.kcal} {t.kcalLabel} • {opt.unitName}</span>
                                      </div>
                                    </div>
                                    <ChevronRight size={16} className="text-[#ff7300] opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </button>
                                ))
                              }
                            </div>
                          </>
                        ) : (
                          <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                             <div className="flex items-center gap-3">
                                <div className="bg-white p-2.5 rounded-[16px] text-[#ff7300] shadow-sm">
                                  {stagedProduct.opt.isAlcohol ? <Beer size={20} /> : stagedProduct.opt.isDrink ? <GlassWater size={20} /> : <Utensils size={20} />}
                                </div>
                                <div className="flex flex-col truncate">
                                  <span className="text-[13px] font-black text-[#1e293b] uppercase truncate">{getTranslatedName(stagedProduct.opt.id, stagedProduct.opt.name)}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{stagedProduct.opt.unitName}</span>
                                </div>
                             </div>

                             <div className="flex flex-col gap-1.5">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{t.adjustQuantity}</label>
                               <div className="flex items-center justify-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                  <button onClick={() => setStagedProduct(p => p ? {...p, currentKcal: Math.max(0, p.currentKcal - 50)} : p)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-[#ff7300] rounded-full active:scale-90 transition-transform"><Minus size={20} strokeWidth={4}/></button>
                                  <div className="flex items-center gap-1">
                                    <input type="number" className="w-20 bg-transparent border-none p-0 text-2xl font-black text-[#ff7300] focus:ring-0 text-center" value={stagedProduct.currentKcal} onChange={(e) => setStagedProduct(p => p ? {...p, currentKcal: Number(e.target.value)} : p)} />
                                    <span className="text-[10px] font-black text-slate-300 uppercase">{t.kcalLabel.toLowerCase()}</span>
                                  </div>
                                  <button onClick={() => setStagedProduct(p => p ? {...p, currentKcal: p.currentKcal + 50} : p)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-[#ff7300] rounded-full active:scale-90 transition-transform"><Plus size={20} strokeWidth={4}/></button>
                               </div>
                             </div>

                             <button onClick={() => {
                                addMealItem(openPickerMoment, { name: stagedProduct.opt.name, kcal: stagedProduct.currentKcal, quantity: 1, mealId: stagedProduct.opt.id, isDrink: stagedProduct.opt.isDrink, isAlcohol: stagedProduct.opt.isAlcohol });
                                setOpenPickerMoment(null);
                                setStagedProduct(null);
                                setSearchTerm('');
                                setPickerFilter('all');
                                setToast({msg: `${getTranslatedName(stagedProduct.opt.id, stagedProduct.opt.name)} ${t.save}`});
                             }} className="w-full py-4 bg-[#ff7300] text-white rounded-2xl font-black text-[14px] uppercase shadow-lg shadow-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                               OK <Check size={18} strokeWidth={4} />
                             </button>
                          </div>
                        )}
                     </div>
                   ) : (
                     <div className="relative">
                        <select 
                          className="w-full bg-white px-6 py-5 rounded-[28px] font-black border border-slate-100 text-[14px] outline-none appearance-none cursor-pointer uppercase tracking-widest shadow-sm text-[#1e293b]"
                          onChange={(e) => { setOpenPickerMoment(e.target.value as MealMoment); setStagedProduct(null); setSearchTerm(''); setPickerFilter('all'); }}
                          value=""
                        >
                          <option value="" disabled>{t.addFoodDrink}</option>
                          {MEAL_MOMENTS.map(moment => <option key={moment} value={moment}>{t.moments[moment]}</option>)}
                        </select>
                        <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#ff7300] pointer-events-none" />
                     </div>
                   )}
                </div>

                <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pt-1">
                  {MEAL_MOMENTS.map(moment => {
                    const items = (currentLog.meals[moment] as LoggedMealItem[]) || [];
                    if (items.length === 0) return null;
                    return (
                      <div key={moment} className="bg-white rounded-[28px] p-4 border border-slate-100 shadow-sm space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest px-2 pb-1 border-b border-orange-50 mb-2">
                          {t.moments[moment] || moment}
                        </h4>
                        <div className="space-y-2">
                          {items.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-50/50 p-2 px-3 rounded-[20px] border border-slate-50">
                              <div className="flex items-center gap-3 truncate flex-1">
                                <div className="bg-white p-1.5 rounded-[12px] text-[#ff7300] shrink-0 shadow-sm border border-orange-50">
                                  {item.isAlcohol ? <Beer size={14} /> : item.isDrink ? <GlassWater size={14} /> : <Utensils size={14} />}
                                </div>
                                <span className="text-[11px] font-black text-[#1e293b] uppercase truncate leading-none">{getTranslatedName(item.mealId || '', item.name)}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-white p-1 px-2 rounded-xl border border-slate-100 shadow-inner">
                                  <button onClick={() => updateMealItemKcal(moment, item.id, item.kcal - 50)} className="text-[#ff7300] active:scale-90 transition-transform"><Minus size={12} strokeWidth={3} /></button>
                                  <div className="flex items-center gap-0.5">
                                    <input 
                                      type="number" 
                                      className="w-10 bg-transparent border-none p-0 text-[12px] font-black text-[#ff7300] focus:ring-0 text-center outline-none" 
                                      value={Math.round(item.kcal)} 
                                      onChange={(e) => updateMealItemKcal(moment, item.id, Number(e.target.value))}
                                    />
                                    <span className="text-[7px] font-black text-slate-300 uppercase">{t.kcalLabel.toLowerCase()}</span>
                                  </div>
                                  <button onClick={() => updateMealItemKcal(moment, item.id, item.kcal + 50)} className="text-[#ff7300] active:scale-90 transition-transform"><Plus size={12} strokeWidth={3} /></button>
                                </div>
                                
                                <button onClick={() => {
                                    setState(prev => {
                                      const logs = { ...prev.dailyLogs };
                                      const log = logs[selectedDate];
                                      if (log) log.meals[moment] = (log.meals[moment] as LoggedMealItem[]).filter(i => i.id !== item.id);
                                      return { ...prev, dailyLogs: logs };
                                    });
                                }} className="text-slate-200 p-1 shrink-0 transition-colors active:text-red-500"><Trash2 size={14}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(currentLog.meals).length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                      <Utensils size={48} className="text-slate-300 mb-4" />
                      <p className="text-[11px] font-black uppercase tracking-widest">{t.nothingPlanned}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-4 animate-in fade-in duration-300 min-h-full flex flex-col">
            <div className="flex justify-between items-center px-1">
               <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">{t.movement}</h2>
               <button onClick={() => setShowMyActivityList(!showMyActivityList)} className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[10px] uppercase shadow-sm border transition-all ${showMyActivityList ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-500 border-slate-200'}`}>
                 <ListFilter size={16} /> {t.myList.toUpperCase()}
               </button>
            </div>

            {showMyActivityList ? (
              <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">{t.newActivity}</h3>
                  <div className="space-y-3">
                    <div className="relative bg-[#f8fafc] border border-slate-100 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                       <Activity size={18} className="text-slate-300" />
                       <input type="text" placeholder={t.activityName} value={newActivityInput.name} onChange={e => setNewActivityInput({...newActivityInput, name: e.target.value})} className="bg-transparent border-none text-[12px] w-full focus:ring-0 font-black uppercase placeholder:text-slate-300 outline-none" />
                    </div>
                    <div className="relative bg-[#f8fafc] border border-slate-100 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                       <Clock size={18} className="text-slate-300" />
                       <input type="number" placeholder={t.kcalPerHour} value={newActivityInput.kcalPerHour} onChange={e => setNewActivityInput({...newActivityInput, kcalPerHour: e.target.value})} className="bg-transparent border-none text-[12px] w-full focus:ring-0 font-black uppercase placeholder:text-slate-300 outline-none" />
                    </div>
                  </div>
                  <button onClick={addCustomActivity} disabled={!newActivityInput.name || !newActivityInput.kcalPerHour} className={`w-full py-4 rounded-2xl font-black text-[12px] uppercase flex items-center justify-center gap-2 transition-all ${(!newActivityInput.name || !newActivityInput.kcalPerHour) ? 'bg-[#cbd5e1] text-white' : 'bg-orange-500 text-white active:scale-95 shadow-xl shadow-orange-100'}`}>
                    <Plus size={18} strokeWidth={4} /> {t.addToMyList}
                  </button>
                </div>

                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">{t.ownActivities}</h3>
                    {selectedCustomActivityIds.length > 0 && (
                      <button onClick={deleteCustomActivities} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-xl font-black text-[9px] uppercase active:scale-95 transition-all">
                        <Trash2 size={14} /> {t.delete} ({selectedCustomActivityIds.length})
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {(state.customActivities || []).map(act => (
                      <div key={act.id} className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-[20px] border border-slate-50 group hover:border-orange-100 transition-all">
                        <input 
                          type="checkbox" 
                          checked={selectedCustomActivityIds.includes(act.id)}
                          onChange={() => setSelectedCustomActivityIds(prev => prev.includes(act.id) ? prev.filter(id => id !== act.id) : [...prev, act.id])}
                          className="w-5 h-5 rounded-md border-slate-200 text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
                        />
                        <div className="flex flex-col flex-grow truncate">
                           <span className="text-[11px] font-black text-slate-800 uppercase truncate leading-none mb-1">{act.name}</span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none">{(act as any).kcalPer60} {t.kcalLabel} / {t.timeGroups.afternoon}</span>
                        </div>
                        <button onClick={() => { setSelectedCustomActivityIds([act.id]); setTimeout(deleteCustomActivities, 0); }} className="text-slate-200 active:text-red-500 transition-colors p-2">
                           <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(state.customActivities || []).length === 0 && (
                      <p className="text-center py-8 text-[10px] font-black uppercase tracking-widest text-slate-300">{t.noDataYet}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[28px] p-6 border border-slate-100 space-y-4 shadow-inner flex flex-col flex-grow">
                 <div className="relative">
                   <select value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-black border border-slate-100 text-[13px] outline-none appearance-none cursor-pointer uppercase shadow-sm pr-10">
                     {[...ACTIVITY_TYPES, ...(state.customActivities || [])].map(act => <option key={act.id} value={act.id}>{getTranslatedName(act.id, act.name)}</option>)}
                   </select>
                   <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" />
                 </div>
                 
                 <div className="flex gap-3">
                   <div className="relative flex-grow">
                     <input id="act-val" type="number" placeholder={t.minutes} className="w-full bg-slate-50 p-4 rounded-2xl font-black border border-slate-100 text-[13px] outline-none text-center shadow-sm placeholder:text-slate-200" />
                   </div>
                   <button onClick={() => { const val = (document.getElementById('act-val') as HTMLInputElement).value; if (val) { addActivity(selectedActivityId, Number(val)); (document.getElementById('act-val') as HTMLInputElement).value = ''; } }} className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center"><Plus size={24} strokeWidth={4} /></button>
                 </div>

                 <div className="flex-grow space-y-2 overflow-y-auto custom-scrollbar pt-2 pr-1">
                    {currentLog.activities.map(act => {
                      const type = [...ACTIVITY_TYPES, ...(state.customActivities || [])].find(t => t.id === act.typeId);
                      return (
                        <div key={act.id} className="bg-white p-4 rounded-[22px] border border-slate-100 shadow-sm flex justify-between items-center animate-in fade-in slide-in-from-left-2 duration-300">
                          <div className="flex items-center gap-3">
                             <div className="bg-orange-50 p-2 rounded-xl text-orange-500">
                               <Activity size={18} />
                             </div>
                             <div className="flex flex-col leading-tight">
                               <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{getTranslatedName(act.typeId, type?.name || '')}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wide">{act.value} {t.minutes} • <span className="text-emerald-500">+{Math.round(act.burnedKcal)} {t.kcalLabel}</span></span>
                             </div>
                          </div>
                          <button onClick={() => setState(prev => {
                             const logs = { ...prev.dailyLogs };
                             const log = logs[selectedDate];
                             if (log) log.activities = log.activities.filter(a => a.id !== act.id);
                             return { ...prev, dailyLogs: logs };
                          })} className="text-slate-200 active:text-red-500 p-2 transition-colors"><Trash2 size={18}/></button>
                        </div>
                      );
                    })}
                    {currentLog.activities.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Activity size={48} className="text-slate-300 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">{t.noDataYet}</p>
                      </div>
                    )}
                 </div>
              </div>
            )}
          </div>
        )}

        {/* IK Tab */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-300 h-full">
             <section className="bg-white rounded-[24px] p-3 border border-slate-100 shadow-sm space-y-3 shrink-0">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[12px] font-black text-slate-800 uppercase tracking-widest leading-none">{t.gender}</label>
                   <button onClick={() => setShowInfo(true)} className="p-1.5 bg-slate-50 rounded-full text-slate-400 active:scale-95 shadow-sm transition-all hover:bg-slate-100"><Info size={16}/></button>
                </div>
                <div className="flex gap-2 px-1">
                  <button onClick={() => updateProfile({ gender: 'man' })} className={`flex-1 py-3 rounded-[16px] font-black text-[11px] uppercase border transition-all ${state.profile.gender === 'man' ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-slate-50 text-slate-300 border-transparent opacity-60'}`}>{t.man}</button>
                  <button onClick={() => updateProfile({ gender: 'woman' })} className={`flex-1 py-3 rounded-[16px] font-black text-[11px] uppercase border transition-all ${state.profile.gender === 'woman' ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-slate-50 text-slate-300 border-transparent opacity-60'}`}>{t.woman}</button>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1 px-1">
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block text-center leading-none">{t.age.split(' ')[0]}</label>
                    <div className="relative">
                      <select value={state.profile.birthYear} onChange={(e) => updateProfile({ birthYear: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 py-2.5 px-1 rounded-xl font-black text-[13px] outline-none appearance-none text-center shadow-inner">{birthYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
                      <ChevronDown size={6} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block text-center leading-none">{t.height.split(' ')[0]}</label>
                    <input type="number" value={state.profile.height} onChange={(e) => updateProfile({ height: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 py-2.5 px-1 rounded-xl font-black text-[13px] outline-none text-center shadow-inner" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block text-center leading-none">{t.startWeight.split(' ')[0]}</label>
                    <input type="number" value={state.profile.startWeight} onChange={(e) => updateProfile({ startWeight: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 py-2.5 px-1 rounded-xl font-black text-[13px] outline-none text-center shadow-inner" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-orange-400 uppercase tracking-widest block text-center leading-none">{t.targetWeight.split(' ')[0]}</label>
                    <input type="number" value={state.profile.targetWeight} onChange={(e) => updateProfile({ targetWeight: Number(e.target.value) })} className="w-full bg-orange-50 border border-orange-200 py-2.5 px-1 rounded-xl font-black text-[13px] outline-none text-orange-600 text-center shadow-inner" />
                  </div>
                </div>
             </section>

             <section className="bg-white rounded-[24px] p-3 border border-slate-100 shadow-sm space-y-2.5 shrink-0">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest block px-1 leading-none">{t.activityLevelLabel}</label>
                <div className="grid grid-cols-3 gap-2 px-1">
                  {[
                    { id: 'light', icon: Laptop, label: t.levelLight },
                    { id: 'moderate', icon: Briefcase, label: t.levelModerate },
                    { id: 'heavy', icon: Hammer, label: t.levelHeavy }
                  ].map(lvl => (
                    <button key={lvl.id} onClick={() => updateProfile({ activityLevel: lvl.id as any })} className={`flex flex-col items-center justify-center p-2 rounded-[14px] border transition-all ${state.profile.activityLevel === lvl.id ? 'bg-white border-orange-500 shadow-md scale-100' : 'bg-slate-50 border-transparent opacity-40 scale-[0.98]'}`}>
                      <lvl.icon size={16} className={state.profile.activityLevel === lvl.id ? 'text-orange-500' : 'text-slate-300'} />
                      <span className={`text-[9px] font-black uppercase mt-1.5 tracking-tight text-center leading-tight ${state.profile.activityLevel === lvl.id ? 'text-slate-800' : 'text-slate-300'}`}>{lvl.label}</span>
                    </button>
                  ))}
                </div>
             </section>

             <section className="bg-white rounded-[24px] p-3 border border-slate-100 shadow-sm space-y-2.5 shrink-0">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest block px-1 leading-none">{t.paceTitle}</label>
                <div className="grid grid-cols-3 gap-2 px-1">
                  {[
                    { id: 'slow', icon: Turtle, label: t.speedSlow },
                    { id: 'average', icon: Footprints, label: t.speedAverage },
                    { id: 'fast', icon: Flame, label: t.speedFast }
                  ].map(sp => (
                    <button key={sp.id} onClick={() => updateProfile({ weightLossSpeed: sp.id as any })} className={`flex flex-col items-center justify-center p-2 rounded-[14px] border transition-all ${state.profile.weightLossSpeed === sp.id ? 'bg-white border-orange-500 shadow-md scale-100' : 'bg-slate-50 border-transparent opacity-40 scale-[0.98]'}`}>
                      <sp.icon size={16} className={state.profile.weightLossSpeed === sp.id ? 'text-orange-500' : 'text-slate-300'} />
                      <span className={`text-[9px] font-black uppercase mt-1.5 tracking-tight text-center leading-tight ${state.profile.weightLossSpeed === sp.id ? 'text-slate-800' : 'text-slate-300'}`}>{sp.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => updateProfile({ weightLossSpeed: 'custom' })} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] border transition-all ${state.profile.weightLossSpeed === 'custom' ? 'bg-white border-orange-500 shadow-sm' : 'bg-slate-50 border-transparent opacity-40'}`}>
                  <Settings size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{t.customPace}</span>
                </button>
             </section>

             <section className="bg-orange-50/50 border border-orange-100 rounded-[24px] p-3 flex flex-col gap-2 shadow-inner flex-grow">
                <div className="flex flex-col gap-2 border-b border-orange-100 pb-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] font-black text-orange-400 uppercase tracking-widest">{t.oldBudgetLabel}</span>
                    <span className="text-sm font-black text-orange-600/50 tabular-nums">{maintenanceKcal} {t.kcalLabel}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">{t.newBudgetLabel}</span>
                    <span className="text-2xl font-black text-orange-600 tabular-nums leading-none">{state.profile.dailyBudget} {t.kcalLabel}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] font-black text-orange-400 uppercase tracking-widest">{t.targetDate}</span>
                  {state.profile.weightLossSpeed === 'custom' ? (
                    <div className="relative inline-flex"><input type="date" min={minSafeDate} value={state.profile.customTargetDate || ''} onChange={(e) => updateProfile({ customTargetDate: e.target.value })} className="bg-white border border-orange-200 py-1.5 px-3 rounded-[12px] font-black text-[11px] text-orange-600 outline-none" /></div>
                  ) : (
                    <span className="text-[14px] font-black text-orange-600 tracking-tight uppercase leading-none">{totals.targetDate ? new Intl.DateTimeFormat(state.language === 'nl' ? 'nl-NL' : (state.language === 'en' ? 'en-US' : state.language), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(totals.targetDate)) : '--'}</span>
                  )}
                </div>
             </section>

             <section className="bg-white rounded-[24px] p-2.5 px-5 border border-slate-100 shadow-sm flex items-center justify-between mt-auto shrink-0">
                <span className="font-black text-slate-800 text-[10px] uppercase tracking-[0.15em]">{t.dataStorage}</span>
                <div className="flex gap-3">
                  <button onClick={handleExportData} className="p-2 rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 active:scale-95"><FileDown size={18} /></button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 active:scale-95"><FileUp size={18} /></button>
                  <button onClick={async () => { if(confirm(t.dataManagement.clearConfirm)){ await idb.clear(); window.location.reload(); } }} className="p-2 rounded-xl bg-red-50 text-red-200 transition-all active:scale-95"><Trash2 size={18} /></button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleRestoreData} accept=".json" className="hidden" />
             </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4 py-3 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[28px] shadow-[0_-12px_40px_-15px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom,16px)]">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: t.tabs.dashboard.toUpperCase() }, 
          { id: 'meals', icon: Utensils, label: t.tabs.meals.toUpperCase() }, 
          { id: 'activity', icon: Activity, label: t.tabs.activity.toUpperCase() }, 
          { id: 'profile', icon: UserIcon, label: t.tabs.profile.toUpperCase() }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all w-20 ${activeTab === tab.id ? 'text-orange-500 scale-110' : 'text-slate-300 scale-100'}`}>
            <tab.icon size={20} strokeWidth={activeTab === tab.id ? 3 : 2} />
            <span className="text-[7px] font-black uppercase tracking-[0.1em] text-center leading-none">{tab.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="number"] { -moz-appearance: textfield; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent; bottom: 0; color: transparent; cursor: pointer; height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto;
        }
        input[type="checkbox"] {
          appearance: none;
          background-color: #fff;
          margin: 0;
          font: inherit;
          color: currentColor;
          width: 1.15em;
          height: 1.15em;
          border: 0.15em solid #cbd5e1;
          border-radius: 0.35em;
          transform: translateY(-0.075em);
          display: grid;
          place-content: center;
        }
        input[type="checkbox"]::before {
          content: "";
          width: 0.65em;
          height: 0.65em;
          transform: scale(0);
          transition: 120ms transform ease-in-out;
          box-shadow: inset 1em 1em #f97316;
          transform-origin: bottom left;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }
        input[type="checkbox"]:checked::before {
          transform: scale(1);
        }
        input[type="checkbox"]:checked {
          border-color: #f97316;
        }
      `}</style>
    </div>
  );
}
