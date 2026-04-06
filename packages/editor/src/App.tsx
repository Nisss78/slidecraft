import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditorStore } from './store';
import { useWebSocket } from './hooks/useWebSocket';
import { Header } from './components/Header';
import { SlidePanel } from './components/SlidePanel';
import { SlideEditor } from './components/SlideEditor';
import { EditorToolbar } from './components/EditorToolbar';
import { HomeScreen } from './components/HomeScreen';

function SlideView({ deckId, slideId }: { deckId: string; slideId: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.5);

  useEffect(() => {
    const update = () => {
      const frame = frameRef.current;
      if (!frame) return;
      const cw = frame.clientWidth - 28;
      const ch = frame.clientHeight - 28;
      if (cw <= 0 || ch <= 0) return;
      const zoomByWidth = cw / 1920;
      const zoomByHeight = ch / 1080;
      setZoom(Math.min(zoomByWidth, zoomByHeight));
    };
    update();
    const ro = new ResizeObserver(update);
    if (frameRef.current) ro.observe(frameRef.current);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f3f4f6', minWidth: 0 }}>
      <div
        ref={frameRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            background: '#fff',
            lineHeight: 0,
          }}
        >
          <iframe
            src={`/api/decks/${deckId}/slides/${slideId}/html`}
            style={{
              width: 1920,
              height: 1080,
              border: 'none',
              display: 'block',
              zoom: zoom,
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
  const dirty = useEditorStore((s) => s.dirty);
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

  // Arrow key navigation
  useEffect(() => {
    if (!deck) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input/textarea/select or iframe editing
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'IFRAME') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentSlide(Math.max(0, currentSlideIndex - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentSlide(Math.min(deck.slides.length - 1, currentSlideIndex + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck, currentSlideIndex, setCurrentSlide]);

  if (!deckId) {
    return <HomeScreen />;
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
        dirty={dirty}
        onEdit={handleEdit}
        onSave={handleSave}
        deckId={deck.id}
      />
      {editing && <EditorToolbar iframeRef={iframeRef} deckId={deck.id} />}
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
