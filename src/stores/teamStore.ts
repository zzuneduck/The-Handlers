import { create } from 'zustand';

interface TeamState {
  loading: boolean;
}

export const useTeamStore = create<TeamState>(() => ({
  loading: false,
}));
