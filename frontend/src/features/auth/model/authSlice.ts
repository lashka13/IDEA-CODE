import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { type User } from '../../../shared/types';
import { apiClient } from '../../../shared/api/client';

// Helper to convert snake_case API response to camelCase User
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

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }) => {
    const data = await apiClient.login(username, password);
    return mapUser(data.user);
  }
);

export const registerAsync = createAsyncThunk(
  'auth/register',
  async (payload: { name: string; username: string; email: string; password: string; bio?: string; tech_stack?: string[] }) => {
    const data = await apiClient.register(payload);
    return mapUser(data.user);
  }
);

export const updateProfileAsync = createAsyncThunk(
  'auth/updateProfile',
  async (payload: { name?: string; bio?: string; avatar_url?: string; tech_stack?: string[]; skills?: Record<string, number> }) => {
    const data = await apiClient.updateProfile(payload);
    return mapUser(data);
  }
);

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async () => {
    const data = await apiClient.getMe();
    return mapUser(data);
  }
);

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      apiClient.logout();
    },
    updateCoins: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.codeCoins += action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      });
    // Register
    builder
      .addCase(registerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      });
    // Update profile
    builder
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        state.user = action.payload;
      });
    // Restore session
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        apiClient.logout();
      });
  },
});

export const { login, logout, updateCoins, clearError } = authSlice.actions;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export default authSlice.reducer;
