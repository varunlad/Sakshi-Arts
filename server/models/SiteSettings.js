const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'public-site-stats' },
  followersValue: { type: Number, default: 55, min: 0 },
  followersSuffix: { type: String, default: 'K+', maxlength: 8 },
  viewsValue: { type: Number, default: 23.25, min: 0 },
  viewsSuffix: { type: String, default: 'M+', maxlength: 8 },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
