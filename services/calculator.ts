
import { UserProfile, LoggedActivity, ActivityType } from '../types';
import { ACTIVITY_TYPES, DAILY_KCAL_INTAKE_GOAL, KCAL_PER_KG_FAT } from '../constants';

/**
 * Mifflin-St Jeor Equation for Men
 * More accurate for modern metabolic rates.
 */
export const calculateBMR = (profile: UserProfile): number => {
  const { currentWeight, height, age } = profile;
  // BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
  return (10 * currentWeight) + (6.25 * height) - (5 * age) + 5;
};

/**
 * Calculates TDEE (Total Daily Energy Expenditure)
 * Includes a baseline PAL (Physical Activity Level) for "Lightly Active"
 * plus manually logged activities.
 */
export const calculateTDEE = (profile: UserProfile, loggedActivitiesBurn: number): number => {
  const bmr = calculateBMR(profile);
  // PAL 1.375 is standard for "Lightly Active" (walking, moving around)
  // This matches user's observation of ~2600-2800 maintenance for his build.
  const baselineMaintenance = bmr * 1.375;
  return baselineMaintenance + loggedActivitiesBurn;
};

export const calculateActivityBurn = (activity: { typeId: string; value: number }, weight: number): number => {
  const type = ACTIVITY_TYPES.find(t => t.id === activity.typeId);
  if (!type) return 0;

  let minutes = activity.value;
  if (type.unit === 'km') {
    // Assume average walking speed of 5 km/h -> 12 minutes per km
    minutes = activity.value * 12;
  }

  // kcal = MET * weight_kg * (minutes / 60)
  return Math.round(type.met * weight * (minutes / 60));
};

export const calculateTargetDate = (profile: UserProfile, currentDayDeficit: number): string | null => {
  if (profile.currentWeight <= profile.targetWeight) return "Doel bereikt!";
  
  const weightToLose = profile.currentWeight - profile.targetWeight;
  const totalKcalRemaining = weightToLose * KCAL_PER_KG_FAT;
  
  // Minimal deficit to prevent infinite loops or division by zero
  if (currentDayDeficit <= 100) return "Projectie niet mogelijk (tekort te klein)";

  const daysNeeded = Math.ceil(totalKcalRemaining / currentDayDeficit);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysNeeded);

  return targetDate.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const calculateProgressPercentage = (profile: UserProfile): number => {
  const totalToLose = profile.startWeight - profile.targetWeight;
  if (totalToLose <= 0) return 100;
  
  const currentLost = profile.startWeight - profile.currentWeight;
  const percentage = (currentLost / totalToLose) * 100;
  
  return Math.min(Math.max(percentage, 0), 100);
};
