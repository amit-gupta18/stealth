import { useEffect, useRef, useState } from 'react'
import SearchBar from './components/SearchBar'
import PostList from './components/PostList'
import { fetchAndStorePosts, getPosts } from './services/api'
import { createSearchSocket } from './services/socket'

const ENABLE_WS_DEBUG = import.meta.env.VITE_WS_DEBUG === 'true' || import.meta.env.DEV
const POSTS_PER_PAGE = 8

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
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [currentPage, setCurrentPage] = useState(1)
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const shouldReconnectRef = useRef(true)

  function clearReconnectTimer() {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  function connectSocket() {
    clearReconnectTimer()

    const socket = createSearchSocket({
      onOpen: () => {
        if (socketRef.current !== socket) {
          return
        }

        setConnectionStatus('connected')
      },
      onClose: () => {
        if (socketRef.current !== socket) {
          return
        }

        setConnectionStatus('reconnecting')

        if (!shouldReconnectRef.current) {
          return
        }

        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (shouldReconnectRef.current) {
            connectSocket()
          }
        }, 1000)
      },
      onError: (socketError) => {
        if (socketRef.current !== socket) {
          return
        }

        setConnectionStatus('reconnecting')
        setError(socketError.message)
      },
      onResults: (results) => {
        if (socketRef.current !== socket) {
          return
        }

        setPosts(results)
        setCurrentPage(1)
      },
    })

    socketRef.current = socket
    setConnectionStatus(socket.readyState === WebSocket.OPEN ? 'connected' : 'connecting')
    return socket
  }

  useEffect(() => {
    async function loadPosts() {
      try {
        setLoading(true)
        setError('')

        await fetchAndStorePosts()
        const allPosts = await getPosts()
        setPosts(allPosts)
        setCurrentPage(1)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  useEffect(() => {
    shouldReconnectRef.current = true
    connectSocket()

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return
      }

      const socket = socketRef.current

      if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
        connectSocket()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      shouldReconnectRef.current = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearReconnectTimer()

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
    setCurrentPage(1)
  }, [query])

  useEffect(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    const timer = window.setTimeout(() => {
      wsDebug('Sending query to websocket', {
        query,
        queryLength: query.length,
      })
      socketRef.current.send(query)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query, connectionStatus])

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * POSTS_PER_PAGE
  const visiblePosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE)
  const showingStart = posts.length ? startIndex + 1 : 0
  const showingEnd = Math.min(startIndex + POSTS_PER_PAGE, posts.length)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(219,234,254,0.9),transparent_55%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Real-Time Post Search
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Search updates are powered by WebSocket on every keystroke.
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
              connectionStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : connectionStatus === 'reconnecting'
                    ? 'bg-amber-50 text-amber-700 ring-amber-200'
                    : 'bg-rose-50 text-rose-700 ring-rose-200'
            }`}
          >
              {connectionStatus === 'connected'
                ? 'WebSocket connected'
                : connectionStatus === 'reconnecting'
                  ? 'WebSocket reconnecting'
                  : 'WebSocket disconnected'}
          </span>
        </div>

          <SearchBar value={query} onChange={setQuery} connected={connectionStatus === 'connected'} />

        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {!loading && posts.length > 0 ? (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500" aria-live="polite">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Showing {showingStart}-{showingEnd} of {posts.length} posts
            </span>
          </div>
        ) : null}

        <PostList posts={visiblePosts} loading={loading} query={query} />

        {!loading && posts.length > POSTS_PER_PAGE ? (
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            aria-label="Pagination"
          >
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
            >
              Previous
            </button>

            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-medium transition ${
                    page === safeCurrentPage
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                  onClick={() => setCurrentPage(page)}
                  aria-current={page === safeCurrentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default App
