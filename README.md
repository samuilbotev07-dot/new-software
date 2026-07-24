# Бизнес Контролна Система

Уеб приложение за собственици на физически бизнеси (салон, барбершоп, кафене, фитнес, магазин, сервиз): въвеждаш числата си веднъж месечно и получаваш реалната си печалба, марж, кеш, оценка на здравето на бизнеса (0–100), сравнения, ценови калкулатори, AI експорт и Excel експорт.

**Метод 5К:** Контрол → Кешфлоу → Калкулация → Корекция → Капитализация.

## Стек

- Next.js 15 (App Router, TypeScript strict) · Tailwind CSS 4
- Supabase (Postgres + Auth + RLS)
- Recharts · SheetJS (client-side Excel) · Vitest

## Стартиране

```bash
npm install
cp .env.example .env.local   # попълни двата ключа от Supabase
npm run dev
```

Схемата е в `supabase/migrations/` — прилага се поред в SQL editor-а на Supabase (или с `supabase db push`).

## Команди

| Команда | Какво прави |
|---|---|
| `npm run dev` | Локален сървър |
| `npm run build` | Production билд |
| `npm test` | Тестове на калкулационния енджин (Vitest) |
| `npm run lint` | ESLint |

## Архитектура

- **`lib/calc/`** — целият калкулационен енджин: чисти функции, без странични ефекти. Парите се смятат в евроцентове (цели числа); деление на нула винаги връща 0, UI показва „—". **Нула изчисления извън тази папка.**
- **`lib/i18n/bg.ts`** — всички текстове в интерфейса, на едно място.
- **`lib/db/`** — достъп до Supabase + преобразуване ред ↔ домейн тип. Базата пази въведеното, приложението смята.
- **`lib/ai-export/`** — генерира текст за AI консултант локално; нищо не се изпраща към API.
- **`lib/excel/`** — Excel експорт изцяло client-side.
- **RLS на всяка таблица** — потребител вижда само своите редове (тествано: изолация на четене и запис между потребители).

## Деплой (Vercel)

Env променливи: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (има и резервни константи в `lib/supabase/config.ts` — anon ключът е публичен по дизайн, данните пази RLS).

Текущият production деплой е във Vercel проекта `github` (може да се преименува от дашборда). Понеже репото е публично, билдът тегли кода директно от GitHub с install command:

```
curl -sL https://codeload.github.com/samuilbotev07-dot/new-software/tar.gz/refs/heads/<клон> | tar xz --strip-components=1 && npm install
```

За постоянна настройка: импортирай репото във Vercel (Add New → Project) — тогава всеки push деплойва автоматично и install command-ът не е нужен.

След деплой в Supabase → Authentication → URL Configuration задай **Site URL** на production адреса, за да работят имейл линковете (потвърждение и нова парола).
