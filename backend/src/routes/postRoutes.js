const express = require('express');
const {
  fetchAndStorePosts,
  getAllPosts,
  getPostById,
} = require('../controllers/postController');

const router = express.Router();

router.get('/fetch', fetchAndStorePosts);
router.get('/posts', getAllPosts);
router.get('/posts/:id', getPostById);

module.exports = router;
