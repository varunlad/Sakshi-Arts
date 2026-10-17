const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Analytics = require('./models/Analytics');
const Lead = require('./models/Lead');

const app = express();
app.use(cors());
app.use(express.json());

const DB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/art_portfolio';

mongoose.connect(DB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB connection error: Ensure your IP is whitelisted in Atlas!');
    console.error(err.message);
  });

// Sends the notification email through Resend's HTTPS API.
// (Render blocks outbound SMTP ports, so Nodemailer/Gmail SMTP cannot work there.)
async function sendLeadEmail({ name, email, message }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set - skipping email notification');
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'Portfolio <onboarding@resend.dev>',
        to: [process.env.EMAIL_USER],
        reply_to: email,
        subject: `🎨 New Art Commission Request from ${name}`,
        text: `You have a new message from your portfolio website!

Name: ${name}
Email: ${email}

Message:
${message}`
      })
    });

    if (!res.ok) {
      console.error('Resend error:', res.status, await res.text());
    } else {
      console.log('📧 Lead email sent');
    }
  } finally {
    clearTimeout(timer);
  }
}

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
// ROUTE 2: Capture Personal Leads/Inquiries + Email Alert
// =====================================
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // 1. Save to Database
    const newLead = new Lead({ name, email, message });
    await newLead.save();

    // 2. Email the artist (a mail failure must not fail the request)
    try {
      await sendLeadEmail({ name, email, message });
    } catch (mailErr) {
      console.error('Email failed (lead was still saved):', mailErr.message);
    }

    res.status(200).json({ success: true, message: 'Lead captured successfully' });
  } catch (error) {
    console.error('Submission Error:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

app.use('/api', require('./routes/artworks'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (resend-mail build)`);
});