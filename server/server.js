const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Analytics = require('./models/Analytics');
const Lead = require('./models/Lead');

const app = express();
app.use(cors());
app.use(express.json());

// ✨ UPDATED: Now checks for both MONGODB_URI (your .env) and MONGO_URI
const DB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/art_portfolio';

mongoose.connect(DB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB connection error: Ensure your IP is whitelisted in Atlas!');
    console.error(err.message);
  });

// =====================================
// ROUTE 1: Capture Behavioral Analytics
// =====================================
app.post('/api/analytics', async (req, res) => {
  try {
    const { eventName, eventData, userAgent } = req.body;
    const newEvent = new Analytics({ eventName, eventData, userAgent });
    await newEvent.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log analytics' });
  }
});

// =====================================
// ROUTE 2: Capture Personal Leads/Inquiries
// =====================================
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const newLead = new Lead({ name, email, message });
    await newLead.save();

    res.status(200).json({ success: true, message: 'Lead captured successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});
