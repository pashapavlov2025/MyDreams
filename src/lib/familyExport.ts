import type { Account, AccountMetadata, Profile, InvestmentProject } from '@/db/models';
import { formatMoney, formatDate } from '@/lib/format';
import { ACCOUNT_TYPE_ICONS } from '@/db/models';
import type { Locale } from '@/i18n';

export interface FamilyAccessAccount extends Account {
  latestBalance: number;
  latestDate: Date | null;
}

export interface FamilyExportContext {
  profile: Profile;
  accounts: FamilyAccessAccount[];
  projects: InvestmentProject[];
  baseCurrency: string;
  locale: string;
  t: (key: FamilyExportKey) => string;
}

export type FamilyExportKey =
  | 'familyExport.title'
  | 'familyExport.subtitle'
  | 'familyExport.generatedAt'
  | 'familyExport.disclaimer'
  | 'familyExport.noPasswords'
  | 'familyExport.lastUpdate'
  | 'familyExport.noRecords'
  | 'familyExport.contractNumber'
  | 'familyExport.manager'
  | 'familyExport.organizationAddress'
  | 'familyExport.accessMethod'
  | 'familyExport.country'
  | 'familyExport.documentsLocation'
  | 'familyExport.beneficiary'
  | 'familyExport.notes'
  | 'familyExport.emptyHint'
  | 'familyExport.sectionTitle'
  | 'familyExport.sectionHint'
  | 'familyExport.export'
  | 'familyExport.exporting'
  | 'familyExport.shared'
  | 'familyExport.downloaded'
  | 'familyExport.failed'
  | 'familyExport.readyCount'
  | 'familyExport.projectsTitle'
  | 'familyExport.stageBuilding'
  | 'familyExport.stageOperating'
  | 'familyExport.currency';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function metadataRow(label: string, value: string | undefined): string {
  if (!value) return '';
  return `
    <div class="meta-row">
      <div class="meta-label">${escapeHtml(label)}</div>
      <div class="meta-value">${escapeHtml(value).replace(/\n/g, '<br>')}</div>
    </div>
  `;
}

function renderIcon(icon: string): string {
  if (icon.startsWith('data:')) {
    return `<img src="${escapeHtml(icon)}" alt="" class="account-icon-img" />`;
  }
  return `<span class="account-icon">${escapeHtml(icon)}</span>`;
}

function accountCard(account: FamilyAccessAccount, ctx: FamilyExportContext): string {
  const { t, locale } = ctx;
  const meta = account.metadata ?? {};
  const icon = account.icon || ACCOUNT_TYPE_ICONS[account.type] || '📦';
  const managerParts: string[] = [];
  if (meta.managerName) managerParts.push(meta.managerName);
  if (meta.managerPhone) managerParts.push(meta.managerPhone);
  if (meta.managerEmail) managerParts.push(meta.managerEmail);

  const managerValue = managerParts.length > 0
    ? managerParts.join(' • ')
    : '';

  return `
    <div class="account-card">
      <div class="account-header">
        <div class="account-title">
          ${renderIcon(icon)}
          <div>
            <div class="account-name">${escapeHtml(account.name)}</div>
            ${account.bankGroup ? `<div class="account-bank">${escapeHtml(account.bankGroup)}</div>` : ''}
          </div>
        </div>
        <div class="account-balance">
          <div>${formatMoney(account.latestBalance, account.currency)}</div>
          ${account.latestDate ? `<div class="account-date">${t('familyExport.lastUpdate')}: ${formatDate(account.latestDate, locale)}</div>` : ''}
        </div>
      </div>
      ${Object.keys(meta).length === 0 ? `<div class="empty-hint">${escapeHtml(t('familyExport.emptyHint'))}</div>` : `
        <div class="meta-grid">
          ${metadataRow(t('familyExport.contractNumber'), meta.contractNumber)}
          ${managerValue ? metadataRow(t('familyExport.manager'), managerValue) : ''}
          ${metadataRow(t('familyExport.organizationAddress'), meta.organizationAddress)}
          ${metadataRow(t('familyExport.accessMethod'), meta.accessMethod)}
          ${metadataRow(t('familyExport.country'), meta.country)}
          ${metadataRow(t('familyExport.documentsLocation'), meta.documentsLocation)}
          ${metadataRow(t('familyExport.beneficiary'), meta.beneficiary)}
          ${metadataRow(t('familyExport.notes'), meta.notes)}
        </div>
      `}
    </div>
  `;
}

