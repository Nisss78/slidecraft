import { useEffect, useRef } from 'react';

interface SlideViewProps {
  deckId: string;
  slideId: string;
}

export function SlideView({ deckId, slideId }: SlideViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Reload iframe content when slide changes
    if (iframeRef.current) {
      iframeRef.current.src = `/api/decks/${deckId}/slides/${slideId}/html`;
    }
  }, [deckId, slideId]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#16162a',
      padding: 40,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 960,
        aspectRatio: '16/9',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <iframe
          ref={iframeRef}
          src={`/api/decks/${deckId}/slides/${slideId}/html`}
          style={{
            width: '1920px',
            height: '1080px',
            border: 'none',
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
          }}
          title="Slide Preview"
        />
      </div>
    </div>
  );
}
