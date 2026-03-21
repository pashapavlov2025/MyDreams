'use client';

import { useState } from 'react';
import type { InvestmentProject, ProjectStage } from '@/db/models';
import { getAvailableCurrencies } from '@/lib/currency';
import { useTranslation, type TranslationKey } from '@/i18n';

interface ProjectFormProps {
  project?: InvestmentProject;
  onSave: (data: {
    name: string;
    description: string;
    stage: ProjectStage;
    currency: string;
    currentMarketValue: number;
  }) => void;
  onCancel: () => void;
}

export default function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [stage, setStage] = useState<ProjectStage>(project?.stage ?? 'building');
  const [currency, setCurrency] = useState(project?.currency ?? 'USD');
  const [marketValue, setMarketValue] = useState(project?.currentMarketValue?.toString() ?? '');

  const currencies = getAvailableCurrencies();

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      stage,
      currency,
      currentMarketValue: Number(marketValue) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl p-5 pb-[max(env(safe-area-inset-bottom),20px)] max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onCancel} className="text-gray-500 text-sm">{t('common.cancel')}</button>
          <h2 className="text-base font-bold">{project ? t('projects.edit') : t('projects.add')}</h2>
          <button onClick={handleSubmit} className="text-indigo-600 font-semibold text-sm">{t('common.save')}</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('projects.name')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('projects.namePlaceholder')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('projects.description')}</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('projects.descriptionPlaceholder')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">{t('projects.stage')}</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ProjectStage)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="building">{t('projects.stage.building')}</option>
                <option value="operating">{t('projects.stage.operating')}</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">{t('projects.currency')}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('projects.marketValue')}</label>
            <input
              type="number"
              inputMode="decimal"
              value={marketValue}
              onChange={(e) => setMarketValue(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
