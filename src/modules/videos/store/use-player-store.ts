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
  
  // Actions
  setVideo: (video: PlayerVideo) => void;
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  addToQueue: (video: PlayerVideo) => void;
  removeFromQueue: (videoId: string) => void;
  playNext: () => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  activeVideoId: null,
  activeVideo: null,
  isMinimized: false,
  isOpen: false,
  queue: [],

  setVideo: (video) => set({ 
    activeVideo: video, 
    activeVideoId: video.id,
    isOpen: true,
    isMinimized: false 
  }),
  
  close: () => set({ 
    isOpen: false, 
    activeVideo: null, 
    activeVideoId: null 
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
      isMinimized: false
    };
  }),
  
  clearQueue: () => set({ queue: [] }),
}));
