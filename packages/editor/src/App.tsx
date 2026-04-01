import { useEffect } from 'react';
import { useEditorStore } from './store';
import { useWebSocket } from './hooks/useWebSocket';
import { Header } from './components/Header';
import { SlidePanel } from './components/SlidePanel';
import { SlideView } from './components/SlideView';

export function App() {
  const deck = useEditorStore((s) => s.deck);
  const currentSlideIndex = useEditorStore((s) => s.currentSlideIndex);
  const connected = useEditorStore((s) => s.connected);
  const setCurrentSlide = useEditorStore((s) => s.setCurrentSlide);
  const setDeck = useEditorStore((s) => s.setDeck);
  const setLoading = useEditorStore((s) => s.setLoading);

  // Get deck ID from URL params
  const params = new URLSearchParams(window.location.search);
  const deckId = params.get('deck');

  useWebSocket(deckId);

  // Load deck list if no deck ID
  useEffect(() => {
    if (!deckId) {
      setLoading(true);
      // Show landing/deck list page
      setLoading(false);
    }
  }, [deckId, setLoading]);

  if (!deckId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 16,
      }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, color: '#818cf8' }}>SlideCraft</h1>
        <p style={{ color: '#888', fontSize: 18 }}>AI-powered slide generation</p>
        <p style={{ color: '#555', fontSize: 14, marginTop: 24 }}>
          Use MCP tools to create a deck, then add <code style={{ color: '#818cf8' }}>?deck=DECK_ID</code> to the URL
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
      }}>
        <div style={{ fontSize: 18, color: '#888' }}>Loading deck...</div>
      </div>
    );
  }

  const currentSlide = deck.slides[currentSlideIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header
        title={deck.title}
        slideCount={deck.slides.length}
        theme={deck.theme}
        connected={connected}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SlidePanel
          slides={deck.slides}
          currentIndex={currentSlideIndex}
          onSelect={setCurrentSlide}
        />
        {currentSlide ? (
          <SlideView deckId={deck.id} slideId={currentSlide.id} />
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#555',
          }}>
            No slides yet. Use MCP tools to add slides.
          </div>
        )}
      </div>
    </div>
  );
}
