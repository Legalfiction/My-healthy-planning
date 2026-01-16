
import { MealOption, ActivityType, MealMoment, Language } from './types';

export const MEAL_MOMENTS: MealMoment[] = [
  'Ontbijt',
  'Ochtend Snack',
  'Lunch',
  'Middag Snack',
  'Diner',
  'Avond Snack'
];

export const PRODUCT_TRANSLATIONS: Record<Language, Record<string, string>> = {
  nl: {
    // Drinken
    d_water: 'Water (Plat/Bruis)', d_water_citroen: 'Water met Citroen', d_water_munt: 'Water met Munt', d_cola_zero: 'Cola Zero', d_pepsi_max: 'Pepsi Max', d_fanta_zero: 'Fanta Orange Zero', d_sprite_zero: 'Sprite Zero', d_icetea_green_zero: 'Ice Tea Green Zero', d_rivella: 'Rivella Original', d_spa_touch: 'Spa Touch Lemon', d_koffie: 'Koffie (Zwart)', d_espresso: 'Espresso', d_americano: 'Americano', d_thee_groen: 'Groene Thee', d_thee_zwart: 'Zwarte Thee', d_thee_kruiden: 'Kruidenthee', d_verse_munt: 'Verse Muntthee', d_gemberthee: 'Verse Gemberthee', d_melk_mager: 'Magere Melk', d_melk_half: 'Halfvolle Melk', d_melk_soja: 'Sojamelk (Ongezoet)', d_melk_amandel: 'Amandelmelk (Ongezoet)', d_melk_haver: 'Havermelk (Ongezoet)', d_eiwitshake_water: 'Eiwitshake (Water)', d_eiwitshake_melk: 'Eiwitshake (Melk)', d_bouillon: 'Bouillon', d_sinaasappelsap: 'Sinaasappelsap', d_appelsap: 'Appelsap', d_tomatensap: 'Tomatensap', d_limonade_zero: 'Limonade Zero',
    // Alcohol
    a_bier_pils: 'Bier (Pils)', a_bier_speciaal: 'Speciaalbier', a_wijn_rood: 'Rode Wijn', a_wijn_wit_droog: 'Witte Wijn (Droog)', a_gin_tonic: 'Gin Tonic', a_whiskey: 'Whiskey',
    // Ontbijt
    b_skyr: 'Skyr Natuur', b_griekse_yoghurt: 'Griekse Yoghurt (10%)', b_magere_kwark: 'Magere Kwark', b_havermout: 'Havermout (Water)', b_volkoren_brood: 'Volkoren Brood', b_ei_gekookt: 'Ei (Gekookt)',
    // Activiteiten
    act_wandelen_slow: 'Wandelen (Rustig)', act_hardlopen_8: 'Hardlopen (8 km/u)', act_fietsen_rustig: 'Fietsen (Stads)', act_zwemmen: 'Zwemmen (Baantjes)', act_fitness: 'Fitness',
    // Snacks
    s_amandelen: 'Amandelen', s_pure_choco: 'Pure Chocolade (85%)', f_appel: 'Appel', f_banaan: 'Banaan'
  },
  en: {
    d_water: 'Water (Still/Sparkling)', d_water_citroen: 'Water with Lemon', d_water_munt: 'Water with Mint', d_cola_zero: 'Cola Zero', d_pepsi_max: 'Pepsi Max', d_fanta_zero: 'Fanta Orange Zero', d_sprite_zero: 'Sprite Zero', d_icetea_green_zero: 'Ice Tea Green Zero', d_rivella: 'Rivella Original', d_spa_touch: 'Spa Touch Lemon', d_koffie: 'Coffee (Black)', d_espresso: 'Espresso', d_americano: 'Americano', d_thee_groen: 'Green Tea', d_thee_zwart: 'Black Tea', d_thee_kruiden: 'Herbal Tea', d_verse_munt: 'Fresh Mint Tea', d_gemberthee: 'Fresh Ginger Tea', d_melk_mager: 'Skimmed Milk', d_melk_half: 'Semi-skimmed Milk', d_melk_soja: 'Soy Milk (Unsweetened)', d_melk_amandel: 'Almond Milk (Unsweetened)', d_melk_haver: 'Oat Milk (Unsweetened)', d_eiwitshake_water: 'Protein Shake (Water)', d_eiwitshake_melk: 'Protein Shake (Milk)', d_bouillon: 'Broth', d_sinaasappelsap: 'Orange Juice', d_appelsap: 'Apple Juice', d_tomatensap: 'Tomato Juice', d_limonade_zero: 'Lemonade Zero',
    a_bier_pils: 'Beer (Pilsner)', a_bier_speciaal: 'Craft Beer', a_wijn_rood: 'Red Wine', a_wijn_wit_droog: 'White Wine (Dry)', a_gin_tonic: 'Gin Tonic', a_whiskey: 'Whiskey',
    b_skyr: 'Skyr Natural', b_griekse_yoghurt: 'Greek Yogurt (10%)', b_magere_kwark: 'Low-fat Quark', b_havermout: 'Oatmeal (Water)', b_volkoren_brood: 'Whole Wheat Bread', b_ei_gekookt: 'Egg (Boiled)',
    act_wandelen_slow: 'Walking (Slow)', act_hardlopen_8: 'Running (8 km/h)', act_fietsen_rustig: 'Cycling (City)', act_zwemmen: 'Swimming (Laps)', act_fitness: 'Fitness',
    s_amandelen: 'Almonds', s_pure_choco: 'Dark Chocolate (85%)', f_appel: 'Apple', f_banaan: 'Banana'
  },
  es: {
    d_water: 'Agua (Sin gas/Con gas)', d_water_citroen: 'Agua con Limón', d_water_munt: 'Agua con Menta', d_cola_zero: 'Cola Zero', d_pepsi_max: 'Pepsi Max', d_fanta_zero: 'Fanta Orange Zero', d_sprite_zero: 'Sprite Zero', d_icetea_green_zero: 'Té helado Green Zero', d_rivella: 'Rivella Original', d_spa_touch: 'Spa Touch Limón', d_koffie: 'Café (Solo)', d_espresso: 'Expreso', d_americano: 'Americano', d_thee_groen: 'Té Verde', d_thee_zwart: 'Té Negro', d_thee_kruiden: 'Infusión de hierbas', d_verse_munt: 'Té de Menta fresca', d_gemberthee: 'Té de Jengibre fresco', d_melk_mager: 'Leche Desnatada', d_melk_half: 'Leche Semidesnatada', d_melk_soja: 'Leche de Soja (Sin azúcar)', d_melk_amandel: 'Leche de Almendras (Sin azúcar)', d_melk_haver: 'Leche de Avena (Sin azúcar)', d_eiwitshake_water: 'Batido de Proteínas (Agua)', d_eiwitshake_melk: 'Batido de Proteínas (Leche)', d_bouillon: 'Caldo', d_sinaasappelsap: 'Zumo de Naranja', d_appelsap: 'Zumo de Manzana', d_tomatensap: 'Zumo de Tomate', d_limonade_zero: 'Limonada Zero',
    a_bier_pils: 'Cerveza (Pilsen)', a_bier_speciaal: 'Cerveza Artesana', a_wijn_rood: 'Vino Tinto', a_wijn_wit_droog: 'Vino Blanco (Seco)', a_gin_tonic: 'Gin Tonic', a_whiskey: 'Whisky',
    b_skyr: 'Skyr Natural', b_griekse_yoghurt: 'Yogur Griego (10%)', b_magere_kwark: 'Queso Quark Desnatado', b_havermout: 'Avena (Agua)', b_volkoren_brood: 'Pan Integral', b_ei_gekookt: 'Huevo (Cocido)',
    act_wandelen_slow: 'Caminar (Lento)', act_hardlopen_8: 'Correr (8 km/h)', act_fietsen_rustig: 'Ciclismo (Ciudad)', act_zwemmen: 'Natación (Laps)', act_fitness: 'Fitness',
    s_amandelen: 'Almendras', s_pure_choco: 'Chocolate Negro (85%)', f_appel: 'Manzana', f_banaan: 'Plátano'
  },
  de: {
    d_water: 'Wasser (Still/Sprudel)', d_water_citroen: 'Wasser mit Zitrone', d_water_munt: 'Wasser mit Minze', d_cola_zero: 'Cola Zero', d_pepsi_max: 'Pepsi Max', d_fanta_zero: 'Fanta Orange Zero', d_sprite_zero: 'Sprite Zero', d_icetea_green_zero: 'Eistee Green Zero', d_rivella: 'Rivella Original', d_spa_touch: 'Spa Touch Zitrone', d_koffie: 'Kaffee (Schwarz)', d_espresso: 'Espresso', d_americano: 'Americano', d_thee_groen: 'Grüner Tee', d_thee_zwart: 'Schwarzer Tee', d_thee_kruiden: 'Kräutertee', d_verse_munt: 'Frischer Minztee', d_gemberthee: 'Frischer Ingwertee', d_melk_mager: 'Magermilch', d_melk_half: 'Fettarme Milch', d_melk_soja: 'Sojamilch (Ungesüßt)', d_melk_amandel: 'Mandelmilch (Ungesüßt)', d_melk_haver: 'Hafermilch (Ungesüßt)', d_eiwitshake_water: 'Eiweißshake (Wasser)', d_eiwitshake_melk: 'Eiweißshake (Milch)', d_bouillon: 'Brühe', d_sinaasappelsap: 'Orangensaft', d_appelsap: 'Apfelsaft', d_tomatensap: 'Tomatensaft', d_limonade_zero: 'Limonade Zero',
    a_bier_pils: 'Bier (Pils)', a_bier_speciaal: 'Spezialbier', a_wijn_rood: 'Rotwein', a_wijn_wit_droog: 'Weißwein (Trocken)', a_gin_tonic: 'Gin Tonic', a_whiskey: 'Whisky',
    b_skyr: 'Skyr Natur', b_griekse_yoghurt: 'Griechischer Joghurt (10%)', b_magere_kwark: 'Magerquark', b_havermout: 'Haferflocken (Wasser)', b_volkoren_brood: 'Vollkornbrot', b_ei_gekookt: 'Ei (Gekocht)',
    act_wandelen_slow: 'Gehen (Langsam)', act_hardlopen_8: 'Laufen (8 km/h)', act_fietsen_rustig: 'Radfahren (Stadt)', act_zwemmen: 'Schwimmen', act_fitness: 'Fitness',
    s_amandelen: 'Mandeln', s_pure_choco: 'Zartbitterschokolade (85%)', f_appel: 'Apfel', f_banaan: 'Banane'
  },
  pt: {
    d_water: 'Água (Lisa/Gás)', d_water_citroen: 'Água com Limão', d_water_munt: 'Água com Hortelã', d_cola_zero: 'Cola Zero', d_pepsi_max: 'Pepsi Max', d_fanta_zero: 'Fanta Orange Zero', d_sprite_zero: 'Sprite Zero', d_icetea_green_zero: 'Ice Tea Green Zero', d_rivella: 'Rivella Original', d_spa_touch: 'Spa Touch Limão', d_koffie: 'Café (Preto)', d_espresso: 'Espresso', d_americano: 'Americano', d_thee_groen: 'Chá Verde', d_thee_zwart: 'Chá Preto', d_thee_kruiden: 'Infusão de ervas', d_verse_munt: 'Chá de Hortelã fresca', d_gemberthee: 'Chá de Gengibre fresco', d_melk_mager: 'Leite Magro', d_melk_half: 'Leite Meio-gordo', d_melk_soja: 'Leite de Soja (Sem açúcar)', d_melk_amandel: 'Leite de Amêndoa (Sem açúcar)', d_melk_haver: 'Leite de Aveia (Sem açúcar)', d_eiwitshake_water: 'Batido de Proteína (Água)', d_eiwitshake_melk: 'Batido de Proteína (Leite)', d_bouillon: 'Caldo', d_sinaasappelsap: 'Sumo de Laranja', d_appelsap: 'Sumo de Maçã', d_tomatensap: 'Sumo de Tomate', d_limonade_zero: 'Limonada Zero',
    a_bier_pils: 'Cerveja (Pilsen)', a_bier_speciaal: 'Cerveja Artesanal', a_wijn_rood: 'Vinho Tinto', a_wijn_wit_droog: 'Vinho Branco (Seco)', a_gin_tonic: 'Gin Tonic', a_whiskey: 'Whisky',
    b_skyr: 'Skyr Natural', b_griekse_yoghurt: 'Iogurte Grego (10%)', b_magere_kwark: 'Queijo Quark Magro', b_havermout: 'Aveia (Água)', b_volkoren_brood: 'Pão Integral', b_ei_gekookt: 'Ovo (Cozido)',
    act_wandelen_slow: 'Caminhar (Lento)', act_hardlopen_8: 'Correr (8 km/h)', act_fietsen_rustig: 'Ciclismo (Cidade)', act_zwemmen: 'Natação', act_fitness: 'Fitness',
    s_amandelen: 'Amêndoas', s_pure_choco: 'Chocolate Negro (85%)', f_appel: 'Maçã', f_banaan: 'Banana'
  },
  zh: {
    d_water: '水（静止/气泡）', d_water_citroen: '柠檬水', d_water_munt: '薄荷水', d_cola_zero: '零度可乐', d_pepsi_max: '极度百事', d_fanta_zero: '零度芬达', d_sprite_zero: '零度雪碧', d_icetea_green_zero: '零度绿茶冰茶', d_rivella: '瑞维拉', d_spa_touch: 'Spa柠檬水', d_koffie: '黑咖啡', d_espresso: '浓缩咖啡', d_americano: '美式咖啡', d_thee_groen: '绿茶', d_thee_zwart: '红茶', d_thee_kruiden: '草本茶', d_verse_munt: '新鲜薄荷茶', d_gemberthee: '新鲜姜茶', d_melk_mager: '脱脂牛奶', d_melk_half: '低脂牛奶', d_melk_soja: '无糖豆奶', d_melk_amandel: '无糖杏仁奶', d_melk_haver: '无糖燕麦奶', d_eiwitshake_water: '蛋白粉（水冲）', d_eiwitshake_melk: '蛋白粉（牛奶冲）', d_bouillon: '清汤', d_sinaasappelsap: '橙汁', d_appelsap: '苹果汁', d_tomatensap: '番茄汁', d_limonade_zero: '无糖柠檬水',
    a_bier_pils: '啤酒（皮尔森）', a_bier_speciaal: '精酿啤酒', a_wijn_rood: '红葡萄酒', a_wijn_wit_droog: '白葡萄酒（干）', a_gin_tonic: '金汤力', a_whiskey: '威士忌',
    b_skyr: 'Skyr原味酸奶', b_griekse_yoghurt: '希腊酸奶 (10%)', b_magere_kwark: '低脂夸克奶酪', b_havermout: '燕麦片（水煮）', b_volkoren_brood: '全麦面包', b_ei_gekookt: '煮鸡蛋',
    act_wandelen_slow: '散步（慢速）', act_hardlopen_8: '跑步 (8 km/h)', act_fietsen_rustig: '骑行（城市）', act_zwemmen: '游泳（游泳池）', act_fitness: '健身',
    s_amandelen: '杏仁', s_pure_choco: '黑巧克力 (85%)', f_appel: '苹果', f_banaan: '香蕉'
  },
  ja: {
    d_water: '水（スティル/スパークリング）', d_water_citroen: 'レモン水', d_water_munt: 'ミント水', d_cola_zero: 'コカコーラ ゼロ', d_pepsi_max: 'ペプシ マックス', d_fanta_zero: 'ファンタ オレンジ ゼロ', d_sprite_zero: 'スプライト ゼロ', d_icetea_green_zero: 'アイスティー グリーン ゼロ', d_rivella: 'リベラ', d_spa_touch: 'Spa タッチ レモン', d_koffie: 'コーヒー（ブラック）', d_espresso: 'エスプレッソ', d_americano: 'アメリカーノ', d_thee_groen: '緑茶', d_thee_zwart: '紅茶', d_thee_kruiden: 'ハーブティー', d_verse_munt: 'フレッシュミントティー', d_gemberthee: 'フレッシュジンジャーティー', d_melk_mager: '無脂肪牛乳', d_melk_half: '低脂肪牛乳', d_melk_soja: '豆乳（砂糖不使用）', d_melk_amandel: 'アーモンドミルク（砂糖不使用）', d_melk_haver: 'オーツミルク（砂糖不使用）', d_eiwitshake_water: 'プロテインシェイク（水）', d_eiwitshake_melk: 'プロテインシェイク（牛乳）', d_bouillon: 'ブイヨン', d_sinaasappelsap: 'オレンジジュース', d_appelsap: 'アップルジュース', d_tomatensap: 'トマトジュース', d_limonade_zero: 'レモネード ゼロ',
    a_bier_pils: 'ビール（ピルスナー）', a_bier_speciaal: 'クラフトビール', a_wijn_rood: '赤ワイン', a_wijn_wit_droog: '白ワイン（辛口）', a_gin_tonic: 'ジントニック', a_whiskey: 'ウィスキー',
    b_skyr: 'スキール ナチュラル', b_griekse_yoghurt: 'ギリシャヨーグルト (10%)', b_magere_kwark: '低脂肪クワルク', b_havermout: 'オートミール（水）', b_volkoren_brood: '全粒粉パン', b_ei_gekookt: 'ゆで卵',
    act_wandelen_slow: 'ウォーキング（ゆっくり）', act_hardlopen_8: 'ランニング (8 km/h)', act_fietsen_rustig: 'サイクリング（街乗り）', act_zwemmen: '水泳（ラップ）', act_fitness: 'フィットネス',
    s_amandelen: 'アーモンド', s_pure_choco: 'ダークチョコレート (85%)', f_appel: 'リンゴ', f_banaan: 'バナナ'
  },
  ko: {
    d_water: '물 (생수/탄산수)', d_water_citroen: '레몬 워터', d_water_munt: '민트 워터', d_cola_zero: '제로 콜라', d_pepsi_max: '펩시 맥스', d_fanta_zero: '제로 환타', d_sprite_zero: '제로 스프라이트', d_icetea_green_zero: '제로 녹차 아이스티', d_rivella: '리벨라', d_spa_touch: '레몬 스파 워터', d_koffie: '커피 (블랙)', d_espresso: '에스프레소', d_americano: '아메리카노', d_thee_groen: '녹차', d_thee_zwart: '홍차', d_thee_kruiden: '허브차', d_verse_munt: '생민트차', d_gemberthee: '생생강차', d_melk_mager: '무지방 우유', d_melk_half: '저지방 우유', d_melk_soja: '두유 (무가당)', d_melk_amandel: '아몬드유 (무가당)', d_melk_haver: '귀리유 (무가당)', d_eiwitshake_water: '단백질 쉐이크 (물)', d_eiwitshake_melk: '단백질 쉐이크 (우유)', d_bouillon: '부용', d_sinaasappelsap: '오렌지 주스', d_appelsap: '사과 주스', d_tomatensap: '토마토 주스', d_limonade_zero: '제로 레모네이드',
    a_bier_pils: '맥주 (필스너)', a_bier_speciaal: '수제 맥주', a_wijn_rood: '레드 와인', a_wijn_wit_droog: '화이트 와인 (드라이)', a_gin_tonic: '진 토닉', a_whiskey: '위스키',
    b_skyr: '스키르 내추럴', b_griekse_yoghurt: '그릭 요거트 (10%)', b_magere_kwark: '저지방 쿼크 치즈', b_havermout: '오트밀 (물)', b_volkoren_brood: '통밀빵', b_ei_gekookt: '삶은 달걀',
    act_wandelen_slow: '걷기 (천천히)', act_hardlopen_8: '달리기 (8 km/h)', act_fietsen_rustig: '사이클링 (시내)', act_zwemmen: '수영 (왕복)', act_fitness: '피트니스',
    s_amandelen: '아몬드', s_pure_choco: '다크 초콜릿 (85%)', f_appel: '사과', f_banaan: '바나나'
  },
  hi: {
    d_water: 'पानी (सादा/सोडा)', d_water_citroen: 'नींबू पानी', d_water_munt: 'पुदीना पानी', d_cola_zero: 'कोला ज़ीरो', d_pepsi_max: 'पेप्सी मैक्स', d_fanta_zero: 'फेंटा ऑरेंज ज़ीरो', d_sprite_zero: 'स्प्राइट ज़ीरो', d_icetea_green_zero: 'आइस टी ग्रीन ज़ीरो', d_rivella: 'रिवेला', d_spa_touch: 'लेमन वाटर', d_koffie: 'कॉफी (ब्लैक)', d_espresso: 'एस्प्रेसो', d_americano: 'अमरीकानो', d_thee_groen: 'ग्रीन टी', d_thee_zwart: 'ब्लैक टी', d_thee_kruiden: 'हर्बल टी', d_verse_munt: 'ताज़ा पुदीना चाय', d_gemberthee: 'ताज़ा अदरक चाय', d_melk_mager: 'स्किम्ड मिल्क', d_melk_half: 'लो फैट मिल्क', d_melk_soja: 'सोया मिल्क (बिना चीनी)', d_melk_amandel: 'बादाम मिल्क (बिना चीनी)', d_melk_haver: 'ओट्स मिल्क (बिना चीनी)', d_eiwitshake_water: 'प्रोटीन शेक (पानी)', d_eiwitshake_melk: 'प्रोटीन शेक (दूध)', d_bouillon: 'शोरबा', d_sinaasappelsap: 'संतरे का जूस', d_appelsap: 'सेब का जूस', d_tomatensap: 'टमाटर का जूस', d_limonade_zero: 'शिकंजी ज़ीरो',
    a_bier_pils: 'बीयर (पिल्सनर)', a_bier_speciaal: 'क्राफ्ट बीयर', a_wijn_rood: 'लाल वाइन', a_wijn_wit_droog: 'सफेद वाइन (सूखी)', a_gin_tonic: 'जिन टॉनिक', a_whiskey: 'व्हिस्की',
    b_skyr: 'स्कॉर नेचुरल', b_griekse_yoghurt: 'ग्रीक योगर्ट (10%)', b_magere_kwark: 'लो फैट पनीर', b_havermout: 'दलिया (पानी)', b_volkoren_brood: 'होल व्हीट ब्रेड', b_ei_gekookt: 'उबला अंडा',
    act_wandelen_slow: 'पैदल चलना (धीरे)', act_hardlopen_8: 'दौड़ना (8 किमी/घंटा)', act_fietsen_rustig: 'साइकिल चलाना (शहर)', act_zwemmen: 'तैरना', act_fitness: 'फिटनेस',
    s_amandelen: 'बादाम', s_pure_choco: 'डार्क चॉकलेट (85%)', f_appel: 'सेब', f_banaan: 'केला'
  },
  ar: {
    d_water: 'ماء (عادي/غازي)', d_water_citroen: 'ماء بالليمون', d_water_munt: 'ماء بالنعناع', d_cola_zero: 'كولا زيرو', d_pepsi_max: 'بيبسي ماكس', d_fanta_zero: 'فانتا برتقال زيرو', d_sprite_zero: 'سبرايت زيرو', d_icetea_green_zero: 'شاي أخضر مثلج زيرو', d_rivella: 'ريفيلا', d_spa_touch: 'ماء سبا بالليمون', d_koffie: 'قهوة (سوداء)', d_espresso: 'إسبريسو', d_americano: 'أمريكانو', d_thee_groen: 'شاي أخضر', d_thee_zwart: 'شاي أسود', d_thee_kruiden: 'شاي أعشاب', d_verse_munt: 'شاي نعناع طازج', d_gemberthee: 'شاي زنجبيل طازج', d_melk_mager: 'حليب خالي الدسم', d_melk_half: 'حليب نصف دسم', d_melk_soja: 'حليب صويا (غير محلى)', d_melk_amandel: 'حليب لوز (غير محلى)', d_melk_haver: 'حليب شوفان (غير محلى)', d_eiwitshake_water: 'مخفوق بروتين (ماء)', d_eiwitshake_melk: 'مخفوق بروتين (حليب)', d_bouillon: 'مرقة', d_sinaasappelsap: 'عصير برتقال', d_appelsap: 'عصير تفاح', d_tomatensap: 'عصير طماطم', d_limonade_zero: 'ليمونادة زيرو',
    a_bier_pils: 'بيرة (بيلسنر)', a_bier_speciaal: 'بيرة حرفية', a_wijn_rood: 'نبيذ أحمر', a_wijn_wit_droog: 'نبيذ أبيض (جاف)', a_gin_tonic: 'جين تونيك', a_whiskey: 'ويسكي',
    b_skyr: 'سكير طبيعي', b_griekse_yoghurt: 'زبادي يوناني (10%)', b_magere_kwark: 'كوارك خالي الدسم', b_havermout: 'شوفان (بماء)', b_volkoren_brood: 'خبز القمح الكامل', b_ei_gekookt: 'بيض مسلوق',
    act_wandelen_slow: 'مشي (بطيء)', act_hardlopen_8: 'جري (8 كم/ساعة)', act_fietsen_rustig: 'ركوب دراجة (مدينة)', act_zwemmen: 'سباحة', act_fitness: 'لياقة بدنية',
    s_amandelen: 'لوز', s_pure_choco: 'شوكولاتة داكنة (85%)', f_appel: 'تفاح', f_banaan: 'موز'
  }
};

