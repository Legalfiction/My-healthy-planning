
import { Language } from './types';

export const genericSteps = (l: string) => {
  const steps: Record<string, any[]> = {
    nl: [
      { title: '1. De Wetenschappelijke Basis', desc: 'We gebruiken de Mifflin-St Jeor formule om je BMR te bepalen. Gecombineerd met je PAL-waarde ontstaat een nauwkeurig beeld van je energiebehoefte.' },
      { title: '2. Het Dashboard (Plan)', desc: 'Het "Dagbudget" is je doel. "Huidig Onderhoud" toont wat je zou verbranden zonder plan. Het verschil is je "Besparing".' },
      { title: '3. Voeding Registreren', desc: 'Registreer elke maaltijd eerlijk in de zes momenten om een volledig beeld van je intake te krijgen.' },
      { title: '4. Beweging & Extra Budget', desc: 'Sporten verhoogt direct je budget voor vandag. Dit zie je terug bij de teller "Activiteiten +".' },
      { title: '5. Jouw Profiel (Ik)', desc: 'Houd je biometrische gegevens up-to-date voor een accuraat plan.' }
    ],
    en: [
      { title: '1. Scientific Foundation', desc: 'We use the Mifflin-St Jeor formula to determine your BMR. Combined with your PAL value, this creates an accurate picture of your energy needs.' },
      { title: '2. Dashboard (Plan)', desc: 'The "Daily Budget" is your goal. "Maintenance" shows what you would burn without a plan. The difference is your "Savings".' },
      { title: '3. Logging Nutrition', desc: 'Log every meal honestly across the six moments to get a full picture of your intake.' },
      { title: '4. Activity & Extra Budget', desc: 'Exercise directly increases your budget for today. This is shown in the "Activities +" counter.' },
      { title: '5. Your Profile (Me)', desc: 'Keep your biometric data up-to-date for an accurate plan.' }
    ],
    fr: [
      { title: '1. Base Scientifique', desc: 'Nous utilisons la formule Mifflin-St Jeor pour déterminer votre BMR. Combiné à votre valeur PAL, cela crée une image précise de vos besoins énergétiques.' },
      { title: '2. Tableau de bord', desc: 'Le "Budget quotidien" est votre objectif. "L\'entretien" montre ce que vous brûleriez sans plan. La différence est votre "Économie".' },
      { title: '3. Enregistrement', desc: 'Enregistrez chaque repas honnêtement sur les six moments pour avoir une vue complète de votre apport.' }
    ],
    es: [
      { title: '1. Base Científica', desc: 'Usamos la fórmula Mifflin-St Jeor para determinar su BMR. Combinado con su valor PAL, esto crea una imagen precisa de sus necesidades energéticas.' },
      { title: '2. Panel (Plan)', desc: 'El "Presupuesto diario" es su meta. "Mantenimiento" muestra lo que quemaría sin un plan. La diferencia es su "Ahorro".' }
    ],
    de: [
      { title: '1. Wissenschaftliche Basis', desc: 'Wir verwenden die Mifflin-St Jeor-Formel, um Ihren BMR te bestimmen. Kombiniert mit Ihrem PAL-Wert ergibt dies ein genaues Bild Ihres Energiebedarfs.' },
      { title: '2. Dashboard (Plan)', desc: 'Das "Tagesbudget" ist Ihr Ziel. "Erhaltung" zeigt, was Sie ohne Plan verbrennen würden. Die Differenz ist Ihre "Ersparnis".' }
    ],
    pt: [
      { title: '1. Base Científica', desc: 'Usamos a fórmula Mifflin-St Jeor para determinar o seu TMB. Combinado com o seu valor PAL, isso cria uma imágem precisa das suas necessidades energéticas.' }
    ],
    zh: [
      { title: '1. 科学基础', desc: '我们使用 Mifflin-St Jeor 公式来确定您的 BMR。结合您的 PAL 值，这可以准确反映您的能量需求。' }
    ],
    ja: [
      { title: '1. 科学的根拠', desc: 'Mifflin-St Jeor 式を使用して BMR を決定します。これに PAL 値を組み合わせることで、エネルギー必要量の正確な把握が可能になります。' }
    ],
    ko: [
      { title: '1. 과학적 기초', desc: 'Mifflin-St Jeor 공식을 사용하여 BMR을 결정합니다. PAL 수치와 결합하여 에너지 요구량을 정확하게 파악합니다.' }
    ],
    hi: [
      { title: '1. वैज्ञानिक आधार', desc: 'हम आपके BMR को निर्धारित करने के लिए Mifflin-St Jeor फॉर्मूले का उपयोग करते हैं।' }
    ],
    ar: [
      { title: '1. الأساس العلمي', desc: 'نستخدم معادلة Mifflin-St Jeor لتحديد معدل الأيض الأساسي (BMR).' }
    ]
  };
  return steps[l] || steps['en'];
};

