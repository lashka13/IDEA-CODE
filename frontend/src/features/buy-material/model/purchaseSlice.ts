import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PurchaseState {
  purchasedMaterialIds: string[];
}

const initialState: PurchaseState = {
  purchasedMaterialIds: [],
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
});

export const { addPurchase } = purchaseSlice.actions;
export const selectPurchasedIds = (state: { purchase: PurchaseState }) => state.purchase.purchasedMaterialIds;
export const selectIsPurchased = (id: string) => (state: { purchase: PurchaseState }) =>
  state.purchase.purchasedMaterialIds.includes(id);
export default purchaseSlice.reducer;
