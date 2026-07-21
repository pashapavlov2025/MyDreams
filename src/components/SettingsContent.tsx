'use client';

import { useState, useEffect } from 'react';
import { useDream } from '@/hooks/useDream';
import { useSettings, useCurrencyRates } from '@/hooks/useCurrency';
import { formatMoney, formatDate } from '@/lib/format';
import { getAvailableCurrencies } from '@/lib/currency';
import { setAppPin, removeAppPin, hasPin } from '@/components/PinLock';
import { useTranslation, getDateLocale, type Locale } from '@/i18n';
import { useProfile } from '@/hooks/useProfile';
import BackupSection from '@/components/BackupSection';

export default function SettingsContent() {
  const { dream, updateDream } = useDream();
  const { settings, updateBaseCurrency } = useSettings();
  const currencies = getAvailableCurrencies();
  const { t, locale, setLocale } = useTranslation();
  const dateLocale = getDateLocale(locale);
  const { profileId, profiles, switchProfile, createProfile, deleteProfile, createDemoProfile } = useProfile();

  const { loading: ratesLoading, lastUpdate: ratesLastUpdate, refreshRates } = useCurrencyRates();

  const [showNewProfile, setShowNewProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState<number | null>(null);

  const [editingDream, setEditingDream] = useState(false);
  const [dreamInput, setDreamInput] = useState('');
  const [dreamCurrency, setDreamCurrency] = useState('');
  const [pinEnabled, setPinEnabled] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    setPinEnabled(hasPin());
  }, []);

  const startEditDream = () => {
    setDreamInput(dream?.targetAmount?.toString() ?? '');
    setDreamCurrency(dream?.currency ?? settings?.baseCurrency ?? 'USD');
    setEditingDream(true);
  };

  const saveDream = async () => {
    const amount = Number(dreamInput);
    if (amount > 0) {
      await updateDream(amount, dreamCurrency);
    }
    setEditingDream(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <h1 className="text-lg font-bold text-center text-gray-900">{t('settings.title')}</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Dream Section */}
        <section>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('dream.title')}
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {editingDream ? (
              <div className="p-4 space-y-3">
                <input
                  type="number"
                  inputMode="decimal"
                  value={dreamInput}
                  onChange={(e) => setDreamInput(e.target.value)}
                  placeholder="1000000"
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-lg font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <select
                  value={dreamCurrency}
                  onChange={(e) => setDreamCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingDream(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={saveDream}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={startEditDream}
                className="w-full p-4 flex items-center text-left"
              >
                <span className="text-2xl mr-3">⭐</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {dream?.targetAmount
                      ? formatMoney(dream.targetAmount, dream.currency)
                      : t('dream.setGoal')}
                  </div>
                  <div className="text-xs text-gray-400">
                    {dream?.targetAmount ? t('dream.tapToChange') : t('dream.whatIsYourDream')}
                  </div>
                </div>
                <span className="text-gray-300">›</span>
              </button>
            )}
          </div>
        </section>

        {/* Base Currency */}
        <section>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('settings.baseCurrency')}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <select
              value={settings?.baseCurrency ?? 'USD'}
              onChange={(e) => updateBaseCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Language */}
        <section>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('settings.language')}
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex">
              {(['ru', 'en'] as Locale[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`flex-1 py-3 text-center font-medium transition-colors ${
                    locale === l
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {l === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Profiles */}
        <section>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('settings.profiles')}
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {profiles.map((p) => (
              <div
                key={p.id}
                className={`flex items-center px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                  p.id === profileId ? 'bg-indigo-50' : ''
                }`}
              >
                <button
                  onClick={() => switchProfile(p.id!)}
                  className="flex items-center flex-1 min-w-0 text-left"
                >
                  <span className="text-xl mr-3">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {p.name}
                      {p.isDemo && <span className="text-xs text-gray-400 ml-1">(demo)</span>}
                    </div>
                  </div>
                  {p.id === profileId && (
                    <span className="text-indigo-600 text-sm font-medium">✓</span>
                  )}
                </button>
                {profiles.length > 1 && (
                  confirmDeleteProfile === p.id ? (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={async () => {
                          await deleteProfile(p.id!);
                          setConfirmDeleteProfile(null);
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg font-medium"
                      >
                        {t('common.delete')}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteProfile(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-lg font-medium"
                      >
                        {t('common.no')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteProfile(p.id!)}
                      className="px-2 py-1 text-xs text-gray-400 ml-2"
                      aria-label={t('common.delete')}
                    >
                      🗑
                    </button>
                  )
                )}
              </div>
            ))}

            {showNewProfile ? (
              <div className="p-4 space-y-3 border-t border-gray-100">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder={t('profile.name')}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowNewProfile(false); setNewProfileName(''); }}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={async () => {
                      if (newProfileName.trim()) {
                        const id = await createProfile(newProfileName.trim(), '👤');
                        switchProfile(id);
                        setShowNewProfile(false);
                        setNewProfileName('');
                      }
                    }}
                    disabled={!newProfileName.trim()}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-40"
                  >
                    {t('profile.create')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 p-3 border-t border-gray-100">
                <button
                  onClick={() => setShowNewProfile(true)}
                  className="flex-1 py-2.5 text-indigo-600 font-medium text-sm"
                >
                  + {t('profile.new')}
                </button>
                {!profiles.some((p) => p.isDemo) && (
                  <button
                    onClick={createDemoProfile}
                    className="flex-1 py-2.5 bg-purple-50 text-purple-600 font-medium text-sm rounded-xl border border-purple-200"
                  >
                    🎭 {t('profile.demo')}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Backup / restore */}
        <BackupSection />

        {/* Currency Rates */}
        <section>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('settings.currencyRates')}
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{t('settings.updateRates')}</div>
                <div className="text-xs text-gray-400">
                  {ratesLastUpdate
                    ? `${t('settings.ratesUpdated')}: ${formatDate(ratesLastUpdate, dateLocale)}`
                    : t('settings.ratesNever')}
                </div>
              </div>
              <button
                onClick={refreshRates}
                disabled={ratesLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {ratesLoading ? '...' : t('common.update')}
              </button>
            </div>
          </div>
        </section>

        {/* PIN */}
        <section>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('settings.security')}
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {showPinSetup ? (
              <div className="p-4 space-y-3">
                <div className="text-sm font-medium text-gray-700">
                  {pinStep === 'enter' ? t('settings.pinEnterNew') : t('settings.pinConfirm')}
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinStep === 'enter' ? newPin : confirmPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPinError('');
                    if (pinStep === 'enter') {
                      setNewPin(val);
                      if (val.length === 4) {
                        setPinStep('confirm');
                      }
                    } else {
                      setConfirmPin(val);
                    }
                  }}
                  placeholder="••••"
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-center text-2xl tracking-[0.5em] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                {pinError && <div className="text-red-500 text-sm">{pinError}</div>}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowPinSetup(false);
                      setNewPin('');
                      setConfirmPin('');
                      setPinStep('enter');
                      setPinError('');
                    }}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  {pinStep === 'confirm' && (
                    <button
                      onClick={async () => {
                        if (confirmPin !== newPin) {
                          setPinError(t('settings.pinMismatch'));
                          setConfirmPin('');
                          return;
                        }
                        await setAppPin(newPin);
                        setPinEnabled(true);
                        setShowPinSetup(false);
                        setNewPin('');
                        setConfirmPin('');
                        setPinStep('enter');
                      }}
                      disabled={confirmPin.length !== 4}
                      className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-40"
                    >
                      {t('settings.pinSetup')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{t('settings.pinCode')}</div>
                  <div className="text-xs text-gray-400">
                    {pinEnabled ? t('settings.pinSet') : t('settings.pinNotSet')}
                  </div>
                </div>
                <div className="flex gap-2">
                  {pinEnabled && (
                    <button
                      onClick={() => { removeAppPin(); setPinEnabled(false); }}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium"
                    >
                      {t('settings.pinRemove')}
                    </button>
                  )}
                  <button
                    onClick={() => setShowPinSetup(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium"
                  >
                    {pinEnabled ? t('settings.pinChange') : t('settings.pinSetup')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
