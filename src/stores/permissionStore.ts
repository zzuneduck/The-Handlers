import { create } from 'zustand';

interface PermissionState {
  loading: boolean;
}

export const usePermissionStore = create<PermissionState>(() => ({
  loading: false,
}));
