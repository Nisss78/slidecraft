import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '../store';
import type { ParentToIframeMessage, FormatCommandName } from '../types/editor-messages';

interface EditorToolbarProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  deckId: string;
}

interface FontEntry {
  name: string;
  category: 'japanese' | 'english' | 'system';
}

const FONT_LIST: FontEntry[] = [
  // Japanese
  { name: 'Noto Sans JP', category: 'japanese' },
  { name: 'Noto Serif JP', category: 'japanese' },
  { name: 'BIZ UDGothic', category: 'japanese' },
  { name: 'BIZ UDMincho', category: 'japanese' },
  { name: 'M PLUS Rounded 1c', category: 'japanese' },
  { name: 'M PLUS 1p', category: 'japanese' },
  { name: 'Kosugi Maru', category: 'japanese' },
  { name: 'Sawarabi Gothic', category: 'japanese' },
  { name: 'Zen Maru Gothic', category: 'japanese' },
  { name: 'Shippori Mincho', category: 'japanese' },
  // English
  { name: 'Inter', category: 'english' },
  { name: 'Roboto', category: 'english' },
  { name: 'Open Sans', category: 'english' },
  { name: 'Montserrat', category: 'english' },
  { name: 'Lato', category: 'english' },
  { name: 'Poppins', category: 'english' },
  { name: 'Playfair Display', category: 'english' },
  { name: 'Source Code Pro', category: 'english' },
  // System
  { name: 'Arial', category: 'system' },
  { name: 'Georgia', category: 'system' },
  { name: 'Courier New', category: 'system' },
  { name: 'Times New Roman', category: 'system' },
];

const CATEGORY_LABELS: Record<string, string> = {
  japanese: '日本語',
  english: '英語',
  system: 'システム',
};

const BLOCK_TYPES: { label: string; value: string; style: React.CSSProperties }[] = [
  { label: '標準テキスト', value: 'p', style: { fontSize: 13 } },
  { label: '見出し 1', value: 'h1', style: { fontSize: 20, fontWeight: 700 } },
  { label: '見出し 2', value: 'h2', style: { fontSize: 17, fontWeight: 700 } },
  { label: '見出し 3', value: 'h3', style: { fontSize: 15, fontWeight: 600 } },
  { label: '見出し 4', value: 'h4', style: { fontSize: 14, fontWeight: 600 } },
  { label: '見出し 5', value: 'h5', style: { fontSize: 13, fontWeight: 600 } },
  { label: '見出し 6', value: 'h6', style: { fontSize: 12, fontWeight: 600, color: '#6b7280' } },
];

// Load Google Fonts for preview in the parent document
function loadGoogleFontsForPreview() {
  const googleFonts = FONT_LIST
    .filter((f) => f.category !== 'system')
    .map((f) => f.name);
  if (googleFonts.length === 0) return;
  const families = googleFonts
    .map((f) => f.replace(/ /g, '+') + ':wght@400;700')
    .join('&family=');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  link.id = 'editor-toolbar-google-fonts';
  if (!document.getElementById('editor-toolbar-google-fonts')) {
    document.head.appendChild(link);
  }
}

function sendToIframe(
  iframe: HTMLIFrameElement | null,
  msg: ParentToIframeMessage,
) {
  iframe?.contentWindow?.postMessage(msg, '*');
}

// Prevent button clicks from stealing iframe focus
function prevent(e: React.MouseEvent) {
  e.preventDefault();
}

// Get fixed position for dropdown based on trigger element
function getDropdownPos(el: HTMLElement | null): { top: number; left: number } {
  if (!el) return { top: 0, left: 0 };
  const rect = el.getBoundingClientRect();
  return { top: rect.bottom, left: rect.left };
}

