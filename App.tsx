
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
  BarChart3,
  Pencil,
  CalendarRange,
  ArrowRight,
  TrendingUp,
  Sparkles,
  LineChart
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
  calculateBudgetFromTargetDate,
  calculateBMI
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
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-top-4 duration-300 w-max max-w-[90vw]">
      <div className={`px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 border backdrop-blur-md bg-opacity-95 ${
        type === 'error' ? 'bg-red-900 border-red-700 text-white' : 'bg-slate-900 border-slate-700 text-white'
      }`}>
        {type === 'error' ? <AlertCircle size={14} className="text-red-400" /> : <Check size={14} className="text-emerald-400" />}
        <span className="text-xs font-bold uppercase tracking-wide">{message}</span>
      </div>
    </div>
  );
};

const LANGUAGE_FLAGS: Record<Language, string> = {
  nl: '🇳🇱', en: '🇺🇸', es: '🇪🇸', de: '🇩🇪', pt: '🇵🇹', 
  zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷', hi: '🇮🇳', ar: '🇸🇦'
};

const TABS_ORDER = ['dashboard', 'meals', 'activity', 'profile'] as const;

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'activity' | 'profile' | 'stats'>('dashboard');
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
  const [isListExpanded, setIsListExpanded] = useState(false);

  const [selectedActivityId, setSelectedActivityId] = useState<string>(ACTIVITY_TYPES[0].id);
  const [selectedCustomIds, setSelectedCustomIds] = useState<string[]>([]);
  const [selectedCustomActivityIds, setSelectedCustomActivityIds] = useState<string[]>([]);

  const [newFood, setNewFood] = useState({ name: '', kcal: '', unit: '', cats: [] as string[], isDrink: false, isAlcohol: false });
  const [newActivityInput, setNewActivityInput] = useState({ name: '', kcalPerHour: '' });
  
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const foodFormRef = useRef<HTMLDivElement>(null);
  const activityFormRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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
      const mergedOptions = { ...MEAL_OPTIONS };
      if (saved) {
        MEAL_MOMENTS.forEach(m => {
          const userCustoms = (saved.customOptions?.[m] || []).filter((o: any) => o.id.startsWith('cust_'));
          mergedOptions[m] = [...MEAL_OPTIONS[m], ...userCustoms];
        });

        setState({
          ...saved,
          profile: { ...INITIAL_STATE.profile, ...saved.profile },
          customOptions: mergedOptions,
          customActivities: saved.customActivities || [],
          language: saved.language || 'nl'
        });
      } else {
        setState({ ...INITIAL_STATE, customOptions: mergedOptions });
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
    const log = (state.dailyLogs[selectedDate] as DailyLog) || { date: selectedDate, meals: {}, activities: [] };
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
      calorieStatusColor: actualIntake > currentAdjustedGoal ? 'bg-red-500' : intakePercent > 85 ? 'bg-amber-500' : 'bg-emerald-500',
      targetDate: state.profile.weightLossSpeed === 'custom' && state.profile.customTargetDate ? state.profile.customTargetDate : calculateTargetDate({ ...state.profile, currentWeight: globalLatestWeight }, intakeGoal)
    };
  }, [state.profile, state.dailyLogs, selectedDate, globalLatestWeight]);

  const statsData = useMemo(() => {
    const sortedDates = Object.keys(state.dailyLogs).sort();
    const weightHistory = sortedDates
      .map(date => ({ date, weight: state.dailyLogs[date].weight }))
      .filter(entry => entry.weight !== undefined);

    const consistency = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = state.dailyLogs[dateStr];
      const intake = Object.values(log?.meals || {}).reduce((acc, items) => 
        acc + (items as LoggedMealItem[]).reduce((sum, m) => sum + m.kcal, 0), 0);
      const burn = (log?.activities || []).reduce((sum, a) => sum + (Number(a.burnedKcal) || 0), 0);
      const budget = state.profile.dailyBudget + burn;
      consistency.push({ date: dateStr, intake, budget, label: d.toLocaleDateString(state.language, { weekday: 'short' }) });
    }

    const mealTotals: Record<string, number> = { Ontbijt: 0, Lunch: 0, Diner: 0, Snacks: 0 };
    Object.values(state.dailyLogs).forEach(log => {
      Object.entries(log.meals).forEach(([moment, items]) => {
        const kcal = (items as LoggedMealItem[]).reduce((sum, i) => sum + i.kcal, 0);
        if (moment.includes('Snack')) mealTotals.Snacks += kcal;
        else if (mealTotals[moment] !== undefined) mealTotals[moment] += kcal;
      });
    });
    const totalKcalAll = Object.values(mealTotals).reduce((a, b) => a + b, 0) || 1;
    const mealDist = Object.entries(mealTotals).map(([key, val]) => ({ key, val, percent: (val / totalKcalAll) * 100 }));
    const currentBMI = calculateBMI(globalLatestWeight, state.profile.height);

    return { weightHistory, consistency, mealDist, currentBMI };
  }, [state.dailyLogs, state.profile, globalLatestWeight, state.language]);

  const weeklyStats = useMemo(() => {
    const stats = { totalIntake: 0, avgDailyIntake: 0, totalBurned: 0, weightChange: 0 };
    const end = new Date(selectedDate);
    const windowWeights: {date: string, weight: number}[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(end); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const log = (state.dailyLogs[ds] as DailyLog);
      if (log) {
        const dayIntake = Object.values(log.meals || {}).reduce((acc, items) => acc + (items as LoggedMealItem[]).reduce((sum, m) => sum + m.kcal, 0), 0);
        stats.totalIntake += dayIntake;
        const dayBurn = (log.activities || []).reduce((sum, a) => sum + (Number(a.burnedKcal) || 0), 0);
        stats.totalBurned += dayBurn;
        if (log.weight) windowWeights.push({date: ds, weight: log.weight});
      }
    }
    stats.avgDailyIntake = Math.round(stats.totalIntake / 7);
    if (windowWeights.length >= 2) {
      windowWeights.sort((a,b) => a.date.localeCompare(b.date));
      stats.weightChange = windowWeights[windowWeights.length - 1].weight - windowWeights[0].weight;
    }
    return stats;
  }, [state.dailyLogs, selectedDate]);

  const currentLog = useMemo(() => (state.dailyLogs[selectedDate] as DailyLog) || { date: selectedDate, meals: {}, activities: [] }, [state.dailyLogs, selectedDate]);

  const dateParts = useMemo(() => {
    const d = new Date(selectedDate);
    const parts = new Intl.DateTimeFormat(state.language === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(d);
    return { day: parts.find(p => p.type === 'day')?.value || '', month: (parts.find(p => p.type === 'month')?.value || '').toUpperCase(), weekday: (parts.find(p => p.type === 'weekday')?.value || '').toUpperCase() };
  }, [selectedDate, state.language]);

  const onTouchStart = (e: React.TouchEvent) => touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      const currentIndex = TABS_ORDER.indexOf(activeTab as any);
      if (deltaX > 0 && currentIndex > 0) setActiveTab(TABS_ORDER[currentIndex - 1] as any);
      else if (deltaX < 0 && currentIndex < TABS_ORDER.length - 1) setActiveTab(TABS_ORDER[currentIndex + 1] as any);
    }
  };

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
        newBudget = calculateBudgetFromTargetDate({ ...newProfile, currentWeight: globalLatestWeight }, newProfile.customTargetDate);
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
      const log = logs[selectedDate]; if (!log) return prev;
      const meals = { ...log.meals }; if (!meals[moment]) return prev;
      meals[moment] = (meals[moment] as LoggedMealItem[]).map(item => item.id === itemId ? { ...item, kcal: Math.max(0, newKcal) } : item);
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

  const addCustomActivity = () => {
    if (!newActivityInput.name || !newActivityInput.kcalPerHour) return;
    const newAct: any = { id: editingActivityId || 'custom_act_' + generateId(), name: newActivityInput.name, met: 0, kcalPer60: Number(newActivityInput.kcalPerHour), unit: 'minuten', isCustom: true };
    setState(prev => ({ ...prev, customActivities: editingActivityId ? prev.customActivities.map(a => a.id === editingActivityId ? newAct : a) : [...prev.customActivities, newAct] }));
    setEditingActivityId(null); setNewActivityInput({ name: '', kcalPerHour: '' }); setToast({ msg: t.save });
  };

  const addCustomFood = () => {
    if (!newFood.name || !newFood.kcal || newFood.cats.length === 0) return;
    const item: MealOption = { id: editingFoodId || 'cust_' + generateId(), name: newFood.name, kcal: Number(newFood.kcal), unitName: newFood.unit.toUpperCase() || 'STUK', isDrink: newFood.isDrink, isAlcohol: newFood.isAlcohol, isCustom: true, categories: newFood.cats };
    setState(prev => {
      const newOptions = { ...prev.customOptions };
      MEAL_MOMENTS.forEach(m => {
        if (editingFoodId) newOptions[m] = newOptions[m].map(o => o.id === editingFoodId ? item : o);
        else newOptions[m] = [...(newOptions[m] || []), item];
      });
      return { ...prev, customOptions: newOptions };
    });
    setEditingFoodId(null); setNewFood({ name: '', kcal: '', unit: '', cats: [], isDrink: false, isAlcohol: false }); setToast({ msg: t.save });
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `backup-${new Date().toISOString().split('T')[0]}.json`; link.click();
  };

  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => { try { setState(JSON.parse(re.target?.result as string)); } catch (err) { alert('Error loading file'); } };
    reader.readAsText(file);
  };

  const allAvailableProducts = useMemo(() => {
    const seen = new Set<string>(); const list: MealOption[] = [];
    MEAL_MOMENTS.forEach(m => (state.customOptions[m] || []).forEach(o => { if (!seen.has(o.id)) { seen.add(o.id); list.push(o); } }));
    return list.sort((a, b) => getTranslatedName(a.id, a.name).localeCompare(getTranslatedName(b.id, b.name)));
  }, [state.customOptions, state.language]);

  const productsToDisplayInResults = useMemo(() => {
    if (!openPickerMoment) return [];
    const searchNormalized = searchTerm.trim().toLowerCase();
    if (searchNormalized) {
      const words = searchNormalized.split(/\s+/);
      return allAvailableProducts.filter(o => words.every(w => getTranslatedName(o.id, o.name).toLowerCase().includes(w) || (o.unitName || '').toLowerCase().includes(w)));
    }
    if (pickerFilter === 'all') return allAvailableProducts;
    return allAvailableProducts.filter(o => {
      const cats = (o.categories || []).map(c => c.toUpperCase());
      if (pickerFilter === 'breakfast') return o.id.startsWith('b_') || cats.includes('ONTBIJT');
      if (pickerFilter === 'lunch') return o.id.startsWith('l_') || cats.includes('LUNCH');
      if (pickerFilter === 'diner') return o.id.startsWith('m_') || cats.includes('DINER');
      if (pickerFilter === 'drink') return o.id.startsWith('d_') || !!o.isDrink;
      if (pickerFilter === 'alcohol') return o.id.startsWith('a_') || !!o.isAlcohol;
      if (pickerFilter === 'fruit') return o.id.startsWith('f_');
      if (pickerFilter === 'snacks') return o.id.startsWith('s_') || cats.includes('SNACK');
      return true;
    });
  }, [searchTerm, pickerFilter, allAvailableProducts, state.language, openPickerMoment]);

  const birthYears = useMemo(() => { const years = []; const cur = new Date().getFullYear(); for (let i = cur; i >= cur - 90; i--) years.push(i); return years; }, []);

  if (!isLoaded) return null;

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden text-slate-900 shadow-2xl">
      {toast && <Toast message={toast.msg} type={toast.type} onHide={() => setToast(null)} />}
      
      {showInfo && (
        <div className="fixed inset-0 z-[200] bg-white overflow-y-auto animate-in fade-in duration-200">
          <div className="max-w-md mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-800">{t.infoModal.title}</h2>
              <button onClick={() => setShowInfo(false)} className="p-2 bg-slate-100 rounded-lg"><X size={20}/></button>
            </div>
            <div className="space-y-6">
              <section className="bg-slate-50 p-4 rounded-xl border border-slate-200"><p className="text-sm text-slate-600 leading-relaxed italic">{t.infoModal.aboutText}</p></section>
              <section className="space-y-2"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"><Zap size={14}/> {t.infoModal.scienceTitle}</h3><p className="text-sm text-slate-600 leading-relaxed">{t.infoModal.scienceText}</p></section>
              <section className="space-y-3"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"><Settings size={14}/> {t.infoModal.manualTitle}</h3><div className="space-y-2">{t.infoModal.steps.map((step: any, i: number) => (<div key={i} className="flex gap-4 p-3 bg-white border border-slate-100 rounded-lg"><span className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full text-[10px] font-bold shrink-0">{i+1}</span><div><h4 className="text-xs font-bold text-slate-800 uppercase">{step.title}</h4><p className="text-xs text-slate-500 mt-0.5">{step.desc}</p></div></div>))}</div></section>
              <section className="p-4 bg-red-50 border border-red-100 rounded-xl"><h3 className="text-[10px] font-bold text-red-600 uppercase mb-1 flex items-center gap-1.5"><AlertCircle size={12}/> {t.infoModal.disclaimerTitle}</h3><p className="text-[10px] text-red-500/80 leading-relaxed">{t.infoModal.disclaimerText}</p></section>
              <footer className="pt-8 border-t border-slate-100 text-center text-[10px] text-slate-400">{t.infoModal.copyright}</footer>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab === 'stats' ? (
              <button onClick={() => setActiveTab('dashboard')} className="p-2 bg-slate-50 rounded-lg text-slate-600"><ChevronLeft size={20}/></button>
            ) : (
              <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft size={20}/></button>
            )}
            <div className="flex flex-col items-center min-w-[70px]">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter leading-none mb-0.5">{activeTab === 'stats' ? 'Rapportage' : dateParts.weekday}</span>
              <span className="text-sm font-bold text-slate-800 leading-none">{activeTab === 'stats' ? 'Inzichten' : `${dateParts.day} ${dateParts.month}`}</span>
            </div>
            {activeTab !== 'stats' && (
              <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight size={20}/></button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select value={state.language} onChange={(e) => setState(prev => ({ ...prev, language: e.target.value as Language }))} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold appearance-none pr-6 outline-none uppercase shadow-sm">{Object.keys(LANGUAGE_FLAGS).map(l => <option key={l} value={l}>{LANGUAGE_FLAGS[l as Language]} {l.toUpperCase()}</option>)}</select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={() => setShowWeeklyPopover(!showWeeklyPopover)} className={`bg-white border px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm transition-all ${showWeeklyPopover ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}><Scale size={14} className="text-orange-500" /><span className="text-xs font-bold tabular-nums">{globalLatestWeight.toFixed(1)} <span className="text-[8px] text-slate-400">KG</span></span></button>
          </div>
        </div>
      </header>

      {showWeeklyPopover && (
        <div ref={popoverRef} className="absolute top-14 right-4 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
           <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2"><CalendarDays size={14} className="text-orange-500" /><h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-800">{t.weeklySummary}</h3></div>
           <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between items-center text-[10px]"><span className="text-slate-400 font-semibold uppercase">{t.avgDaily}</span><span className="font-bold text-slate-700">{weeklyStats.avgDailyIntake} <span className="text-[8px] text-slate-400">KCAL</span></span></div>
              <div className="flex justify-between items-center text-[10px]"><span className="text-slate-400 font-semibold uppercase">{t.totalBurn}</span><span className="font-bold text-emerald-500">{weeklyStats.totalBurned} <span className="text-[8px]">KCAL</span></span></div>
              <div className="flex justify-between items-center text-[10px]"><span className="text-slate-400 font-semibold uppercase">{t.weeklyWeightChange}</span><span className={`font-bold ${weeklyStats.weightChange <= 0 ? "text-emerald-500" : "text-red-500"}`}>{weeklyStats.weightChange > 0 ? '+' : ''}{weeklyStats.weightChange.toFixed(1)} <span className="text-[8px]">KG</span></span></div>
           </div>
        </div>
      )}

      <main className="flex-grow overflow-y-auto custom-scrollbar p-4 pb-28" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.dailyBudget}</p><h2 className="text-3xl font-bold text-slate-900 tracking-tighter">{totals.actualIntake}<span className="text-sm font-medium text-slate-400 ml-2">/ {totals.currentAdjustedGoal}</span></h2></div>
                <div className="text-right"><p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">{t.remainingToday}</p><p className="text-2xl font-bold text-orange-500 tabular-nums">{Math.max(0, totals.currentAdjustedGoal - totals.actualIntake)}</p></div>
              </div>
              <div className="space-y-1.5 mb-4"><div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex"><div className={`h-full transition-all duration-700 ${totals.calorieStatusColor}`} style={{ width: `${Math.min(totals.intakePercent, 100)}%` }} /></div><div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400"><span>{Math.round(totals.intakePercent)}% Verbruikt</span><span>{totals.currentAdjustedGoal} Kcal Max</span></div></div>
              
              {/* MAINTENANCE & SAVINGS INTEGRATION */}
              <div className="bg-slate-50 rounded-lg p-2 flex justify-between items-center text-[9px] font-bold uppercase border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Zap size={10} className="text-orange-400" fill="currentColor" />
                  <span>{t.oldBudgetLabel}: <span className="text-slate-600">{maintenanceKcal}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <TrendingDown size={10} />
                  <span>Besparing: -{maintenanceKcal - state.profile.dailyBudget}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 mt-4"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 shadow-sm"><Flame size={16}/></div><div><p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">{t.activityCalories}</p><p className="text-sm font-bold text-emerald-600 leading-none">+{totals.activityBurn}</p></div></div><div className="flex items-center gap-2 border-l border-slate-100 pl-3"><div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shadow-sm"><Target size={16}/></div><div><p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">{t.targetReached}</p><p className="text-sm font-bold text-blue-600 leading-none">{totals.targetDate ? new Intl.DateTimeFormat(state.language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'short' }).format(new Date(totals.targetDate)) : '--'}</p></div></div></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Scale size={12}/> {t.weighMoment}</h3><div className="flex items-end gap-1"><input type="number" step="0.1" placeholder="00.0" value={(state.dailyLogs[selectedDate] as DailyLog)?.weight || ''} onChange={(e) => { const val = e.target.value ? Number(e.target.value) : undefined; setState(prev => { const logs = { ...prev.dailyLogs }; logs[selectedDate] = { ...((logs[selectedDate] as DailyLog) || { date: selectedDate, meals: {}, activities: [] }), weight: val }; return { ...prev, dailyLogs: logs }; }); }} className="w-full bg-slate-50 border-none p-1.5 text-xl font-bold text-slate-800 focus:ring-1 focus:ring-orange-200 rounded-lg outline-none tabular-nums" /><span className="text-[10px] font-bold text-slate-300 mb-1.5 uppercase">kg</span></div></div>
              <div 
                onClick={() => setActiveTab('stats')}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer active:bg-slate-50 transition-colors"
              >
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                  <span>Inzichten</span>
                  <ArrowRight size={10} className="text-slate-300" />
                </h3>
                <div className="flex items-baseline gap-1">
                   <span className="text-xl font-bold text-emerald-500">-{totals.weightLostSoFar.toFixed(1)}</span>
                   <span className="text-[10px] font-bold text-slate-300 uppercase">kg</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{width: `${totals.weightProgressPercent}%`}} />
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center justify-between group cursor-pointer active:bg-orange-100 transition-all" onClick={() => setShowInfo(true)}><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-orange-500 shadow-sm border border-orange-100"><Info size={20}/></div><div><h4 className="text-xs font-bold text-slate-800 uppercase leading-none mb-1">Hoe werkt het?</h4><p className="text-[10px] text-slate-500 leading-none">Wetenschappelijke BMR Berekening</p></div></div><ChevronRight size={18} className="text-orange-300 group-hover:translate-x-1 transition-transform" /></div>

            <div 
              onClick={() => setActiveTab('stats')}
              className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between group cursor-pointer active:bg-slate-50 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                  <BarChart3 size={20}/>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase leading-none mb-1">Gedetailleerde Voortgang</h4>
                  <p className="text-[10px] text-slate-500 leading-none">Bekijk rapportages en trends</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingDown size={14} className="text-blue-500" /> Gewichtsverloop
                </h3>
                <span className="text-[9px] font-bold text-slate-300 uppercase">Lijn Grafiek</span>
              </div>
              <div className="h-40 w-full relative group">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                  {[0, 25, 50, 75, 100].map(y => (
                    <line key={y} x1="0" y1={1.5 * y} x2="400" y2={1.5 * y} stroke="#f1f5f9" strokeWidth="1" />
                  ))}
                  {(() => {
                    const h = 150;
                    const w = 400;
                    const history = [
                      { weight: state.profile.startWeight },
                      ...statsData.weightHistory,
                      { weight: globalLatestWeight }
                    ];
                    if (history.length < 2) return <text x="200" y="75" textAnchor="middle" className="text-[10px] fill-slate-300 uppercase font-bold">Niet genoeg data</text>;
                    const weights = history.map(h => h.weight || 0);
                    const minW = Math.min(...weights, state.profile.targetWeight) - 2;
                    const maxW = Math.max(...weights, state.profile.startWeight) + 2;
                    const range = maxW - minW;
                    const points = weights.map((wt, i) => {
                      const x = (i / (weights.length - 1)) * w;
                      const y = h - ((wt - minW) / range) * h;
                      return `${x},${y}`;
                    }).join(' ');
                    return (
                      <>
                        <polyline fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
                        {(() => {
                          const targetY = h - ((state.profile.targetWeight - minW) / range) * h;
                          return <line x1="0" y1={targetY} x2="400" y2={targetY} stroke="#f97316" strokeWidth="1" strokeDasharray="4,2" opacity="0.5" />;
                        })()}
                      </>
                    );
                  })()}
                </svg>
                <div className="absolute top-0 right-0 p-1 flex flex-col gap-1 items-end pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Actueel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 opacity-50" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Doel</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={14} className="text-emerald-500" /> Consistentie
                </h3>
                <span className="text-[9px] font-bold text-slate-300 uppercase">Laatste 7 dagen</span>
              </div>
              <div className="flex items-end justify-between h-32 gap-3 px-2">
                {statsData.consistency.map((day, idx) => {
                  const maxVal = Math.max(...statsData.consistency.map(d => d.budget), 3000);
                  const intakeHeight = (day.intake / maxVal) * 100;
                  const isOver = day.intake > day.budget && day.intake > 0;
                  const isEmpty = day.intake === 0;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                      <div className="w-full relative h-24 flex items-end justify-center">
                        <div className="absolute w-full border-t border-slate-200 z-10" style={{ bottom: `${(day.budget / maxVal) * 100}%` }} />
                        <div className={`w-full rounded-t-sm transition-all duration-500 ${isEmpty ? 'bg-slate-50' : (isOver ? 'bg-orange-400' : 'bg-emerald-400')}`} style={{ height: `${intakeHeight}%` }} />
                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded pointer-events-none">
                          {day.intake} kcal
                        </div>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase mt-3">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BMI Index</h3>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{statsData.currentBMI}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    statsData.currentBMI < 18.5 ? 'bg-blue-50 text-blue-600' :
                    statsData.currentBMI < 25 ? 'bg-emerald-50 text-emerald-600' :
                    statsData.currentBMI < 30 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {statsData.currentBMI < 18.5 ? 'Ondergewicht' :
                     statsData.currentBMI < 25 ? 'Gezond' :
                     statsData.currentBMI < 30 ? 'Overgewicht' : 'Obesitas'}
                  </span>
                </div>
              </div>
              <div className="relative pt-4 pb-2">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full w-[25%] bg-blue-400 border-r border-white" />
                  <div className="h-full w-[35%] bg-emerald-400 border-r border-white" />
                  <div className="h-full w-[20%] bg-amber-400 border-r border-white" />
                  <div className="h-full w-[20%] bg-red-400" />
                </div>
                <div className="absolute top-2 transition-all duration-700" style={{ left: `${Math.min(Math.max((statsData.currentBMI / 40) * 100, 0), 100)}%` }}>
                  <div className="w-0.5 h-6 bg-slate-800 -translate-x-1/2" />
                </div>
                <div className="flex justify-between text-[7px] font-bold text-slate-300 mt-2 uppercase">
                  <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2"><div className="relative flex-grow"><select className="w-full bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none appearance-none uppercase tracking-wide text-slate-800" onChange={(e) => { setOpenPickerMoment(e.target.value as MealMoment); setStagedProduct(null); setSearchTerm(''); setPickerFilter('all'); setIsListExpanded(false); }} value={openPickerMoment || ""}><option value="" disabled>{t.addFoodDrink}</option>{MEAL_MOMENTS.map(moment => <option key={moment} value={moment}>{t.moments[moment]}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div><button onClick={() => setShowMyList(!showMyList)} className={`p-2.5 rounded-lg border shadow-sm transition-all ${showMyList ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><ListFilter size={18} /></button></div>
            {showMyList ? (
              <div className="space-y-4 animate-in slide-in-from-right-2 duration-300"><div ref={foodFormRef} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-4"><div className="flex justify-between items-center"><h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{editingFoodId ? 'Item Wijzigen' : 'Nieuw Item'}</h3>{editingFoodId && (<button onClick={() => { setEditingFoodId(null); setNewFood({ name: '', kcal: '', unit: '', cats: [], isDrink: false, isAlcohol: false }); }} className="text-[9px] font-bold text-red-500 uppercase px-2 py-1 bg-red-50 rounded">Annuleren</button>)}</div><div className="flex gap-2"><button onClick={() => setNewFood(p => ({...p, isDrink: false, isAlcohol: false}))} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 border transition-all text-[10px] font-bold uppercase ${(!newFood.isDrink && !newFood.isAlcohol) ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-slate-200 text-slate-300 bg-slate-50/50'}`}><Utensils size={14} /> {t.mealLabel}</button><button onClick={() => setNewFood(p => ({...p, isDrink: true, isAlcohol: false}))} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 border transition-all text-[10px] font-bold uppercase ${newFood.isDrink ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-slate-200 text-slate-300 bg-slate-50/50'}`}><GlassWater size={14} /> {t.drinkLabel}</button></div><input type="text" placeholder={t.productName} value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-semibold placeholder:text-slate-300 outline-none focus:ring-1 focus:ring-orange-200 uppercase" /><div className="grid grid-cols-2 gap-3"><input type="number" placeholder={t.kcalLabel} value={newFood.kcal} onChange={e => setNewFood({...newFood, kcal: e.target.value})} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-semibold placeholder:text-slate-300 outline-none focus:ring-1 focus:ring-orange-200" /><input type="text" placeholder={t.portionPlaceholder} value={newFood.unit} onChange={e => setNewFood({...newFood, unit: e.target.value})} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-semibold placeholder:text-slate-300 outline-none focus:ring-1 focus:ring-orange-200 uppercase" /></div><div className="flex flex-wrap gap-1.5">{['ONTBIJT', 'LUNCH', 'DINER', 'SNACK'].map(m => (<button key={m} onClick={() => setNewFood(p => ({...p, cats: p.cats.includes(m) ? p.cats.filter(x => x!==m) : [...p.cats, m]}))} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${newFood.cats.includes(m) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-200'}`}>{m}</button>))}</div><button onClick={addCustomFood} disabled={!newFood.name || !newFood.kcal || newFood.cats.length === 0} className={`w-full py-3 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${(!newFood.name || !newFood.kcal || newFood.cats.length === 0) ? 'bg-slate-200 text-white' : 'bg-orange-500 text-white active:scale-[0.98] shadow-lg shadow-orange-100'}`}>{editingFoodId ? <Check size={16} /> : <Plus size={16} />} {editingFoodId ? 'Wijziging Opslaan' : t.addToMyList}</button></div></div>
            ) : (
              <div className="space-y-4">{openPickerMoment && (<div className="bg-white rounded-xl border border-slate-200 shadow-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200"><div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar" onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>{[ { id: 'breakfast', icon: Sun, label: 'Ontbijt' }, { id: 'lunch', icon: Utensils, label: 'Lunch' }, { id: 'diner', icon: Moon, label: 'Diner' }, { id: 'snacks', icon: Cookie, label: 'Snack' }, { id: 'drink', icon: GlassWater, label: 'Drink' }, { id: 'fruit', icon: Apple, label: 'Fruit' }, { id: 'alcohol', icon: Beer, label: 'Alcohol' } ].map(f => (<button key={f.id} onClick={() => { setPickerFilter(f.id as any); setStagedProduct(null); }} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all border flex items-center gap-1.5 ${pickerFilter === f.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-50 text-slate-400 border-slate-200'}`}><f.icon size={12} />{f.label}</button>))}<button onClick={() => { setPickerFilter('all'); setStagedProduct(null); }} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all border ${pickerFilter === 'all' ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>Alles</button></div><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" className="w-full bg-slate-50 border border-slate-200 pl-10 pr-10 py-2.5 rounded-lg text-xs font-semibold placeholder:text-slate-300 outline-none focus:ring-1 focus:ring-orange-200 uppercase" placeholder={t.searchProduct} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setStagedProduct(null); }} />{searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"><X size={14}/></button>)}</div>{productsToDisplayInResults.length > 0 && !stagedProduct && (<div className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-slate-50 bg-slate-50/50 rounded-lg border border-slate-100">{productsToDisplayInResults.map(opt => (<button key={opt.id} onClick={() => { setStagedProduct({ opt, currentKcal: opt.kcal }); setIsListExpanded(false); }} className="flex items-center gap-3 p-3 hover:bg-orange-50 transition-all text-left w-full"><div className="text-orange-500 shrink-0">{opt.isAlcohol ? <Beer size={16}/> : opt.isDrink ? <GlassWater size={16}/> : <Utensils size={16}/>}</div><div className="flex flex-col flex-grow truncate"><span className="text-[11px] font-bold text-slate-800 uppercase truncate">{getTranslatedName(opt.id, opt.name)}</span><span className="text-[9px] font-medium text-slate-400 uppercase">{opt.kcal} Kcal • {opt.unitName}</span></div><div className="w-6 h-6 flex items-center justify-center bg-orange-100 rounded text-orange-600"><Plus size={14} /></div></button>))}{productsToDisplayInResults.length === 0 && (<div className="p-8 text-center text-[10px] font-bold text-slate-300 uppercase">Geen resultaten</div>)}</div>)}{stagedProduct && (<div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 space-y-3 animate-in zoom-in-95 duration-200"><div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg text-orange-500 shadow-sm border border-orange-100"><Utensils size={18}/></div><div className="truncate"><h4 className="text-xs font-bold text-slate-800 uppercase truncate leading-tight">{getTranslatedName(stagedProduct.opt.id, stagedProduct.opt.name)}</h4><p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">{stagedProduct.opt.unitName}</p></div></div><div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-1.5"><button onClick={() => setStagedProduct(p => p ? {...p, currentKcal: Math.max(0, p.currentKcal - p.opt.kcal)} : p)} className="p-2 hover:bg-slate-50 rounded-md text-orange-500"><Minus size={16}/></button><div className="flex flex-col items-center"><input type="number" className="w-16 bg-transparent border-none p-0 text-lg font-bold text-slate-800 focus:ring-0 text-center" value={stagedProduct.currentKcal} onChange={(e) => setStagedProduct(p => p ? {...p, currentKcal: Number(e.target.value)} : p)} /><span className="text-[8px] font-bold text-slate-300 uppercase leading-none">kcal</span></div><button onClick={() => setStagedProduct(p => p ? {...p, currentKcal: p.currentKcal + p.opt.kcal} : p)} className="p-2 hover:bg-slate-50 rounded-md text-orange-500"><Plus size={16}/></button></div><div className="flex gap-2"><button onClick={() => setStagedProduct(null)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-400 rounded-lg font-bold text-[10px] uppercase">Annuleren</button><button onClick={() => { addMealItem(openPickerMoment!, { name: stagedProduct.opt.name, kcal: stagedProduct.currentKcal, quantity: 1, mealId: stagedProduct.opt.id, isDrink: stagedProduct.opt.isDrink, isAlcohol: stagedProduct.opt.isAlcohol }); setOpenPickerMoment(null); setStagedProduct(null); setSearchTerm(''); }} className="flex-[2] py-2.5 bg-orange-500 text-white rounded-lg font-bold text-[10px] uppercase shadow-md active:scale-[0.98] transition-all">Bevestigen</button></div></div>)}</div>)}<div className="space-y-3">{MEAL_MOMENTS.map(moment => { const items = (currentLog.meals[moment] as LoggedMealItem[]) || []; if (items.length === 0) return null; const momentTotal = items.reduce((sum, item) => sum + item.kcal, 0); return (<div key={moment} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><div className="bg-slate-50 px-3 py-1.5 flex justify-between items-center border-b border-slate-100"><h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.moments[moment]}</h4><span className="text-[10px] font-bold text-slate-800">{momentTotal} <span className="text-[8px] text-slate-400">KCAL</span></span></div><div className="divide-y divide-slate-50">{items.map(item => { const baseItem = allAvailableProducts.find(o => o.id === item.mealId); const baseKcal = baseItem ? baseItem.kcal : 50; return (<div key={item.id} className="flex items-center justify-between p-3"><div className="flex items-center gap-3 truncate flex-grow"><div className="text-orange-500 shrink-0">{item.isAlcohol ? <Beer size={14}/> : item.isDrink ? <GlassWater size={14}/> : <Utensils size={14}/>}</div><span className="text-xs font-bold text-slate-800 uppercase truncate leading-none">{getTranslatedName(item.mealId || '', item.name)}</span></div><div className="flex items-center gap-3 shrink-0"><div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1 border border-slate-100"><button onClick={() => updateMealItemKcal(moment, item.id, item.kcal - baseKcal)} className="text-slate-400 hover:text-orange-500"><Minus size={12}/></button><input type="number" className="w-8 bg-transparent border-none p-0 text-[11px] font-bold text-slate-800 focus:ring-0 text-center outline-none" value={Math.round(item.kcal)} onChange={(e) => updateMealItemKcal(moment, item.id, Number(e.target.value))} /><button onClick={() => updateMealItemKcal(moment, item.id, item.kcal + baseKcal)} className="text-slate-400 hover:text-orange-500"><Plus size={12}/></button></div><button onClick={() => { setState(prev => { const logs = { ...prev.dailyLogs }; const log = logs[selectedDate]; if (log) log.meals[moment] = (log.meals[moment] as LoggedMealItem[]).filter(i => i.id !== item.id); return { ...prev, dailyLogs: logs }; }); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button></div></div>); })}</div></div>); })} {Object.keys(currentLog.meals).every(k => (currentLog.meals[k] as LoggedMealItem[]).length === 0) && !openPickerMoment && (<div className="py-20 text-center opacity-30"><Utensils size={32} className="mx-auto mb-2" /><p className="text-[10px] font-bold uppercase tracking-widest">Nog niets gepland voor vandaag</p></div>)}</div></div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2"><div className="relative flex-grow"><select value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)} className="w-full bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none appearance-none uppercase tracking-wide text-slate-800">{[...ACTIVITY_TYPES, ...(state.customActivities || [])].map(act => <option key={act.id} value={act.id}>{getTranslatedName(act.id, act.name)}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div><button onClick={() => setShowMyActivityList(!showMyActivityList)} className={`p-2.5 rounded-lg border shadow-sm transition-all ${showMyActivityList ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><ListFilter size={18} /></button></div>
             {showMyActivityList ? (
                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300"><div ref={activityFormRef} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-4"><div className="flex justify-between items-center"><h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{editingActivityId ? 'Activiteit Wijzigen' : t.newActivity}</h3>{editingActivityId && (<button onClick={() => { setEditingActivityId(null); setNewActivityInput({ name: '', kcalPerHour: '' }); }} className="text-[9px] font-bold text-red-500 uppercase px-2 py-1 bg-red-50 rounded">Annuleren</button>)}</div><div className="grid grid-cols-1 gap-3"><input type="text" placeholder={t.activityName} value={newActivityInput.name} onChange={e => setNewActivityInput({...newActivityInput, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-semibold uppercase outline-none focus:ring-1 focus:ring-orange-200" /><input type="number" placeholder={t.kcalPerHour} value={newActivityInput.kcalPerHour} onChange={e => setNewActivityInput({...newActivityInput, kcalPerHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-orange-200" /></div><button onClick={addCustomActivity} disabled={!newActivityInput.name || !newActivityInput.kcalPerHour} className={`w-full py-3 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${(!newActivityInput.name || !newActivityInput.kcalPerHour) ? 'bg-slate-200 text-white' : 'bg-orange-500 text-white active:scale-[0.98] shadow-lg shadow-orange-100'}`}>{editingActivityId ? <Check size={16}/> : <Plus size={16}/>} {editingActivityId ? 'Wijziging Opslaan' : t.addToMyList}</button></div></div>
             ) : (
               <div className="space-y-4"><div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3"><div className="relative flex-grow"><input id="act-val" type="number" placeholder={t.minutes} className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-sm font-bold outline-none text-center focus:ring-1 focus:ring-orange-200 placeholder:text-slate-300" /></div><button onClick={() => { const val = (document.getElementById('act-val') as HTMLInputElement).value; if (val) { addActivity(selectedActivityId, Number(val)); (document.getElementById('act-val') as HTMLInputElement).value = ''; } }} className="bg-orange-500 text-white p-3 rounded-lg shadow-md active:scale-95 transition-all flex items-center justify-center"><Plus size={20}/></button></div><div className="space-y-2">{currentLog.activities.map(act => { const type = [...ACTIVITY_TYPES, ...(state.customActivities || [])].find(t => t.id === act.typeId); return (<div key={act.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center group animate-in fade-in slide-in-from-left-2 duration-200"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500"><Activity size={16}/></div><div><p className="text-xs font-bold text-slate-800 uppercase leading-none mb-1">{getTranslatedName(act.typeId, type?.name || '')}</p><p className="text-[10px] font-semibold text-slate-400 uppercase leading-none">{act.value} {t.minutes} • <span className="text-emerald-500 font-bold">+{Math.round(act.burnedKcal)} Kcal</span></p></div></div><button onClick={() => setState(prev => { const logs = { ...prev.dailyLogs }; const log = logs[selectedDate]; if (log) log.activities = log.activities.filter(a => a.id !== act.id); return { ...prev, dailyLogs: logs }; })} className="text-slate-300 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={16}/></button></div>); })} {currentLog.activities.length === 0 && (<div className="py-10 text-center opacity-30"><Activity size={32} className="mx-auto mb-2" /><p className="text-xs font-bold uppercase tracking-wider">{t.nothingPlanned}</p></div>)}</div></div>
             )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             {/* RESULT STICKY HEADER REF */}
             <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                   <Target size={16} className="text-orange-500" />
                   <span className="text-xs font-bold uppercase text-slate-400">Doel:</span>
                   <span className="text-sm font-black text-slate-800">{state.profile.dailyBudget} <span className="text-[10px]">KCAL</span></span>
                </div>
                <div className="flex items-center gap-2">
                   <CalendarRange size={16} className="text-blue-500" />
                   <span className="text-xs font-bold uppercase text-slate-400">Datum:</span>
                   <span className="text-sm font-black text-slate-800 uppercase">
                      {totals.targetDate ? new Intl.DateTimeFormat(state.language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'short' }).format(new Date(totals.targetDate)) : '--'}
                   </span>
                </div>
             </div>

             {/* COMPACT INPUT GRID */}
             <div className="space-y-3">
                {/* GENDER TOGLE */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.gender}</span>
                   <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button onClick={() => updateProfile({ gender: 'man' })} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${state.profile.gender === 'man' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400'}`}>Man</button>
                      <button onClick={() => updateProfile({ gender: 'woman' })} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${state.profile.gender === 'woman' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400'}`}>Vrouw</button>
                   </div>
                </div>

                {/* 2X2 GRID FOR NUMBERS */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">{t.age}</label>
                      <select value={state.profile.birthYear} onChange={(e) => updateProfile({ birthYear: Number(e.target.value) })} className="w-full bg-slate-50 border-none px-2 py-1 rounded-lg text-sm font-bold outline-none appearance-none tabular-nums text-slate-800">{birthYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
                   </div>
                   <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">{t.height.split(' ')[0]}</label>
                      <div className="flex items-center gap-1">
                         <input type="number" value={state.profile.height} onChange={(e) => updateProfile({ height: Number(e.target.value) })} className="w-full bg-slate-50 border-none px-2 py-1 rounded-lg text-sm font-bold outline-none tabular-nums text-slate-800" />
                         <span className="text-[9px] font-bold text-slate-300">CM</span>
                      </div>
                   </div>
                   <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">{t.startWeight.split(' ')[0]}</label>
                      <div className="flex items-center gap-1">
                         <input type="number" value={state.profile.startWeight} onChange={(e) => updateProfile({ startWeight: Number(e.target.value) })} className="w-full bg-slate-50 border-none px-2 py-1 rounded-lg text-sm font-bold outline-none tabular-nums text-slate-800" />
                         <span className="text-[9px] font-bold text-slate-300">KG</span>
                      </div>
                   </div>
                   <div className="bg-white p-3 rounded-2xl border border-orange-200 shadow-sm">
                      <label className="text-[9px] font-bold text-orange-500 uppercase mb-1 block">{t.targetWeight.split(' ')[0]}</label>
                      <div className="flex items-center gap-1">
                         <input type="number" value={state.profile.targetWeight} onChange={(e) => updateProfile({ targetWeight: Number(e.target.value) })} className="w-full bg-orange-50 border-none px-2 py-1 rounded-lg text-sm font-bold outline-none tabular-nums text-orange-600" />
                         <span className="text-[9px] font-bold text-orange-300">KG</span>
                      </div>
                   </div>
                </div>

                {/* ACTIVITEIT DROPDOWN */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                   <div className="flex items-center gap-2 mb-1">
                      <Briefcase size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.activityLevelLabel}</span>
                   </div>
                   <div className="relative">
                      <select 
                        value={state.profile.activityLevel} 
                        onChange={(e) => updateProfile({ activityLevel: e.target.value as any })} 
                        className="w-full bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl text-xs font-bold outline-none appearance-none text-slate-700 uppercase"
                      >
                         <option value="light">{t.levelLight}</option>
                         <option value="moderate">{t.levelModerate}</option>
                         <option value="heavy">{t.levelHeavy}</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                   </div>
                </div>

                {/* TEMPO DROPDOWN */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                   <div className="flex items-center gap-2 mb-1">
                      <Zap size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.paceTitle}</span>
                   </div>
                   <div className="relative">
                      <select 
                        value={state.profile.weightLossSpeed} 
                        onChange={(e) => updateProfile({ weightLossSpeed: e.target.value as any })} 
                        className="w-full bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl text-xs font-bold outline-none appearance-none text-slate-700 uppercase"
                      >
                         <option value="slow">{t.speedSlow}</option>
                         <option value="average">{t.speedAverage}</option>
                         <option value="fast">{t.speedFast}</option>
                         <option value="custom">{t.customPace}</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                   </div>
                   {state.profile.weightLossSpeed === 'custom' && (
                     <div className="mt-2 flex items-center justify-between bg-orange-50 p-2 rounded-xl border border-orange-100 animate-in slide-in-from-top-1 duration-200">
                        <label className="text-[9px] font-bold text-orange-700 uppercase">Kies Datum</label>
                        <input type="date" min={minSafeDate} value={state.profile.customTargetDate || ''} onChange={(e) => updateProfile({ customTargetDate: e.target.value })} className="bg-white border-none py-1 px-2 rounded-md font-bold text-[11px] text-orange-600 outline-none" />
                     </div>
                   )}
                </div>

                {/* SETTINGS / DATA ROW */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex items-center justify-between">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.dataStorage}</span>
                   <div className="flex gap-2">
                      <button onClick={handleExportData} className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 active:scale-95 transition-all"><FileDown size={16}/></button>
                      <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 active:scale-95 transition-all"><FileUp size={16}/></button>
                      <button onClick={async () => { if(confirm(t.dataManagement.clearConfirm)){ await idb.clear(); window.location.reload(); } }} className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center text-red-600 border border-red-100 hover:bg-red-100 active:scale-95 transition-all"><Trash2 size={16}/></button>
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleRestoreData} accept=".json" className="hidden" />
                </div>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-1.5 flex justify-between items-center">
          {[ 
            { id: 'dashboard', icon: LayoutDashboard, label: t.tabs.dashboard }, 
            { id: 'meals', icon: Utensils, label: t.tabs.meals }, 
            { id: 'activity', icon: Activity, label: t.tabs.activity }, 
            { id: 'profile', icon: UserIcon, label: t.tabs.profile } 
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all ${activeTab === tab.id ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <tab.icon size={tab.id === activeTab ? 20 : 18} />
              <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="number"] { -moz-appearance: textfield; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="date"]::-webkit-calendar-picker-indicator { background: transparent; bottom: 0; color: transparent; cursor: pointer; height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto; }
      `}</style>
    </div>
  );
}
