import { useState, useEffect } from 'react';
import { syncManager, SyncState } from '../services/offline/syncManager';

/**
 * Hook to access sync status
 * Subscribes to sync manager and provides current sync state
 */
export function useSyncStatus() {
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getState());

  useEffect(() => {
    // Subscribe to sync state changes
    const unsubscribe = syncManager.subscribe(setSyncState);
    return unsubscribe;
  }, []);

  return {
    ...syncState,
    sync: () => syncManager.sync(),
    startAutoSync: () => syncManager.startAutoSync(),
    stopAutoSync: () => syncManager.stopAutoSync(),
    resetLocalData: () => syncManager.resetLocalData(),
  };
}

