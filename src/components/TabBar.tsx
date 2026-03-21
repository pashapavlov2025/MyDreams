'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslation, type TranslationKey } from '@/i18n';

const tabs: { path: string; labelKey: TranslationKey; icon: string }[] = [
  { path: '/', labelKey: 'tabs.dashboard', icon: '📊' },
  { path: '/update', labelKey: 'tabs.accounts', icon: '💳' },
  { path: '/projects', labelKey: 'tabs.projects', icon: '📈' },
  { path: '/settings', labelKey: 'tabs.settings', icon: '⚙' },
];

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const active = tab.path === '/' ? pathname === '/' : pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] mt-0.5 font-medium">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
