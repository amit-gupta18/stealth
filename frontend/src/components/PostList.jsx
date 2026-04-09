function PostList({ posts, loading }) {
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
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">{post.title}</h3>
          <p className="mt-2 leading-7 text-slate-600">{post.body}</p>
        </li>
      ))}
    </ul>
  )
}

export default PostList;
