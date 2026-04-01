import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../store';

export function useWebSocket(deckId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const setConnected = useEditorStore((s) => s.setConnected);
  const setDeck = useEditorStore((s) => s.setDeck);

  const fetchDeck = useCallback(async (id: string) => {
    // Skip refresh if we're actively editing (dirty or saving)
    const { dirty, saving } = useEditorStore.getState();
    if (dirty || saving) return;

    try {
      const res = await fetch(`/api/decks/${id}`);
      if (res.ok) {
        const deck = await res.json();
        setDeck(deck);
      }
    } catch (err) {
      console.error('Failed to fetch deck:', err);
    }
  }, [setDeck]);

  useEffect(() => {
    if (!deckId) return;

    function connect() {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: 'subscribe', deckId }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'deck-updated' && msg.deckId === deckId && deckId) {
            fetchDeck(deckId);
          }
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();
    // Initial fetch always runs regardless of dirty state
    fetch(`/api/decks/${deckId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((deck) => { if (deck) setDeck(deck); })
      .catch((err) => console.error('Failed to fetch deck:', err));

    return () => {
      wsRef.current?.close();
    };
  }, [deckId, setConnected, fetchDeck, setDeck]);
}
