'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { InvestmentProject, ProjectTransaction, TransactionType } from '@/db/models';
import { useCallback } from 'react';
import { useProfile } from './useProfile';

export interface ProjectWithPnL extends InvestmentProject {
  totalInvested: number;
  totalIncome: number;
  totalExpenses: number;
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

      const totals = calcTotals(txs);

      result.push({
        ...project,
        ...totals,
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

function calcTotals(txs: ProjectTransaction[]) {
  let totalInvested = 0;
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of txs) {
    switch (tx.type) {
      case 'tranche':
        totalInvested += tx.amount;
        break;
      case 'construction_expense':
      case 'operating_expense':
        totalExpenses += tx.amount;
        break;
      case 'rental_income':
      case 'sale':
        totalIncome += tx.amount;
        break;
    }
  }

  const totalSpent = totalInvested + totalExpenses;
  const pnl = totalIncome - totalSpent;
  const roi = totalSpent > 0 ? (pnl / totalSpent) * 100 : 0;

  return { totalInvested, totalIncome, totalExpenses, pnl, roi };
}
