import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { restoreSession } from '../../features/auth';
import { fetchMaterials } from '../../entities/material';
import { fetchUsers } from '../../entities/user';
import { fetchCommunities } from '../../entities/community';
import { fetchAchievements } from '../../entities/achievement';
import { apiClient } from '../../shared/api/client';

export function DataLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Restore session if token exists
    if (apiClient.getToken()) {
      dispatch(restoreSession());
    }

    // Load data from API (falls back to mock data on failure)
    dispatch(fetchMaterials());
    dispatch(fetchUsers());
    dispatch(fetchCommunities());
    dispatch(fetchAchievements());
  }, [dispatch]);

  return <>{children}</>;
}
