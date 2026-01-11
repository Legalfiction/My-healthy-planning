
export interface UserProfile {
  age: number;
  height: number;
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
}

export type MealMoment = 'Ontbijt' | 'Tussendoor 1' | 'Lunch' | 'Tussendoor 2' | 'Diner' | 'Avondsnack';

export interface MealOption {
  id: string;
  name: string;
  kcal: number;
  isUnitBased?: boolean;
  unitName?: string;
  isCustom?: boolean; // Flag to identify user-created options
}

export interface LoggedMealItem {
  id: string;
  mealId?: string;
  name: string;
  kcal: number;
  quantity: number;
}

export interface ActivityType {
  id: string;
  name: string;
  met: number;
  unit: 'minuten' | 'km';
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
  weight?: number; // Optional daily weight entry
}

export interface AppState {
  profile: UserProfile;
  dailyLogs: Record<string, DailyLog>;
  customOptions: Record<string, MealOption[]>; // Persistent custom dropdown items
}
