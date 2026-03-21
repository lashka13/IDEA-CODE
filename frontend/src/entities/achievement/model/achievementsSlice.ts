import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { type Achievement } from '../../../shared/types';
import { mockAchievements } from '../../../shared/api/mocks';
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
}

const initialState: AchievementsState = {
  items: mockAchievements,
  loading: false,
};

export const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAchievements.pending, (state) => { state.loading = true; })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchAchievements.rejected, (state) => { state.loading = false; });
  },
});

export const selectAllAchievements = (state: { achievements: AchievementsState }) => state.achievements.items;
export const selectAchievementsByIds = (ids: string[]) =>
  createSelector(selectAllAchievements, (items) => items.filter((a) => ids.includes(a.id)));

export default achievementsSlice.reducer;
