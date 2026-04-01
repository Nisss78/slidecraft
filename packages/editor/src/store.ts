import { create } from 'zustand';
import type { SelectionState } from './types/editor-messages';

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
  title?: string;
}

const defaultSelection: SelectionState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  fontFamily: '',
  fontSize: '16px',
  textAlign: 'left',
  foreColor: '#000000',
  backColor: 'transparent',
  blockType: 'p',
  orderedList: false,
  unorderedList: false,
};

interface EditorState {
  // Existing
  deck: Deck | null;
  currentSlideIndex: number;
  connected: boolean;
  loading: boolean;
  error: string | null;

  // Editing state
  editing: boolean;
  dirty: boolean;
  saving: boolean;
  lastSavedAt: string | null;
  selection: SelectionState;
  iframeReady: boolean;
  undoAvailable: boolean;
  redoAvailable: boolean;

  // Existing actions
  setDeck: (deck: Deck) => void;
  setCurrentSlide: (index: number) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Editing actions
  setEditing: (editing: boolean) => void;
  setSelection: (selection: SelectionState) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setIframeReady: (ready: boolean) => void;
  setUndoRedo: (undo: boolean, redo: boolean) => void;
  saveCurrentSlide: (deckId: string, slideId: string, html: string) => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Existing state
  deck: null,
  currentSlideIndex: 0,
  connected: false,
  loading: false,
  error: null,

  // Editing state
  editing: false,
  dirty: false,
  saving: false,
  lastSavedAt: null,
  selection: defaultSelection,
  iframeReady: false,
  undoAvailable: false,
  redoAvailable: false,

  // Existing actions
  setDeck: (deck) => set({ deck, error: null }),
  setCurrentSlide: (index) => set({ currentSlideIndex: index }),
  setConnected: (connected) => set({ connected }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Editing actions
  setEditing: (editing) => set({ editing }),
  setSelection: (selection) => set({ selection }),
  setDirty: (dirty) => set({ dirty }),
  setSaving: (saving) => set({ saving }),
  setIframeReady: (ready) => set({ iframeReady: ready }),
  setUndoRedo: (undo, redo) => set({ undoAvailable: undo, redoAvailable: redo }),

  saveCurrentSlide: async (deckId, slideId, html) => {
    const state = get();
    if (state.saving) return;
    set({ saving: true });
    try {
      const res = await fetch(`/api/decks/${deckId}/slides/${slideId}/html`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/html' },
        body: html,
      });
      if (res.ok) {
        set({ dirty: false, saving: false, lastSavedAt: new Date().toISOString() });
      } else {
        set({ saving: false, error: 'Failed to save slide' });
      }
    } catch {
      set({ saving: false, error: 'Failed to save slide' });
    }
  },
}));
