import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { type Material } from '../../../shared/types';
import { mockMaterials } from '../../../shared/api/mocks';
import { apiClient } from '../../../shared/api/client';

function mapMaterial(data: any): Material {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    authorId: data.author_id,
    coverUrl: data.cover_url,
    price: data.price,
    rating: data.rating,
    ratingCount: data.rating_count,
    purchaseCount: data.purchase_count,
    language: data.language,
    technology: data.technology,
    difficulty: data.difficulty,
    format: data.format,
    taskType: data.task_type,
    tags: data.tags,
    tableOfContents: data.table_of_contents,
    communityId: data.community_id,
    pdfUrl: data.pdf_url ?? null,
    createdAt: data.created_at,
  };
}

export const fetchMaterials = createAsyncThunk(
  'materials/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiClient.getMaterials({ per_page: '100' });
      return data.items.map(mapMaterial);
    } catch {
      return rejectWithValue('Failed to fetch materials');
    }
  }
);

export const fetchPopularMaterials = createAsyncThunk(
  'materials/fetchPopular',
  async (limit: number = 8) => {
    const data = await apiClient.getPopularMaterials(limit);
    return data.map(mapMaterial);
  }
);

interface MaterialsState {
  items: Material[];
  loading: boolean;
  loaded: boolean;
}

const initialState: MaterialsState = {
  items: mockMaterials,
  loading: false,
  loaded: false,
};

export const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaterials.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
        state.loaded = true;
      })
      .addCase(fetchMaterials.rejected, (state) => {
        state.loading = false;
        // Keep mock data as fallback
      });
  },
});

export const selectAllMaterials = (state: { materials: MaterialsState }) => state.materials.items;
export const selectMaterialsLoading = (state: { materials: MaterialsState }) => state.materials.loading;
export const selectMaterialsLoaded = (state: { materials: MaterialsState }) => state.materials.loaded;
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
