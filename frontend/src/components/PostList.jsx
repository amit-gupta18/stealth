function PostList({ posts, loading }) {
  if (loading) {
    return <p className="info-text">Loading posts...</p>;
  }

  if (!posts.length) {
    return <p className="info-text">No posts found.</p>;
  }

  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.id} className="post-card">
          <h3>{post.title}</h3>
          <p>{post.body}</p>
        </li>
      ))}
    </ul>
  );
}

export default PostList;
