const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  eventData: { type: Object },
  timestamp: { type: Date, default: Date.now },
  userAgent: { type: String }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
