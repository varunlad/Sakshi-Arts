const express = require('express');
const router = express.Router();
const AnalyticsEvent = require('../models/AnalyticsEvent');

// Track anonymous interactions with advanced visitor data
router.post('/analytics/track', async (req, res) => {
  try {
    const { eventType, sessionId, paintingId, page, meta, screenRes, language, referrer } = req.body;
    if (!eventType || !sessionId) return res.status(400).json({ error: 'Missing data' });
    
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = /Mobile|Android|iP(hone|od|ad)/i.test(userAgent) ? 'Mobile' : 'Desktop';
    
    const event = new AnalyticsEvent({ 
      eventType, sessionId, paintingId, page, meta, 
      screenRes, language, referrer, userAgent, deviceType
    });
    
    await event.save();
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Failed to record event' });
  }
});

// Analytics Summary Endpoint
router.get('/analytics/summary', async (req, res) => {
  try {
    const visitors = (await AnalyticsEvent.distinct('sessionId')).length;
    const pageViews = await AnalyticsEvent.countDocuments({ eventType: 'page_view' });
    const mobileUsers = await AnalyticsEvent.countDocuments({ eventType: 'page_view', deviceType: 'Mobile' });
    const desktopUsers = await AnalyticsEvent.countDocuments({ eventType: 'page_view', deviceType: 'Desktop' });
    
    res.json({ visitors, pageViews, mobileUsers, desktopUsers });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
