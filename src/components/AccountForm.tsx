'use client';

import { useState } from 'react';
import type { AccountType } from '@/db/models';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ICONS } from '@/db/models';
import { getAvailableCurrencies } from '@/lib/currency';

interface AccountFormProps {
  initialData?: {
    name: string;
    type: AccountType;
    currency: string;
    icon: string;
  };
  onSave: (data: { name: string; type: AccountType; currency: string; icon: string }) => void;
  onCancel: () => void;
}

const accountTypes: AccountType[] = ['bank', 'cash', 'broker', 'crypto', 'realestate', 'debt', 'other'];

export default function AccountForm({ initialData, onSave, onCancel }: AccountFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<AccountType>(initialData?.type ?? 'bank');
  const [currency, setCurrency] = useState(initialData?.currency ?? 'USD');
  const currencies = getAvailableCurrencies();

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      type,
      currency,
      icon: ACCOUNT_TYPE_ICONS[type],
    });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/80 backdrop-blur-md">
        <button onClick={onCancel} className="text-indigo-600 font-medium">
          Отмена
        </button>
        <span className="font-semibold text-gray-900">
          {initialData ? 'Редактировать' : 'Новый аккаунт'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="text-indigo-600 font-semibold disabled:opacity-40"
        >
          Готово
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Название</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tinkoff, Wise EUR..."
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Тип</label>
          <div className="grid grid-cols-2 gap-2">
            {accountTypes.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  type === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span>{ACCOUNT_TYPE_ICONS[t]}</span>
                <span>{ACCOUNT_TYPE_LABELS[t]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Валюта</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
