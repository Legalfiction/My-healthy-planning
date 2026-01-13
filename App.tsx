
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
  Check
} from 'lucide-react';
import { 
  UserProfile, 
  DailyLog, 
  AppState, 
  MealMoment, 
  LoggedMealItem,
  MealOption
} from './types';
import { 
  MEAL_MOMENTS, 
  MEAL_OPTIONS, 
  ACTIVITY_TYPES, 
  DAILY_KCAL_INTAKE_GOAL 
} from './constants';
import { 
  calculateTDEE,
  calculateActivityBurn, 
  calculateTargetDate
} from './services/calculator';

const DB_NAME = 'GezondPlanningDB';
const STORE_NAME = 'appState';
const STATE_KEY = 'mainState';

// IndexedDB Utility
const idb = {
  open: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2);
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
  customOptions: MEAL_OPTIONS // Initialize with standard options from constants
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'activity' | 'profile'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showMyList, setShowMyList] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(ACTIVITY_TYPES[0].id);
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [showInfo, setShowInfo] = useState(false);
  const [fileHandle, setFileHandle] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');

  // New product form state
  const [newProductName, setNewProductName] = useState('');
  const [newProductGram, setNewProductGram] = useState('');
  const [newProductKcal, setNewProductKcal] = useState('');
  const [newProductCats, setNewProductCats] = useState<string[]>([]);

  const activeUnit = useMemo(() => ACTIVITY_TYPES.find(t => t.id === selectedActivityId)?.unit || '', [selectedActivityId]);

  useEffect(() => {
    const initApp = async () => {
      if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
      const saved = await idb.get();
      if (saved) {
        // Migration check: if old data doesn't have meal options in state, merge them
        const migratedState = {
          ...saved,
          customOptions: saved.customOptions && Object.keys(saved.customOptions).length > 0 
            ? saved.customOptions 
            : MEAL_OPTIONS
        };
        setState(migratedState);
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

  // Extract all unique products from the library in state
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
    
    const newOption: MealOption = {
      id: newItemId,
      name: displayName,
      kcal: kcalValue,
      isCustom: true
    };

    setState(prev => {
      const customOptions = { ...prev.customOptions };
      
      const momentsToUpdate: MealMoment[] = [];
      if (newProductCats.includes('Ontbijt')) momentsToUpdate.push('Ontbijt');
      if (newProductCats.includes('Lunch')) momentsToUpdate.push('Lunch');
      if (newProductCats.includes('Diner')) momentsToUpdate.push('Diner');
      if (newProductCats.includes('Snacks')) {
        momentsToUpdate.push('Ochtend snack', 'Middag snack', 'Avondsnack');
      }

      momentsToUpdate.forEach(m => {
        const momentOpts = customOptions[m] || [];
        if (!momentOpts.some(o => o.name.toLowerCase() === displayName.toLowerCase())) {
          customOptions[m] = [newOption, ...momentOpts];
        }
      });

      return { ...prev, customOptions };
    });

    setNewProductName('');
    setNewProductGram('');
    setNewProductKcal('');
    setNewProductCats([]);
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
            customOptions: parsed.customOptions || MEAL_OPTIONS
          });
          alert('Gegevens succesvol hersteld inclusief de volledige productlijst!');
        } else {
          alert('Ongeldig backup bestand.');
        }
      } catch (err) {
        alert('Fout bij herstellen.');
      }
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

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 bg-slate-50 flex flex-col shadow-2xl relative">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
             <h1 className="text-xl font-black text-indigo-700 leading-none tracking-tight">DOELGEWICHT</h1>
             <span className="text-[10px] font-black text-slate-400 tracking-[0.2em]">IN ZICHT</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInfo(true)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all">
              <Info size={22} />
            </button>
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-2xl">
              <TrendingDown size={14} className="text-indigo-600" />
              <span className="text-[11px] font-black text-indigo-700 uppercase">
                {latestWeight.toFixed(1)} <span className="text-[9px] opacity-60">KG</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between bg-slate-100/50 rounded-2xl p-1.5 border border-slate-200/50">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2.5 hover:bg-white rounded-xl bg-white/50 shadow-sm transition-colors"><ChevronLeft size={18} className="text-slate-600"/></button>
          <div className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase tracking-widest"><CalendarIcon size={14} className="text-indigo-500" />{new Date(selectedDate).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2.5 hover:bg-white rounded-xl bg-white/50 shadow-sm transition-colors"><ChevronRight size={18} className="text-slate-600"/></button>
        </div>
      </header>

      <main className="p-4 flex-grow space-y-6 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-50 border border-indigo-100 rounded-[32px] p-6 text-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Target size={80} className="text-indigo-700" /></div>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Doel bereikt op</p>
              <h2 className="text-3xl font-black mb-5 tracking-tight text-indigo-900">{totals.targetDate || 'Berekenen...'}</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border border-indigo-100/50">
                  <div className="flex items-center gap-1.5 mb-1 opacity-70"><Flame size={10} className="text-indigo-500" /><p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Basis</p></div>
                  <p className="text-xl font-black text-indigo-700">{Math.round(totals.baselineTdee)} <span className="text-[10px] font-medium opacity-60">kcal</span></p>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border border-indigo-100/50">
                  <div className="flex items-center gap-1.5 mb-1 opacity-70"><TrendingDown size={10} className="text-green-500" /><p className="text-[9px] font-black uppercase tracking-widest text-green-600">Tekort</p></div>
                  <p className="text-xl font-black text-green-600">-{Math.round(Math.max(0, totals.baselineDeficit))} <span className="text-[10px] font-medium opacity-60">kcal</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-tight"><TrendingDown size={18} className="text-green-500" /> Jouw Reis</h3>
                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">-{ (state.profile.startWeight - latestWeight).toFixed(1) } KG</span>
               </div>
               <div className="relative pt-6 pb-2 px-2">
                 <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(Math.max(totals.weightProgressPercent, 0), 100)}%` }} />
                 </div>
                 <div className="absolute top-0 left-0 text-[9px] font-black text-slate-400 uppercase">{state.profile.startWeight} KG</div>
                 <div className="absolute top-0 right-0 text-[9px] font-black text-indigo-600 uppercase">DOEL {state.profile.targetWeight} KG</div>
                 <div className="absolute top-10 transform -translate-x-1/2 text-[10px] font-black text-slate-800 transition-all duration-1000 whitespace-nowrap" style={{ left: `${Math.min(Math.max(totals.weightProgressPercent, 0), 100)}%` }}>NU {latestWeight.toFixed(1)}</div>
               </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-tight"><Scale size={18} className="text-indigo-500" /> Weegmoment</h3>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <input type="number" step="0.1" placeholder="00.0" value={currentLog.weight || ''} onChange={(e) => setDailyWeight(e.target.value ? Number(e.target.value) : undefined)} className="w-full bg-transparent border-none p-0 text-4xl font-black text-indigo-700 focus:ring-0" />
                <span className="text-sm font-black text-slate-400 uppercase">kg</span>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-tight mb-1"><Utensils size={18} className="text-orange-500" /> Dagbudget</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan: {totals.intakeGoal} kcal</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1"><span className={`text-3xl font-black tracking-tight ${totals.remaining < 0 ? 'text-red-500' : 'text-slate-900'}`}>{totals.actualIntake}</span><span className="text-xs font-black text-slate-400">kcal</span></div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-6 rounded-2xl overflow-hidden p-1.5 mb-3 border border-slate-200/50"><div className={`h-full rounded-xl transition-all duration-1000 shadow-sm ${totals.remaining < 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((totals.actualIntake / totals.currentAdjustedGoal) * 100, 100)}%` }} /></div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-5 pb-12 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-2">
              <div><h2 className="text-2xl font-black text-slate-800 leading-none tracking-tight">Eetschema</h2><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Planning voor vandaag</span></div>
              <button onClick={() => setShowMyList(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                <ListFilter size={18} /> Mijn Lijst
              </button>
            </div>

            {MEAL_MOMENTS.map((moment, idx) => {
              const items = currentLog.meals[moment] || [];
              const availableOptions = state.customOptions[moment] || [];
              const groupBg = idx < 2 ? 'bg-orange-50/40' : idx < 4 ? 'bg-emerald-50/40' : 'bg-indigo-50/60';
              
              return (
                <div key={moment} className={`rounded-[32px] p-6 border border-slate-100 shadow-sm ${groupBg}`}>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-black text-slate-800 tracking-tight uppercase text-sm">{moment}</h3>
                  </div>

                  <div className="space-y-3 mb-6">
                    {items.length > 0 ? items.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white/90 p-4 rounded-2xl border border-white/60 group shadow-sm transition-all hover:bg-white">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 leading-tight">{item.name}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                            {item.quantity} stuks/portie <span className="mx-1.5 text-slate-300">•</span> {item.kcal} kcal
                          </span>
                        </div>
                        <button onClick={() => removeMealItem(moment, item.id)} className="text-slate-200 hover:text-red-500 p-2 transition-colors active:scale-90">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    )) : (
                      <div className="py-8 text-center border-2 border-dashed border-slate-200/50 rounded-[24px] bg-white/20">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Nog niets gepland</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr,60px,54px] gap-2 items-end">
                    <div className="relative">
                      <select id={`sel-${moment}`} className="w-full bg-white/80 border-none rounded-2xl h-[52px] p-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 appearance-none shadow-inner" onChange={(e) => {
                          const val = e.target.value; if (!val) return;
                          const opt = availableOptions.find(o => o.id === val);
                          const qty = Number((document.getElementById(`q-${moment}`) as HTMLInputElement).value) || 1;
                          if (opt) addMealItem(moment, { name: opt.name, kcal: opt.kcal * qty, quantity: qty, mealId: opt.id });
                          e.target.value = '';
                        }}>
                        <option value="">+ Toevoegen...</option>
                        {availableOptions.map(o => <option key={o.id} value={o.id}>{o.name} ({o.kcal} kcal)</option>)}
                      </select>
                    </div>
                    <input id={`q-${moment}`} type="number" defaultValue="1" min="1" className="w-full bg-white/80 border-none rounded-2xl h-[52px] p-4 text-xs font-black text-center text-slate-700 shadow-inner" />
                    <button 
                      onClick={() => document.getElementById(`sel-${moment}`)?.dispatchEvent(new Event('change', { bubbles: true }))} 
                      className="bg-indigo-100 text-indigo-600 h-[52px] flex items-center justify-center rounded-2xl active:scale-90 transition-all border border-indigo-200/50"
                    >
                      <Plus size={24} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'activity' && (
           <div className="space-y-6 animate-in fade-in duration-300">
             <h2 className="text-2xl font-black text-slate-800 px-2 leading-none tracking-tight">Beweging</h2>
             <div className="bg-indigo-50 border border-indigo-100 rounded-[32px] p-7 text-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute -bottom-4 -right-4 opacity-5 rotate-12"><Activity size={120} className="text-indigo-700" /></div>
                <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight text-indigo-800"><Plus size={20} strokeWidth={3} /> Activiteit</h3>
                <form className="space-y-4 relative z-10" onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const tid = fd.get('tid') as string;
                  const val = Number(fd.get('val'));
                  if (tid && val > 0) { addActivity(tid, val); (e.target as HTMLFormElement).reset(); }
                }}>
                  <select name="tid" value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)} className="w-full bg-white/80 border border-indigo-100 rounded-[20px] p-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 appearance-none">{ACTIVITY_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                  <div className="relative"><input name="val" type="number" step="0.1" placeholder="Hoeveelheid..." className="w-full bg-white/80 border border-indigo-100 rounded-[20px] p-4 text-lg font-black text-indigo-700 placeholder:text-indigo-300 focus:ring-2 focus:ring-indigo-500" required /><span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-indigo-300 tracking-widest">{activeUnit}</span></div>
                  <button type="submit" className="w-full bg-white border border-indigo-100 text-indigo-700 font-black py-4.5 rounded-[20px] shadow-sm active:scale-95 transition-all uppercase text-xs tracking-[0.2em]">Toevoegen</button>
                </form>
             </div>
             <div className="space-y-3">
               {currentLog.activities.map(a => (
                 <div key={a.id} className="bg-white rounded-3xl p-4.5 border border-slate-100 flex justify-between items-center shadow-sm">
                   <div><p className="font-black text-slate-800 text-sm">{ACTIVITY_TYPES.find(x => x.id === a.typeId)?.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{a.value} {ACTIVITY_TYPES.find(x => x.id === a.typeId)?.unit} • <span className="text-green-600 font-black">+{a.burnedKcal} kcal</span></p></div>
                   <button onClick={() => removeActivity(a.id)} className="text-slate-200 hover:text-red-500 p-2 transition-colors active:scale-90"><Trash2 size={20}/></button>
                 </div>
               ))}
             </div>
           </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <h2 className="text-2xl font-black text-slate-800 px-2 leading-none tracking-tight">Instellingen</h2>
             <div className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm space-y-6">
               <div className="grid grid-cols-2 gap-5">
                 <div><label className="text-[9px] font-black text-slate-300 uppercase block mb-2 tracking-widest ml-1">Leeftijd</label><input type="number" value={state.profile.age} onChange={e => updateProfile({age: Number(e.target.value)})} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-slate-700 border-none shadow-inner" /></div>
                 <div><label className="text-[9px] font-black text-slate-300 uppercase block mb-2 tracking-widest ml-1">Lengte (cm)</label><input type="number" value={state.profile.height} onChange={e => updateProfile({height: Number(e.target.value)})} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-slate-700 border-none shadow-inner" /></div>
               </div>
               <div className="grid grid-cols-2 gap-5">
                 <div><label className="text-[9px] font-black text-slate-300 uppercase block mb-2 tracking-widest ml-1">Startgewicht</label><input type="number" step="0.1" value={state.profile.startWeight} onChange={e => updateProfile({startWeight: Number(e.target.value)})} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-slate-700 border-none shadow-inner" /></div>
                 <div><label className="text-[9px] font-black text-slate-300 uppercase block mb-2 tracking-widest ml-1">Doelgewicht</label><input type="number" value={state.profile.targetWeight} onChange={e => updateProfile({targetWeight: Number(e.target.value)})} className="w-full bg-indigo-50 p-4 rounded-2xl font-black text-indigo-700 border-none shadow-inner" /></div>
               </div>
             </div>
             <div className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm space-y-4">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2"><Database size={16} /> Opslag</h3>
               <div className="flex flex-col gap-3">
                 <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${!fileHandle ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`} onClick={() => setFileHandle(null)}>
                   <div className="flex items-center gap-3"><Database className="text-indigo-600" size={20}/><span className="text-[10px] font-black uppercase">Lokaal</span></div>
                   {!fileHandle && <CheckCircle2 size={20} className="text-indigo-600" />}
                 </div>
                 <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${fileHandle ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`} onClick={setupCloudSync}>
                   <div className="flex items-center gap-3"><Cloud className="text-indigo-600" size={20}/><span className="text-[10px] font-black uppercase">Cloud Sync</span></div>
                   {fileHandle && <CheckCircle2 size={20} className="text-indigo-600" />}
                 </div>
               </div>
             </div>
             <label className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 text-[10px] font-black uppercase py-4 rounded-2xl border border-slate-100 cursor-pointer shadow-sm hover:bg-slate-100 transition-all"><Upload size={16} /> Herstellen van bestand<input type="file" accept=".json" onChange={restoreData} className="hidden" /></label>
             <div className="pt-6 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">DOELGEWICHT v1.7.0</p>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[32px] shadow-2xl">
        {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Plan' }, { id: 'meals', icon: Utensils, label: 'Eten' }, { id: 'activity', icon: Activity, label: 'Beweeg' }, { id: 'profile', icon: UserIcon, label: 'Ik' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 3 : 2} /><span className="text-[9px] font-black uppercase tracking-[0.15em]">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* MIJN PRODUCTEN BEHEREN (Alles weergeven uit state) */}
      {showMyList && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[60] flex items-center justify-center p-6" onClick={() => setShowMyList(false)}>
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600"><ListFilter size={24} /></div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Producten</h3>
              </div>
              <button onClick={() => setShowMyList(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
            </div>
            
            {/* NIEUW PRODUCT TOEVOEGEN */}
            <div className="mb-10 bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 space-y-5">
               <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-2"><Plus size={16} strokeWidth={3} /> Nieuw Product</h4>
               <form onSubmit={addCustomOptionCentral} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Productnaam *</label>
                    <input type="text" value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="bijv. Eiwit pannenkoek" className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Aantal gram</label>
                      <input type="number" value={newProductGram} onChange={e => setNewProductGram(e.target.value)} placeholder="0" className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Calorieën *</label>
                      <input type="number" value={newProductKcal} onChange={e => setNewProductKcal(e.target.value)} placeholder="0" className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-black text-orange-600 shadow-sm focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1 block mb-2">Plaatsen in lijsten *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Ontbijt', 'Lunch', 'Diner', 'Snacks'].map(cat => (
                        <button 
                          key={cat} 
                          type="button" 
                          onClick={() => toggleCategory(cat)}
                          className={`flex items-center justify-between px-3 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${newProductCats.includes(cat) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-indigo-100 text-indigo-400'}`}
                        >
                          {cat}
                          {newProductCats.includes(cat) && <Check size={12} strokeWidth={4} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={!newProductName || !newProductKcal || newProductCats.length === 0}
                    className="w-full bg-indigo-600 text-white py-4.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all mt-4"
                  >
                    Opslaan in lijst
                  </button>
               </form>
            </div>

            {/* VOLLEDIG OVERZICHT (Bewerken / Verwijderen) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Bookmark size={16} /> Mijn Bibliotheek</h4>
                <span className="text-[10px] font-black text-slate-400 uppercase">{allUniqueProducts.length} items</span>
              </div>
              
              {allUniqueProducts.length > 0 ? (
                <div className="space-y-3">
                  {allUniqueProducts.map(opt => (
                    <div key={opt.id} className="flex justify-between items-center bg-slate-50 p-4.5 rounded-3xl border border-slate-100 group transition-all hover:border-indigo-100 hover:bg-white shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800">{opt.name}</span>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase mt-0.5">{opt.kcal} kcal</span>
                      </div>
                      <button 
                        onClick={() => removeOptionFromLibrary(opt.name)} 
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                        title="Verwijder dit product definitief"
                      >
                        <Trash2 size={22} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Geen producten meer beschikbaar</p>
                </div>
              )}
            </div>

            <button onClick={() => setShowMyList(false)} className="w-full mt-10 py-5 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">Terug naar schema</button>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[80] flex items-center justify-center p-6" onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-3"><Info className="text-indigo-600" /> Informatie</h3>
            <div className="space-y-5 text-sm text-slate-600 leading-relaxed mb-8">
              <p>Plan je maaltijden en beweging om je doelgewicht te halen. Gebruik <b>"Mijn Lijst"</b> om eigen favoriete producten toe te voegen of de bibliotheek op te schonen.</p>
              <p>Gegevens worden lokaal en beveiligd op je apparaat opgeslagen.</p>
            </div>
            <button onClick={() => setShowInfo(false)} className="w-full py-4.5 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">Sluiten</button>
          </div>
        </div>
      )}
    </div>
  );
}
