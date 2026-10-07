#!/usr/bin/env python3
import os

def main():
    print("=" * 60)
    print("✨ Updating server.js with the correct email configuration...")
    print("=" * 60)

    # The exact content from the working server.js file
    server_content = """const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

// ✨ SMART FIX: Only force IPv4 when running on Render!
// This prevents the 'ENETUNREACH' error in production but 
// leaves your local computer's network untouched so it doesn't break locally.
if (process.env.RENDER) {
  require('dns').setDefaultResultOrder('ipv4first');
}

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

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const newLead = new Lead({ name, email, message });
    await newLead.save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // ✨ SMART FIX: Reverted to the standard, reliable Gmail service setting
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, 
        replyTo: email,             
        subject: `🎨 New Art Commission Request from ${name}`,
        text: `You have a new message from your portfolio website!\\n\\nName: ${name}\\nEmail: ${email}\\n\\nMessage:\\n${message}`
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ success: true, message: 'Lead captured and email sent successfully' });
  } catch (error) {
    console.error('Submission Error:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});
"""

    file_path = "server/server.js"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(server_content)
        
    print(f"  [+] Overwrote: {file_path}")
    print("\n✅ Success! Stop your server (Ctrl + C) and restart it (npm run dev) to apply the changes.")

if __name__ == "__main__":
    main()