'use client';

import { useState } from 'react';
import type { InvestmentProject, ProjectStage, FamilyAccessMetadata } from '@/db/models';
import { getAvailableCurrencies } from '@/lib/currency';
import { useTranslation, type TranslationKey } from '@/i18n';

interface ProjectFormProps {
  project?: InvestmentProject;
  /**
   * Рыночной оценки здесь намеренно нет: она живёт в истории оценок
   * (секция «История оценок» на экране проекта). Держать её ещё и тут
   * значило бы иметь два источника правды — при сохранении формы свежая
   * запись затиралась бы старым значением.
   */
  onSave: (data: {
    name: string;
    description: string;
    stage: ProjectStage;
    operatingSince: Date | null;
    currency: string;
    metadata?: FamilyAccessMetadata;
  }) => void;
  onCancel: () => void;
}

export default function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [stage, setStage] = useState<ProjectStage>(project?.stage ?? 'building');
  const [currency, setCurrency] = useState(project?.currency ?? 'USD');
  const [metadata, setMetadata] = useState<FamilyAccessMetadata>(project?.metadata ?? {});
  const [showMetadata, setShowMetadata] = useState(Object.keys(project?.metadata ?? {}).length > 0);

  const currencies = getAvailableCurrencies();

  const handleSubmit = () => {
    if (!name.trim()) return;
    const trimmed: FamilyAccessMetadata = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string' && value.trim()) {
        (trimmed as Record<string, string>)[key] = value.trim();
      }
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
      stage,
      // Дату перехода ставим в момент ручного переключения стадии.
      // Уже проставленную не трогаем — иначе правка названия сдвигала бы историю.
      operatingSince:
        stage === 'operating' ? (project?.operatingSince ?? new Date()) : null,
      currency,
      metadata: Object.keys(trimmed).length > 0 ? trimmed : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Fixed header */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 py-3 border-b border-gray-200 pt-[max(env(safe-area-inset-top),12px)]">
        <button onClick={onCancel} className="text-gray-500 text-sm">{t('common.cancel')}</button>
        <h2 className="text-base font-bold">{project ? t('projects.edit') : t('projects.add')}</h2>
        <button onClick={handleSubmit} className="text-indigo-600 font-semibold text-sm">{t('common.save')}</button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(env(safe-area-inset-bottom),20px)]">
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

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowMetadata((s) => !s)}
              className="flex items-center justify-between w-full py-2 text-left"
            >
              <span className="text-sm font-semibold text-gray-700">{t('accountForm.metadataTitle')}</span>
              <span className="text-gray-400 text-lg">{showMetadata ? '−' : '+'}</span>
            </button>
            <p className="text-xs text-gray-400 mb-3">{t('accountForm.metadataHint')}</p>

            {showMetadata && (
              <div className="space-y-3">
                <MetadataField label={t('accountForm.contractNumber')} placeholder={t('accountForm.contractNumberPlaceholder')} value={metadata.contractNumber ?? ''} onChange={(v) => setMetadata((m) => ({ ...m, contractNumber: v }))} />
                <MetadataField label={t('accountForm.managerName')} placeholder={t('accountForm.managerNamePlaceholder')} value={metadata.managerName ?? ''} onChange={(v) => setMetadata((m) => ({ ...m, managerName: v }))} />
                <MetadataField label={t('accountForm.managerPhone')} placeholder={t('accountForm.managerPhonePlaceholder')} value={metadata.managerPhone ?? ''} onChange={(v) => setMetadata((m) => ({ ...m, managerPhone: v }))} inputMode="tel" />
                <MetadataField label={t('accountForm.managerEmail')} placeholder={t('accountForm.managerEmailPlaceholder')} value={metadata.managerEmail ?? ''} onChange={(v) => setMetadata((m) => ({ ...m, managerEmail: v }))} inputMode="email" />
                <MetadataField label={t('accountForm.organizationAddress')} placeholder={t('accountForm.organizationAddressPlaceholder')} value={metadata.organizationAddress ?? ''} onChange={(v) => setMetadata((m) => ({ ...m, organizationAddress: v }))} />
                <MetadataField label={t('accountForm.accessMethod')} placeholder={t('accountForm.accessMethodPlaceholder')} value={metadata.accessMethod ?? ''} onChange={(v) => setMetadata((m) => ({ ...m, accessMethod: v }))} />
                <MetadataField label={t('accountForm.country')} placeholder={t('accountForm.countryPlaceholder')} value={metadata.country ?? ''} onChange={(v) => setMetadata((m) => ({ ...m, country: v }))} />
                <MetadataField label={t('accountForm.documentsLocation')} placeholder={t('accountForm.documentsLocationPlaceholder')} value={metadata.documentsLocation ?? ''} onChange={(v) => setMetadata((m) => ({ ...m, documentsLocation: v }))} />
                <MetadataField label={t('accountForm.beneficiary')} placeholder={t('accountForm.beneficiaryPlaceholder')} value={metadata.beneficiary ?? ''} onChange={(v) => setMetadata((m) => ({ ...m, beneficiary: v }))} />
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('accountForm.notes')}</label>
                  <textarea
                    value={metadata.notes ?? ''}
                    onChange={(e) => setMetadata((m) => ({ ...m, notes: e.target.value }))}
                    placeholder={t('accountForm.notesPlaceholder')}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetadataField({ label, placeholder, value, onChange, inputMode }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; inputMode?: 'tel' | 'email' }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <input
        type={inputMode === 'email' ? 'email' : 'text'}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