export function EditorToolbar({ iframeRef, deckId }: EditorToolbarProps) {
  const selection = useEditorStore((s) => s.selection);
  const undoAvailable = useEditorStore((s) => s.undoAvailable);
  const redoAvailable = useEditorStore((s) => s.redoAvailable);
  const iframeReady = useEditorStore((s) => s.iframeReady);
  const [fontSizeInput, setFontSizeInput] = useState('');
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const blockBtnRef = useRef<HTMLButtonElement>(null);
  const fontBtnRef = useRef<HTMLButtonElement>(null);
  const blockDropRef = useRef<HTMLDivElement>(null);
  const fontDropRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load Google Fonts for preview on mount
  useEffect(() => {
    loadGoogleFontsForPreview();
  }, []);

  const send = useCallback(
    (msg: ParentToIframeMessage) => sendToIframe(iframeRef.current, msg),
    [iframeRef],
  );

  const formatCmd = useCallback(
    (command: FormatCommandName) => send({ type: 'format-command', command }),
    [send],
  );

  const foreColorRef = useRef<HTMLInputElement>(null);
  const backColorRef = useRef<HTMLInputElement>(null);

  // Close block menu on outside click
  useEffect(() => {
    if (!blockMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        blockBtnRef.current?.contains(target) ||
        blockDropRef.current?.contains(target)
      ) return;
      setBlockMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [blockMenuOpen]);

  // Close font menu on outside click
  useEffect(() => {
    if (!fontMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        fontBtnRef.current?.contains(target) ||
        fontDropRef.current?.contains(target)
      ) return;
      setFontMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [fontMenuOpen]);

  if (!iframeReady) return null;

  const btnStyle = (active = false, disabled = false): React.CSSProperties => ({
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    background: active ? '#e0e7ff' : '#fff',
    color: active ? '#4338ca' : '#374151',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 14,
    fontWeight: active ? 700 : 400,
    flexShrink: 0,
    opacity: disabled ? 0.4 : 1,
    transition: 'background 0.15s, opacity 0.15s',
  });

  const sepStyle: React.CSSProperties = {
    width: 1,
    height: 24,
    background: '#e5e7eb',
    margin: '0 4px',
    flexShrink: 0,
  };

  const currentBlockLabel = BLOCK_TYPES.find((bt) => bt.value === selection.blockType)?.label ?? '標準テキスト';

  // Display font size without 'px' suffix
  const displayFontSize = selection.fontSize ? selection.fontSize.replace('px', '') : '16';

  // Current font family display (truncate if too long)
  const currentFontDisplay = selection.fontFamily || 'フォント';
  const fontDisplayText = currentFontDisplay.length > 14 ? currentFontDisplay.slice(0, 14) + '...' : currentFontDisplay;

  // Group fonts by category
  const fontsByCategory = (['japanese', 'english', 'system'] as const).map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    fonts: FONT_LIST.filter((f) => f.category === cat),
  }));

  const blockPos = getDropdownPos(blockBtnRef.current);
  const fontPos = getDropdownPos(fontBtnRef.current);

  return (
    <div
      style={{
        height: 44,
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 4,
        overflowX: 'auto',
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Undo / Redo */}
      <button
        style={btnStyle(false, !undoAvailable)}
        onMouseDown={prevent}
        onClick={() => { if (undoAvailable) send({ type: 'undo' }); }}
        disabled={!undoAvailable}
        title="元に戻す"
      >
        ↩
      </button>
      <button
        style={btnStyle(false, !redoAvailable)}
        onMouseDown={prevent}
        onClick={() => { if (redoAvailable) send({ type: 'redo' }); }}
        disabled={!redoAvailable}
        title="やり直す"
      >
        ↪
      </button>

      <div style={sepStyle} />

      {/* Block type trigger */}
      <button
        ref={blockBtnRef}
        onMouseDown={prevent}
        onClick={() => { setFontMenuOpen(false); setBlockMenuOpen((v) => !v); }}
        style={{
          height: 32,
          minWidth: 110,
          border: '1px solid #d1d5db',
          borderRadius: 4,
          padding: '0 8px',
          fontSize: 13,
          background: blockMenuOpen ? '#e0e7ff' : '#fff',
          color: '#374151',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        <span>{currentBlockLabel}</span>
        <span style={{ fontSize: 10 }}>▼</span>
      </button>

      {/* Block type dropdown — portalled to body */}
      {blockMenuOpen && createPortal(
        <div
          ref={blockDropRef}
          onMouseDown={prevent}
          style={{
            position: 'fixed',
            top: blockPos.top,
            left: blockPos.left,
            zIndex: 10000,
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            padding: '4px 0',
            minWidth: 160,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {BLOCK_TYPES.map((bt) => (
            <div
              key={bt.value}
              onMouseDown={prevent}
              onClick={() => {
                send({ type: 'block-type', tag: bt.value as any });
                setBlockMenuOpen(false);
              }}
              style={{
                padding: '6px 12px',
                cursor: 'pointer',
                background: selection.blockType === bt.value ? '#e0e7ff' : 'transparent',
                color: selection.blockType === bt.value ? '#4338ca' : '#374151',
                ...bt.style,
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (selection.blockType !== bt.value) {
                  (e.currentTarget as HTMLElement).style.background = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  selection.blockType === bt.value ? '#e0e7ff' : 'transparent';
              }}
            >
              {bt.label}
            </div>
          ))}
        </div>,
        document.body,
      )}

      <div style={sepStyle} />

      {/* Font family trigger */}
      <button
        ref={fontBtnRef}
        onMouseDown={prevent}
        onClick={() => { setBlockMenuOpen(false); setFontMenuOpen((v) => !v); }}
        style={{
          height: 32,
          minWidth: 140,
          maxWidth: 180,
          border: '1px solid #d1d5db',
          borderRadius: 4,
          padding: '0 8px',
          fontSize: 13,
          background: fontMenuOpen ? '#e0e7ff' : '#fff',
          color: '#374151',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
          fontFamily: selection.fontFamily || 'inherit',
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fontDisplayText}
        </span>
        <span style={{ fontSize: 10, flexShrink: 0 }}>▼</span>
      </button>

      {/* Font family dropdown — portalled to body */}
      {fontMenuOpen && createPortal(
        <div
          ref={fontDropRef}
          onMouseDown={prevent}
          style={{
            position: 'fixed',
            top: fontPos.top,
            left: fontPos.left,
            zIndex: 10000,
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            padding: '4px 0',
            minWidth: 220,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {fontsByCategory.map((group) => (
            <div key={group.category}>
              <div
                style={{
                  padding: '6px 12px 4px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  userSelect: 'none',
                }}
              >
                {group.label}
              </div>
              {group.fonts.map((font) => (
                <div
                  key={font.name}
                  onMouseDown={prevent}
                  onClick={() => {
                    send({ type: 'font-family', family: font.name });
                    setFontMenuOpen(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontFamily: font.name,
                    fontSize: 14,
                    background: selection.fontFamily === font.name ? '#e0e7ff' : 'transparent',
                    color: selection.fontFamily === font.name ? '#4338ca' : '#374151',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (selection.fontFamily !== font.name) {
                      (e.currentTarget as HTMLElement).style.background = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      selection.fontFamily === font.name ? '#e0e7ff' : 'transparent';
                  }}
                >
                  {font.name}
                </div>
              ))}
            </div>
          ))}
        </div>,
        document.body,
      )}

      {/* Font size — allow focus for typing, restore selection before apply */}
      <input
        type="text"
        placeholder={displayFontSize}
        value={fontSizeInput}
        onChange={(e) => setFontSizeInput(e.target.value)}
        onFocus={() => {
          send({ type: 'restore-selection' });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const val = fontSizeInput.trim();
            if (val) {
              send({ type: 'font-size', size: val.includes('px') ? val : val + 'px' });
              setFontSizeInput('');
              iframeRef.current?.contentWindow?.focus();
            }
          }
        }}
        style={{ width: 50, height: 32, border: '1px solid #d1d5db', borderRadius: 4, padding: '0 6px', fontSize: 13, textAlign: 'center', background: '#fff', color: '#374151' }}
      />

      <div style={sepStyle} />

      {/* Bold / Italic / Underline / Strikethrough */}
      <button style={btnStyle(selection.bold)} onMouseDown={prevent} onClick={() => formatCmd('bold')} title="太字"><b>B</b></button>
      <button style={btnStyle(selection.italic)} onMouseDown={prevent} onClick={() => formatCmd('italic')} title="斜体"><i>I</i></button>
      <button style={btnStyle(selection.underline)} onMouseDown={prevent} onClick={() => formatCmd('underline')} title="下線"><u>U</u></button>
      <button style={btnStyle(selection.strikethrough)} onMouseDown={prevent} onClick={() => formatCmd('strikeThrough')} title="取り消し線"><s>S</s></button>

      <div style={sepStyle} />

      {/* Text alignment */}
      <button style={btnStyle(selection.textAlign === 'left')} onMouseDown={prevent} onClick={() => formatCmd('justifyLeft')} title="左揃え">≡</button>
      <button style={btnStyle(selection.textAlign === 'center')} onMouseDown={prevent} onClick={() => formatCmd('justifyCenter')} title="中央揃え">☰</button>
      <button style={btnStyle(selection.textAlign === 'right')} onMouseDown={prevent} onClick={() => formatCmd('justifyRight')} title="右揃え">≡</button>

      <div style={sepStyle} />

      {/* Lists */}
      <button style={btnStyle(selection.orderedList)} onMouseDown={prevent} onClick={() => formatCmd('insertOrderedList')} title="番号付きリスト">1.</button>
      <button style={btnStyle(selection.unorderedList)} onMouseDown={prevent} onClick={() => formatCmd('insertUnorderedList')} title="箇条書き">•</button>

      <div style={sepStyle} />

      {/* Text color */}
      <div style={{ position: 'relative' }}>
        <button
          style={{ ...btnStyle(), borderBottom: `3px solid ${selection.foreColor || '#000'}` }}
          onMouseDown={prevent}
          onClick={() => foreColorRef.current?.click()}
          title="テキスト色"
        >
          A
        </button>
        <input
          ref={foreColorRef}
          type="color"
          value={selection.foreColor || '#000000'}
          onChange={(e) => send({ type: 'fore-color', color: e.target.value })}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
        />
      </div>

      {/* Background color */}
      <div style={{ position: 'relative' }}>
        <button
          style={{ ...btnStyle(), background: selection.backColor && selection.backColor !== 'transparent' ? selection.backColor : '#fff' }}
          onMouseDown={prevent}
          onClick={() => backColorRef.current?.click()}
          title="背景色"
        >
          <span style={{ background: '#fbbf24', padding: '0 4px', borderRadius: 2, fontSize: 12 }}>A</span>
        </button>
        <input
          ref={backColorRef}
          type="color"
          value={selection.backColor && selection.backColor !== 'transparent' ? selection.backColor : '#ffff00'}
          onChange={(e) => send({ type: 'back-color', color: e.target.value })}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
        />
      </div>

      <div style={sepStyle} />

      {/* Clear formatting */}
      <button
        style={btnStyle()}
        onMouseDown={prevent}
        onClick={() => send({ type: 'clear-formatting' })}
        title="書式をクリア"
      >
        T̸
      </button>

      {/* Insert link */}
      <button
        style={btnStyle()}
        onMouseDown={prevent}
        onClick={() => {
          const url = prompt('リンクURL:');
          if (url) send({ type: 'insert-link', url, text: url });
        }}
        title="リンク挿入"
      >
        🔗
      </button>

      {/* Insert image */}
      <button
        style={btnStyle()}
        onMouseDown={prevent}
        onClick={() => imageInputRef.current?.click()}
        title="画像挿入"
      >
        🖼
      </button>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const buf = await file.arrayBuffer();
            const res = await fetch(`/api/decks/${deckId}/images`, {
              method: 'POST',
              headers: { 'x-filename': encodeURIComponent(file.name) },
              body: buf,
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({ error: 'Upload failed' }));
              alert(err.error || 'Upload failed');
              return;
            }
            const { url } = await res.json();
            send({ type: 'insert-image', src: url });
          } catch (err) {
            console.error('Image upload failed:', err);
            alert('画像のアップロードに失敗しました');
          } finally {
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}
