'use client';

import { useState, useRef } from 'react';
import type { AccountType, AccountMetadata } from '@/db/models';
import { ACCOUNT_TYPE_KEYS, ACCOUNT_TYPE_ICONS } from '@/db/models';
import { getAvailableCurrencies } from '@/lib/currency';
import { useTranslation, type TranslationKey } from '@/i18n';

interface AccountFormData {
  name: string;
  type: AccountType;
  currency: string;
  icon: string;
  bankGroup?: string;
  metadata?: AccountMetadata;
}

interface AccountFormProps {
  initialData?: AccountFormData;
  existingGroups?: string[];
  onSave: (data: AccountFormData) => void;
  onCancel: () => void;
}

const accountTypes: AccountType[] = ['bank', 'cash', 'broker', 'crypto', 'realestate', 'debt', 'other'];

const POPULAR_EMOJIS = [
  '🏦', '💵', '📈', '💳', '🏠', '📦',
  '🪙', '💰', '🏧', '💎', '🔐', '🌍',
  '🇷🇺', '🇺🇸', '🇪🇺', '🇬🇧', '🇹🇭', '🇦🇪',
];

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function AccountForm({ initialData, existingGroups = [], onSave, onCancel }: AccountFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<AccountType>(initialData?.type ?? 'bank');
  const [currency, setCurrency] = useState(initialData?.currency ?? 'USD');
  const [icon, setIcon] = useState(initialData?.icon ?? ACCOUNT_TYPE_ICONS[initialData?.type ?? 'bank']);
  const [bankGroup, setBankGroup] = useState(initialData?.bankGroup ?? '');
  const [metadata, setMetadata] = useState<AccountMetadata>(initialData?.metadata ?? {});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showMetadata, setShowMetadata] = useState(Object.keys(initialData?.metadata ?? {}).length > 0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currencies = getAvailableCurrencies();
  const { t } = useTranslation();

  const isImageIcon = icon.startsWith('data:');

  const handleSubmit = () => {
    if (!name.trim()) return;
    const trimmed: AccountMetadata = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string' && value.trim()) {
        (trimmed as Record<string, string>)[key] = value.trim();
      }
    }
    onSave({
      name: name.trim(),
      type,
      currency,
      icon,
      bankGroup: bankGroup.trim() || undefined,
      metadata: Object.keys(trimmed).length > 0 ? trimmed : undefined,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 128);
    setIcon(dataUrl);
    setShowIconPicker(false);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/80 backdrop-blur-md">
        <button onClick={onCancel} className="text-indigo-600 font-medium">
          {t('common.cancel')}
        </button>
        <span className="font-semibold text-gray-900">
          {initialData ? t('accountForm.edit') : t('accountForm.new')}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="text-indigo-600 font-semibold disabled:opacity-40"
        >
          {t('common.done')}
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex justify-center">
          <button
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors overflow-hidden"
          >
            {isImageIcon ? (
              <img src={icon} alt="icon" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span className="text-3xl">{icon}</span>
            )}
          </button>
        </div>

        {showIconPicker && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-3">
            <div className="grid grid-cols-6 gap-2">
              {POPULAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { setIcon(emoji); setShowIconPicker(false); }}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                    icon === emoji ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-white'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 bg-white rounded-xl text-sm font-medium text-indigo-600 border border-indigo-200"
            >
              {t('accountForm.uploadImage')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">{t('accountForm.name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('accountForm.namePlaceholder')}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">{t('accountForm.bankGroup')}</label>
          <input
            type="text"
            value={bankGroup}
            onChange={(e) => setBankGroup(e.target.value)}
            placeholder={t('accountForm.bankGroupPlaceholder')}
            list="bank-groups"
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {existingGroups.length > 0 && (
            <datalist id="bank-groups">
              {existingGroups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">{t('accountForm.type')}</label>
          <div className="grid grid-cols-2 gap-2">
            {accountTypes.map((at) => (
              <button
                key={at}
                onClick={() => {
                  setType(at);
                  if (!isImageIcon && ACCOUNT_TYPE_ICONS[type] === icon) {
                    setIcon(ACCOUNT_TYPE_ICONS[at]);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  type === at
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span>{ACCOUNT_TYPE_ICONS[at]}</span>
                <span>{t(ACCOUNT_TYPE_KEYS[at] as TranslationKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">{t('accountForm.currency')}</label>
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
            <div className="space-y-4">
              <MetadataField
                label={t('accountForm.contractNumber')}
                placeholder={t('accountForm.contractNumberPlaceholder')}
                value={metadata.contractNumber ?? ''}
                onChange={(v) => setMetadata((m) => ({ ...m, contractNumber: v }))}
              />
              <MetadataField
                label={t('accountForm.managerName')}
                placeholder={t('accountForm.managerNamePlaceholder')}
                value={metadata.managerName ?? ''}
                onChange={(v) => setMetadata((m) => ({ ...m, managerName: v }))}
              />
              <MetadataField
                label={t('accountForm.managerPhone')}
                placeholder={t('accountForm.managerPhonePlaceholder')}
                value={metadata.managerPhone ?? ''}
                onChange={(v) => setMetadata((m) => ({ ...m, managerPhone: v }))}
                inputMode="tel"
              />
              <MetadataField
                label={t('accountForm.managerEmail')}
                placeholder={t('accountForm.managerEmailPlaceholder')}
                value={metadata.managerEmail ?? ''}
                onChange={(v) => setMetadata((m) => ({ ...m, managerEmail: v }))}
                inputMode="email"
              />
              <MetadataField
                label={t('accountForm.organizationAddress')}
                placeholder={t('accountForm.organizationAddressPlaceholder')}
                value={metadata.organizationAddress ?? ''}
                onChange={(v) => setMetadata((m) => ({ ...m, organizationAddress: v }))}
              />
              <MetadataField
                label={t('accountForm.accessMethod')}
                placeholder={t('accountForm.accessMethodPlaceholder')}
                value={metadata.accessMethod ?? ''}
                onChange={(v) => setMetadata((m) => ({ ...m, accessMethod: v }))}
              />
              <MetadataField
                label={t('accountForm.country')}
                placeholder={t('accountForm.countryPlaceholder')}
                value={metadata.country ?? ''}
                onChange={(v) => setMetadata((m) => ({ ...m, country: v }))}
              />
              <MetadataField
                label={t('accountForm.documentsLocation')}
                placeholder={t('accountForm.documentsLocationPlaceholder')}
                value={metadata.documentsLocation ?? ''}
                onChange={(v) => setMetadata((m) => ({ ...m, documentsLocation: v }))}
              />
              <MetadataField
                label={t('accountForm.beneficiary')}
                placeholder={t('accountForm.beneficiaryPlaceholder')}
                value={metadata.beneficiary ?? ''}
                onChange={(v) => setMetadata((m) => ({ ...m, beneficiary: v }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{t('accountForm.notes')}</label>
                <textarea
                  value={metadata.notes ?? ''}
                  onChange={(e) => setMetadata((m) => ({ ...m, notes: e.target.value }))}
                  placeholder={t('accountForm.notesPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetadataField({
  label,
  placeholder,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: 'tel' | 'email';
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={inputMode === 'email' ? 'email' : 'text'}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
