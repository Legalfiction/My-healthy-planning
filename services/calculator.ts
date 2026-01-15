
import { UserProfile, LoggedActivity, ActivityType } from '../types';
import { ACTIVITY_TYPES, KCAL_PER_KG_FAT } from '../constants';

const PAL_VALUES: Record<string, number> = {
  light: 1.3,
  moderate: 1.55,
  heavy: 1.725
};

export const calculateBMR = (profile: UserProfile, weightOverride?: number): number => {
  const weight = weightOverride !== undefined ? weightOverride : (Number(profile.currentWeight) || 0);
  const height = Number(profile.height) || 0;
  const currentYear = new Date().getFullYear();
  const age = profile.birthYear ? (currentYear - profile.birthYear) : (profile.age || 40);
  
  if (weight === 0 || height === 0) return 1500;

  // Mifflin-St Jeor Equation
  const base = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (profile.gender === 'woman') {
    return base - 161;
  }
  return base + 5;
};

export const calculateTDEE = (profile: UserProfile, loggedActivitiesBurn: number, weightOverride?: number): number => {
  const bmr = calculateBMR(profile, weightOverride);
  const pal = PAL_VALUES[profile.activityLevel || 'light'] || 1.3;
  const baselineMaintenance = bmr * pal;
  return baselineMaintenance + loggedActivitiesBurn;
};

export const calculateBMI = (weight: number, heightCm: number): number => {
  if (!weight || !heightCm) return 0;
  const heightM = heightCm / 100;
  return Number((weight / (heightM * heightM)).toFixed(1));
};

export const calculateActivityBurn = (activity: { typeId: string; value: number }, weight: number): number => {
  const type = ACTIVITY_TYPES.find(t => t.id === activity.typeId);
  if (!type) return 0;
  const minutes = Number(activity.value) || 0;
  return Math.round(type.met * weight * (minutes / 60));
};

/**
 * Calculates a target date based on a weight delta and a fixed calorie budget.
 */
export const calculateTargetDate = (profile: UserProfile, dailyIntakeGoal: number): string => {
  const currentW = Number(profile.currentWeight) || 0;
  const targetW = Number(profile.targetWeight) || 0;
  
  if (currentW <= targetW || currentW === 0 || targetW === 0) {
    return new Date().toISOString().split('T')[0];
  }
  
  const weightToLose = currentW - targetW;
  const totalKcalToLose = weightToLose * KCAL_PER_KG_FAT; // 7700 kcal per kg fat
  
  const maintenance = calculateTDEE(profile, 0, currentW);
  const dailyDeficit = maintenance - dailyIntakeGoal;
  
  // Use a realistic fallback if deficit is too low
  const effectiveDeficit = dailyDeficit > 100 ? dailyDeficit : 500;

  const daysNeeded = Math.ceil(totalKcalToLose / effectiveDeficit);
  
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysNeeded);

  return targetDate.toISOString().split('T')[0];
};

/**
 * Reverse calculation: Given a date, determine the required daily budget.
 */
export const calculateBudgetFromTargetDate = (profile: UserProfile, targetDateStr: string): number => {
  const currentW = Number(profile.currentWeight) || 0;
  const targetW = Number(profile.targetWeight) || 0;
  
  if (currentW <= targetW) return 1800;

  const [year, month, day] = targetDateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return 1450; // Healthy floor for short periods

  const weightToLose = currentW - targetW;
  const totalKcalDeficitNeeded = weightToLose * KCAL_PER_KG_FAT;
  const dailyDeficitNeeded = totalKcalDeficitNeeded / diffDays;

  const maintenance = calculateTDEE(profile, 0, currentW);
  const budget = Math.round(maintenance - dailyDeficitNeeded);

  // Clamped at a realistic floor (1450) instead of 1200
  return Math.min(Math.max(budget, 1450), 3500);
};
