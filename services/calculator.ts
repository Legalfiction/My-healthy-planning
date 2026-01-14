
import { UserProfile, LoggedActivity, ActivityType } from '../types';
import { ACTIVITY_TYPES, KCAL_PER_KG_FAT } from '../constants';

export const calculateBMR = (profile: UserProfile): number => {
  const { currentWeight, height, age } = profile;
  return (10 * currentWeight) + (6.25 * height) - (5 * age) + 5;
};

export const calculateTDEE = (profile: UserProfile, loggedActivitiesBurn: number): number => {
  const bmr = calculateBMR(profile);
  // PAL 1.375 is standard for "Lightly Active"
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
  const minutes = activity.value;
  return Math.round(type.met * weight * (minutes / 60));
};

/**
 * Returns a suggested target date in YYYY-MM-DD format
 */
export const calculateTargetDate = (profile: UserProfile, dailyIntakeGoal: number): string => {
  const currentWeight = Number(profile.currentWeight);
  const targetWeight = Number(profile.targetWeight);
  
  if (currentWeight <= targetWeight) {
    return new Date().toISOString().split('T')[0];
  }
  
  const weightToLose = currentWeight - targetWeight;
  const totalKcalRemaining = weightToLose * KCAL_PER_KG_FAT;
  
  const tdee = calculateTDEE(profile, 0);
  const deficit = tdee - dailyIntakeGoal;
  
  // Minimal safety deficit of 100 to avoid infinite time
  const effectiveDeficit = Math.max(deficit, 100);

  const daysNeeded = Math.ceil(totalKcalRemaining / effectiveDeficit);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysNeeded);

  return targetDate.toISOString().split('T')[0];
};

export const calculateProgressPercentage = (profile: UserProfile): number => {
  const totalToLose = profile.startWeight - profile.targetWeight;
  if (totalToLose <= 0) return 100;
  
  const currentLost = profile.startWeight - profile.currentWeight;
  const percentage = (currentLost / totalToLose) * 100;
  
  return Math.min(Math.max(percentage, 0), 100);
};
