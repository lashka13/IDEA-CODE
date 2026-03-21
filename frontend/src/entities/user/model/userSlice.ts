import { createSlice, createSelector } from '@reduxjs/toolkit';
import { type User } from '../../../shared/types';
import { mockUsers } from '../../../shared/api/mocks';

interface UsersState {
  items: User[];
}

const initialState: UsersState = {
  items: mockUsers,
};

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
});

export const selectAllUsers = (state: { users: UsersState }) => state.users.items;
export const selectUserById = (id: string) =>
  createSelector(selectAllUsers, (items) => items.find((u) => u.id === id));
export const selectTopAuthors = createSelector(selectAllUsers, (items) =>
  [...items].sort((a, b) => b.rating - a.rating).slice(0, 5)
);

export default usersSlice.reducer;
