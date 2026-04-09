import { useEffect, useRef, useState } from 'react'
import SearchBar from './components/SearchBar'
import PostList from './components/PostList'
import { getExternalPosts, getPostById, getPosts, savePost } from './services/api'
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
  const [externalPosts, setExternalPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [currentPage, setCurrentPage] = useState(1)
  const [singlePostId, setSinglePostId] = useState('')
  const [singlePost, setSinglePost] = useState(null)
  const [savingPostIds, setSavingPostIds] = useState(new Set())
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

        const [allPosts, sourcePosts] = await Promise.all([getPosts(), getExternalPosts()])
        setPosts(allPosts)
        setExternalPosts(sourcePosts)
        setCurrentPage(1)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  async function refreshSavedPosts() {
    try {
      setLoading(true)
      setError('')
      const allPosts = await getPosts()
      setPosts(allPosts)
      setCurrentPage(1)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  async function refreshSourcePosts() {
    try {
      setLoading(true)
      setError('')
      const sourcePosts = await getExternalPosts()
      setExternalPosts(sourcePosts)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveSinglePost(post) {
    try {
      setError('')
      setSavingPostIds((previous) => new Set(previous).add(post.id))
      await savePost(post)
      await refreshSavedPosts()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSavingPostIds((previous) => {
        const next = new Set(previous)
        next.delete(post.id)
        return next
      })
    }
  }

  async function loadSingleSavedPost() {
    const id = Number(singlePostId)

    if (!Number.isInteger(id) || id <= 0) {
      setError('Enter a valid numeric post ID')
      setSinglePost(null)
      return
    }

    try {
      setError('')
      const post = await getPostById(id)
      setSinglePost(post)
    } catch (loadError) {
      setSinglePost(null)
      setError(loadError.message)
    }
  }

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
  const savedPostIds = new Set(posts.map((post) => post.id))

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

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="#available-posts"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Save Post
            </a>
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
        </div>

          <SearchBar value={query} onChange={setQuery} connected={connectionStatus === 'connected'} />

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">Find Saved Post by ID.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                  onClick={refreshSavedPosts}
                >
                  Get All Saved Posts
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="number"
                min="1"
                value={singlePostId}
                onChange={(event) => setSinglePostId(event.target.value)}
                placeholder="Enter post ID"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 sm:max-w-52"
              />
              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                onClick={loadSingleSavedPost}
              >
                Get Single Post
              </button>
            </div>

            {singlePost ? (
              <article className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Post #{singlePost.id}</p>
                <h3 className="mt-1 text-base font-semibold text-slate-900">{singlePost.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{singlePost.body}</p>
              </article>
            ) : null}
          </section>

          <section id="available-posts" className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Available Posts </h2>
                <p className="text-sm text-slate-600">
                  Click Save Post on any item to save the post .
                </p>
              </div>

              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                onClick={refreshSourcePosts}
              >
                Refresh Source Posts
              </button>
            </div>

            <PostList
              posts={externalPosts}
              loading={loading && !externalPosts.length}
              query={query}
              onSavePost={saveSinglePost}
              savingPostIds={savingPostIds}
              savedPostIds={savedPostIds}
            />
          </section>

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
