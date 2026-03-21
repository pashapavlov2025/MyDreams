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
  'tabs.update': 'Обновить',
  'tabs.projects': 'Проекты',
  'tabs.settings': 'Настройки',

  // Dashboard
  'dashboard.title': 'MyDreams',
  'dashboard.netWorth': 'Капитал',
  'dashboard.sinceLastUpdate': 'с прошлого обновления',
  'dashboard.addFirstAccount': 'Добавьте первый аккаунт',
  'dashboard.goToSettings': 'Перейдите в Настройки → Аккаунты',

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
  'accountHistory.noRecords': 'Нет записей. Обновите балансы на вкладке "Обновить"',

  // Update balances
  'update.title': 'Обновить балансы',
  'update.noAccounts': 'Нет аккаунтов для обновления',
  'update.addInSettings': 'Добавьте аккаунты в Настройках',
  'update.was': 'Было',

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