export const translations: Record<string, any> = {
  nl: {
    targetReached: 'DOEL BEREIKT OP', weighMoment: 'GEWICHT VANDAAG', dailyBudget: 'DAGBUDGET CALORIEËN',
    consumed: 'VERBRUIKT', consumedLabel: 'VERBRUIKT', maxKcalLabel: 'KCAL MAX', savingsLabel: 'BESPARING',
    maintenanceLabel: 'HUIDIG ONDERHOUD', activityCalories: 'ACTIVITEITEN', remainingToday: 'CALORIEËN OVER',
    insights: 'INZICHTEN', report: 'RAPPORT', scientificBasis: 'WETENSCHAP', manualLabel: 'Handleiding',
    howWeCalculate: 'Hoe we jouw budget berekenen', progressAnalysis: 'Voortgangsanalyse',
    mealSchedule: 'Voeding', todayPlanning: 'Registratie van vandaag', myList: 'Mijn Lijst', nothingPlanned: 'Nog niets geregistreerd',
    movement: 'Beweging', planActivities: 'Registreer je activiteiten', age: 'GEBOORTEJAAR', gender: 'GESLACHT',
    man: 'MAN', woman: 'VROUW', height: 'LENGTE (CM)', startWeight: 'STARTGEWICHT', targetWeight: 'DOELGEWICHT',
    oldBudgetLabel: 'HUIDIG ONDERHOUD', save: 'OPSLAAN', addFoodDrink: 'ETEN OF DRINKEN INVOEREN',
    searchProduct: 'ZOEK ETEN OF DRINKEN...', addToMyList: 'VOEG TOE AAN LIJST', newActivity: 'Nieuwe Activiteit',
    minutes: 'MINUTEN', paceTitle: 'STREEF TEMPO', dataStorage: 'DATA & OPSLAG',
    weightTrend: 'Gewichtsverloop', trend: 'Trend', norm: 'Norm', avgThisWeek: 'Gemiddelde deze week', perDay: 'per dag', planVsActual: 'Plan vs Werkelijk', editItem: 'Aanpassen', searchActivity: 'Zoek activiteit...', saveChanges: 'Opslaan',
    paceLabel: 'TEMPO', levelLabel: 'NIVEAU', speedSlow: 'Rustig', speedAverage: 'Gemiddeld', speedFast: 'Snel', speedCustom: 'Eigen tempo',
    levelLight: 'Licht', levelModerate: 'Gemiddeld', levelHeavy: 'Zwaar',
    moments: { 'Ontbijt': 'Ontbijt', 'Ochtend Snack': 'Ochtend Snack', 'Lunch': 'Lunch', 'Middag Snack': 'Middag Snack', 'Diner': 'Diner', 'Avond Snack': 'Avond Snack' },
    tabs: { dashboard: 'Plan', meals: 'Voeding', activity: 'Beweeg', profile: 'Ik' },
    infoModal: { title: 'Gids: Doelgewicht in Zicht', aboutText: 'Deze app is uw persoonlijke kompas naar een gezond gewicht.', scienceTitle: 'Wetenschap', scienceText: 'Centraal staat de Mifflin-St Jeor formule.', manualTitle: 'Handleiding', disclaimerTitle: 'Medische Disclaimer', disclaimerText: 'Raadpleeg altijd een arts.', copyright: '© 2026 My Healthy Planning.' }
  },
  en: {
    targetReached: 'TARGET REACHED ON', weighMoment: 'WEIGHT TODAY', dailyBudget: 'DAILY CALORIE BUDGET',
    consumed: 'CONSUMED', consumedLabel: 'CONSUMED', maxKcalLabel: 'KCAL MAX', savingsLabel: 'SAVINGS',
    maintenanceLabel: 'MAINTENANCE', activityCalories: 'ACTIVITIES', remainingToday: 'CALORIES LEFT',
    insights: 'INSIGHTS', report: 'REPORT', scientificBasis: 'SCIENCE', manualLabel: 'Manual',
    howWeCalculate: 'How we calculate your budget', progressAnalysis: 'Progress Analysis',
    mealSchedule: 'Nutrition', todayPlanning: 'Today\'s entry', myList: 'My List', nothingPlanned: 'Nothing logged yet',
    movement: 'Activity', planActivities: 'Log your activity', age: 'BIRTH YEAR', gender: 'GENDER',
    man: 'MAN', woman: 'WOMAN', height: 'HEIGHT (CM)', startWeight: 'START WEIGHT', targetWeight: 'TARGET WEIGHT',
    oldBudgetLabel: 'MAINTENANCE', save: 'SAVE', addFoodDrink: 'LOG FOOD OR DRINK',
    searchProduct: 'SEARCH FOOD OR DRINK...', addToMyList: 'ADD TO LIST', newActivity: 'New Activity',
    minutes: 'MINUTES', paceTitle: 'PACE', dataStorage: 'DATA & STORAGE',
    weightTrend: 'Weight Progress', trend: 'Trend', norm: 'Norm', avgThisWeek: 'Avg this week', perDay: 'per day', planVsActual: 'Plan vs Actual', editItem: 'Edit', searchActivity: 'Search activity...', saveChanges: 'Save',
    paceLabel: 'PACE', levelLabel: 'LEVEL', speedSlow: 'Slow', speedAverage: 'Average', speedFast: 'Fast', speedCustom: 'Custom pace',
    levelLight: 'Light', levelModerate: 'Moderate', levelHeavy: 'Heavy',
    moments: { 'Ontbijt': 'Breakfast', 'Ochtend Snack': 'Morning Snack', 'Lunch': 'Lunch', 'Middag Snack': 'Afternoon Snack', 'Diner': 'Dinner', 'Avond Snack': 'Evening Snack' },
    tabs: { dashboard: 'Plan', meals: 'Nutrition', activity: 'Move', profile: 'Me' },
    infoModal: { title: 'Guide: Target In Sight', aboutText: 'This app is your personal compass to a healthy weight.', scienceTitle: 'Science', scienceText: 'Centered on the Mifflin-St Jeor formula.', manualTitle: 'Manual', disclaimerTitle: 'Disclaimer', disclaimerText: 'Consult a doctor.', copyright: '© 2026 My Healthy Planning.' }
  },
  fr: {
    targetReached: 'ATTEINT LE', weighMoment: 'POIDS AUJOURD\'HUI', dailyBudget: 'BUDGET CALORIES',
    consumed: 'CONSOMMÉ', consumedLabel: 'CONSOMMÉ', maxKcalLabel: 'KCAL MAX', savingsLabel: 'ÉCONOMIE',
    maintenanceLabel: 'ENTRETIEN', activityCalories: 'ACTIVITÉS', remainingToday: 'CALORIES RESTANTES',
    insights: 'INFOS', report: 'RAPPORT', scientificBasis: 'SCIENCE', manualLabel: 'Manuel',
    howWeCalculate: 'Notre calcul', progressAnalysis: 'Analyse du progrès',
    mealSchedule: 'Nutrition', todayPlanning: 'Saisie du jour', myList: 'Ma Liste', nothingPlanned: 'Rien de prévu',
    movement: 'Activité', planActivities: 'Enregistrer l\'activité', age: 'ANNÉE DE NAISSANCE', gender: 'GENRE',
    man: 'HOMME', woman: 'FEMME', height: 'TAILLE (CM)', startWeight: 'POIDS INITIAL', targetWeight: 'POIDS CIBLE',
    oldBudgetLabel: 'ENTRETIEN', save: 'SAUVEGARDER', addFoodDrink: 'AJOUTER ALIMENT',
    searchProduct: 'CHERCHER...', addToMyList: 'AJOUTER', newActivity: 'Nouvelle Activité',
    minutes: 'MINUTES', paceTitle: 'RYTHME', dataStorage: 'DONNÉES',
    weightTrend: 'Évolution du poids', trend: 'Tendance', norm: 'Norme', avgThisWeek: 'Moyenne cette semaine', perDay: 'par jour', planVsActual: 'Prévu vs Réel', editItem: 'Modifier', searchActivity: 'Chercher activité...', saveChanges: 'Enregistrer',
    paceLabel: 'RYTHME', levelLabel: 'NIVEAU', speedSlow: 'Lent', speedAverage: 'Moyen', speedFast: 'Rapide', speedCustom: 'Rythme perso',
    levelLight: 'Léger', levelModerate: 'Modéré', levelHeavy: 'Intense',
    moments: { 'Ontbijt': 'Petit-déjeuner', 'Ochtend Snack': 'En-cas Matin', 'Lunch': 'Déjeuner', 'Middag Snack': 'Goûter', 'Diner': 'Dîner', 'Avond Snack': 'En-cas Soir' },
    tabs: { dashboard: 'Plan', meals: 'Nutrition', activity: 'Bouger', profile: 'Moi' }
  },
  ja: {
    targetReached: '目標達成予定日', weighMoment: '今日の体重', dailyBudget: '一日の熱量予算',
    consumed: '摂取済み', consumedLabel: '摂取済み', maxKcalLabel: '最大熱量', savingsLabel: '節約',
    maintenanceLabel: '維持カロリー', activityCalories: '運動', remainingToday: '残りカロリー',
    insights: 'インサイト', report: 'レポート', scientificBasis: '科学', manualLabel: 'ガイド',
    howWeCalculate: '計算の仕組み', progressAnalysis: '進捗分析',
    mealSchedule: '栄養', todayPlanning: '今日の記録', myList: 'マイリスト', nothingPlanned: '記録なし',
    movement: '運動', planActivities: '運動を記録', age: '誕生年', gender: '性別',
    man: '男性', woman: '女性', height: '身長 (CM)', startWeight: '開始体重', targetWeight: '目標体重',
    oldBudgetLabel: '維持カロリー', save: '保存', addFoodDrink: '食事・飲料入力',
    searchProduct: '検索...', addToMyList: 'リストに追加', newActivity: '新しい運動',
    minutes: '分', paceTitle: 'ペース', dataStorage: 'データ管理',
    weightTrend: '体重推移', trend: 'トレンド', norm: '基準', avgThisWeek: '今週の平均', perDay: '日当たり', planVsActual: '実績 vs 計画', editItem: '編集', searchActivity: '運動検索...', saveChanges: '保存',
    paceLabel: 'ペース', levelLabel: 'レベル', speedSlow: 'ゆっくり', speedAverage: '普通', speedFast: '早い', speedCustom: 'カスタム',
    levelLight: '低い', levelModerate: '普通', levelHeavy: '高い',
    moments: { 'Ontbijt': '朝食', 'Ochtend Snack': '午前中食', 'Lunch': '昼食', 'Middag Snack': 'おやつ', 'Diner': '夕食', 'Avond Snack': '夜食' },
    tabs: { dashboard: 'プラン', meals: '栄養', activity: '運動', profile: '私' },
    infoModal: { title: 'ガイド: 目標達成へ', aboutText: 'このアプリは健康的な体重へのコンパスです。', scienceTitle: '科学的根拠', scienceText: 'Mifflin-St Jeor式を採用しています。', manualTitle: 'マニュアル', disclaimerTitle: '免責事項', disclaimerText: '医師に相談してください。', copyright: '© 2026 My Healthy Planning.' }
  },
  es: {
    targetReached: 'OBJETIVO ALCANZADO EL', weighMoment: 'PESO HOY', dailyBudget: 'PRESUPUESTO DIARIO',
    consumed: 'CONSUMIDO', consumedLabel: 'CONSUMIDO', maxKcalLabel: 'KCAL MAX', savingsLabel: 'AHORRO',
    maintenanceLabel: 'MANTENIMIENTO', activityCalories: 'ACTIVIDADES', remainingToday: 'CALORÍAS RESTANTES',
    insights: 'ESTADÍSTICAS', report: 'INFORME', scientificBasis: 'CIENCIA', manualLabel: 'Manual',
    howWeCalculate: 'Cómo calculamos tu presupuesto', progressAnalysis: 'Análisis de progreso',
    mealSchedule: 'Nutrición', todayPlanning: 'Registro de hoy', myList: 'Mi Lista', nothingPlanned: 'Nada registrado aún',
    movement: 'Actividad', planActivities: 'Registra tu actividad', age: 'AÑO DE NACIMIENTO', gender: 'GÉNERO',
    man: 'HOMBRE', woman: 'MUJER', height: 'ALTURA (CM)', startWeight: 'PESO INICIAL', targetWeight: 'PESO OBJETIVO',
    oldBudgetLabel: 'MANTENIMIENTO', save: 'GUARDAR', addFoodDrink: 'INGRESAR COMIDA',
    searchProduct: 'BUSCAR...', addToMyList: 'AGREGAR A LA LISTA', newActivity: 'Nueva Actividad',
    minutes: 'MINUTOS', paceTitle: 'RITMO', dataStorage: 'DATOS',
    paceLabel: 'RITMO', levelLabel: 'NIVEL', speedSlow: 'Lento', speedAverage: 'Medio', speedFast: 'Rápido', speedCustom: 'Personalizado',
    levelLight: 'Ligero', levelModerate: 'Moderado', levelHeavy: 'Intenso',
    moments: { 'Ontbijt': 'Desayuno', 'Ochtend Snack': 'Snack Mañana', 'Lunch': 'Almuerzo', 'Middag Snack': 'Merienda', 'Diner': 'Cena', 'Avond Snack': 'Snack Noche' },
    tabs: { dashboard: 'Plan', meals: 'Nutrición', activity: 'Mover', profile: 'Yo' }
  },
  de: {
    targetReached: 'ZIEL ERREICHT AM', weighMoment: 'HEUTIGES GEWICHT', dailyBudget: 'KALORIENBUDGET',
    consumed: 'VERBRAUCHT', consumedLabel: 'VERBRAUCHT', maxKcalLabel: 'KCAL MAX', savingsLabel: 'ERSPARNIS',
    maintenanceLabel: 'ERHALTUNG', activityCalories: 'AKTIVITÄTEN', remainingToday: 'KALORIEN ÜBRIG',
    insights: 'INSIGHTS', report: 'BERICHT', scientificBasis: 'WISSENSCHAFT', manualLabel: 'Handbuch',
    howWeCalculate: 'Unsere Berechnung', progressAnalysis: 'Fortschrittsanalyse',
    mealSchedule: 'Ernährung', todayPlanning: 'Heutiger Eintrag', myList: 'Meine Liste', nothingPlanned: 'Noch nichts geplant',
    movement: 'Bewegung', planActivities: 'Aktivität protokollieren', age: 'GEBURTSDATUM', gender: 'GESCHLECHT',
    man: 'MANN', woman: 'FRAU', height: 'GRÖSSE (CM)', startWeight: 'STARTGEWICHT', targetWeight: 'ZIELGEWICHT',
    oldBudgetLabel: 'ERHALTUNG', save: 'SPEICHERN', addFoodDrink: 'ESSEN ODER TRINKEN',
    searchProduct: 'SUCHEN...', addToMyList: 'HINZUFÜGEN', newActivity: 'Neue Activität',
    minutes: 'MINUTEN', paceTitle: 'TEMPO', dataStorage: 'DATEN',
    paceLabel: 'TEMPO', levelLabel: 'NIVEAU', speedSlow: 'Langsam', speedAverage: 'Normal', speedFast: 'Schnell', speedCustom: 'Eigenes Tempo',
    levelLight: 'Leicht', levelModerate: 'Mittel', levelHeavy: 'Schwer',
    moments: { 'Ontbijt': 'Frühstück', 'Ochtend Snack': 'Vormittagssnack', 'Lunch': 'Mittagessen', 'Middag Snack': 'Nachmittagssnack', 'Diner': 'Abendessen', 'Avond Snack': 'Abendsnack' },
    tabs: { dashboard: 'Plan', meals: 'Ernährung', activity: 'Bewegen', profile: 'Ich' }
  },
  pt: {
    targetReached: 'META ATINGIDA EM', weighMoment: 'PESO HOJE', dailyBudget: 'ORÇAMENTO DIÁRIO',
    consumed: 'CONSUMIDO', consumedLabel: 'CONSUMIDO', maxKcalLabel: 'KCAL MÁX', savingsLabel: 'ECONOMIA',
    maintenanceLabel: 'MANUTENÇÃO', activityCalories: 'ATIVIDADES', remainingToday: 'CALORIAS RESTANTES',
    insights: 'ESTADÍSTICAS', report: 'RELATÓRIO', scientificBasis: 'CIÊNCIA', manualLabel: 'Manual',
    howWeCalculate: 'Como calculamos', progressAnalysis: 'Análise de progresso',
    mealSchedule: 'Nutrição', todayPlanning: 'Registro de hoje', myList: 'Minha Lista', nothingPlanned: 'Nada registrado',
    movement: 'Atividade', planActivities: 'Registrar atividade', age: 'ANO DE NASCIMENTO', gender: 'GÉNERO',
    man: 'HOMEM', woman: 'MULHER', height: 'ALTURA (CM)', startWeight: 'PESO INICIAL', targetWeight: 'PESO META',
    oldBudgetLabel: 'MANUTENÇÃO', save: 'SALVAR', addFoodDrink: 'INSERIR ALIMENTO',
    searchProduct: 'PESQUISAR...', addToMyList: 'ADICIONAR', newActivity: 'Nova Atividade',
    minutes: 'MINUTOS', paceTitle: 'RITMO', dataStorage: 'DADOS',
    paceLabel: 'RITMO', levelLabel: 'NÍVEL', speedSlow: 'Lento', speedAverage: 'Médio', speedFast: 'Rápido', speedCustom: 'Personalizado',
    levelLight: 'Leve', levelModerate: 'Moderado', levelHeavy: 'Intenso',
    moments: { 'Ontbijt': 'Pequeno-almoço', 'Ochtend Snack': 'Lanche Manhã', 'Lunch': 'Almoço', 'Middag Snack': 'Lanche Tarde', 'Diner': 'Jantar', 'Avond Snack': 'Lanche Noite' },
    tabs: { dashboard: 'Plano', meals: 'Nutrição', activity: 'Mover', profile: 'Eu' }
  },
  zh: {
    targetReached: '预计达成日期', weighMoment: '今日体重', dailyBudget: '每日热量预算',
    consumed: '已消耗', consumedLabel: '已消耗', maxKcalLabel: '热量上限', savingsLabel: '节省',
    maintenanceLabel: '维持摄入', activityCalories: '运动消耗', remainingToday: '剩余热量',
    insights: '数据分析', report: '报告', scientificBasis: '科学基础', manualLabel: '使用指南',
    howWeCalculate: '预算计算方式', progressAnalysis: '进度分析',
    mealSchedule: '营养', todayPlanning: '今日纪录', myList: '我的列表', nothingPlanned: '尚无纪录',
    movement: '运动', planActivities: '纪录运动', age: '出生年份', gender: '性别',
    man: '男', woman: '女', height: '身高 (CM)', startWeight: '初始体重', targetWeight: '目标体重',
    oldBudgetLabel: '维持摄入', save: '保存', addFoodDrink: '输入食物',
    searchProduct: '搜索...', addToMyList: '加入列表', newActivity: '新运动',
    minutes: '分钟', paceTitle: '速度', dataStorage: '数据',
    paceLabel: '速度', levelLabel: '级别', speedSlow: '慢', speedAverage: '中等', speedFast: '快', speedCustom: '自定义',
    levelLight: '低', levelModerate: '中', levelHeavy: '高',
    moments: { 'Ontbijt': '早餐', 'Ochtend Snack': '上午点心', 'Lunch': '午餐', 'Middag Snack': '下午点心', 'Diner': '晚餐', 'Avond Snack': '晚上点心' },
    tabs: { dashboard: '计划', meals: '营养', activity: '运动', profile: '我' }
  },
  ko: {
    targetReached: '목표 달성 예정일', weighMoment: '오늘의 체중', dailyBudget: '일일 칼로리 예산',
    consumed: '섭취량', consumedLabel: '섭취됨', maxKcalLabel: '최대 칼로리', savingsLabel: '절감',
    maintenanceLabel: '유지 칼로리', activityCalories: '활동', remainingToday: '남은 칼로리',
    insights: '인사이트', report: '보고서', scientificBasis: '과학', manualLabel: '설명서',
    mealSchedule: '영양', myList: '내 리스트', nothingPlanned: '기록 없음',
    movement: '운동', planActivities: '활동 기록', age: '출생 연도', gender: '성별',
    man: '남성', woman: '여성', height: '키 (CM)', startWeight: '시작 체중', targetWeight: '목표 체중',
    save: '저장', addFoodDrink: '음식/음료 입력', searchProduct: '검색...',
    paceLabel: '속도', levelLabel: '레벨', speedSlow: '느림', speedAverage: '보통', speedFast: '빠름',
    levelLight: '낮음', levelModerate: '보통', levelHeavy: '높음',
    moments: { 'Ontbijt': '아침', 'Ochtend Snack': '오전 간식', 'Lunch': '점심', 'Middag Snack': '오후 간식', 'Diner': '저녁', 'Avond Snack': '야식' },
    tabs: { dashboard: '계획', meals: '영양', activity: '운동', profile: '나' }
  },
  hi: {
    targetReached: 'लक्ष्य तिथि', weighMoment: 'आज का वजन', dailyBudget: 'दैनिक कैलोरी बजट',
    consumed: 'खपत', consumedLabel: 'खपत', maxKcalLabel: 'कैलोरी अधिकतम', savingsLabel: 'बचत',
    maintenanceLabel: 'रखरखाव', activityCalories: 'गतिविधियाँ', remainingToday: 'बची हुई कैलोरी',
    insights: 'अन्तर्दृष्टि', report: 'रिपोर्ट', scientificBasis: 'विज्ञान', manualLabel: 'नियमावली',
    mealSchedule: 'पोषण', todayPlanning: 'आज की प्रविष्टि', myList: 'मेरी सूची', nothingPlanned: 'अभी तक कुछ भी नहीं',
    movement: 'गतिविधि', planActivities: 'अपनी गतिविधि दर्ज करें', age: 'जन्म वर्ष', gender: 'लिंग',
    man: 'पुरुष', woman: 'महिला', height: 'ऊंचाई (CM)', startWeight: 'प्रारंभिक वजन', targetWeight: 'लक्ष्य वजन',
    save: 'सहेजें', addFoodDrink: 'भोजन या पेय दर्ज करें', searchProduct: 'उत्पाद खोजें...',
    paceLabel: 'गति', levelLabel: 'स्तर', speedSlow: 'धीमा', speedAverage: 'औसत', speedFast: 'तेज़',
    levelLight: 'हल्का', levelModerate: 'औसत', levelHeavy: 'भारी',
    moments: { 'Ontbijt': 'नाश्ता', 'Ochtend Snack': 'सुबह का नाश्ता', 'Lunch': 'दोपहर का भोजन', 'Middag Snack': 'दोपहर का नाश्ता', 'Diner': 'रात का भोजन', 'Avond Snack': 'रात का नाश्ता' },
    tabs: { dashboard: 'योजना', meals: 'पोषण', activity: 'गतिविधि', profile: 'मैं' }
  },
  ar: {
    targetReached: 'تاريخ الوصول للهدف', weighMoment: 'الوزن اليوم', dailyBudget: 'ميزانية السعرات اليومية',
    consumed: 'مستهلك', consumedLabel: 'مستهلك', maxKcalLabel: 'أقصى سعرات', savingsLabel: 'توفير',
    maintenanceLabel: 'المحافظة', activityCalories: 'الأنشطة', remainingToday: 'السعرات المتبقية',
    insights: 'رؤى', report: 'تقرير', scientificBasis: 'العلم', manualLabel: 'دليل الاستخدام',
    mealSchedule: 'التغذية', todayPlanning: 'مدخلات اليوم', myList: 'قائمتي', nothingPlanned: 'لا يوجد شيء حتى الآن',
    movement: 'النشاط', planActivities: 'سجل نشاطك', age: 'سنة الميلاد', gender: 'الجنس',
    man: 'رجل', woman: 'امرأة', height: 'الطول (سم)', startWeight: 'الوزن الابتدائي', targetWeight: 'الوزن المستهدف',
    save: 'حفظ', addFoodDrink: 'أدخل طعاماً أو شراباً', searchProduct: 'بحث...',
    paceLabel: 'الوتيرة', levelLabel: 'المستوى', speedSlow: 'بطيء', speedAverage: 'متوسط', speedFast: 'سريع',
    levelLight: 'خفيف', levelModerate: 'متوسط', levelHeavy: 'ثقيل',
    moments: { 'Ontbijt': 'إفطار', 'Ochtend Snack': 'وجبة خفيفة صباحية', 'Lunch': 'غداء', 'Middag Snack': 'وجبة خفيفة مسائية', 'Diner': 'عشاء', 'Avond Snack': 'وجبة قبل النوم' },
    tabs: { dashboard: 'الخطة', meals: 'التغذية', activity: 'النشاط', profile: 'أنا' }
  }
};
