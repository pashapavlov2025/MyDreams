'use client';

import { useState } from 'react';
import type { TransactionType } from '@/db/models';
import { useTranslation, type TranslationKey } from '@/i18n';

const TX_TYPES: TransactionType[] = [
  'tranche',
  'construction_expense',
  'rental_income',
  'operating_expense',
  'sale',
];

interface TransactionFormProps {
  projectId: number;
  onSave: (data: {
    projectId: number;
    type: TransactionType;
    amount: number;
    date: Date;
    category: string;
    description: string;
  }) => void;
  onCancel: () => void;
}

export default function TransactionForm({ projectId, onSave, onCancel }: TransactionFormProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<TransactionType>('tranche');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = () => {
    const numAmount = Number(amount);
    if (!numAmount) return;
    onSave({
      projectId,
      type,
      amount: numAmount,
      date: new Date(date),
      category: category.trim(),
      description: description.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Fixed header */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 py-3 border-b border-gray-200 pt-[max(env(safe-area-inset-top),12px)]">
        <button onClick={onCancel} className="text-gray-500 text-sm">{t('common.cancel')}</button>
        <h2 className="text-base font-bold">{t('projects.addTransaction')}</h2>
        <button onClick={handleSubmit} className="text-indigo-600 font-semibold text-sm">{t('common.save')}</button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(env(safe-area-inset-bottom),20px)]">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('projects.stage')}</label>
            <div className="flex flex-wrap gap-2">
              {TX_TYPES.map((txType) => (
                <button
                  key={txType}
                  onClick={() => setType(txType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    type === txType
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t(`projects.transaction.${txType}` as TranslationKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('projects.amount')}</label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('projects.category')}</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('projects.categoryPlaceholder')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('projects.description')}</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=""
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
