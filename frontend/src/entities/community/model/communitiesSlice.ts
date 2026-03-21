import { createSlice, createSelector } from '@reduxjs/toolkit';
import { type Community } from '../../../shared/types';
import { mockCommunities } from '../../../shared/api/mocks';

interface CommunitiesState {
  items: Community[];
}

const initialState: CommunitiesState = {
  items: mockCommunities,
};

export const communitiesSlice = createSlice({
  name: 'communities',
  initialState,
  reducers: {},
});

export const selectAllCommunities = (state: { communities: CommunitiesState }) => state.communities.items;
export const selectCommunityBySlug = (slug: string) =>
  createSelector(selectAllCommunities, (items) => items.find((c) => c.slug === slug));
export const selectActiveCommunities = createSelector(selectAllCommunities, (items) =>
  [...items].sort((a, b) => b.activityScore - a.activityScore).slice(0, 5)
);

export default communitiesSlice.reducer;
