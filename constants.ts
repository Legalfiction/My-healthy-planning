import { MealOption, ActivityType, MealMoment, Language } from './types';

export const MEAL_MOMENTS: MealMoment[] = [
  'Ontbijt',
  'Ochtend snack',
  'Lunch',
  'Middag snack',
  'Diner',
  'Avondsnack'
];

export const PRODUCT_TRANSLATIONS: Record<Language, Record<string, string>> = {
  nl: {
    d_water: 'Water (Bronwater)', d_koffie: 'Koffie (Zwart)', d_thee: 'Thee (Groen/Zwart)', d_melk_half: 'Melk (Halfvol)', d_melk_vol: 'Melk (Vol)', d_sap_vers: 'Sinaasappelsap (Vers)', d_cola_zero: 'Cola Zero',
    b_skyr: 'Skyr Natuur (IJslands)', b_griekse_yoghurt: 'Griekse Yoghurt (10%)', b_magere_kwark: 'Magere Kwark (Eiwitrijk)', b_havermout: 'Havermout (Pap)', b_muesli: 'Muesli (Vruchten)', b_granola: 'Granola (Honing)', b_crusli: 'Crusli (Chocolade)', b_volkoren_brood: 'Volkoren Brood', b_waldkorn_brood: 'Waldkorn Brood', b_spelt_brood: 'Spelt Brood', b_ei_gekookt: 'Ei (Gekookt, L)', b_banaan: 'Banaan (Gemiddeld)', b_appel: 'Appel (Elstar)', b_ontbijtkoek: 'Ontbijtkoek (Plak)', b_blauwe_bessen: 'Blauwe Bessen (Vers)', b_beschuit: 'Beschuit', b_knackebrod: 'Knäckebröd',
    l_soep_tomaat: 'Tomatensoep (Vers)', l_wrap_zalm: 'Wrap (Zalm & Roomkaas)', l_wrap_kip: 'Wrap (Kip & Avocado)', l_salade_caesar: 'Caesar Salade (Maaltijd)', l_uitsmijter: 'Uitsmijter (3 eieren)', l_tosti: 'Tosti (Ham/Kaas)', l_broodje_gezond: 'Broodje Gezond', l_krentenbol: 'Krentenbol',
    m_macaroni: 'Macaroni (Bolognese)', m_spaghetti: 'Spaghetti (Bolognese)', m_pizza_margherita: 'Pizza (Margherita)', m_hutspot: 'Hutspot (Klapstuk)', m_aardappel_gekookt: 'Aardappels (Gekookt)', m_aardappel_gebakken: 'Aardappels (Gebakken)', m_kip_filet: 'Kipfilet (Gebraden)', m_biefstuk: 'Biefstuk (Mager)', m_zalm: 'Zalmmoot (Gegrild)', m_broccoli: 'Broccoli (Gestoomd)', m_stamppot_boerenkool: 'Stamppot (Boerenkool)',
    act_wandelen_slow: 'Wandelen (Rustig)', act_wandelen_brisk: 'Wandelen (Stevig)', act_hardlopen_8: 'Hardlopen (8 km/u)', act_hardlopen_10: 'Hardlopen (10 km/u)', act_fietsen_rustig: 'Fietsen (Stads)', act_fietsen_tempo: 'Fietsen (Snel)', act_zwemmen: 'Zwemmen (Baantjes)', act_padel: 'Padel (Wedstrijd)', act_fitness: 'Fitness (Training)', act_voetbal: 'Voetbal (Training)', act_yoga: 'Yoga (Flow)', act_tuinieren: 'Tuinieren', act_schoonmaken: 'Schoonmaken', act_koken: 'Koken', act_dansen: 'Dansen', act_crossfit: 'Crossfit', act_boksen: 'Boksen', act_golf: 'Golf', act_hiken: 'Hiken', act_roeien: 'Roeien', act_skien: 'Skiën', act_schaatsen: 'Schaatsen', act_klimmen: 'Klimmen', act_squash: 'Squash', act_volleybal: 'Volleybal', act_badminton: 'Badminton', act_tafeltennis: 'Tafeltennis', act_basketbal: 'Basketbal', act_staan_werk: 'Staand werk', act_aerobics: 'Aerobics', act_pilates: 'Pilates', act_spinnen: 'Spinning', act_bootcamp: 'Bootcamp', act_wandelen_hond: 'Hond uitlaten', act_trap_lopen: 'Traplopen', act_klussen: 'Klussen', act_verhuizen: 'Verhuizen', act_paardrijden: 'Paardrijden'
  },
  en: {
    d_water: 'Water (Spring)', d_koffie: 'Coffee (Black)', d_thee: 'Tea (Green/Black)', d_melk_half: 'Milk (Semi-skimmed)', d_melk_vol: 'Milk (Whole)', d_sap_vers: 'Orange Juice (Fresh)', d_cola_zero: 'Cola Zero',
    b_skyr: 'Skyr (Icelandic)', b_griekse_yoghurt: 'Greek Yogurt (10%)', b_magere_kwark: 'Quark (High Protein)', b_havermout: 'Oats (Water)', b_muesli: 'Muesli (Fruit)', b_granola: 'Granola (Honey)', b_crusli: 'Crusli (Choco)', b_volkoren_brood: 'Whole Wheat Bread', b_waldkorn_brood: 'Waldkorn Bread', b_spelt_brood: 'Spelt Bread', b_ei_gekookt: 'Egg (Boiled, L)', b_banaan: 'Banana (Medium)', b_appel: 'Apple (Fresh)', b_ontbijtkoek: 'Gingerbread', b_blauwe_bessen: 'Blueberries (Fresh)', b_beschuit: 'Rusk', b_knackebrod: 'Crispbread',
    l_soep_tomaat: 'Tomato Soup', l_wrap_zalm: 'Salmon Wrap', l_wrap_kip: 'Chicken Wrap', l_salade_caesar: 'Caesar Salad', l_uitsmijter: 'Fried Eggs (3)', l_tosti: 'Grilled Cheese', l_broodje_gezond: 'Healthy Sub', l_krentenbol: 'Currant Bun',
    m_macaroni: 'Macaroni', m_spaghetti: 'Spaghetti', m_pizza_margherita: 'Pizza', m_hutspot: 'Carrot & Potato Mash', m_aardappel_gekookt: 'Potatoes (Boiled)', m_aardappel_gebakken: 'Potatoes (Fried)', m_kip_filet: 'Chicken Breast', m_biefstuk: 'Beef Steak', m_zalm: 'Salmon Fillet', m_broccoli: 'Broccoli', m_stamppot_boerenkool: 'Kale Mash',
    act_wandelen_slow: 'Walking (Casual)', act_wandelen_brisk: 'Walking (Fast)', act_hardlopen_8: 'Running (8 km/h)', act_hardlopen_10: 'Running (10 km/h)', act_fietsen_rustig: 'Cycling (Casual)', act_fietsen_tempo: 'Cycling (Fast)', act_zwemmen: 'Swimming', act_padel: 'Padel', act_fitness: 'Fitness', act_voetbal: 'Football', act_yoga: 'Yoga', act_tuinieren: 'Gardening', act_schoonmaken: 'Cleaning', act_koken: 'Cooking', act_dansen: 'Dancing', act_crossfit: 'Crossfit', act_boksen: 'Boxing', act_golf: 'Golf', act_hiken: 'Hiking', act_roeien: 'Rowing', act_skien: 'Skiing', act_schaatsen: 'Ice Skating', act_klimmen: 'Climbing', act_squash: 'Squash', act_volleybal: 'Volleyball', act_badminton: 'Badminton', act_tafeltennis: 'Table Tennis', act_basketbal: 'Basketball', act_staan_werk: 'Standing Work', act_aerobics: 'Aerobics', act_pilates: 'Pilates', act_spinnen: 'Spinning', act_bootcamp: 'Bootcamp', act_wandelen_hond: 'Walking Dog', act_trap_lopen: 'Stairs', act_klussen: 'DIY Work', act_verhuizen: 'Moving House', act_paardrijden: 'Horse Riding'
  },
  es: {
    d_water: 'Agua (Mineral)', d_koffie: 'Café (Solo)', d_thee: 'Té (Verde/Negro)', d_melk_half: 'Leche (Semidesnatada)', d_melk_vol: 'Leche (Entera)', d_sap_vers: 'Zumo de naranja (Natural)', d_cola_zero: 'Cola Zero',
    b_skyr: 'Skyr Natural', b_griekse_yoghurt: 'Yogur Griego (10%)', b_magere_kwark: 'Queso Quark (Alto en Proteínas)', b_havermout: 'Avena (Gachas)', b_muesli: 'Muesli (Frutas)', b_granola: 'Granola (Miel)', b_crusli: 'Cereales Crujientes (Chocolate)', b_volkoren_brood: 'Pan Integral', b_ei_gekookt: 'Huevo Cocido (L)', b_banaan: 'Plátano', b_appel: 'Manzana', b_ontbijtkoek: 'Bizcocho de Jengibre', b_blauwe_bessen: 'Arándanos (Frescos)', b_beschuit: 'Biscote', b_knackebrod: 'Pan Sueco Crujiente',
    l_soep_tomaat: 'Sopa de Tomate', l_wrap_zalm: 'Wrap de Salmón y Queso', l_wrap_kip: 'Wrap de Pollo y Aguacate', l_salade_caesar: 'Ensalada César', l_uitsmijter: 'Huevos Fritos con Pan (3)', l_tosti: 'Sándwich Mixto', l_broodje_gezond: 'Bocadillo Vegetal', l_krentenbol: 'Pan de Pasas',
    m_macaroni: 'Macarrones Boloñesa', m_spaghetti: 'Espaguetis Boloñesa', m_pizza_margherita: 'Pizza Margarita', m_hutspot: 'Puré de Zanahoria y Patata', m_aardappel_gekookt: 'Patatas Cocidas', m_aardappel_gebakken: 'Patatas Salteadas', m_kip_filet: 'Pechuga de Pollo', m_biefstuk: 'Bistec de Ternera', m_zalm: 'Salmón a la Plancha', m_broccoli: 'Brócoli al Vapor', m_stamppot_boerenkool: 'Puré de Col Rizada',
    act_wandelen_slow: 'Caminar (Lento)', act_wandelen_brisk: 'Caminar (Rápido)', act_hardlopen_8: 'Correr (8 km/h)', act_hardlopen_10: 'Correr (10 km/h)', act_fietsen_rustig: 'Ciclismo (Lento)', act_fietsen_tempo: 'Ciclismo (Rápido)', act_zwemmen: 'Natación', act_padel: 'Pádel', act_fitness: 'Gimnasio', act_voetbal: 'Fútbol', act_yoga: 'Yoga', act_tuinieren: 'Jardinería', act_schoonmaken: 'Limpieza', act_koken: 'Cocinar', act_dansen: 'Bailar', act_crossfit: 'Crossfit', act_boksen: 'Boxeo', act_golf: 'Golf', act_hiken: 'Senderismo', act_roeien: 'Remo', act_skien: 'Esquí', act_schaatsen: 'Patinaje', act_klimmen: 'Escalada', act_squash: 'Squash', act_volleybal: 'Voleibol', act_badminton: 'Bádminton', act_tafeltennis: 'Tenis de Mesa', act_basketbal: 'Baloncesto', act_staan_werk: 'Trabajo de Pie', act_aerobics: 'Aerobic', act_pilates: 'Pilates', act_spinnen: 'Spinning', act_bootcamp: 'Bootcamp', act_wandelen_hond: 'Pasear al Perro', act_trap_lopen: 'Subir Escaleras', act_klussen: 'Bricolaje', act_verhuizen: 'Mudanza', act_paardrijden: 'Equitación'
  },
  de: {
    d_water: 'Wasser (Mineralwasser)', d_koffie: 'Kaffee (Schwarz)', d_thee: 'Tee (Grün/Schwarz)', d_melk_half: 'Milch (Fettarm)', d_melk_vol: 'Vollmilch', d_sap_vers: 'Orangensaft (Frisch)', d_cola_zero: 'Cola Zero',
    b_skyr: 'Skyr Natur', b_griekse_yoghurt: 'Griechischer Joghurt (10%)', b_magere_kwark: 'Magerquark (Eiweißreich)', b_havermout: 'Haferflocken (Porridge)', b_muesli: 'Müsli (Früchte)', b_granola: 'Granola (Honig)', b_crusli: 'Knuspermüsli (Schoko)', b_volkoren_brood: 'Vollkornbrot', b_ei_gekookt: 'Gekochtes Ei (L)', b_banaan: 'Banane', b_appel: 'Apfel', b_ontbijtkoek: 'Gewürzkuchen', b_blauwe_bessen: 'Blaubeeren (Frisch)', b_beschuit: 'Zwieback', b_knackebrod: 'Knäckebrot',
    l_soep_tomaat: 'Tomatensuppe (Frisch)', l_wrap_zalm: 'Lachs-Wrap mit Frischkäse', l_wrap_kip: 'Hähnchen-Wrap mit Avocado', l_salade_caesar: 'Caesar Salad', l_uitsmijter: 'Strammer Max (3 Eier)', l_tosti: 'Schinken-Käse-Toast', l_broodje_gezond: 'Gesundes Brötchen', l_krentenbol: 'Rosinenbrötchen',
    m_macaroni: 'Makkaroni Bolognese', m_spaghetti: 'Spaghetti Bolognese', m_pizza_margherita: 'Pizza Margherita', m_hutspot: 'Möhren-Kartoffel-Stampf', m_aardappel_gekookt: 'Salzkartoffeln', m_aardappel_gebakken: 'Bratkartoffeln', m_kip_filet: 'Hähnchenbrustfilet', m_biefstuk: 'Rindersteak', m_zalm: 'Lachsfilet (Gegrillt)', m_broccoli: 'Brokkoli (Gedämpft)', m_stamppot_boerenkool: 'Grünkohl-Eintopf',
    act_wandelen_slow: 'Gehen (Langsam)', act_wandelen_brisk: 'Gehen (Schnell)', act_hardlopen_8: 'Laufen (8 km/h)', act_hardlopen_10: 'Laufen (10 km/h)', act_fietsen_rustig: 'Radfahren (Locker)', act_fietsen_tempo: 'Radfahren (Tempo)', act_zwemmen: 'Schwimmen', act_padel: 'Padel', act_fitness: 'Krafttraining', act_voetbal: 'Fußball', act_yoga: 'Yoga', act_tuinieren: 'Gartenarbeit', act_schoonmaken: 'Hausputz', act_koken: 'Koken', act_dansen: 'Tanzen', act_crossfit: 'Crossfit', act_boksen: 'Boxen', act_golf: 'Golf', act_hiken: 'Wandern', act_roeien: 'Rudern', act_skien: 'Skifahren', act_schaatsen: 'Eislaufen', act_klimmen: 'Klettern', act_squash: 'Squash', act_volleybal: 'Volleyball', act_badminton: 'Badminton', act_tafeltennis: 'Tischtennis', act_basketbal: 'Basketball', act_staan_werk: 'Stehende Arbeit', act_aerobics: 'Aerobic', act_pilates: 'Pilates', act_spinnen: 'Spinning', act_bootcamp: 'Bootcamp', act_wandelen_hond: 'Gassi gehen', act_trap_lopen: 'Treppensteigen', act_klussen: 'Heimwerken', act_verhuizen: 'Umzug', act_paardrijden: 'Reiten'
  },
  pt: {
    d_water: 'Água (Mineral)', d_koffie: 'Café (Preto)', d_thee: 'Chá (Verde/Preto)', d_melk_half: 'Leite (Meio-Gordo)', d_melk_vol: 'Leite (Gordo)', d_sap_vers: 'Sumo de Laranja (Natural)', d_cola_zero: 'Cola Zero',
    b_skyr: 'Skyr Natural', b_griekse_yoghurt: 'Iogurte Grego (10%)', b_magere_kwark: 'Queijo Quark (Proteico)', b_havermout: 'Aveia (Papas)', b_muesli: 'Muesli (Frutas)', b_granola: 'Granola (Mel)', b_crusli: 'Cereais Crocantes (Chocolate)', b_volkoren_brood: 'Pão Integral', b_ei_gekookt: 'Ovo Cozido (L)', b_banaan: 'Banana', b_appel: 'Maçã', b_ontbijtkoek: 'Bolo de Especiarias', b_blauwe_bessen: 'Mirtilos (Frescos)', b_beschuit: 'Tosta', b_knackebrod: 'Pão Crocante',
    l_soep_tomaat: 'Sopa de Tomate', l_wrap_zalm: 'Wrap de Salmão e Queijo', l_wrap_kip: 'Wrap de Frango e Abacate', l_salade_caesar: 'Salada Caesar', l_uitsmijter: 'Ovos com Pão (3)', l_tosti: 'Tosta Mista', l_broodje_gezond: 'Sanduíche Saudável', l_krentenbol: 'Pão de Passas',
    m_macaroni: 'Macarrão à Bolonhesa', m_spaghetti: 'Esparguete à Bolonhesa', m_pizza_margherita: 'Pizza Margherita', m_hutspot: 'Puré de Cenoura e Batata', m_aardappel_gekookt: 'Batatas Cozidas', m_aardappel_gebakken: 'Batatas Salteadas', m_kip_filet: 'Peito de Frango', m_biefstuk: 'Bife de Vaca', m_zalm: 'Salmão Grelhado', m_broccoli: 'Brócolos ao Vapor', m_stamppot_boerenkool: 'Puré de Couve e Batata',
    act_wandelen_slow: 'Caminhada (Lenta)', act_wandelen_brisk: 'Caminhada (Rápida)', act_hardlopen_8: 'Corrida (8 km/h)', act_hardlopen_10: 'Corrida (10 km/h)', act_fietsen_rustig: 'Ciclismo (Lazer)', act_fietsen_tempo: 'Ciclismo (Rápido)', act_zwemmen: 'Natação', act_padel: 'Padel', act_fitness: 'Musculação', act_voetbal: 'Futebol', act_yoga: 'Yoga', act_tuinieren: 'Jardinagem', act_schoonmaken: 'Limpeza', act_koken: 'Cozinhar', act_dansen: 'Dançar', act_crossfit: 'Crossfit', act_boksen: 'Boxe', act_golf: 'Golfe', act_hiken: 'Caminhada/Trilho', act_roeien: 'Remo', act_skien: 'Esqui', act_schaatsen: 'Patinagem', act_klimmen: 'Escalada', act_squash: 'Squash', act_volleybal: 'Voleibol', act_badminton: 'Badminton', act_tafeltennis: 'Ténis de Mesa', act_basketbal: 'Basquetebol', act_staan_werk: 'Trabalho de Pé', act_aerobics: 'Aeróbica', act_pilates: 'Pilates', act_spinnen: 'Spinning', act_bootcamp: 'Bootcamp', act_wandelen_hond: 'Pasear o Cão', act_trap_lopen: 'Subir Escadas', act_klussen: 'Bricolage', act_verhuizen: 'Mudança', act_paardrijden: 'Equitação'
  },
  zh: {
    d_water: '水 (矿泉水)', d_koffie: '咖啡 (黑咖啡)', d_thee: '茶 (绿茶/红茶)', d_melk_half: '牛奶 (低脂)', d_melk_vol: '牛奶 (全脂)', d_sap_vers: '橙汁 (鲜榨)', d_cola_zero: '无糖可乐',
    b_skyr: 'Skyr 酸奶 (冰岛)', b_griekse_yoghurt: '希腊酸奶 (10%)', b_magere_kwark: '低脂夸克干酪 (高蛋白)', b_havermout: '燕麦粥', b_muesli: '什锦早餐 (水果)', b_granola: '脆麦片 (蜂蜜)', b_crusli: '巧克力麦片', b_volkoren_brood: '全麦面包', b_ei_gekookt: '煮鸡蛋 (L)', b_banaan: '香蕉', b_appel: '苹果', b_ontbijtkoek: '姜饼', b_blauwe_bessen: '蓝莓 (新鲜)', b_beschuit: '脆饼', b_knackebrod: '脆面包',
    l_soep_tomaat: '番茄汤', l_wrap_zalm: '三文鱼奶酪卷饼', l_wrap_kip: '鸡肉牛油果卷饼', l_salade_caesar: '凯撒沙拉', l_uitsmijter: '煎蛋吐司 (3蛋)', l_tosti: '火腿奶酪三明治', l_broodje_gezond: '健康潜艇堡', l_krentenbol: '葡萄干小面包',
    m_macaroni: '意大利通心粉', m_spaghetti: '意大利面', m_pizza_margherita: '玛格丽特披萨', m_hutspot: '胡萝卜土豆泥', m_aardappel_gekookt: '煮土豆', m_aardappel_gebakken: '烤/炸土豆', m_kip_filet: '烤鸡胸肉', m_biefstuk: '牛排', m_zalm: '烤三文鱼', m_broccoli: '西兰花 (清蒸)', m_stamppot_boerenkool: '羽衣甘蓝土豆泥',
    act_wandelen_slow: '散步 (慢)', act_wandelen_brisk: '快走', act_hardlopen_8: '跑步 (8 km/h)', act_hardlopen_10: '跑步 (10 km/h)', act_fietsen_rustig: '骑行 (休闲)', act_fietsen_tempo: '骑行 (竞速)', act_zwemmen: '游泳', act_padel: '板网球', act_fitness: '健身/力量训练', act_voetbal: '足球', act_yoga: '瑜伽', act_tuinieren: '园艺', act_schoonmaken: '打扫卫生', act_koken: '烹饪', act_dansen: '舞蹈', act_crossfit: '混合健身 (Crossfit)', act_boksen: '拳击', act_golf: '高尔夫', act_hiken: '远足', act_roeien: '划船', act_skien: '滑雪', act_schaatsen: '溜冰', act_klimmen: '攀岩', act_squash: '壁球', act_volleybal: '排球', act_badminton: '羽毛球', act_tafeltennis: '乒乓球', act_basketbal: '篮球', act_staan_werk: '站立工作', act_aerobics: '有氧操', act_pilates: '普拉提', act_spinnen: '动感单车', act_bootcamp: '训练营', act_wandelen_hond: '遛狗', act_trap_lopen: '爬楼梯', act_klussen: '家政/修理', act_verhuizen: '搬家', act_paardrijden: '骑马'
  },
  ja: {
    d_water: '水 (ミネラルウォーター)', d_koffie: 'コーヒー (ブラック)', d_thee: '茶 (緑茶/紅茶)', d_melk_half: '牛乳 (低脂肪)', d_melk_vol: '牛乳 (全脂)', d_sap_vers: 'オレンジジュース (生搾り)', d_cola_zero: 'コーラ ゼロ',
    b_skyr: 'スキール (プレーン)', b_griekse_yoghurt: 'ギリシャヨーグルト (10%)', b_magere_kwark: 'クワルク (高タンパク)', b_havermout: 'オートミール', b_muesli: 'ミューズリー (フルーツ)', b_granola: 'グラノーラ (ハニー)', b_crusli: 'チョコグラノーラ', b_volkoren_brood: '全粒粉パン', b_ei_gekookt: 'ゆで卵 (L)', b_banaan: 'バナナ', b_appel: 'りんご', b_ontbijtkoek: 'ジンジャーブレッド', b_blauwe_bessen: 'ブルーベリー (生)', b_beschuit: 'ラスク', b_knackebrod: 'クリスプブレッド',
    l_soep_tomaat: 'トマトスープ (フレッシュ)', l_wrap_zalm: 'サーモンとチーズのラップ', l_wrap_kip: 'チキンとアボカドラップ', l_salade_caesar: 'シーザーサラダ', l_uitsmijter: '卵3個のフライパン焼き', l_tosti: 'ハムチーズホットサンド', l_broodje_gezond: 'ヘルシーサンド', l_krentenbol: 'レーズンパン',
    m_macaroni: 'マカロニ ボロネーゼ', m_spaghetti: 'スパゲッティ ボロネーゼ', m_pizza_margherita: 'ピザ マルゲリータ', m_hutspot: '人参とジャガイモのマッシュ', m_aardappel_gekookt: 'ゆでジャガイモ', m_aardappel_gebakken: 'フライドポテト', m_kip_filet: 'ローストチキン', m_biefstuk: '牛ステーキ', m_zalm: 'グリルサーモン', m_broccoli: 'ブロッコリー (蒸し)', m_stamppot_boerenkool: 'ケールとジャガイモのマッシュ',
    act_wandelen_slow: 'ウォーキング (ゆっくり)', act_wandelen_brisk: 'ウォーキング (速歩)', act_hardlopen_8: 'ランニング (8 km/h)', act_hardlopen_10: 'ランニング (10 km/h)', act_fietsen_rustig: 'サイクリング (街乗り)', act_fietsen_tempo: 'サイクリング (速い)', act_zwemmen: '水泳', act_padel: 'パデル', act_fitness: '筋トレ/フィットネス', act_voetbal: 'サッカー', act_yoga: 'ヨガ', act_tuinieren: 'ガーデニング', act_schoonmaken: '掃除', act_koken: '料理', act_dansen: 'ダンス', act_crossfit: 'クロスフィット', act_boksen: 'ボクシング', act_golf: 'ゴルフ', act_hiken: 'ハイキング', act_roeien: 'ローイング', act_skien: 'スキー', act_schaatsen: 'スケート', act_klimmen: 'クライミング', act_squash: 'スカッシュ', act_volleybal: 'バレーボール', act_badminton: 'バドミントン', act_tafeltennis: '卓球', act_basketbal: 'バスケットボール', act_staan_werk: '立ち仕事', act_aerobics: 'エアロビクス', act_pilates: 'ピラティス', act_spinnen: 'スピンバイク', act_bootcamp: 'ブートキャンプ', act_wandelen_hond: '犬の散歩', act_trap_lopen: '階段昇降', act_klussen: '日曜大工/修理', act_verhuizen: '引っ越し', act_paardrijden: '乗馬'
  },
  ko: {
    d_water: '물 (생수)', d_koffie: '커피 (블랙)', d_thee: '차 (녹차/홍차)', d_melk_half: '우유 (저지방)', d_melk_vol: '우유 (일반)', d_sap_vers: '오렌지 주스 (착즙)', d_cola_zero: '콜라 제로',
    b_skyr: '스키르 요거트 (플레인)', b_griekse_yoghurt: '그릭 요거트 (10%)', b_magere_kwark: '쿼크 치즈 (고단백)', b_havermout: '오트밀', b_muesli: '뮤즐리 (과일)', b_granola: '그래놀라 (꿀)', b_crusli: '초코 그래놀라', b_volkoren_brood: '통밀빵', b_ei_gekookt: '삶은 달걀 (L)', b_banaan: '바나나', b_appel: '사과', b_ontbijtkoek: '진저브레드', b_blauwe_bessen: '블루베리 (생)', b_beschuit: '러스크', b_knackebrod: '크리스프브레드',
    l_soep_tomaat: '토마토 수프 (신선)', l_wrap_zalm: '연어 치즈 랩', l_wrap_kip: '치킨 아보카도 랩', l_salade_caesar: '시저 샐러드', l_uitsmijter: '계란 프라이 3개와 빵', l_tosti: '햄치즈 토스트', l_broodje_gezond: '샌드위치 (야채 가득)', l_krentenbol: '건포도 빵',
    m_macaroni: '마카로니 볼로네제', m_spaghetti: '스파게티 볼로네제', m_pizza_margherita: '피자 마르게리타', m_hutspot: '당근 감자 매쉬', m_aardappel_gekookt: '삶은 감자', m_aardappel_gebakken: '구운 감자', m_kip_filet: '닭가슴살 구이', m_biefstuk: '소고기 스테이크', m_zalm: '연어 구이', m_broccoli: '브로콜리 (찜)', m_stamppot_boerenkool: '케일 감자 매쉬',
    act_wandelen_slow: '걷기 (천천히)', act_wandelen_brisk: '걷기 (빠르게)', act_hardlopen_8: '러닝 (8 km/h)', act_hardlopen_10: '러닝 (10 km/h)', act_fietsen_rustig: '자전거 (일상)', act_fietsen_tempo: '자전거 (빠르게)', act_zwemmen: '수영', act_padel: '파델', act_fitness: '웨이트 트레이닝', act_voetbal: '축구', act_yoga: '요가', act_tuinieren: '정원 가꾸기', act_schoonmaken: '집안일/청소', act_koken: '요리하기', act_dansen: '댄스', act_crossfit: '크로스핏', act_boksen: '복싱', act_golf: '골프', act_hiken: '하이킹', act_roeien: '로잉', act_skien: '스키', act_schaatsen: '스케이트', act_klimmen: '클라이밍', act_squash: '스쿼시', act_volleybal: '배구', act_badminton: '배드민턴', act_tafeltennis: '탁구', act_basketbal: '농구', act_staan_werk: '서서 일하기', act_aerobics: '에어로빅', act_pilates: '필라테스', act_spinnen: '스피닝', act_bootcamp: '부트캠프', act_wandelen_hond: '강아지 산책', act_trap_lopen: '계단 오르기', act_klussen: '집수리/조립', act_verhuizen: '이사하기', act_paardrijden: '승마'
  },
  hi: {
    d_water: 'पानी (मिनरल)', d_koffie: 'कॉफी (ब्लैक)', d_thee: 'चाय (ग्रीन/ब्लैक)', d_melk_half: 'दूध (कम वसा)', d_melk_vol: 'दूध (फुल क्रीम)', d_sap_vers: 'संतरे का जूस (ताज़ा)', d_cola_zero: 'कोला ज़ीरो',
    b_skyr: 'स्कीर दही', b_griekse_yoghurt: 'ग्रीक योगर्ट (10%)', b_magere_kwark: 'क्वारक पनीर (प्रोटीन)', b_havermout: 'ओट्स (दलिया)', b_muesli: 'मूसली (फल)', b_granola: 'ग्रानोला (शहद)', b_crusli: 'चोको ग्रानोला', b_volkoren_brood: 'होल व्हीट ब्रेड', b_ei_gekookt: 'उबला हुआ अंडा (L)', b_banaan: 'केला', b_appel: 'सेब', b_ontbijtkoek: 'केक (अदरक)', b_blauwe_bessen: 'ब्लूबेरी (ताज़ा)', b_beschuit: 'रस्क', b_knackebrod: 'क्रिस्प ब्रेड',
    l_soep_tomaat: 'टमाटर का सूप', l_wrap_zalm: 'सैल्मन और पनीर रैप', l_wrap_kip: 'चिकन और एवोकैዶ रैप', l_salade_caesar: 'सीज़र सलाद', l_uitsmijter: 'अंडा और ब्रेड (3 अंडे)', l_tosti: 'ग्रिल्ड सैंडविच', l_broodje_gezond: 'हेल्दी सैंडविच', l_krentenbol: 'किशमिश वाली बन',
    m_macaroni: 'मैकरोनी बोलोग्नीज़', m_spaghetti: 'स्पेगेटी बोलोग्नीज़', m_pizza_margherita: 'पिज़्ज़ा मार्गेरिटा', m_hutspot: 'गाजर और आलू का भर्ता', m_aardappel_gekookt: 'उबले हुए आलू', m_aardappel_gebakken: 'पके हुए आलू', m_kip_filet: 'रोस्ट चिकन', m_biefstuk: 'बीफ स्टेक', m_zalm: 'ग्रिल्ड सैल्मन', m_broccoli: 'ब्रोकोली (उबली)', m_stamppot_boerenkool: 'केल और आलू का भर्ता',
    act_wandelen_slow: 'पैदल चलना (धीरे)', act_wandelen_brisk: 'तेज़ चलना', act_hardlopen_8: 'दौड़ना (8 km/h)', act_hardlopen_10: 'दौड़ना (10 km/h)', act_fietsen_rustig: 'साइकिलिंग (धीरे)', act_fietsen_tempo: 'साइकिलिंग (तेज़)', act_zwemmen: 'तैरना', act_padel: 'पैडल', act_fitness: 'जिम/कसरत', act_voetbal: 'फुटबॉल', act_yoga: 'योग', act_tuinieren: 'बागवानी', act_schoonmaken: 'सफाई', act_koken: 'खाना बनाना', act_dansen: 'डांस', act_crossfit: 'क्रॉसफ़िट', act_boksen: 'बॉक्सिंग', act_golf: 'गोल्फ', act_hiken: 'हाइकिंग', act_roeien: 'रोइंग', act_skien: 'स्कीइंग', act_schaatsen: 'स्केटिंग', act_klimmen: 'क्लाइम्बिंग', act_squash: 'स्क्वैश', act_volleybal: 'वॉलीबॉल', act_badminton: 'बैडमिंटन', act_tafeltennis: 'टेबल टेनिस', act_basketbal: 'बास्केटबॉल', act_staan_werk: 'खड़े होकर काम', act_aerobics: 'एरोबिक्स', act_pilates: 'पिलेट्स', act_spinnen: 'स्पिनिंग', act_bootcamp: 'बूटकैंप', act_wandelen_hond: 'कुत्ते को घुमाना', act_trap_lopen: 'सीढ़ियां चढ़ना', act_klussen: 'मरम्मत/काम', act_verhuizen: 'सामान शिफ्ट करना', act_paardrijden: 'घुड़सवारी'
  },
  ar: {
    d_water: 'ماء (معدنية)', d_koffie: 'قهوة (سوداء)', d_thee: 'شاي (أخضر/أسود)', d_melk_half: 'حليب (نصف دسم)', d_melk_vol: 'حليب (كامل الدسم)', d_sap_vers: 'عصير برتقال (طازج)', d_cola_zero: 'كولا زيرو',
    b_skyr: 'زبادي سكير طبيعي', b_griekse_yoghurt: 'زبادي يوناني (10%)', b_magere_kwark: 'جبنة كوارك (عالية البروتين)', b_havermout: 'عصيدة الشوفان', b_muesli: 'موسلي (فواكه)', b_granola: 'جرانولا (عسل)', b_crusli: 'حبوب مقرمشة (شوكولاتة)', b_volkoren_brood: 'خبز القمح الكامل', b_ei_gekookt: 'بيضة مسلوقة (L)', b_banaan: 'موز', b_appel: 'تفاح', b_ontbijtkoek: 'كيك التوابل', b_blauwe_bessen: 'توت أزرق (طازج)', b_beschuit: 'بقسماط', b_knackebrod: 'خبز مقرمش',
    l_soep_tomaat: 'شوربة طماطم طازجة', l_wrap_zalm: 'لفافة سلمون وجبنة كريمية', l_wrap_kip: 'لفافة دجاج وأفوكادو', l_salade_caesar: 'سلطة سيزر', l_uitsmijter: 'بيض مقلي مع خبز (3 بيضات)', l_tosti: 'توست جبن وحبش', l_broodje_gezond: 'ساندوتش صحي', l_krentenbol: 'خبز بالزبيب',
    m_macaroni: 'معكرونة بولونيز', m_spaghetti: 'سباغيتي بولونيز', m_pizza_margherita: 'بيتزا مارغريتا', m_hutspot: 'مهروس الجزر والبطاطس', m_aardappel_gekookt: 'بطاطس مسلوقة', m_aardappel_gebakken: 'بطاطس مقلية/مشوية', m_kip_filet: 'صدر دجاج مشوي', m_biefstuk: 'ستيك لحم بقري', m_zalm: 'سلمون مشوي', m_broccoli: 'بروكلي (على البخار)', m_stamppot_boerenkool: 'مهروس الكرنب والبطاطس',
    act_wandelen_slow: 'مشي (بطيء)', act_wandelen_brisk: 'مشي سريع', act_hardlopen_8: 'جري (8 كم/ساعة)', act_hardlopen_10: 'جري (10 كم/ساعة)', act_fietsen_rustig: 'ركوب دراجة (عادي)', act_fietsen_tempo: 'ركوب دراجة (سريع)', act_zwemmen: 'سباحة', act_padel: 'بادل', act_fitness: 'تمارين لياقة/قوة', act_voetbal: 'كرة قدم', act_yoga: 'يوغا', act_tuinieren: 'بستنة', act_schoonmaken: 'تنظيف المنزل', act_koken: 'طبخ', act_dansen: 'رقص', act_crossfit: 'كروس فيت', act_boksen: 'ملاكمة', act_golf: 'غولف', act_hiken: 'تنزه/هيكنج', act_roeien: 'تجديف', act_skien: 'تزلج', act_schaatsen: 'تزلج على الجليد', act_klimmen: 'تسلق', act_squash: 'اسكواش', act_volleybal: 'كرة طائرة', act_badminton: 'ريشة طائرة', act_tafeltennis: 'تنس طاولة', act_basketbal: 'كرة سلة', act_staan_werk: 'عمل واقفاً', act_aerobics: 'أيروبيكس', act_pilates: 'بيلاتس', act_spinnen: 'سبينينج', act_bootcamp: 'بوت كامب', act_wandelen_hond: 'تمشية الكلب', act_trap_lopen: 'صعود الدرج', act_klussen: 'أعمال يدوية/تصليح', act_verhuizen: 'نقل أثاث', act_paardrijden: 'ركوب خيل'
  }
};

