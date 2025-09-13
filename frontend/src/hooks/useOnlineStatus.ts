import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      // Resume queries when coming back online
      queryClient.resumePausedMutations();
      queryClient.invalidateQueries();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);

  return isOnline;
}

export function useNetworkStatus() {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // Just came back online
      setWasOffline(false);
    }
  }, [isOnline, wasOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    justCameOnline: isOnline && wasOffline,
  };
}