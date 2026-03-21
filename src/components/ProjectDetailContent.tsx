'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useProjects, useProjectTransactions } from '@/hooks/useProjects';
import { formatMoney, formatDate } from '@/lib/format';
import { useTranslation, type TranslationKey } from '@/i18n';
import { getDateLocale } from '@/i18n';
import type { InvestmentProject, TransactionType } from '@/db/models';
import ProjectForm from './ProjectForm';
import TransactionForm from './TransactionForm';

const TX_ICONS: Record<TransactionType, string> = {
  tranche: '💰',
  construction_expense: '🔨',
  rental_income: '🏠',
  operating_expense: '📋',
  sale: '🤝',
};

function isIncome(type: TransactionType) {
  return type === 'rental_income' || type === 'sale';
}

export default function ProjectDetailContent({ projectId }: { projectId: number }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { updateProject, deleteProject } = useProjects();
  const { transactions, addTransaction, deleteTransaction } = useProjectTransactions(projectId);
  const [showTxForm, setShowTxForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const project = useLiveQuery(() => db.projects.get(projectId), [projectId]);

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalInvested = transactions
    .filter((tx) => tx.type === 'tranche')
    .reduce((s, tx) => s + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx) => tx.type === 'construction_expense' || tx.type === 'operating_expense')
    .reduce((s, tx) => s + tx.amount, 0);

  const totalIncome = transactions
    .filter((tx) => isIncome(tx.type))
    .reduce((s, tx) => s + tx.amount, 0);

  const totalSpent = totalInvested + totalExpenses;
  const pnl = totalIncome - totalSpent;
  const roi = totalSpent > 0 ? (pnl / totalSpent) * 100 : 0;

  const handleDelete = async () => {
    if (confirm(t('projects.deleteConfirm'))) {
      await deleteProject(projectId);
      router.push('/projects');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/projects')} className="text-indigo-600 text-sm font-medium">
            ← {t('projects.title')}
          </button>
          <button onClick={() => setShowEditForm(true)} className="text-indigo-600 text-sm font-medium">
            {t('projects.edit')}
          </button>
        </div>
      </div>

      {/* Project info */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{project.stage === 'building' ? '🏗️' : '🏠'}</span>
          <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
        </div>
        {project.description && (
          <p className="text-sm text-gray-400 mb-3">{project.description}</p>
        )}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          project.stage === 'building'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {t(`projects.stage.${project.stage}` as TranslationKey)}
        </span>
      </div>

      {/* P&L Summary */}
      <div className="bg-white rounded-xl mx-4 p-4 shadow-sm mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-400">{t('projects.marketValue')}</div>
            <div className="text-lg font-bold text-gray-900">{formatMoney(project.currentMarketValue, project.currency)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">{t('projects.invested')}</div>
            <div className="text-lg font-bold text-gray-900">{formatMoney(totalInvested, project.currency)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">{t('projects.income')}</div>
            <div className="text-lg font-bold text-green-600">{formatMoney(totalIncome, project.currency)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">{t('projects.expenses')}</div>
            <div className="text-lg font-bold text-red-500">{formatMoney(totalExpenses, project.currency)}</div>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-400">{t('projects.pnl')}</div>
            <div className={`text-xl font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {pnl >= 0 ? '+' : ''}{formatMoney(pnl, project.currency)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">{t('projects.roi')}</div>
            <div className={`text-lg font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4 mb-2 flex justify-between items-center">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {t('projects.addTransaction').replace('Добавить ', '').replace('Add ', '')}
        </div>
        <button
          onClick={() => setShowTxForm(true)}
          className="text-indigo-600 text-sm font-medium"
        >
          + {t('projects.addTransaction')}
        </button>
      </div>

      {transactions.length > 0 ? (
        <div className="bg-white rounded-xl mx-4 overflow-hidden shadow-sm mb-4">
          {[...transactions].reverse().map((tx) => (
            <div
              key={tx.id}
              className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0"
            >
              <span className="text-lg mr-3">{TX_ICONS[tx.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {t(`projects.transaction.${tx.type}` as TranslationKey)}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDate(tx.date, getDateLocale(locale))}
                  {tx.category ? ` · ${tx.category}` : ''}
                  {tx.description ? ` · ${tx.description}` : ''}
                </div>
              </div>
              <div className={`text-sm font-semibold ${isIncome(tx.type) ? 'text-green-600' : 'text-gray-900'}`}>
                {isIncome(tx.type) ? '+' : '-'}{formatMoney(tx.amount, project.currency)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 px-4">
          <p className="text-gray-400 text-sm">{t('projects.noTransactions')}</p>
        </div>
      )}

      {/* Delete */}
      <div className="px-4 pb-24">
        <button
          onClick={handleDelete}
          className="w-full py-3 text-red-500 text-sm font-medium bg-white rounded-xl shadow-sm"
        >
          {t('common.delete')}
        </button>
      </div>

      {showTxForm && (
        <TransactionForm
          projectId={projectId}
          onSave={async (data) => {
            await addTransaction(data);
            setShowTxForm(false);
          }}
          onCancel={() => setShowTxForm(false)}
        />
      )}

      {showEditForm && (
        <ProjectForm
          project={project}
          onSave={async (data) => {
            await updateProject(projectId, data);
            setShowEditForm(false);
          }}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}
