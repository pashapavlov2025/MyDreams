'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useProjects, useProjectTransactions, useProjectsWithPnL, useProjectValuations } from '@/hooks/useProjects';
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
  const { valuations, addValuation } = useProjectValuations(projectId);
  const projectsWithPnL = useProjectsWithPnL();
  const [showTxForm, setShowTxForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showValuationForm, setShowValuationForm] = useState(false);
  const [valuationInput, setValuationInput] = useState('');

  const project = useLiveQuery(() => db.projects.get(projectId), [projectId]);
  const pnlData = projectsWithPnL.find((p) => p.id === projectId);

  if (!project || !pnlData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const {
    totalInvested, operatingIncome, operatingExpenses, operatingProfit,
    marketValue, currentValue, pnl, roi,
  } = pnlData;
  const isBuilding = project.stage === 'building';

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
            <div className="text-xs text-gray-400">{t('projects.invested')}</div>
            <div className="text-lg font-bold text-gray-900">{formatMoney(totalInvested, project.currency)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">{t('projects.marketValue')}</div>
            <div className="text-lg font-bold text-gray-900">
              {marketValue > 0 ? formatMoney(marketValue, project.currency) : '—'}
            </div>
            {isBuilding && marketValue > totalInvested && (
              <div className="text-xs text-gray-400 mt-0.5">
                {t('projects.leftToPay')}: {formatMoney(marketValue - totalInvested, project.currency)}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-400">{t('projects.income')}</div>
            <div className="text-lg font-bold text-green-600">{formatMoney(operatingIncome, project.currency)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">{t('projects.expenses')}</div>
            <div className="text-lg font-bold text-red-500">{formatMoney(operatingExpenses, project.currency)}</div>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between text-sm">
          <span className="text-gray-400">{t('projects.inNetWorth')}</span>
          <span className="font-semibold text-gray-900">
            {formatMoney(currentValue, project.currency)}
          </span>
        </div>

        {!isBuilding && (
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between text-sm">
            <span className="text-gray-400">{t('projects.operatingProfit')}</span>
            <span className={`font-semibold ${operatingProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {operatingProfit >= 0 ? '+' : ''}{formatMoney(operatingProfit, project.currency)}
            </span>
          </div>
        )}

        {isBuilding && (
          <div className="mt-3 text-xs text-gray-400 leading-relaxed">
            {t('projects.buildingNote')}
          </div>
        )}
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

      {/* Valuations */}
      <div className="mx-4 mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {t('projects.valuationHistory')}
          </span>
          <button
            onClick={() => { setValuationInput(marketValue ? String(marketValue) : ''); setShowValuationForm(true); }}
            className="text-indigo-600 text-sm font-medium"
          >
            + {t('projects.addValuation')}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {showValuationForm && (
            <div className="p-4 border-b border-gray-100 space-y-3">
              <input
                type="number"
                inputMode="decimal"
                value={valuationInput}
                onChange={(e) => setValuationInput(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full px-4 py-3 bg-gray-100 rounded-xl text-lg font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="text-xs text-gray-400">{t('projects.valuationHint')}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowValuationForm(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={async () => {
                    const v = Number(valuationInput);
                    if (v > 0) await addValuation(v);
                    setShowValuationForm(false);
                  }}
                  disabled={!(Number(valuationInput) > 0)}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-40"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          )}

          {valuations.length === 0 && !showValuationForm ? (
            <div className="px-4 py-5 text-center text-sm text-gray-400">
              {t('projects.noValuations')}
            </div>
          ) : (
            [...valuations].reverse().map((v, i, arr) => {
              const prev = arr[i + 1];
              const delta = prev ? v.value - prev.value : null;
              return (
                <div key={v.id} className="flex items-center px-4 py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {formatMoney(v.value, project.currency)}
                    </div>
                    <div className="text-xs text-gray-400">{formatDate(v.date, getDateLocale(locale))}</div>
                  </div>
                  {delta !== null && delta !== 0 && (
                    <span className={`text-sm font-medium ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {delta > 0 ? '+' : ''}{formatMoney(delta, project.currency)}
                    </span>
                  )}
                </div>
              );
            })
          )}
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
