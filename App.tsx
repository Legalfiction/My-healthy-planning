
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Utensils, 
  Activity, 
  User as UserIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Bookmark,
  Scale,
  Flame,
  Target,
  TrendingDown,
  X,
  Upload,
  Info,
  Cloud,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Settings2,
  ListFilter,
  Check,
  Globe
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
  MEAL_MOMENTS, 
  MEAL_OPTIONS, 
  ACTIVITY_TYPES, 
  DAILY_KCAL_INTAKE_GOAL,
  PRODUCT_TRANSLATIONS 
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

// IndexedDB Utility
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
  }
};

const DEFAULT_PROFILE: UserProfile = {
  age: 55,
  height: 194,
  startWeight: 92,
  currentWeight: 92,
  targetWeight: 80
};

const INITIAL_STATE: AppState = {
  profile: DEFAULT_PROFILE,
  dailyLogs: {},
  customOptions: MEAL_OPTIONS,
  customActivities: ACTIVITY_TYPES,
  language: 'nl'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'activity' | 'profile'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showMyList, setShowMyList] = useState(false);
  const [showMyActivityList, setShowMyActivityList] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(ACTIVITY_TYPES[0].id);
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [showInfo, setShowInfo] = useState(false);
  const [fileHandle, setFileHandle] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');

  const t = useMemo(() => translations[state.language || 'nl'], [state.language]);

  // Helper to get translated product/activity name
  const getTranslatedName = (id: string, originalName: string) => {
    const lang = state.language || 'nl';
    return PRODUCT_TRANSLATIONS[lang]?.[id] || originalName;
  };

  // New product form state
  const [newProductName, setNewProductName] = useState('');
  const [newProductGram, setNewProductGram] = useState('');
  const [newProductKcal, setNewProductKcal] = useState('');
  const [newProductCats, setNewProductCats] = useState<string[]>([]);

  // New activity form state
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityKcalMin, setNewActivityKcalMin] = useState('');

  const availableActivities = useMemo(() => {
    return state.customActivities || ACTIVITY_TYPES;
  }, [state.customActivities]);

  const activeUnit = useMemo(() => availableActivities.find(t => t.id === selectedActivityId)?.unit || 'minuten', [selectedActivityId, availableActivities]);

  useEffect(() => {
    const initApp = async () => {
      if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
      const saved = await idb.get();
      if (saved) {
        setState({
          ...saved,
          customOptions: saved.customOptions && Object.keys(saved.customOptions).length > 0 ? saved.customOptions : MEAL_OPTIONS,
          customActivities: saved.customActivities && saved.customActivities.length > 0 ? saved.customActivities : ACTIVITY_TYPES,
          language: saved.language || 'nl'
        });
      }
      setIsLoaded(true);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    idb.set(state);
    
    if (fileHandle) {
      const syncToFile = async () => {
        setSyncStatus('syncing');
        try {
          const writable = await fileHandle.createWritable();
          await writable.write(JSON.stringify(state, null, 2));
          await writable.close();
          setSyncStatus('success');
          setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (e) {
          setSyncStatus('error');
        }
      };
      syncToFile();
    }
  }, [state, isLoaded, fileHandle]);

  const currentLog: DailyLog = useMemo(() => state.dailyLogs[selectedDate] || { date: selectedDate, meals: {}, activities: [] }, [state.dailyLogs, selectedDate]);

  const latestWeight = useMemo(() => {
    const dates = Object.keys(state.dailyLogs).sort().reverse();
    if (state.dailyLogs[selectedDate]?.weight) return state.dailyLogs[selectedDate].weight;
    for (const d of dates) { if (d <= selectedDate && state.dailyLogs[d].weight) return state.dailyLogs[d].weight; }
    return state.profile.currentWeight;
  }, [state.dailyLogs, state.profile.currentWeight, selectedDate]);

  const allUniqueProducts = useMemo(() => {
    const unique = new Map<string, MealOption>();
    (Object.values(state.customOptions) as MealOption[][]).forEach(options => {
      options.forEach(opt => {
        unique.set(opt.name, opt);
      });
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.customOptions]);

  const setDailyWeight = (weight: number | undefined) => {
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] };
      logs[selectedDate] = { ...log, weight };
      return { ...prev, dailyLogs: logs };
    });
  };

  const setLanguage = (lang: Language) => {
    setState(prev => ({ ...prev, language: lang }));
  };

  const addMealItem = (moment: MealMoment, item: Omit<LoggedMealItem, 'id'>) => {
    setState(prev => {
      const newItemId = Math.random().toString(36).substr(2, 9);
      const newItem: LoggedMealItem = { ...item, id: newItemId };
      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] };
      const meals = { ...log.meals };
      meals[moment] = [...(meals[moment] || []), newItem];
      logs[selectedDate] = { ...log, meals };
      return { ...prev, dailyLogs: logs };
    });
  };

  const addCustomOptionCentral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductKcal || newProductCats.length === 0) return;
    const kcalValue = Number(newProductKcal);
    const displayName = newProductGram ? `${newProductName} (${newProductGram}g)` : newProductName;
    const newItemId = 'c_' + Math.random().toString(36).substr(2, 9);
    const newOption: MealOption = { id: newItemId, name: displayName, kcal: kcalValue, isCustom: true };
    setState(prev => {
      const customOptions = { ...prev.customOptions };
      const momentsToUpdate: MealMoment[] = [];
      if (newProductCats.includes('Ontbijt')) momentsToUpdate.push('Ontbijt');
      if (newProductCats.includes('Lunch')) momentsToUpdate.push('Lunch');
      if (newProductCats.includes('Diner')) momentsToUpdate.push('Diner');
      if (newProductCats.includes('Snacks')) momentsToUpdate.push('Ochtend snack', 'Middag snack', 'Avondsnack');
      momentsToUpdate.forEach(m => {
        const momentOpts = customOptions[m] || [];
        if (!momentOpts.some(o => o.name.toLowerCase() === displayName.toLowerCase())) {
          customOptions[m] = [newOption, ...momentOpts];
        }
      });
      return { ...prev, customOptions };
    });
    setNewProductName(''); setNewProductGram(''); setNewProductKcal(''); setNewProductCats([]);
  };

  const addCustomActivityCentral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName || !newActivityKcalMin) return;
    const kcalMin = Number(newActivityKcalMin);
    const weight = latestWeight || state.profile.currentWeight;
    const calculatedMet = (kcalMin * 60) / weight;
    const newActivity: ActivityType = { id: 'ca_' + Math.random().toString(36).substr(2, 9), name: newActivityName, met: calculatedMet, unit: 'minuten', isCustom: true };
    setState(prev => ({ ...prev, customActivities: [newActivity, ...prev.customActivities] }));
    setNewActivityName(''); setNewActivityKcalMin('');
  };

  const removeOptionFromLibrary = (productName: string) => {
    if (!confirm(`Wil je "${productName}" definitief uit de bibliotheek verwijderen?`)) return;
    setState(prev => {
      const newCustomOptions = { ...prev.customOptions };
      Object.keys(newCustomOptions).forEach(moment => {
        newCustomOptions[moment] = newCustomOptions[moment].filter(o => o.name !== productName);
      });
      return { ...prev, customOptions: newCustomOptions };
    });
  };

  const removeActivityFromLibrary = (activityId: string) => {
    const act = availableActivities.find(a => a.id === activityId);
    if (!act) return;
    if (!confirm(`Wil je "${act.name}" definitief uit de bibliotheek verwijderen?`)) return;
    setState(prev => ({ ...prev, customActivities: prev.customActivities.filter(a => a.id !== activityId) }));
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
    const type = availableActivities.find(t => t.id === typeId);
    if (!type) return;
    const burn = calculateActivityBurn({ typeId, value }, latestWeight || state.profile.currentWeight);
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] };
      logs[selectedDate] = { ...log, activities: [...log.activities, { id: Math.random().toString(36).substr(2, 9), typeId, value, burnedKcal: burn }] };
      return { ...prev, dailyLogs: logs };
    });
  };

  const removeActivity = (id: string) => {
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      if (!logs[selectedDate]) return prev;
      logs[selectedDate] = { ...logs[selectedDate], activities: logs[selectedDate].activities.filter(a => a.id !== id) };
      return { ...prev, dailyLogs: logs };
    });
  };

  const updateProfile = (updates: Partial<UserProfile>) => setState(prev => ({ ...prev, profile: { ...prev.profile, ...updates } }));

  const setupCloudSync = async () => {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'doelgewicht_sync.json',
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
      });
      setFileHandle(handle);
      alert('Cloud Sync geactiveerd!');
    } catch (e) { console.log('Sync geannuleerd'); }
  };

  const restoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.profile && parsed.dailyLogs) {
          setState({
            profile: parsed.profile,
            dailyLogs: parsed.dailyLogs,
            customOptions: parsed.customOptions || MEAL_OPTIONS,
            customActivities: parsed.customActivities || ACTIVITY_TYPES,
            language: parsed.language || 'nl'
          });
          alert('Gegevens succesvol hersteld!');
        } else {
          alert('Ongeldig backup bestand.');
        }
      } catch (err) { alert('Fout bij herstellen.'); }
    };
    reader.readAsText(file);
  };

  const totals = useMemo(() => {
    const activityBurn = currentLog.activities.reduce((sum, a) => sum + a.burnedKcal, 0);
    const effectiveProfile = { ...state.profile, currentWeight: latestWeight || state.profile.currentWeight };
    const baselineTdee = calculateTDEE(effectiveProfile, 0);
    const totalTdee = calculateTDEE(effectiveProfile, activityBurn);
    const intakeGoal = DAILY_KCAL_INTAKE_GOAL;
    const actualIntake = Object.values(currentLog.meals).flat().reduce((sum, m) => sum + m.kcal, 0);
    const currentAdjustedGoal = intakeGoal + activityBurn;
    const remaining = currentAdjustedGoal - actualIntake;
    const targetDate = calculateTargetDate(effectiveProfile, totalTdee - intakeGoal);
    const baselineDeficit = baselineTdee - intakeGoal;
    const weightJourneyTotal = state.profile.startWeight - state.profile.targetWeight;
    const weightLostSoFar = state.profile.startWeight - (latestWeight || state.profile.currentWeight);
    const weightProgressPercent = weightJourneyTotal > 0 ? (weightLostSoFar / weightJourneyTotal) * 100 : 0;
    return { activityBurn, baselineTdee, totalTdee, intakeGoal, actualIntake, remaining, targetDate, currentAdjustedGoal, baselineDeficit, weightProgressPercent };
  }, [state.profile, currentLog, latestWeight]);

  const toggleCategory = (cat: string) => {
    setNewProductCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  if (!isLoaded) return <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex items-center justify-center font-black text-indigo-700 uppercase tracking-widest">Laden...</div>;

  const flagEmojis: Record<Language, string> = { 
    nl: '🇳🇱', en: '🇬🇧', es: '🇪🇸', de: '🇩🇪',  
    pt: '🇵🇹', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷',
    hi: '🇮🇳', ar: '🇸🇦'
  };

  // Locale mapper for dates
  const getLocale = (lang: Language) => {
    switch(lang) {
      case 'en': return 'en-US';
      case 'zh': return 'zh-CN';
      case 'ja': return 'ja-JP';
      case 'ko': return 'ko-KR';
      case 'pt': return 'pt-PT';
      case 'hi': return 'hi-IN';
      case 'ar': return 'ar-SA';
      default: return 'nl-NL';
    }
  };

  const isRTL = state.language === 'ar';

  return (
    <div className={`max-w-md mx-auto min-h-screen pb-24 bg-slate-50 flex flex-col shadow-2xl relative ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
             <h1 className="text-xl font-black text-indigo-700 leading-none tracking-tight">{t.title}</h1>
             <span className="text-[10px] font-black text-slate-400 tracking-[0.2em]">{t.subtitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInfo(true)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"><Info size={22} /></button>
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-2xl">
              <TrendingDown size={14} className="text-indigo-600" />
              <span className="text-[11px] font-black text-indigo-700 uppercase">{latestWeight.toFixed(1)} <span className="text-[9px] opacity-60">KG</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between bg-slate-100/50 rounded-2xl p-1.5 border border-slate-200/50">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className={`p-2.5 hover:bg-white rounded-xl bg-white/50 shadow-sm transition-colors ${isRTL ? 'rotate-180' : ''}`}><ChevronLeft size={18} className="text-slate-600"/></button>
          <div className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase tracking-widest"><CalendarIcon size={14} className="text-indigo-500" />{new Date(selectedDate).toLocaleDateString(getLocale(state.language), { weekday: 'short', day: 'numeric', month: 'short' })}</div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className={`p-2.5 hover:bg-white rounded-xl bg-white/50 shadow-sm transition-colors ${isRTL ? 'rotate-180' : ''}`}><ChevronRight size={18} className="text-slate-600"/></button>
        </div>
      </header>

      <main className="p-4 flex-grow space-y-6 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-50 border border-indigo-100 rounded-[32px] p-6 text-slate-800 shadow-sm relative overflow-hidden">
              <div className={`absolute top-0 p-4 opacity-10 ${isRTL ? 'left-0' : 'right-0'}`}><Target size={80} className="text-indigo-700" /></div>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1.5">{t.targetReached}</p>
              <h2 className="text-3xl font-black mb-5 tracking-tight text-indigo-900">{totals.targetDate || '...'}</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border border-indigo-100/50">
                  <div className="flex items-center gap-1.5 mb-1 opacity-70"><Flame size={10} className="text-indigo-500" /><p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 leading-tight" dangerouslySetInnerHTML={{ __html: t.oldIntake }}></p></div>
                  <p className="text-xl font-black text-indigo-700">{Math.round(totals.baselineTdee)} <span className="text-[10px] font-medium opacity-60">kcal</span></p>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border border-indigo-100/50">
                  <div className="flex items-center gap-1.5 mb-1 opacity-70"><TrendingDown size={10} className="text-green-500" /><p className="text-[9px] font-black uppercase tracking-widest text-green-600 leading-tight" dangerouslySetInnerHTML={{ __html: t.newIntake }}></p></div>
                  <p className="text-xl font-black text-green-600">-{Math.round(Math.max(0, totals.baselineDeficit))} <span className="text-[10px] font-medium opacity-60">kcal</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-tight"><TrendingDown size={18} className="text-green-500" /> {t.myJourney}</h3>
                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">-{ (state.profile.startWeight - latestWeight).toFixed(1) } KG</span>
               </div>
               <div className="relative pt-6 pb-2 px-2">
                 <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-green-500 rounded-full transition-all duration-1000 ${isRTL ? 'float-right' : 'float-left'}`} style={{ width: `${Math.min(Math.max(totals.weightProgressPercent, 0), 100)}%` }} />
                 </div>
                 <div className={`absolute top-0 text-[9px] font-black text-slate-400 uppercase ${isRTL ? 'right-0' : 'left-0'}`}>{state.profile.startWeight} KG</div>
                 <div className={`absolute top-0 text-[9px] font-black text-indigo-600 uppercase ${isRTL ? 'left-0' : 'right-0'}`}>GOAL {state.profile.targetWeight} KG</div>
                 <div className="absolute top-10 text-[10px] font-black text-slate-800 transition-all duration-1000 whitespace-nowrap" style={{ [isRTL ? 'right' : 'left']: `${Math.min(Math.max(totals.weightProgressPercent, 0), 100)}%` }}>NOW {latestWeight.toFixed(1)}</div>
               </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-5"><h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-tight"><Scale size={18} className="text-indigo-500" /> {t.weighMoment}</h3></div>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <input type="number" step="0.1" placeholder="00.0" value={currentLog.weight || ''} onChange={(e) => setDailyWeight(e.target.value ? Number(e.target.value) : undefined)} className="w-full bg-transparent border-none p-0 text-4xl font-black text-indigo-700 focus:ring-0" />
                <span className="text-sm font-black text-slate-400 uppercase">kg</span>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-5">
                <div><h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-tight mb-1"><Utensils size={18} className="text-orange-500" /> {t.dailyBudget}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan: {totals.intakeGoal} kcal</p></div>
                <div className="text-right"><div className="flex items-baseline justify-end gap-1"><span className={`text-3xl font-black tracking-tight ${totals.remaining < 0 ? 'text-red-500' : 'text-slate-900'}`}>{totals.actualIntake}</span><span className="text-xs font-black text-slate-400">kcal</span></div></div>
              </div>
              <div className="w-full bg-slate-100 h-6 rounded-2xl overflow-hidden p-1.5 mb-3 border border-slate-200/50"><div className={`h-full rounded-xl transition-all duration-1000 shadow-sm ${totals.remaining < 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((totals.actualIntake / totals.currentAdjustedGoal) * 100, 100)}%` }} /></div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-5 pb-12 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-2">
              <div><h2 className="text-2xl font-black text-slate-800 leading-none tracking-tight">{t.mealSchedule}</h2><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.todayPlanning}</span></div>
              <button onClick={() => setShowMyList(true)} className="flex items-center gap-2 bg-sky-100 text-sky-700 border border-sky-200 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] shadow-sm active:scale-95 transition-all">
                <ListFilter size={18} /> {t.myList}
              </button>
            </div>
            {MEAL_MOMENTS.map((moment, idx) => {
              const items = currentLog.meals[moment] || [];
              const availableOptions = state.customOptions[moment] || [];
              const groupBg = idx < 2 ? 'bg-orange-50/40' : idx < 4 ? 'bg-emerald-50/40' : 'bg-indigo-50/60';
              return (
                <div key={moment} className={`rounded-[32px] p-6 border border-slate-100 shadow-sm ${groupBg}`}>
                  <h3 className="font-black text-slate-800 tracking-tight uppercase text-sm mb-5">{t.moments[moment]}</h3>
                  <div className="space-y-3 mb-6">
                    {items.length > 0 ? items.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white/90 p-4 rounded-2xl border border-white/60 group shadow-sm">
                        <div className="flex flex-col"><span className="text-sm font-black text-slate-800">{getTranslatedName(item.mealId || '', item.name)}</span><span className="text-[10px] font-bold text-slate-500 uppercase mt-1">{item.quantity} x • {item.kcal} kcal</span></div>
                        <button onClick={() => removeMealItem(moment, item.id)} className="text-slate-200 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                      </div>
                    )) : <div className="py-8 text-center border-2 border-dashed border-slate-200/50 rounded-[24px] bg-white/20"><span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{t.nothingPlanned}</span></div>}
                  </div>
                  <div className="grid grid-cols-[1fr,60px,54px] gap-2 items-end">
                    <div className="relative">
                      <select id={`sel-${moment}`} className={`w-full bg-white/80 border-none rounded-2xl h-[52px] p-4 text-xs font-bold text-slate-700 appearance-none shadow-inner ${isRTL ? 'text-right pr-4 pl-10' : 'text-left pl-4 pr-10'}`} onChange={(e) => {
                        const val = e.target.value; if (!val) return;
                        const opt = availableOptions.find(o => o.id === val);
                        const qty = Number((document.getElementById(`q-${moment}`) as HTMLInputElement).value) || 1;
                        if (opt) addMealItem(moment, { name: opt.name, kcal: opt.kcal * qty, quantity: qty, mealId: opt.id });
                        e.target.value = '';
                      }}>
                        <option value="">+ {t.add}...</option>
                        {availableOptions.map(o => <option key={o.id} value={o.id}>{getTranslatedName(o.id, o.name)} ({o.kcal} kcal)</option>)}
                      </select>
                      <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-40 ${isRTL ? 'left-4' : 'right-4'}`}>
                        <ChevronRight size={14} className={isRTL ? 'rotate-180' : ''} />
                      </div>
                    </div>
                    <input id={`q-${moment}`} type="number" defaultValue="1" min="1" className="w-full bg-white/80 border-none rounded-2xl h-[52px] p-4 text-xs font-black text-center shadow-inner" />
                    <button onClick={() => document.getElementById(`sel-${moment}`)?.dispatchEvent(new Event('change', { bubbles: true }))} className="bg-indigo-100 text-indigo-600 h-[52px] flex items-center justify-center rounded-2xl active:scale-90 transition-all border border-indigo-200/50"><Plus size={24} strokeWidth={3} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'activity' && (
           <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex justify-between items-center px-2">
               <div><h2 className="text-2xl font-black text-slate-800 leading-none tracking-tight">{t.movement}</h2><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.planActivities}</span></div>
               <button onClick={() => setShowMyActivityList(true)} className="flex items-center gap-2 bg-sky-100 text-sky-700 border border-sky-200 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] shadow-sm active:scale-95 transition-all">
                 <ListFilter size={18} /> {t.myList}
               </button>
             </div>
             <div className="bg-indigo-50 border border-indigo-100 rounded-[32px] p-7 text-slate-800 shadow-sm relative overflow-hidden">
                <div className={`absolute -bottom-4 opacity-5 rotate-12 ${isRTL ? '-left-4' : '-right-4'}`}><Activity size={120} className="text-indigo-700" /></div>
                <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight text-indigo-800"><Plus size={20} strokeWidth={3} /> {t.activity}</h3>
                <form className="space-y-4 relative z-10" onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const tid = fd.get('tid') as string;
                  const val = Number(fd.get('val'));
                  if (tid && val > 0) { addActivity(tid, val); (e.target as HTMLFormElement).reset(); }
                }}>
                  <div className="relative">
                    <select name="tid" value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)} className={`w-full bg-white/80 border border-indigo-100 rounded-[20px] p-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 appearance-none ${isRTL ? 'text-right' : 'text-left'}`}>
                      {availableActivities.map(act => <option key={act.id} value={act.id}>{getTranslatedName(act.id, act.name)}</option>)}
                    </select>
                    <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-40 ${isRTL ? 'left-4' : 'right-4'}`}>
                      <ChevronRight size={14} className={isRTL ? 'rotate-180' : ''} />
                    </div>
                  </div>
                  <div className="relative"><input name="val" type="number" step="0.1" placeholder={t.amount} className="w-full bg-white/80 border border-indigo-100 rounded-[20px] p-4 text-lg font-black text-indigo-700 placeholder:text-indigo-300" required /><span className={`absolute top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-indigo-300 tracking-widest ${isRTL ? 'left-5' : 'right-5'}`}>{activeUnit}</span></div>
                  <button type="submit" className="w-full bg-indigo-600 text-white font-black py-7 rounded-[24px] shadow-lg shadow-indigo-200 active:scale-95 transition-all uppercase text-sm tracking-[0.2em] mt-2">{t.addToToday}</button>
                </form>
             </div>
             <div className="space-y-3">
               {currentLog.activities.map(a => (
                 <div key={a.id} className="bg-white rounded-3xl p-4.5 border border-slate-100 flex justify-between items-center shadow-sm">
                   <div><p className="font-black text-slate-800 text-sm">{getTranslatedName(a.typeId, availableActivities.find(x => x.id === a.typeId)?.name || '')}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{a.value} {availableActivities.find(x => x.id === a.typeId)?.unit} • <span className="text-green-600 font-black">+{a.burnedKcal} kcal</span></p></div>
                   <button onClick={() => removeActivity(a.id)} className="text-slate-200 hover:text-red-500 p-2 transition-colors active:scale-90"><Trash2 size={20}/></button>
                 </div>
               ))}
             </div>
           </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <h2 className="text-2xl font-black text-slate-800 px-2 leading-none tracking-tight">{t.settings}</h2>
             
             {/* Taalkeuze vlaggetjes */}
             <div className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm space-y-4">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2"><Globe size={16} /> {t.language}</h3>
               <div className="grid grid-cols-5 gap-2">
                 {(Object.keys(flagEmojis) as Language[]).map(lang => (
                   <button 
                     key={lang} 
                     onClick={() => setLanguage(lang)}
                     className={`text-3xl p-2 rounded-2xl transition-all border-2 ${state.language === lang ? 'border-indigo-600 bg-indigo-50 scale-110' : 'border-transparent hover:bg-slate-50'}`}
                   >
                     {flagEmojis[lang]}
                   </button>
                 ))}
               </div>
             </div>

             <div className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm space-y-6">
               <div className="grid grid-cols-2 gap-5">
                 <div><label className="text-[9px] font-black text-slate-300 uppercase block mb-2 tracking-widest ml-1">{t.age}</label><input type="number" value={state.profile.age} onChange={e => updateProfile({age: Number(e.target.value)})} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-slate-700 border-none shadow-inner" /></div>
                 <div><label className="text-[9px] font-black text-slate-300 uppercase block mb-2 tracking-widest ml-1">{t.height}</label><input type="number" value={state.profile.height} onChange={e => updateProfile({height: Number(e.target.value)})} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-slate-700 border-none shadow-inner" /></div>
               </div>
               <div className="grid grid-cols-2 gap-5">
                 <div><label className="text-[9px] font-black text-slate-300 uppercase block mb-2 tracking-widest ml-1">{t.startWeight}</label><input type="number" step="0.1" value={state.profile.startWeight} onChange={e => updateProfile({startWeight: Number(e.target.value)})} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-slate-700 border-none shadow-inner" /></div>
                 <div><label className="text-[9px] font-black text-slate-300 uppercase block mb-2 tracking-widest ml-1">{t.targetWeight}</label><input type="number" value={state.profile.targetWeight} onChange={e => updateProfile({targetWeight: Number(e.target.value)})} className="w-full bg-indigo-50 p-4 rounded-2xl font-black text-indigo-700 border-none shadow-inner" /></div>
               </div>
             </div>
             <div className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm space-y-4">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2"><Database size={16} /> {t.storage}</h3>
               <div className="flex flex-col gap-3">
                 <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${!fileHandle ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`} onClick={() => setFileHandle(null)}>
                   <div className="flex items-center gap-3"><Database className="text-indigo-600" size={20}/><span className="text-[10px] font-black uppercase">{t.localStorage}</span></div>
                   {!fileHandle && <CheckCircle2 size={20} className="text-indigo-600" />}
                 </div>
                 <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${fileHandle ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`} onClick={setupCloudSync}>
                   <div className="flex items-center gap-3"><Cloud className="text-indigo-600" size={20}/><span className="text-[10px] font-black uppercase">{t.cloudStorage}</span></div>
                   {fileHandle && <CheckCircle2 size={20} className="text-indigo-600" />}
                 </div>
               </div>
             </div>
             <label className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 text-[10px] font-black uppercase py-4 rounded-2xl border border-slate-100 cursor-pointer shadow-sm hover:bg-slate-100 transition-all"><Upload size={16} /> {t.restore}<input type="file" accept=".json" onChange={restoreData} className="hidden" /></label>
             <div className="pt-6 border-t border-slate-100 text-center"><p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{t.title} v2.1.0</p></div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[32px] shadow-2xl">
        {[{ id: 'dashboard', icon: LayoutDashboard, label: t.tabs.dashboard }, { id: 'meals', icon: Utensils, label: t.tabs.meals }, { id: 'activity', icon: Activity, label: t.tabs.activity }, { id: 'profile', icon: UserIcon, label: t.tabs.profile }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 3 : 2} /><span className="text-[9px] font-black uppercase tracking-[0.15em]">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* MIJN PRODUCTEN BEHEREN */}
      {showMyList && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[60] flex items-center justify-center p-6" onClick={() => setShowMyList(false)}>
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3"><div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600"><ListFilter size={24} /></div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t.products}</h3></div>
              <button onClick={() => setShowMyList(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
            </div>
            <div className="mb-10 bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 space-y-5">
               <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-2"><Plus size={16} strokeWidth={3} /> {t.newProduct}</h4>
               <form onSubmit={addCustomOptionCentral} className="space-y-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">{t.productName}</label><input type="text" value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="..." className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Gram</label><input type="number" value={newProductGram} onChange={e => setNewProductGram(e.target.value)} placeholder="0" className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">{t.kcal}</label><input type="number" value={newProductKcal} onChange={e => setNewProductKcal(e.target.value)} placeholder="0" className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-black text-orange-600" required /></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1 block mb-2">{t.placeInLists}</label><div className="grid grid-cols-2 gap-2">{Object.keys(t.moments).filter(m => ['Ontbijt','Lunch','Diner','Snacks'].includes(m)).map(cat => (<button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`flex items-center justify-between px-3 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${newProductCats.includes(cat) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-indigo-100 text-indigo-400'}`}>{t.moments[cat]}{newProductCats.includes(cat) && <Check size={12} strokeWidth={4} />}</button>))}</div></div>
                  <button type="submit" disabled={!newProductName || !newProductKcal || newProductCats.length === 0} className="w-full bg-indigo-600 text-white py-4.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg disabled:opacity-30">{t.saveInList}</button>
               </form>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Bookmark size={16} /> {t.myLibrary}</h4>
              {allUniqueProducts.map(opt => (
                <div key={opt.id} className="flex justify-between items-center bg-slate-50 p-4.5 rounded-3xl border border-slate-100">
                  <div className="flex flex-col"><span className="text-sm font-black text-slate-800">{getTranslatedName(opt.id, opt.name)}</span><span className="text-[10px] font-bold text-indigo-500 uppercase">{opt.kcal} kcal</span></div>
                  <button onClick={() => removeOptionFromLibrary(opt.name)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl"><Trash2 size={22} /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowMyList(false)} className="w-full mt-10 py-5 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.2em]">{t.backToSchedule}</button>
          </div>
        </div>
      )}

      {/* MIJN ACTIVITEITEN BEHEREN */}
      {showMyActivityList && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[60] flex items-center justify-center p-6" onClick={() => setShowMyActivityList(false)}>
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3"><div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600"><Activity size={24} /></div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t.movement}</h3></div>
              <button onClick={() => setShowMyActivityList(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
            </div>
            <div className="mb-10 bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 space-y-5">
               <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-2"><Plus size={16} strokeWidth={3} /> {t.newActivity}</h4>
               <form onSubmit={addCustomActivityCentral} className="space-y-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">{t.activityName}</label><input type="text" value={newActivityName} onChange={e => setNewActivityName(e.target.value)} placeholder="..." className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500" required /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">{t.kcalPerMin}</label><div className="relative"><input type="number" value={newActivityKcalMin} onChange={e => setNewActivityKcalMin(e.target.value)} placeholder="0" className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-black text-indigo-700 shadow-sm focus:ring-2 focus:ring-indigo-500" required /><span className={`absolute top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-300 uppercase tracking-widest ${isRTL ? 'left-4' : 'right-4'}`}>kcal/min</span></div></div>
                  <button type="submit" disabled={!newActivityName || !newActivityKcalMin} className="w-full bg-indigo-600 text-white py-4.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all">{t.add}</button>
               </form>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1"><h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Bookmark size={16} /> {t.myLibrary}</h4><span className="text-[10px] font-black text-slate-400 uppercase">{availableActivities.length} items</span></div>
              <div className="space-y-3">
                {availableActivities.map(act => (
                  <div key={act.id} className="flex justify-between items-center bg-slate-50 p-4.5 rounded-3xl border border-slate-100 group transition-all hover:border-indigo-100 hover:bg-white shadow-sm">
                    <div className="flex flex-col"><span className="text-sm font-black text-slate-800">{getTranslatedName(act.id, act.name)}</span><span className="text-[10px] font-bold text-indigo-500 uppercase mt-0.5">{act.unit === 'km' ? 'per km' : `${Math.round((act.met * (latestWeight || 92)) / 60)} kcal/min`}</span></div>
                    <button onClick={() => removeActivityFromLibrary(act.id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={22} /></button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setShowMyActivityList(false)} className="w-full mt-10 py-5 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">{t.backToMovement}</button>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[80] flex items-center justify-center p-6" onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-[40px] p-8 w-full max-sm shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-3"><Info className="text-indigo-600" /> {t.info}</h3>
            <div className="space-y-5 text-sm text-slate-600 leading-relaxed mb-8"><p>{t.infoText}</p><p>{t.storage}: {t.localStorage}</p></div>
            <button onClick={() => setShowInfo(false)} className="w-full py-4.5 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">{t.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}
