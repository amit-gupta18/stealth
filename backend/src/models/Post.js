const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true },
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

postSchema.index({ title: 'text' });

module.exports = mongoose.model('Post', postSchema);
