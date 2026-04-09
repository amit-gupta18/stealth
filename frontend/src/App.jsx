import { useEffect, useRef, useState } from 'react'
import SearchBar from './components/SearchBar'
import PostList from './components/PostList'
import { fetchAndStorePosts, getPosts } from './services/api'
import { createSearchSocket } from './services/socket'
import './App.css'

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
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return
    }

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
