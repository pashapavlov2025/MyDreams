import type { TranslationKey } from './ru';

const en: Record<TranslationKey, string> = {
  // Common
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.done': 'Done',
  'common.no': 'No',
  'common.saving': 'Saving...',
  'common.loading': 'Loading...',
  'common.reload': 'Reload',
  'common.update': 'Update',
  'common.goBack': 'Go back',
  'common.addAccount': 'Add account',
  'common.addProject': 'Add project',

  // Tab bar
  'tabs.dashboard': 'Dashboard',
  'tabs.accounts': 'Accounts',
  'tabs.projects': 'Projects',
  'tabs.settings': 'Settings',

  // Dashboard
  'dashboard.title': 'MyDreams',
  'dashboard.netWorth': 'Net Worth',
  'dashboard.sinceLastUpdate': 'since last update',
  'dashboard.addFirstAccount': 'Add your first account',
  'dashboard.goToSettings': 'Tap + on the Accounts tab',

  // Dream
  'dream.pathToDream': 'Path to dream',
  'dream.remaining': 'Remaining',
  'dream.setGoal': 'Set goal',
  'dream.tapToChange': 'Tap to change',
  'dream.whatIsYourDream': 'What is your dream?',
  'dream.title': 'Dream',

  // Account types
  'accountType.bank': 'Banks',
  'accountType.cash': 'Cash',
  'accountType.broker': 'Broker',
  'accountType.crypto': 'Crypto',
  'accountType.realestate': 'Real Estate',
  'accountType.debt': 'Debts',
  'accountType.other': 'Other',

  // Account form
  'accountForm.edit': 'Edit',
  'accountForm.new': 'New account',
  'accountForm.name': 'Name',
  'accountForm.namePlaceholder': 'EUR, USD, Main...',
  'accountForm.bankGroup': 'Bank / Group',
  'accountForm.bankGroupPlaceholder': 'Revolut, Tinkoff, Wise...',
  'accountForm.type': 'Type',
  'accountForm.currency': 'Currency',
  'accountForm.uploadImage': 'Upload image',

  // Account row
  'accountRow.noData': 'No data',

  // Account history
  'accountHistory.balance': 'Balance',
  'accountHistory.history': 'History',
  'accountHistory.noRecords': 'No records. Update balances on the "Accounts" tab',

  // Update balances
  'update.title': 'Accounts',
  'update.noAccounts': 'No accounts',
  'update.addFirst': 'Tap + to add your first',
  'update.was': 'Was',
  'update.updateBalances': 'Update balances',

  // Settings
  'settings.title': 'Settings',
  'settings.baseCurrency': 'Base currency',
  'settings.accounts': 'Accounts',
  'settings.addAccount': '+ Add',
  'settings.noAccounts': 'No accounts',
  'settings.archive': 'Archive',
  'settings.currencyRates': 'Currency rates',
  'settings.updateRates': 'Update rates',
  'settings.ratesUpdated': 'Updated',
  'settings.ratesNever': 'Never updated',
  'settings.security': 'Security',
  'settings.pinCode': 'PIN code',
  'settings.pinSet': 'Set',
  'settings.pinNotSet': 'Not set',
  'settings.pinRemove': 'Remove',
  'settings.pinChange': 'Change',
  'settings.pinSetup': 'Set up',
  'settings.pinEnterNew': 'Enter new PIN (4 digits)',
  'settings.pinConfirm': 'Repeat PIN',
  'settings.pinMismatch': 'PIN does not match',
  'settings.language': 'Language',
  'settings.profiles': 'Profiles',

  // Pin lock
  'pin.enterPin': 'Enter PIN',
  'pin.wrong': 'Wrong PIN',

  // Charts
  'charts.netWorth': 'Net Worth',
  'charts.assetBreakdown': 'Asset breakdown',

  // Projects
  'projects.title': 'Projects',
  'projects.empty': 'No projects',
  'projects.emptyHint': 'Add your first investment project',
  'projects.add': 'New project',
  'projects.name': 'Name',
  'projects.namePlaceholder': 'Bali Villa, Apartment...',
  'projects.description': 'Description',
  'projects.descriptionPlaceholder': 'Short project description',
  'projects.currency': 'Currency',
  'projects.stage': 'Stage',
  'projects.stage.building': 'Building',
  'projects.stage.operating': 'Operating',
  'projects.marketValue': 'Market value',
  'projects.invested': 'Invested',
  'projects.income': 'Income',
  'projects.expenses': 'Expenses',
  'projects.pnl': 'P&L',
  'projects.roi': 'ROI',
  'projects.addTransaction': 'Add transaction',
  'projects.transaction.tranche': 'Tranche',
  'projects.transaction.construction_expense': 'Construction',
  'projects.transaction.rental_income': 'Rental income',
  'projects.transaction.operating_expense': 'Operating exp.',
  'projects.transaction.sale': 'Sale',
  'projects.amount': 'Amount',
  'projects.category': 'Category',
  'projects.categoryPlaceholder': 'Materials, Labor...',
  'projects.noTransactions': 'No transactions',
  'projects.deleteConfirm': 'Delete project and all transactions?',
  'projects.edit': 'Edit',

  // Error
  'error.somethingWrong': 'Something went wrong',

  // Profiles
  'profile.my': 'My',
  'profile.demo': 'Demo',
  'profile.new': 'New profile',
  'profile.name': 'Profile name',
  'profile.switch': 'Switch profile',
  'profile.create': 'Create',
  'profile.deleteConfirm': 'Delete profile and all data?',

  // Backup / restore
  'backup.title': 'Data',
  'backup.export': 'Export',
  'backup.exportHint': 'Save a copy of all profiles to a file',
  'backup.exporting': 'Preparing file...',
  'backup.exported': 'File saved',
  'backup.exportFailed': 'Could not create the file',
  'backup.import': 'Import',
  'backup.importHint': 'Restore data from a file',
  'backup.chooseFile': 'Choose file',
  'backup.fileContains': 'File contains',
  'backup.fileDate': 'Created',
  'backup.statProfiles': 'Profiles',
  'backup.statAccounts': 'Accounts',
  'backup.statSnapshots': 'Balance records',
  'backup.statProjects': 'Projects',
  'backup.statTransactions': 'Transactions',
  'backup.chooseMode': 'How to restore?',
  'backup.modeReplace': 'Replace everything',
  'backup.modeReplaceHint': 'Delete current data and restore from the file',
  'backup.modeMerge': 'Add profiles',
  'backup.modeMergeHint': 'Keep current data, add profiles from the file',
  'backup.replaceWarning': 'All current data will be permanently deleted.',
  'backup.restoring': 'Restoring...',
  'backup.restoreFailed': 'Could not restore the data',
  'backup.invalidFile': 'This does not look like a MyDreams backup file',
  'backup.pinNote': 'PIN code and language are not part of the backup — set them up again after restoring.',

  // Push notifications
  'push.title': 'Reminders',
  'push.reminder': 'Remind me to update balances',
  'push.off': 'Off',
  'push.weekly': 'Weekly',
  'push.monthly': 'Monthly',
  'push.weeklyHint': 'On Mondays',
  'push.monthlyHint': 'On the 1st of each month',
  'push.enabling': 'Enabling...',
  'push.test': 'Test',
  'push.testSent': 'Notification sent',
  'push.errorUnsupported': 'This browser does not support notifications',
  'push.errorNotConfigured': 'Notification server is not configured',
  'push.errorDenied': 'Permission denied. Enable notifications for MyDreams in iOS settings',
  'push.errorInstall': 'Add the app to your Home Screen first: Share → Add to Home Screen',
  'push.errorFailed': 'Could not enable notifications',
  'push.note': 'The server stores only a delivery address and your chosen schedule. Balances stay on your device.',

  // Backup reminder
  'backup.lastBackup': 'Last backup',
  'backupReminder.title': 'No backup for a while',
  'backupReminder.never': 'You have never made a backup',
  'backupReminder.daysAgo': 'Days since last backup',
  'backupReminder.action': 'Back up now',
  'backupReminder.later': 'Later',

  // Archive
  'archive.restore': 'Restore',
  'archive.confirm': 'Archive',
  'archive.hasBalance': 'This account has a balance',
  'archive.hint': 'It will stop counting toward Net Worth. History is kept — you can restore it below.',

  // Projects: stages and valuation
  'projects.frozen': 'Paid into construction',
  'projects.operatingProfit': 'Operating profit',
  'projects.buildingNote': 'While under construction the project counts toward Net Worth at the amount paid in: the asset is not yours yet, this is frozen cash. Market value starts counting once it moves to operating.',
  'projects.valuation': 'Valuation',
  'projects.valuationHistory': 'Valuation history',
  'projects.addValuation': 'Add valuation',
  'projects.noValuations': 'No valuations yet',
  'projects.valuationHint': 'Updating once a quarter is enough',
  'projects.totalPnl': 'Total P&L',
  'charts.totalAssets': 'Assets',
  'update.accountActions': 'Account actions',
  'update.deleteWarning': 'The account and its full balance history will be permanently deleted.',
  'projects.leftToPay': 'Left to pay',
  'projects.inNetWorth': 'Counted in Net Worth',
};

export default en;
