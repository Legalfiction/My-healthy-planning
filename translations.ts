
import { Language } from './types';

const genericSteps = (l: string) => {
  const steps: Record<string, any[]> = {
    nl: [
      { 
        title: '1. De Wetenschappelijke Basis', 
        desc: 'De app fungeert als jouw persoonlijke kompas. We gebruiken de Mifflin-St Jeor formule om je BMR (Basal Metabolic Rate) te bepalen: de energie die je lichaam in totale rust verbruikt. Door dit te combineren met je gekozen Activiteitsniveau (PAL-waarde), ontstaat een nauwkeurig beeld van je totale energiebehoefte.' 
      },
      { 
        title: '2. Het Dashboard (Plan)', 
        desc: 'Hier zie je de kern van je voortgang. Het "Dagbudget" is je doel. "Huidig Onderhoud" toont wat je zou verbranden zonder afvalplan. Het verschil is je "Besparing". De streefdatum is een dynamische voorspelling die zich aanpast aan jouw invoer en gedrag.' 
      },
      { 
        title: '3. Voeding Registreren', 
        desc: 'Consistentie is de sleutel tot succes. Registreer elke maaltijd en snack eerlijk. Door alles in te voeren in de zes momenten (Ontbijt t/m Avond Snack), krijgt de app een volledig beeld van je calorie-intake.' 
      },
      { 
        title: '4. Beweging & Extra Budget', 
        desc: 'Elke stap telt. Wanneer je een activiteit toevoegt in de "Beweeg" tab, wordt de verbrande energie direct bij je budget van vandaag opgeteld. Je ziet dit terug bij de teller "Activiteiten +". Sporten geeft je dus letterlijk meer ruimte om te eten.' 
      },
      { 
        title: '5. Jouw Profiel (Ik)', 
        desc: 'Zorg dat je biometrische gegevens up-to-date zijn. De keuze voor "Dagelijkse Activiteit" (PAL) bepaalt je basisverbranding. Je "Streef Tempo" beïnvloedt hoe groot het calorietekort is: een sneller tempo vraagt om meer discipline en een lager budget.' 
      },
      { 
        title: '6. Statistieken & Trends', 
        desc: 'Kijk verder dan de dagelijkse schommelingen. Gebruik de grafieken om de neerwaartse trend van je gewicht over weken te volgen. Stagneert de lijn? Dit noemen we een plateau. Blijf consistent; je lichaam past zich vaak na enkele dagen weer aan.' 
      },
      { 
        title: '7. Support & Contact', 
        desc: 'Heb je vragen over de werking van de app, technische problemen of suggesties voor verbetering? Ons team staat voor je klaar. Stuur een bericht naar info@ynnovator.com.' 
      }
    ],
    en: [
      { 
        title: '1. Scientific Foundation', 
        desc: 'This app acts as your personal compass. We use the Mifflin-St Jeor formula to determine your BMR (Basal Metabolic Rate). Combined with your Activity Level (PAL), this creates a precise picture of your total energy needs.' 
      },
      { 
        title: '2. The Dashboard (Plan)', 
        desc: 'The "Daily Budget" is your goal. "Maintenance" shows what you would burn without a plan. The "Savings" is your deficit. The target date is a dynamic prediction that adjusts based on your logging behavior.' 
      },
      { 
        title: '3. Logging Nutrition', 
        desc: 'Consistency is key. Log every meal and snack honestly across the six meal moments to ensure the app has a complete picture of your caloric intake.' 
      },
      { 
        title: '4. Movement & Extra Budget', 
        desc: 'Every step counts. Activities added in the "Move" tab increase your daily budget. You will see this in the "Activities +" counter. Exercise literally gives you more room to eat.' 
      },
      { 
        title: '5. Your Profile (Me)', 
        desc: 'Keep your biometrics updated. Your "Activity Level" determines base burn, while your "Pace" sets the deficit size. Faster paces require more discipline and a lower budget.' 
      },
      { 
        title: '6. Stats & Insights', 
        desc: 'Look beyond daily weight fluctuations. Use the trends to track your progress over weeks. If the line stalls (a plateau), stay consistent; your body will eventually adjust.' 
      },
      { 
        title: '7. Support & Contact', 
        desc: 'Questions or feedback? Contact our team at info@ynnovator.com.' 
      }
    ]
  };
  return steps[l] || steps['en'];
};

