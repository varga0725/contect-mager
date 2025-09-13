import { useNetworkStatus } from '../../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const { isOffline, justCameOnline } = useNetworkStatus();

  if (!isOffline && !justCameOnline) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        isOffline
          ? 'bg-red-500 text-white'
          : 'bg-green-500 text-white'
      }`}
    >
      {isOffline ? (
        <span>You're offline. Some features may not work.</span>
      ) : (
        <span>You're back online!</span>
      )}
    </div>
  );
}