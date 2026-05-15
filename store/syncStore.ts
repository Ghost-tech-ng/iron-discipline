import { create } from 'zustand';

interface SyncStore {
  isSyncing: boolean;
  lastSynced: string | null;
  error: string | null;
  setSyncing: (v: boolean) => void;
  setLastSynced: (date: string) => void;
  setError: (msg: string | null) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  isSyncing: false,
  lastSynced: null,
  error: null,
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSynced: (lastSynced) => set({ lastSynced, error: null }),
  setError: (error) => set({ error }),
}));
