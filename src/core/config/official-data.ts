import type { AppRole, Direction, ProjectStatus, School } from "@/core/types/database";

// ============================================================================
// RASMIY MA'LUMOTLAR — O'zbekiston Respublikasi Maktabgacha va maktab ta'limi
// vazirining 2026-yil 25-sentabrdagi 365-son buyrug'iga 2-ILOVA asosida
// ============================================================================

export const PLATFORM_INFO = {
  name: "Baliqchi tumani O‘quvchilar Kengashi",
  shortName: "Baliqchi Kengashi",
  region: "Baliqchi tumani, Andijon viloyati",
  schoolsTotal: 61,
  slogan: "G‘oyadan — haqiqiy natijagacha",
  subtitle:
    "Baliqchi tumanidagi 61 ta maktab o‘quvchilari, Kelajak Liderlari va 7 ta yo‘nalish koordinatorlarini birlashtiruvchi yagona raqamli tashabbuslar ekotizimi.",
  decreeRef:
    "O‘zbekiston Respublikasi Maktabgacha va maktab ta’limi vazirining 2026-yil 25-sentabrdagi 365-son buyrug‘iga 2-ilova",
};

export const ROLE_META: Record<
  AppRole,
  { label: string; shortLabel: string; description: string; badgeColor: string; level: number }
> = {
  super_admin: {
    label: "Super Administrator",
    shortLabel: "Super Admin",
    description: "Tizimning barcha bo‘limlari, foydalanuvchilar, rollar, loyihalar, ovoz berish va sozlamalarni to‘liq boshqaradi.",
    badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    level: 100,
  },
  district_leader: {
    label: "Tuman Kelajak Lideri",
    shortLabel: "Tuman Lideri",
    description: "61 ta maktab, 61 nafar Maktab Kelajak Lideri va 7 nafar tuman koordinatori faoliyatini muvofiqlashtiradi.",
    badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    level: 90,
  },
  district_coordinator: {
    label: "Tuman yo‘nalish koordinatori",
    shortLabel: "Tuman koordinatori",
    description: "O‘z yo‘nalishi bo‘yicha 61 ta maktab koordinatori faoliyatini va yo‘nalish guruhini boshqaradi.",
    badgeColor: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    level: 80,
  },
  school_leader: {
    label: "Maktab Kelajak Lideri",
    shortLabel: "Maktab Lideri",
    description: "O‘z maktabi O‘quvchilar Kengashiga rahbarlik qiladi, 7 koordinatorni va maktab loyihalarini nazorat qiladi.",
    badgeColor: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    level: 70,
  },
  school_coordinator: {
    label: "Maktab yo‘nalish koordinatori",
    shortLabel: "Maktab koordinatori",
    description: "O‘z maktabida tegishli yo‘nalish bo‘yicha loyihalar joylaydi, jarayonlarni yangilaydi va hisobot tayyorlaydi.",
    badgeColor: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
    level: 60,
  },
  school_advisor: {
    label: "Maktab maslahatchisi",
    shortLabel: "Maslahatchi",
    description: "Kengash faoliyatini muvofiqlashtiradi, loyiha va hisobotlarni ko‘rib chiqadi hamda tavsiyalar beradi.",
    badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    level: 65,
  },
  student: {
    label: "Oddiy o‘quvchi",
    shortLabel: "O‘quvchi",
    description: "61 maktab va loyihalarni kuzatadi, haftasiga 1 ta loyihaga ovoz beradi, izoh va tashabbus qoldiradi.",
    badgeColor: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    level: 10,
  },
};

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; description: string; colorClass: string; order: number }
> = {
  draft: {
    label: "Qoralama",
    description: "Loyiha hali muallif tomonidan tahrirlanmoqda.",
    colorClass: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-400/30",
    order: 1,
  },
  submitted: {
    label: "Yuborilgan",
    description: "Moderatsiya va ko‘rib chiqish uchun yuborilgan.",
    colorClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    order: 2,
  },
  moderation: {
    label: "Tekshirilmoqda",
    description: "Moderator yoki administrator tekshiruvidan o‘tmoqda.",
    colorClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    order: 3,
  },
  voting: {
    label: "Ovoz berilmoqda",
    description: "Haftalik ochiq ovoz berishda ishtirok etmoqda.",
    colorClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    order: 4,
  },
  weekly_winner: {
    label: "Haftalik g‘olib",
    description: "Hafta yakunida eng ko‘p ovoz to‘plagan g‘olib loyiha.",
    colorClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
    order: 5,
  },
  under_review: {
    label: "Tuman ko‘rib chiqmoqda",
    description: "Tuman Kelajak Lideri va yo‘nalish koordinatori tomonidan baholanmoqda.",
    colorClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    order: 6,
  },
  approved: {
    label: "Tasdiqlangan",
    description: "Amalga oshirishga rasman tasdiqlangan.",
    colorClass: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    order: 7,
  },
  in_progress: {
    label: "Amalga oshirilmoqda",
    description: "Bosqichma-bosqich amaliyotga joriy etilmoqda.",
    colorClass: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
    order: 8,
  },
  completed: {
    label: "Yakunlangan",
    description: "Muvaffaqiyatli yakunlangan va natijalari qayd etilgan.",
    colorClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    order: 9,
  },
  rejected: {
    label: "Rad etilgan",
    description: "Talablarga mos kelmagani sababli rad etilgan.",
    colorClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    order: 10,
  },
};

