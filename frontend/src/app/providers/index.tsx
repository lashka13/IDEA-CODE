import { BrowserRouter } from 'react-router-dom';
import { StoreProvider } from './StoreProvider';
import { type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </StoreProvider>
  );
}
