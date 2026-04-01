import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from './store';
import { useWebSocket } from './hooks/useWebSocket';
import { Header } from './components/Header';
import { SlidePanel } from './components/SlidePanel';
import { SlideEditor } from './components/SlideEditor';
import { EditorToolbar } from './components/EditorToolbar';

function SlideView({ deckId, slideId }: { deckId: string; slideId: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f3f4f6' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 960,
            height: 540,
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            position: 'relative',
            background: '#fff',
          }}
        >
          <iframe
            src={`/api/decks/${deckId}/slides/${slideId}/html`}
            style={{
              width: 1920,
              height: 1080,
              border: 'none',
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
            title="Slide Preview"
          />
        </div>
      </div>
    </div>
  );
}

export function App() {
  const deck = useEditorStore((s) => s.deck);
  const currentSlideIndex = useEditorStore((s) => s.currentSlideIndex);
  const connected = useEditorStore((s) => s.connected);
  const editing = useEditorStore((s) => s.editing);
  const setEditing = useEditorStore((s) => s.setEditing);
  const setCurrentSlide = useEditorStore((s) => s.setCurrentSlide);
  const setDeck = useEditorStore((s) => s.setDeck);
  const setLoading = useEditorStore((s) => s.setLoading);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const params = new URLSearchParams(window.location.search);
  const deckId = params.get('deck');

  useWebSocket(deckId);

  useEffect(() => {
    if (!deckId) {
      setLoading(true);
      setLoading(false);
    }
  }, [deckId, setLoading]);

  const handleReorder = useCallback(
    async (slideIds: string[]) => {
      if (!deck) return;
      try {
        const res = await fetch(`/api/decks/${deck.id}/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slideIds }),
        });
        if (res.ok) {
          const deckRes = await fetch(`/api/decks/${deck.id}`);
          if (deckRes.ok) {
            setDeck(await deckRes.json());
          }
        }
      } catch (err) {
        console.error('Failed to reorder slides:', err);
      }
    },
    [deck, setDeck],
  );

  const handleDelete = useCallback(
    async (slideId: string) => {
      if (!deck) return;
      try {
        const res = await fetch(`/api/decks/${deck.id}/slides/${slideId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          const deckRes = await fetch(`/api/decks/${deck.id}`);
          if (deckRes.ok) {
            const updated = await deckRes.json();
            setDeck(updated);
            if (currentSlideIndex >= updated.slides.length) {
              setCurrentSlide(Math.max(0, updated.slides.length - 1));
            }
          }
        }
      } catch (err) {
        console.error('Failed to delete slide:', err);
      }
    },
    [deck, setDeck, currentSlideIndex, setCurrentSlide],
  );

  const handleEdit = useCallback(() => {
    setEditing(true);
  }, [setEditing]);

  const handleSave = useCallback(() => {
    setEditing(false);
  }, [setEditing]);

  if (!deckId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 16,
        background: '#fff',
      }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, color: '#6366f1' }}>SlideCraft</h1>
        <p style={{ color: '#6b7280', fontSize: 18 }}>AI-powered slide generation</p>
        <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 24 }}>
          Use MCP tools to create a deck, then add <code style={{ color: '#6366f1', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>?deck=DECK_ID</code> to the URL
        </p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#fff',
      }}>
        <div style={{ fontSize: 18, color: '#6b7280' }}>Loading deck...</div>
      </div>
    );
  }

  const currentSlide = deck.slides[currentSlideIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
      <Header
        title={deck.title}
        slideCount={deck.slides.length}
        theme={deck.theme}
        connected={connected}
        editing={editing}
        onEdit={handleEdit}
        onSave={handleSave}
        deckId={deck.id}
      />
      {editing && <EditorToolbar iframeRef={iframeRef} />}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SlidePanel
          slides={deck.slides}
          currentIndex={currentSlideIndex}
          deckId={deck.id}
          onSelect={setCurrentSlide}
          onReorder={handleReorder}
          onDelete={handleDelete}
          editing={editing}
        />
        {currentSlide ? (
          editing ? (
            <SlideEditor
              deckId={deck.id}
              slideId={currentSlide.id}
              iframeRef={iframeRef}
            />
          ) : (
            <SlideView
              deckId={deck.id}
              slideId={currentSlide.id}
            />
          )
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            background: '#f3f4f6',
          }}>
            No slides yet. Use MCP tools to add slides.
          </div>
        )}
      </div>
    </div>
  );
}
