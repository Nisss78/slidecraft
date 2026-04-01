import type { Slide } from '../store';

interface SlidePanelProps {
  slides: Slide[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export function SlidePanel({ slides, currentIndex, onSelect }: SlidePanelProps) {
  return (
    <div style={{
      width: 200,
      background: '#1a1a2e',
      borderRight: '1px solid rgba(255,255,255,0.1)',
      overflowY: 'auto',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ fontSize: 12, color: '#888', padding: '4px 0', fontWeight: 600 }}>
        SLIDES ({slides.length})
      </div>
      {slides.map((slide, i) => (
        <button
          key={slide.id}
          onClick={() => onSelect(i)}
          style={{
            background: i === currentIndex ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
            border: i === currentIndex ? '2px solid #6366f1' : '2px solid transparent',
            borderRadius: 8,
            padding: 8,
            cursor: 'pointer',
            textAlign: 'left',
            color: '#e0e0e0',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
            {i + 1}. {slide.layout ?? 'blank'}
          </div>
          <div style={{
            background: '#0f0f23',
            borderRadius: 4,
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#555',
          }}>
            {slide.elements.length} elements
          </div>
        </button>
      ))}
    </div>
  );
}
