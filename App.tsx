
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
  Briefcase,
  Smartphone,
  BookOpen,
  HelpCircle,
  Apple,
  Chrome,
  Copyright,
  ShieldAlert,
  UserCircle,
  Sparkles,
  Heart,
  ShieldCheck,
  MousePointer2
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

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
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
      tx.onerror = () => console.error("IndexedDB Clear Error");
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
    dailyBudget: 2058, 
    weightLossSpeed: 'average',
    activityLevel: 'light'
  },
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
        setState({
          ...saved,
          profile: { ...INITIAL_STATE.profile, ...saved.profile },
          customOptions: saved.customOptions || MEAL_OPTIONS,
          customActivities: saved.customActivities || ACTIVITY_TYPES,
          language: saved.language || 'nl'
        });
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const currentProfile = state.profile;
    const currentTDEE = calculateTDEE(currentProfile, 0, currentProfile.currentWeight);
    if (currentProfile.weightLossSpeed === 'custom') {
      if (currentProfile.customTargetDate) {
        const newBudget = calculateBudgetFromTargetDate(currentProfile, currentProfile.customTargetDate);
        if (newBudget !== currentProfile.dailyBudget) {
          setState(prev => ({ ...prev, profile: { ...prev.profile, dailyBudget: newBudget } }));
        }
      }
    } else {
      let deficit = currentProfile.weightLossSpeed === 'slow' ? 250 : currentProfile.weightLossSpeed === 'fast' ? 1000 : 500;
      const safeBudget = Math.max(Math.round(currentTDEE - deficit), 1200);
      if (safeBudget !== currentProfile.dailyBudget) {
        setState(prev => ({ ...prev, profile: { ...prev.profile, dailyBudget: safeBudget } }));
      }
    }
  }, [isLoaded, state.profile.gender, state.profile.birthYear, state.profile.height, state.profile.currentWeight, state.profile.weightLossSpeed, state.profile.targetWeight, state.profile.activityLevel, state.profile.customTargetDate]);

  useEffect(() => {
    if (isLoaded) idb.set(state);
  }, [state, isLoaded]);

  const currentLog = useMemo(() => state.dailyLogs[selectedDate] || { date: selectedDate, meals: {}, activities: [] }, [state.dailyLogs, selectedDate]);
  
  const latestWeight = useMemo((): number => {
    const manualLogWeight = state.dailyLogs[selectedDate]?.weight;
    if (typeof manualLogWeight === 'number' && manualLogWeight > 0) return manualLogWeight;
    const sortedDates = Object.keys(state.dailyLogs).filter(d => d <= selectedDate).sort((a,b) => b.localeCompare(a));
    for (const d of sortedDates) { if (state.dailyLogs[d]?.weight) return state.dailyLogs[d].weight as number; }
    return Number(state.profile.currentWeight) || 86;
  }, [state.dailyLogs, state.profile.currentWeight, selectedDate]);

  const bmi = useMemo(() => calculateBMI(latestWeight, state.profile.height), [latestWeight, state.profile.height]);
  const bmiColor = useMemo(() => bmi < 18.5 ? 'text-orange-400' : bmi < 25 ? 'text-green-500' : bmi < 30 ? 'text-amber-500' : 'text-red-500', [bmi]);

  const totals = useMemo(() => {
    const activityBurn = Number(currentLog.activities.reduce((sum, a) => sum + (Number(a.burnedKcal) || 0), 0));
    const startW = Number(state.profile.startWeight) || 0;
    const targetW = Number(state.profile.targetWeight) || 0;
    const currentW = Number(latestWeight);
    const intakeGoal = Number(state.profile.dailyBudget) || 1800;
    const autoTargetDate = calculateTargetDate({ ...state.profile, currentWeight: currentW }, intakeGoal);
    const weightJourneyTotal = Math.max(startW - targetW, 0.1);
    const weightLostSoFar = startW - currentW;
    const currentAdjustedGoal = Number(intakeGoal + activityBurn);
    const actualIntake = Number(Object.values(currentLog.meals).reduce((acc, items: any) => acc + Number(items.reduce((sum: number, m: any) => sum + (Number(m.kcal) || 0), 0)), 0));
    const intakePercent = currentAdjustedGoal > 0 ? (actualIntake / currentAdjustedGoal) * 100 : 0;
    return { activityBurn, actualIntake, targetDate: state.profile.weightLossSpeed === 'custom' && state.profile.customTargetDate ? state.profile.customTargetDate : autoTargetDate, weightProgressPercent: (weightLostSoFar / weightJourneyTotal) * 100, currentAdjustedGoal, intakeGoal, intakePercent, calorieStatusColor: actualIntake > currentAdjustedGoal ? 'bg-red-500' : intakePercent > 85 ? 'bg-amber-500' : 'bg-green-500' };
  }, [state.profile, currentLog, latestWeight]);

  const dateParts = useMemo(() => {
    const dateObj = new Date(selectedDate);
    const locale = state.language === 'nl' ? 'nl-NL' : 'en-US';
    const parts = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(dateObj);
    return { day: parts.find(p => p.type === 'day')?.value || '', month: parts.find(p => p.type === 'month')?.value || '', weekday: parts.find(p => p.type === 'weekday')?.value || '' };
  }, [selectedDate, state.language]);

  const mealGroups = useMemo(() => [
    { label: t.timeGroups.morning, icon: Coffee, moments: ['Ontbijt', 'Ochtend snack'] as MealMoment[] },
    { label: t.timeGroups.afternoon, icon: Sun, moments: ['Lunch', 'Middag snack'] as MealMoment[] },
    { label: t.timeGroups.evening, icon: Moon, moments: ['Diner', 'Avondsnack'] as MealMoment[] }
  ], [t]);

  const getTranslatedName = (id: string, originalName: string) => PRODUCT_TRANSLATIONS[state.language]?.[id] || PRODUCT_TRANSLATIONS['nl']?.[id] || originalName;

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

  const setLossSpeed = (speed: WeightLossSpeed) => setState(prev => ({ ...prev, profile: { ...prev.profile, weightLossSpeed: speed } }));
  const setActivityLevel = (level: ActivityLevel) => setState(prev => ({ ...prev, profile: { ...prev.profile, activityLevel: level } }));

  const formatTargetDateDisplay = (isoDate: string) => {
    if (!isoDate) return "...";
    const date = new Date(isoDate);
    const locale = state.language === 'nl' ? 'nl-NL' : 'en-US';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `backup_${new Date().toISOString().split('T')[0]}.json`);
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
        if (json.profile) {
          setState(json);
          setToast({msg: 'Hersteld!'});
        }
      } catch (err) { setToast({msg: "Fout", type: 'error'}); }
    };
    reader.readAsText(file);
  };

  const resetAllData = async () => {
    if (confirm(t.dataManagement.clearConfirm)) {
      await idb.clear();
      setState({ ...INITIAL_STATE, language: state.language });
      setActiveTab('dashboard');
    }
  };

  const birthYears = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i >= currentYear - 100; i--) years.push(i);
    return years;
  }, []);

  if (!isLoaded) return <div className="flex h-screen items-center justify-center font-black text-orange-500 uppercase">...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 bg-white flex flex-col shadow-2xl relative overflow-hidden">
      {toast && <Toast message={toast.msg} type={toast.type} onHide={() => setToast(null)} />}
      
      {/* Handleiding en info Modal (Herstelde volledige versie) */}
      {showInfo && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b p-6 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-100"><BookOpen size={20} /></div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase leading-tight">Handleiding en info</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gezondheid in Zicht</p>
                </div>
              </div>
              <button onClick={() => setShowInfo(false)} className="p-2 bg-slate-100 text-slate-400 rounded-full hover:text-slate-800"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-10 pb-16">
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 rounded-lg"><Sparkles size={18} className="text-orange-500" /></div>
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Jouw Partner in Gezondheid</h4>
                </div>
                <div className="space-y-3 text-sm text-slate-600 leading-relaxed font-medium">
                  <p>Welkom bij <strong>Doelgewicht in Zicht</strong>. Onze missie is simpel: jou de tools geven om op een verantwoorde, overzichtelijke en motiverende manier je streefgewicht te bereiken.</p>
                  <p>Deze applicatie is een intelligent dashboard dat rekening houdt met jouw unieke profiel, je levensstijl en je doelen.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 rounded-lg"><MousePointer2 size={18} className="text-orange-500" /></div>
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Hoe gebruik je de App?</h4>
                </div>
                <div className="grid gap-4">
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex gap-4">
                    <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                    <div>
                      <h5 className="font-black text-slate-800 text-xs uppercase mb-1">Stel je profiel in</h5>
                      <p className="text-xs text-slate-500 leading-relaxed">Voer op de 'Ik' pagina je lengte, startgewicht en doel in. Kies een tempo dat bij je past.</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex gap-4">
                    <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                    <div>
                      <h5 className="font-black text-slate-800 text-xs uppercase mb-1">Registreer dagelijks</h5>
                      <p className="text-xs text-slate-500 leading-relaxed">Gebruik de 'Voeding' en 'Beweeg' tabs om je maaltijden en activiteiten bij te houden. Elke activiteit geeft je extra budget!</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-red-500">
                  <ShieldAlert size={18} />
                  <h4 className="font-black text-sm uppercase tracking-widest text-red-500">Belangrijke Informatie</h4>
                </div>
                <div className="bg-red-50 p-5 rounded-3xl border border-red-100 space-y-3">
                  <p className="text-[11px] font-bold text-red-700/80 leading-relaxed uppercase tracking-tight">
                    Deze app is een hulpmiddel en vervangt geen professioneel medisch advies. Wij berekenen schattingen op basis van algemeen geaccepteerde formules. Ieder mens is anders. Heb je medische klachten of twijfels over je gezondheid? Raadpleeg dan altijd een arts. Wij zijn niet aansprakelijk voor resultaten of bijwerkingen van het gebruik van de app.
                  </p>
                </div>
              </section>

              <footer className="mt-10 pt-10 border-t border-slate-100">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-1.5 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">
                    <Copyright size={12} /> 2025 Doelgewicht in Zicht
                  </div>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Alle rechten voorbehouden.</p>
                </div>
              </footer>
            </div>
          </div>
        </div>
      )}

      {/* Mijn Lijst Modals (Nu volledig functioneel) */}
      {showMyList && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
               <div className="flex items-center gap-3"><Utensils size={20} className="text-orange-500" /><h3 className="font-black text-slate-800 uppercase text-lg">Mijn Producten</h3></div>
               <button onClick={() => setShowMyList(false)} className="p-2 bg-white text-slate-400 rounded-full shadow-sm"><X size={20}/></button>
            </div>
            <div className="overflow-y-auto flex-grow p-4 space-y-4">
              {MEAL_MOMENTS.map(moment => (
                <div key={moment} className="space-y-2">
                  <h4 className="text-[11px] font-black text-orange-400 uppercase px-3 py-1 bg-orange-50 rounded-full w-fit tracking-widest">{t.moments[moment] || moment}</h4>
                  {(state.customOptions[moment] || []).map(opt => (
                    <div key={opt.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col group active:bg-slate-50">
                      <span className="text-[14px] font-black text-slate-800 leading-tight uppercase">{getTranslatedName(opt.id, opt.name)}</span>
                      <span className="text-[11px] font-bold uppercase tracking-tight mt-1">
                        <span className="text-slate-400">{opt.unitName || '1 PORTIE'} • </span>
                        <span className="text-orange-500 font-black">{opt.kcal} KCAL</span>
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showMyActivityList && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
               <div className="flex items-center gap-3"><Activity size={20} className="text-orange-500" /><h3 className="font-black text-slate-800 uppercase text-lg">Mijn Activiteiten</h3></div>
               <button onClick={() => setShowMyActivityList(false)} className="p-2 bg-white text-slate-400 rounded-full shadow-sm"><X size={20}/></button>
            </div>
            <div className="overflow-y-auto flex-grow p-4 space-y-2">
              {state.customActivities.map(act => (
                <div key={act.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col">
                  <span className="text-[14px] font-black text-slate-800 uppercase leading-tight">{getTranslatedName(act.id, act.name)}</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {act.met} MET • INTENSIEF
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION (Nu met Taal Selector) */}
      <header className="bg-white border-b sticky top-0 z-30 p-3 shadow-sm">
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="flex flex-col">
             <h1 className="text-xl font-black text-orange-500 leading-none tracking-tight">{t.title}</h1>
             <h2 className="text-[12px] font-black text-slate-400 tracking-[0.2em] uppercase">{t.subtitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <select 
                value={state.language} 
                onChange={(e) => setState(prev => ({ ...prev, language: e.target.value as Language }))} 
                className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase appearance-none pr-8 shadow-sm focus:ring-2 focus:ring-orange-200 transition-all outline-none"
              >
                <option value="nl">Nederlands</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="hi">हिन्दी</option>
                <option value="ar">العربية</option>
              </select>
              <Globe size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="bg-white border border-slate-100 px-3 py-1 rounded-2xl flex items-center gap-2 shadow-sm">
              <TrendingDown size={14} className="text-orange-400" />
              <div className="flex flex-col text-right">
                <span className="text-sm font-black text-slate-800 leading-tight">{latestWeight.toFixed(1)} <span className="text-[9px] text-slate-400 font-black uppercase">KG</span></span>
                <span className={`text-[9px] font-black uppercase ${bmiColor} leading-none tracking-tighter`}>BMI: {bmi}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white rounded-[18px] p-1.5 border border-slate-100 shadow-sm mx-1">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronLeft size={20} className="text-slate-300"/></button>
          <div className="flex items-center gap-3">
             <span className="text-3xl font-black text-orange-500 tabular-nums leading-none tracking-tighter">{dateParts.day}</span>
             <div className="flex flex-col">
               <span className="text-[11px] font-black text-orange-300 uppercase tracking-widest leading-none">{dateParts.weekday}</span>
               <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{dateParts.month}</span>
             </div>
          </div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} className="text-slate-300"/></button>
        </div>
      </header>

      <main className="p-3 flex-grow space-y-3">
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-orange-50/40 rounded-[28px] p-6 text-slate-800 relative overflow-hidden border border-orange-100/50 shadow-sm">
               <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none"><Target size={120} className="text-orange-500" /></div>
               <p className="text-orange-500 text-[11px] font-black uppercase tracking-[0.15em] mb-2">{t.targetReached}</p>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight">{formatTargetDateDisplay(totals.targetDate)}</h2>
            </div>

            <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-6">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5"><Zap size={15} className="text-amber-400 fill-amber-400" /><h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">{t.dailyBudget}</h3></div>
                  <div className="text-right"><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">{t.consumed}</span><span className="text-sm font-black text-orange-500 uppercase leading-none">{totals.actualIntake} <span className="text-[9px]">KCAL</span></span></div>
               </div>
               
               <div className="flex items-baseline font-black tracking-tighter">
                  <span className="text-4xl text-slate-300">{totals.intakeGoal}</span>
                  <span className="text-4xl text-green-500">+{totals.activityBurn}</span>
                  <span className="text-4xl text-orange-500">={totals.currentAdjustedGoal}</span>
               </div>

               <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 relative">
                  <div className={`h-full transition-all duration-1000 ${totals.calorieStatusColor}`} style={{ width: `${Math.min(totals.intakePercent, 100)}%` }} />
               </div>

               <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                  <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.remainingToday}</span><span className={`text-2xl font-black text-orange-500`}>{Math.max(0, totals.currentAdjustedGoal - totals.actualIntake)}</span></div>
                  <div className="flex flex-col text-right"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.caloriesPerDay}</span><span className="text-2xl font-black text-orange-500">{totals.intakeGoal}</span></div>
               </div>
            </div>

            <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-4 flex items-center gap-1.5"><Scale size={16} className="text-orange-400" /> {t.weighMoment}</h3>
              <div className="flex items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                <input type="number" step="0.1" placeholder={t.placeholders.weight} value={state.dailyLogs[selectedDate]?.weight || ''} onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setState(prev => {
                    const logs = { ...prev.dailyLogs };
                    logs[selectedDate] = { ...(logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] }), weight: val };
                    return { ...prev, dailyLogs: logs };
                  });
                }} className="w-full bg-transparent border-none p-0 text-3xl font-black text-orange-500 focus:ring-0 placeholder:text-slate-200" />
                <span className="text-sm font-black text-slate-300 uppercase tracking-widest">kg</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-3 pb-12 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1">
              <div><h2 className="text-xl font-black text-slate-800 tracking-tight">{t.mealSchedule}</h2><span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.todayPlanning}</span></div>
              <button onClick={() => setShowMyList(true)} className="flex items-center gap-1.5 bg-slate-50 text-orange-500 border border-slate-200 shadow-sm px-3 py-1.5 rounded-xl font-black text-xs uppercase transition-all active:scale-95"><ListFilter size={16} /> {t.myList}</button>
            </div>
            {mealGroups.map((group) => (
              <div key={group.label} className="bg-slate-100/40 rounded-[24px] p-4 border border-slate-200/50 space-y-3">
                <div className="flex items-center gap-2 px-1"><div className="p-1 bg-white rounded-lg shadow-sm border border-slate-100"><group.icon size={12} className="text-orange-400" /></div><h3 className="font-black text-slate-800 text-[12px] uppercase tracking-widest">{group.label}</h3></div>
                {group.moments.map(moment => {
                  const items = currentLog.meals[moment] || [];
                  const availableOptions = state.customOptions[moment] || [];
                  const currentInput = mealInputs[moment] || { mealId: '', qty: 1 };
                  const selectedOption = availableOptions.find(o => o.id === currentInput.mealId);
                  const optionLabel = selectedOption ? getTranslatedName(selectedOption.id, selectedOption.name) : '';

                  return (
                    <div key={moment} className="bg-orange-50 rounded-[20px] p-3 shadow-sm border border-orange-100">
                      <h4 className="font-black text-[11px] text-orange-400 uppercase mb-2.5 tracking-widest">{t.moments[moment] || moment}</h4>
                      <div className="flex gap-1.5 mb-2.5 items-center flex-nowrap relative">
                        <div className="flex-grow min-w-0 relative">
                          <button onClick={() => { setOpenPickerMoment(openPickerMoment === moment ? null : moment); setSearchTerm(''); }} className="w-full bg-white border border-orange-100 rounded-xl p-2 text-[14px] font-bold shadow-sm flex items-center justify-between min-w-0 min-h-[46px]">
                            {selectedOption ? (
                              <div className="text-left leading-tight truncate">
                                <div className="font-black text-slate-800 text-xs">{optionLabel}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">{selectedOption.unitName || '1 PORTIE'}</div>
                              </div>
                            ) : <span className="text-slate-300">{t.placeholders.select}</span>}
                            <ChevronDown size={14} className={`text-orange-300 transition-transform ${openPickerMoment === moment ? 'rotate-180' : ''}`} />
                          </button>
                          {openPickerMoment === moment && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[320px] animate-in fade-in zoom-in-95 duration-200">
                              <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                <Search size={14} className="text-slate-400" />
                                <input autoFocus className="bg-transparent border-none text-[14px] w-full focus:ring-0 font-bold" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                              </div>
                              <div className="overflow-y-auto py-2">
                                {availableOptions.filter(o => getTranslatedName(o.id, o.name).toLowerCase().includes(searchTerm.toLowerCase())).map(opt => (
                                  <button key={opt.id} onClick={() => { setMealInputs({ ...mealInputs, [moment]: { ...currentInput, mealId: opt.id } }); setOpenPickerMoment(null); }} className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-slate-50 flex flex-col">
                                    <span className="text-[13px] font-black text-slate-800 truncate mb-0.5">{getTranslatedName(opt.id, opt.name)}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{opt.unitName || '1 PORTIE'} • <span className="text-orange-500 font-black">{opt.kcal} KCAL</span></span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <input type="number" step="0.1" className="w-12 bg-white border border-orange-100 rounded-xl p-2 text-[14px] font-black text-center h-[46px]" value={currentInput.qty} onChange={(e) => setMealInputs({ ...mealInputs, [moment]: { ...currentInput, qty: Number(e.target.value) } })} />
                        <button className="bg-orange-400 text-white p-2 rounded-xl h-[46px] w-[46px] flex items-center justify-center transition-all active:scale-90" disabled={!currentInput.mealId} onClick={() => {
                            const opt = availableOptions.find(o => o.id === currentInput.mealId);
                            if (opt) addMealItem(moment, { name: opt.name, kcal: opt.kcal * currentInput.qty, quantity: currentInput.qty, mealId: opt.id, isDrink: opt.isDrink });
                            setMealInputs({ ...mealInputs, [moment]: { mealId: '', qty: 1 } });
                          }}><Plus size={20} strokeWidth={3} /></button>
                      </div>
                      <div className="space-y-1.5">
                        {items.map(item => {
                          const option = state.customOptions[moment]?.find(o => o.id === item.mealId);
                          return (
                            <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-orange-100">
                              <div className="flex flex-col flex-grow min-w-0 pr-2">
                                <span className="text-[13px] font-black text-slate-800 truncate uppercase">{getTranslatedName(item.mealId || '', item.name)}</span>
                                <span className="text-[10px] font-bold uppercase tracking-tight"><span className="text-slate-400">{item.quantity}x {option?.unitName || 'PORTIE'} • </span><span className="text-orange-500 font-black">{Math.round(item.kcal)} KCAL</span></span>
                              </div>
                              <button onClick={() => setState(prev => {
                                const logs = { ...prev.dailyLogs };
                                logs[selectedDate].meals[moment] = logs[selectedDate].meals[moment].filter(m => m.id !== item.id);
                                return { ...prev, dailyLogs: logs };
                              })} className="text-slate-200 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{t.movement}</h2>
              <button onClick={() => setShowMyActivityList(true)} className="flex items-center gap-1.5 bg-slate-50 text-orange-500 border border-slate-200 shadow-sm px-3 py-1.5 rounded-xl font-black text-xs uppercase transition-all active:scale-95"><ListFilter size={16} /> {t.myList}</button>
            </div>
            <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-200 shadow-sm space-y-3">
              <select value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)} className="w-full bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm outline-none">
                {state.customActivities.map(act => (<option key={act.id} value={act.id}>{getTranslatedName(act.id, act.name)}</option>))}
              </select>
              <div className="flex gap-3">
                <input id="act-val" type="number" placeholder="Minuten" className="flex-grow bg-white p-3 rounded-2xl font-black border border-slate-100 text-sm shadow-sm outline-none" />
                <button onClick={() => { const val = (document.getElementById('act-val') as HTMLInputElement).value; if (val) addActivity(selectedActivityId, Number(val)); }} className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all"><Plus size={24} strokeWidth={3} /></button>
              </div>
            </div>
            <div className="space-y-2">
              {currentLog.activities.map(act => {
                const type = state.customActivities.find(t => t.id === act.typeId);
                return (
                  <div key={act.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-black text-slate-800 leading-tight uppercase">{getTranslatedName(act.typeId, type?.name || '')}</span>
                      <span className="text-[11px] font-bold uppercase tracking-tight text-slate-400 mt-1">{act.value} MINUTEN • <span className="text-emerald-500 font-black">+{Math.round(act.burnedKcal)} KCAL</span></span>
                    </div>
                    <button onClick={() => setState(prev => { const logs = { ...prev.dailyLogs }; logs[selectedDate].activities = logs[selectedDate].activities.filter(a => a.id !== act.id); return { ...prev, dailyLogs: logs }; })} className="text-slate-200 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300 pb-12 w-full block">
             <section className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><UserCircle size={18} className="text-orange-500" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Persoonlijk</h3></div>
                  <button onClick={() => setShowInfo(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl font-black text-[10px] uppercase border border-slate-100 hover:text-orange-500 transition-colors shadow-sm"><HelpCircle size={14} /> Handleiding en info</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t.gender}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setState(prev => ({ ...prev, profile: { ...prev.profile, gender: 'man' } }))} className={`py-3 rounded-2xl font-black text-[11px] uppercase border transition-all ${state.profile.gender === 'man' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-slate-50 text-slate-400 border-transparent'}`}>{t.man}</button>
                      <button onClick={() => setState(prev => ({ ...prev, profile: { ...prev.profile, gender: 'woman' } }))} className={`py-3 rounded-2xl font-black text-[11px] uppercase border transition-all ${state.profile.gender === 'woman' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-slate-50 text-slate-400 border-transparent'}`}>{t.woman}</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.age}</label>
                      <select value={state.profile.birthYear} onChange={(e) => setState(prev => ({ ...prev, profile: { ...prev.profile, birthYear: Number(e.target.value) } }))} className="w-full bg-slate-50 border border-transparent py-3.5 px-4 rounded-2xl font-black text-sm outline-none shadow-inner">{birthYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.height}</label>
                      <div className="relative"><input type="number" value={state.profile.height} onChange={(e) => setState(prev => ({ ...prev, profile: { ...prev.profile, height: Number(e.target.value) } }))} className="w-full bg-slate-50 border border-transparent py-3 px-4 rounded-2xl font-black text-sm outline-none shadow-inner" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">CM</span></div>
                    </div>
                  </div>
                </div>
             </section>

             <section className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2"><Target size={18} className="text-orange-500" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Mijn Doelen</h3></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.startWeight}</label>
                    <div className="relative"><input type="number" value={state.profile.startWeight} onChange={(e) => setState(prev => ({ ...prev, profile: { ...prev.profile, startWeight: Number(e.target.value) } }))} className="w-full bg-slate-50 border border-transparent py-3 px-4 rounded-2xl font-black text-sm outline-none shadow-inner" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">KG</span></div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">{t.targetWeight}</label>
                    <div className="relative"><input type="number" value={state.profile.targetWeight} onChange={(e) => setState(prev => ({ ...prev, profile: { ...prev.profile, targetWeight: Number(e.target.value) } }))} className="w-full bg-orange-50 border border-orange-200 py-3 px-4 rounded-2xl font-black text-sm outline-none shadow-sm text-orange-600" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-orange-300">KG</span></div>
                  </div>
                </div>
             </section>

             <section className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2"><Zap size={18} className="text-orange-500" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Mijn Strategie</h3></div>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'slow', icon: Turtle, label: t.speedSlow },
                      { id: 'average', icon: Footprints, label: t.speedAverage },
                      { id: 'fast', icon: Zap, label: t.speedFast },
                      { id: 'custom', icon: Settings2, label: t.speedCustom }
                    ].map(speed => (
                      <button key={speed.id} onClick={() => setLossSpeed(speed.id as WeightLossSpeed)} className={`flex flex-col items-center gap-3 py-4 rounded-2xl border transition-all ${state.profile.weightLossSpeed === speed.id ? 'bg-orange-50 border-orange-400 shadow-sm' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                        <speed.icon size={18} className={state.profile.weightLossSpeed === speed.id ? 'text-orange-500' : ''} />
                        <span className="text-[8px] font-black uppercase text-center leading-tight">{speed.label}</span>
                      </button>
                    ))}
                  </div>
                  {state.profile.weightLossSpeed === 'custom' && (
                    <input type="date" value={state.profile.customTargetDate || ''} onChange={(e) => setState(prev => ({ ...prev, profile: { ...prev.profile, customTargetDate: e.target.value } }))} className="w-full bg-white border border-orange-200 rounded-xl p-3 text-sm font-black focus:border-orange-500 transition-all outline-none" />
                  )}
                  <div className="bg-slate-900 rounded-[24px] p-6 text-white shadow-xl flex justify-between items-center overflow-hidden">
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t.dailyBudgetLabel}</span><div className="flex items-baseline gap-2"><span className="text-4xl font-black text-orange-500 tracking-tighter">{state.profile.dailyBudget}</span><span className="text-xs font-black text-slate-500 uppercase">Kcal</span></div></div>
                    <Zap size={32} className="text-orange-500 animate-pulse" />
                  </div>
                </div>
             </section>

             <section className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2"><Database size={18} className="text-orange-500" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{t.dataManagement.title}</h3></div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={exportData} className="flex flex-col items-center gap-3 py-5 bg-slate-50 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100 transition-all shadow-sm"><Download size={20} className="text-slate-400" /><span>{t.dataManagement.export}</span></button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-3 py-5 bg-slate-50 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100 transition-all shadow-sm"><Upload size={20} className="text-slate-400" /><span>Herstel</span></button>
                </div>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                <button onClick={resetAllData} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-all mt-2 border border-red-100"><Trash2 size={16} /><span>{t.dataManagement.clearAll}</span></button>
             </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t px-6 py-4 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[28px] shadow-2xl">
        {[{ id: 'dashboard', icon: LayoutDashboard, label: t.tabs.dashboard }, { id: 'meals', icon: Utensils, label: t.tabs.meals }, { id: 'activity', icon: Activity, label: t.tabs.activity }, { id: 'profile', icon: UserIcon, label: t.tabs.profile }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === tab.id ? 'text-orange-500 scale-110' : 'text-slate-300'}`}>
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 3 : 2} /><span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
