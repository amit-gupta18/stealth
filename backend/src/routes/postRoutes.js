const express = require('express');
const {
  getExternalPosts,
  fetchAndStorePosts,
  getAllPosts,
  getPostById,
  savePost,
} = require('../controllers/postController');

const router = express.Router();

router.get('/fetch', fetchAndStorePosts);
router.get('/external-posts', getExternalPosts);
router.get('/posts', getAllPosts);
router.get('/posts/:id', getPostById);
router.post('/posts/save', savePost);

module.exports = router;
