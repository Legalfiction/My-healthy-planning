
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
  Zap,
  Check,
  AlertCircle,
  GlassWater,
  Search,
  ChevronDown,
  X,
  Calendar,
  Footprints,
  Turtle,
  Flame,
  Settings2,
  Laptop,
  Hammer,
  Briefcase,
  BookOpen,
  Copyright,
  ShieldCheck,
  Settings,
  FileDown,
  FileUp
} from 'lucide-react';
import { 
  UserProfile, 
  AppState, 
  MealMoment, 
  LoggedMealItem,
  Language
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
    dailyBudget: 2129, 
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

const LANGUAGE_FLAGS: Record<Language, string> = {
  nl: '🇳🇱', en: '🇺🇸', es: '🇪🇸', de: '🇩🇪', pt: '🇵🇹', 
  zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷', hi: '🇮🇳', ar: '🇸🇦'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'activity' | 'profile'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [showInfo, setShowInfo] = useState(false);
  const [showMyList, setShowMyList] = useState(false);
  const [toast, setToast] = useState<{msg: string, type?: 'success' | 'error' | 'info'} | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [openPickerMoment, setOpenPickerMoment] = useState<MealMoment | null>(null);
  const [mealInputs, setMealInputs] = useState<Record<string, { mealId: string; qty: number }>>({});
  const [showProductList, setShowProductList] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(ACTIVITY_TYPES[0].id);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const MIN_HEALTHY_CALORIES = 1450;

    if (currentProfile.weightLossSpeed === 'custom') {
      if (currentProfile.customTargetDate) {
        const newBudget = calculateBudgetFromTargetDate(currentProfile, currentProfile.customTargetDate);
        if (newBudget !== currentProfile.dailyBudget) {
          setState(prev => ({ ...prev, profile: { ...prev.profile, dailyBudget: newBudget } }));
        }
      } else {
        const fallbackDate = calculateTargetDate(currentProfile, currentProfile.dailyBudget);
         setState(prev => ({ ...prev, profile: { ...prev.profile, customTargetDate: fallbackDate } }));
      }
    } else {
      // More defensive deficits:
      // Slow: -150 (very easy), Average: -350 (moderate), Fast: -600 (ambitious but safe floor)
      let deficit = currentProfile.weightLossSpeed === 'slow' ? 150 : currentProfile.weightLossSpeed === 'fast' ? 600 : 350;
      const safeBudget = Math.max(Math.round(currentTDEE - deficit), MIN_HEALTHY_CALORIES);
      
      if (safeBudget !== currentProfile.dailyBudget) {
        setState(prev => ({ ...prev, profile: { ...prev.profile, dailyBudget: safeBudget } }));
      }
      const autoDate = calculateTargetDate(currentProfile, safeBudget);
      if (autoDate !== currentProfile.customTargetDate) {
         setState(prev => ({ ...prev, profile: { ...prev.profile, customTargetDate: autoDate } }));
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
    
    const weightLogExists = Object.values(state.dailyLogs).some(log => typeof log.weight === 'number');
    const weightLostSoFar = weightLogExists ? (startW - currentW) : 0;
    
    const weightJourneyTotal = Math.abs(startW - targetW) || 0.1;
    const weightProgressPercent = weightLogExists ? Math.min(Math.max((weightLostSoFar / weightJourneyTotal) * 100, 0), 100) : 0;
    
    const currentAdjustedGoal = Number(intakeGoal + activityBurn);
    const actualIntake = Number(Object.values(currentLog.meals).reduce((acc, items) => acc + Number(items.reduce((sum, m) => sum + (Number(m.kcal) || 0), 0)), 0));
    const intakePercent = currentAdjustedGoal > 0 ? (actualIntake / currentAdjustedGoal) * 100 : 0;
    return { 
      activityBurn, 
      actualIntake, 
      targetDate: state.profile.weightLossSpeed === 'custom' && state.profile.customTargetDate ? state.profile.customTargetDate : autoTargetDate, 
      weightProgressPercent, 
      currentAdjustedGoal, 
      intakeGoal, 
      intakePercent, 
      calorieStatusColor: actualIntake > currentAdjustedGoal ? 'bg-red-500' : intakePercent > 85 ? 'bg-amber-500' : 'bg-green-500', 
      weightLostSoFar,
      weightLogExists
    };
  }, [state.profile, currentLog, latestWeight, state.dailyLogs]);

  const dateParts = useMemo(() => {
    const dateObj = new Date(selectedDate);
    const locale = state.language === 'nl' ? 'nl-NL' : 'en-US';
    const parts = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(dateObj);
    return { 
      day: parts.find(p => p.type === 'day')?.value || '', 
      month: parts.find(p => p.type === 'month')?.value || '', 
      weekday: parts.find(p => p.type === 'weekday')?.value || '' 
    };
  }, [selectedDate, state.language]);

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

  const removeCustomMealOption = (moment: MealMoment, optionId: string) => {
    setState(prev => {
      const options = { ...prev.customOptions };
      options[moment] = options[moment].filter(o => o.id !== optionId);
      return { ...prev, customOptions: options };
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
    const locale = state.language === 'nl' ? 'nl-NL' : 'en-US';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const resetAllData = async () => {
    if (confirm(t.dataManagement.clearConfirm)) {
      await idb.clear();
      setState({ ...INITIAL_STATE, language: state.language });
      setActiveTab('dashboard');
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-healthy-planning-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ msg: 'Back-up succesvol gedownload!', type: 'success' });
  };

  const handleRestoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as AppState;
        if (parsed.profile && parsed.dailyLogs) {
          setState(parsed);
          setToast({ msg: 'Gegevens succesvol hersteld!', type: 'success' });
        } else {
          setToast({ msg: 'Ongeldig back-up bestand.', type: 'error' });
        }
      } catch (err) {
        setToast({ msg: 'Fout bij het lezen van bestand.', type: 'error' });
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const birthYears = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 100; i--) years.push(i);
    return years;
  }, []);

  const groupedLoggedMeals = useMemo(() => {
    const meals = currentLog.meals;
    return [
      { id: 'Ontbijt', label: t.moments['Ontbijt'], items: meals['Ontbijt'] || [] },
      { id: 'Lunch', label: t.moments['Lunch'], items: meals['Lunch'] || [] },
      { id: 'Diner', label: t.moments['Diner'], items: meals['Diner'] || [] },
      { id: 'Snackmomenten', label: 'Snackmomenten', items: [
        ...(meals['Ochtend snack'] || []),
        ...(meals['Middag snack'] || []),
        ...(meals['Avondsnack'] || [])
      ] }
    ].filter(cat => cat.items.length > 0);
  }, [currentLog.meals, t]);

  const myListCategories = useMemo(() => {
    return [
      { id: 'Ontbijt', label: t.moments['Ontbijt'], moments: ['Ontbijt'] as MealMoment[] },
      { id: 'Lunch', label: t.moments['Lunch'], moments: ['Lunch'] as MealMoment[] },
      { id: 'Diner', label: t.moments['Diner'], moments: ['Diner'] as MealMoment[] },
      { id: 'Snackmomenten', label: 'Snackmomenten', moments: ['Ochtend snack', 'Middag snack', 'Avondsnack'] as MealMoment[] }
    ];
  }, [t]);

  if (!isLoaded) return <div className="flex h-screen items-center justify-center font-black text-orange-500 uppercase">...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 bg-white flex flex-col shadow-2xl relative overflow-hidden">
      {toast && <Toast message={toast.msg} type={toast.type} onHide={() => setToast(null)} />}
      
      {/* Informatie Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
               <div className="flex items-center gap-3">
                 <div className="bg-orange-500 p-2 rounded-xl text-white">
                   <Info size={20} />
                 </div>
                 <h3 className="font-black text-slate-800 uppercase text-lg tracking-tight">{t.infoModal.title}</h3>
               </div>
               <button onClick={() => setShowInfo(false)} className="p-2 bg-white text-slate-400 rounded-full shadow-sm hover:text-orange-500 transition-colors">
                 <X size={24}/>
               </button>
            </div>
            
            <div className="overflow-y-auto flex-grow p-6 space-y-10 custom-scrollbar pb-20">
               <section className="space-y-4">
                  <h4 className="font-black text-slate-800 text-[14px] uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={20} className="text-orange-500" /> {t.infoModal.manualTitle}
                  </h4>
                  <div className="space-y-4 text-[13px] leading-relaxed font-medium text-slate-600">
                    <p>{t.infoModal.manualText}</p>
                    <div className="grid gap-3">
                      {(t.infoModal.steps || []).map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="block font-black text-orange-500 uppercase text-[10px] tracking-widest mb-1">{item.title}</span>
                          <span className="text-slate-600">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
               </section>

               <section className="space-y-4">
                  <h4 className="font-black text-slate-800 text-[14px] uppercase tracking-widest flex items-center gap-2">
                    <Settings2 size={20} className="text-orange-500" /> {t.infoModal.howItWorksTitle}
                  </h4>
                  <div className="space-y-3 text-[12px] leading-relaxed font-medium text-slate-500 bg-orange-50/50 p-5 rounded-[24px] border border-orange-100">
                    <p>{t.infoModal.howItWorksText}</p>
                    <p>{t.infoModal.caloriesNote}</p>
                  </div>
               </section>

               <section className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-2 text-slate-400">
                      <ShieldCheck size={18} className="text-emerald-500" />
                      <span className="text-[11px] font-black uppercase tracking-widest">{t.infoModal.privacyTitle}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">{t.infoModal.privacyText}</p>
                    <div className="flex items-center gap-1.5 text-slate-300 mt-2">
                      <Copyright size={14} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.infoModal.copyright}</span>
                    </div>
                  </div>
               </section>
            </div>
          </div>
        </div>
      )}

      {/* Mijn Lijst Modal */}
      {showMyList && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
               <div className="flex items-center gap-3"><Utensils size={20} className="text-orange-500" /><h3 className="font-black text-slate-800 uppercase text-lg">Mijn Producten</h3></div>
               <button onClick={() => setShowMyList(false)} className="p-2 bg-white text-slate-400 rounded-full shadow-sm"><X size={20}/></button>
            </div>
            <div className="overflow-y-auto flex-grow p-4 space-y-6 custom-scrollbar">
              {myListCategories.map(cat => (
                <div key={cat.id} className="space-y-3">
                  <h4 className="text-[12px] font-black text-orange-400 uppercase px-3 py-1 bg-orange-50 rounded-full w-fit tracking-[0.1em]">{cat.label}</h4>
                  <div className="space-y-2">
                    {cat.moments.flatMap(m => state.customOptions[m] || []).map(opt => (
                      <div key={opt.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center active:bg-slate-50 transition-colors">
                        <div className="flex flex-col min-w-0 pr-4">
                          <span className="text-[14px] font-black text-slate-800 leading-tight uppercase truncate">{getTranslatedName(opt.id, opt.name)}</span>
                          <span className="text-[11px] font-bold uppercase tracking-tight text-orange-500 mt-1">
                            {opt.unitName || '1 PORTIE'} • {opt.kcal} KCAL
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            for (const m of cat.moments) {
                              if (state.customOptions[m].some(o => o.id === opt.id)) {
                                removeCustomMealOption(m, opt.id);
                                break;
                              }
                            }
                          }}
                          className="text-slate-200 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="bg-white sticky top-0 z-30 p-3 pt-4 px-5 border-b border-slate-50">
        <div className="flex justify-between items-start mb-1">
          <div className="flex flex-col">
             <h1 className="text-2xl font-black text-orange-500 leading-none tracking-tight mt-1">{t.title}</h1>
             <h2 className="text-[14px] font-black text-slate-400 tracking-[0.1em] uppercase mt-0.5">{t.subtitle}</h2>
          </div>
          
          <div className="flex items-center gap-2 pt-1">
             <div className="relative">
                <select 
                  value={state.language} 
                  onChange={(e) => setState(prev => ({ ...prev, language: e.target.value as Language }))} 
                  className="bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1.5 text-[10px] font-black uppercase appearance-none pr-6 shadow-sm outline-none cursor-pointer"
                >
                  {Object.keys(translations).map(lang => (
                    <option key={lang} value={lang}>{LANGUAGE_FLAGS[lang as Language]} {lang.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>

             <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-[20px] flex flex-col items-center justify-center min-w-[85px] shadow-sm">
                <div className="flex items-center gap-1">
                  <TrendingDown size={12} className="text-orange-400" />
                  <span className="text-[14px] font-black text-slate-800 leading-none">{latestWeight.toFixed(1)} <span className="text-[8px] text-slate-400 font-black uppercase">KG</span></span>
                </div>
                <span className={`text-[9px] font-black uppercase ${bmiColor} leading-none mt-0.5`}>BMI: {bmi}</span>
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 px-1">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 bg-slate-50 rounded-2xl text-slate-300 hover:text-orange-500 transition-colors border border-slate-100"><ChevronLeft size={24}/></button>
          <div className="flex items-center gap-3">
             <span className="text-4xl font-black text-orange-500 tabular-nums leading-none">{dateParts.day}</span>
             <div className="flex flex-col">
               <span className="text-[12px] font-black text-orange-400 uppercase tracking-widest leading-none mb-1">{dateParts.weekday}</span>
               <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest leading-none">{dateParts.month}</span>
             </div>
          </div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 bg-slate-50 rounded-2xl text-slate-300 hover:text-orange-500 transition-colors border border-slate-100"><ChevronRight size={24}/></button>
        </div>
      </header>

      <main className="p-4 flex-grow space-y-4 max-h-screen overflow-y-auto custom-scrollbar overscroll-contain pb-32">
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div className="bg-orange-50/50 rounded-[32px] p-7 text-slate-800 relative overflow-hidden border border-orange-100/50 shadow-sm">
               <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none text-orange-500">
                 <Target size={120} strokeWidth={1} />
               </div>
               <p className="text-orange-500 text-[12px] font-black uppercase tracking-[0.2em] mb-3">{t.targetReached}</p>
               <h2 className="text-3xl font-black text-slate-800 tracking-tight">{formatTargetDateDisplay(totals.targetDate)}</h2>
            </div>

            <div className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm space-y-8">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-amber-400 fill-amber-400" />
                    <h3 className="font-black text-slate-800 text-[12px] uppercase tracking-widest">{t.dailyBudget}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">{t.consumed}</span>
                    <span className="text-[16px] font-black text-orange-500 uppercase leading-none">{totals.actualIntake} <span className="text-[10px] text-orange-300 uppercase">KCAL</span></span>
                  </div>
               </div>
               
               <div className="flex items-baseline font-black tracking-tighter gap-0.5">
                  <span className="text-4xl text-slate-300 leading-none">{totals.intakeGoal}</span>
                  <span className="text-4xl text-green-500 leading-none">+{totals.activityBurn}</span>
                  <span className="text-4xl text-orange-500 leading-none">={totals.currentAdjustedGoal}</span>
               </div>

               <div className="h-5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 relative">
                  <div className={`h-full transition-all duration-1000 ${totals.calorieStatusColor}`} style={{ width: `${Math.min(totals.intakePercent, 100)}%` }} />
               </div>

               <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                  <div className="flex flex-col">
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.remainingToday}</span>
                     <span className="text-3xl font-black text-orange-500 leading-none tabular-nums">{Math.max(0, totals.currentAdjustedGoal - totals.actualIntake)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.caloriesPerDay}</span>
                     <span className="text-3xl font-black text-orange-500 leading-none tabular-nums">{totals.intakeGoal}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.activityCalories}</span>
                     <span className="text-3xl font-black text-orange-500 leading-none tabular-nums">{totals.activityBurn}</span>
                  </div>
                  <div className="flex flex-col text-right">
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.consumedTodayLabel}</span>
                     <span className="text-3xl font-black text-orange-500 leading-none tabular-nums">{Math.round(totals.intakePercent)}%</span>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="font-black text-slate-800 text-[12px] uppercase tracking-widest">{t.myJourney}</h3>
                 <span className={`text-[16px] font-black ${totals.weightLostSoFar >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                   {totals.weightLogExists ? (totals.weightLostSoFar >= 0 ? '-' : '+') : ''}
                   {totals.weightLogExists ? Math.abs(totals.weightLostSoFar).toFixed(1) : t.noDataYet} {totals.weightLogExists ? 'KG' : ''}
                 </span>
               </div>
               <div className="space-y-1.5">
                  <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 relative">
                    <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${totals.weightProgressPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>{state.profile.startWeight} KG</span>
                    <span>{state.profile.targetWeight} KG</span>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-800 text-[12px] uppercase tracking-widest mb-4 flex items-center gap-2"><Scale size={18} className="text-orange-400" /> {t.weighMoment}</h3>
              <div className="flex items-center gap-3 bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-inner">
                <input type="number" step="0.1" placeholder={t.placeholders.weight} value={state.dailyLogs[selectedDate]?.weight || ''} onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setState(prev => {
                    const logs = { ...prev.dailyLogs };
                    logs[selectedDate] = { ...(logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] }), weight: val };
                    return { ...prev, dailyLogs: logs };
                  });
                }} className="w-full bg-transparent border-none p-0 text-4xl font-black text-orange-500 focus:ring-0 placeholder:text-slate-200" />
                <span className="text-sm font-black text-slate-300 uppercase tracking-widest">kg</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{t.mealSchedule}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.consumedTodayLabel}:</span>
                  <span className="text-[12px] font-black text-orange-500 uppercase">{totals.actualIntake} KCAL</span>
                </div>
              </div>
              <button onClick={() => setShowMyList(true)} className="flex items-center gap-1.5 bg-slate-50 text-orange-500 border border-slate-200 shadow-sm px-4 py-2 rounded-2xl font-black text-xs uppercase active:scale-95 transition-all"><ListFilter size={18} /> {t.myList}</button>
            </div>
            
            <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] block mb-4 pl-1">{t.moments[openPickerMoment || 'Ontbijt'].toUpperCase()}</label>
                <div className="relative group">
                  <select 
                    className="w-full bg-white px-6 py-4.5 rounded-[22px] font-black border-2 border-orange-400/30 text-[14px] shadow-sm outline-none appearance-none cursor-pointer text-slate-800 transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-100 group-hover:border-orange-400 uppercase tracking-widest"
                    onChange={(e) => {
                      setOpenPickerMoment(e.target.value as MealMoment);
                      setShowProductList(true);
                    }}
                    value={openPickerMoment || ''}
                  >
                    <option value="" disabled>{t.placeholders.select}</option>
                    {MEAL_MOMENTS.map(moment => <option key={moment} value={moment}>{t.moments[moment]}</option>)}
                  </select>
                  <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none group-hover:scale-110 transition-transform" />
                </div>
              </div>

              {openPickerMoment && (
                <div className="bg-orange-50/40 rounded-[30px] p-6 shadow-sm border border-orange-100 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <button 
                        onClick={() => { setSearchTerm(''); setShowProductList(!showProductList); }} 
                        className={`w-full bg-white border-2 rounded-[22px] px-6 py-4 text-[14px] font-bold shadow-sm flex items-center justify-between min-h-[68px] transition-all ${mealInputs[openPickerMoment]?.mealId ? 'border-orange-500 ring-4 ring-orange-50 bg-orange-50/20' : 'border-orange-200/50 hover:border-orange-400'}`}
                      >
                        {mealInputs[openPickerMoment]?.mealId ? (
                          <div className="text-left leading-tight truncate">
                            <div className="font-black text-slate-800 text-[14px] mb-1 uppercase tracking-tight flex items-center gap-2">
                              {getTranslatedName(mealInputs[openPickerMoment].mealId, '')}
                              <Check size={16} className="text-emerald-500" />
                            </div>
                            <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{t.consumed.toLowerCase()}</div>
                          </div>
                        ) : <span className="text-slate-300 font-black uppercase tracking-widest text-[11px]">{t.searchPlaceholder}</span>}
                        <Search size={20} className={`text-orange-500 transition-all ${showProductList ? 'scale-125' : ''}`} />
                      </button>

                      {showProductList && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-orange-100 rounded-[26px] shadow-2xl overflow-hidden flex flex-col max-h-[350px] custom-scrollbar z-50 animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                            <Search size={20} className="text-orange-400" />
                            <input 
                              autoFocus 
                              className="bg-transparent border-none text-[15px] w-full focus:ring-0 font-black uppercase placeholder:text-slate-300" 
                              placeholder={t.searchPlaceholder}
                              value={searchTerm} 
                              onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                          </div>
                          <div className="overflow-y-auto py-2">
                            {(state.customOptions[openPickerMoment] || []).filter(o => getTranslatedName(o.id, o.name).toLowerCase().includes(searchTerm.toLowerCase())).map(opt => (
                              <button 
                                key={opt.id} 
                                onClick={() => { 
                                  setMealInputs({ ...mealInputs, [openPickerMoment]: { mealId: opt.id, qty: 1 } }); 
                                  setShowProductList(false);
                                }} 
                                className="w-full text-left px-7 py-5 hover:bg-orange-50 transition-colors border-b border-slate-50 flex flex-col"
                              >
                                <span className="text-[15px] font-black text-slate-800 truncate mb-1 uppercase tracking-tight">{getTranslatedName(opt.id, opt.name)}</span>
                                <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">{opt.unitName || '1 PORTIE'} • {opt.kcal} KCAL</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!showProductList && mealInputs[openPickerMoment]?.mealId && (
                      <div className="flex gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex-grow">
                          <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 block ml-2">{t.qtyLabel}</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="w-full bg-white border-2 border-orange-200/50 rounded-[22px] p-4 text-[18px] font-black text-center h-[60px] focus:border-orange-500 outline-none shadow-sm" 
                            value={mealInputs[openPickerMoment]?.qty || 1} 
                            onChange={(e) => setMealInputs({ ...mealInputs, [openPickerMoment]: { ...mealInputs[openPickerMoment], qty: Number(e.target.value) } })} 
                          />
                        </div>
                        <button 
                          className="bg-orange-500 text-white rounded-[22px] h-[60px] w-full flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-orange-200" 
                          onClick={() => {
                            const currentInput = mealInputs[openPickerMoment];
                            const opt = (state.customOptions[openPickerMoment] || []).find(o => o.id === currentInput?.mealId);
                            if (opt && currentInput) addMealItem(openPickerMoment, { name: opt.name, kcal: opt.kcal * currentInput.qty, quantity: currentInput.qty, mealId: opt.id, isDrink: opt.isDrink });
                            setMealInputs({ ...mealInputs, [openPickerMoment]: { mealId: '', qty: 1 } });
                            setOpenPickerMoment(null);
                          }}
                        >
                          <Plus size={24} strokeWidth={3} />
                          <span className="font-black uppercase text-[12px] tracking-widest">{t.consumed}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {groupedLoggedMeals.map(category => (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center gap-3 px-2 border-l-4 border-orange-500">
                    <h3 className="font-black text-slate-800 text-[14px] uppercase tracking-widest">{category.label}</h3>
                  </div>
                  <div className="space-y-2">
                    {category.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in duration-300">
                        <div className="flex items-center gap-3 flex-grow min-w-0 pr-3">
                          <div className="bg-orange-50 p-2 rounded-xl text-orange-500 shrink-0">
                            {item.isDrink ? <GlassWater size={18} /> : <Utensils size={18} />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[14px] font-black text-slate-800 truncate uppercase tracking-tight">{getTranslatedName(item.mealId || '', item.name)}</span>
                            <span className="text-[11px] font-bold uppercase tracking-tight text-orange-500 mt-0.5">{item.quantity}x {item.kcal.toFixed(0)} KCAL</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const momentKeys = Object.keys(currentLog.meals) as MealMoment[];
                            for (const mk of momentKeys) {
                              if (currentLog.meals[mk].find(m => m.id === item.id)) {
                                setState(prev => {
                                  const logs = { ...prev.dailyLogs };
                                  logs[selectedDate].meals[mk] = logs[selectedDate].meals[mk].filter(m => m.id !== item.id);
                                  return { ...prev, dailyLogs: logs };
                                });
                                break;
                              }
                            }
                          }} 
                          className="text-slate-200 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4 pb-12 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{t.movement}</h2>
            </div>
            <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 shadow-sm space-y-4">
              <select value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)} className="w-full bg-white p-4 rounded-2xl font-black border border-slate-100 text-[15px] shadow-sm outline-none appearance-none cursor-pointer">
                {state.customActivities.map(act => (<option key={act.id} value={act.id}>{getTranslatedName(act.id, act.name)}</option>))}
              </select>
              <div className="flex gap-4">
                <input id="act-val" type="number" placeholder={t.amount} className="flex-grow bg-white p-4 rounded-2xl font-black border border-slate-100 text-[15px] shadow-sm outline-none" />
                <button onClick={() => { const val = (document.getElementById('act-val') as HTMLInputElement).value; if (val) addActivity(selectedActivityId, Number(val)); }} className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all"><Plus size={28} strokeWidth={3} /></button>
              </div>
            </div>
            <div className="space-y-3 pr-1 overscroll-contain">
              {currentLog.activities.map(act => {
                const type = state.customActivities.find(t => t.id === act.typeId);
                return (
                  <div key={act.id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex justify-between items-center mb-1">
                    <div className="flex flex-col">
                      <span className="text-[15px] font-black text-slate-800 leading-tight uppercase tracking-tight">{getTranslatedName(act.typeId, type?.name || '')}</span>
                      <span className="text-[12px] font-bold uppercase tracking-tight text-slate-400 mt-1">{act.value} {t.amount} • <span className="text-emerald-500 font-black">+{Math.round(act.burnedKcal)} KCAL</span></span>
                    </div>
                    <button onClick={() => setState(prev => { const logs = { ...prev.dailyLogs }; logs[selectedDate].activities = logs[selectedDate].activities.filter(a => a.id !== act.id); return { ...prev, dailyLogs: logs }; })} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300 pb-12 w-full block">
             <section className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{t.gender}</label>
                  <button 
                    onClick={() => setShowInfo(true)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-full text-orange-500 shadow-sm active:scale-90 transition-all hover:bg-orange-50"
                  >
                    <Info size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setState(prev => ({ ...prev, profile: { ...prev.profile, gender: 'man' } }))} className={`py-4 rounded-2xl font-black text-[14px] uppercase border transition-all ${state.profile.gender === 'man' ? 'bg-white text-orange-500 border-orange-200 shadow-md ring-1 ring-orange-100' : 'bg-slate-50 text-slate-300 border-transparent'}`}>{t.man}</button>
                  <button onClick={() => setState(prev => ({ ...prev, profile: { ...prev.profile, gender: 'woman' } }))} className={`py-4 rounded-2xl font-black text-[14px] uppercase border transition-all ${state.profile.gender === 'woman' ? 'bg-white text-orange-500 border-orange-200 shadow-md ring-1 ring-orange-100' : 'bg-slate-50 text-slate-300 border-transparent'}`}>{t.woman}</button>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest block">{t.age}</label>
                    <div className="relative">
                      <select value={state.profile.birthYear} onChange={(e) => setState(prev => ({ ...prev, profile: { ...prev.profile, birthYear: Number(e.target.value) } }))} className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl font-black text-[16px] outline-none appearance-none cursor-pointer">{birthYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest block">{t.height}</label>
                    <input type="number" value={state.profile.height} onChange={(e) => setState(prev => ({ ...prev, profile: { ...prev.profile, height: Number(e.target.value) } }))} className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl font-black text-[16px] outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest block">{t.startWeight}</label>
                    <input type="number" value={state.profile.startWeight} onChange={(e) => setState(prev => ({ ...prev, profile: { ...prev.profile, startWeight: Number(e.target.value) } }))} className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl font-black text-[16px] outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest block">{t.targetWeight}</label>
                    <input type="number" value={state.profile.targetWeight} onChange={(e) => setState(prev => ({ ...prev, profile: { ...prev.profile, targetWeight: Number(e.target.value) } }))} className="w-full bg-orange-50 border border-orange-100 py-4 px-5 rounded-2xl font-black text-[16px] outline-none text-orange-500 shadow-sm" />
                  </div>
                </div>
             </section>

             <section className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest block">{t.activityLevelLabel}</label>
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none mb-2">{t.activityLevelDesc}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', icon: Laptop, label: t.levelLight },
                    { id: 'moderate', icon: Briefcase, label: t.levelModerate },
                    { id: 'heavy', icon: Hammer, label: t.levelHeavy }
                  ].map(lvl => (
                    <button 
                      key={lvl.id}
                      onClick={() => setState(prev => ({ ...prev, profile: { ...prev.profile, activityLevel: lvl.id as any } }))}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${state.profile.activityLevel === lvl.id ? 'bg-white border-orange-500 ring-2 ring-orange-50 shadow-md' : 'bg-slate-50 border-transparent grayscale'}`}
                    >
                      <lvl.icon size={20} className={state.profile.activityLevel === lvl.id ? 'text-orange-500' : 'text-slate-300'} />
                      <span className={`text-[9px] font-black uppercase mt-2 tracking-tighter ${state.profile.activityLevel === lvl.id ? 'text-slate-800' : 'text-slate-300'}`}>{lvl.label}</span>
                    </button>
                  ))}
                </div>
             </section>

             <section className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm space-y-4">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none text-center mb-1">{t.chooseSpeed}</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'slow', icon: Turtle, label: t.speedSlow },
                    { id: 'average', icon: Footprints, label: t.speedAverage },
                    { id: 'fast', icon: Flame, label: t.speedFast },
                    { id: 'custom', icon: Settings, label: t.speedCustom }
                  ].map(sp => (
                    <button 
                      key={sp.id}
                      onClick={() => setState(prev => ({ ...prev, profile: { ...prev.profile, weightLossSpeed: sp.id as any } }))}
                      className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all ${state.profile.weightLossSpeed === sp.id ? 'bg-white border-orange-500 ring-1 ring-orange-50 shadow-sm' : 'bg-slate-50 border-transparent grayscale opacity-60'}`}
                    >
                      <sp.icon size={14} className={state.profile.weightLossSpeed === sp.id ? 'text-orange-500' : 'text-slate-300'} />
                      <span className={`text-[7px] font-black uppercase mt-1 tracking-tight text-center leading-tight ${state.profile.weightLossSpeed === sp.id ? 'text-slate-800' : 'text-slate-300'}`}>{sp.label}</span>
                    </button>
                  ))}
                </div>
             </section>

             <section className="bg-orange-50 border border-orange-200 rounded-[32px] p-6 flex flex-col gap-4 shadow-sm relative">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-orange-400 uppercase tracking-[0.2em] leading-none mb-1">{t.dailyBudgetLabel}</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-orange-600 tabular-nums">{state.profile.dailyBudget}</span>
                      <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">KCAL</span>
                    </div>
                  </div>
                  <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-100">
                    <Zap size={20} fill="currentColor" />
                  </div>
                </div>

                <div className="h-px w-full bg-orange-200/50" />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-[11px] font-black text-orange-400 uppercase tracking-widest leading-none mb-1">STREEFDATUM</span>
                     {state.profile.weightLossSpeed === 'custom' ? (
                       <div className="relative w-full max-w-[150px]">
                         <input 
                           type="date" 
                           value={state.profile.customTargetDate || ''} 
                           onChange={(e) => setState(prev => ({ ...prev, profile: { ...prev.profile, customTargetDate: e.target.value } }))} 
                           className="w-full bg-white border-2 border-orange-300 py-1.5 px-3 rounded-xl font-black text-[12px] text-orange-600 focus:ring-0 focus:border-orange-500 outline-none appearance-none"
                         />
                         <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none" />
                       </div>
                     ) : (
                       <span className="text-xl font-black text-orange-600 tracking-tight">{formatTargetDateDisplay(totals.targetDate)}</span>
                     )}
                  </div>
                  <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-100">
                    <Calendar size={20} />
                  </div>
                </div>
             </section>

             <section className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-2"><Database size={16} className="text-slate-400" /> {t.dataManagement.title}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleExportData} className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 font-black text-[11px] uppercase hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
                    <FileDown size={16} /> {t.dataManagement.export}
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 font-black text-[11px] uppercase hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
                    <FileUp size={16} /> {t.dataManagement.restore}
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleRestoreData} 
                  accept=".json" 
                  className="hidden" 
                />
                <button onClick={resetAllData} className="w-full py-3.5 rounded-2xl border border-red-100 text-red-300 font-black text-[11px] uppercase hover:bg-red-50 transition-all active:scale-95 mt-2">
                  <Trash2 size={16} className="inline mr-1" /> {t.dataManagement.clearAll}
                </button>
             </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-5 flex justify-between items-center max-w-md mx-auto z-40 rounded-t-[32px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom,20px)]">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: t.tabs.dashboard }, 
          { id: 'meals', icon: Utensils, label: t.tabs.meals }, 
          { id: 'activity', icon: Activity, label: t.tabs.activity }, 
          { id: 'profile', icon: UserIcon, label: t.tabs.profile }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-2 transition-all group ${activeTab === tab.id ? 'text-orange-500 scale-105' : 'text-slate-300'}`}>
            <tab.icon size={26} strokeWidth={activeTab === tab.id ? 3 : 2} className="group-active:scale-90 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-center">{tab.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
    </div>
  );
}
