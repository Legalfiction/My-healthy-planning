
export type Language = 'nl' | 'en' | 'es' | 'de' | 'pt' | 'zh' | 'ja' | 'ko' | 'hi' | 'ar';

export type WeightLossSpeed = 'slow' | 'average' | 'fast' | 'custom';

export type ActivityLevel = 'light' | 'moderate' | 'heavy';

export interface UserProfile {
  gender: 'man' | 'woman';
  birthYear: number;
  height: number;
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  dailyBudget: number;
  customTargetDate?: string;
  weightLossSpeed?: WeightLossSpeed;
  activityLevel?: ActivityLevel;
  age?: number; // Legacy support
}

export type MealMoment = 'Ontbijt' | 'Ochtend Snack' | 'Lunch' | 'Middag Snack' | 'Diner' | 'Avond Snack';

export interface MealOption {
  id: string;
  name: string;
  kcal: number;
  isUnitBased?: boolean;
  unitName?: string;
  isCustom?: boolean;
  isDrink?: boolean;
  isAlcohol?: boolean;
  categories?: string[];
}

export interface LoggedMealItem {
  id: string;
  mealId?: string;
  name: string;
  kcal: number;
  quantity: number;
  isDrink?: boolean;
  isAlcohol?: boolean;
}

export interface ActivityType {
  id: string;
  name: string;
  met: number;
  unit: 'minuten' | 'km';
  isCustom?: boolean;
}

export interface LoggedActivity {
  id: string;
  typeId: string;
  value: number;
  burnedKcal: number;
}

export interface DailyLog {
  date: string;
  meals: Record<string, LoggedMealItem[]>;
  activities: LoggedActivity[];
  weight?: number;
}

export interface AppState {
  profile: UserProfile;
  dailyLogs: Record<string, DailyLog>;
  customOptions: Record<string, MealOption[]>;
  customActivities: ActivityType[];
  language: Language;
}