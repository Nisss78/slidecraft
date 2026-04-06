import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store';
import type { IframeToParentMessage } from '../types/editor-messages';

interface SlideEditorProps {
  deckId: string;
  slideId: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export function SlideEditor({ deckId, slideId, iframeRef }: SlideEditorProps) {
  const setSelection = useEditorStore((s) => s.setSelection);
  const setUndoRedo = useEditorStore((s) => s.setUndoRedo);
  const setDirty = useEditorStore((s) => s.setDirty);
  const setIframeReady = useEditorStore((s) => s.setIframeReady);
  const saveCurrentSlide = useEditorStore((s) => s.saveCurrentSlide);
  const setBlockEditing = useEditorStore((s) => s.setBlockEditing);
  const setSelectedBlockIndex = useEditorStore((s) => s.setSelectedBlockIndex);
  const dirty = useEditorStore((s) => s.dirty);
  const saving = useEditorStore((s) => s.saving);
  const lastSavedAt = useEditorStore((s) => s.lastSavedAt);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTargetRef = useRef<{ deckId: string; slideId: string } | null>(null);

  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    saveTargetRef.current = null;
    setIframeReady(false);
    setDirty(false);
  }, [deckId, slideId, setIframeReady, setDirty]);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = `/api/decks/${deckId}/slides/${slideId}/edit-html`;
    }
  }, [deckId, slideId, iframeRef]);

  useEffect(() => {
    function handleMessage(event: MessageEvent<IframeToParentMessage>) {
      const msg = event.data;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'editor-ready':
          setIframeReady(true);
          break;

        case 'selection-change':
          setSelection(msg.selection);
          setUndoRedo(msg.selection.undoAvailable, msg.selection.redoAvailable);
          break;

        case 'content-change':
          setDirty(true);
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveTargetRef.current = { deckId, slideId };
          saveTimerRef.current = setTimeout(() => {
            iframeRef.current?.contentWindow?.postMessage({ type: 'get-html' }, '*');
          }, 1500);
          break;

        case 'html-response': {
          const target = saveTargetRef.current;
          if (target) {
            saveCurrentSlide(target.deckId, target.slideId, msg.html);
            saveTargetRef.current = null;
          }
          break;
        }

        case 'block-select':
          setSelectedBlockIndex(msg.blockIndex);
          setBlockEditing(false);
          break;

        case 'block-edit-start':
          setSelectedBlockIndex(msg.blockIndex);
          setBlockEditing(true);
          break;

        case 'block-edit-end':
          setBlockEditing(false);
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [deckId, slideId, setIframeReady, setSelection, setUndoRedo, setDirty, saveCurrentSlide, setBlockEditing, setSelectedBlockIndex, iframeRef]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  let statusText = '';
  if (saving) {
    statusText = '保存中...';
  } else if (dirty) {
    statusText = '未保存の変更あり';
  } else if (lastSavedAt) {
    const d = new Date(lastSavedAt);
    statusText = `最終保存: ${d.toLocaleTimeString('ja-JP')}`;
  }

  const frameRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.5);

  useEffect(() => {
    const update = () => {
      const frame = frameRef.current;
      if (!frame) return;
      const cw = frame.clientWidth - 28; // padding + border
      const ch = frame.clientHeight - 28;
      if (cw <= 0 || ch <= 0) return;
      // Pick the zoom that fits the largest 16:9 rect
      const zoomByWidth = cw / 1920;
      const zoomByHeight = ch / 1080;
      setZoom(Math.min(zoomByWidth, zoomByHeight));
    };
    update();
    const ro = new ResizeObserver(update);
    if (frameRef.current) ro.observe(frameRef.current);
    return () => { ro.disconnect(); };
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
        {/* Wrapper for border/shadow — NOT zoomed */}
        <div
          style={{
            flexShrink: 0,
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            border: '2px dashed #93c5fd',
            background: '#fff',
            lineHeight: 0,
          }}
        >
          <iframe
            ref={iframeRef}
            style={{
              width: 1920,
              height: 1080,
              border: 'none',
              display: 'block',
              zoom: zoom,
            }}
            title="Slide Editor"
          />
        </div>
      </div>

      <div
        style={{
          height: 28,
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          fontSize: 12,
          color: saving ? '#f59e0b' : dirty ? '#ef4444' : '#6b7280',
          flexShrink: 0,
        }}
      >
        {statusText}
      </div>
    </div>
  );
}
