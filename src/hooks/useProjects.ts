'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, getLatestValuation, setProjectValuation, getProjectValuations } from '@/db/database';
import type { InvestmentProject, ProjectTransaction, ProjectValuation } from '@/db/models';
import { useCallback } from 'react';
import { useProfile } from './useProfile';

export interface ProjectWithPnL extends InvestmentProject {
  /** Транши + расходы на стройку — капитал, заведённый в проект. */
  totalInvested: number;
  operatingIncome: number;
  operatingExpenses: number;
  operatingProfit: number;
  /** Последняя оценка из истории. */
  marketValue: number;
  /**
   * Вклад проекта в капитал на первом экране.
   * Стройка — по выплаченному: актив ещё не твой, есть только замороженные деньги.
   * Эксплуатация — по рыночной оценке: это уже настоящий актив.
   */
  currentValue: number;
  pnl: number;
  roi: number;
}

export function useProjects() {
  const { profileId } = useProfile();

  const projects = useLiveQuery(
    () => db.projects.where('profileId').equals(profileId).toArray(),
    [profileId],
    []
  );

  const addProject = useCallback(
    async (project: Omit<InvestmentProject, 'id' | 'profileId' | 'createdAt'>) => {
      return db.projects.add({
        ...project,
        profileId,
        createdAt: new Date(),
      });
    },
    [profileId]
  );

  const updateProject = useCallback(async (id: number, data: Partial<InvestmentProject>) => {
    return db.projects.update(id, data);
  }, []);

  const deleteProject = useCallback(async (id: number) => {
    await db.projectTransactions.where('projectId').equals(id).delete();
    await db.projectValuations.where('projectId').equals(id).delete();
    await db.projects.delete(id);
  }, []);

  return { projects: projects ?? [], addProject, updateProject, deleteProject };
}

export function useProjectsWithPnL() {
  const { profileId } = useProfile();

  const data = useLiveQuery(async () => {
    const projects = await db.projects.where('profileId').equals(profileId).toArray();
    const result: ProjectWithPnL[] = [];

    for (const project of projects) {
      const txs = await db.projectTransactions
        .where('projectId')
        .equals(project.id!)
        .toArray();

      const latest = await getLatestValuation(project.id!);
      const marketValue = latest?.value ?? project.currentMarketValue ?? 0;

      result.push({
        ...project,
        ...calcTotals(txs, project.stage, marketValue),
      });
    }
    return result;
  }, [profileId], []);

  return data ?? [];
}

export function useProjectTransactions(projectId: number) {
  const transactions = useLiveQuery(
    () =>
      db.projectTransactions
        .where('projectId')
        .equals(projectId)
        .sortBy('date'),
    [projectId],
    []
  );

  const addTransaction = useCallback(
    async (tx: Omit<ProjectTransaction, 'id'>) => {
      return db.projectTransactions.add(tx);
    },
    []
  );

  const deleteTransaction = useCallback(async (id: number) => {
    return db.projectTransactions.delete(id);
  }, []);

  return { transactions: transactions ?? [], addTransaction, deleteTransaction };
}

export function useProjectValuations(projectId: number) {
  const valuations = useLiveQuery(
    () => getProjectValuations(projectId),
    [projectId],
    []
  );

  const addValuation = useCallback(
    async (value: number, date?: Date) => setProjectValuation(projectId, value, date),
    [projectId]
  );

  const deleteValuation = useCallback(
    async (id: number) => db.projectValuations.delete(id),
    []
  );

  return { valuations: valuations ?? [], addValuation, deleteValuation };
}

function calcTotals(txs: ProjectTransaction[], stage: InvestmentProject['stage'], marketValue: number) {
  let totalInvested = 0;
  let operatingIncome = 0;
  let operatingExpenses = 0;

  for (const tx of txs) {
    switch (tx.type) {
      case 'tranche':
      case 'construction_expense':
        totalInvested += tx.amount;
        break;
      case 'operating_expense':
        operatingExpenses += tx.amount;
        break;
      case 'rental_income':
      case 'sale':
        operatingIncome += tx.amount;
        break;
    }
  }

  const operatingProfit = operatingIncome - operatingExpenses;
  const currentValue = stage === 'building' ? totalInvested : marketValue;

  // Прирост стоимости плюс операционный результат. На стройке прирост равен
  // нулю по определению — деньги просто переложены из банка в объект.
  const pnl = (currentValue - totalInvested) + operatingProfit;
  const roi = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

  return {
    totalInvested,
    operatingIncome,
    operatingExpenses,
    operatingProfit,
    marketValue,
    currentValue,
    pnl,
    roi,
  };
}
