import { createSlice, createSelector } from '@reduxjs/toolkit';
import { type Material } from '../../../shared/types';
import { mockMaterials } from '../../../shared/api/mocks';

interface MaterialsState {
  items: Material[];
  loading: boolean;
}

const initialState: MaterialsState = {
  items: mockMaterials,
  loading: false,
};

export const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {},
});

export const selectAllMaterials = (state: { materials: MaterialsState }) => state.materials.items;
export const selectMaterialById = (id: string) =>
  createSelector(selectAllMaterials, (items) => items.find((m) => m.id === id));
export const selectMaterialsByAuthor = (authorId: string) =>
  createSelector(selectAllMaterials, (items) => items.filter((m) => m.authorId === authorId));
export const selectMaterialsByCommunity = (communityId: string) =>
  createSelector(selectAllMaterials, (items) => items.filter((m) => m.communityId === communityId));
export const selectPopularMaterials = createSelector(selectAllMaterials, (items) =>
  [...items].sort((a, b) => b.purchaseCount - a.purchaseCount).slice(0, 8)
);

export default materialsSlice.reducer;
