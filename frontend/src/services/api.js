const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is required. Add it to your frontend environment variables.');
}

export async function getPosts() {
  const response = await fetch(`${API_BASE_URL}/posts`);

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  return response.json();
}

export async function fetchAndStorePosts() {
  const response = await fetch(`${API_BASE_URL}/fetch`);

  if (!response.ok) {
    throw new Error('Failed to fetch and store posts');
  }

  return response.json();
}

export async function getPostById(id) {
  const response = await fetch(`${API_BASE_URL}/posts/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Post not found');
    }

    throw new Error('Failed to fetch post by id');
  }

  return response.json();
}

export { API_BASE_URL };
