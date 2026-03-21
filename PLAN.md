# MyDreams - Personal Finance & Asset Tracker

## Vision
Персональное веб-приложение (PWA) для отслеживания всех активов и обязательств с минимальными усилиями.
Подход: **snapshot-based** — раз в месяц (или когда хочется) обновляешь балансы, приложение строит историю.
Отдельный модуль для инвестиционных проектов (вилла на Бали и подобные) с полным P&L.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS, мобильный дизайн (iOS-like)
- **Data**: IndexedDB (Dexie.js v4) — клиентское хранилище
- **Charts**: Recharts (area charts, pie charts)
- **Currency rates**: frankfurter.app (фиат) + CoinGecko (крипто)
- **Hosting**: Vercel
- **Security**: PIN-код (SHA-256, sessionStorage)

## Ключевые решения
- Web вместо iOS — доступ с любого устройства, быстрый деплой через Vercel
- IndexedDB (Dexie.js) — работает offline, без бэкенда на старте
- Snapshot-подход: каждая запись = "на эту дату баланс такой-то"
- PWA: можно установить на Home Screen

---

## Фазы разработки

### ФАЗА 1: Фундамент (MVP) ✅ ЗАВЕРШЕНА
**Цель**: Можно вносить аккаунты, записывать балансы, видеть тотал.

- [x] **1.1** Создать Next.js проект с Tailwind CSS
- [x] **1.2** Модели данных (Dexie.js / IndexedDB):
  - `Account` (название, тип, валюта, иконка, банк/группа, порядок сортировки, isArchived)
  - `BalanceSnapshot` (аккаунт, дата, сумма)
  - `CurrencyRate` (from, to, rate, date)
  - Типы аккаунтов: банк, наличные, брокер, крипто, недвижимость, долг, другое
- [x] **1.3** Главный экран — Dashboard:
  - Общий тотал (Net Worth) в базовой валюте
  - Двухуровневая группировка: по типу → по банку
  - Дата последнего обновления каждого аккаунта
- [x] **1.4** Экран "Обновить балансы" (bulk update):
  - Список всех аккаунтов с полями для ввода нового баланса
  - Кнопка "Сохранить" — записывает все изменённые балансы с текущей датой
- [x] **1.5** Добавление / редактирование / архивирование / удаление аккаунта
- [x] **1.6** Базовая конвертация валют (захардкоженные курсы как fallback)
- [x] **1.7** *(бонус)* Группировка аккаунтов по банкам (Revolut, Tinkoff...)
- [x] **1.8** *(бонус)* Кастомные иконки: emoji-пикер + загрузка картинки

### ФАЗА 2: История, аналитика, безопасность ✅ ЗАВЕРШЕНА
**Цель**: Видеть как менялось состояние во времени. Базовая защита данных.

- [x] **2.1** Экран истории по аккаунту (`/account/[id]`):
  - Список снапшотов с дельтами между ними
  - Area chart баланса по времени
  - Клик на аккаунт на дашборде → переход в историю
- [x] **2.2** График общего Net Worth по времени (Recharts AreaChart)
- [x] **2.3** Breakdown по типам активов (donut chart с процентами)
- [x] **2.4** Дельта: "+$X / -$X с прошлого обновления" на Dashboard
- [x] **2.5** Онлайн-курсы валют:
  - Фиат: frankfurter.app API
  - Крипто: CoinGecko API
  - Авто-обновление каждые 4 часа + ручное обновление в настройках
  - Кеширование в IndexedDB, fallback на захардкоженные курсы
- [x] **2.6** *(бонус)* PIN-код на вход:
  - 4-значный PIN, SHA-256 хеш в localStorage
  - Сессионная разблокировка (один раз за сессию браузера)
  - Установка / смена / удаление PIN в настройках

### ФАЗА 2.5: Архитектурный фундамент 🔧 В РАБОТЕ
**Цель**: Заложить основы, которые дорого переделывать позже.

- [ ] **2.5.1** Мультиязычность (i18n):
  - next-intl, языки: RU + EN
  - Все строки через ключи `t('key')`
  - Переключатель языка в настройках
  - Форматирование чисел/дат по локали
