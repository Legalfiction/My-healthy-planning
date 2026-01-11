
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
  Share2
} from 'lucide-react';
import { 
  UserProfile, 
  DailyLog, 
  AppState, 
  MealMoment, 
  LoggedMealItem
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
  calculateTargetDate, 
  calculateProgressPercentage 
} from './services/calculator';

const STORAGE_KEY = 'mijn_gezonde_planning_v4';

const DEFAULT_PROFILE: UserProfile = {
  age: 55,
  height: 194,
  startWeight: 92,
  currentWeight: 92,
  targetWeight: 80
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'activity' | 'profile'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAddingCustom, setIsAddingCustom] = useState<MealMoment | null>(null);
  
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.customOptions) parsed.customOptions = {};
      return parsed;
    }
    return {
      profile: DEFAULT_PROFILE,
      dailyLogs: {},
      customOptions: {}
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentLog: DailyLog = useMemo(() => {
    return state.dailyLogs[selectedDate] || {
      date: selectedDate,
      meals: {},
      activities: []
    };
  }, [state.dailyLogs, selectedDate]);

  const addMealItem = (moment: MealMoment, item: Omit<LoggedMealItem, 'id'>, saveToOptions = false) => {
    setState(prev => {
      const newItemId = Math.random().toString(36).substr(2, 9);
      const newItem: LoggedMealItem = { ...item, id: newItemId };

      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] };
      const meals = { ...log.meals };
      meals[moment] = [...(meals[moment] || []), newItem];
      logs[selectedDate] = { ...log, meals };

      const customOptions = { ...prev.customOptions };
      if (saveToOptions) {
        const momentOpts = customOptions[moment] || [];
        if (!momentOpts.some(o => o.name.toLowerCase() === item.name.toLowerCase())) {
          customOptions[moment] = [
            { id: 'c_' + newItemId, name: item.name, kcal: item.kcal, isCustom: true },
            ...momentOpts
          ];
        }
      }

      return { ...prev, dailyLogs: logs, customOptions };
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
    const burn = calculateActivityBurn({ typeId, value }, state.profile.currentWeight);
    setState(prev => {
      const logs = { ...prev.dailyLogs };
      const log = logs[selectedDate] || { date: selectedDate, meals: {}, activities: [] };
      logs[selectedDate] = {
        ...log,
        activities: [...log.activities, { id: Math.random().toString(36).substr(2, 9), typeId, value, burnedKcal: burn }]
      };
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

  const updateProfile = (updates: Partial<UserProfile>) => {
    setState(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates }
    }));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mijn Gezonde Planning',
          text: 'Check deze handige gezondheidsplanner app!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      alert(`Kopieer deze link om te delen: ${window.location.href}`);
    }
  };

  const totals = useMemo(() => {
    const activityBurn = currentLog.activities.reduce((sum, a) => sum + a.burnedKcal, 0);
    const tdee = calculateTDEE(state.profile, activityBurn);
    const intakeGoal = DAILY_KCAL_INTAKE_GOAL + activityBurn;
    const actualIntake = Object.values(currentLog.meals).flat().reduce((sum, m) => sum + m.kcal, 0);
    const remaining = intakeGoal - actualIntake;
    const progress = calculateProgressPercentage(state.profile);
    const targetDate = calculateTargetDate(state.profile, tdee - intakeGoal);

    return { activityBurn, tdee, intakeGoal, actualIntake, remaining, progress, targetDate };
  }, [state.profile, currentLog]);

  return (
    <div className="max-w-md mx-auto min-h-screen pb-20 bg-slate-50 flex flex-col shadow-2xl relative">
      <header className="bg-white border-b sticky top-0 z-30 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold text-indigo-700">Mijn Gezonde Planning</h1>
          <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
            {state.profile.currentWeight}kg → {state.profile.targetWeight}kg
          </div>
        </div>
        <div className="flex items-center justify-between bg-slate-100 rounded-2xl p-2">
          <button onClick={() => {
            const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]);
          }} className="p-2 hover:bg-white rounded-xl transition-all">
            <ChevronLeft size={20}/>
          </button>
          <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
            <CalendarIcon size={16} className="text-indigo-500" />
            {new Date(selectedDate).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
          <button onClick={() => {
            const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]);
          }} className="p-2 hover:bg-white rounded-xl transition-all">
            <ChevronRight size={20}/>
          </button>
        </div>
      </header>

      <main className="p-4 flex-grow space-y-6 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl">
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Verwachte streefdatum</p>
              <h2 className="text-3xl font-black mb-4">{totals.targetDate || 'Berekenen...'}</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                  <p className="text-[10px] text-indigo-100 font-bold uppercase">Verbranding</p>
                  <p className="text-lg font-black">{Math.round(totals.tdee)} <span className="text-[10px]">kcal</span></p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                  <p className="text-[10px] text-indigo-100 font-bold uppercase">Dagtekort</p>
                  <p className="text-lg font-black text-green-300">-{Math.round(Math.max(0, totals.tdee - totals.intakeGoal))} <span className="text-[10px]">kcal</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Utensils size={18} className="text-orange-500" /> Dagbudget
                </h3>
                <span className={`text-xl font-black ${totals.actualIntake > totals.intakeGoal ? 'text-red-500' : 'text-slate-900'}`}>
                  {totals.actualIntake} <span className="text-xs text-slate-400 font-bold">/ {Math.round(totals.intakeGoal)}</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-1 mb-2">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${totals.actualIntake > totals.intakeGoal ? 'bg-red-400' : 'bg-orange-400'}`}
                  style={{ width: `${Math.min((totals.actualIntake / totals.intakeGoal) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Inname</span>
                <span className={totals.remaining < 0 ? 'text-red-500' : 'text-indigo-600'}>
                  {totals.remaining < 0 ? 'Budget Overschreden' : `Nog ${Math.round(totals.remaining)} kcal`}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
               <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Totaal Voortgang</span>
                  <span className="text-sm font-black text-indigo-600">{Math.round(totals.progress)}%</span>
               </div>
               <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${totals.progress}%` }} />
               </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-4 pb-10 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-slate-800 italic">Mijn Eetschema</h2>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Vandaag</p>
                <p className="text-lg font-black text-indigo-600">{totals.actualIntake} kcal</p>
              </div>
            </div>

            {MEAL_MOMENTS.map(moment => {
              const items = currentLog.meals[moment] || [];
              const custom = state.customOptions[moment] || [];
              const standard = MEAL_OPTIONS[moment] || [];
              
              return (
                <div key={moment} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-indigo-700 italic tracking-tight">{moment}</h3>
                    <button 
                      onClick={() => setIsAddingCustom(moment)}
                      className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Plus size={12} /> Nieuw
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {items.length > 0 ? items.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 group">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-800">{item.name}</span>
                           <span className="text-[10px] font-bold text-indigo-400 uppercase">Aantal: {item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-orange-600">{item.kcal} <span className="text-[10px]">kcal</span></span>
                          <button onClick={() => removeMealItem(moment, item.id)} className="text-slate-200 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="py-4 text-center border border-dashed border-slate-200 rounded-2xl">
                         <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Leeg</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr,60px,50px] gap-2 items-end">
                    <div className="relative">
                      <select 
                        id={`sel-${moment}`}
                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 appearance-none"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const opt = [...standard, ...custom].find(o => o.id === val);
                          const qtyInput = document.getElementById(`q-${moment}`) as HTMLInputElement;
                          const qty = Number(qtyInput.value) || 1;
                          if (opt) addMealItem(moment, { name: opt.name, kcal: opt.kcal * qty, quantity: qty, mealId: opt.id });
                          e.target.value = '';
                        }}
                      >
                        <option value="">+ Kies optie...</option>
                        {custom.length > 0 && (
                          <optgroup label="⭐ Jouw toevoegingen">
                            {custom.map(o => <option key={o.id} value={o.id}>{o.name} ({o.kcal} kcal)</option>)}
                          </optgroup>
                        )}
                        <optgroup label="Standaard lijst">
                          {standard.map(o => <option key={o.id} value={o.id}>{o.name} ({o.kcal} kcal)</option>)}
                        </optgroup>
                      </select>
                    </div>
                    <input id={`q-${moment}`} type="number" defaultValue="1" min="1" className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-black text-center text-slate-700" />
                    <button 
                      onClick={() => {
                        const s = document.getElementById(`sel-${moment}`) as HTMLSelectElement;
                        s.dispatchEvent(new Event('change', { bubbles: true }));
                      }}
                      className="bg-indigo-600 text-white h-11 flex items-center justify-center rounded-xl shadow-md active:scale-95 transition-transform"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              );
            })}

            {isAddingCustom && (
              <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-90 duration-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><Bookmark size={24} /></div>
                    <h3 className="text-xl font-black text-slate-800 italic">{isAddingCustom}</h3>
                  </div>
                  <form className="space-y-5" onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const name = fd.get('name') as string;
                    const kcal = Number(fd.get('kcal'));
                    if (name && !isNaN(kcal)) {
                      addMealItem(isAddingCustom, { name, kcal, quantity: 1 }, true);
                      setIsAddingCustom(null);
                    }
                  }}>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Naam maaltijd</label>
                      <input name="name" type="text" placeholder="bijv. Pannenkoek" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner" required autoFocus />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kcal per stuk</label>
                      <input name="kcal" type="number" placeholder="0" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-orange-600 shadow-inner" required />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setIsAddingCustom(null)} className="flex-1 py-4 font-black text-slate-400 bg-slate-100 rounded-2xl">Annuleer</button>
                      <button type="submit" className="flex-1 py-4 font-black text-white bg-indigo-600 rounded-2xl shadow-lg">Voeg toe</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-black text-slate-800 italic px-1">Beweging</h2>
            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Log je activiteit</h3>
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const tid = fd.get('tid') as string;
                const val = Number(fd.get('val'));
                if (tid && val > 0) { addActivity(tid, val); (e.target as HTMLFormElement).reset(); }
              }}>
                <select name="tid" className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm font-bold text-white focus:ring-0">
                  {ACTIVITY_TYPES.map(t => <option key={t.id} value={t.id} className="text-slate-800">{t.name}</option>)}
                </select>
                <input name="val" type="number" step="0.1" placeholder="Duur of afstand..." className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm font-bold text-white placeholder:text-indigo-200" required />
                <button type="submit" className="w-full bg-white text-indigo-700 font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase text-xs tracking-widest">Toevoegen</button>
              </form>
            </div>

            <div className="space-y-3">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vandaag gedaan</h4>
               {currentLog.activities.map(a => {
                 const t = ACTIVITY_TYPES.find(x => x.id === a.typeId);
                 return (
                   <div key={a.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex justify-between items-center shadow-sm">
                     <div>
                       <p className="font-bold text-slate-800">{t?.name}</p>
                       <p className="text-xs text-slate-500">{a.value} {t?.unit} • <span className="text-green-600 font-black">+{a.burnedKcal} kcal</span></p>
                     </div>
                     <button onClick={() => removeActivity(a.id)} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-black text-slate-800 italic px-1">Instellingen</h2>
            
            <button 
              onClick={handleShare}
              className="w-full bg-indigo-600 text-white rounded-3xl p-6 flex items-center justify-between shadow-lg active:scale-95 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><Share2 size={24} /></div>
                <div className="text-left">
                  <p className="text-sm font-black italic">App Delen</p>
                  <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider">Stuur de link naar anderen</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-white/50 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Leeftijd</label>
                  <input type="number" value={state.profile.age} onChange={e => updateProfile({age: Number(e.target.value)})} className="w-full bg-slate-50 p-3 rounded-xl font-bold border-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Lengte (cm)</label>
                  <input type="number" value={state.profile.height} onChange={e => updateProfile({height: Number(e.target.value)})} className="w-full bg-slate-50 p-3 rounded-xl font-bold border-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Huidig (kg)</label>
                  <input type="number" step="0.1" value={state.profile.currentWeight} onChange={e => updateProfile({currentWeight: Number(e.target.value)})} className="w-full bg-indigo-50 p-3 rounded-xl font-black text-indigo-700 border-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Doel (kg)</label>
                  <input type="number" value={state.profile.targetWeight} onChange={e => updateProfile({targetWeight: Number(e.target.value)})} className="w-full bg-slate-50 p-3 rounded-xl font-bold border-none" />
                </div>
              </div>
            </div>
            <button 
              onClick={() => { if(confirm('Alles wissen?')) { localStorage.clear(); window.location.reload(); } }}
              className="w-full py-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]"
            >
              Reset App Gegevens
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 px-6 py-3 flex justify-between items-center max-w-md mx-auto z-40">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Plan' },
          { id: 'meals', icon: Utensils, label: 'Eten' },
          { id: 'activity', icon: Activity, label: 'Beweeg' },
          { id: 'profile', icon: UserIcon, label: 'Ik' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}
          >
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
