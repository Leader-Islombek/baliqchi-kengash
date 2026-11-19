# Baliqchi tumani O‘quvchilar Kengashi Platformasi

O‘zbekiston Respublikasi Maktabgacha va maktab ta’limi vazirining **2026-yil 25-sentabrdagi 365-son buyrug‘iga 2-ilova** (O‘quvchilar Kengashi Nizomi) asosida Baliqchi tumanidagi **61 ta maktab**, Kelajak Liderlari, 7 ta yo‘nalish koordinatorlari va barcha 5–11-sinf o‘quvchilari uchun yaratilgan yagona raqamli ekotizim.

## Asosiy Imkoniyatlar

- **Ikki darajali tashkiliy tuzilma:** 1 Tuman Kelajak Lideri + 7 Tuman koordinatori va 61 ta maktabning mustaqil raqamli profillari.
- **7 ta rasmiy yo‘nalish:** Ta’lim, Madaniyat, IT va sun’iy intellekt, Sport, Ekologiya, Media, Ijtimoiy tashabbus.
- **8 ta boshqaruv guruhi:** 7 ta yo‘nalish koordinatori guruhi + alohida Kelajak Liderlari guruhi va boshqaruv dashboardi.
- **Loyihalar va 10 bosqichli monitoring:** 12 maydonli rasmiy loyiha formasi, progress bar, haftalik yangilanishlar va izohlar.
- **Atomar haftalik ovoz berish:** Har bir tasdiqlangan o‘quvchi haftasiga barcha 7 yo‘nalish bo‘yicha **jami 1 ta ovoz** bera oladi (`UNIQUE (user_id, voting_week_id)` + PostgreSQL `cast_weekly_vote` RPC).
- **Ko‘p mezonli 61 maktab reytingi:** Haftalik, oylik va umumiy kesimda sozlanadigan vazn koeffitsiyentlari.
- **7 rolli RBAC + Supabase RLS + PII himoyasi:** Telefon raqamlari alohida `user_private_details` jadvalida saqlanadi (faqat egasi va Super Admin ko‘radi).
- **Super Administrator paneli (`/admin`):** Foydalanuvchilar, rollar, maktablar, yo‘nalishlar, loyihalar, ovoz berish haftalari, reyting mezonlari va audit logi ustidan to‘liq nazorat.

## Ishga Tushirish

```bash
npm install
cp .env.example .env.local
npm run dev
```

To‘liq Supabase va Vercel sozlash qo‘llanmasi: [DEPLOYMENT.md](./DEPLOYMENT.md).
