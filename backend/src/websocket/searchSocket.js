const { WebSocketServer } = require('ws');
const Post = require('../models/Post');

let clientCounter = 0;

function wsLog(message, meta = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[WS][${timestamp}] ${message}`, meta);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    clientCounter += 1;
    const clientId = clientCounter;
    const ipAddress = req.socket.remoteAddress;

    wsLog('Client connected', { clientId, ipAddress });

    ws.on('message', async (rawMessage) => {
      try {
        const query = rawMessage.toString().trim();
        let results;

        wsLog('Received search query', {
          clientId,
          query,
          queryLength: query.length,
        });

        if (!query) {
          results = await Post.find().sort({ id: 1 }).limit(100);
        } else {
          const safeRegex = new RegExp(escapeRegex(query), 'i');
          results = await Post.find({ title: safeRegex }).sort({ id: 1 }).limit(100);
        }

        wsLog('Sending search results', {
          clientId,
          resultCount: results.length,
          query,
        });

        ws.send(
          JSON.stringify({
            type: 'search-results',
            query,
            results,
          })
        );
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: error.message,
          })
        );

        wsLog('Search handler error', {
          clientId,
          error: error.message,
        });
      }
    });

    ws.on('error', (error) => {
      wsLog('Socket error', {
        clientId,
        error: error.message,
      });
    });

    ws.on('close', (code, reason) => {
      wsLog('Client disconnected', {
        clientId,
        code,
        reason: reason.toString(),
      });
    });
  });

  console.log('WebSocket server listening on /ws');
}

module.exports = { setupWebSocket };
