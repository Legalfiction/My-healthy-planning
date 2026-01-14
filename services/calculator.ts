
import { UserProfile, LoggedActivity, ActivityType } from '../types';
import { ACTIVITY_TYPES, KCAL_PER_KG_FAT } from '../constants';

export const calculateBMR = (profile: UserProfile): number => {
  const weight = Number(profile.currentWeight) || 0;
  const height = Number(profile.height) || 0;
  const age = Number(profile.age) || 0;
  // Mifflin-St Jeor Equation for men: (10 * weight) + (6.25 * height) - (5 * age) + 5
  if (weight === 0 || height === 0 || age === 0) return 1500;
  return (10 * weight) + (6.25 * height) - (5 * age) + 5;
};

export const calculateTDEE = (profile: UserProfile, loggedActivitiesBurn: number): number => {
  const bmr = calculateBMR(profile);
  // PAL 1.375 for "Lightly Active" (standard desk job + some movement)
  const baselineMaintenance = bmr * 1.375;
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
  
  const maintenance = calculateTDEE(profile, 0);
  const dailyDeficit = maintenance - dailyIntakeGoal;
  
  // Minimal deficit of 50 to prevent infinite loops
  const effectiveDeficit = dailyDeficit > 50 ? dailyDeficit : 250;

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

  const targetDate = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 1500;

  const weightToLose = currentW - targetW;
  const totalKcalDeficitNeeded = weightToLose * KCAL_PER_KG_FAT;
  const dailyDeficitNeeded = totalKcalDeficitNeeded / diffDays;

  const maintenance = calculateTDEE(profile, 0);
  const budget = Math.round(maintenance - dailyDeficitNeeded);

  // Safety caps
  return Math.min(Math.max(budget, 1200), 4000);
};