function projectCard(project: InvestmentProject, ctx: FamilyExportContext): string {
  const { t } = ctx;
  const meta = project.metadata ?? {};
  const stageLabel = project.stage === 'building'
    ? t('familyExport.stageBuilding')
    : t('familyExport.stageOperating');

  const managerParts: string[] = [];
  if (meta.managerName) managerParts.push(meta.managerName);
  if (meta.managerPhone) managerParts.push(meta.managerPhone);
  if (meta.managerEmail) managerParts.push(meta.managerEmail);

  const managerValue = managerParts.length > 0
    ? managerParts.join(' • ')
    : '';

  return `
    <div class="account-card project-card">
      <div class="account-header">
        <div class="account-title">
          <span class="account-icon">🏗</span>
          <div>
            <div class="account-name">${escapeHtml(project.name)}</div>
            ${project.description ? `<div class="account-bank">${escapeHtml(project.description)}</div>` : ''}
          </div>
        </div>
        <div class="project-meta">
          <div class="project-stage">${escapeHtml(stageLabel)}</div>
          <div class="account-date">${escapeHtml(t('familyExport.currency'))}: ${escapeHtml(project.currency)}</div>
        </div>
      </div>
      ${Object.keys(meta).length === 0 ? `<div class="empty-hint">${escapeHtml(t('familyExport.emptyHint'))}</div>` : `
        <div class="meta-grid">
          ${metadataRow(t('familyExport.contractNumber'), meta.contractNumber)}
          ${managerValue ? metadataRow(t('familyExport.manager'), managerValue) : ''}
          ${metadataRow(t('familyExport.organizationAddress'), meta.organizationAddress)}
          ${metadataRow(t('familyExport.accessMethod'), meta.accessMethod)}
          ${metadataRow(t('familyExport.country'), meta.country)}
          ${metadataRow(t('familyExport.documentsLocation'), meta.documentsLocation)}
          ${metadataRow(t('familyExport.beneficiary'), meta.beneficiary)}
          ${metadataRow(t('familyExport.notes'), meta.notes)}
        </div>
      `}
    </div>
  `;
}

export function generateFamilyAccessHtml(ctx: FamilyExportContext): string {
  const { profile, accounts, projects, locale, t } = ctx;
  const generatedAt = new Date();

  const accountsHtml = accounts.length > 0
    ? accounts.map((a) => accountCard(a, ctx)).join('')
    : `<p class="empty">${escapeHtml(t('familyExport.noRecords'))}</p>`;

  const projectsHtml = projects.length > 0
    ? projects.map((p) => projectCard(p, ctx)).join('')
    : '';

  const sectionTitle = (title: string) => `
    <div class="section-title">${escapeHtml(title)}</div>
  `;

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(t('familyExport.title'))}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #1f2937;
      background: #f9fafb;
      margin: 0;
      padding: 24px 16px;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .header h1 {
      margin: 0 0 8px;
      font-size: 24px;
      color: #111827;
    }
    .header .subtitle {
      color: #6b7280;
      font-size: 14px;
    }
    .meta-info {
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 20px;
    }
    .disclaimer {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #92400e;
    }
    .disclaimer strong {
      display: block;
      margin-bottom: 4px;
    }
    .account-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .account-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .account-title {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      min-width: 0;
    }
    .account-icon {
      font-size: 24px;
      line-height: 1;
    }
    .account-icon-img {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .account-name {
      font-weight: 600;
      font-size: 16px;
      word-break: break-word;
    }
    .account-bank {
      font-size: 13px;
      color: #6b7280;
    }
    .account-balance {
      text-align: right;
      flex-shrink: 0;
    }
    .account-balance > div:first-child {
      font-weight: 700;
      font-size: 16px;
      color: #111827;
    }
    .account-date {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 2px;
    }
    .meta-grid {
      display: grid;
      gap: 10px;
    }
    .meta-row {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 12px;
      font-size: 14px;
    }
    .meta-label {
      color: #6b7280;
    }
    .meta-value {
      color: #111827;
      word-break: break-word;
    }
    .empty-hint {
      font-size: 13px;
      color: #9ca3af;
      font-style: italic;
    }
    .empty {
      text-align: center;
      color: #9ca3af;
      padding: 40px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 32px 0 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .project-meta {
      text-align: right;
      flex-shrink: 0;
    }
    .project-stage {
      font-weight: 600;
      font-size: 14px;
      color: #111827;
    }
    @media print {
      body { background: #fff; }
      .account-card { box-shadow: none; border: 1px solid #e5e7eb; }
    }
    @media (max-width: 480px) {
      .meta-row { grid-template-columns: 1fr; gap: 2px; }
      .account-header { flex-direction: column; }
      .account-balance { text-align: left; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(t('familyExport.title'))}</h1>
      <div class="subtitle">${escapeHtml(profile.name)}</div>
    </div>
    <div class="meta-info">
      ${escapeHtml(t('familyExport.generatedAt'))}: ${formatDate(generatedAt, locale)}
    </div>
    <div class="disclaimer">
      <strong>${escapeHtml(t('familyExport.disclaimer'))}</strong>
      ${escapeHtml(t('familyExport.noPasswords'))}
    </div>
    ${accountsHtml}
    ${projectsHtml ? `${sectionTitle(t('familyExport.projectsTitle'))}${projectsHtml}` : ''}
  </div>
</body>
</html>`;
}

export function familyAccessFilename(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `mydreams-family-access-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.html`;
}

export type DeliveryResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Отдаёт HTML-файл пользователю. На iOS в standalone PWA срабатывает Web Share,
 * на десктопе — обычное скачивание.
 */
export async function deliverFamilyAccessDocument(html: string, filename: string): Promise<DeliveryResult> {
  const file = new File([html], filename, { type: 'text/html' });

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
    }
  }

  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
