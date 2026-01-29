import { create } from 'zustand';

interface ResourceState {
  loading: boolean;
}

export const useResourceStore = create<ResourceState>(() => ({
  loading: false,
}));
