import { create } from "zustand";

interface PlayerVideo {
  id: string;
  title: string;
  thumbnailUrl?: string;
  playbackId?: string;
}

interface PlayerState {
  activeVideoId: string | null;
  activeVideo: PlayerVideo | null;
  isMinimized: boolean;
  isOpen: boolean;
  queue: PlayerVideo[];
  currentTime: number;
  
  // Actions
  setVideo: (video: PlayerVideo) => void;
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  addToQueue: (video: PlayerVideo) => void;
  removeFromQueue: (videoId: string) => void;
  playNext: () => void;
  clearQueue: () => void;
  setCurrentTime: (time: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  activeVideoId: null,
  activeVideo: null,
  isMinimized: false,
  isOpen: false,
  queue: [],
  currentTime: 0,

  setVideo: (video) => set((state) => ({ 
    activeVideo: video, 
    activeVideoId: video.id,
    isOpen: true,
    isMinimized: false,
    currentTime: state.activeVideoId === video.id ? state.currentTime : 0
  })),
  
  close: () => set({ 
    isOpen: false, 
    activeVideo: null, 
    activeVideoId: null,
    currentTime: 0,
  }),
  
  minimize: () => set({ isMinimized: true }),
  
  maximize: () => set({ isMinimized: false }),
  
  addToQueue: (video) => set((state) => ({ 
    queue: [...state.queue, video] 
  })),
  
  removeFromQueue: (videoId) => set((state) => ({ 
    queue: state.queue.filter((v) => v.id !== videoId) 
  })),
  
  playNext: () => set((state) => {
    if (state.queue.length === 0) return state;
    const [next, ...rest] = state.queue;
    return {
      activeVideo: next,
      activeVideoId: next.id,
      queue: rest,
      isOpen: true,
      isMinimized: false,
      currentTime: 0
    };
  }),
  
  clearQueue: () => set({ queue: [] }),
  setCurrentTime: (time) => set({ currentTime: time }),
}));