const COMMON_DRINKS: MealOption[] = [
  { id: 'd_water', name: 'Water', kcal: 0, isDrink: true, unitName: '250 ML' },
  { id: 'd_koffie', name: 'Koffie (Zwart)', kcal: 2, isDrink: true, unitName: '200 ML' },
  { id: 'd_thee', name: 'Thee (Zonder suiker)', kcal: 2, isDrink: true, unitName: '200 ML' },
  { id: 'd_melk_half', name: 'Melk (Halfvol)', kcal: 115, isDrink: true, unitName: '250 ML' },
  { id: 'd_sap_vers', name: 'Sinaasappelsap (Vers)', kcal: 115, isDrink: true, unitName: '250 ML' },
  { id: 'd_cola_zero', name: 'Cola Zero', kcal: 0, isDrink: true, unitName: '250 ML' },
];

export const MEAL_OPTIONS: Record<MealMoment, MealOption[]> = {
  'Ontbijt': [
    ...COMMON_DRINKS,
    { id: 'b_skyr', name: 'Skyr Natuur', kcal: 95, unitName: '150G' },
    { id: 'b_griekse_yoghurt', name: 'Griekse Yoghurt (10%)', kcal: 180, unitName: '150G' },
    { id: 'b_magere_kwark', name: 'Magere Kwark', kcal: 140, unitName: '250G' },
    { id: 'b_havermout', name: 'Havermout (Water)', kcal: 130, unitName: '200G' },
    { id: 'b_muesli', name: 'Muesli Natuur', kcal: 145, unitName: '40G' },
    { id: 'b_granola', name: 'Granola (Krokant)', kcal: 190, unitName: '40G' },
    { id: 'b_crusli', name: 'Crusli Chocolade', kcal: 210, unitName: '45G' },
    { id: 'b_volkoren_brood', name: 'Volkoren Brood', kcal: 80, unitName: '1 SNEE (35G)' },
    { id: 'b_ei_gekookt', name: 'Ei (Gekookt)', kcal: 75, unitName: '1 STUK (50G)' },
    { id: 'b_banaan', name: 'Banaan', kcal: 105, unitName: '1 STUK (100G)' },
  ],
  'Ochtend snack': [
    ...COMMON_DRINKS,
    { id: 'b_ontbijtkoek', name: 'Ontbijtkoek', kcal: 65, unitName: '1 PLAK (30G)' },
    { id: 'b_appel', name: 'Appel', kcal: 60, unitName: '1 STUK (100G)' },
    { id: 'b_blauwe_bessen', name: 'Blauwe bessen', kcal: 50, unitName: '100G' },
  ],
  'Lunch': [
    ...COMMON_DRINKS,
    { id: 'l_soep_tomaat', name: 'Tomatensoep', kcal: 80, unitName: '1 KOM (250ML)' },
    { id: 'l_wrap_zalm', name: 'Wrap met Zalm', kcal: 320, unitName: '1 STUK (150G)' },
    { id: 'l_wrap_kip', name: 'Wrap met Kip', kcal: 300, unitName: '1 STUK (150G)' },
    { id: 'l_salade_caesar', name: 'Caesar Salade', kcal: 450, unitName: '1 MAALTIJD (350G)' },
    { id: 'l_uitsmijter', name: 'Uitsmijter (3 eieren)', kcal: 480, unitName: '1 BORD' },
    { id: 'l_tosti', name: 'Tosti Ham/Kaas', kcal: 260, unitName: '1 STUK (120G)' },
    { id: 'l_broodje_gezond', name: 'Broodje Gezond', kcal: 380, unitName: '1 STUK (200G)' },
  ],
  'Middag snack': [
    ...COMMON_DRINKS,
    { id: 'b_beschuit', name: 'Beschuit', kcal: 40, unitName: '1 STUK' },
    { id: 'b_knackebrod', name: 'Knäckebröd', kcal: 35, unitName: '1 STUK' },
  ],
  'Diner': [
    ...COMMON_DRINKS,
    { id: 'm_macaroni', name: 'Macaroni Bolognese', kcal: 650, unitName: '1 BORD (450G)' },
    { id: 'm_spaghetti', name: 'Spaghetti Bolognese', kcal: 700, unitName: '1 BORD (450G)' },
    { id: 'm_pizza_margherita', name: 'Pizza Margherita', kcal: 850, unitName: '1 STUK (350G)' },
    { id: 'm_hutspot', name: 'Hutspot met klapstuk', kcal: 550, unitName: '1 BORD (500G)' },
    { id: 'm_aardappel_gekookt', name: 'Aardappels (Gekookt)', kcal: 120, unitName: '150G' },
    { id: 'm_aardappel_gebakken', name: 'Aardappels (Gebakken)', kcal: 240, unitName: '150G' },
    { id: 'm_kip_filet', name: 'Kipfilet (Gebraden)', kcal: 165, unitName: '100G' },
    { id: 'm_biefstuk', name: 'Biefstuk', kcal: 180, unitName: '100G' },
    { id: 'm_zalm', name: 'Zalmmoot', kcal: 200, unitName: '100G' },
    { id: 'm_broccoli', name: 'Broccoli', kcal: 50, unitName: '150G' },
    { id: 'm_stamppot_boerenkool', name: 'Stamppot Boerenkool', kcal: 500, unitName: '1 BORD (500G)' },
  ],
  'Avondsnack': [
    ...COMMON_DRINKS,
    { id: 'b_ontbijtkoek', name: 'Ontbijtkoek', kcal: 65, unitName: '1 PLAK (30G)' },
  ],
};

