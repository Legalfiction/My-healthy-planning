
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
  BarChart3,
  Pencil,
  CalendarDays,
  Info,
  Sun,
  Moon,
  Apple,
  Beer,
  ArrowRight,
  Armchair,
  Stethoscope,
  Construction,
  Bike,
  Dumbbell,
  Timer,
  Cookie,
  Coffee,
  Sandwich,
  Pizza,
  Cherry
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
      <div className={`px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border backdrop-blur-md bg-opacity-95 ${
        type === 'error' ? 'bg-red-900 border-red-700 text-white' : 'bg-slate-900 border-slate-700 text-white'
      }`}>
        {type === 'error' ? <AlertCircle size={16} className="text-red-400" /> : <Check size={16} className="text-emerald-400" />}
        <span className="text-[14px] font-bold uppercase tracking-wide">{message}</span>
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
  const [showActivityAdvice, setShowActivityAdvice] = useState(false);
  
  // Custom Selection States
  const [isActivitySelectOpen, setIsActivitySelectOpen] = useState(false);
  const [isPaceSelectOpen, setIsPaceSelectOpen] = useState(false);
  const [isMealMomentOpen, setIsMealMomentOpen] = useState(false);
  const [isActivityTypeOpen, setIsActivityTypeOpen] = useState(false);

  const [showMyList, setShowMyList] = useState(false);
  const [showMyActivityList, setShowMyActivityList] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [openPickerMoment, setOpenPickerMoment] = useState<MealMoment | null>(null);
  const [stagedProduct, setStagedProduct] = useState<{ opt: MealOption, currentKcal: number } | null>(null);
  const [pickerFilter, setPickerFilter] = useState<'all' | 'breakfast' | 'lunch' | 'diner' | 'snacks' | 'drink' | 'fruit' | 'alcohol'>('all');
  
  const [selectedActivityId, setSelectedActivityId] = useState<string>(ACTIVITY_TYPES[0].id);
  const [newFood, setNewFood] = useState({ name: '', kcal: '', unit: '', cats: [] as string[], isDrink: false, isAlcohol: false });
  const [newActivityInput, setNewActivityInput] = useState({ name: '', kcalPerHour: '' });
  
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
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
    const last7DaysBurn = [];
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
      last7DaysBurn.push({ date: dateStr, burn, label: d.toLocaleDateString(state.language, { weekday: 'short' }) });
    }

    const currentBMI = calculateBMI(globalLatestWeight, state.profile.height);
    const activityNorm = state.profile.activityLevel === 'light' ? 400 : state.profile.activityLevel === 'moderate' ? 250 : 100;
    const avgBurn = last7DaysBurn.reduce((sum, d) => sum + d.burn, 0) / 7;

    const calculateMinForNorm = (met: number) => {
      if (!met || !globalLatestWeight) return 0;
      return Math.ceil((activityNorm * 60) / (met * globalLatestWeight));
    };

    const adviceOptions = [
      { name: 'Wandelen (stevig)', met: 4.5, icon: Footprints, mins: calculateMinForNorm(4.5) },
      { name: 'Hardlopen (10 km/u)', met: 9.8, icon: Flame, mins: calculateMinForNorm(9.8) },
      { name: 'Fietsen (stevig)', met: 8.0, icon: Bike, mins: calculateMinForNorm(8.0) },
      { name: 'Fitness (kracht)', met: 5.5, icon: Dumbbell, mins: calculateMinForNorm(5.5) }
    ];

    return { weightHistory, consistency, currentBMI, last7DaysBurn, activityNorm, avgBurn, adviceOptions };
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
              <h2 className="text-2xl font-bold text-slate-800">{t.infoModal.title}</h2>
              <button onClick={() => setShowInfo(false)} className="p-2 bg-slate-100 rounded-xl"><X size={24}/></button>
            </div>
            <div className="space-y-8">
              <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200"><p className="text-[16px] text-slate-600 leading-relaxed italic">{t.infoModal.aboutText}</p></section>
              <section className="space-y-3"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"><Zap size={16}/> {t.infoModal.scienceTitle}</h3><p className="text-[16px] text-slate-600 leading-relaxed">{t.infoModal.scienceText}</p></section>
              <section className="space-y-4"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"><Settings size={16}/> {t.infoModal.manualTitle}</h3><div className="space-y-3">{t.infoModal.steps.map((step: any, i: number) => (<div key={i} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl"><span className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-full text-xs font-bold shrink-0">{i+1}</span><div><h4 className="text-sm font-bold text-slate-800 uppercase">{step.title}</h4><p className="text-xs text-slate-500 mt-1">{step.desc}</p></div></div>))}</div></section>
              <footer className="pt-8 border-t border-slate-100 text-center space-y-2">
                <p className="text-[12px] text-slate-400">Vragen? Neem contact op via <span className="text-indigo-500 font-bold">info@ynnovator.com</span></p>
                <p className="text-[10px] text-slate-300">{t.infoModal.copyright}</p>
              </footer>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY ADVICE MODAL */}
      {showActivityAdvice && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <Timer size={28} />
                    <h2 className="text-xl font-black uppercase tracking-tight">Afslank Advies</h2>
                 </div>
                 <button onClick={() => setShowActivityAdvice(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={24} />
                 </button>
              </div>
              <div className="p-8 space-y-8">
                 <p className="text-[16px] text-slate-500 font-medium leading-relaxed">
                    Om jouw dagelijkse norm van <span className="text-indigo-600 font-black">{statsData.activityNorm} kcal</span> te halen, adviseren wij:
                 </p>
                 <div className="space-y-4">
                    {statsData.adviceOptions.map((adv, i) => (
                       <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                <adv.icon size={26} />
                             </div>
                             <div>
                                <h4 className="text-sm font-black uppercase text-slate-800 leading-none mb-1.5">{adv.name}</h4>
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{adv.met} MET</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-2xl font-black text-indigo-600">{adv.mins}</span>
                             <span className="text-[12px] font-black text-slate-400 uppercase block leading-none">min.</span>
                          </div>
                       </div>
                    ))}
                 </div>
                 <button onClick={() => setShowActivityAdvice(false)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[14px] shadow-lg active:scale-[0.98] transition-all">Begrepen</button>
              </div>
           </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeTab === 'stats' ? (
              <button onClick={() => setActiveTab('dashboard')} className="p-2.5 bg-slate-50 rounded-xl text-slate-600"><ChevronLeft size={22}/></button>
            ) : (
              <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><ChevronLeft size={22}/></button>
            )}
            <div className="flex flex-col items-center min-w-[80px]">
              <span className="text-[12px] font-bold text-orange-500 uppercase tracking-tighter leading-none mb-1">{activeTab === 'stats' ? 'Rapportage' : dateParts.weekday}</span>
              <span className="text-base font-bold text-slate-800 leading-none">{activeTab === 'stats' ? 'Inzichten' : `${dateParts.day} ${dateParts.month}`}</span>
            </div>
            {activeTab !== 'stats' && (
              <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><ChevronRight size={22}/></button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select value={state.language} onChange={(e) => setState(prev => ({ ...prev, language: e.target.value as Language }))} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[12px] font-bold appearance-none pr-8 outline-none uppercase shadow-sm">{Object.keys(LANGUAGE_FLAGS).map(l => <option key={l} value={l}>{LANGUAGE_FLAGS[l as Language]} {l.toUpperCase()}</option>)}</select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={() => setShowWeeklyPopover(!showWeeklyPopover)} className={`bg-white border px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-sm transition-all ${showWeeklyPopover ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}><Scale size={16} className="text-orange-500" /><span className="text-sm font-bold tabular-nums">{globalLatestWeight.toFixed(1)} <span className="text-[10px] text-slate-400 font-black">KG</span></span></button>
          </div>
        </div>
      </header>

      {showWeeklyPopover && (
        <div ref={popoverRef} className="absolute top-16 right-4 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
           <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3"><CalendarDays size={18} className="text-orange-500" /><h3 className="font-bold text-[12px] uppercase tracking-widest text-slate-800">{t.weeklySummary}</h3></div>
           <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-bold uppercase text-[11px]">{t.avgDaily}</span><span className="font-black text-slate-700">{weeklyStats.avgDailyIntake} <span className="text-[11px] text-slate-400">KCAL</span></span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-bold uppercase text-[11px]">{t.totalBurn}</span><span className="font-black text-emerald-500">{weeklyStats.totalBurned} <span className="text-[11px]">KCAL</span></span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-bold uppercase text-[11px]">{t.weeklyWeightChange}</span><span className={`font-black ${weeklyStats.weightChange <= 0 ? "text-emerald-500" : "text-red-500"}`}>{weeklyStats.weightChange > 0 ? '+' : ''}{weeklyStats.weightChange.toFixed(1)} <span className="text-[11px]">KG</span></span></div>
           </div>
        </div>
      )}

      <main className="flex-grow overflow-y-auto custom-scrollbar p-5 pb-32" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                <div><p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">{t.dailyBudget}</p><h2 className="text-4xl font-black text-slate-900 tracking-tighter">{totals.actualIntake}<span className="text-base font-medium text-slate-400 ml-2">/ {totals.currentAdjustedGoal}</span></h2></div>
                <div className="text-right"><p className="text-[12px] font-bold text-orange-500 uppercase tracking-[0.15em] mb-1.5">{t.remainingToday}</p><p className="text-3xl font-black text-orange-500 tabular-nums tracking-tight">{Math.max(0, totals.currentAdjustedGoal - totals.actualIntake)}</p></div>
              </div>
              <div className="space-y-2 mb-6"><div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex"><div className={`h-full transition-all duration-700 ${totals.calorieStatusColor}`} style={{ width: `${Math.min(totals.intakePercent, 100)}%` }} /></div><div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-slate-400"><span>{Math.round(totals.intakePercent)}% VERBRUIKT</span><span>{totals.currentAdjustedGoal} KCAL MAX</span></div></div>
              
              <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center text-[11px] font-black uppercase border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400">
                  <Zap size={12} className="text-orange-400" fill="currentColor" />
                  <span>{t.oldBudgetLabel}: <span className="text-slate-600">{maintenanceKcal}</span></span>
                </div>
                <div className="flex items-center gap-2 text-emerald-500">
                  <TrendingDown size={12} />
                  <span>BESPARING: -{maintenanceKcal - state.profile.dailyBudget}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-100 mt-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm"><Flame size={20}/></div><div><p className="text-[11px] font-bold text-slate-400 uppercase leading-none mb-1.5 tracking-tight">{t.activityCalories}</p><p className="text-base font-black text-emerald-600 leading-none">+{totals.activityBurn}</p></div></div><div className="flex items-center gap-3 border-l border-slate-100 pl-4"><div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shadow-sm"><Target size={20}/></div><div><p className="text-[11px] font-bold text-slate-400 uppercase leading-none mb-1.5 tracking-tight">{t.targetReached}</p><p className="text-base font-black text-blue-600 leading-none">{totals.targetDate ? new Intl.DateTimeFormat(state.language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'short' }).format(new Date(totals.targetDate)) : '--'}</p></div></div></div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Scale size={14}/> {t.weighMoment}</h3><div className="flex items-end gap-1.5"><input type="number" step="0.1" placeholder="00.0" value={(state.dailyLogs[selectedDate] as DailyLog)?.weight || ''} onChange={(e) => { const val = e.target.value ? Number(e.target.value) : undefined; setState(prev => { const logs = { ...prev.dailyLogs }; logs[selectedDate] = { ...((logs[selectedDate] as DailyLog) || { date: selectedDate, meals: {}, activities: [] }), weight: val }; return { ...prev, dailyLogs: logs }; }); }} className="w-full bg-slate-50 border-none p-2 text-2xl font-black text-slate-800 focus:ring-1 focus:ring-orange-200 rounded-xl outline-none tabular-nums" /><span className="text-[12px] font-black text-slate-300 mb-2.5 uppercase">kg</span></div></div>
              <div onClick={() => setActiveTab('stats')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer active:bg-slate-50 transition-colors">
                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between"><span>INZICHTEN</span><ArrowRight size={12} className="text-slate-300" /></h3>
                <div className="flex items-baseline gap-1.5"><span className="text-2xl font-black text-emerald-500">-{totals.weightLostSoFar.toFixed(1)}</span><span className="text-[12px] font-black text-slate-300 uppercase">kg</span></div>
                <div className="h-2 w-full bg-slate-100 rounded-full mt-3 overflow-hidden"><div className="h-full bg-emerald-500" style={{width: `${totals.weightProgressPercent}%`}} /></div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl flex items-center justify-between group cursor-pointer active:bg-orange-100 transition-all shadow-sm" onClick={() => setShowInfo(true)}><div className="flex items-center gap-4"><div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-100"><Info size={24}/></div><div><h4 className="text-base font-black text-slate-800 uppercase leading-none mb-1.5">Wetenschappelijke basis</h4><p className="text-xs text-slate-500 leading-none font-medium">Hoe we jouw budget berekenen</p></div></div><ChevronRight size={20} className="text-orange-300 group-hover:translate-x-1 transition-transform" /></div>

            <div onClick={() => setActiveTab('stats')} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between group cursor-pointer active:bg-slate-50 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100"><BarChart3 size={24}/></div>
                <div><h4 className="text-base font-black text-slate-800 uppercase leading-none mb-1.5">Gedetailleerde trends</h4><p className="text-xs text-slate-500 leading-none font-medium">Voortgang en gewichtsverloop</p></div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingDown size={16} className="text-blue-500" /> Gewichtsverloop</h3>
                <span className="text-[11px] font-black text-slate-300 uppercase">Trend</span>
              </div>
              <div className="h-44 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                  {[0, 25, 50, 75, 100].map(y => (
                    <line key={y} x1="0" y1={1.5 * y} x2="400" y2={1.5 * y} stroke="#f1f5f9" strokeWidth="1" />
                  ))}
                  {(() => {
                    const h = 150; const w = 400;
                    const history = [{ weight: state.profile.startWeight }, ...statsData.weightHistory, { weight: globalLatestWeight }];
                    if (history.length < 2) return <text x="200" y="75" textAnchor="middle" className="text-xs fill-slate-300 uppercase font-black">Niet genoeg data</text>;
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
                        <polyline fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points} />
                        {(() => {
                          const targetY = h - ((state.profile.targetWeight - minW) / range) * h;
                          return <line x1="0" y1={targetY} x2="400" y2={targetY} stroke="#f97316" strokeWidth="1" strokeDasharray="6,3" opacity="0.5" />;
                        })()}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* ACTIVITY MONITOR CARD */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Armchair size={16} className="text-indigo-500" /> Bewegingsmonitor</h3>
                <span className="text-[11px] font-black text-slate-300 uppercase">Laatste 7 dagen</span>
              </div>
              <div className="h-48 w-full relative px-2 flex items-end justify-between gap-4">
                {statsData.last7DaysBurn.map((day, idx) => {
                  const maxChart = Math.max(statsData.activityNorm * 1.5, ...statsData.last7DaysBurn.map(d => d.burn), 500);
                  const barHeight = (day.burn / maxChart) * 100;
                  const normLineY = (statsData.activityNorm / maxChart) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 relative group">
                      <div className="w-full bg-indigo-50 rounded-t-xl transition-all duration-500 relative h-36 flex items-end overflow-hidden">
                        <div className="w-full bg-indigo-400/80 group-hover:bg-indigo-500 transition-colors" style={{ height: `${barHeight}%` }} />
                      </div>
                      <span className="text-[11px] font-black text-slate-400 uppercase mt-4">{day.label}</span>
                      {idx === 0 && (
                        <div className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500/50 pointer-events-none z-20" style={{ bottom: `${normLineY + 40}px` }}>
                          <span className="absolute -top-5 right-0 text-[10px] font-black text-emerald-600 uppercase bg-white/80 px-2 rounded-md border border-emerald-100 shadow-sm">Norm: {statsData.activityNorm}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-start gap-4">
                <p className="text-[16px] text-slate-600 leading-relaxed font-medium flex-grow">
                  Je gemiddelde is <span className={`font-black uppercase ${statsData.avgBurn >= statsData.activityNorm ? 'text-emerald-500' : 'text-orange-500'}`}>{Math.round(statsData.avgBurn)} kcal</span>. Bij jouw levensstijl adviseren we <span className="font-black text-slate-800">{statsData.activityNorm} kcal</span>.
                </p>
                <button onClick={() => setShowActivityAdvice(true)} className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-100 transition-colors shrink-0 shadow-sm border border-indigo-100 active:scale-90"><Info size={20} /></button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={16} className="text-emerald-500" /> Intake Consistentie</h3>
                <span className="text-[11px] font-black text-slate-300 uppercase">Plan vs Werkelijk</span>
              </div>
              <div className="flex items-end justify-between h-36 gap-4 px-2">
                {statsData.consistency.map((day, idx) => {
                  const maxVal = Math.max(...statsData.consistency.map(d => d.budget), 3000);
                  const intakeHeight = (day.intake / maxVal) * 100;
                  const isOver = day.intake > day.budget && day.intake > 0;
                  const isEmpty = day.intake === 0;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                      <div className="w-full relative h-28 flex items-end justify-center">
                        <div className="absolute w-full border-t-2 border-slate-200 z-10" style={{ bottom: `${(day.budget / maxVal) * 100}%` }} />
                        <div className={`w-full rounded-t-md transition-all duration-500 ${isEmpty ? 'bg-slate-50' : (isOver ? 'bg-orange-400' : 'bg-emerald-400')}`} style={{ height: `${intakeHeight}%` }} />
                      </div>
                      <span className="text-[11px] font-black text-slate-400 uppercase mt-4">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* RICH SELECT FOR MEAL MOMENT */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="relative flex-grow">
                <button 
                  onClick={() => setIsMealMomentOpen(!isMealMomentOpen)}
                  className="w-full bg-slate-50 px-4 py-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <Utensils size={18} className="text-orange-500" />
                    <span className="text-sm font-black uppercase text-slate-800">
                      {openPickerMoment || t.addFoodDrink}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isMealMomentOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMealMomentOpen && (
                  <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {MEAL_MOMENTS.map((moment) => {
                        const momentIcons: Record<string, any> = { 
                          'Ontbijt': Coffee, 
                          'Ochtend Snack': Apple, 
                          'Lunch': Sandwich, 
                          'Middag Snack': Cookie, 
                          'Diner': Pizza, 
                          'Avond Snack': Cherry 
                        };
                        const Icon = momentIcons[moment] || Utensils;
                        const descriptions: Record<string, string> = {
                          'Ontbijt': 'Start de dag vol energie',
                          'Ochtend Snack': 'Licht tussenmoment (10:00)',
                          'Lunch': 'Eiwitrijke middagmaaltijd',
                          'Middag Snack': 'Boost voor de namiddag',
                          'Diner': 'De hoofdmaaltijd van de dag',
                          'Avond Snack': 'Lichte afsluiting van de avond'
                        };
                        return (
                          <button 
                            key={moment}
                            onClick={() => { setOpenPickerMoment(moment); setIsMealMomentOpen(false); setStagedProduct(null); setSearchTerm(''); setPickerFilter('all'); }}
                            className="w-full px-6 py-4 flex items-center gap-5 text-left hover:bg-orange-50 transition-colors"
                          >
                            <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500 shadow-sm border border-orange-100">
                              <Icon size={20} />
                            </div>
                            <div>
                              <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{moment}</h4>
                              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{descriptions[moment]}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setShowMyList(!showMyList)} className={`p-3.5 rounded-xl border shadow-sm transition-all ${showMyList ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                <Pencil size={22} />
              </button>
            </div>

            {showMyList ? (
              <div className="space-y-5 animate-in slide-in-from-right-2 duration-300"><div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5"><div className="flex justify-between items-center"><h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{editingFoodId ? 'Item Aanpassen' : 'Nieuw Product'}</h3></div><div className="flex gap-3"><button onClick={() => setNewFood(p => ({...p, isDrink: false, isAlcohol: false}))} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 border transition-all text-[12px] font-black uppercase ${(!newFood.isDrink && !newFood.isAlcohol) ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-slate-200 text-slate-300 bg-slate-50/50'}`}><Utensils size={16} /> {t.mealLabel}</button><button onClick={() => setNewFood(p => ({...p, isDrink: true, isAlcohol: false}))} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 border transition-all text-[12px] font-black uppercase ${newFood.isDrink ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-slate-200 text-slate-300 bg-slate-50/50'}`}><GlassWater size={16} /> {t.drinkLabel}</button></div><input type="text" placeholder={t.productName} value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-base font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-orange-100 uppercase" /><div className="grid grid-cols-2 gap-4"><input type="number" placeholder={t.kcalLabel} value={newFood.kcal} onChange={e => setNewFood({...newFood, kcal: e.target.value})} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-base font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-orange-100" /><input type="text" placeholder={t.portionPlaceholder} value={newFood.unit} onChange={e => setNewFood({...newFood, unit: e.target.value})} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-base font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-orange-100 uppercase" /></div><button onClick={addCustomFood} disabled={!newFood.name || !newFood.kcal} className={`w-full py-4 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 transition-all shadow-lg ${(!newFood.name || !newFood.kcal) ? 'bg-slate-200 text-white' : 'bg-orange-500 text-white active:scale-[0.98]'}`}>{editingFoodId ? <Check size={18} /> : <Plus size={18} />} {editingFoodId ? 'Wijziging Opslaan' : t.addToMyList}</button></div></div>
            ) : (
              <div className="space-y-5">{openPickerMoment && (<div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200"><div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">{[ { id: 'breakfast', icon: Sun, label: 'Ontbijt' }, { id: 'lunch', icon: Utensils, label: 'Lunch' }, { id: 'diner', icon: Moon, label: 'Diner' }, { id: 'snacks', icon: Cookie, label: 'Snack' }, { id: 'drink', icon: GlassWater, label: 'Drink' }, { id: 'fruit', icon: Apple, label: 'Fruit' }, { id: 'alcohol', icon: Beer, label: 'Alcohol' } ].map(f => (<button key={f.id} onClick={() => { setPickerFilter(f.id as any); setStagedProduct(null); }} className={`px-4 py-2.5 rounded-xl text-[12px] font-black uppercase whitespace-nowrap transition-all border flex items-center gap-2 ${pickerFilter === f.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-50 text-slate-400 border-slate-200'}`}><f.icon size={14} />{f.label}</button>))}<button onClick={() => { setPickerFilter('all'); setStagedProduct(null); }} className={`px-4 py-2.5 rounded-xl text-[12px] font-black uppercase whitespace-nowrap transition-all border ${pickerFilter === 'all' ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>Alles</button></div><div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" className="w-full bg-slate-50 border border-slate-200 pl-11 pr-11 py-3.5 rounded-xl text-base font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-orange-100 uppercase" placeholder={t.searchProduct} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setStagedProduct(null); }} /></div>{productsToDisplayInResults.length > 0 && !stagedProduct && (<div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-50 bg-slate-50/50 rounded-2xl border border-slate-100">{productsToDisplayInResults.map(opt => (<button key={opt.id} onClick={() => { setStagedProduct({ opt, currentKcal: opt.kcal }); }} className="flex items-center gap-4 p-4 hover:bg-orange-50 transition-all text-left w-full"><div className="text-orange-500 shrink-0">{opt.isAlcohol ? <Beer size={18}/> : opt.isDrink ? <GlassWater size={18}/> : <Utensils size={18}/>}</div><div className="flex flex-col flex-grow truncate"><span className="text-[15px] font-black text-slate-800 uppercase truncate leading-tight">{getTranslatedName(opt.id, opt.name)}</span><span className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">{opt.kcal} KCAL • {opt.unitName}</span></div><div className="w-8 h-8 flex items-center justify-center bg-orange-100 rounded-lg text-orange-600 shadow-sm"><Plus size={16} /></div></button>))}</div>)}{stagedProduct && (<div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 space-y-4 animate-in zoom-in-95 duration-200"><div className="flex items-center gap-4"><div className="p-3 bg-white rounded-xl text-orange-500 shadow-sm border border-orange-100"><Utensils size={22}/></div><div className="truncate"><h4 className="text-base font-black text-slate-800 uppercase truncate leading-tight">{getTranslatedName(stagedProduct.opt.id, stagedProduct.opt.name)}</h4><p className="text-[12px] text-slate-400 uppercase font-black tracking-widest">{stagedProduct.opt.unitName}</p></div></div><div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-2"><button onClick={() => setStagedProduct(p => p ? {...p, currentKcal: Math.max(0, p.currentKcal - p.opt.kcal)} : p)} className="p-3 hover:bg-slate-50 rounded-lg text-orange-500"><Minus size={20}/></button><div className="flex flex-col items-center"><input type="number" className="w-20 bg-transparent border-none p-0 text-3xl font-black text-slate-800 focus:ring-0 text-center" value={stagedProduct.currentKcal} onChange={(e) => setStagedProduct(p => p ? {...p, currentKcal: Number(e.target.value)} : p)} /><span className="text-[12px] font-black text-slate-300 uppercase leading-none">kcal</span></div><button onClick={() => setStagedProduct(p => p ? {...p, currentKcal: p.currentKcal + p.opt.kcal} : p)} className="p-3 hover:bg-slate-50 rounded-lg text-orange-500"><Plus size={20}/></button></div><div className="flex gap-3 pt-2"><button onClick={() => setStagedProduct(null)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 rounded-xl font-black text-[12px] uppercase">Annuleren</button><button onClick={() => { addMealItem(openPickerMoment!, { name: stagedProduct.opt.name, kcal: stagedProduct.currentKcal, quantity: 1, mealId: stagedProduct.opt.id, isDrink: stagedProduct.opt.isDrink, isAlcohol: stagedProduct.opt.isAlcohol }); setOpenPickerMoment(null); setStagedProduct(null); setSearchTerm(''); }} className="flex-[2] py-4 bg-orange-500 text-white rounded-xl font-black text-[12px] uppercase shadow-md active:scale-[0.98] transition-all">Toevoegen</button></div></div>)}</div>)}<div className="space-y-4">{MEAL_MOMENTS.map(moment => { const items = (currentLog.meals[moment] as LoggedMealItem[]) || []; if (items.length === 0) return null; const momentTotal = items.reduce((sum, item) => sum + item.kcal, 0); return (<div key={moment} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="bg-slate-50 px-4 py-2.5 flex justify-between items-center border-b border-slate-100"><h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.moments[moment]}</h4><span className="text-sm font-black text-slate-800">{momentTotal} <span className="text-[11px] text-slate-400">KCAL</span></span></div><div className="divide-y divide-slate-50">{items.map(item => { const baseItem = allAvailableProducts.find(o => o.id === item.mealId); const baseKcal = baseItem ? baseItem.kcal : 50; return (<div key={item.id} className="flex items-center justify-between p-4"><div className="flex items-center gap-4 truncate flex-grow"><div className="text-orange-500 shrink-0">{item.isAlcohol ? <Beer size={18}/> : item.isDrink ? <GlassWater size={18}/> : <Utensils size={18}/>}</div><span className="text-[16px] font-black text-slate-800 uppercase truncate leading-none">{getTranslatedName(item.mealId || '', item.name)}</span></div><div className="flex items-center gap-4 shrink-0"><div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100"><button onClick={() => updateMealItemKcal(moment, item.id, item.kcal - baseKcal)} className="text-slate-400 hover:text-orange-500"><Minus size={14}/></button><input type="number" className="w-10 bg-transparent border-none p-0 text-sm font-black text-slate-800 focus:ring-0 text-center outline-none" value={Math.round(item.kcal)} onChange={(e) => updateMealItemKcal(moment, item.id, Number(e.target.value))} /><button onClick={() => updateMealItemKcal(moment, item.id, item.kcal + baseKcal)} className="text-slate-400 hover:text-orange-500"><Plus size={14}/></button></div><button onClick={() => { setState(prev => { const logs = { ...prev.dailyLogs }; const log = logs[selectedDate]; if (log) log.meals[moment] = (log.meals[moment] as LoggedMealItem[]).filter(i => i.id !== item.id); return { ...prev, dailyLogs: logs }; }); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button></div></div>); })}</div></div>); })}</div></div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-5 animate-in fade-in duration-300">
             {/* RICH SELECT FOR ACTIVITY TYPE */}
             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="relative flex-grow">
                <button 
                  onClick={() => setIsActivityTypeOpen(!isActivityTypeOpen)}
                  className="w-full bg-slate-50 px-4 py-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <Activity size={18} className="text-orange-500" />
                    <span className="text-sm font-black uppercase text-slate-800">
                      {getTranslatedName(selectedActivityId, [...ACTIVITY_TYPES, ...state.customActivities].find(a => a.id === selectedActivityId)?.name || 'Kies activiteit')}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isActivityTypeOpen ? 'rotate-180' : ''}`} />
                </button>
                {isActivityTypeOpen && (
                  <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {[...ACTIVITY_TYPES, ...state.customActivities].map((act) => {
                        const iconMap: Record<string, any> = { 
                          'wandelen': Footprints, 
                          'hardlopen': Flame, 
                          'fietsen': Bike, 
                          'fitness': Dumbbell, 
                          'yoga': Armchair 
                        };
                        const Icon = Object.keys(iconMap).find(k => act.id.includes(k)) ? iconMap[Object.keys(iconMap).find(k => act.id.includes(k))!] : Activity;
                        const activityDescriptions: Record<string, string> = {
                          'act_wandelen_slow': 'Rustig tempo, lage intensiteit',
                          'act_wandelen_norm': 'Stevig doorstappen',
                          'act_wandelen_brisk': 'Zeer vlot tempo, actieve verbranding',
                          'act_hardlopen_10': 'Hoge verbranding, cardio focus',
                          'act_fietsen_norm': 'Woon-werk verkeer tempo',
                          'act_fitness_kracht': 'Spieropbouw en krachttraining',
                          'act_crossfit': 'HIIT / Boot camp intensief'
                        };
                        return (
                          <button 
                            key={act.id}
                            onClick={() => { setSelectedActivityId(act.id); setIsActivityTypeOpen(false); }}
                            className="w-full px-6 py-4 flex items-center gap-5 text-left hover:bg-orange-50 transition-colors"
                          >
                            <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500 shadow-sm border border-orange-100">
                              <Icon size={20} />
                            </div>
                            <div className="flex-grow">
                              <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{getTranslatedName(act.id, act.name)}</h4>
                              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{activityDescriptions[act.id] || 'Registreer je beweging'}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setShowMyActivityList(!showMyActivityList)} className={`p-3.5 rounded-xl border shadow-sm transition-all ${showMyActivityList ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                <Pencil size={22} />
              </button>
            </div>

             {showMyActivityList ? (
                <div className="space-y-5 animate-in slide-in-from-right-2 duration-300"><div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5"><div className="flex justify-between items-center"><h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{editingActivityId ? 'Activiteit Wijzigen' : t.newActivity}</h3></div><div className="grid grid-cols-1 gap-4"><input type="text" placeholder={t.activityName} value={newActivityInput.name} onChange={e => setNewActivityInput({...newActivityInput, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-base font-bold uppercase outline-none focus:ring-2 focus:ring-orange-100" /><input type="number" placeholder={t.kcalPerHour} value={newActivityInput.kcalPerHour} onChange={e => setNewActivityInput({...newActivityInput, kcalPerHour: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-base font-bold outline-none focus:ring-2 focus:ring-orange-100" /></div><button onClick={addCustomActivity} disabled={!newActivityInput.name || !newActivityInput.kcalPerHour} className={`w-full py-4 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 transition-all shadow-lg ${(!newActivityInput.name || !newActivityInput.kcalPerHour) ? 'bg-slate-200 text-white' : 'bg-orange-500 text-white active:scale-[0.98]'}`}>{editingActivityId ? <Check size={18}/> : <Plus size={18}/>} {editingActivityId ? 'Wijziging Opslaan' : t.addToMyList}</button></div></div>
             ) : (
               <div className="space-y-5"><div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"><div className="relative flex-grow"><input id="act-val" type="number" placeholder={t.minutes} className="w-full bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-base font-black outline-none text-center focus:ring-2 focus:ring-orange-100 placeholder:text-slate-300" /></div><button onClick={() => { const val = (document.getElementById('act-val') as HTMLInputElement).value; if (val) { addActivity(selectedActivityId, Number(val)); (document.getElementById('act-val') as HTMLInputElement).value = ''; } }} className="bg-orange-500 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center"><Plus size={24}/></button></div><div className="space-y-3">{currentLog.activities.map(act => { const type = [...ACTIVITY_TYPES, ...(state.customActivities || [])].find(t => t.id === act.typeId); return (<div key={act.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group animate-in fade-in slide-in-from-left-2 duration-200"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500"><Activity size={20}/></div><div><p className="text-[16px] font-black text-slate-800 uppercase leading-none mb-1.5">{getTranslatedName(act.typeId, type?.name || '')}</p><p className="text-xs font-bold text-slate-400 uppercase leading-none">{act.value} {t.minutes} • <span className="text-emerald-500 font-black">+{Math.round(act.burnedKcal)} KCAL</span></p></div></div><button onClick={() => setState(prev => { const logs = { ...prev.dailyLogs }; const log = logs[selectedDate]; if (log) log.activities = log.activities.filter(a => a.id !== act.id); return { ...prev, dailyLogs: logs }; })} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20}/></button></div>); })}</div></div>
             )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-3 animate-in fade-in duration-300 pb-28">
             {/* COMPACT RESULT BAR */}
             <div className="bg-white border border-slate-200 px-6 py-4 rounded-3xl flex justify-between items-center shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500"><Target size={22} /></div>
                   <div>
                     <span className="text-[12px] font-black uppercase text-slate-400 block tracking-widest leading-none mb-1">DOEL</span>
                     <span className="text-base font-black text-slate-800">{state.profile.dailyBudget} <span className="text-[12px]">KCAL</span></span>
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-[12px] font-black uppercase text-slate-400 block tracking-widest leading-none mb-1">STREEFDATUM</span>
                   <span className="text-sm font-black text-slate-800 uppercase">
                      {totals.targetDate ? new Intl.DateTimeFormat(state.language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'short' }).format(new Date(totals.targetDate)) : '--'}
                   </span>
                </div>
             </div>

             {/* STACKED BIOMETRY BLOCK (FREEZE) */}
             <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
                <div className="flex items-center justify-between p-4">
                   <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{t.gender}</span>
                   <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                      <button onClick={() => updateProfile({ gender: 'man' })} className={`px-6 py-2 rounded-lg text-[12px] font-black uppercase transition-all ${state.profile.gender === 'man' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}>Man</button>
                      <button onClick={() => updateProfile({ gender: 'woman' })} className={`px-6 py-2 rounded-lg text-[12px] font-black uppercase transition-all ${state.profile.gender === 'woman' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}>Vrouw</button>
                   </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100">
                   <div className="p-4 flex flex-col gap-1.5"><label className="text-[12px] font-black text-slate-400 uppercase tracking-tight">{t.age}</label><div className="flex items-center justify-between"><select value={state.profile.birthYear} onChange={(e) => updateProfile({ birthYear: Number(e.target.value) })} className="w-full bg-transparent text-base font-black outline-none appearance-none text-slate-800 tabular-nums">{birthYears.map(y => <option key={y} value={y}>{y}</option>)}</select><ChevronDown size={14} className="text-slate-300" /></div></div>
                   <div className="p-4 flex flex-col gap-1.5"><label className="text-[12px] font-black text-slate-400 uppercase tracking-tight">{t.height.split(' ')[0]}</label><div className="flex items-center justify-between"><input type="number" value={state.profile.height} onChange={(e) => updateProfile({ height: Number(e.target.value) })} className="w-full bg-transparent text-base font-black outline-none text-slate-800 tabular-nums" /><span className="text-[12px] font-black text-slate-300 uppercase">cm</span></div></div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100">
                   <div className="p-4 flex flex-col gap-1.5"><label className="text-[12px] font-black text-slate-400 uppercase tracking-tight">Start</label><div className="flex items-center justify-between"><input type="number" value={state.profile.startWeight} onChange={(e) => updateProfile({ startWeight: Number(e.target.value) })} className="w-full bg-transparent text-base font-black outline-none text-slate-800 tabular-nums" /><span className="text-[12px] font-black text-slate-300 uppercase">kg</span></div></div>
                   <div className="p-4 flex flex-col gap-1.5 bg-orange-50/20"><label className="text-[12px] font-black text-orange-500 uppercase tracking-tight">Doel</label><div className="flex items-center justify-between"><input type="number" value={state.profile.targetWeight} onChange={(e) => updateProfile({ targetWeight: Number(e.target.value) })} className="w-full bg-transparent text-base font-black outline-none text-orange-600 tabular-nums" /><span className="text-[12px] font-black text-orange-300 uppercase">kg</span></div></div>
                </div>
             </div>

             {/* RICH SELECT: ACTIVITY LEVEL */}
             <div className="space-y-4">
                <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                   <button 
                     onClick={() => { setIsActivitySelectOpen(!isActivitySelectOpen); setIsPaceSelectOpen(false); }}
                     className={`w-full p-5 flex items-center justify-between text-left transition-colors ${isActivitySelectOpen ? 'bg-slate-50' : 'bg-white'}`}
                   >
                     <div className="flex flex-col">
                        <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1.5">Dagelijkse Activiteit</span>
                        <span className="text-base font-black text-slate-800 uppercase tracking-tight">
                           {(() => {
                              const current = [
                                { id: 'light', title: 'Zittend' },
                                { id: 'moderate', title: 'Gemiddeld' },
                                { id: 'heavy', title: 'Zwaar werk' }
                              ].find(l => l.id === state.profile.activityLevel);
                              return current?.title || 'Kies Niveau';
                           })()}
                        </span>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="p-2 bg-orange-50 rounded-xl text-orange-500 shadow-sm border border-orange-100">
                           {(() => {
                              const iconMap: any = { light: Armchair, moderate: Stethoscope, heavy: Construction };
                              const Icon = iconMap[state.profile.activityLevel || 'light'] || Armchair;
                              return <Icon size={20} />;
                           })()}
                        </div>
                        <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isActivitySelectOpen ? 'rotate-180' : ''}`} />
                     </div>
                   </button>
                   
                   {isActivitySelectOpen && (
                     <div className="border-t border-slate-100 divide-y divide-slate-50 bg-white animate-in slide-in-from-top-2 duration-300">
                        {[
                          { id: 'light', icon: Armchair, title: 'Zittend', desc: 'Kantoorbaan, weinig beweging' },
                          { id: 'moderate', icon: Stethoscope, title: 'Gemiddeld', desc: 'Staand werk, lichte inspanning' },
                          { id: 'heavy', icon: Construction, title: 'Zwaar werk', desc: 'Fysiek zwaar werk / bouw' }
                        ].map(lvl => (
                          <button 
                             key={lvl.id}
                             onClick={() => { updateProfile({ activityLevel: lvl.id as any }); setIsActivitySelectOpen(false); }}
                             className="w-full px-7 py-5 flex items-center gap-5 text-left hover:bg-orange-50/50 transition-colors group"
                          >
                             <div className={`p-3.5 rounded-2xl transition-all ${state.profile.activityLevel === lvl.id ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-white'}`}>
                                <lvl.icon size={26} />
                             </div>
                             <div className="flex-grow">
                                <h4 className={`text-[16px] font-black leading-none mb-1.5 uppercase tracking-tight ${state.profile.activityLevel === lvl.id ? 'text-orange-600' : 'text-slate-800'}`}>{lvl.title}</h4>
                                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-wider">{lvl.desc}</p>
                             </div>
                             {state.profile.activityLevel === lvl.id && <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-sm animate-in zoom-in duration-300"><Check size={14} /></div>}
                          </button>
                        ))}
                     </div>
                   )}
                </div>
             </div>

             {/* RICH SELECT: PACE */}
             <div className="space-y-4">
                <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                   <button 
                     onClick={() => { setIsPaceSelectOpen(!isPaceSelectOpen); setIsActivitySelectOpen(false); }}
                     className={`w-full p-5 flex items-center justify-between text-left transition-colors ${isPaceSelectOpen ? 'bg-slate-50' : 'bg-white'}`}
                   >
                     <div className="flex flex-col">
                        <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1.5">Afslank Tempo</span>
                        <span className="text-base font-black text-slate-800 uppercase tracking-tight">
                           {(() => {
                              const current = [
                                { id: 'slow', title: 'Rustig' },
                                { id: 'average', title: 'Gemiddeld' },
                                { id: 'fast', title: 'Snel' },
                                { id: 'custom', title: 'Eigen tempo' }
                              ].find(p => p.id === state.profile.weightLossSpeed);
                              return current?.title || 'Kies Tempo';
                           })()}
                        </span>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="p-2 bg-orange-50 rounded-xl text-orange-500 shadow-sm border border-orange-100">
                           {(() => {
                              const iconMap: any = { slow: Turtle, average: Footprints, fast: Flame, custom: Pencil };
                              const Icon = iconMap[state.profile.weightLossSpeed || 'average'] || Footprints;
                              return <Icon size={20} />;
                           })()}
                        </div>
                        <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isPaceSelectOpen ? 'rotate-180' : ''}`} />
                     </div>
                   </button>

                   {isPaceSelectOpen && (
                     <div className="border-t border-slate-100 divide-y divide-slate-50 bg-white animate-in slide-in-from-top-2 duration-300">
                        {[
                          { id: 'slow', icon: Turtle, title: 'Rustig', desc: 'Duurzaam afvallen (-0.25kg p/w)' },
                          { id: 'average', icon: Footprints, title: 'Gemiddeld', desc: 'Aanbevolen balans (-0.5kg p/w)' },
                          { id: 'fast', icon: Flame, title: 'Snel', desc: 'Ambitieus doel (-1.0kg p/w)' },
                          { id: 'custom', icon: Pencil, title: 'Eigen tempo', desc: 'Kies zelf je streefdatum' }
                        ].map(sp => (
                          <button 
                             key={sp.id}
                             onClick={() => { updateProfile({ weightLossSpeed: sp.id as any }); setIsPaceSelectOpen(false); }}
                             className="w-full px-7 py-5 flex items-center gap-5 text-left hover:bg-orange-50/50 transition-colors group"
                          >
                             <div className={`p-3.5 rounded-2xl transition-all ${state.profile.weightLossSpeed === sp.id ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-white'}`}>
                                <sp.icon size={26} />
                             </div>
                             <div className="flex-grow">
                                <h4 className={`text-[16px] font-black leading-none mb-1.5 uppercase tracking-tight ${state.profile.weightLossSpeed === sp.id ? 'text-orange-600' : 'text-slate-800'}`}>{sp.title}</h4>
                                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-wider">{sp.desc}</p>
                             </div>
                             {state.profile.weightLossSpeed === sp.id && <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-sm animate-in zoom-in duration-300"><Check size={14} /></div>}
                          </button>
                        ))}
                     </div>
                   )}
                </div>

                {state.profile.weightLossSpeed === 'custom' && (
                  <div className="mt-4 p-5 bg-orange-100/30 rounded-2xl border border-orange-200 flex items-center justify-between animate-in slide-in-from-top-2 duration-400">
                     <label className="text-[13px] font-black text-orange-700 uppercase tracking-[0.2em]">EIGEN DATUM</label>
                     <input 
                        type="date" 
                        min={minSafeDate} 
                        value={state.profile.customTargetDate || ''} 
                        onChange={(e) => updateProfile({ customTargetDate: e.target.value })} 
                        className="bg-white border-none py-2.5 px-5 rounded-xl font-black text-[16px] text-orange-600 outline-none shadow-sm focus:ring-2 focus:ring-orange-200" 
                     />
                  </div>
                )}
             </div>

             {/* DATA STORAGE */}
             <div className="bg-white rounded-[1.5rem] p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                   <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Systeem</span>
                   <span className="text-base font-black text-slate-800">{t.dataStorage}</span>
                </div>
                <div className="flex gap-4">
                   <button onClick={handleExportData} className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 active:scale-90 transition-all p-3 shadow-sm"><FileDown size={20}/></button>
                   <button onClick={() => fileInputRef.current?.click()} className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 active:scale-90 transition-all p-3 shadow-sm"><FileUp size={20}/></button>
                   <button onClick={async () => { if(confirm(t.dataManagement.clearConfirm)){ await idb.clear(); window.location.reload(); } }} className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-100 hover:bg-red-100 active:scale-90 transition-all p-3 shadow-sm"><Trash2 size={20}/></button>
                </div>
                <input type="file" id="restore-file" ref={fileInputRef} onChange={handleRestoreData} accept=".json" className="hidden" />
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center w-full">
          {[ 
            { id: 'dashboard', icon: LayoutDashboard, label: t.tabs.dashboard }, 
            { id: 'meals', icon: Utensils, label: t.tabs.meals }, 
            { id: 'activity', icon: Activity, label: t.tabs.activity }, 
            { id: 'profile', icon: UserIcon, label: t.tabs.profile } 
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsActivitySelectOpen(false);
                setIsPaceSelectOpen(false);
                setIsMealMomentOpen(false);
                setIsActivityTypeOpen(false);
              }} 
              className={`flex flex-col items-center justify-center flex-1 py-4 transition-all duration-300 ${activeTab === tab.id ? 'text-orange-500 border-t-2 border-orange-500 bg-orange-50/20' : 'text-slate-400 hover:bg-slate-50 border-t-2 border-transparent'}`}
            >
              <tab.icon size={26} />
              <span className={`text-[12px] font-black uppercase tracking-widest mt-1.5 ${tab.id === activeTab ? 'opacity-100' : 'opacity-70'}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
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
