import { useEffect, useRef, useState } from 'react'
import SearchBar from './components/SearchBar'
import PostList from './components/PostList'
import { fetchAndStorePosts, getPosts } from './services/api'
import { createSearchSocket } from './services/socket'
import './App.css'

const ENABLE_WS_DEBUG = import.meta.env.VITE_WS_DEBUG === 'true' || import.meta.env.DEV

function wsDebug(message, meta = {}) {
  if (!ENABLE_WS_DEBUG) {
    return
  }

  const timestamp = new Date().toISOString()
  console.log(`[WS][App][${timestamp}] ${message}`, meta)
}

function App() {
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    async function loadPosts() {
      try {
        setLoading(true)
        setError('')

        await fetchAndStorePosts()
        const allPosts = await getPosts()
        setPosts(allPosts)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  useEffect(() => {
    socketRef.current = createSearchSocket({
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onError: (socketError) => {
        setConnected(false)
        setError(socketError.message)
      },
      onResults: (results) => {
        setPosts(results)
      },
    })

    return () => {
      const socket = socketRef.current

      if (!socket) {
        return
      }

      wsDebug('Running socket cleanup', { readyState: socket.readyState })

      if (socket.readyState === WebSocket.OPEN) {
        wsDebug('Closing open socket during cleanup')
        socket.close(1000, 'Component unmounted')
        return
      }

      if (socket.readyState === WebSocket.CONNECTING) {
        wsDebug('Socket is connecting, scheduling close after open')
        socket.addEventListener(
          'open',
          () => {
            wsDebug('Closing socket after delayed open during cleanup')
            socket.close(1000, 'Component unmounted')
          },
          { once: true }
        )
      }
    }
  }, [])

  useEffect(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    wsDebug('Sending query to websocket', {
      query,
      queryLength: query.length,
    })
    socketRef.current.send(query)
  }, [query, connected])

  return (
    <main className="app-shell">
      <section className="content-wrap">
        <h1>Real-Time Post Search</h1>
        <p className="subtitle">Search updates are powered by WebSocket on every keystroke.</p>

        <SearchBar value={query} onChange={setQuery} connected={connected} />

        {error ? <p className="error-text">{error}</p> : null}

        <PostList posts={posts} loading={loading} />
      </section>
    </main>
  )
}

export default App
