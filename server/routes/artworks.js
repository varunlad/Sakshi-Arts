const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v2: cloudinary } = require('cloudinary');
const Artwork = require('../models/Artwork');
const SiteSettings = require('../models/SiteSettings');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|avif)$/i.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG, WEBP, and AVIF images are allowed.'));
  },
});

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in to manage artwork.' });
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(503).json({ error: 'JWT_SECRET is not configured on the server.' });
    const payload = jwt.verify(token, secret);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
    req.admin = payload;
    next();
  } catch (_error) {
    return res.status(401).json({ error: 'Your session expired. Please sign in again.' });
  }
}

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const error = new Error('Image storage is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to the backend environment.');
    error.status = 503;
    throw error;
  }
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
}

function uploadBuffer(file) {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: 'sakshi-art/artworks',
      resource_type: 'image',
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    }, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, publicId: result.public_id, alt: file.originalname.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') });
    });
    stream.end(file.buffer);
  });
}

function safeArtworkPayload(body) {
  const data = typeof body.artwork === 'string' ? JSON.parse(body.artwork) : (body.artwork || body);
  const title = String(data.title || '').trim();
  if (!title) throw Object.assign(new Error('Artwork title is required.'), { status: 400 });
  const sortOrder = Number(data.sortOrder ?? 1000);
  if (!Number.isFinite(sortOrder) || sortOrder < 0) throw Object.assign(new Error('Display rank must be a non-negative number.'), { status: 400 });
  const tags = Array.isArray(data.tags) ? data.tags : String(data.tags || '').split(',');
  return {
    title,
    slug: String(data.slug || title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).slice(0, 140),
    price: String(data.price || '').trim(),
    size: String(data.size || '').trim(),
    dimensions: String(data.dimensions || '').trim(),
    medium: String(data.medium || 'Acrylic on canvas').trim(),
    category: String(data.category || 'Other').trim(),
    availability: ['Available', 'Sold Out', 'Reserved', 'Commission Only'].includes(data.availability) ? data.availability : 'Available',
    story: String(data.story || '').trim(),
    finish: String(data.finish || '').trim(),
    framing: String(data.framing || '').trim(),
    tags: tags.map(tag => String(tag).trim()).filter(Boolean).slice(0, 30),
    featured: data.featured === true || data.featured === 'true',
    sortOrder,
    isPublished: data.isPublished !== false && data.isPublished !== 'false',
  };
}

function parseExistingImages(body) {
  try {
    const raw = body.existingImages;
    if (!raw) return [];
    const images = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(images) ? images.filter(image => image && typeof image.url === 'string' && image.url.startsWith('https://')) : [];
  } catch (_error) {
    throw Object.assign(new Error('Existing image data is invalid.'), { status: 400 });
  }
}

// Public: gallery reads published artworks in the artist-defined order.
router.get('/artworks', async (_req, res) => {
  try {
    const artworks = await Artwork.find({ isPublished: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
    res.json(artworks.map(item => ({ ...item, id: String(item._id), img: item.images?.[0]?.url || '', price: item.price || '' })));
  } catch (error) {
    console.error('Public artwork list failed:', error.message);
    res.status(500).json({ error: 'Unable to load artwork at this time.' });
  }
});

// Public: titles/slugs only, so unpublished legacy paintings are not accidentally shown from the bundled fallback.
router.get('/artwork-keys', async (_req, res) => {
  try {
    const items = await Artwork.find({}, { title: 1, slug: 1 }).lean();
    res.json(items.map(item => ({ title: item.title, slug: item.slug || '' })));
  } catch (error) {
    console.error('Artwork keys read failed:', error.message);
    res.status(500).json({ error: 'Unable to load artwork catalogue.' });
  }
});

// Public: editable social stats used by the homepage counters.
router.get('/site-stats', async (_req, res) => {
  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'public-site-stats' },
      { $setOnInsert: { key: 'public-site-stats', followersValue: 55, followersSuffix: 'K+', viewsValue: 23.25, viewsSuffix: 'M+' } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ followersValue: settings.followersValue, followersSuffix: settings.followersSuffix, viewsValue: settings.viewsValue, viewsSuffix: settings.viewsSuffix });
  } catch (error) {
    console.error('Site stats read failed:', error.message);
    res.status(500).json({ error: 'Unable to load site statistics.' });
  }
});

