
import { MealOption, ActivityType, MealMoment } from './types';

export const MEAL_MOMENTS: MealMoment[] = [
  'Ontbijt',
  'Tussendoor 1',
  'Lunch',
  'Tussendoor 2',
  'Diner',
  'Avondsnack'
];

export const MEAL_OPTIONS: Record<MealMoment, MealOption[]> = {
  'Ontbijt': [
    { id: 'o1', name: 'Magere kwark (per 100g)', kcal: 55, isUnitBased: true, unitName: 'gram' },
    { id: 'o1_s', name: 'Skyr Naturel (per 100g)', kcal: 63, isUnitBased: true, unitName: 'gram' },
    { id: 'o1_g', name: 'Griekse Yoghurt 0% (per 100g)', kcal: 52, isUnitBased: true, unitName: 'gram' },
    { id: 'o2', name: 'Gekookt ei', kcal: 75, isUnitBased: true, unitName: 'stuks' },
    { id: 'o2_b', name: 'Gebakken ei (zonder vet)', kcal: 90, isUnitBased: true, unitName: 'stuks' },
    { id: 'o3', name: 'Volkoren cracker (Wasa)', kcal: 35, isUnitBased: true, unitName: 'stuks' },
    { id: 'o3_r', name: 'Roggebrood (per plak)', kcal: 90, isUnitBased: true, unitName: 'plak' },
    { id: 'o3_v', name: 'Volkoren beschuit', kcal: 40, isUnitBased: true, unitName: 'stuks' },
    { id: 'o4', name: 'Proteïne shake (per scoop)', kcal: 110, isUnitBased: true, unitName: 'scoops' },
    { id: 'o5', name: 'Havermout (per 10g droog)', kcal: 38, isUnitBased: true, unitName: 'portie' },
    { id: 'o6', name: 'Muesli suikervrij (per 10g)', kcal: 35, isUnitBased: true, unitName: 'portie' },
  ],
  'Tussendoor 1': [
    { id: 't1_1', name: 'Appel (met schil)', kcal: 80, isUnitBased: true, unitName: 'stuks' },
    { id: 't1_2', name: 'Mandarijn', kcal: 25, isUnitBased: true, unitName: 'stuks' },
    { id: 't1_3', name: 'Banaan (medium)', kcal: 105, isUnitBased: true, unitName: 'stuks' },
    { id: 't1_p', name: 'Peer', kcal: 85, isUnitBased: true, unitName: 'stuks' },
    { id: 't1_k', name: 'Kiwi', kcal: 45, isUnitBased: true, unitName: 'stuks' },
    { id: 't1_m', name: 'Meloen (schijf)', kcal: 40, isUnitBased: true, unitName: 'schijven' },
    { id: 't1_4', name: 'Handje amandelen (15g)', kcal: 90, isUnitBased: true, unitName: 'handjes' },
    { id: 't1_5', name: 'Handje walnoten (15g)', kcal: 100, isUnitBased: true, unitName: 'handjes' },
    { id: 't1_6', name: 'Rijstwafel naturel', kcal: 30, isUnitBased: true, unitName: 'stuks' },
  ],
  'Lunch': [
    { id: 'l_b1', name: 'Volkoren boterham', kcal: 85, isUnitBased: true, unitName: 'plak' },
    { id: 'l_b2', name: 'Speltbrood boterham', kcal: 90, isUnitBased: true, unitName: 'plak' },
    { id: 'l_b3', name: 'Meergranen bolletje', kcal: 150, isUnitBased: true, unitName: 'stuks' },
    { id: 'l_w1', name: 'Volkoren wrap', kcal: 160, isUnitBased: true, unitName: 'stuks' },
    { id: 'l_be1', name: 'Kipfilet beleg (plak)', kcal: 15, isUnitBased: true, unitName: 'plak' },
    { id: 'l_be2', name: 'Rookvlees (plak)', kcal: 12, isUnitBased: true, unitName: 'plak' },
    { id: 'l_be3', name: 'Hüttenkäse (per 20g)', kcal: 20, isUnitBased: true, unitName: 'lepel' },
    { id: 'l_be4', name: 'Hummus (per 15g)', kcal: 45, isUnitBased: true, unitName: 'lepel' },
    { id: 'l_be5', name: '30+ Kaas (plak)', kcal: 60, isUnitBased: true, unitName: 'plak' },
    { id: 'l_be6', name: 'Smeerkaas 20+', kcal: 30, isUnitBased: true, unitName: 'portie' },
    { id: 'l_s1', name: 'Salade met Tonijn (eigen water)', kcal: 220, isUnitBased: true, unitName: 'portie' },
    { id: 'l_s2', name: 'Salade met Kip & Ei', kcal: 250, isUnitBased: true, unitName: 'portie' },
    { id: 'l_s3', name: 'Maaltijdsalade Kikkererwt', kcal: 300, isUnitBased: true, unitName: 'portie' },
    { id: 'l_so1', name: 'Tomatensoep (kom)', kcal: 100, isUnitBased: true, unitName: 'kom' },
    { id: 'l_so2', name: 'Groentesoep helder (kom)', kcal: 60, isUnitBased: true, unitName: 'kom' },
    { id: 'l_so3', name: 'Pompoensoep (kom)', kcal: 120, isUnitBased: true, unitName: 'kom' },
    { id: 'l_so4', name: 'Linzensoep (kom)', kcal: 180, isUnitBased: true, unitName: 'kom' },
  ],
  'Tussendoor 2': [
    { id: 't2_1', name: 'Snoeptomaatjes (100g)', kcal: 30, isUnitBased: true, unitName: 'portie' },
    { id: 't2_2', name: 'Komkommer (halve)', kcal: 20, isUnitBased: true, unitName: 'portie' },
    { id: 't2_3', name: 'Paprika (reepjes)', kcal: 35, isUnitBased: true, unitName: 'stuks' },
    { id: 't2_4', name: 'Eiwitreep (klein)', kcal: 140, isUnitBased: true, unitName: 'stuks' },
    { id: 't2_5', name: 'Magere kwark (150g)', kcal: 85, isUnitBased: true, unitName: 'bakje' },
    { id: 't2_6', name: 'Gekookt ei', kcal: 75, isUnitBased: true, unitName: 'stuks' },
    { id: 't2_7', name: 'Blauwe bessen (handje)', kcal: 40, isUnitBased: true, unitName: 'handje' },
  ],
  'Diner': [
    { id: 'd1', name: 'Nasi/Bami Groenten (500g)', kcal: 160, isUnitBased: true, unitName: 'zak' },
    { id: 'd2', name: 'Italiaanse Groenten (500g)', kcal: 140, isUnitBased: true, unitName: 'zak' },
    { id: 'd3', name: 'Hollandse Groenten (500g)', kcal: 150, isUnitBased: true, unitName: 'zak' },
    { id: 'd4', name: 'Mexicaanse Groenten (500g)', kcal: 180, isUnitBased: true, unitName: 'zak' },
    { id: 'd_p1', name: 'Kipfilet blokjes (150g)', kcal: 165, isUnitBased: true, unitName: 'portie' },
    { id: 'd_p2', name: 'Kabeljauw/Witvis (150g)', kcal: 130, isUnitBased: true, unitName: 'portie' },
    { id: 'd_p3', name: 'Mager Rundergehakt (125g)', kcal: 210, isUnitBased: true, unitName: 'portie' },
    { id: 'd_p4', name: 'Biefstuk/Tartaar (125g)', kcal: 150, isUnitBased: true, unitName: 'portie' },
    { id: 'd_p5', name: 'Tofu/Tempé (150g)', kcal: 180, isUnitBased: true, unitName: 'portie' },
    { id: 'd_p6', name: 'Garnalen (150g)', kcal: 120, isUnitBased: true, unitName: 'portie' },
    { id: 'd_c1', name: 'Zilvervliesrijst (gekookt, 100g)', kcal: 125, isUnitBased: true, unitName: 'portie' },
    { id: 'd_c2', name: 'Volkoren pasta (gekookt, 100g)', kcal: 140, isUnitBased: true, unitName: 'portie' },
    { id: 'd_c3', name: 'Gekookte aardappelen (150g)', kcal: 125, isUnitBased: true, unitName: 'portie' },
    { id: 'd_c4', name: 'Quinoa/Bulgur (gekookt, 100g)', kcal: 120, isUnitBased: true, unitName: 'portie' },
    { id: 'd_spec1', name: 'Turkse Pizza (Airfryer) + Rauwkost', kcal: 450, isUnitBased: true, unitName: 'stuks' },
    { id: 'd_spec2', name: 'Courgetti met Bolognese (mager)', kcal: 350, isUnitBased: true, unitName: 'portie' },
    { id: 'd_spec3', name: 'Shakshuka (2 eieren, veel groente)', kcal: 280, isUnitBased: true, unitName: 'portie' },
  ],
  'Avondsnack': [
    { id: 'a1', name: 'Muntthee of Gemberthee', kcal: 2, isUnitBased: true, unitName: 'glas' },
    { id: 'a2', name: 'Blokje Pure Chocolade (85%)', kcal: 55, isUnitBased: true, unitName: 'blokje' },
    { id: 'a3', name: 'Bakje Skyr Naturel (150g)', kcal: 95, isUnitBased: true, unitName: 'bakje' },
    { id: 'a4', name: 'Augurk (per stuk)', kcal: 5, isUnitBased: true, unitName: 'stuks' },
    { id: 'a5', name: 'Zilveruitjes (handje)', kcal: 15, isUnitBased: true, unitName: 'portie' },
  ]
};

export const ACTIVITY_TYPES: ActivityType[] = [
  { id: 'wandelen', name: 'Wandelen (tijd in min)', met: 4.5, unit: 'minuten' },
  { id: 'wandelen_km', name: 'Wandelen (afstand in km)', met: 4.5, unit: 'km' },
  { id: 'zwemmen', name: 'Recreatief Zwemmen', met: 6.0, unit: 'minuten' },
  { id: 'padellen', name: 'Padellen', met: 8.0, unit: 'minuten' },
  { id: 'fietsen', name: 'Fietsen (15-20 km/u)', met: 6.0, unit: 'minuten' },
  { id: 'krachttraining', name: 'Krachttraining / Fitness', met: 5.0, unit: 'minuten' },
];

export const DAILY_KCAL_INTAKE_GOAL = 1800;
export const KCAL_PER_KG_FAT = 7700;