export const OFFICIAL_DIRECTIONS: Direction[] = [
  {
    id: "dir-talim",
    slug: "talim",
    name: "Ta’lim",
    short_name: "Ta’lim",
    description:
      "O‘quvchilarning o‘zlashtirish darajasini ko‘tarish, ta’lim sifatini oshirish, fan va til to‘garaklari hamda akademik tashabbuslarni rivojlantirish.",
    duties_summary:
      "Ta’lim koordinatori bilimli, a’lochi o‘quvchilar orasidan saylanadi. Iqtidorli o‘quvchilar uchun fan va til o‘rganish bo‘yicha to‘garaklar tashkil etish, darslar sifati va mavjud muammolarni o‘rganish bo‘yicha so‘rovlar o‘tkazib, maktab rahbariyatiga ma’lumot taqdim etish ishlarini tashkil etadi.",
    icon_name: "GraduationCap",
    accent_color: "blue",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "dir-madaniyat",
    slug: "madaniyat",
    name: "Madaniyat",
    short_name: "Madaniyat",
    description:
      "Milliy urf-odat va qadriyatlarni asrab-avaylash, “Turon maktab teatri”, “Iqtidor maktab ansambli”, “Jadidlar izidan” tanlovlari hamda ijodiy tadbirlarni rivojlantirish.",
    duties_summary:
      "Madaniyat koordinatori iqtidorli, iste’dodli va ijodkor o‘quvchilardan saylanadi. Madaniy tadbir va tanlovlar, tarixiy obida va muzeylarga tashriflar, o‘quvchilarni musiqa va san’at maktablariga yo‘naltirish ishlarini tashkil etadi.",
    icon_name: "Palette",
    accent_color: "violet",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "dir-it",
    slug: "it-va-suniy-intellekt",
    name: "IT va sun’iy intellekt",
    short_name: "IT va AI",
    description:
      "Kengash faoliyatini raqamlashtirish, zamonaviy platformalar, bot va saytlar yaratish, dasturlash va sun’iy intellekt to‘garaklarini rivojlantirish.",
    duties_summary:
      "IT va sun’iy intellekt koordinatori axborot texnologiyalari, sun’iy intellekt va dasturlash sohasiga qiziquvchi o‘quvchilar orasidan saylanadi. Kengash faoliyatini raqamlashtirish va “Kelajak” markazi tarmoq to‘garaklarini rivojlantirishga ko‘maklashadi.",
    icon_name: "Cpu",
    accent_color: "cyan",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "dir-sport",
    slug: "sport",
    name: "Sport",
    short_name: "Sport",
    description:
      "O‘quvchilar o‘rtasida sportni keng targ‘ib qilish, ommalashtirish, sog‘lom turmush tarzini qaror toptirish va sport musobaqalarini tashkil etish.",
    duties_summary:
      "Sport koordinatori sportning biror turi bilan muntazam shug‘ullanadigan, sog‘lom turmush tarziga qat’iy rioya qiladigan o‘quvchilardan saylanadi. O‘quvchilarni bolalar va o‘smirlar sport maktablariga yo‘naltirish va targ‘ib qilishni tashkil etadi.",
    icon_name: "Trophy",
    accent_color: "emerald",
    sort_order: 4,
    is_active: true,
  },
  {
    id: "dir-ekologiya",
    slug: "ekologiya",
    name: "Ekologiya",
    short_name: "Ekologiya",
    description:
      "Atrof-muhitni asrash, salomatlikni targ‘ib etish, chiqindilarni kamaytirish va qayta ishlash aksiyalari hamda “Eko-maktab” loyihalarini amalga oshirish.",
    duties_summary:
      "Ekologiya koordinatori tabiiy fanlar bo‘yicha bilimdon va faol jamoatchi o‘quvchilardan saylanadi. Chiqindilarni kamaytirish, ilmiy-amaliy konferensiyalar va ekologik aksiyalarni o‘tkazadi. “Eko-maktab” a’zolari yordamchi bo‘lishi mumkin.",
    icon_name: "Leaf",
    accent_color: "teal",
    sort_order: 5,
    is_active: true,
  },
  {
    id: "dir-media",
    slug: "media",
    name: "Media",
    short_name: "Media",
    description:
      "Maktab hayoti va Kengash faoliyatini yoritish, bolalar jurnalistikasi, matbuot xizmati, gazeta, jurnal, sayt va maktab radiosi faoliyatini yo‘lga qo‘yish.",
    duties_summary:
      "Media koordinatori ijodkor, qalami o‘tkir va notiq o‘quvchilardan saylanadi. Media jamoasini shakllantiradi, matbuot xizmati, bolalar jurnalistikasi, maqolalar chop etish va maktab radiosi faoliyatini yo‘lga qo‘yadi.",
    icon_name: "Radio",
    accent_color: "sky",
    sort_order: 6,
    is_active: true,
  },
  {
    id: "dir-ijtimoiy",
    slug: "ijtimoiy-tashabbus",
    name: "Ijtimoiy tashabbus",
    short_name: "Ijtimoiy tashabbus",
    description:
      "O‘quvchilarning ijtimoiy g‘oya va tashabbuslarini aniqlash, jamoatchilik faoliyatiga jalb etish, xayriya va foydali ijtimoiy loyihalarni amalga oshirish.",
    duties_summary:
      "Ijtimoiy tashabbus koordinatori tashabbuskor va faol o‘quvchilardan saylanadi. Tashabbuskor o‘quvchilarni birlashtirib, ijtimoiy g‘oyalarni aniqlash, qo‘llab-quvvatlash va amalga oshirish jarayonini muvofiqlashtiradi.",
    icon_name: "HeartHandshake",
    accent_color: "amber",
    sort_order: 7,
    is_active: true,
  },
];

