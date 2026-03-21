import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import { type Transaction } from '../../../shared/types';
import { mockTransactions } from '../../../shared/api/mocks';

interface TransactionsState {
  items: Transaction[];
}

const initialState: TransactionsState = {
  items: mockTransactions,
};

export const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.items.unshift(action.payload);
    },
  },
});

export const { addTransaction } = transactionsSlice.actions;
export const selectAllTransactions = (state: { transactions: TransactionsState }) => state.transactions.items;
export const selectTransactionsByUser = (userId: string) =>
  createSelector(selectAllTransactions, (items) =>
    items.filter((t) => t.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );

export default transactionsSlice.reducer;
