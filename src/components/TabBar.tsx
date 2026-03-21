'use client';

import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { path: '/', label: 'Dashboard', icon: '◉' },
  { path: '/update', label: 'Обновить', icon: '✎' },
  { path: '/projects', label: 'Проекты', icon: '◫' },
  { path: '/settings', label: 'Настройки', icon: '⚙' },
];

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

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
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
