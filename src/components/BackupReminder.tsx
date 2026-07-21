'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  shouldRemindBackup,
  snoozeBackupReminder,
  getLastBackupAt,
  daysSince,
} from '@/lib/backup';
import { useTranslation } from '@/i18n';

export default function BackupReminder({ hasData }: { hasData: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    // localStorage читаем только на клиенте — при пререндере его нет
    setShow(shouldRemindBackup(hasData));
    const last = getLastBackupAt();
    setDays(last ? daysSince(last) : null);
  }, [hasData]);

  if (!show) return null;

  return (
    <div className="mx-4 mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3" role="status">
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">📦</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-amber-900">
            {t('backupReminder.title')}
          </div>
          <div className="text-xs text-amber-700 mt-0.5">
            {days === null
              ? t('backupReminder.never')
              : `${t('backupReminder.daysAgo')}: ${days}`}
          </div>
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={() => router.push('/settings')}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium"
            >
              {t('backupReminder.action')}
            </button>
            <button
              onClick={() => {
                snoozeBackupReminder();
                setShow(false);
              }}
              className="px-3 py-1.5 text-amber-700 text-xs font-medium"
            >
              {t('backupReminder.later')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
