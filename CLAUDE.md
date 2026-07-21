# MyDreams — Developer Guide

## Что это

Персональный трекер финансов и активов (PWA + iOS). Snapshot-based подход — раз в месяц обновляешь балансы, приложение строит историю и показывает P&L.

## Quick Start

```bash
npm install
npm run dev          # localhost:3000
npm run build        # production build (static export)
npm run build:ios    # build + cap sync ios
npm test             # тест бэкапа (экспорт/импорт round-trip)
npm run open:ios     # открыть Xcode
```

## Tech Stack

| Layer | Технология |
|-------|-----------|
| Framework | Next.js 14 (App Router), TypeScript |
| UI | Tailwind CSS 3, Recharts |
| Data | IndexedDB через Dexie.js v4 (offline-first) |
| i18n | Свой контекст, RU + EN |
| Курсы валют | open.er-api.com (фиат) + CoinGecko (крипто) |
| Мобилка | Capacitor 8 (iOS), PWA |
| Безопасность | PIN-код (SHA-256 + sessionStorage) |

## Архитектура

```
src/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx           # Root: AppProvider + TabBar
│   ├── page.tsx             # / — Dashboard
│   ├── account/             # /account?id=N — история аккаунта
│   │   ├── page.tsx         # Server wrapper
│   │   └── client.tsx       # Client component (useSearchParams)
│   ├── update/page.tsx      # /update — массовое обновление балансов
│   ├── projects/page.tsx    # /projects — список проектов
│   ├── project/             # /project?id=N — P&L проекта
│   │   ├── page.tsx         # Server wrapper
│   │   └── client.tsx       # Client component (useSearchParams)
│   └── settings/page.tsx    # /settings
├── components/              # React-компоненты
├── hooks/                   # Бизнес-логика (CRUD, P&L)
├── db/                      # Dexie.js схема + модели
├── i18n/                    # Переводы (ru.ts, en.ts)
└── lib/                     # Утилиты (валюта, форматирование, бэкап)
```

### Почему id в query, а не в пути

`output: 'export'` генерирует статические файлы, поэтому динамический роут
существует только для тех id, которые вернул `generateStaticParams`. Раньше он
возвращал `[{ id: '0' }]` — собиралась ровно одна страница `/account/0`, а Dexie
нумерует с единицы, так что экран истории в проде отдавал 404 для любого счёта.
На дев-сервере баг не воспроизводился: там роуты резолвятся на лету.

Сейчас id передаётся query-параметром: `/account?id=5`, `/project?id=3`. Страница
одна, статическая, работает и на Vercel, и в Capacitor офлайн. Детальная страница
проекта называется `/project` (единственное число), чтобы не конфликтовать со
списком `/projects`.

`useSearchParams()` требует обёртки в `<Suspense>` — при пререндере параметров нет,
они появляются только на клиенте. Без обёртки сборка падает.

**Не возвращайся к `[id]`-роутам** без отказа от `output: 'export'`.

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
capacitor.config.ts    # appId: com.milliondollardream.app, webDir: out
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
- Fallback курсы захардкожены, live обновляются из API (stale > 4ч)

### Закрытый список валют

`FALLBACK_RATES_TO_USD` — источник правды: его ключи формируют выпадающие списки
через `getAvailableCurrencies()`. Живые курсы фильтруются по `LIVE_FIAT`, потому
что `open.er-api.com` отдаёт 160+ валют и без фильтра они раздули бы UI.

Добавление валюты: ключ в `FALLBACK_RATES_TO_USD` + символ в `getCurrencySymbol()`
+ код в `LIVE_FIAT` (если фиат).

Раньше источником был `frankfurter.app`, но он отдаёт курсы ЕЦБ — там нет ни
рубля (не публикуется с марта 2022), ни тенге, ни дирхама. Код их запрашивал,
молча не получал и оставлял захардкоженные значения.

`convertToBase` для валюты без курса считает 1:1 к доллару и пишет в консоль —
молча это искажало бы Net Worth в сотни раз. Единственный путь попадания такой
валюты в базу — импорт, поэтому `parseBackup` отклоняет файл с неизвестной
валютой (`isSupportedCurrency`).

## Бэкап и перенос между устройствами

Данные живут только в IndexedDB на устройстве — это принципиальное решение (нет бэкенда,
нет утечек). Перенос и бэкап делаются файлом.

`src/lib/backup.ts`:

| Функция | Что делает |
|---------|-----------|
| `createBackup()` | Собирает все профили и таблицы в один JSON-объект |
| `parseBackup(text)` | Валидирует файл и оживляет даты (после JSON.parse они строки) |
| `restoreBackup(backup, mode)` | Восстанавливает; возвращает id профиля для активации |
| `deliverBackupFile(json, name)` | Отдаёт файл юзеру (Web Share → fallback на download) |
| `backupStats(backup)` | Счётчики для превью перед импортом |

### Режимы восстановления

