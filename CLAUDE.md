# MyDreams — Developer Guide

## Что это

Персональный трекер финансов и активов (PWA + iOS). Snapshot-based подход — раз в месяц обновляешь балансы, приложение строит историю и показывает P&L.

## Quick Start

```bash
npm install
npm run dev          # localhost:3000
npm run build        # production build (static export)
npm run build:ios    # build + cap sync ios
npm run open:ios     # открыть Xcode
```

## Tech Stack

| Layer | Технология |
|-------|-----------|
| Framework | Next.js 14 (App Router), TypeScript |
| UI | Tailwind CSS 3, Recharts |
| Data | IndexedDB через Dexie.js v4 (offline-first) |
| i18n | Свой контекст, RU + EN |
| Курсы валют | frankfurter.app (фиат) + CoinGecko (крипто) |
| Мобилка | Capacitor 8 (iOS), PWA |
| Безопасность | PIN-код (SHA-256 + sessionStorage) |

## Архитектура

```
src/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx           # Root: AppProvider + TabBar
│   ├── page.tsx             # / — Dashboard
│   ├── account/[id]/        # /account/:id — история аккаунта
│   │   ├── page.tsx         # Server wrapper (generateStaticParams)
│   │   └── client.tsx       # Client component
│   ├── update/page.tsx      # /update — массовое обновление балансов
│   ├── projects/
│   │   ├── page.tsx         # /projects — список проектов
│   │   └── [id]/            # /projects/:id — P&L проекта
│   │       ├── page.tsx     # Server wrapper
│   │       └── client.tsx   # Client component
│   └── settings/page.tsx    # /settings
├── components/              # React-компоненты
├── hooks/                   # Бизнес-логика (CRUD, P&L)
├── db/                      # Dexie.js схема + модели
├── i18n/                    # Переводы (ru.ts, en.ts)
└── lib/                     # Утилиты (валюта, форматирование)
```

### Динамические роуты и Static Export

Next.js с `output: 'export'` не поддерживает динамические роуты без `generateStaticParams`. Решение: `page.tsx` — server component с `generateStaticParams([{id:'0'}])`, `client.tsx` — `'use client'` с `useParams()`.

## Database (Dexie.js)

### Таблицы (V2, текущая)

```
profiles:             ++id, name, isDemo
accounts:             ++id, profileId, name, type, currency, isArchived, sortOrder
snapshots:            ++id, accountId, date
currencyRates:        ++id, [from+to], date
projects:             ++id, profileId, name, stage
projectTransactions:  ++id, projectId, type, date
dreams:               ++id, profileId
settings:             ++id, profileId
```

### Модели (src/db/models.ts)

- **Profile**: `{name, icon, isDemo, createdAt}`
- **Account**: `{profileId, name, type, currency, icon, bankGroup?, sortOrder, isArchived}`
- **BalanceSnapshot**: `{accountId, date, amount}`
- **InvestmentProject**: `{profileId, name, description, stage, currency, currentMarketValue}`
- **ProjectTransaction**: `{projectId, type, amount, date, category, description}`
- **Dream**: `{profileId, targetAmount, currency}`
- **Settings**: `{profileId, baseCurrency, lastRatesUpdate}`

### Типы

```typescript
AccountType = 'bank' | 'cash' | 'broker' | 'crypto' | 'realestate' | 'debt' | 'other'
ProjectStage = 'building' | 'operating'
TransactionType = 'tranche' | 'construction_expense' | 'rental_income' | 'operating_expense' | 'sale'
```

## Hooks (бизнес-логика)

| Hook | Что делает |
|------|-----------|
| `useAccounts()` | CRUD аккаунтов + `useAccountsWithBalances()` с последним балансом |
| `useProjects()` | CRUD проектов + `useProjectsWithPnL()` с расчётом P&L и ROI |
| `useProjectTransactions(id)` | CRUD транзакций проекта |
| `useDream()` | Цель (мечта) — get/set targetAmount |
| `useSnapshots()` | Массовое создание снапшотов (экран Update) |
| `useCurrency()` | Настройки + автоподгрузка курсов (stale > 4ч) |
| `useProfile()` | Контекст профиля + переключение + создание/удаление |

