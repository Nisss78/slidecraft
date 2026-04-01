import { create } from 'zustand';

export interface Deck {
  id: string;
  title: string;
  description?: string;
  theme: string;
  aspectRatio: string;
  slides: Slide[];
  updatedAt: string;
}

export interface Slide {
  id: string;
  elements: any[];
  background?: any;
  notes?: string;
  layout?: string;
}

interface EditorState {
  deck: Deck | null;
  currentSlideIndex: number;
  connected: boolean;
  loading: boolean;
  error: string | null;
  setDeck: (deck: Deck) => void;
  setCurrentSlide: (index: number) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  deck: null,
  currentSlideIndex: 0,
  connected: false,
  loading: false,
  error: null,
  setDeck: (deck) => set({ deck, error: null }),
  setCurrentSlide: (index) => set({ currentSlideIndex: index }),
  setConnected: (connected) => set({ connected }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
