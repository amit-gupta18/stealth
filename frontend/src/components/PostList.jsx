function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text, query) {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return text
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'ig'))

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-1 text-slate-950">
          {part}
        </mark>
      )
    }

    return part
  })
}

function PostList({ posts, loading, query, onSavePost, savingPostIds = new Set(), savedPostIds = new Set() }) {
  if (loading) {
    return (
      <div className="mt-6 grid gap-4" aria-busy="true" aria-live="polite">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="mb-4 h-5 w-2/3 animate-pulse rounded-full bg-slate-200" />
            <div className="mb-3 h-3 w-full animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-200" />
          </article>
        ))}
      </div>
    )
  }

  if (!posts.length) {
    return <p className="mt-8 text-sm text-slate-500">No posts found.</p>
  }

  return (
    <ul className="mt-6 grid gap-4">
      {posts.map((post) => (
        <li key={post.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
              {highlightText(post.title, query)}
            </h3>

            {onSavePost ? (
              <button
                type="button"
                onClick={() => onSavePost(post)}
                disabled={savingPostIds.has(post.id) || savedPostIds.has(post.id)}
                className="shrink-0 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:border-slate-500 disabled:bg-slate-500"
              >
                {savedPostIds.has(post.id)
                  ? 'Saved'
                  : savingPostIds.has(post.id)
                    ? 'Saving...'
                    : 'Save Post'}
              </button>
            ) : null}
          </div>

          <p className="mt-2 leading-7 text-slate-600">{highlightText(post.body, query)}</p>
        </li>
      ))}
    </ul>
  )
}

export default PostList;
