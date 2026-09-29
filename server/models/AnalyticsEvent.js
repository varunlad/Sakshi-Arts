const mongoose = require('mongoose');
const analyticsEventSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  sessionId: { type: String, required: true },
  paintingId: { type: String, default: null },
  page: { type: String, default: '/' },
  
  // Advanced non-PII visitor data
  deviceType: { type: String, default: 'Unknown' },
  screenRes: { type: String, default: 'Unknown' },
  language: { type: String, default: 'Unknown' },
  referrer: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  
  meta: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