export const ACTIVITY_TYPES: ActivityType[] = [
  { id: 'act_wandelen_slow', name: 'Wandelen (Rustig)', met: 3.5, unit: 'minuten' },
  { id: 'act_wandelen_brisk', name: 'Wandelen (Stevig)', met: 4.5, unit: 'minuten' },
  { id: 'act_hardlopen_8', name: 'Hardlopen (8 km/u)', met: 8.3, unit: 'minuten' },
  { id: 'act_hardlopen_10', name: 'Hardlopen (10 km/u)', met: 10.0, unit: 'minuten' },
  { id: 'act_fietsen_rustig', name: 'Fietsen (Stads)', met: 6.0, unit: 'minuten' },
  { id: 'act_fietsen_tempo', name: 'Fietsen (Snel)', met: 10.0, unit: 'minuten' },
  { id: 'act_zwemmen', name: 'Zwemmen (Baantjes)', met: 6.0, unit: 'minuten' },
  { id: 'act_padel', name: 'Padel (Wedstrijd)', met: 8.0, unit: 'minuten' },
  { id: 'act_fitness', name: 'Fitness (Krachttraining)', met: 5.0, unit: 'minuten' },
  { id: 'act_voetbal', name: 'Voetbal (Training)', met: 8.0, unit: 'minuten' },
  { id: 'act_yoga', name: 'Yoga (Vinyasa)', met: 3.3, unit: 'minuten' },
  { id: 'act_tuinieren', name: 'Tuinieren', met: 4.0, unit: 'minuten' },
  { id: 'act_schoonmaken', name: 'Schoonmaken', met: 3.5, unit: 'minuten' },
  { id: 'act_koken', name: 'Koken', met: 2.0, unit: 'minuten' },
  { id: 'act_dansen', name: 'Dansen', met: 4.8, unit: 'minuten' },
  { id: 'act_crossfit', name: 'Crossfit', met: 12.0, unit: 'minuten' },
  { id: 'act_boksen', name: 'Boksen', met: 9.0, unit: 'minuten' },
  { id: 'act_golf', name: 'Golf (Lopen)', met: 4.8, unit: 'minuten' },
  { id: 'act_hiken', name: 'Hiken', met: 7.0, unit: 'minuten' },
  { id: 'act_roeien', name: 'Roeien', met: 7.0, unit: 'minuten' },
  { id: 'act_skien', name: 'Skiën', met: 6.0, unit: 'minuten' },
  { id: 'act_schaatsen', name: 'Schaatsen', met: 7.0, unit: 'minuten' },
  { id: 'act_klimmen', name: 'Klimmen', met: 8.0, unit: 'minuten' },
  { id: 'act_squash', name: 'Squash', met: 12.0, unit: 'minuten' },
  { id: 'act_volleybal', name: 'Volleybal', met: 4.0, unit: 'minuten' },
  { id: 'act_badminton', name: 'Badminton', met: 4.5, unit: 'minuten' },
  { id: 'act_tafeltennis', name: 'Tafeltennis', met: 4.0, unit: 'minuten' },
  { id: 'act_basketbal', name: 'Basketbal', met: 8.0, unit: 'minuten' },
  { id: 'act_staan_werk', name: 'Staand werk', met: 1.5, unit: 'minuten' },
  { id: 'act_aerobics', name: 'Aerobics', met: 7.3, unit: 'minuten' },
  { id: 'act_pilates', name: 'Pilates', met: 3.0, unit: 'minuten' },
  { id: 'act_spinnen', name: 'Spinning', met: 8.5, unit: 'minuten' },
  { id: 'act_bootcamp', name: 'Bootcamp', met: 10.0, unit: 'minuten' },
  { id: 'act_wandelen_hond', name: 'Hond uitlaten', met: 3.0, unit: 'minuten' },
  { id: 'act_trap_lopen', name: 'Traplopen', met: 8.0, unit: 'minuten' },
  { id: 'act_klussen', name: 'Klussen', met: 4.5, unit: 'minuten' },
  { id: 'act_verhuizen', name: 'Verhuizen', met: 7.0, unit: 'minuten' },
  { id: 'act_paardrijden', name: 'Paardrijden', met: 4.5, unit: 'minuten' }
];

export const KCAL_PER_KG_FAT = 7700;
