import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { useLocation } from 'react-router';
import { useLoadingBar } from 'react-top-loading-bar';
import { AppRoutingSetup } from './app-routing-setup';

export function AppRouting() {
  const { start, complete } = useLoadingBar({
    color: 'var(--color-primary)',
    shadow: false,
    waitingTime: 400,
    transitionTime: 200,
    height: 2,
  });

  const { verify, setLoading } = useAuth();
  const [previousLocation, setPreviousLocation] = useState('');
  const [firstLoad, setFirstLoad] = useState(true);
  const location = useLocation();
  const path = location.pathname.trim();

  useEffect(() => {
    if (firstLoad) {
      // Skip verification on callback page - let the callback page handle it
      if (path === '/auth/callback') {
        setLoading(false);
        setFirstLoad(false);
        return;
      }

      verify().finally(() => {
        setLoading(false);
        setFirstLoad(false);
      });
    }
  }, [firstLoad, verify, setLoading, path]); // Added path dependency

  useEffect(() => {
    if (!firstLoad) {
      // Skip verification on callback page - let the callback page handle it
      if (path === '/auth/callback') {
        return;
      }

      start('static');
      verify()
        .catch(() => {
          throw new Error('User verify request failed!');
        })
        .finally(() => {
          setPreviousLocation(path);
          complete();
          if (path === previousLocation) {
            setPreviousLocation('');
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    if (!CSS.escape(window.location.hash)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [previousLocation]);

  return <AppRoutingSetup />;
}
