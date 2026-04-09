import { API_BASE_URL } from './api';

function buildWebSocketUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  return API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://').replace('/api', '/ws');
}

export function createSearchSocket({ onResults, onError, onOpen, onClose }) {
  const ws = new WebSocket(buildWebSocketUrl());

  ws.onopen = () => {
    if (onOpen) onOpen();
  };

  ws.onclose = () => {
    if (onClose) onClose();
  };

  ws.onerror = () => {
    if (onError) onError(new Error('WebSocket connection error'));
  };

  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);

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
