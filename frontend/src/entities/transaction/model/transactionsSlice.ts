import { createSlice, createSelector, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { type Transaction } from '../../../shared/types';
import { mockTransactions } from '../../../shared/api/mocks';
import { apiClient } from '../../../shared/api/client';

function mapTransaction(data: any): Transaction {
  return {
    id: data.id,
    userId: data.user_id,
    type: data.type,
    amount: data.amount,
    description: data.description,
    materialId: data.material_id,
    createdAt: data.created_at,
  };
}

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiClient.getTransactions();
      return data.map(mapTransaction);
    } catch {
      return rejectWithValue('Failed to fetch transactions');
    }
  }
);

interface TransactionsState {
  items: Transaction[];
  loading: boolean;
}

const initialState: TransactionsState = {
  items: mockTransactions,
  loading: false,
};

export const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.items.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => { state.loading = true; })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchTransactions.rejected, (state) => { state.loading = false; });
  },
});

export const { addTransaction } = transactionsSlice.actions;
export const selectAllTransactions = (state: { transactions: TransactionsState }) => state.transactions.items;
export const selectTransactionsByUser = (userId: string) =>
  createSelector(selectAllTransactions, (items) =>
    items.filter((t) => t.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );

export default transactionsSlice.reducer;