const NON_ALC_DRINKS: MealOption[] = [
  { id: 'd_water', name: 'Water (Plat/Bruis)', kcal: 0, isDrink: true, unitName: '250 ML' },
  { id: 'd_water_citroen', name: 'Water met Citroen', kcal: 2, isDrink: true, unitName: '250 ML' },
  { id: 'd_water_munt', name: 'Water met Munt', kcal: 2, isDrink: true, unitName: '250 ML' },
  { id: 'd_cola_zero', name: 'Cola Zero', kcal: 0, isDrink: true, unitName: '250 ML' },
  { id: 'd_pepsi_max', name: 'Pepsi Max', kcal: 0, isDrink: true, unitName: '250 ML' },
  { id: 'd_fanta_zero', name: 'Fanta Orange Zero', kcal: 10, isDrink: true, unitName: '250 ML' },
  { id: 'd_sprite_zero', name: 'Sprite Zero', kcal: 5, isDrink: true, unitName: '250 ML' },
  { id: 'd_icetea_green_zero', name: 'Ice Tea Green Zero', kcal: 5, isDrink: true, unitName: '250 ML' },
  { id: 'd_rivella', name: 'Rivella Original', kcal: 13, isDrink: true, unitName: '250 ML' },
  { id: 'd_spa_touch', name: 'Spa Touch Lemon', kcal: 0, isDrink: true, unitName: '250 ML' },
  { id: 'd_koffie', name: 'Koffie (Zwart)', kcal: 2, isDrink: true, unitName: '200 ML' },
  { id: 'd_espresso', name: 'Espresso', kcal: 2, isDrink: true, unitName: '35 ML' },
  { id: 'd_americano', name: 'Americano', kcal: 2, isDrink: true, unitName: '200 ML' },
  { id: 'd_thee_groen', name: 'Groene Thee', kcal: 1, isDrink: true, unitName: '200 ML' },
  { id: 'd_thee_zwart', name: 'Zwarte Thee', kcal: 1, isDrink: true, unitName: '200 ML' },
  { id: 'd_thee_kruiden', name: 'Kruidenthee', kcal: 1, isDrink: true, unitName: '200 ML' },
  { id: 'd_verse_munt', name: 'Verse Muntthee', kcal: 5, isDrink: true, unitName: '250 ML' },
  { id: 'd_gemberthee', name: 'Verse Gemberthee', kcal: 5, isDrink: true, unitName: '250 ML' },
  { id: 'd_melk_mager', name: 'Magere Melk', kcal: 85, isDrink: true, unitName: '250 ML' },
  { id: 'd_melk_half', name: 'Halfvolle Melk', kcal: 115, isDrink: true, unitName: '250 ML' },
  { id: 'd_melk_soja', name: 'Sojamelk (Ongezoet)', kcal: 80, isDrink: true, unitName: '250 ML' },
  { id: 'd_melk_amandel', name: 'Amandelmelk (Ongezoet)', kcal: 35, isDrink: true, unitName: '250 ML' },
  { id: 'd_melk_haver', name: 'Havermelk (Ongezoet)', kcal: 110, isDrink: true, unitName: '250 ML' },
  { id: 'd_eiwitshake_water', name: 'Eiwitshake (Water)', kcal: 110, isDrink: true, unitName: '300 ML' },
  { id: 'd_eiwitshake_melk', name: 'Eiwitshake (Melk)', kcal: 210, isDrink: true, unitName: '300 ML' },
  { id: 'd_bouillon', name: 'Bouillon', kcal: 10, isDrink: true, unitName: '250 ML' },
  { id: 'd_sinaasappelsap', name: 'Sinaasappelsap', kcal: 115, isDrink: true, unitName: '250 ML' },
  { id: 'd_appelsap', name: 'Appelsap', kcal: 110, isDrink: true, unitName: '250 ML' },
  { id: 'd_tomatensap', name: 'Tomatensap', kcal: 45, isDrink: true, unitName: '250 ML' },
  { id: 'd_limonade_zero', name: 'Limonade Zero', kcal: 2, isDrink: true, unitName: '250 ML' },
];

