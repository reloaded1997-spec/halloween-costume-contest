import { lazy, Suspense } from 'react';
import { isFirebaseConfigured } from './firebase';
import GuestView from './views/GuestView';
import SetupNotice from './views/SetupNotice';
import { FullScreenSpinner } from './components/ui';

// The TV and host bundles are split out so guests on phones only download the guest view.
const TvView = lazy(() => import('./views/TvView'));
const AdminView = lazy(() => import('./views/AdminView'));

function route(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/tv') return <TvView />;
  if (path === '/admin') return <AdminView />;
  return <GuestView />;
}

export default function App() {
  if (!isFirebaseConfigured) return <SetupNotice />;
  return <Suspense fallback={<FullScreenSpinner />}>{route(window.location.pathname)}</Suspense>;
}
