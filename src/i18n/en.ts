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

  // Tab bar
  'tabs.dashboard': 'Dashboard',
  'tabs.update': 'Update',
  'tabs.projects': 'Projects',
  'tabs.settings': 'Settings',

  // Dashboard
  'dashboard.title': 'MyDreams',
  'dashboard.netWorth': 'Net Worth',
  'dashboard.sinceLastUpdate': 'since last update',
  'dashboard.addFirstAccount': 'Add your first account',
  'dashboard.goToSettings': 'Go to Settings → Accounts',

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
  'accountHistory.noRecords': 'No records. Update balances on the "Update" tab',

  // Update balances
  'update.title': 'Update balances',
  'update.noAccounts': 'No accounts to update',
  'update.addInSettings': 'Add accounts in Settings',
  'update.was': 'Was',

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
};

export default en;
