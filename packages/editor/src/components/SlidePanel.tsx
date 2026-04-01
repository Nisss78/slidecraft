import { useState, useCallback } from 'react';
import type { Slide } from '../store';

interface SlidePanelProps {
  slides: Slide[];
  currentIndex: number;
  deckId: string;
  onSelect: (index: number) => void;
  onReorder: (slideIds: string[]) => void;
  onDelete: (slideId: string) => void;
  editing: boolean;
}

export function SlidePanel({
  slides,
  currentIndex,
  deckId,
  onSelect,
  onReorder,
  onDelete,
  editing,
}: SlidePanelProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === dropIndex) {
        setDragIndex(null);
        setDragOverIndex(null);
        return;
      }
      const newSlides = [...slides];
      const [moved] = newSlides.splice(dragIndex, 1);
      newSlides.splice(dropIndex, 0, moved);
      onReorder(newSlides.map((s) => s.id));
      if (dragIndex === currentIndex) {
        onSelect(dropIndex);
      }
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, slides, onReorder, onSelect, currentIndex],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div
      style={{
        width: 220,
        background: '#fff',
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#6b7280',
          padding: '4px 0',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Slides ({slides.length})
      </div>
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          draggable={editing}
          onDragStart={editing ? (e) => handleDragStart(e, i) : undefined}
          onDragOver={editing ? (e) => handleDragOver(e, i) : undefined}
          onDrop={editing ? (e) => handleDrop(e, i) : undefined}
          onDragEnd={editing ? handleDragEnd : undefined}
          onClick={() => onSelect(i)}
          style={{
            background: i === currentIndex ? '#eff6ff' : dragOverIndex === i ? '#f0fdf4' : '#f9fafb',
            border: i === currentIndex ? '2px solid #3b82f6' : dragOverIndex === i ? '2px dashed #22c55e' : '2px solid transparent',
            borderRadius: 8,
            padding: 6,
            cursor: editing ? 'grab' : 'pointer',
            position: 'relative',
            transition: 'all 0.15s',
            opacity: dragIndex === i ? 0.4 : 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>
              {i + 1}. {slide.title || slide.layout || 'Slide'}
            </div>
            {editing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === i ? null : i);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#9ca3af',
                  padding: '0 4px',
                  lineHeight: 1,
                }}
              >
                ⋮
              </button>
            )}
          </div>

          <div
            style={{
              borderRadius: 4,
              overflow: 'hidden',
              aspectRatio: '16/9',
              background: '#e5e7eb',
              pointerEvents: 'none',
            }}
          >
            <iframe
              src={`/api/decks/${deckId}/slides/${slide.id}/html`}
              style={{
                width: 1920,
                height: 1080,
                border: 'none',
                transform: `scale(${196 / 1920})`,
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }}
              tabIndex={-1}
              title={`Slide ${i + 1}`}
            />
          </div>

          {editing && menuOpen === i && (
            <div
              style={{
                position: 'absolute',
                right: 8,
                top: 24,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 10,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('このスライドを削除しますか？')) {
                    onDelete(slide.id);
                  }
                  setMenuOpen(null);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#ef4444',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'none';
                }}
              >
                削除
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
