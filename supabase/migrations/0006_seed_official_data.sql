-- ============================================================================
-- 0006_seed_official_data.sql
-- Rasmiy 365-son buyruq (2026-yil 25-sentabr) 2-ilovasiga muvofiq boshlang'ich
-- tizim ma'lumotlari:
-- 1. 7 ta rasmiy yo'nalish
-- 2. 8 ta rasmiy boshqaruv guruhi (7 yo'nalish + Kelajak Liderlari)
-- 3. Baliqchi tumanining 61 ta maktabi (raqamlangan shablon - admin tahrirlaydi)
-- 4. Standart reyting koeffitsiyentlari va platforma sozlamalari
-- ============================================================================

-- 1. RASMIY 7 TA YO'NALISH (Nizom 3-bob, 10-band asosida)
INSERT INTO public.directions (slug, name, short_name, description, duties_summary, icon_name, accent_color, sort_order)
VALUES
  (
    'talim',
    'Ta’lim',
    'Ta’lim',
    'O‘quvchilarning o‘zlashtirish darajasini ko‘tarish, ta’lim sifatini oshirish, fan va til to‘garaklari hamda akademik tashabbuslarni rivojlantirish.',
    'Bilimli, a’lochi o‘quvchilar orasidan saylanadi. Fan va til to‘garaklari, dars sifati bo‘yicha so‘rovlar va rahbariyatga takliflar kiritishni tashkil etadi.',
    'GraduationCap',
    'blue',
    1
  ),
  (
    'madaniyat',
    'Madaniyat',
    'Madaniyat',
    'Milliy urf-odat va qadriyatlarni asrab-avaylash, “Turon maktab teatri”, “Iqtidor maktab ansambli”, “Jadidlar izidan” tanlovlari hamda ijodiy tadbirlarni rivojlantirish.',
    'Iqtidorli va ijodkor o‘quvchilardan saylanadi. Madaniy tadbirlar, tarixiy obida va muzeylarga tashriflar, musiqa va san’at maktablariga yo‘naltirishni tashkil etadi.',
    'Palette',
    'violet',
    2
  ),
  (
    'it-va-suniy-intellekt',
    'IT va sun’iy intellekt',
    'IT va AI',
    'Kengash faoliyatini raqamlashtirish, zamonaviy platformalar, bot va saytlar yaratish, dasturlash va sun’iy intellekt to‘garaklarini rivojlantirish.',
    'Axborot texnologiyalari, sun’iy intellekt va dasturlashga qiziquvchi o‘quvchilardan saylanadi. “Kelajak” markazi tarmoq to‘garaklarini rivojlantirishga ko‘maklashadi.',
    'Cpu',
    'cyan',
    3
  ),
  (
    'sport',
    'Sport',
    'Sport',
    'O‘quvchilar o‘rtasida sportni keng targ‘ib qilish, ommalashtirish, sog‘lom turmush tarzini qaror toptirish va sport musobaqalarini tashkil etish.',
    'Sport bilan muntazam shug‘ullanadigan o‘quvchilardan saylanadi. Bolalar va o‘smirlar sport maktablariga yo‘naltirish va sport tadbirlarini muvofiqlashtiradi.',
    'Trophy',
    'emerald',
    4
  ),
  (
    'ekologiya',
    'Ekologiya',
    'Ekologiya',
    'Atrof-muhitni asrash, salomatlikni targ‘ib etish, chiqindilarni kamaytirish va qayta ishlash aksiyalari hamda “Eko-maktab” loyihalarini amalga oshirish.',
    'Tabiiy fanlar bo‘yicha bilimdon va faol jamoatchi o‘quvchilardan saylanadi. Ilmiy-amaliy konferensiyalar va ekologik aksiyalarni o‘tkazadi.',
    'Leaf',
    'teal',
    5
  ),
  (
    'media',
    'Media',
    'Media',
    'Maktab hayoti va Kengash faoliyatini yoritish, bolalar jurnalistikasi, matbuot xizmati, gazeta, jurnal, sayt va maktab radiosi faoliyatini yo‘lga qo‘yish.',
    'Ijodkor, qalami o‘tkir va notiq o‘quvchilardan saylanadi. Media jamoasini shakllantiradi, yangilik va tahliliy materiallar tayyorlaydi.',
    'Radio',
    'sky',
    6
  ),
  (
    'ijtimoiy-tashabbus',
    'Ijtimoiy tashabbus',
    'Ijtimoiy tashabbus',
    'O‘quvchilarning ijtimoiy g‘oya va tashabbuslarini aniqlash, jamoatchilik faoliyatiga jalb etish, xayriya va foydali ijtimoiy loyihalarni amalga oshirish.',
    'Tashabbuskor va faol o‘quvchilardan saylanadi. Tashabbuskor yoshlarni birlashtirib, ijtimoiy loyihalarni tashkil etish va amalga oshirishni muvofiqlashtiradi.',
    'HeartHandshake',
    'amber',
    7
  )
ON CONFLICT (slug) DO NOTHING;

-- 2. RASMIY 8 TA BOSHQARUV GURUHI (7 ta yo'nalish + 1 ta Kelajak Liderlari)
INSERT INTO public.groups (slug, name, description, group_type, direction_id)
SELECT
  d.slug || '-koordinatorlari',
  d.name || ' koordinatori guruhi',
  'Baliqchi tumanidagi 61 ta maktabning ' || d.name || ' yo‘nalishi koordinatorlari va Tuman yo‘nalish koordinatori muloqot hamda topshiriqlar maydoni.',
  'direction'::public.group_type,
  d.id
FROM public.directions d
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.groups (slug, name, description, group_type, direction_id)
VALUES (
  'kelajak-liderlari',
  'Kelajak Liderlari guruhi',
  'Baliqchi tumani 1 nafar Tuman Kelajak Lideri va 61 nafar Maktab Kelajak Liderlarining mustaqil boshqaruv, e’lonlar, topshiriqlar va hisobotlar guruhi.',
  'future_leaders'::public.group_type,
  NULL
)
ON CONFLICT (slug) DO NOTHING;

-- 3. BALIQCHI TUMANIDAGI 61 TA MAKTAB (Rasmiy raqamlangan shablon - Admin panelda tahrirlanadi)
INSERT INTO public.schools (school_number, name, slug, address, description)
SELECT
  n,
  n || '-sonli umumiy o‘rta ta’lim maktabi',
  'maktab-' || n,
  'Baliqchi tumani, Andijon viloyati',
  'Baliqchi tumani ' || n || '-sonli umumiy o‘rta ta’lim maktabi O‘quvchilar Kengashi raqamli profili.'
FROM generate_series(1, 61) AS n
ON CONFLICT (school_number) DO NOTHING;

-- 4. STANDART REYTING KOEFFITSIYENTLARI (Faqat ovozlarga emas, real faoliyatga asoslangan)
INSERT INTO public.ranking_settings (
  id,
  completed_projects_weight,
  in_progress_projects_weight,
  events_weight,
  reports_weight,
  direction_activity_weight,
  participation_weight
)
VALUES (1, 30.00, 12.00, 10.00, 8.00, 15.00, 2.00)
ON CONFLICT (id) DO NOTHING;

-- 5. PLATFORMA SOZLAMALARI
INSERT INTO public.platform_settings (key, value, description)
VALUES
  (
    'site_meta',
    '{"name": "Baliqchi tumani O‘quvchilar Kengashi", "region": "Baliqchi tumani, Andijon viloyati", "schools_count": 61, "slogan": "G‘oyadan — haqiqiy natijagacha: 61 maktab yoshlarining yagona tashabbus platformasi"}'::jsonb,
    'Platformaning asosiy nomlanishi va shiori'
  ),
  (
    'official_clubs',
    '["“Turon teatri” klubi", "“Iqtidor ansambli” klubi", "“Jadidlar izidan” klubi", "“Eco-Schools Uzbekistan” klubi", "“Kelajak uchun xorijiy til” klubi", "“Debat” klubi", "“Raqamli avlod qizlari” klubi"]'::jsonb,
    '365-son buyruq 2-ilovasidagi rasmiy 7 ta klub andozasi'
  ),
  (
    'voting_rules',
    '{"votes_per_week": 1, "require_verified_account": true, "auto_approve_winner": false}'::jsonb,
    'Haftalik ovoz berish qoidalari (o‘zgartirish faqat Super Admin)'
  )
ON CONFLICT (key) DO NOTHING;
