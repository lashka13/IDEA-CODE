import { createSlice, createSelector } from '@reduxjs/toolkit';
import { type Achievement } from '../../../shared/types';
import { mockAchievements } from '../../../shared/api/mocks';

interface AchievementsState {
  items: Achievement[];
}

const initialState: AchievementsState = {
  items: mockAchievements,
};

export const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {},
});

export const selectAllAchievements = (state: { achievements: AchievementsState }) => state.achievements.items;
export const selectAchievementsByIds = (ids: string[]) =>
  createSelector(selectAllAchievements, (items) => items.filter((a) => ids.includes(a.id)));

export default achievementsSlice.reducer;
