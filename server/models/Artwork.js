const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  alt: { type: String, default: '' },
}, { _id: false });

const artworkSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, trim: true, lowercase: true, index: true },
  price: { type: String, default: '', trim: true, maxlength: 40 },
  size: { type: String, default: '', trim: true, maxlength: 120 },
  dimensions: { type: String, default: '', trim: true, maxlength: 120 },
  medium: { type: String, default: 'Acrylic on canvas', trim: true, maxlength: 120 },
  category: { type: String, default: 'Other', trim: true, maxlength: 80 },
  availability: { type: String, enum: ['Available', 'Sold Out', 'Reserved', 'Commission Only'], default: 'Available' },
  story: { type: String, default: '', maxlength: 5000 },
  finish: { type: String, default: '', trim: true, maxlength: 120 },
  framing: { type: String, default: '', trim: true, maxlength: 120 },
  tags: [{ type: String, trim: true, maxlength: 40 }],
  images: { type: [imageSchema], validate: v => Array.isArray(v) && v.length > 0 },
  featured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 1000, min: 0 },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

artworkSchema.index({ isPublished: 1, sortOrder: 1, createdAt: -1 });
module.exports = mongoose.model('Artwork', artworkSchema);
