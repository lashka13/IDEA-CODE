import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Language, type Difficulty, type Format, type TaskType, type SortBy } from '../../../shared/types';

interface FilterState {
  languages: Language[];
  technologies: string[];
  difficulties: Difficulty[];
  formats: Format[];
  taskTypes: TaskType[];
  sortBy: SortBy;
}

const initialState: FilterState = {
  languages: [],
  technologies: [],
  difficulties: [],
  formats: [],
  taskTypes: [],
  sortBy: 'popular',
};

export const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    toggleLanguage: (state, action: PayloadAction<Language>) => {
      const idx = state.languages.indexOf(action.payload);
      if (idx >= 0) state.languages.splice(idx, 1);
      else state.languages.push(action.payload);
    },
    toggleTechnology: (state, action: PayloadAction<string>) => {
      const idx = state.technologies.indexOf(action.payload);
      if (idx >= 0) state.technologies.splice(idx, 1);
      else state.technologies.push(action.payload);
    },
    toggleDifficulty: (state, action: PayloadAction<Difficulty>) => {
      const idx = state.difficulties.indexOf(action.payload);
      if (idx >= 0) state.difficulties.splice(idx, 1);
      else state.difficulties.push(action.payload);
    },
    toggleFormat: (state, action: PayloadAction<Format>) => {
      const idx = state.formats.indexOf(action.payload);
      if (idx >= 0) state.formats.splice(idx, 1);
      else state.formats.push(action.payload);
    },
    toggleTaskType: (state, action: PayloadAction<TaskType>) => {
      const idx = state.taskTypes.indexOf(action.payload);
      if (idx >= 0) state.taskTypes.splice(idx, 1);
      else state.taskTypes.push(action.payload);
    },
    setSortBy: (state, action: PayloadAction<SortBy>) => {
      state.sortBy = action.payload;
    },
    clearFilters: () => initialState,
  },
});

export const { toggleLanguage, toggleTechnology, toggleDifficulty, toggleFormat, toggleTaskType, setSortBy, clearFilters } = filterSlice.actions;
export const selectFilters = (state: { filters: FilterState }) => state.filters;
export default filterSlice.reducer;
