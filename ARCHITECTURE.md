# Loyiha Arxitekturasi (Django-uslubidagi Modulli Tuzilma)

Loyiha **Django apps** tamoyilidan ilhomlangan holda toza, modulli va kengaytiriluvchan arxitekturaga tartiblangan:

```text
baliqchi-kengash/
├── supabase/
│   ├── migrations/              # 0001..0007 SQL migratsiyalar (Django migrations/ kabi)
│   └── ALL_IN_ONE_SETUP.sql     # Barcha jadvallar, RLS va RPC bitta faylda
├── scripts/                     # Boshqaruv buyruqlari (Django management commands kabi)
│   ├── test-supabase.mjs
│   ├── make-super-admin.mjs
│   └── fix-utf8-seed.mjs
└── src/
    ├── proxy.ts                 # Auth middleware (Django middleware.py kabi)
    ├── app/                     # Marshrutlar va sahifalar (Django urls.py + views kabi)
    ├── core/                    # Umumiy yadro (Django core/settings kabi)
    │   ├── config/              # Rasmiy Nizom (365-son buyruq), 7 yo'nalish, 61 maktab
    │   ├── db/                  # Supabase client/server/admin/env va markaziy queries.ts
    │   ├── security/            # 7 rolli RBAC permissions.ts va rate-limit.ts
    │   ├── types/               # TypeScript domen modellari (models.py ekvivalenti)
    │   ├── validations/         # Zod forma va API sxemalari (forms.py / serializers.py)
    │   ├── utils.ts             # O'zbek tili, telefon va +05:00 vaqt yordamchilari
    │   └── ui/
    │       ├── primitives/      # Button, Card, Input, PasswordInput, ProgressBar
    │       ├── layout/          # Navbar, Footer
    │       └── shared/          # 3D scene-3d.tsx, Motion Primitives, Countdown, SafeCover
    └── modules/                 # Mustaqil domen modullari (Django apps/ kabi!)
        ├── home/                # Bosh sahifa Hero (3D 61-maktab modeli) va previewlar
        ├── accounts/            # Auth (kirish/ro'yxatdan o'tish), kabinet, profil tahrirlash
        ├── schools/             # 61 ta maktab katalogi, saralash va sahifalash
        ├── projects/            # Loyiha CRUD, 12 maydonli forma, izohlar, monitoring
        ├── voting/              # Atomar haftalik ovoz berish, tasdiqlash modali, filtrlar
        ├── groups/              # 8 ta boshqaruv guruhi va ichki muloqot
        ├── notifications/       # Shaxsiy bildirishnomalar markazi
        ├── nizom/               # 10 bobli rasmiy Nizom interaktiv akkordeoni
        └── administration/      # Super Administrator paneli va audit boshqaruvi
```

## Django bilan Taqqoslash

| Django tuzilmasi | Ushbu Next.js loyihadagi o‘rni |
| :--- | :--- |
| `project/settings.py` | `src/core/config/official-data.ts` + `.env.local` |
| `project/urls.py` | `src/app/**/page.tsx` |
| `project/middleware.py` | `src/proxy.ts` |
| `app/models.py` | `supabase/migrations/*.sql` + `src/core/types/database.ts` |
| `app/forms.py` / `serializers.py` | `src/core/validations/schemas.ts` |
| `app/views.py` (mutations) | `src/modules/<module>/actions.ts` |
| `app/templates/` | `src/modules/<module>/components/*.tsx` |
| `management/commands/` | `scripts/*.mjs` |
