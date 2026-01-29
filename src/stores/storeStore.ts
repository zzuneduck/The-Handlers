import { create } from 'zustand';

interface StoreState {
  loading: boolean;
}

export const useStoreStore = create<StoreState>(() => ({
  loading: false,
}));
