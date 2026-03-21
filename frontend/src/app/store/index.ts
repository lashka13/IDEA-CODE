import { configureStore } from '@reduxjs/toolkit';
import { materialsReducer } from '../../entities/material';
import { usersReducer } from '../../entities/user';
import { communitiesReducer } from '../../entities/community';
import { transactionsReducer } from '../../entities/transaction';
import { achievementsReducer } from '../../entities/achievement';
import { authReducer } from '../../features/auth';
import { searchReducer } from '../../features/search';
import { filterReducer } from '../../features/filter-materials';
import { purchaseReducer } from '../../features/buy-material';
import { courseProgressReducer } from '../../features/course-progress';

export const store = configureStore({
  reducer: {
    materials: materialsReducer,
    users: usersReducer,
    communities: communitiesReducer,
    transactions: transactionsReducer,
    achievements: achievementsReducer,
    auth: authReducer,
    search: searchReducer,
    filters: filterReducer,
    purchase: purchaseReducer,
    courseProgress: courseProgressReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