- [ ] **2.5.2** Мульти-профиль:
  - `Profile` модель (название, иконка, isDemo)
  - `profileId` во всех моделях (Account, Snapshot, Dream, Settings)
  - Переключатель профилей (шапка или настройки)
  - Демо-профиль с фейковыми данными (для показа друзьям)
  - Профили: "Мой", "Жена", "Демо" и т.п.
- [ ] **2.5.3** Базовый a11y:
  - Семантические HTML-теги
  - aria-labels на интерактивных элементах
  - Достаточный контраст текста

### ФАЗА 3: Инвестиционные проекты (Вилла на Бали и подобные)
**Цель**: Полный P&L по проектам типа "строящаяся вилла".

- [ ] **3.1** Модель `InvestmentProject`:
  - Название, описание, статус (строится/готово/продаётся)
  - Валюта проекта
  - Текущая рыночная оценка
- [ ] **3.2** Модель `ProjectTransaction`:
  - Тип: вложение, расход, доход от аренды, продажа
  - Сумма, дата, описание, категория
- [ ] **3.3** Экран проекта:
  - Суммарно вложено / Текущая оценка / P&L
  - Timeline транзакций
  - Ожидаемый доход от аренды (если применимо)
- [ ] **3.4** ROI калькулятор
- [ ] **3.5** Проекты учитываются в общем Net Worth

### ФАЗА 4: Бэкенд и синхронизация
**Цель**: Данные не теряются, доступны с любого устройства.

- [ ] **4.1** Бэкенд (Supabase или Firebase):
  - Авторизация (email / Google)
  - Хранение данных в облаке
- [ ] **4.2** Синхронизация IndexedDB ↔ облако
- [ ] **4.3** Обработка конфликтов при одновременном редактировании
- [ ] **4.4** E2E шифрование данных (клиентский ключ из пароля)

### ФАЗА 5: Polish & UX
**Цель**: Приятный, удобный UI.

- [ ] **5.1** Тёмная тема
- [ ] **5.2** Haptic feedback (PWA на iOS)
- [ ] **5.3** Экспорт данных (CSV / JSON)
- [ ] **5.4** Онбординг для первого запуска
- [ ] **5.5** Push-уведомления: "Пора обновить балансы"
- [ ] **5.6** Drag & drop сортировка аккаунтов

---

## Структура проекта

```
src/
├── app/
│   ├── layout.tsx              # Root layout + AppProvider + TabBar
│   ├── page.tsx                # Dashboard (home)
│   ├── account/[id]/page.tsx   # Account history
│   ├── update/page.tsx         # Bulk balance update
│   ├── projects/page.tsx       # Investment projects
│   └── settings/page.tsx       # Settings
├── components/
│   ├── AppProvider.tsx          # Currency rates loader + PinLock wrapper
│   ├── PinLock.tsx              # PIN-code lock screen
│   ├── DashboardContent.tsx     # Main dashboard with NW, delta, charts
│   ├── AccountRow.tsx           # Single account row (clickable → history)
│   ├── AccountForm.tsx          # Add/edit account form
│   ├── AccountHistoryContent.tsx # Account history with chart
│   ├── NetWorthChart.tsx        # NW area chart over time
│   ├── AssetBreakdown.tsx       # Donut chart by asset type
│   ├── DreamProgress.tsx        # Dream goal progress bar
│   ├── UpdateContent.tsx        # Bulk update page
│   ├── SettingsContent.tsx      # Settings page (dream, currency, accounts, PIN)
│   ├── TabBar.tsx               # Bottom navigation
│   └── ErrorBoundary.tsx        # Error handling
├── hooks/
│   ├── useAccounts.ts           # CRUD + accounts with balances
│   ├── useCurrency.ts           # Settings + live rates hook
│   ├── useDream.ts              # Dream goal CRUD
│   └── useSnapshots.ts          # Bulk snapshot update
├── db/
│   ├── database.ts              # Dexie.js DB schema + queries
│   └── models.ts                # TypeScript interfaces
└── lib/
    ├── currency.ts              # Conversion, live rates, API fetch
    └── format.ts                # Money & date formatting
```

## Приоритеты
- **Простота ввода данных** > красота UI
- **Snapshot-подход** > детальный учёт транзакций
- **Работает** > идеально спроектировано
- Итеративный подход: сначала работает, потом красиво