const ALCOHOL_DRINKS: MealOption[] = [
  { id: 'a_bier_pils', name: 'Bier (Pils)', kcal: 135, isDrink: true, isAlcohol: true, unitName: '300 ML' },
  { id: 'a_bier_speciaal', name: 'Speciaalbier', kcal: 210, isDrink: true, isAlcohol: true, unitName: '330 ML' },
  { id: 'a_wijn_rood', name: 'Rode Wijn', kcal: 125, isDrink: true, isAlcohol: true, unitName: '150 ML' },
  { id: 'a_wijn_wit_droog', name: 'Witte Wijn (Droog)', kcal: 120, isDrink: true, isAlcohol: true, unitName: '150 ML' },
  { id: 'a_gin_tonic', name: 'Gin Tonic', kcal: 175, isDrink: true, isAlcohol: true, unitName: '250 ML' },
  { id: 'a_whiskey', name: 'Whiskey', kcal: 85, isDrink: true, isAlcohol: true, unitName: '35 ML' },
];

const BREAKFAST_LIST: MealOption[] = [
  { id: 'b_skyr', name: 'Skyr Natuur', kcal: 95, unitName: '150 G' },
  { id: 'b_griekse_yoghurt', name: 'Griekse Yoghurt (10%)', kcal: 180, unitName: '150 G' },
  { id: 'b_magere_kwark', name: 'Magere Kwark', kcal: 140, unitName: '250 G' },
  { id: 'b_havermout', name: 'Havermout (Water)', kcal: 130, unitName: '200 G' },
  { id: 'b_volkoren_brood', name: 'Volkoren Brood', kcal: 80, unitName: '35 G' },
  { id: 'b_ei_gekookt', name: 'Ei (Gekookt)', kcal: 75, unitName: '55 G' },
];