- `merge` — добавляет профили из файла к текущим. При совпадении имён — суффикс `(import)`.
- `replace` — стирает всё и восстанавливает из файла. Требует подтверждения в UI.

Оба режима **всегда перевыдают id заново** и перепривязывают ссылки
(`profileId`, `accountId`, `projectId`). Поэтому merge не конфликтует с
существующими данными, а replace не зависит от счётчиков autoincrement.
Осиротевшие записи (снапшот без аккаунта и т.п.) отбрасываются.
Всё внутри одной Dexie-транзакции — половинчатого восстановления не бывает.

После восстановления страница перезагружается: все id сменились, проще пересобрать
состояние с нуля, чем инвалидировать хуки.

### Почему Web Share, а не просто `<a download>`

На iOS в standalone-режиме (иконка на Home Screen) `<a download>` не работает.
`navigator.share({files})` открывает системный шит — оттуда «Save to Files» или
AirDrop на второе устройство. Это и есть основной сценарий переноса.
На десктопе `canShare` возвращает false и код падает в обычное скачивание.

### Что НЕ входит в бэкап

- `currencyRates` — кеш, подтягивается из API заново
- PIN-код и язык — они в localStorage, привязаны к устройству

`npm test` гоняет round-trip: экспорт → JSON → импорт в обоих режимах,
плюс проверка ремаппинга id, отсутствия сирот и сохранности дат.

## Push-напоминания

Приложение — статический экспорт, **API-роутов в нём быть не может**. Поэтому
сервер вынесен в отдельный проект Vercel: один репозиторий, два деплоя.

```
my-dreams        → my-dreams-eta.vercel.app   (статика, root = .)
mydreams-push    → mydreams-push.vercel.app   (API + крон, root = server/)
```

| Файл | Что делает |
|------|-----------|
| `public/sw.js` | service worker: показ уведомления и переход по клику |
| `src/lib/push.ts` | подписка/отписка, определение iOS и standalone |
| `src/components/PushSection.tsx` | UI в настройках: выкл / неделя / месяц |
| `server/api/subscribe.js` | сохраняет подписку |
| `server/api/cron.js` | ежедневный крон, решает кому слать |
| `server/lib/store.js` | Upstash Redis |

### Что лежит на сервере

Адрес доставки (endpoint у Apple), два ключа шифрования, периодичность,
часовой пояс и дата последней отправки. **Финансовых данных нет.**

### Ограничения, из которых вырос дизайн

- **iOS**: push работает только для приложения, добавленного на домашний экран.
  Во вкладке Safari подписка не создастся. Отсюда `needsHomeScreenInstall()`.
- **`Notification.requestPermission()`** обязан вызываться из пользовательского
  жеста, иначе iOS молча откажет.
- **Vercel Hobby**: крон разрешён раз в сутки, точность ±59 минут. Поэтому крон
  ежедневный, а «нужный ли сегодня день» считается в часовом поясе подписчика.
- **Защита Vercel SSO у `mydreams-push` снята** — иначе телефон не достучится.
  Эндпоинт публичный, поэтому `subscribe` проверяет, что адрес принадлежит
  настоящему push-сервису, и ограничивает число подписок.

### Переменные окружения

`mydreams-push`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
`CRON_SECRET`, `ALLOWED_ORIGINS`, `KV_REST_API_*` (от интеграции Upstash).

`my-dreams`: `NEXT_PUBLIC_PUSH_API_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
Они `NEXT_PUBLIC_`, то есть вшиваются в бандл на сборке — **после их изменения
нужен передеплой**, иначе клиент продолжит работать со старыми значениями.

Мёртвые подписки (404/410 от push-сервиса) крон удаляет сам: так бывает, когда
приложение убрали с домашнего экрана или переустановили.

**`vercel env pull` маскирует секреты как `[SENSITIVE]`** — не пытайся достать
через него реальное значение `CRON_SECRET`, вернётся маска.

## Фазы разработки

| Фаза | Статус | Что |
|------|--------|-----|
| 1. MVP | ✅ | Аккаунты, балансы, Dashboard, Net Worth |
| 2. Аналитика | ✅ | Графики, история, курсы валют, PIN |
| 2.5 Архитектура | ✅ | i18n, мульти-профиль, демо, базовый a11y |
| 3. Проекты | ✅ | Инвест. проекты, P&L, ROI, транзакции |
| 3.5 iOS/App Store | ⏸️ | Отложено — используется как web app на iOS (выглядит нативно) |
| 4. Бэкенд | 📋 | Supabase/Firebase, синхронизация, E2E шифрование |
| 5. Polish | 🔧 | Экспорт/импорт ✅, push ✅, дальше: тёмная тема, онбординг |

## Правила

- Все данные привязаны к `profileId`
- Soft delete для аккаунтов (`isArchived`), hard delete для проектов
- Формы — fullscreen, не bottom sheet (клавиатура на мобилке)
- При удалении аккаунта каскадно удаляются снапшоты
- При удалении проекта каскадно удаляются транзакции
- Все суммы хранятся в оригинальной валюте, конвертация — runtime
