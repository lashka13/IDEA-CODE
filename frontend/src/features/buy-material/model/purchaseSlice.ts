import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../../shared/api/client';

export const purchaseMaterialAsync = createAsyncThunk(
  'purchase/buy',
  async (materialId: string) => {
    await apiClient.purchaseMaterial(materialId);
    return materialId;
  }
);

export const checkPurchased = createAsyncThunk(
  'purchase/check',
  async (materialId: string) => {
    const data = await apiClient.isPurchased(materialId);
    return { materialId, purchased: data.purchased };
  }
);

export const fetchMyPurchases = createAsyncThunk(
  'purchase/fetchMy',
  async () => {
    const data = await apiClient.getMyPurchases();
    return data.map((m: any) => m.id as string);
  }
);

interface PurchaseState {
  purchasedMaterialIds: string[];
  loading: boolean;
}

const initialState: PurchaseState = {
  purchasedMaterialIds: [],
  loading: false,
};

export const purchaseSlice = createSlice({
  name: 'purchase',
  initialState,
  reducers: {
    addPurchase: (state, action: PayloadAction<string>) => {
      if (!state.purchasedMaterialIds.includes(action.payload)) {
        state.purchasedMaterialIds.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(purchaseMaterialAsync.pending, (state) => { state.loading = true; })
      .addCase(purchaseMaterialAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.purchasedMaterialIds.includes(action.payload)) {
          state.purchasedMaterialIds.push(action.payload);
        }
      })
      .addCase(purchaseMaterialAsync.rejected, (state) => { state.loading = false; })
      .addCase(checkPurchased.fulfilled, (state, action) => {
        if (action.payload.purchased && !state.purchasedMaterialIds.includes(action.payload.materialId)) {
          state.purchasedMaterialIds.push(action.payload.materialId);
        }
      })
      .addCase(fetchMyPurchases.fulfilled, (state, action) => {
        for (const id of action.payload) {
          if (!state.purchasedMaterialIds.includes(id)) {
            state.purchasedMaterialIds.push(id);
          }
        }
      });
  },
});

export const { addPurchase } = purchaseSlice.actions;
export const selectPurchasedIds = (state: { purchase: PurchaseState }) => state.purchase.purchasedMaterialIds;
export const selectIsPurchased = (id: string) => (state: { purchase: PurchaseState }) =>
  state.purchase.purchasedMaterialIds.includes(id);
export const selectPurchaseLoading = (state: { purchase: PurchaseState }) => state.purchase.loading;
export default purchaseSlice.reducer;
