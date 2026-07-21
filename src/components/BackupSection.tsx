'use client';

import { useRef, useState } from 'react';
import {
  createBackup,
  parseBackup,
  backupStats,
  backupFilename,
  restoreBackup,
  deliverBackupFile,
  type Backup,
  type RestoreMode,
} from '@/lib/backup';
import { PROFILE_STORAGE_KEY } from '@/hooks/useProfile';
import { useTranslation, getDateLocale } from '@/i18n';
import { formatDate } from '@/lib/format';

type Status =
  | { kind: 'idle' }
  | { kind: 'exporting' }
  | { kind: 'exported' }
  | { kind: 'restoring' }
  | { kind: 'error'; message: string };

export default function BackupSection() {
  const { t, locale } = useTranslation();
  const dateLocale = getDateLocale(locale);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [pending, setPending] = useState<Backup | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const busy = status.kind === 'exporting' || status.kind === 'restoring';

  const handleExport = async () => {
    setStatus({ kind: 'exporting' });
    try {
      const backup = await createBackup();
      const result = await deliverBackupFile(JSON.stringify(backup), backupFilename());
      setStatus(result === 'cancelled' ? { kind: 'idle' } : { kind: 'exported' });
    } catch {
      setStatus({ kind: 'error', message: t('backup.exportFailed') });
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // позволяет выбрать тот же файл повторно
    if (!file) return;

    try {
      const backup = parseBackup(await file.text());
      setPending(backup);
      setConfirmReplace(false);
      setStatus({ kind: 'idle' });
    } catch {
      setPending(null);
      setStatus({ kind: 'error', message: t('backup.invalidFile') });
    }
  };

  const handleRestore = async (mode: RestoreMode) => {
    if (!pending) return;
    if (mode === 'replace' && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }

    setStatus({ kind: 'restoring' });
    try {
      const activeProfileId = await restoreBackup(pending, mode);
      if (mode === 'replace' && activeProfileId != null) {
        localStorage.setItem(PROFILE_STORAGE_KEY, String(activeProfileId));
      }
      // Перезагрузка — самый надёжный способ пересобрать состояние после смены всех id
      window.location.reload();
    } catch {
      setStatus({ kind: 'error', message: t('backup.restoreFailed') });
    }
  };

  const stats = pending ? backupStats(pending) : null;

  return (
    <section>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
        {t('backup.title')}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Export */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-3">
            <div className="font-medium text-gray-900">{t('backup.export')}</div>
            <div className="text-xs text-gray-500">{t('backup.exportHint')}</div>
          </div>
          <button
            onClick={handleExport}
            disabled={busy}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 shrink-0"
          >
            {status.kind === 'exporting' ? '...' : t('backup.export')}
          </button>
        </div>

        {/* Import */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <div className="font-medium text-gray-900">{t('backup.import')}</div>
            <div className="text-xs text-gray-500">{t('backup.importHint')}</div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium disabled:opacity-50 shrink-0"
          >
            {t('backup.chooseFile')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {/* Status messages */}
        <div aria-live="polite">
          {status.kind === 'exported' && (
            <div className="px-4 py-3 bg-green-50 text-green-700 text-sm border-t border-green-100">
              ✓ {t('backup.exported')}
            </div>
          )}
          {status.kind === 'error' && (
            <div className="px-4 py-3 bg-red-50 text-red-600 text-sm border-t border-red-100">
              {status.message}
            </div>
          )}
          {status.kind === 'restoring' && (
            <div className="px-4 py-3 bg-gray-50 text-gray-600 text-sm border-t border-gray-100">
              {t('backup.restoring')}
            </div>
          )}
        </div>

        {/* Pending import: preview + mode choice */}
        {pending && stats && status.kind !== 'restoring' && (
          <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {t('backup.fileContains')}
              </div>
              <dl className="text-sm text-gray-700 space-y-0.5">
                {[
                  [t('backup.statProfiles'), stats.profiles],
                  [t('backup.statAccounts'), stats.accounts],
                  [t('backup.statSnapshots'), stats.snapshots],
                  [t('backup.statProjects'), stats.projects],
                  [t('backup.statTransactions'), stats.transactions],
                ].map(([label, count]) => (
                  <div key={label as string} className="flex justify-between">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-medium tabular-nums">{count}</dd>
                  </div>
                ))}
                <div className="flex justify-between pt-1">
                  <dt className="text-gray-500">{t('backup.fileDate')}</dt>
                  <dd className="font-medium">
                    {formatDate(new Date(pending.exportedAt), dateLocale)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">
              {t('backup.chooseMode')}
            </div>

            <button
              onClick={() => handleRestore('merge')}
              className="w-full text-left px-4 py-3 bg-white rounded-xl border border-gray-200"
            >
              <div className="font-medium text-gray-900 text-sm">{t('backup.modeMerge')}</div>
              <div className="text-xs text-gray-500">{t('backup.modeMergeHint')}</div>
            </button>

            <button
              onClick={() => handleRestore('replace')}
              className={`w-full text-left px-4 py-3 rounded-xl border ${
                confirmReplace ? 'bg-red-500 border-red-500' : 'bg-white border-gray-200'
              }`}
            >
              <div
                className={`font-medium text-sm ${confirmReplace ? 'text-white' : 'text-gray-900'}`}
              >
                {t('backup.modeReplace')}
              </div>
              <div className={`text-xs ${confirmReplace ? 'text-red-50' : 'text-gray-500'}`}>
                {confirmReplace ? t('backup.replaceWarning') : t('backup.modeReplaceHint')}
              </div>
            </button>

            <button
              onClick={() => {
                setPending(null);
                setConfirmReplace(false);
              }}
              className="w-full py-2.5 text-gray-500 text-sm font-medium"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2 px-1">{t('backup.pinNote')}</p>
    </section>
  );
}
