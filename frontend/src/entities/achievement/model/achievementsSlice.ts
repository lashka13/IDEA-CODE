import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { type Achievement } from '../../../shared/types';
import { apiClient } from '../../../shared/api/client';

function mapAchievement(data: any): Achievement {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    rarity: data.rarity,
    unlockedAt: data.unlocked_at,
  };
}

export const fetchAchievements = createAsyncThunk(
  'achievements/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiClient.getAchievements();
      return data.map(mapAchievement);
    } catch {
      return rejectWithValue('Failed to fetch achievements');
    }
  }
);

interface AchievementsState {
  items: Achievement[];
  loading: boolean;
  error: string | null;
}

const initialState: AchievementsState = {
  items: [],
  loading: false,
  error: null,
};

export const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAchievements.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch achievements';
      });
  },
});

export const selectAllAchievements = (state: { achievements: AchievementsState }) => state.achievements.items;
export const selectAchievementsByIds = (ids: string[]) =>
  createSelector(selectAllAchievements, (items) => items.filter((a) => ids.includes(a.id)));

export default achievementsSlice.reducer;
