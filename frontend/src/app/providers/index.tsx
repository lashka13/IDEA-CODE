import { BrowserRouter } from 'react-router-dom';
import { StoreProvider } from './StoreProvider';
import { DataLoader } from './DataLoader';
import { type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <BrowserRouter>
        <DataLoader>{children}</DataLoader>
      </BrowserRouter>
    </StoreProvider>
  );
}
