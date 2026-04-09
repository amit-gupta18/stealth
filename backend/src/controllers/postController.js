const Post = require('../models/Post');

async function getExternalPosts(_req, res) {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch external posts' });
    }

    const posts = await response.json();
    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function fetchAndStorePosts(_req, res) {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch external posts' });
    }

    const posts = await response.json();

    let insertedCount = 0;

    for (const post of posts) {
      const result = await Post.updateOne(
        { id: post.id },
        {
          $setOnInsert: {
            userId: post.userId,
            id: post.id,
            title: post.title,
            body: post.body,
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        insertedCount += 1;
      }
    }

    return res.status(200).json({
      message: 'Posts fetched and stored successfully',
      totalFetched: posts.length,
      insertedCount,
      skippedDuplicates: posts.length - insertedCount,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getAllPosts(_req, res) {
  try {
    const posts = await Post.find().sort({ id: 1 });
    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getPostById(req, res) {
  try {
    const postId = Number(req.params.id);
    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function savePost(req, res) {
  try {
    const { id, userId, title, body } = req.body;

    if (!id || !title || !body) {
      return res.status(400).json({ error: 'id, title and body are required' });
    }

    const result = await Post.updateOne(
      { id: Number(id) },
      {
        $setOnInsert: {
          userId: Number(userId) || 0,
          id: Number(id),
          title,
          body,
        },
      },
      { upsert: true }
    );

    const post = await Post.findOne({ id: Number(id) });

    return res.status(200).json({
      message: result.upsertedCount > 0 ? 'Post saved' : 'Post already saved',
      inserted: result.upsertedCount > 0,
      post,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getExternalPosts,
  fetchAndStorePosts,
  getAllPosts,
  getPostById,
  savePost,
};
