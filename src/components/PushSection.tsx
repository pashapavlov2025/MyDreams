'use client';

import { useEffect, useState } from 'react';
import {
  enablePush,
  disablePush,
  getStoredCadence,
  getExistingSubscription,
  isPushSupported,
  isConfigured,
  needsHomeScreenInstall,
  sendTestNotification,
  PushError,
  type Cadence,
} from '@/lib/push';
import { useTranslation, type TranslationKey } from '@/i18n';

const ERROR_KEYS: Record<string, TranslationKey> = {
  unsupported: 'push.errorUnsupported',
  'not-configured': 'push.errorNotConfigured',
  denied: 'push.errorDenied',
  'install-required': 'push.errorInstall',
  failed: 'push.errorFailed',
};

const OPTIONS: { value: Cadence; label: TranslationKey; hint?: TranslationKey }[] = [
  { value: 'off', label: 'push.off' },
  { value: 'weekly', label: 'push.weekly', hint: 'push.weeklyHint' },
  { value: 'monthly', label: 'push.monthly', hint: 'push.monthlyHint' },
];

export default function PushSection() {
  const { t } = useTranslation();
  const [cadence, setCadence] = useState<Cadence>('off');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tested, setTested] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(isPushSupported() && isConfigured());
    // localStorage может расходиться с реальностью: пользователь мог отозвать
    // разрешение в системных настройках или переустановить приложение
    getExistingSubscription().then((sub) => {
      setCadence(sub && Notification.permission === 'granted' ? getStoredCadence() : 'off');
    });
  }, []);

  const choose = async (next: Cadence) => {
    if (next === cadence || busy) return;
    setBusy(true);
    setError(null);
    setTested(false);
    try {
      if (next === 'off') {
        await disablePush();
      } else {
        await enablePush(next);
      }
      setCadence(next);
    } catch (err) {
      const code = err instanceof PushError ? err.code : 'failed';
      setError(t(ERROR_KEYS[code] ?? 'push.errorFailed'));
    } finally {
      setBusy(false);
    }
  };

  const hint = needsHomeScreenInstall() ? t('push.errorInstall') : null;

  return (
    <section>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
        {t('push.title')}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <div className="font-medium text-gray-900">{t('push.reminder')}</div>
        </div>

        <div className="px-3 pb-3">
          <div className="flex gap-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => choose(opt.value)}
                disabled={busy || (!supported && opt.value !== 'off')}
                aria-pressed={cadence === opt.value}
                className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 ${
                  cadence === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {busy && cadence !== opt.value ? '...' : t(opt.label)}
              </button>
            ))}
          </div>
          {cadence !== 'off' && (
            <div className="text-xs text-gray-400 mt-2 px-1">
              {t(OPTIONS.find((o) => o.value === cadence)!.hint!)}
            </div>
          )}
        </div>

        <div aria-live="polite">
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-600 text-sm border-t border-red-100">
              {error}
            </div>
          )}
          {!error && hint && (
            <div className="px-4 py-3 bg-amber-50 text-amber-700 text-sm border-t border-amber-100">
              {hint}
            </div>
          )}
          {tested && (
            <div className="px-4 py-3 bg-green-50 text-green-700 text-sm border-t border-green-100">
              ✓ {t('push.testSent')}
            </div>
          )}
        </div>

        {cadence !== 'off' && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('push.test')}</span>
            <button
              onClick={async () => {
                setError(null);
                try {
                  await sendTestNotification();
                  setTested(true);
                } catch {
                  setError(t('push.errorFailed'));
                }
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium"
            >
              {t('push.test')}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2 px-1">{t('push.note')}</p>
    </section>
  );
}
