
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
  Bookmark,
  Scale,
  Flame,
  Target,
  TrendingDown,
  X,
  Upload,
  Info,
  Database,
  ListFilter,
  Check,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Coffee,
  Sun,
  Moon,
  Zap
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

const INITIAL_STATE: AppState = {
  profile: { age: 55, height: 194, startWeight: 92, currentWeight: 92, targetWeight: 80 },
  dailyLogs: {},
  customOptions: MEAL_OPTIONS,
  customActivities: ACTIVITY_TYPES,
  language: 'nl'
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

  const t = useMemo(() => translations[state.language || 'nl'], [state.language]);

  const [newProductName, setNewProductName] = useState('');
  const [newProductGram, setNewProductGram] = useState('');
  const [newProductKcal, setNewProductKcal] = useState('');
  const [newProductCats, setNewProductCats] = useState<string[]>([]);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityKcalMin, setNewActivityKcalMin] = useState('');

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

  const currentLog = useMemo(() => state.dailyLogs[selectedDate] || { date: selectedDate, meals: {}, activities: [] }, [state.dailyLogs, selectedDate]);
  
  const latestWeight = useMemo(() => {
    const dates = Object.keys(state.dailyLogs).sort().reverse();
    if (state.dailyLogs[selectedDate]?.weight) return state.dailyLogs[selectedDate].weight;
    for (const d of dates) { if (d <= selectedDate && state.dailyLogs[d].weight) return state.dailyLogs[d].weight; }
    return state.profile.currentWeight;
  }, [state.dailyLogs, state.profile.currentWeight, selectedDate]);

  const totals = useMemo(() => {
    const activityBurn = currentLog.activities.reduce((sum, a) => sum + a.burnedKcal, 0);
    const effectiveProfile = { ...state.profile, currentWeight: latestWeight || state.profile.currentWeight };
    const baselineTdee = calculateTDEE(effectiveProfile, 0);
    const actualIntake = Object.values(currentLog.meals).flat().reduce((sum, m) => sum + m.kcal, 0);
    const targetDate = calculateTargetDate(effectiveProfile, baselineTdee + activityBurn - DAILY_KCAL_INTAKE_GOAL);
    const weightJourneyTotal = state.profile.startWeight - state.profile.targetWeight;
    const weightLostSoFar = state.profile.startWeight - (latestWeight || state.profile.currentWeight);
    const weightProgressPercent = weightJourneyTotal > 0 ? (weightLostSoFar / weightJourneyTotal) * 100 : 0;
    
    // Calorie status logic
    const intakePercent = (actualIntake / DAILY_KCAL_INTAKE_GOAL) * 100;
    let calorieStatusColor = 'bg-green-500';
    if (actualIntake > DAILY_KCAL_INTAKE_GOAL) calorieStatusColor = 'bg-red-500';
    else if (intakePercent > 85) calorieStatusColor = 'bg-amber-500';

    return { 
      activityBurn, 
      baselineTdee, 
      actualIntake, 
      targetDate, 
      weightProgressPercent, 
      currentAdjustedGoal: DAILY_KCAL_INTAKE_GOAL + activityBurn,
      intakePercent,
      calorieStatusColor
    };
  }, [state.profile, currentLog, latestWeight]);

  const dateParts = useMemo(() => {
    const dateObj = new Date(selectedDate);
    const locale = state.language === 'en' ? 'en-US' : 'nl-NL';
    const parts = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(dateObj);
    return {
      day: parts.find(p => p.type === 'day')?.value || '',
      month: parts.find(p => p.type === 'month')?.value || '',
      weekday: parts.find(p => p.type === 'weekday')?.value || ''
    };
  }, [selectedDate, state.language]);

  const getTranslatedName = (id: string, originalName: string) => {
    const lang = state.language || 'nl';
    return PRODUCT_TRANSLATIONS[lang]?.[id] || originalName;
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
  };

  const removeActivity = (id: string) => {
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      if (!logs[selectedDate]) return prev;
      logs[selectedDate] = { ...logs[selectedDate], activities: logs[selectedDate].activities.filter(a => a.id !== id) };
      return { ...prev, dailyLogs: logs };
    });
  };

  const addCustomActivityCentral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName || !newActivityKcalMin) return;
    const kcalMin = Number(newActivityKcalMin);
    const weight = latestWeight || state.profile.currentWeight;
    const metValue = (kcalMin * 60) / weight;
    const newItem: ActivityType = { 
      id: 'ca_' + Math.random().toString(36).substr(2, 9), 
      name: newActivityName, 
      met: metValue, 
      unit: 'minuten', 
      isCustom: true 
    };
    setState(prev => ({ ...prev, customActivities: [newItem, ...prev.customActivities] }));
    setNewActivityName(''); setNewActivityKcalMin('');
  };

  const removeActivityFromLibrary = (id: string) => {
    setState(prev => ({ ...prev, customActivities: prev.customActivities.filter(a => a.id !== id) }));
  };

  const removeProductFromLibrary = (name: string) => {
    setState(prev => {
      const newOptions = { ...prev.customOptions };
      Object.keys(newOptions).forEach(m => {
        newOptions[m as MealMoment] = newOptions[m as MealMoment].filter(o => o.name !== name);
      });
      return { ...prev, customOptions: newOptions };
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
        customOptions[m] = [newOption, ...momentOpts];
      });
      return { ...prev, customOptions };
    });
    setNewProductName(''); setNewProductGram(''); setNewProductKcal(''); setNewProductCats([]);
  };

  const allUniqueProducts = useMemo(() => {
    const unique = new Map<string, MealOption>();
    Object.values(state.customOptions).forEach(options => {
      options.forEach(opt => unique.set(opt.name, opt));
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.customOptions]);

  const mealGroups = [
    { label: 'Ochtend', icon: Coffee, moments: ['Ontbijt', 'Ochtend snack'] as MealMoment[] },
    { label: 'Middag', icon: Sun, moments: ['Lunch', 'Middag snack'] as MealMoment[] },
    { label: 'Avond', icon: Moon, moments: ['Diner', 'Avondsnack'] as MealMoment[] }
  ];

  if (!isLoaded) return <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center font-black text-sky-500 uppercase tracking-widest">Laden...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 bg-white flex flex-col shadow-2xl relative overflow-hidden">
      <header className="bg-white border-b sticky top-0 z-30 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
             <h1 className="text-xl font-black text-sky-500 leading-none tracking-tight">{t.title}</h1>
             <span className="text-[10px] font-black text-slate-400 tracking-[0.2em]">{t.subtitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInfo(true)} className="p-2 text-sky-400 hover:bg-sky-50 rounded-xl transition-all"><Info size={22} /></button>
            <div className="bg-white border border-sky-100 px-3 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
              <TrendingDown size={14} className="text-sky-400" />
              <span className="text-sm font-black text-sky-600">{latestWeight.toFixed(1)} <span className="text-[10px] opacity-60">KG</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white rounded-3xl p-3 border border-sky-50 shadow-sm">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-4 hover:bg-sky-50 rounded-2xl transition-colors"><ChevronLeft size={28} className="text-slate-400"/></button>
          <div className="flex items-center gap-6">
             <span className="text-5xl font-black text-sky-500 tabular-nums leading-none tracking-tighter">{dateParts.day}</span>
             <div className="flex flex-col">
               <span className="text-xs font-black text-sky-300 uppercase tracking-widest mb-1">{dateParts.weekday}</span>
               <span className="text-sm font-black text-slate-600 uppercase tracking-widest">{dateParts.month}</span>
             </div>
          </div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-4 hover:bg-sky-50 rounded-2xl transition-colors"><ChevronRight size={28} className="text-slate-400"/></button>
        </div>
      </header>

      <main className="p-4 flex-grow space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Target Card */}
            <div className="bg-[#e0f2fe] rounded-[40px] p-8 text-slate-800 shadow-xl relative overflow-hidden">
               <Target size={120} className="absolute -right-8 -top-8 text-sky-200/40" />
               <p className="text-sky-500 text-[10px] font-black uppercase tracking-widest mb-1">{t.targetReached}</p>
               <h2 className="text-3xl font-black mb-8 text-slate-800">{totals.targetDate || '...'}</h2>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/60">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1" dangerouslySetInnerHTML={{ __html: t.oldIntake }} />
                   <p className="text-xl font-black text-slate-700">{Math.round(totals.baselineTdee)} <span className="text-[10px] font-normal">kcal</span></p>
                 </div>
                 <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/60">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1" dangerouslySetInnerHTML={{ __html: t.newIntake }} />
                   <p className="text-xl font-black text-slate-700">{DAILY_KCAL_INTAKE_GOAL} <span className="text-[10px] font-normal">kcal</span></p>
                 </div>
               </div>
            </div>

            {/* Calorie Tracker Card */}
            <div className="bg-white rounded-[40px] p-8 border border-sky-50 shadow-sm overflow-visible">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-amber-400 fill-amber-400" />
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Dagbudget</h3>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${totals.actualIntake > DAILY_KCAL_INTAKE_GOAL ? 'text-red-600 bg-red-50' : 'text-slate-400 bg-slate-50'}`}>
                    {totals.actualIntake > DAILY_KCAL_INTAKE_GOAL ? 'Limiet overschreden' : `${Math.round(DAILY_KCAL_INTAKE_GOAL - totals.actualIntake)} kcal over`}
                  </span>
               </div>
               
               <div className="relative pt-8 pb-24">
                 <div className="flex justify-between items-center mb-4 px-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start</span>
                      <span className="text-xs font-black text-slate-600">1800 kcal</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gegeten</span>
                      <span className={`text-xs font-black ${totals.actualIntake > DAILY_KCAL_INTAKE_GOAL ? 'text-red-500' : 'text-slate-600'}`}>
                        {Math.round(totals.actualIntake)} kcal
                      </span>
                    </div>
                 </div>
                 
                 <div className="h-10 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200 relative">
                    <div 
                      className={`h-full transition-all duration-1000 shadow-lg ${totals.calorieStatusColor}`} 
                      style={{ width: `${Math.min(totals.intakePercent, 100)}%` }} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                 </div>

                 <div 
                   className="absolute top-[96px] transition-all duration-1000 z-10" 
                   style={{ 
                     left: `${Math.min(totals.intakePercent, 100)}%`, 
                     transform: 'translateX(-50%)'
                   }}
                 >
                   <div className="flex flex-col items-center">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
                     <span className={`text-xs font-black leading-none whitespace-nowrap ${totals.intakePercent > 100 ? 'text-red-600' : 'text-black'}`}>
                        {Math.round(totals.intakePercent)}%
                     </span>
                   </div>
                 </div>
               </div>
            </div>

            {/* Weight Journey Card */}
            <div className="bg-white rounded-[40px] p-8 border border-sky-50 shadow-sm overflow-visible">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">{t.myJourney}</h3>
                  <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-xl">-{ (state.profile.startWeight - latestWeight).toFixed(1) } KG</span>
               </div>
               
               <div className="relative pt-8 pb-24">
                 <div className="flex justify-between items-center mb-4 px-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start</span>
                      <span className="text-xs font-black text-slate-600">{state.profile.startWeight} KG</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">{t.goalWeight}</span>
                      <span className="text-xs font-black text-sky-500">{state.profile.targetWeight} KG</span>
                    </div>
                 </div>
                 
                 <div className="h-10 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200 relative">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(34,197,94,0.3)]" style={{ width: `${Math.min(Math.max(totals.weightProgressPercent, 0), 100)}%` }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                 </div>

                 <div 
                   className="absolute top-[96px] transition-all duration-1000 z-10" 
                   style={{ 
                     left: `${Math.min(Math.max(totals.weightProgressPercent, 0), 100)}%`, 
                     transform: 'translateX(-50%)'
                   }}
                 >
                   <div className="flex flex-col items-center">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">NU</span>
                     <span className="text-xs font-black text-black leading-none whitespace-nowrap">{latestWeight.toFixed(1)} KG</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-sky-50 shadow-sm">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Scale size={18} className="text-sky-400" /> {t.weighMoment}</h3>
              <div className="flex items-center gap-4 bg-[#e0f2fe]/50 p-5 rounded-3xl border border-sky-100">
                <input type="number" step="0.1" placeholder="00.0" value={currentLog.weight || ''} onChange={(e) => setDailyWeight(e.target.value ? Number(e.target.value) : undefined)} className="w-full bg-transparent border-none p-0 text-5xl font-black text-sky-500 focus:ring-0" />
                <span className="text-lg font-black text-slate-400 uppercase">kg</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-8 pb-12 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-2">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">{t.mealSchedule}</h2><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.todayPlanning}</span></div>
              <button onClick={() => setShowMyList(true)} className="flex items-center gap-2 bg-white text-sky-500 border border-sky-100 shadow-sm px-4 py-2 rounded-2xl font-black text-[10px] uppercase"><ListFilter size={18} /> {t.myList}</button>
            </div>

            {mealGroups.map((group) => (
              <div key={group.label} className="bg-[#e0f2fe]/40 rounded-[40px] p-6 border border-sky-100/30 space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="p-2 bg-white rounded-xl shadow-sm"><group.icon size={18} className="text-sky-400" /></div>
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">{group.label}</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {group.moments.map(moment => {
                    const items = currentLog.meals[moment] || [];
                    const availableOptions = state.customOptions[moment] || [];
                    return (
                      <div key={moment} className="bg-white rounded-[32px] p-5 shadow-sm border border-white">
                        <h4 className="font-black text-[10px] text-sky-400 uppercase mb-4 tracking-widest">{t.moments[moment]}</h4>
                        <div className="space-y-2 mb-4">
                          {items.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                              <div><p className="text-xs font-black text-slate-800">{getTranslatedName(item.mealId || '', item.name)}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{item.quantity}x • {item.kcal} kcal</p></div>
                              <button onClick={() => removeMealItem(moment, item.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                            </div>
                          ))}
                        </div>
                        <select className="w-full bg-slate-50 border-none rounded-2xl p-3 text-[10px] font-bold" onChange={(e) => {
                          const val = e.target.value; if (!val) return;
                          const opt = availableOptions.find(o => o.id === val);
                          if (opt) addMealItem(moment, { name: opt.name, kcal: opt.kcal, quantity: 1, mealId: opt.id });
                          e.target.value = '';
                        }}>
                          <option value="">+ {t.add}...</option>
                          {availableOptions.map(o => <option key={o.id} value={o.id}>{getTranslatedName(o.id, o.name)}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
           <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex justify-between items-center px-2">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">{t.movement}</h2><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.planActivities}</span></div>
                <button onClick={() => setShowMyActivityList(true)} className="flex items-center gap-2 bg-white text-sky-500 border border-sky-100 shadow-sm px-4 py-2 rounded-2xl font-black text-[10px] uppercase"><ListFilter size={18} /> {t.myList}</button>
             </div>
             <div className="bg-white border border-sky-100 rounded-[32px] p-6 text-slate-800 shadow-sm">
                <select className="w-full bg-sky-50 border border-sky-100 rounded-2xl p-4 text-sm font-bold mb-4" value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)}>
                   {state.customActivities.map(act => <option key={act.id} value={act.id}>{getTranslatedName(act.id, act.name)}</option>)}
                </select>
                <div className="flex gap-2">
                   <input type="number" id="act-val" placeholder={t.amount} className="flex-grow bg-sky-50 border border-sky-100 rounded-2xl p-4 text-sm font-black" />
                   <button onClick={() => {
                     const val = Number((document.getElementById('act-val') as HTMLInputElement).value);
                     if (val > 0) addActivity(selectedActivityId, val);
                   }} className="bg-sky-400 text-white px-6 rounded-2xl font-black shadow-lg shadow-sky-100"><Plus /></button>
                </div>
             </div>
             <div className="space-y-3">
               {currentLog.activities.map(a => (
                 <div key={a.id} className="bg-white rounded-3xl p-4 border border-sky-50 shadow-sm flex justify-between items-center">
                   <div><p className="font-black text-slate-800 text-sm">{getTranslatedName(a.typeId, state.customActivities.find(x => x.id === a.typeId)?.name || '')}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{a.value} {state.customActivities.find(x => x.id === a.typeId)?.unit} • <span className="text-green-600">+{a.burnedKcal} kcal</span></p></div>
                   <button onClick={() => removeActivity(a.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={20}/></button>
                 </div>
               ))}
             </div>
           </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <h2 className="text-2xl font-black text-slate-800 px-2 tracking-tight">{t.settings}</h2>
             
             <div className="bg-white rounded-[32px] p-6 border border-sky-50 shadow-sm space-y-4">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Globe size={16} className="text-sky-400" /> {t.language}</h3>
               <div className="grid grid-cols-5 gap-2" dir="ltr">
                 {(Object.keys(flagEmojis) as Language[]).map(lang => (
                   <button key={lang} onClick={() => setState(prev => ({ ...prev, language: lang }))} className={`text-3xl p-2 rounded-2xl transition-all border-2 ${state.language === lang ? 'border-sky-400 bg-sky-50 scale-110' : 'border-transparent hover:bg-slate-50'}`}>{flagEmojis[lang]}</button>
                 ))}
               </div>
             </div>

             <div className="bg-white rounded-[32px] p-8 border border-sky-50 shadow-sm space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t.age}</label><input type="number" value={state.profile.age} onChange={e => setState({...state, profile: {...state.profile, age: Number(e.target.value)}})} className="w-full bg-slate-50 p-4 rounded-2xl font-black border-none" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t.height}</label><input type="number" value={state.profile.height} onChange={e => setState({...state, profile: {...state.profile, height: Number(e.target.value)}})} className="w-full bg-slate-50 p-4 rounded-2xl font-black border-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t.startWeight}</label><input type="number" value={state.profile.startWeight} onChange={e => setState({...state, profile: {...state.profile, startWeight: Number(e.target.value)}})} className="w-full bg-slate-50 p-4 rounded-2xl font-black border-none" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t.targetWeight}</label><input type="number" value={state.profile.targetWeight} onChange={e => setState({...state, profile: {...state.profile, targetWeight: Number(e.target.value)}})} className="w-full bg-sky-50 p-4 rounded-2xl font-black text-sky-500 border-none" /></div>
                </div>
             </div>
             
             <div className="space-y-3">
               <button onClick={() => setShowLegal(true)} className="w-full flex items-center justify-center gap-2 bg-white text-sky-400 text-[10px] font-black uppercase py-5 rounded-3xl border border-sky-100 shadow-sm hover:bg-sky-50 transition-all"><ShieldCheck size={18} /> {t.legal}</button>
               <label className="flex items-center justify-center gap-2 bg-white text-slate-500 text-[10px] font-black uppercase py-5 rounded-3xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-all shadow-sm"><Upload size={18} /> {t.restore}<input type="file" accept=".json" className="hidden" /></label>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-sky-100 px-8 py-5 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[40px] shadow-2xl">
        {[{ id: 'dashboard', icon: LayoutDashboard, label: t.tabs.dashboard }, { id: 'meals', icon: Utensils, label: t.tabs.meals }, { id: 'activity', icon: Activity, label: t.tabs.activity }, { id: 'profile', icon: UserIcon, label: t.tabs.profile }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-2 transition-all duration-300 ${activeTab === tab.id ? 'text-sky-500 scale-110' : 'text-slate-300'}`}>
            <tab.icon size={26} strokeWidth={activeTab === tab.id ? 3 : 2} /><span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Product Library Modal */}
      {showMyList && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6" onClick={() => setShowMyList(false)}>
           <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-slate-800 uppercase mb-6">{t.products}</h3>
              <form onSubmit={addCustomOptionCentral} className="space-y-4 mb-10 bg-sky-50 p-4 rounded-3xl">
                  <input type="text" placeholder={t.productName} value={newProductName} onChange={e => setNewProductName(e.target.value)} className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold" required />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Gram" value={newProductGram} onChange={e => setNewProductGram(e.target.value)} className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold" />
                    <input type="number" placeholder={t.kcal} value={newProductKcal} onChange={e => setNewProductKcal(e.target.value)} className="w-full bg-white border-none rounded-xl p-3 text-xs font-black" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Ontbijt','Lunch','Diner','Snacks'].map(cat => (
                      <button key={cat} type="button" onClick={() => setNewProductCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} className={`px-2 py-2 rounded-xl text-[9px] font-black uppercase ${newProductCats.includes(cat) ? 'bg-sky-400 text-white' : 'bg-white text-sky-300 border border-sky-100'}`}>{cat}</button>
                    ))}
                  </div>
                  <button type="submit" className="w-full bg-sky-400 text-white py-3 rounded-xl font-black uppercase text-[10px]">{t.saveInList}</button>
              </form>
              <div className="space-y-2">
                {allUniqueProducts.map(opt => (
                  <div key={opt.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-xs font-bold border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-slate-800">{opt.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{opt.kcal} kcal</span>
                    </div>
                    {opt.isCustom && (
                      <button onClick={() => removeProductFromLibrary(opt.name)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowMyList(false)} className="w-full mt-6 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px]">{t.close}</button>
           </div>
        </div>
      )}

      {/* Activity Library Modal */}
      {showMyActivityList && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6" onClick={() => setShowMyActivityList(false)}>
           <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-slate-800 uppercase mb-6">{t.myList} ({t.movement})</h3>
              <form onSubmit={addCustomActivityCentral} className="space-y-4 mb-10 bg-sky-50 p-4 rounded-3xl">
                  <input type="text" placeholder={t.activityName} value={newActivityName} onChange={e => setNewActivityName(e.target.value)} className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold" required />
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest ml-1">{t.kcalPerMin}</label>
                    <input type="number" step="0.1" value={newActivityKcalMin} onChange={e => setNewActivityKcalMin(e.target.value)} placeholder="0" className="w-full bg-white border-none rounded-xl p-3 text-xs font-black" required />
                  </div>
                  <button type="submit" className="w-full bg-sky-400 text-white py-3 rounded-xl font-black uppercase text-[10px]">{t.add}</button>
              </form>
              <div className="space-y-2">
                {state.customActivities.map(act => (
                  <div key={act.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-xs font-bold border border-slate-100">
                    <span className="text-slate-800">{getTranslatedName(act.id, act.name)}</span>
                    {act.isCustom && (
                      <button onClick={() => removeActivityFromLibrary(act.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowMyActivityList(false)} className="w-full mt-6 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px]">{t.close}</button>
           </div>
        </div>
      )}

      {showLegal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6" onClick={() => setShowLegal(false)}>
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-3"><ShieldCheck className="text-sky-400" /> {t.legal}</h3>
            <div className="space-y-4 text-xs text-slate-500 leading-relaxed mb-8">
              <p className="font-bold text-slate-800">{t.legalText}</p>
              <div className="h-px bg-slate-100" />
              <p>Privacy & Data: Al uw gegevens worden lokaal op dit apparaat opgeslagen (IndexedDB). Wij hebben geen toegang tot uw gewicht of eetpatroon.</p>
              <p>Geen medisch advies: Deze app biedt enkel schattingen en vervangt geen diëtist of arts.</p>
            </div>
            <button onClick={() => setShowLegal(false)} className="w-full py-5 bg-sky-400 text-white font-black rounded-3xl uppercase text-[10px] tracking-widest shadow-lg shadow-sky-100">{t.close}</button>
          </div>
        </div>
      )}

      {showInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6" onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-3"><Info className="text-sky-400" /> {t.info}</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-8">{t.infoText}</p>
            <button onClick={() => setShowInfo(false)} className="w-full py-5 bg-sky-400 text-white font-black rounded-3xl uppercase text-[10px] tracking-widest shadow-lg shadow-sky-100">{t.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}