const LUNCH_LIST: MealOption[] = [
  { id: 'l_soep_tomaat', name: 'Tomatensoep', kcal: 80, unitName: '250 ML' },
  { id: 'l_wrap_zalm', name: 'Wrap met Zalm', kcal: 320, unitName: '150 G' },
];

const DINNER_LIST: MealOption[] = [
  { id: 'm_macaroni', name: 'Macaroni Bolognese', kcal: 650, unitName: '450 G' },
  { id: 'm_pizza_mar', name: 'Pizza Margherita', kcal: 850, unitName: '350 G' },
];

const SNACKS_LIST_60: MealOption[] = [
  { id: 's_amandelen', name: 'Amandelen', kcal: 160, unitName: '25 G' },
  { id: 's_pure_choco', name: 'Pure Chocolade (85%)', kcal: 55, unitName: '10 G' },
];

const FRUIT_LIST: MealOption[] = [
  { id: 'f_appel', name: 'Appel', kcal: 60, unitName: '150 G' },
  { id: 'f_banaan', name: 'Banaan', kcal: 105, unitName: '120 G' },
];

export const MEAL_OPTIONS: Record<MealMoment, MealOption[]> = {
  'Ontbijt': [
    ...NON_ALC_DRINKS,
    ...BREAKFAST_LIST
  ],
  'Ochtend Snack': [
    ...NON_ALC_DRINKS,
    ...SNACKS_LIST_60,
    ...FRUIT_LIST
  ],
  'Lunch': [
    ...NON_ALC_DRINKS,
    ...LUNCH_LIST
  ],
  'Middag Snack': [
    ...NON_ALC_DRINKS,
    ...ALCOHOL_DRINKS,
    ...SNACKS_LIST_60,
    ...FRUIT_LIST
  ],
  'Diner': [
    ...NON_ALC_DRINKS,
    ...ALCOHOL_DRINKS,
    ...DINNER_LIST
  ],
  'Avond Snack': [
    ...NON_ALC_DRINKS,
    ...ALCOHOL_DRINKS,
    ...SNACKS_LIST_60,
    ...FRUIT_LIST
  ],
};

export const ACTIVITY_TYPES: ActivityType[] = [
  { id: 'act_wandelen_slow', name: 'Wandelen (Rustig)', met: 3.5, unit: 'minuten' },
  { id: 'act_hardlopen_8', name: 'Hardlopen (8 km/u)', met: 8.3, unit: 'minuten' },
  { id: 'act_fietsen_rustig', name: 'Fietsen (Stads)', met: 6.0, unit: 'minuten' },
  { id: 'act_zwemmen', name: 'Zwemmen (Baantjes)', met: 6.0, unit: 'minuten' },
  { id: 'act_fitness', name: 'Fitness (Krachttraining)', met: 5.0, unit: 'minuten' },
];

export const KCAL_PER_KG_FAT = 7700;