export const OFFICIAL_CLUBS_LIST = [
  "“Turon teatri” klubi",
  "“Iqtidor ansambli” klubi",
  "“Jadidlar izidan” klubi",
  "“Eco-Schools Uzbekistan” klubi",
  "“Kelajak uchun xorijiy til” klubi",
  "“Debat” klubi",
  "“Raqamli avlod qizlari” klubi",
];

/**
 * 61 ta maktab uchun rasmiy raqamlangan shablon (hech qanday to'qima nom yo'q).
 * Supabase ulanganda bevosita `schools` jadvalidan o'qiladi va Admin paneldan tahrirlanadi.
 */
export const OFFICIAL_SCHOOLS_TEMPLATE: School[] = Array.from({ length: 61 }, (_, idx) => {
  const num = idx + 1;
  return {
    id: `school-${num}`,
    school_number: num,
    name: `${num}-sonli umumiy o‘rta ta’lim maktabi`,
    slug: `maktab-${num}`,
    address: "Baliqchi tumani, Andijon viloyati",
    description: `Baliqchi tumani ${num}-sonli umumiy o‘rta ta’lim maktabi O‘quvchilar Kengashi raqamli profili.`,
    logo_url: null,
    cover_url: null,
    is_active: true,
    created_at: "2026-09-25T00:00:00Z",
    updated_at: "2026-09-25T00:00:00Z",
  };
});

