import { create } from 'zustand';

interface HardwareState {
  loading: boolean;
}

export const useHardwareStore = create<HardwareState>(() => ({
  loading: false,
}));
