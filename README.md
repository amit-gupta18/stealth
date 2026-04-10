# Real-Time Post Search App

A full-stack app that fetches posts from JSONPlaceholder, stores them in MongoDB Atlas, and provides real-time title search using WebSockets.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas with Mongoose
- Real-time: `ws`

## Project Structure

- `frontend`
- `backend`

## How to Run Locally

### Backend

1. Open a terminal in `backend`.
2. Run `npm install`.
3. Create `backend/.env` from `backend/.env.example`.
4. Set `MONGO_URI` to your MongoDB Atlas connection string.
5. Start the server with `npm run dev`.

### Frontend

1. Open a terminal in `frontend`.
2. Run `npm install`.
3. Create `frontend/.env` from `frontend/.env.example`.
4. Make sure `VITE_API_BASE_URL` points to the backend API, for example `http://localhost:8000/api`.
5. Start the app with `npm run dev`.

Example `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000/ws
VITE_WS_DEBUG=true
```

## Environment Variables

### `backend/.env`

- `MONGO_URI` - MongoDB Atlas connection string
- `PORT` - optional, defaults to `5000`

### `frontend/.env`

- `VITE_API_BASE_URL` - backend API base URL, for example `http://localhost:5000/api`
- `VITE_WS_URL` - WebSocket URL, for example `ws://localhost:5000/ws`
- `VITE_WS_DEBUG` - optional, set to `true` to enable WebSocket client logs

## API Endpoints

- `GET /api/fetch` - fetch and store posts without duplicates
- `GET /api/external-posts` - fetch posts directly from JSONPlaceholder
- `GET /api/posts` - get all stored posts
- `GET /api/posts/:id` - get a single post
- `POST /api/posts/save` - save a post manually

## WebSocket API

- Endpoint: `/ws`
- Client sends a plain text search query.
- Server responds with JSON like:

```json
{ "type": "search-results", "query": "react", "results": [] }
```

Search is case-insensitive and matches against `title`.

## Live URL

- Frontend: add your deployed Vercel URL here
- Backend/API: add your deployed Render URL here

## Deployment Notes

- Deploy the backend on Render so the HTTP API and WebSocket server run on the same instance.
- Deploy the frontend on Vercel.
- In production, use `wss://` for the WebSocket URL.
