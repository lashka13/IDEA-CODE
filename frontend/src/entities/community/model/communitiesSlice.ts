import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { type Community } from '../../../shared/types';
import { mockCommunities } from '../../../shared/api/mocks';
import { apiClient } from '../../../shared/api/client';

function mapCommunity(data: any): Community {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    coverUrl: data.cover_url,
    iconEmoji: data.icon_emoji,
    memberCount: data.member_count,
    materialCount: data.material_count,
    activityScore: data.activity_score,
    color: data.color,
    tags: data.tags,
    createdAt: data.created_at,
  };
}

export const fetchCommunities = createAsyncThunk(
  'communities/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiClient.getCommunities();
      return data.map(mapCommunity);
    } catch {
      return rejectWithValue('Failed to fetch communities');
    }
  }
);

interface CommunitiesState {
  items: Community[];
  loading: boolean;
}

const initialState: CommunitiesState = {
  items: mockCommunities,
  loading: false,
};

export const communitiesSlice = createSlice({
  name: 'communities',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunities.pending, (state) => { state.loading = true; })
      .addCase(fetchCommunities.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchCommunities.rejected, (state) => { state.loading = false; });
  },
});

export const selectAllCommunities = (state: { communities: CommunitiesState }) => state.communities.items;
export const selectCommunityBySlug = (slug: string) =>
  createSelector(selectAllCommunities, (items) => items.find((c) => c.slug === slug));
export const selectActiveCommunities = createSelector(selectAllCommunities, (items) =>
  [...items].sort((a, b) => b.activityScore - a.activityScore).slice(0, 5)
);

export default communitiesSlice.reducer;
