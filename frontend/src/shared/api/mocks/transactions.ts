import { type Transaction } from '../../types';

export const mockTransactions: Transaction[] = [
  { id: 'tx-1', userId: 'user-1', type: 'reward', amount: 50, description: 'Бонус за регистрацию', createdAt: '2025-09-01T10:00:00' },
  { id: 'tx-2', userId: 'user-1', type: 'purchase', amount: -30, description: 'Покупка: Docker для начинающих', materialId: 'mat-2', createdAt: '2025-09-05T14:30:00' },
  { id: 'tx-3', userId: 'user-1', type: 'sale', amount: 30, description: 'Продажа: React Hooks', materialId: 'mat-1', createdAt: '2025-09-10T09:15:00' },
  { id: 'tx-4', userId: 'user-1', type: 'royalty', amount: 15, description: 'Роялти: React Hooks (5 покупок)', materialId: 'mat-1', createdAt: '2025-10-01T12:00:00' },
  { id: 'tx-5', userId: 'user-1', type: 'purchase', amount: -60, description: 'Покупка: ML с нуля на Python', materialId: 'mat-3', createdAt: '2025-10-15T16:45:00' },
  { id: 'tx-6', userId: 'user-1', type: 'challenge-prize', amount: 100, description: 'Победа: Челлендж Frontend сообщества', createdAt: '2025-11-01T18:00:00' },
  { id: 'tx-7', userId: 'user-1', type: 'sale', amount: 30, description: 'Продажа: React Hooks', materialId: 'mat-1', createdAt: '2025-11-15T10:30:00' },
  { id: 'tx-8', userId: 'user-1', type: 'purchase', amount: -35, description: 'Покупка: TypeScript продвинутые типы', materialId: 'mat-17', createdAt: '2026-01-10T13:20:00' },
  { id: 'tx-9', userId: 'user-1', type: 'royalty', amount: 45, description: 'Роялти: React Hooks (15 покупок)', materialId: 'mat-1', createdAt: '2026-02-01T09:00:00' },
  { id: 'tx-10', userId: 'user-1', type: 'sale', amount: 35, description: 'Продажа: TypeScript Advanced', materialId: 'mat-17', createdAt: '2026-03-01T11:00:00' },
  { id: 'tx-11', userId: 'user-2', type: 'reward', amount: 50, description: 'Бонус за регистрацию', createdAt: '2025-10-15T10:00:00' },
  { id: 'tx-12', userId: 'user-2', type: 'sale', amount: 60, description: 'Продажа: ML с нуля', materialId: 'mat-3', createdAt: '2025-11-01T14:00:00' },
  { id: 'tx-13', userId: 'user-3', type: 'reward', amount: 50, description: 'Бонус за регистрацию', createdAt: '2025-08-20T10:00:00' },
  { id: 'tx-14', userId: 'user-3', type: 'sale', amount: 45, description: 'Продажа: Docker для начинающих', materialId: 'mat-2', createdAt: '2025-09-10T16:00:00' },
  { id: 'tx-15', userId: 'user-4', type: 'reward', amount: 50, description: 'Бонус за регистрацию', createdAt: '2026-01-10T10:00:00' },
];
