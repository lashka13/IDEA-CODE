import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SearchState {
  query: string;
  isOpen: boolean;
}

const initialState: SearchState = {
  query: '',
  isOpen: false,
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
    clearSearch: (state) => {
      state.query = '';
      state.isOpen = false;
    },
  },
});

export const { setQuery, setSearchOpen, clearSearch } = searchSlice.actions;
export const selectSearchQuery = (state: { search: SearchState }) => state.search.query;
export const selectSearchIsOpen = (state: { search: SearchState }) => state.search.isOpen;
export default searchSlice.reducer;
