'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectsWithPnL, useProjects } from '@/hooks/useProjects';
import { useSettings } from '@/hooks/useCurrency';
import { convertToBase } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import { useTranslation, type TranslationKey } from '@/i18n';
import ProjectForm from './ProjectForm';

export default function ProjectsContent() {
  const projects = useProjectsWithPnL();
  const { addProject } = useProjects();
  const { settings } = useSettings();
  const baseCurrency = settings?.baseCurrency ?? 'USD';
  const { t } = useTranslation();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const totalValue = projects.reduce((sum, p) => {
    return sum + convertToBase(p.currentMarketValue, p.currency, baseCurrency);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex items-center justify-between">
          <div className="w-10" />
          <h1 className="text-lg font-bold text-gray-900">{t('projects.title')}</h1>
          <button
            onClick={() => setShowForm(true)}
            className="w-10 h-10 flex items-center justify-center text-indigo-600 text-2xl font-light"
          >
            +
          </button>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="px-4 py-4 text-center">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('projects.marketValue')}</div>
          <div className="text-2xl font-bold text-gray-900">{formatMoney(totalValue, baseCurrency)}</div>
        </div>
      )}

      {projects.length > 0 ? (
        <div className="px-4 space-y-3 pb-24">
          {projects.map((project) => {
            const valueInBase = convertToBase(project.currentMarketValue, project.currency, baseCurrency);
            return (
              <button
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="w-full bg-white rounded-xl p-4 shadow-sm text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{project.stage === 'building' ? '🏗️' : '🏠'}</span>
                    <span className="font-semibold text-gray-900">{project.name}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    project.stage === 'building'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {t(`projects.stage.${project.stage}` as TranslationKey)}
                  </span>
                </div>
                {project.description && (
                  <p className="text-xs text-gray-400 mb-2">{project.description}</p>
                )}
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-400 text-xs">{t('projects.marketValue')}</span>
                    <div className="font-medium text-gray-900">{formatMoney(valueInBase, baseCurrency)}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">{t('projects.invested')}</span>
                    <div className="font-medium text-gray-900">{formatMoney(project.totalInvested, project.currency)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-xs">{t('projects.pnl')}</span>
                    <div className={`font-medium ${project.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {project.pnl >= 0 ? '+' : ''}{formatMoney(project.pnl, project.currency)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4">
          <div className="text-5xl mb-4">🏗️</div>
          <p className="text-gray-500 font-medium">{t('projects.empty')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('projects.emptyHint')}</p>
        </div>
      )}

      {showForm && (
        <ProjectForm
          onSave={async (data) => {
            await addProject(data);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
