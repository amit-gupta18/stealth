require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

const connectDB = require('./src/config/db');
const postRoutes = require('./src/routes/postRoutes');
const { setupWebSocket } = require('./src/websocket/searchSocket');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', postRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  const server = http.createServer(app);
  setupWebSocket(server);

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
