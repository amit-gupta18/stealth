const { WebSocketServer } = require('ws');
const Post = require('../models/Post');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    ws.on('message', async (rawMessage) => {
      try {
        const query = rawMessage.toString().trim();
        let results;

        if (!query) {
          results = await Post.find().sort({ id: 1 }).limit(100);
        } else {
          const safeRegex = new RegExp(escapeRegex(query), 'i');
          results = await Post.find({ title: safeRegex }).sort({ id: 1 }).limit(100);
        }

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
      }
    });
  });

  console.log('WebSocket server listening on /ws');
}

module.exports = { setupWebSocket };
