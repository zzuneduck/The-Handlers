import { create } from 'zustand';

interface ConsultationState {
  loading: boolean;
}

export const useConsultationStore = create<ConsultationState>(() => ({
  loading: false,
}));
