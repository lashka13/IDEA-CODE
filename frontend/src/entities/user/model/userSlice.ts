import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { type User } from '../../../shared/types';
import { mockUsers } from '../../../shared/api/mocks';
import { apiClient } from '../../../shared/api/client';

function mapUser(data: any): User {
  return {
    id: data.id,
    name: data.name,
    username: data.username,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    rating: data.rating,
    codeCoins: data.code_coins,
    level: data.level,
    levelTitle: data.level_title,
    techStack: data.tech_stack,
    skills: data.skills,
    achievementIds: data.achievement_ids || [],
    joinedAt: data.joined_at,
    uploadsCount: data.uploads_count,
    purchasesCount: data.purchases_count,
  };
}

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiClient.getUsers();
      return data.map(mapUser);
    } catch {
      return rejectWithValue('Failed to fetch users');
    }
  }
);

interface UsersState {
  items: User[];
  loading: boolean;
}

const initialState: UsersState = {
  items: mockUsers,
  loading: false,
};

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchUsers.rejected, (state) => { state.loading = false; });
  },
});

export const selectAllUsers = (state: { users: UsersState }) => state.users.items;
export const selectUserById = (id: string) =>
  createSelector(selectAllUsers, (items) => items.find((u) => u.id === id));
export const selectTopAuthors = createSelector(selectAllUsers, (items) =>
  [...items].sort((a, b) => b.rating - a.rating).slice(0, 5)
);

export default usersSlice.reducer;