export const translations: Record<string, any> = {
  nl: {
    title: 'DOELGEWICHT', subtitle: 'IN ZICHT', targetReached: 'DOEL BEREIKT OP', nowWeight: 'NU', goalWeight: 'DOEL', myJourney: 'MIJN GEWICHT PROGRESSIE', weighMoment: 'Gewicht vandaag', dailyBudget: 'DAGBUDGET CALORIEËN', consumed: 'VERBRUIKT', mealSchedule: 'Voeding', todayPlanning: 'Registratie van vandaag', myList: 'Mijn Lijst', nothingPlanned: 'Nog niets geregistreerd', movement: 'Beweging', planActivities: 'Registreer je activiteiten', activity: 'Activiteit', amount: 'Minuten', qtyLabel: 'Hoeveelheid', inLabel: 'in', settings: 'Instellingen', age: 'GEBOORTEJAAR', gender: 'GESLACHT', man: 'MAN', woman: 'VROUW', height: 'LENGTE (CM)', startWeight: 'STARTGEWICHT', targetWeight: 'DOELGEWICHT', dailyBudgetLabel: 'CALORIE BUDGET PER DAG', oldBudgetLabel: 'HUIDIG ONDERHOUD', newBudgetLabel: 'DAGELIJKS DOEL', targetDateLabel: 'DOEL BEREIKT OP', projectedDate: 'Datum', speedSlow: 'RUSTIG', speedAverage: 'GEMIDDELD', speedFast: 'SNEL', speedCustom: 'EIGEN TEMPO', chooseSpeed: 'KIES HOE SNEL JE HET DOEL GEWICHT WIL BEREIKEN', activityLevelLabel: 'DAGELIJKSE ACTIVITEIT (BASIS)', activityLevelDesc: 'HOE ACTIEF IS JE WERK OF DAGELIJKS LEVEN?', levelLight: 'ZITTEND', levelModerate: 'GEMIDDELD', levelHeavy: 'ZWAAR WERK', language: 'Taal / Language', searchPlaceholder: 'Typ om te zoeken...', remainingToday: 'CALORIEËN OVER', activityCalories: 'Activiteiten', consumedTodayLabel: 'Verbruikt', caloriesPerDay: 'PER DAG', timeGroups: { morning: 'Ochtend', afternoon: 'Middag', evening: 'Avond' }, noDataYet: 'Nog geen metingen', addActivity: 'Activiteit toevoegen', addProduct: 'Eten of drinken invoeren', kcalPer60: 'Kcal per 60 min', unitPlaceholder: 'bijv. 100g of 250ml', categories: 'In welke lijst?', isDrink: 'Dit is drinken (glas-icoon)', save: 'Opslaan in lijst', delete: 'Verwijderen', snack: 'SNACK', addFoodDrink: 'ETEN OF DRINKEN INVOEREN', searchProduct: 'ZOEK ETEN OF DRINKEN...', adjustQuantity: 'HOEVEELHEID AANPASSEN', addToMyList: 'VOEG TOE AAN LIJST', newActivity: 'Nieuwe Activiteit', activityName: 'NAAM ACTIVITEIT', kcalPerHour: 'KCAL PER UUR', minutes: 'MINUTEN', paceTitle: 'STREEF TEMPO', customPace: 'EIGEN TEMPO', targetDate: 'STREEFDATUM', dataStorage: 'DATA & OPSLAG', mealLabel: 'ETEN', drinkLabel: 'DRINKEN', portionPlaceholder: 'PORTIE (BIJV 100G)', productName: 'PRODUCTNAME', kcalLabel: 'KCAL', manageDb: 'Database Beheren', removeItems: 'Verwijder items uit de picker', ownActivities: 'Eigen Activiteiten', invalidDate: 'Deze streefdatum is fysiek niet verantwoord. Kies een latere datum voor een gezond resultaat.', dataManagement: { title: 'Data & Opslag', export: 'Exporteer (Backup)', restore: 'Herstel bestand', clearAll: 'Gegevens wissen', clearConfirm: 'Weet je zeker dat je alle gegevens wilt wissen?' }, infoModal: { title: 'Gids: Doelgewicht in Zicht', aboutText: 'Deze applicatie is ontworpen als jouw persoonlijke kompas naar een gezond gewicht. We combineren wetenschappelijke formules met jouw dagelijkse registraties om een haalbaar en verantwoord plan te bieden.', scienceTitle: 'De Wetenschappelijke Basis', scienceText: 'Centraal staat de Mifflin-St Jeor formule. Deze berekening bepaalt je Basal Metabolic Rate (BMR) — de energie die je lichaam nodig heeft voor vitale functies zoals ademhaling en bloedsomloop. Door hier je Physical Activity Level (PAL) aan toe te voegen, ontstaat een eerlijk beeld van je energiebalans: wat gaat erin, en wat gaat eruit?', manualTitle: 'De Volledige Handleiding', steps: genericSteps('nl'), disclaimerTitle: 'Medische Disclaimer', disclaimerText: 'De adviezen in deze app zijn indicatief. Raadpleeg altijd een arts bij medische aandoeningen of extreme dieetwensen.', copyright: '© 2026 My Healthy Planning. Versie V2-Stable.', }, moments: { 'Ontbijt': 'Ontbijt', 'Ochtend Snack': 'Ochtend Snack', 'Lunch': 'Lunch', 'Middag Snack': 'Middag Snack', 'Diner': 'Diner', 'Avond Snack': 'Avond Snack' }, tabs: { dashboard: 'Plan', meals: 'Voeding', activity: 'Beweeg', profile: 'Ik' }, 
    weeklySummary: 'WEKELIJKSE SAMENVATTING', totalIntake: 'TOTALE INNAME', avgDaily: 'GEMIDDELDE PER DAG', totalBurn: 'TOTAAL VERBRAND', weeklyWeightChange: 'GEWICHTSVERANDERING',
    orSelectFromList: 'OF KIES UIT DE ONDERSTAANDE LIJST'
  },
  en: {
    title: 'TARGET WEIGHT', subtitle: 'IN SIGHT', targetReached: 'TARGET REACHED ON', nowWeight: 'NOW', goalWeight: 'GOAL', myJourney: 'MY WEIGHT PROGRESSION', weighMoment: 'Weight today', dailyBudget: 'DAILY CALORIE BUDGET', consumed: 'CONSUMED', mealSchedule: 'Nutrition', todayPlanning: 'Today\'s entry', myList: 'My List', nothingPlanned: 'Nothing logged yet', movement: 'Activity', planActivities: 'Log your activity', activity: 'Activity', amount: 'Minutes', qtyLabel: 'Amount', inLabel: 'in', settings: 'Settings', age: 'BIRTH YEAR', gender: 'GENDER', man: 'MAN', woman: 'WOMAN', height: 'HEIGHT (CM)', startWeight: 'START WEIGHT', targetWeight: 'TARGET WEIGHT', dailyBudgetLabel: 'DAILY BUDGET', oldBudgetLabel: 'MAINTENANCE', newBudgetLabel: 'DAILY GOAL', targetDateLabel: 'TARGET REACHED ON', projectedDate: 'Date', speedSlow: 'SLOW', speedAverage: 'AVERAGE', speedFast: 'FAST', speedCustom: 'CUSTOM', chooseSpeed: 'CHOOSE PACE', activityLevelLabel: 'ACTIVITY LEVEL', activityLevelDesc: 'DAILY ACTIVITY BASE', levelLight: 'SEDENTARY', levelModerate: 'MODERATE', levelHeavy: 'HEAVY', language: 'Language', searchPlaceholder: 'Search...', remainingToday: 'CALORIES LEFT', activityCalories: 'Activities', consumedTodayLabel: 'Consumed', caloriesPerDay: 'PER DAY', timeGroups: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' }, noDataYet: 'No entries', addActivity: 'Add activity', addProduct: 'Log food or drink', kcalPer60: 'Kcal/hour', unitPlaceholder: 'e.g., 100g', categories: 'Categories', isDrink: 'Drink', save: 'Save', delete: 'Delete', snack: 'SNACK', addFoodDrink: 'LOG FOOD OR DRINK', searchProduct: 'SEARCH FOOD OR DRINK...', adjustQuantity: 'ADJUST QUANTITY', addToMyList: 'ADD TO LIST', newActivity: 'New Activity', activityName: 'ACTIVITY NAME', kcalPerHour: 'KCAL PER HOUR', minutes: 'MINUTES', paceTitle: 'PACE', customPace: 'CUSTOM PACE', targetDate: 'TARGET DATE', dataStorage: 'DATA & STORAGE', mealLabel: 'FOOD', drinkLabel: 'DRINK', portionPlaceholder: 'PORTION (E.G. 100G)', productName: 'PRODUCT NAME', kcalLabel: 'KCAL', manageDb: 'Manage Database', removeItems: 'Remove items from picker', ownActivities: 'Own Activities', invalidDate: 'This target date is physically irresponsible. Choose a later date for a healthy result.', dataManagement: { title: 'Data', export: 'Export', restore: 'Restore', clearAll: 'Clear', clearConfirm: 'Delete all data?' }, infoModal: { title: 'Guide: Target Weight In Sight', aboutText: 'This application is designed as your personal compass to a healthy weight, combining scientific formulas with your daily logs.', scienceTitle: 'The Science', scienceText: 'We use the Mifflin-St Jeor equation to calculate your Basal Metabolic Rate (BMR) and combine it with your Activity Level (PAL) for an honest view of your energy balance.', manualTitle: 'Deep Dive Manual', steps: genericSteps('en'), disclaimerTitle: 'Medical Disclaimer', disclaimerText: 'Indications only. Consult a doctor for medical conditions.', copyright: '© 2026 My Healthy Planning. Version V2-Stable.' }, moments: { 'Ontbijt': 'Breakfast', 'Ochtend Snack': 'Morning Snack', 'Lunch': 'Lunch', 'Middag Snack': 'Afternoon Snack', 'Diner': 'Dinner', 'Avond Snack': 'Evening Snack' }, tabs: { dashboard: 'Plan', meals: 'Nutrition', activity: 'Move', profile: 'Me' },
    weeklySummary: 'WEEKLY SUMMARY', totalIntake: 'TOTAL INTAKE', avgDaily: 'DAILY AVERAGE', totalBurn: 'TOTAL BURNED', weeklyWeightChange: 'WEIGHT CHANGE',
    orSelectFromList: 'OR CHOOSE FROM THE LIST BELOW'
  }
};
