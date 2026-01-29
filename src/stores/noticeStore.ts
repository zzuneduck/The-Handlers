import { create } from 'zustand';

interface NoticeState {
  loading: boolean;
}

export const useNoticeStore = create<NoticeState>(() => ({
  loading: false,
}));