### Паттерн CRUD хуков

```typescript
// Все хуки используют useLiveQuery из dexie-react-hooks для реактивности
const data = useLiveQuery(
  () => db.table.where('profileId').equals(profileId).toArray(),
  [profileId],
  [] // default value
);
// CRUD через useCallback + db.table.add/update/delete
```

## Компоненты

### Ключевые

| Компонент | Описание |
|-----------|----------|
| `AppProvider` | Обёртка: I18n → Profile → PinLock → Capacitor plugins |
| `DashboardContent` | Net Worth (аккаунты + проекты), delta, графики, группировка |
| `ProjectsContent` | Список проектов с суммарной стоимостью |
| `ProjectDetailContent` | P&L проекта: вложено/доход/расходы/ROI + timeline транзакций |
| `TabBar` | Нижняя навигация (`<nav>`): Dashboard, Accounts, Projects, Settings |
| `LoadingScreen` | Локализованный loading spinner, используется в dynamic() импортах |

### Формы

Все формы — fullscreen модальные окна (не bottom sheet!) для корректной работы с мобильной клавиатурой:
- `AccountForm` — создание/редактирование аккаунта
- `ProjectForm` — создание/редактирование проекта
- `TransactionForm` — добавление транзакции в проект

### Net Worth формула

```
Net Worth = Σ(аккаунты, конвертированные в baseCurrency)
          - Σ(долги, |сумма| в baseCurrency)
          + Σ(проекты, marketValue в baseCurrency)
```

## i18n

- Файлы: `src/i18n/ru.ts` (основной, определяет `TranslationKey`), `src/i18n/en.ts`
- Ключи типизированы: `t('projects.title')` — автокомплит
- Добавление ключа: сначала в `ru.ts`, потом в `en.ts`
- `getDateLocale(locale)` → `'ru-RU'` / `'en-US'`

## Capacitor (iOS)

```
capacitor.config.ts    # appId: com.mydreams.app, webDir: out
ios/                   # Xcode проект
```

### Сборка

```bash
npm run build:ios      # next build → cap sync ios
npm run open:ios       # открыть в Xcode
# В Xcode: настроить Signing Team → Build & Run
```

### Плагины
- `@capacitor/status-bar` — белый статусбар
- `@capacitor/keyboard` — авторесайз при клавиатуре

## Валюта и форматирование

- `convertToBase(amount, from, to)` — конвертация через USD как pivot
- `formatMoney(amount, currency)` — `$15,000` / `$1.50M`
- `formatMoneyShort(amount, currency)` — `$15K` / `$1.5M`
- Fallback курсы захардкожены, live обновляются из API

## Фазы разработки

| Фаза | Статус | Что |
|------|--------|-----|
| 1. MVP | ✅ | Аккаунты, балансы, Dashboard, Net Worth |
| 2. Аналитика | ✅ | Графики, история, курсы валют, PIN |
| 2.5 Архитектура | ✅ | i18n, мульти-профиль, демо, базовый a11y |
| 3. Проекты | ✅ | Инвест. проекты, P&L, ROI, транзакции |
| 3.5 iOS/App Store | 🔧 | Capacitor сборка готова, нужен Xcode для публикации |
| 4. Бэкенд | 📋 | Supabase/Firebase, синхронизация, E2E шифрование |
| 5. Polish | 📋 | Тёмная тема, экспорт, онбординг, push |

## Правила

- Все данные привязаны к `profileId`
- Soft delete для аккаунтов (`isArchived`), hard delete для проектов
- Формы — fullscreen, не bottom sheet (клавиатура на мобилке)
- При удалении аккаунта каскадно удаляются снапшоты
- При удалении проекта каскадно удаляются транзакции
- Все суммы хранятся в оригинальной валюте, конвертация — runtime
