import { create } from 'zustand';

interface SyncStore {
  isSyncing: boolean;
  lastSynced: string | null;
  error: string | null;
  isOnline: boolean;
  setSyncing: (v: boolean) => void;
  setLastSynced: (date: string) => void;
  setError: (msg: string | null) => void;
  setOnline: (v: boolean) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  isSyncing: false,
  lastSynced: null,
  error: null,
  isOnline: true,
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSynced: (lastSynced) => set({ lastSynced, error: null }),
  setError: (error) => set({ error }),
  setOnline: (isOnline) => set({ isOnline }),
}));
