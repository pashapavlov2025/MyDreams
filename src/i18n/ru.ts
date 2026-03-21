const ru = {
  // Common
  'common.save': 'Сохранить',
  'common.cancel': 'Отмена',
  'common.delete': 'Удалить',
  'common.done': 'Готово',
  'common.no': 'Нет',
  'common.saving': 'Сохраняю...',
  'common.loading': 'Загрузка...',
  'common.reload': 'Перезагрузить',
  'common.update': 'Обновить',

  // Tab bar
  'tabs.dashboard': 'Главная',
  'tabs.accounts': 'Аккаунты',
  'tabs.projects': 'Проекты',
  'tabs.settings': 'Настройки',

  // Dashboard
  'dashboard.title': 'MyDreams',
  'dashboard.netWorth': 'Капитал',
  'dashboard.sinceLastUpdate': 'с прошлого обновления',
  'dashboard.addFirstAccount': 'Добавьте первый аккаунт',
  'dashboard.goToSettings': 'Нажмите + на вкладке Аккаунты',

  // Dream
  'dream.pathToDream': 'Путь к мечте',
  'dream.remaining': 'Осталось',
  'dream.setGoal': 'Установить цель',
  'dream.tapToChange': 'Нажмите чтобы изменить',
  'dream.whatIsYourDream': 'Какова ваша мечта?',
  'dream.title': 'Мечта',

  // Account types
  'accountType.bank': 'Банки',
  'accountType.cash': 'Наличные',
  'accountType.broker': 'Брокер',
  'accountType.crypto': 'Крипто',
  'accountType.realestate': 'Недвижимость',
  'accountType.debt': 'Долги',
  'accountType.other': 'Другое',

  // Account form
  'accountForm.edit': 'Редактировать',
  'accountForm.new': 'Новый аккаунт',
  'accountForm.name': 'Название',
  'accountForm.namePlaceholder': 'EUR, USD, Основной...',
  'accountForm.bankGroup': 'Банк / Группа',
  'accountForm.bankGroupPlaceholder': 'Revolut, Tinkoff, Wise...',
  'accountForm.type': 'Тип',
  'accountForm.currency': 'Валюта',
  'accountForm.uploadImage': 'Загрузить картинку',

  // Account row
  'accountRow.noData': 'Нет данных',

  // Account history
  'accountHistory.balance': 'Баланс',
  'accountHistory.history': 'История',
  'accountHistory.noRecords': 'Нет записей. Обновите балансы на вкладке "Аккаунты"',

  // Update balances
  'update.title': 'Аккаунты',
  'update.noAccounts': 'Нет аккаунтов',
  'update.addFirst': 'Нажмите + чтобы добавить первый',
  'update.was': 'Было',
  'update.updateBalances': 'Обновить балансы',

  // Settings
  'settings.title': 'Настройки',
  'settings.baseCurrency': 'Базовая валюта',
  'settings.accounts': 'Аккаунты',
  'settings.addAccount': '+ Добавить',
  'settings.noAccounts': 'Нет аккаунтов',
  'settings.archive': 'Архив',
  'settings.currencyRates': 'Курсы валют',
  'settings.updateRates': 'Обновить курсы',
  'settings.ratesUpdated': 'Обновлено',
  'settings.ratesNever': 'Не обновлялись',
  'settings.security': 'Безопасность',
  'settings.pinCode': 'PIN-код',
  'settings.pinSet': 'Установлен',
  'settings.pinNotSet': 'Не установлен',
  'settings.pinRemove': 'Убрать',
  'settings.pinChange': 'Сменить',
  'settings.pinSetup': 'Установить',
  'settings.pinEnterNew': 'Введите новый PIN (4 цифры)',
  'settings.pinConfirm': 'Повторите PIN',
  'settings.pinMismatch': 'PIN не совпадает',
  'settings.language': 'Язык',
  'settings.profiles': 'Профили',

  // Pin lock
  'pin.enterPin': 'Введите PIN-код',
  'pin.wrong': 'Неверный PIN',

  // Charts
  'charts.netWorth': 'Капитал',
  'charts.assetBreakdown': 'Структура активов',

  // Projects
  'projects.title': 'Проекты',
  'projects.empty': 'Нет проектов',
  'projects.emptyHint': 'Добавьте первый инвестиционный проект',
  'projects.add': 'Новый проект',
  'projects.name': 'Название',
  'projects.namePlaceholder': 'Вилла на Бали, Квартира...',
  'projects.description': 'Описание',
  'projects.descriptionPlaceholder': 'Краткое описание проекта',
  'projects.currency': 'Валюта',
  'projects.stage': 'Стадия',
  'projects.stage.building': 'Строительство',
  'projects.stage.operating': 'В работе',
  'projects.marketValue': 'Рыночная оценка',
  'projects.invested': 'Вложено',
  'projects.income': 'Доход',
  'projects.expenses': 'Расходы',
  'projects.pnl': 'P&L',
  'projects.roi': 'ROI',
  'projects.addTransaction': 'Добавить операцию',
  'projects.transaction.tranche': 'Транш',
  'projects.transaction.construction_expense': 'Расход на стройку',
  'projects.transaction.rental_income': 'Аренда',
  'projects.transaction.operating_expense': 'Операц. расход',
  'projects.transaction.sale': 'Продажа',
  'projects.amount': 'Сумма',
  'projects.category': 'Категория',
  'projects.categoryPlaceholder': 'Материалы, Работа...',
  'projects.noTransactions': 'Нет операций',
  'projects.deleteConfirm': 'Удалить проект и все операции?',
  'projects.edit': 'Редактировать',

  // Error
  'error.somethingWrong': 'Что-то пошло не так',

  // Profiles
  'profile.my': 'Мой',
  'profile.demo': 'Демо',
  'profile.new': 'Новый профиль',
  'profile.name': 'Название профиля',
  'profile.switch': 'Сменить профиль',
  'profile.create': 'Создать',
  'profile.deleteConfirm': 'Удалить профиль и все данные?',
} as const;

export type TranslationKey = keyof typeof ru;
export default ru;
