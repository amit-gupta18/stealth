const Post = require('../models/Post');

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

module.exports = {
  fetchAndStorePosts,
  getAllPosts,
  getPostById,
};
