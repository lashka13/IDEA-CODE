import { Providers } from './providers';
import { AppRouter } from './routing';
import { Header } from '../widgets/header';
import { Footer } from '../widgets/footer';
import { GrainOverlay } from '../shared/ui';
import { useLocation } from 'react-router-dom';

function AppLayout() {
  const location = useLocation();
  const isSchedule = location.pathname === '/schedule';
  const isSession = location.pathname.startsWith('/session/');

  if (isSession) {
    return <AppRouter />;
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <GrainOverlay />
      <Header />
      <main className="flex-1">
        <AppRouter />
      </main>
      {!isSchedule && <Footer />}
    </div>
  );
}

export function App() {
  return (
    <Providers>
      <AppLayout />
    </Providers>
  );
}