// Login is intentionally separate from all admin operations.
router.post('/admin/login', async (req, res) => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;
  if (!username || !password || !jwtSecret) {
    return res.status(503).json({ error: 'Admin login is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD, and JWT_SECRET on the backend.' });
  }
  const submittedUsername = req.body?.username;
  const submittedPassword = req.body?.password;
  if (!constantTimeEqual(submittedUsername, username) || !constantTimeEqual(submittedPassword, password)) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }
  const token = jwt.sign({ role: 'admin', username }, jwtSecret, { expiresIn: '8h', issuer: 'sakshi-art-admin' });
  res.json({ token, expiresIn: 28800 });
});

router.get('/admin/artworks', requireAdmin, async (_req, res) => {
  try {
    const items = await Artwork.find({}).sort({ sortOrder: 1, createdAt: -1 }).lean();
    res.json(items.map(item => ({ ...item, id: String(item._id), img: item.images?.[0]?.url || '' })));
  } catch (error) { res.status(500).json({ error: 'Unable to load artwork management list.' }); }
});

router.post('/admin/artworks', requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const payload = safeArtworkPayload(req.body);
    const images = await Promise.all((req.files || []).map(uploadBuffer));
    if (!images.length) return res.status(400).json({ error: 'Upload at least one artwork image.' });
    const artwork = await Artwork.create({ ...payload, images });
    res.status(201).json({ ...artwork.toObject(), id: String(artwork._id), img: artwork.images[0].url });
  } catch (error) {
    console.error('Artwork creation failed:', error.message);
    res.status(error.status || 500).json({ error: error.message || 'Could not save artwork.' });
  }
});

router.put('/admin/artworks/:id', requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const payload = safeArtworkPayload(req.body);
    const existingImages = parseExistingImages(req.body);
    const uploadedImages = await Promise.all((req.files || []).map(uploadBuffer));
    const images = [...existingImages, ...uploadedImages];
    if (!images.length) return res.status(400).json({ error: 'Keep at least one image or upload a replacement.' });
    const artwork = await Artwork.findByIdAndUpdate(req.params.id, { ...payload, images }, { new: true, runValidators: true });
    if (!artwork) return res.status(404).json({ error: 'Artwork not found.' });
    res.json({ ...artwork.toObject(), id: String(artwork._id), img: artwork.images[0].url });
  } catch (error) {
    console.error('Artwork update failed:', error.message);
    res.status(error.status || 500).json({ error: error.message || 'Could not update artwork.' });
  }
});

router.delete('/admin/artworks/:id', requireAdmin, async (req, res) => {
  try {
    const artwork = await Artwork.findByIdAndDelete(req.params.id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found.' });
    // Cloudinary assets are left in place intentionally; remove them from the Cloudinary console if no longer needed.
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Could not delete artwork.' }); }
});

router.put('/admin/site-stats', requireAdmin, async (req, res) => {
  try {
    const numberOrThrow = (value, label) => {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > 1000000000000) throw Object.assign(new Error(`${label} must be a valid non-negative number.`), { status: 400 });
      return number;
    };
    const followersValue = numberOrThrow(req.body.followersValue, 'Followers');
    const viewsValue = numberOrThrow(req.body.viewsValue, 'Views');
    const followersSuffix = String(req.body.followersSuffix ?? '').slice(0, 8);
    const viewsSuffix = String(req.body.viewsSuffix ?? '').slice(0, 8);
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'public-site-stats' },
      { $set: { followersValue, followersSuffix, viewsValue, viewsSuffix } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ followersValue: settings.followersValue, followersSuffix: settings.followersSuffix, viewsValue: settings.viewsValue, viewsSuffix: settings.viewsSuffix });
  } catch (error) { res.status(error.status || 500).json({ error: error.message || 'Could not update site statistics.' }); }
});

router.use((error, _req, res, _next) => {
  const status = error instanceof multer.MulterError ? 400 : (error.status || 400);
  res.status(status).json({ error: error.message || 'Invalid upload request.' });
});

module.exports = router;
