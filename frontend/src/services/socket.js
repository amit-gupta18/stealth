import { API_BASE_URL } from './api';

const ENABLE_WS_DEBUG = import.meta.env.VITE_WS_DEBUG === 'true' || import.meta.env.DEV;

function wsDebug(message, meta = {}) {
  if (!ENABLE_WS_DEBUG) {
    return;
  }

  const timestamp = new Date().toISOString();
  console.log(`[WS][Client][${timestamp}] ${message}`, meta);
}

function buildWebSocketUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  return API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://').replace('/api', '/ws');
}

export function createSearchSocket({ onResults, onError, onOpen, onClose }) {
  const url = buildWebSocketUrl();
  wsDebug('Creating socket', { url });
  const ws = new WebSocket(url);

  ws.onopen = () => {
    wsDebug('Socket opened');
    if (onOpen) onOpen();
  };

  ws.onclose = (event) => {
    wsDebug('Socket closed', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
    if (onClose) onClose();
  };

  ws.onerror = () => {
    wsDebug('Socket error');
    if (onError) onError(new Error('WebSocket connection error'));
  };

  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      wsDebug('Socket message received', {
        type: payload.type,
        resultCount: payload?.results?.length,
        query: payload.query,
      });

      if (payload.type === 'search-results' && onResults) {
        onResults(payload.results || []);
      }

      if (payload.type === 'error' && onError) {
        onError(new Error(payload.message || 'Unknown WebSocket error'));
      }
    } catch (error) {
      if (onError) onError(error);
    }
  };

  return ws;
}
