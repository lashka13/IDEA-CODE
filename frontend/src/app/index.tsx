import { Providers } from './providers';
import { AppRouter } from './routing';
import { Header } from '../widgets/header';
import { Footer } from '../widgets/footer';
import { GrainOverlay, OnboardingTour } from '../shared/ui';

export function App() {
  return (
    <Providers>
      <div className="relative min-h-screen flex flex-col">
        <GrainOverlay />
        <OnboardingTour />
        <Header />
        <main className="flex-1">
          <AppRouter />
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
