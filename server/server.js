const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sakshi_art';

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✨ Connected to MongoDB.');
    app.listen(PORT, () => console.log(`🌸 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('⚠ MongoDB error:', err.message);
    console.log('ℹ️ Check your MONGODB_URI in server/.env if you need a username/password.');
    app.listen(PORT, () => console.log(`🌸 Server running on port ${PORT} (DB offline)`));
  });