// ============================================================================
// RASMIY NIZOM MATNI (365-son buyruq, 2026-yil 25-sentabr, 2-ILOVA — To'liq 10 bob)
// ============================================================================
export interface CharterChapter {
  number: string;
  title: string;
  clauses: string[];
}

export const OFFICIAL_CHARTER_CHAPTERS: CharterChapter[] = [
  {
    number: "1-bob",
    title: "Umumiy qoidalar",
    clauses: [
      "1. Ushbu Nizom umumiy o‘rta ta’lim muassasalaridagi (keyingi o‘rinlarda – Maktab) o‘quvchilarining o‘zini o‘zi boshqarish organi bo‘lgan O‘quvchilar kengashi (keyingi o‘rinlarda – Kengash) faoliyatini tartibga soladi.",
      "2. Kengash – Muhammad al–Xorazmiy nomidagi ixtisoslashtirilgan maktab ijobiy tajribasi hamda “Milliy qadriyatlar asosida global fikrlaydigan lider shaxsni shakllantirish” mafkurasi asosida tashkil etiladi. Kengash “Tengdosh-tengdoshga” tamoyili asosida qo‘shimcha ta’lim muhitini shakllantiruvchi tizim bo‘lib, o‘zini o‘zi boshqarish organi hisoblanadi.",
      "3. Kengash o‘z faoliyatida O‘zbekiston Respublikasi Qonunlari, Prezident Farmonlari, qarorlari va farmoyishlari, Vazirlar Mahkamasi qarorlari, Maktabgacha va maktab ta’limi vazirligi hamda “Kelajak” markazining me’yoriy hujjatlari, shuningdek, maktab Ustavi va ushbu Nizomga amal qiladi.",
      "4. Kengash maktab direktori huzuridagi maslahat organi hisoblanadi hamda uning faoliyati maktab maslahatchisi tomonidan muvofiqlashtiriladi.",
      "5. Kengash yuridik shaxs maqomiga ega emas va mustaqil moliyaviy faoliyat yuritmaydi.",
      "6. Ushbu Nizomning bir nusxasi maktab ma’muriyati tomonidan ro‘yxatga olinadi.",
    ],
  },
  {
    number: "2-bob",
    title: "Kengashning maqsadi va vazifalari",
    clauses: [
      "7. Kengashning maqsadlari quyidagilardan iborat: o‘quvchilarda ona Vatanga muhabbat, uning ravnaqi uchun mardlik, fidoyilik, birdamlik va halollik tuyg‘ularini shakllantirish; o‘quvchilarda o‘z qarorlari va xatti-harakatlariga javobgarlik, vazifalarni o‘z vaqtida va mas’uliyat bilan bajarish, vaqtni samarali taqsimlash, jamoa manfaatlarini hisobga olish kabi fazilatlarni shakllantirish; bilimli, kreativ, keng fikrlaydigan, kompetent, mustaqil va o‘z fikriga ega o‘quvchilarni tarbiyalash.",
      "8. Kengash quyidagi vazifalarni bajaradi: o‘quvchilarda Yangi O‘zbekiston islohotlariga daxldorlik hissini oshirish; o‘quvchilarda vatanparvarlik ruhida sadoqat, milliy g‘urur, faxr va iftixor tuyg‘ularini yuksaltirish; o‘quvchilar tashabbuslarini ilgari surish va qo‘llab-quvvatlash; o‘quvchilarni qo‘shimcha ta’lim muassasalariga jalb etishda faol ishtirok etish; ijtimoiy, ekologik, kitobxonlik, madaniy va sport loyihalarini amalga oshirish; maktab jamoasi, ma’muriyat va o‘quvchilar o‘rtasida ochiq muloqot ko‘prigini yaratish; o‘quvchilar portfoliolarini boyitishga yordam beruvchi tadbirlarni tashkil etish; inklyuziv muhitni qo‘llab-quvvatlash va o‘quvchilarning psixologik farovonligini mustahkamlash; maktab imidjini oshirish va o‘quv madaniyatini targ‘ib qilish.",
    ],
  },
  {
    number: "3-bob",
    title: "Kengashning tarkibi va tashkiliy tuzilmasi",
    clauses: [
      "9. Kengash Kelajak lideri, yo‘nalish koordinatorlari, sinf vakillaridan iborat a’zolardan tashkil topadi.",
      "10. Kengash tarkibi quyidagilardan iborat: Kelajak lideri; Yo‘nalish koordinatorlari (Ta’lim, Madaniyat, IT va sun’iy intellekt, Sport, Ekologiya, Media, Ijtimoiy tashabbus); Sinf vakillari (class representatives); Klublar (“Turon teatri”, “Iqtidor ansambli”, “Jadidlar izidan”, “Eco-Schools Uzbekistan”, “Kelajak uchun xorijiy til”, “Debat”, “Raqamli avlod qizlari” va boshqa klublar).",
      "Kelajak lideri Kengash faoliyatiga umumiy rahbarlik qiladi va muvofiqlashtiradi, maktab maslahatchisi bilan faol hamkorlik qiladi, o‘quvchilar orasidagi muammolar va ularning yechimi yuzasidan rahbariyatga taklif kiritadi. Yo‘nalish koordinatorlari 5–11-sinf vakillari o‘rtasidan ochiq ovoz berish yo‘li orqali saylanadi.",
      "Sinf vakillari (class representatives) Kengashning eng quyi bo‘g‘ini hisoblanadi va har o‘quv yili boshida sinf o‘quvchilari tomonidan saylanadi. Klublar faoliyatiga tegishli mutaxassislik bo‘yicha o‘qituvchi-pedagoglar jalb etiladi hamda maktab maslahatchisi tomonidan muvofiqlashtiriladi.",
      "11. Kengashning tashkiliy tuzilmasi mazkur Nizomga asosan ilova bilan tasdiqlanadi.",
    ],
  },
  {
    number: "4-bob",
    title: "Saylov tizimi",
    clauses: [
      "12. Kengash tarkibi har yili 1–30-oktabr kunlari saylov yo‘li bilan shakllantiriladi. Kengash tarkibiga kirish istagi bo‘lgan nomzodlar (sinf vakillari) maktab maslahatchilariga yozma ravishda ariza topshiradi va saralanadi.",
      "13. Kengash a’zoligiga 5–11-sinflar o‘quvchilari qabul qilinadi.",
      "14. Kengash saylovini o‘tkazish tartibi Respublika “Kelajak markazi”ning tegishli buyrug‘i bilan tasdiqlanadi.",
    ],
  },
  {
    number: "5-bob",
    title: "Kengash a’zolarining huquq va majburiyatlari",
    clauses: [
      "15. Kengash a’zolari huquqlari: maktab hayotiga oid taklif va tashabbuslarni ilgari surish; o‘quvchilar manfaatlarini ma’muriyatga yetkazish; “Kelajak” markazlari tomonidan tashkil etiladigan loyiha, tadbir, aksiya va sport musobaqalarida ishtirok etish; o‘z faoliyatiga oid ma’lumotlarni olish va tahlil qilish.",
      "16. Kengash a’zolari majburiyatlari: maktab ichki tartib qoidalariga rioya qilish; o‘quvchilar uchun namuna bo‘lish, akademik halollikni saqlash; maktab o‘quvchilari fikrini doimiy o‘rganib borish va rahbariyatga taklif kiritish; ijtimoiy tarmoqlarda maktab hamda “Kelajak” markazi imidjini shakllantirishda faol qatnashish; “Kelajak” markazining faoliyati, loyihalari va imkoniyatlarini keng targ‘ib qilish; mahalliy va xalqaro olimpiadalarda ishtirok etish istagida bo‘lgan o‘quvchilarni aniqlab, maktab maslahatchisiga bildirib borish; milliy bayram kunlariga bag‘ishlab tadbirlar tashkil etish.",
    ],
  },
  {
    number: "6-bob",
    title: "Faoliyatni tashkil etish tartibi",
    clauses: [
      "17. Kengash yig‘ilishlari bir oyda kamida bir marotaba o‘tkaziladi. Zarurat tug‘ilganda navbatdan tashqari yig‘ilishlar chaqirilishi mumkin.",
      "18. Qarorlar Kengash a’zolarining ko‘pchilik ovozi (50%+1) bilan qabul qilinadi.",
      "19. Kengash faoliyati “Kelajak” markazlari va maktab ma’muriyati bilan hamkorlikda amalga oshiriladi.",
      "20. Kengash maktabning 2030-yilgacha rivojlanish strategiyasini amalga oshirishda faol ishtirok etadi.",
      "21. Kengash tomonidan o‘z faoliyati yuzasidan har chorak yakunida hisobot tayyorlanadi va maktab ma’muriyati hamda o‘quvchilar jamoasiga taqdim etiladi.",
    ],
  },
  {
    number: "7-bob",
    title: "Shaxsiy rivojlanish va kompetensiyalar",
    clauses: [
      "22. Maktab maslahatchisi Kengash a’zolari uchun maxsus rivojlantirish dasturlarini ishlab chiqadi va amaliyotga tatbiq etadi: liderlik ko‘nikmalarini rivojlantirish bo‘yicha treninglar; debat olib borish ko‘nikmalari; loyihalarni boshqarish asoslari; jamoaviy ishlash va konfliktlarni hal qilish yuzasidan seminarlar.",
    ],
  },
  {
    number: "8-bob",
    title: "“Kelajak” lideri, sinf vakili va koordinatorlarni Kengash safidan chiqarish tartibi",
    clauses: [
      "23. “Kelajak” lideri, sinf vakili va koordinatorlar quyidagi hollarda Kengash a’zoligidan muddatidan oldin chiqarilishi mumkin: Kengash Nizomi yoki maktab tartib-qoidalarini muntazam yoki qo‘pol ravishda buzganida; o‘quvchilar, pedagoglar va Kengash a’zolarining sha’ni va huquqlarini kamsitgan, haqoratlagan yoki bosim o‘tkazganida; nizo, guruhbozlik yoki adovatni qasddan keltirib chiqarganida; vakolatidan shaxsiy manfaati yo‘lida yoki ruxsatsiz foydalanganida; topshiriq va yig‘ilishlarda uzrsiz muntazam qatnashmaganida; obro‘sizlantiruvchi yolg‘on ma’lumot tarqatganida; sog‘lom ma’naviy-psixologik muhitga jiddiy salbiy ta’sir ko‘rsatganida; adolat, xolislik, tenglik va o‘zaro hurmat tamoyillariga muntazam rioya qilmaganida.",
      "24. Kengash a’zosini safdan chiqarishdan oldin holat xolisona o‘rganiladi, mavjud dalillar, guvohlar ko‘rsatmalari va tushuntirishlar inobatga olinadi.",
      "25. Safdan chiqarish masalasi ko‘rib chiqilayotgani haqida oldindan xabar beriladi va o‘z fikri hamda tushuntirishlarini bildirish imkoniyati beriladi.",
      "26. Safdan chiqarish to‘g‘risidagi qaror Kengash yig‘ilishida muhokama qilinib, bayonnoma asosida rasmiylashtiriladi.",
      "27. Birinchi marta sodir etilgan va og‘ir oqibatlarga olib kelmagan holatlarda ogohlantirish, tanbeh yoki boshqa tarbiyaviy choralar qo‘llanilishi mumkin.",
      "28. Kengash safidan chiqarilgan a’zo o‘rniga yangi a’zo belgilangan tartibda saylanadi yoki tayinlanadi.",
    ],
  },
  {
    number: "9-bob",
    title: "Hamkorlik va tarmoq aloqalari",
    clauses: [
      "29. Kengash respublikadagi boshqa maktablar O‘quvchilar Kengashlari bilan hamkorlik qiladi va tajriba almashinuvida ishtirok etadi.",
    ],
  },
  {
    number: "10-bob",
    title: "Yakuniy qoidalar",
    clauses: [
      "30. Ushbu Nizomga o‘zgartirish va qo‘shimchalar kiritish “Umumiy o‘rta ta’lim muassasalarida O‘quvchilar Kengashi tizimini joriy etish” bo‘yicha Ishchi guruh tomonidan amalga oshiriladi.",
    ],
  },
];
