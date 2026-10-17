#!/usr/bin/env python3
"""Add a protected /uploads artwork manager to the existing Sakshi Art project.

Run from the extracted project root:
    python add_artwork_uploads.py
or:
    python add_artwork_uploads.py --project-dir "/path/to/Sakshi Art"

The script creates backups before changing existing files. It does not install npm
packages or modify any environment secrets. See the printed setup instructions.
"""
from __future__ import annotations
import argparse
import json
import re
import shutil
import sys
from pathlib import Path


def find_root(path: Path) -> Path:
    candidates = [path, path / "Sakshi Art"]
    for candidate in candidates:
        if (candidate / "server" / "server.js").is_file() and (candidate / "client" / "src" / "App.jsx").is_file():
            return candidate.resolve()
    raise FileNotFoundError(
        "Could not find project root. Pass --project-dir pointing to the folder containing client/ and server/."
    )


def backup(path: Path, root: Path, backup_root: Path) -> None:
    if path.exists():
        target = backup_root / path.relative_to(root)
        if target.exists():
            return
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def patch_server(server_path: Path) -> None:
    source = server_path.read_text(encoding="utf-8")
    mount = "app.use('/api', require('./routes/artworks'));"
    if mount not in source:
        marker = "const PORT = process.env.PORT || 5001;"
        if marker not in source:
            raise RuntimeError("Could not find PORT marker in server/server.js; no server patch was applied.")
        source = source.replace(marker, mount + "\n\n" + marker, 1)
    server_path.write_text(source, encoding="utf-8")


def update_package(path: Path, dependencies: dict, scripts: dict | None = None) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    data.setdefault("dependencies", {})
    for name, version in dependencies.items():
        data["dependencies"][name] = version
    if scripts:
        data.setdefault("scripts", {}).update(scripts)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Add the Sakshi Art /uploads admin manager.")
    parser.add_argument("--project-dir", default=".", help="Project root or parent containing 'Sakshi Art'.")
    args = parser.parse_args()
    root = find_root(Path(args.project_dir).expanduser())
    client = root / "client"
    server = root / "server"
    backup_root = root / ".pre-uploads-backup"

    existing = [
        server / "server.js",
        server / "package.json",
        client / "package.json",
        client / "src" / "main.jsx",
        client / "src" / "components" / "Gallery.jsx",
        client / "src" / "components" / "Hero.jsx",
        client / "src" / "App.jsx",
        client / "src" / "index.css",
    ]
    for path in existing:
        backup(path, root, backup_root)

    # ------------------------------- Backend -------------------------------
    write_text(server / "models" / "Artwork.js", r'''const mongoose = require('mongoose');

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
''')

    write_text(server / "models" / "SiteSettings.js", r'''const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'public-site-stats' },
  followersValue: { type: Number, default: 55, min: 0 },
  followersSuffix: { type: String, default: 'K+', maxlength: 8 },
  viewsValue: { type: Number, default: 23.25, min: 0 },
  viewsSuffix: { type: String, default: 'M+', maxlength: 8 },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
''')

    write_text(server / "routes" / "artworks.js", r'''const express = require('express');
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
''')

    patch_server(server / "server.js")
    update_package(server / "package.json", {
        "cloudinary": "^2.5.1",
        "jsonwebtoken": "^9.0.2",
        "multer": "^1.4.5-lts.1",
    }, {"start": "node server.js"})

    # ------------------------------- Frontend ------------------------------
    write_text(client / "src" / "api.js", r'''const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'https://sakshi-arts-backend.onrender.com');

export function apiUrl(path) {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
''')

    write_text(client / "src" / "components" / "ArtworkCarousel.jsx", r'''import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function getImages(artwork) {
  const source = Array.isArray(artwork?.images) ? artwork.images : [];
  const images = source.map((item) => typeof item === 'string' ? { url: item, alt: artwork?.title || 'Artwork' } : item)
    .filter((item) => item?.url);
  if (!images.length && artwork?.img) images.push({ url: artwork.img, alt: artwork.title || 'Artwork' });
  return images;
}

export default function ArtworkCarousel({ artwork, className = '' }) {
  const images = getImages(artwork);
  if (!images.length) return <div className={`artwork-image-empty ${className}`}>No image available</div>;
  if (images.length === 1) {
    return <img className={`artwork-carousel-single ${className}`} src={images[0].url} alt={images[0].alt || artwork.title} loading="lazy" draggable={false} />;
  }
  return (
    <div className={`artwork-carousel ${className}`} aria-label={`${artwork.title} image gallery`}>
      <Swiper modules={[Navigation, Pagination, A11y]} navigation pagination={{ clickable: true }} spaceBetween={12} slidesPerView={1} loop={images.length > 2}>
        {images.map((image, index) => (
          <SwiperSlide key={`${image.url}-${index}`}>
            <img src={image.url} alt={image.alt || `${artwork.title}, image ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} draggable={false} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
''')

    write_text(client / "src" / "components" / "Gallery.jsx", r'''import React, { useEffect, useMemo, useState } from 'react';
import { paintings as legacyPaintings } from '../GalleryData';
import { trackEvent } from '../analytics';
import { apiUrl } from '../api';
import { paintings as legacyPaintings } from '../GalleryData';
import ShareButton from './ShareButton';
import ArtworkCarousel from './ArtworkCarousel';

function normalizeArtwork(item) {
  const images = Array.isArray(item.images) ? item.images : (item.img ? [{ url: item.img, alt: item.title }] : []);
  return { ...item, id: item.id ?? item._id, images, img: item.img || images[0]?.url || '' };
}

export default function Gallery({ setModalArt, smoothScrollTo }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [databasePaintings, setDatabasePaintings] = useState([]);
  const [managedKeys, setManagedKeys] = useState([]);

  useEffect(() => {
    const handleResize = () => setItemsPerPage(window.innerWidth > 768 ? 6 : 4);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([fetch(apiUrl('/api/artworks')), fetch(apiUrl('/api/artwork-keys'))])
      .then(async ([artworkResponse, keysResponse]) => {
        if (!artworkResponse.ok) throw new Error('Artwork API unavailable');
        const items = await artworkResponse.json();
        const keys = keysResponse.ok ? await keysResponse.json() : [];
        if (active && Array.isArray(items)) setDatabasePaintings(items.map(normalizeArtwork));
        if (active && Array.isArray(keys)) setManagedKeys(keys);
      })
      .catch(() => { /* Keep the bundled GalleryData gallery available if the API is offline. */ });
    return () => { active = false; };
  }, []);

  // Keep the current hard-coded gallery visible while placing DB-managed artworks first.
  const paintings = useMemo(() => {
    const dbItems = databasePaintings.filter((item) => item.isPublished !== false);
    const dbIds = new Set(dbItems.map((item) => String(item.id)));
    const dbSlugs = new Set(dbItems.map((item) => String(item.slug || '').toLowerCase()).filter(Boolean));
    const dbTitles = new Set([...dbItems.map((item) => item.title), ...managedKeys.map((item) => item.title)].map((title) => String(title || '').trim().toLowerCase()).filter(Boolean));
    const managedSlugs = new Set(managedKeys.map((item) => String(item.slug || '').toLowerCase()).filter(Boolean));
    const legacy = legacyPaintings.filter((item) => !dbIds.has(String(item.id)) && !dbSlugs.has(String(item.slug || '').toLowerCase()) && !managedSlugs.has(String(item.slug || '').toLowerCase()) && !dbTitles.has(String(item.title || '').trim().toLowerCase()));
    return [...dbItems, ...legacy.map(normalizeArtwork)];
  }, [databasePaintings, managedKeys]);

  const totalPages = Math.ceil(paintings.length / itemsPerPage);
  useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages); }, [totalPages, currentPage]);
  const paginatedPaintings = paintings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else if (currentPage <= 4) pages.push(1, 2, 3, 4, 5, '...', totalPages);
    else if (currentPage >= totalPages - 3) pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    else pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    return pages;
  };

  return (
    <section id="gallery" className="section container text-center">
      <h2 className="font-serif" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Original Paintings</h2>
      <div className="gallery-grid">
        {paginatedPaintings.map((p) => (
          <div key={p.id} className="art-card" onClick={() => { setModalArt(p); trackEvent('painting_view', { paintingTitle: p.title }); }}>
            <div className="art-card-image-wrap"><img src={p.img || p.images?.[0]?.url} alt={p.title} loading="lazy" draggable={false} onContextMenu={(e) => e.preventDefault()} /></div>
            <ShareButton painting={p} variant="card" />
            <div className="art-info">
              <h3 className="font-serif">{p.title}</h3>
              <div className="price-row">
                <p className="font-serif price-text">{p.price ? <>{p.price} <span className="price-only-text" style={{ color: 'var(--ink)' }}>only</span></> : 'DM for Price'}</p>
                <span className="availability-badge" style={{ background: p.availability === 'Sold Out' ? 'var(--sold-bg)' : 'var(--success-bg)', color: p.availability === 'Sold Out' ? 'var(--muted)' : 'var(--success-fg)' }}>{p.availability || 'Available'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && <div className="pagination">
        <button className="page-btn" disabled={currentPage === 1} onClick={() => { setCurrentPage((prev) => Math.max(prev - 1, 1)); smoothScrollTo('gallery'); }}>Prev</button>
        {getPageNumbers().map((page, idx) => page === '...' ? <span key={idx} className="page-ellipsis">...</span> : <button key={idx} className={`page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => { setCurrentPage(page); smoothScrollTo('gallery'); }}>{page}</button>)}
        <button className="page-btn" disabled={currentPage === totalPages} onClick={() => { setCurrentPage((prev) => Math.min(prev + 1, totalPages)); smoothScrollTo('gallery'); }}>Next</button>
      </div>}
    </section>
  );
}
''')

    # Hero counters now read from the public settings endpoint, falling back to current values.
    hero_path = client / "src" / "components" / "Hero.jsx"
    hero = hero_path.read_text(encoding="utf-8")
    if "from \"../api\"" not in hero and "from '../api'" not in hero:
        hero = hero.replace('import Hero_Img from "../assets/Images/Hero_Pic.jpeg";', 'import Hero_Img from "../assets/Images/Hero_Pic.jpeg";\nimport { apiUrl } from "../api";')
    hero = hero.replace('export default function Hero({ openIG, openFB, openYT }) {\n  return (', '''export default function Hero({ openIG, openFB, openYT }) {
  const [siteStats, setSiteStats] = useState({ followersValue: 55, followersSuffix: "K+", viewsValue: 23.25, viewsSuffix: "M+" });

  useEffect(() => {
    let active = true;
    fetch(apiUrl("/api/site-stats"))
      .then((response) => { if (!response.ok) throw new Error("Stats unavailable"); return response.json(); })
      .then((stats) => { if (active) setSiteStats((current) => ({ ...current, ...stats })); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (''')
    hero = hero.replace('<AnimatedCounter end={55} suffix="K+" />', '<AnimatedCounter end={Number(siteStats.followersValue)} suffix={siteStats.followersSuffix || ""} />')
    hero = hero.replace('<AnimatedCounter end={23.25} suffix="M+" />', '<AnimatedCounter end={Number(siteStats.viewsValue)} suffix={siteStats.viewsSuffix || ""} />')
    hero_path.write_text(hero, encoding="utf-8")

    # Use a carousel in the artwork details modal. One image renders as a plain image automatically.
    app_path = client / "src" / "App.jsx"
    app = app_path.read_text(encoding="utf-8")
    if 'import ArtworkCarousel from "./components/ArtworkCarousel";' not in app:
        app = app.replace('import CopyButton from "./components/CopyButton";', 'import CopyButton from "./components/CopyButton";\nimport ArtworkCarousel from "./components/ArtworkCarousel";')
    app = app.replace('<img src={modalArt.img} alt={modalArt.title} draggable={false} />', '<ArtworkCarousel artwork={modalArt} className="modal-artwork-carousel" />')
    if 'import { apiUrl } from "./api";' not in app:
        app = app.replace('import { paintings } from "./GalleryData";', 'import { paintings } from "./GalleryData";\nimport { apiUrl } from "./api";')
    shared_effect = r"""  // Open a painting directly when the page is visited via a shared link (?painting=ID)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("painting");
    if (!id) return;
    const legacyArt = paintings.find((p) => String(p.id) === id);
    if (legacyArt) {
      setModalArt(legacyArt);
      trackEvent("shared_link_open", { paintingTitle: legacyArt.title });
      setTimeout(() => smoothScrollTo("gallery"), 100);
      return;
    }
    fetch(apiUrl("/api/artworks"))
      .then((response) => response.ok ? response.json() : [])
      .then((items) => {
        const art = Array.isArray(items) ? items.find((item) => String(item.id || item._id) === id) : null;
        if (art) {
          const images = Array.isArray(art.images) ? art.images : [];
          setModalArt({ ...art, id: art.id || art._id, img: art.img || images[0]?.url || "" });
          trackEvent("shared_link_open", { paintingTitle: art.title });
          setTimeout(() => smoothScrollTo("gallery"), 100);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

"""
    app = re.sub(r"  // Open a painting directly when the page is visited via a shared link \(\?painting=ID\).*?(?=  // Keep the address bar in sync)", shared_effect, app, count=1, flags=re.S)
    app_path.write_text(app, encoding="utf-8")

    # Route /uploads without adding a router dependency; static hosts must provide SPA fallback to index.html.
    write_text(client / "src" / "main.jsx", r'''import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AdminUploads from './components/AdminUploads.jsx';
import './index.css';
import './uploads.css';

const isUploadsRoute = window.location.pathname.replace(/\/+$/, '') === '/uploads';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isUploadsRoute ? <AdminUploads /> : <App />}</React.StrictMode>
);
''')

    write_text(client / "src" / "components" / "AdminUploads.jsx", r'''import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImagePlus, LogOut, Save, Trash2, X, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { apiUrl } from '../api';
import { paintings as legacyPaintings } from '../GalleryData';

const EMPTY_FORM = {
  title: '', slug: '', price: '', size: '', dimensions: '', medium: 'Acrylic on canvas', category: 'Seascape',
  availability: 'Available', story: '', finish: '', framing: '', tags: '', featured: false, sortOrder: 100, isPublished: true,
};
const EMPTY_STATS = { followersValue: 55, followersSuffix: 'K+', viewsValue: 23.25, viewsSuffix: 'M+' };
const moneyNote = 'Use the display price exactly as it should appear, for example ₹1,500 or DM for Price.';

async function request(path, options = {}, token = '') {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(apiUrl(path), { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function Field({ label, children, hint }) {
  return <label className="upload-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function AdminUploads() {
  const [token, setToken] = useState(() => sessionStorage.getItem('sakshiArtAdminToken') || '');
  const [login, setLogin] = useState({ username: '', password: '' });
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('artworks');

  const say = (type, text) => { setNotice({ type, text }); window.setTimeout(() => setNotice({ type: '', text: '' }), 5000); };
  const loadDashboard = useCallback(async (authToken) => {
    setLoading(true);
    try {
      const [artworks, siteStats] = await Promise.all([
        request('/api/admin/artworks', {}, authToken),
        request('/api/site-stats'),
      ]);
      setItems(artworks);
      setStats({ ...EMPTY_STATS, ...siteStats });
    } catch (error) {
      if (/session|sign in|token/i.test(error.message)) { sessionStorage.removeItem('sakshiArtAdminToken'); setToken(''); }
      say('error', error.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (token) loadDashboard(token); }, [token, loadDashboard]);
  useEffect(() => {
    const previews = files.map((file) => URL.createObjectURL(file));
    setFilePreviews(previews);
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const sortedItems = useMemo(() => [...items].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)), [items]);

  const signIn = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      const result = await request('/api/admin/login', { method: 'POST', body: JSON.stringify(login) });
      sessionStorage.setItem('sakshiArtAdminToken', result.token); setToken(result.token); setLogin({ username: '', password: '' });
      say('success', 'Signed in successfully.');
    } catch (error) { say('error', error.message); }
    finally { setBusy(false); }
  };

  const signOut = () => { sessionStorage.removeItem('sakshiArtAdminToken'); setToken(''); setItems([]); resetForm(); };
  const resetForm = () => { setForm({ ...EMPTY_FORM, sortOrder: (items.length + 1) * 10 }); setEditingId(''); setExistingImages([]); setFiles([]); };
  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const startEdit = (item) => {
    setEditingId(item._id || item.id);
    setForm({ ...EMPTY_FORM, ...item, tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''), sortOrder: Number(item.sortOrder ?? 100), isPublished: item.isPublished !== false });
    setExistingImages(Array.isArray(item.images) ? item.images : []);
    setFiles([]); setActiveTab('artworks'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveArtwork = async (event) => {
    event.preventDefault();
    if (!editingId && files.length === 0) return say('error', 'Please choose at least one artwork image.');
    if (existingImages.length + files.length === 0) return say('error', 'Keep at least one image.');
    setBusy(true);
    try {
      const payload = { ...form, tags: String(form.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean), sortOrder: Number(form.sortOrder), featured: Boolean(form.featured), isPublished: Boolean(form.isPublished) };
      const body = new FormData();
      body.append('artwork', JSON.stringify(payload));
      body.append('existingImages', JSON.stringify(existingImages));
      files.forEach((file) => body.append('images', file));
      await request(editingId ? `/api/admin/artworks/${editingId}` : '/api/admin/artworks', { method: editingId ? 'PUT' : 'POST', body }, token);
      say('success', editingId ? 'Artwork updated.' : 'Artwork uploaded and saved.');
      resetForm(); await loadDashboard(token);
    } catch (error) { say('error', error.message); }
    finally { setBusy(false); }
  };

  const importLegacyPaintings = async () => {
    const knownTitles = new Set(items.map((item) => String(item.title || '').trim().toLowerCase()));
    const pending = legacyPaintings.filter((item) => !knownTitles.has(String(item.title || '').trim().toLowerCase()));
    if (!pending.length) return say('success', 'All current GalleryData paintings are already managed in the database.');
    if (!window.confirm(`Import ${pending.length} existing GalleryData paintings into MongoDB and copy their images to Cloudinary? This is intended as a one-time migration.`)) return;
    setBusy(true);
    let imported = 0;
    try {
      for (let index = 0; index < pending.length; index += 1) {
        const item = pending[index];
        const imageResponse = await fetch(item.img);
        if (!imageResponse.ok) throw new Error(`Could not read the existing image for “${item.title}”.`);
        const imageBlob = await imageResponse.blob();
        const extension = (imageBlob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        const imageFile = new File([imageBlob], `${String(item.title || 'artwork').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${extension}`, { type: imageBlob.type || 'image/jpeg' });
        const payload = {
          title: item.title, price: item.price || '', size: item.size || '', dimensions: item.size || '',
          medium: 'Acrylic on canvas', category: 'Original painting', availability: item.availability || 'Available',
          story: item.story || '', finish: '', framing: '', tags: [], featured: false,
          sortOrder: (items.length + index + 1) * 10, isPublished: true,
        };
        const body = new FormData();
        body.append('artwork', JSON.stringify(payload));
        body.append('existingImages', '[]');
        body.append('images', imageFile);
        await request('/api/admin/artworks', { method: 'POST', body }, token);
        imported += 1;
      }
      await loadDashboard(token);
      say('success', `Imported ${imported} paintings. You can now edit their details and rank them in this manager.`);
    } catch (error) {
      await loadDashboard(token);
      say('error', `Imported ${imported} paintings before stopping: ${error.message}. You can run the import again; already imported titles are skipped.`);
    } finally { setBusy(false); }
  };

  const deleteArtwork = async (item) => {
    if (!window.confirm(`Delete “${item.title}” from the gallery? This cannot be undone.`)) return;
    setBusy(true);
    try { await request(`/api/admin/artworks/${item._id || item.id}`, { method: 'DELETE' }, token); say('success', 'Artwork deleted.'); if (editingId === (item._id || item.id)) resetForm(); await loadDashboard(token); }
    catch (error) { say('error', error.message); }
    finally { setBusy(false); }
  };

  const saveStats = async (event) => {
    event.preventDefault(); setBusy(true);
    try { const updated = await request('/api/admin/site-stats', { method: 'PUT', body: JSON.stringify({ ...stats, followersValue: Number(stats.followersValue), viewsValue: Number(stats.viewsValue) }) }, token); setStats(updated); say('success', 'Homepage follower and view counters updated.'); }
    catch (error) { say('error', error.message); }
    finally { setBusy(false); }
  };

  const moveRank = async (item, direction) => {
    const index = sortedItems.findIndex((entry) => String(entry._id || entry.id) === String(item._id || item.id));
    const other = sortedItems[index + direction];
    if (!other) return;
    const next = [...sortedItems]; [next[index], next[index + direction]] = [next[index + direction], next[index]];
    const ranked = next.map((entry, idx) => ({ ...entry, sortOrder: (idx + 1) * 10 }));
    setBusy(true);
    try {
      for (const entry of ranked) {
        await request(`/api/admin/artworks/${entry._id || entry.id}`, { method: 'PUT', body: (() => { const data = { ...entry, tags: entry.tags || [], sortOrder: entry.sortOrder, featured: Boolean(entry.featured), isPublished: entry.isPublished !== false }; const fd = new FormData(); fd.append('artwork', JSON.stringify(data)); fd.append('existingImages', JSON.stringify(entry.images || [])); return fd; })() }, token);
      }
      await loadDashboard(token); say('success', 'Display order saved.');
    } catch (error) { say('error', `Could not save order: ${error.message}`); }
    finally { setBusy(false); }
  };

  if (!token) return <main className="uploads-shell uploads-login-shell">
    <div className="uploads-login-card"><div className="uploads-brand-mark">SL</div><p className="uploads-eyebrow">SAKSHI LAD · ART STUDIO</p><h1>Artwork Studio</h1><p className="uploads-muted">Sign in to manage paintings, image galleries, display order and homepage statistics.</p>
      <form onSubmit={signIn} className="uploads-form">
        <Field label="Admin username"><input autoComplete="username" required value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} /></Field>
        <Field label="Password"><input type="password" autoComplete="current-password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></Field>
        <button className="uploads-primary-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</button>
      </form>
      {notice.text && <p className={`uploads-notice ${notice.type}`}>{notice.text}</p>}
      <a className="uploads-back-link" href="/">← Back to public portfolio</a>
    </div>
  </main>;

  return <main className="uploads-shell">
    <header className="uploads-header"><div><p className="uploads-eyebrow">SAKSHI LAD · ART STUDIO</p><h1>Artwork Manager</h1><p className="uploads-muted">A private workspace for your art catalogue and homepage statistics.</p></div><div className="uploads-header-actions"><a href="/" className="uploads-secondary-button">View website ↗</a><button className="uploads-secondary-button" onClick={signOut}><LogOut size={16}/> Sign out</button></div></header>
    <nav className="uploads-tabs"><button className={activeTab === 'artworks' ? 'active' : ''} onClick={() => setActiveTab('artworks')}>Paintings <span>{items.length}</span></button><button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>Homepage stats</button></nav>
    {notice.text && <div className={`uploads-notice ${notice.type}`}>{notice.text}</div>}
    {activeTab === 'stats' ? <section className="uploads-panel"><div className="uploads-section-heading"><div><p className="uploads-eyebrow">SOCIAL PROOF</p><h2>Homepage counters</h2><p className="uploads-muted">These values are displayed in the artist introduction section.</p></div></div>
      <form className="uploads-form uploads-stats-form" onSubmit={saveStats}>
        <div className="uploads-stat-edit"><Field label="Followers value"><input type="number" min="0" step="any" required value={stats.followersValue} onChange={(e) => setStats({ ...stats, followersValue: e.target.value })}/></Field><Field label="Followers suffix"><input maxLength="8" value={stats.followersSuffix} onChange={(e) => setStats({ ...stats, followersSuffix: e.target.value })} placeholder="K+"/></Field></div>
        <div className="uploads-stat-edit"><Field label="Views value"><input type="number" min="0" step="any" required value={stats.viewsValue} onChange={(e) => setStats({ ...stats, viewsValue: e.target.value })}/></Field><Field label="Views suffix"><input maxLength="8" value={stats.viewsSuffix} onChange={(e) => setStats({ ...stats, viewsSuffix: e.target.value })} placeholder="M+"/></Field></div>
        <div className="uploads-preview-note">Preview: <strong>{stats.followersValue}{stats.followersSuffix}</strong> followers · <strong>{stats.viewsValue}{stats.viewsSuffix}</strong> views</div>
        <button className="uploads-primary-button" disabled={busy}><Save size={16}/> {busy ? 'Saving…' : 'Save homepage statistics'}</button>
      </form>
    </section> : <div className="uploads-layout">
      <section className="uploads-panel uploads-editor-panel"><div className="uploads-section-heading"><div><p className="uploads-eyebrow">{editingId ? 'EDIT EXISTING WORK' : 'ADD NEW WORK'}</p><h2>{editingId ? 'Edit painting' : 'Upload a painting'}</h2><p className="uploads-muted">Add artwork details and one or more images. The first image is the cover.</p></div>{editingId && <button className="uploads-icon-button" type="button" title="Cancel editing" onClick={resetForm}><X size={18}/></button>}</div>
        <form className="uploads-form" onSubmit={saveArtwork}>
          <Field label="Artwork title *"><input required maxLength="120" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Moonlit ocean dreams"/></Field>
          <div className="uploads-two-col"><Field label="Display price" hint={moneyNote}><input value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="₹1,500"/></Field><Field label="Availability"><select value={form.availability} onChange={(e) => updateField('availability', e.target.value)}><option>Available</option><option>Reserved</option><option>Sold Out</option><option>Commission Only</option></select></Field></div>
          <div className="uploads-two-col"><Field label="Size"><input value={form.size} onChange={(e) => updateField('size', e.target.value)} placeholder="6 × 6 inch"/></Field><Field label="Dimensions"><input value={form.dimensions} onChange={(e) => updateField('dimensions', e.target.value)} placeholder="15.2 × 15.2 cm"/></Field></div>
          <div className="uploads-two-col"><Field label="Medium"><input value={form.medium} onChange={(e) => updateField('medium', e.target.value)} placeholder="Acrylic on canvas"/></Field><Field label="Category / theme"><input value={form.category} onChange={(e) => updateField('category', e.target.value)} placeholder="Moonlight, ocean, nature…"/></Field></div>
          <div className="uploads-two-col"><Field label="Finish"><input value={form.finish} onChange={(e) => updateField('finish', e.target.value)} placeholder="Protective gloss varnish"/></Field><Field label="Framing"><input value={form.framing} onChange={(e) => updateField('framing', e.target.value)} placeholder="White frame included"/></Field></div>
          <Field label="Artwork story / description"><textarea rows="5" maxLength="5000" value={form.story} onChange={(e) => updateField('story', e.target.value)} placeholder="Describe the inspiration, materials and details…"/></Field>
          <Field label="Tags (comma-separated)"><input value={form.tags} onChange={(e) => updateField('tags', e.target.value)} placeholder="moon, ocean, original acrylic"/></Field>
          <Field label={editingId ? 'Add more images (optional)' : 'Artwork images *'} hint="JPG, PNG, WEBP or AVIF · up to 10 images · 8 MB each. Stored in Cloudinary, not on the temporary server disk."><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))}/></Field>
          {existingImages.length > 0 && <div className="uploads-image-grid"><p className="uploads-image-grid-label">Saved images — untick any you want to remove</p>{existingImages.map((image, index) => <label className="uploads-image-tile" key={`${image.url}-${index}`}><img src={image.url} alt={image.alt || form.title}/><span><input type="checkbox" checked={existingImages.some((entry) => entry.url === image.url)} onChange={(e) => setExistingImages((current) => e.target.checked ? [...current, image].filter((entry, idx, arr) => arr.findIndex((x) => x.url === entry.url) === idx) : current.filter((entry) => entry.url !== image.url))}/> Keep image {index + 1}</span></label>)}</div>}
          {filePreviews.length > 0 && <div className="uploads-image-grid"><p className="uploads-image-grid-label">New images preview</p>{filePreviews.map((url, index) => <div className="uploads-image-tile" key={url}><img src={url} alt={files[index]?.name || 'New artwork preview'}/><span>{files[index]?.name}</span></div>)}</div>}
          <div className="uploads-two-col"><Field label="Display rank *" hint="Lower numbers appear first."><input type="number" min="0" step="1" required value={form.sortOrder} onChange={(e) => updateField('sortOrder', e.target.value)}/></Field><Field label="URL slug (optional)"><input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} placeholder="moonlit-ocean-dreams"/></Field></div>
          <div className="uploads-checkbox-row"><label><input type="checkbox" checked={Boolean(form.featured)} onChange={(e) => updateField('featured', e.target.checked)}/> Featured artwork</label><label><input type="checkbox" checked={Boolean(form.isPublished)} onChange={(e) => updateField('isPublished', e.target.checked)}/> Published on website</label></div>
          <div className="uploads-form-actions"><button className="uploads-primary-button" disabled={busy}><ImagePlus size={17}/>{busy ? 'Saving artwork…' : editingId ? 'Save changes' : 'Upload artwork'}</button><button className="uploads-secondary-button" type="button" onClick={resetForm}>Clear form</button></div>
        </form>
      </section>
      <section className="uploads-panel uploads-list-panel"><div className="uploads-section-heading"><div><p className="uploads-eyebrow">CATALOGUE</p><h2>Managed paintings</h2><p className="uploads-muted">Use the arrows to adjust rank, or edit a painting to set an exact rank.</p></div><button className="uploads-icon-button" onClick={() => loadDashboard(token)} title="Refresh"><RefreshCw size={17}/></button></div>
        <button className="uploads-secondary-button uploads-import-button" type="button" disabled={busy} onClick={importLegacyPaintings}>Import existing GalleryData paintings</button>
        {loading ? <p className="uploads-muted">Loading artwork…</p> : sortedItems.length === 0 ? <div className="uploads-empty"><ImagePlus size={28}/><h3>Your managed gallery starts here</h3><p>Upload your first painting. Your existing bundled gallery will remain visible on the public website.</p></div> : <div className="uploads-managed-list">{sortedItems.map((item, index) => <article className="uploads-managed-item" key={item._id || item.id}><img className="uploads-managed-thumb" src={item.images?.[0]?.url || item.img} alt={item.title}/><div className="uploads-managed-info"><div className="uploads-item-title-row"><h3>{item.title}</h3><span className={`uploads-status ${item.isPublished === false ? 'unpublished' : ''}`}>{item.isPublished === false ? 'Draft' : item.availability || 'Available'}</span></div><p>{item.price || 'DM for Price'} · {item.size || item.dimensions || 'Size not set'}</p><small>Rank {item.sortOrder ?? 0} · {item.images?.length || (item.img ? 1 : 0)} image(s)</small><div className="uploads-item-actions"><button onClick={() => startEdit(item)}>Edit</button><button onClick={() => moveRank(item, -1)} disabled={index === 0 || busy} aria-label="Move artwork up"><ArrowUp size={15}/></button><button onClick={() => moveRank(item, 1)} disabled={index === sortedItems.length - 1 || busy} aria-label="Move artwork down"><ArrowDown size={15}/></button><button className="danger" onClick={() => deleteArtwork(item)} disabled={busy}><Trash2 size={15}/> Delete</button></div></div></article>)}</div>}
      </section>
    </div>}
    <footer className="uploads-footer">Private artist workspace · Artwork metadata is stored in MongoDB; uploaded images are stored in Cloudinary.</footer>
  </main>;
}
''')

    # Add clean, responsive styling without replacing the site's existing design tokens.
    write_text(client / "src" / "uploads.css", r'''/* Private /uploads artist workspace */
.uploads-shell{min-height:100vh;padding:clamp(1rem,3vw,2.5rem);background:var(--page-bg,#f7f3ef);color:var(--ink,#282522);font-family:var(--font-sans,system-ui,sans-serif)}
.uploads-shell *{box-sizing:border-box}.uploads-header{max-width:1500px;margin:0 auto 1.6rem;display:flex;justify-content:space-between;gap:1rem;align-items:center}.uploads-header h1,.uploads-login-card h1{font-family:var(--font-serif,Georgia,serif);font-size:clamp(2rem,4vw,3.1rem);line-height:1.1;margin:.3rem 0 .7rem}.uploads-eyebrow{font-size:.72rem;letter-spacing:.18em;font-weight:800;color:var(--sunset,#c77f68);margin:0 0 .5rem}.uploads-muted{color:var(--muted,#77716c);line-height:1.6;margin:.3rem 0}.uploads-header-actions,.uploads-form-actions{display:flex;gap:.65rem;align-items:center;flex-wrap:wrap}.uploads-primary-button,.uploads-secondary-button{min-height:43px;border-radius:12px;padding:.7rem 1rem;border:1px solid transparent;display:inline-flex;align-items:center;justify-content:center;gap:.5rem;font:inherit;font-weight:700;text-decoration:none;cursor:pointer;transition:transform .15s,opacity .15s}.uploads-primary-button{background:var(--sunset,#c77f68);color:white}.uploads-secondary-button{background:transparent;color:var(--ink,#282522);border-color:var(--border,#ded6d0)}.uploads-primary-button:hover,.uploads-secondary-button:hover{transform:translateY(-1px)}.uploads-primary-button:disabled,.uploads-secondary-button:disabled{opacity:.55;cursor:wait}.uploads-tabs{max-width:1500px;margin:0 auto 1rem;display:flex;gap:.5rem;border-bottom:1px solid var(--border,#ded6d0)}.uploads-tabs button{border:0;border-bottom:3px solid transparent;background:transparent;padding:.9rem 1rem;color:var(--muted,#777);font:inherit;font-weight:700;cursor:pointer}.uploads-tabs button.active{color:var(--sunset,#c77f68);border-bottom-color:var(--sunset,#c77f68)}.uploads-tabs span{font-size:.75rem;background:var(--border,#ded6d0);padding:.15rem .45rem;border-radius:20px;margin-left:.25rem}.uploads-layout{max-width:1500px;margin:0 auto;display:grid;grid-template-columns:minmax(320px,.92fr) minmax(360px,1.08fr);align-items:start;gap:1.2rem}.uploads-panel,.uploads-login-card{background:var(--card-bg,#fff);border:1px solid var(--border,#e7dfd8);border-radius:20px;padding:clamp(1rem,2vw,1.5rem);box-shadow:0 14px 40px rgba(49,35,25,.045)}.uploads-section-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1.25rem}.uploads-section-heading h2{font-family:var(--font-serif,Georgia,serif);font-size:1.65rem;margin:0}.uploads-form{display:flex;flex-direction:column;gap:1rem}.upload-field{display:flex;flex-direction:column;gap:.42rem;min-width:0;font-size:.9rem;font-weight:700}.upload-field small{font-size:.76rem;line-height:1.45;font-weight:400;color:var(--muted,#777)}.upload-field input:not([type=checkbox]):not([type=file]),.upload-field select,.upload-field textarea{width:100%;border:1px solid var(--border,#ded6d0);border-radius:10px;padding:.75rem .8rem;background:var(--input-bg,#fff);color:var(--ink,#282522);font:inherit;font-size:.92rem;outline:none}.upload-field input:focus,.upload-field select:focus,.upload-field textarea:focus{border-color:var(--sunset,#c77f68);box-shadow:0 0 0 3px rgba(199,127,104,.13)}.upload-field input[type=file]{width:100%;border:1px dashed var(--border,#ded6d0);border-radius:10px;padding:.8rem;background:var(--input-bg,#fff);font:inherit;font-size:.85rem}.upload-field textarea{resize:vertical}.uploads-two-col,.uploads-stat-edit{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}.uploads-checkbox-row{display:flex;gap:1rem;flex-wrap:wrap}.uploads-checkbox-row label,.uploads-image-tile span{display:flex;align-items:center;gap:.4rem;font-size:.86rem}.uploads-image-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem}.uploads-image-grid-label{grid-column:1/-1;font-size:.82rem;color:var(--muted,#777);margin:0}.uploads-image-tile{overflow:hidden;border:1px solid var(--border,#ded6d0);border-radius:10px;padding:.35rem;min-width:0}.uploads-image-tile img{display:block;width:100%;height:100px;object-fit:cover;border-radius:7px}.uploads-image-tile span{padding:.35rem .1rem;overflow-wrap:anywhere;font-weight:400}.uploads-image-tile span input{flex-shrink:0}.uploads-form-actions{margin-top:.3rem}.uploads-form-actions .uploads-primary-button{flex:1}.uploads-icon-button{display:grid;place-items:center;width:38px;height:38px;border:1px solid var(--border,#ded6d0);border-radius:10px;background:transparent;color:var(--ink,#282522);cursor:pointer}.uploads-import-button{width:100%;margin-bottom:1rem}.uploads-managed-list{display:flex;flex-direction:column;gap:.75rem}.uploads-managed-item{display:flex;gap:.8rem;padding:.7rem;border:1px solid var(--border,#e7dfd8);border-radius:14px;min-width:0}.uploads-managed-thumb{width:92px;height:105px;object-fit:cover;border-radius:9px;background:#eee;flex-shrink:0}.uploads-managed-info{min-width:0;flex:1}.uploads-item-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem}.uploads-item-title-row h3{font-family:var(--font-serif,Georgia,serif);font-size:1.05rem;line-height:1.3;margin:.1rem 0 .35rem;overflow-wrap:anywhere}.uploads-managed-info p{margin:.15rem 0 .3rem;font-size:.85rem}.uploads-managed-info small{color:var(--muted,#777)}.uploads-status{display:inline-block;white-space:nowrap;background:#e8f5ec;color:#27663d;padding:.2rem .45rem;border-radius:30px;font-size:.68rem;font-weight:800}.uploads-status.unpublished{background:#f4e9d8;color:#7b5b22}.uploads-item-actions{display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.65rem}.uploads-item-actions button{display:inline-flex;align-items:center;gap:.25rem;border:1px solid var(--border,#ded6d0);border-radius:8px;background:transparent;color:var(--ink,#282522);padding:.35rem .5rem;font:inherit;font-size:.76rem;font-weight:700;cursor:pointer}.uploads-item-actions button:disabled{opacity:.4;cursor:not-allowed}.uploads-item-actions button.danger{color:#a43c36;margin-left:auto}.uploads-empty{text-align:center;padding:3rem 1rem;color:var(--muted,#777)}.uploads-empty h3{color:var(--ink,#282522);font-family:var(--font-serif,Georgia,serif)}.uploads-stat-edit{max-width:700px}.uploads-stats-form{max-width:700px}.uploads-preview-note{padding:1rem;background:var(--page-bg,#f7f3ef);border-radius:12px}.uploads-notice{max-width:1500px;margin:0 auto 1rem;border-radius:10px;padding:.8rem 1rem;font-size:.9rem}.uploads-notice.success{background:#e8f5ec;color:#27663d}.uploads-notice.error{background:#fae8e6;color:#96362e}.uploads-footer{max-width:1500px;margin:1.5rem auto 0;text-align:center;color:var(--muted,#777);font-size:.78rem}.uploads-login-shell{display:grid;place-items:center;padding:1.25rem}.uploads-login-card{width:min(100%,450px);padding:clamp(1.4rem,4vw,2.4rem)}.uploads-brand-mark{width:54px;height:54px;border-radius:17px;background:var(--sunset,#c77f68);color:#fff;display:grid;place-items:center;font-family:var(--font-serif,Georgia,serif);font-size:1.4rem;margin-bottom:1.2rem}.uploads-login-card .uploads-form{margin-top:1.5rem}.uploads-login-card .uploads-back-link{display:inline-block;margin-top:1.3rem;color:var(--sunset,#c77f68);font-size:.9rem;text-decoration:none}.art-card-image-wrap{overflow:hidden}.art-card-image-wrap img{display:block;width:100%;height:100%;object-fit:cover}.artwork-carousel,.artwork-carousel-single{width:100%;height:100%;display:block}.artwork-carousel .swiper,.artwork-carousel .swiper-slide{width:100%;height:100%}.artwork-carousel .swiper-slide{display:flex;align-items:center;justify-content:center}.artwork-carousel img,.artwork-carousel-single{width:100%;height:100%;max-height:72vh;object-fit:contain}.artwork-carousel .swiper-button-prev,.artwork-carousel .swiper-button-next{color:var(--sunset,#c77f68);background:rgba(255,255,255,.86);width:36px;height:36px;border-radius:50%}.artwork-carousel .swiper-button-prev:after,.artwork-carousel .swiper-button-next:after{font-size:15px;font-weight:800}.artwork-carousel .swiper-pagination-bullet-active{background:var(--sunset,#c77f68)}.modal-artwork-carousel{min-height:260px}.modal-left .artwork-carousel img,.modal-left .artwork-carousel-single{object-fit:contain}.artwork-image-empty{display:grid;place-items:center;min-height:180px;color:var(--muted,#777)}
@media(max-width:1050px){.uploads-layout{grid-template-columns:minmax(0,1fr)}.uploads-list-panel{order:2}.uploads-editor-panel{order:1}}
@media(max-width:620px){.uploads-header{align-items:flex-start;flex-direction:column}.uploads-header-actions{width:100%}.uploads-header-actions>*{flex:1}.uploads-two-col,.uploads-stat-edit{grid-template-columns:1fr}.uploads-managed-thumb{width:76px;height:90px}.uploads-item-title-row{flex-direction:column;gap:.25rem}.uploads-item-actions button.danger{margin-left:0}.uploads-image-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.uploads-panel{border-radius:15px}.uploads-tabs button{padding:.8rem .55rem;font-size:.88rem}}
''')

    update_package(client / "package.json", {"swiper": "^11.1.4"})

    # Ignore local environment files and uploads if not already covered.
    gitignore = root / ".gitignore"
    git_text = gitignore.read_text(encoding="utf-8") if gitignore.exists() else ""
    if "# Local uploaded artwork" not in git_text:
        git_text += "\n# Local uploaded artwork / secrets\nserver/.env\nserver/uploads/\n"
        write_text(gitignore, git_text)

    print("\nSakshi Art artwork manager changes have been applied.")
    print(f"Project root: {root}")
    print(f"Backups: {backup_root}")
    print("\nNext steps:")
    print("1. Open a terminal in the project root.")
    print("2. Install frontend dependencies: cd client && npm install && cd ..")
    print("3. Install backend dependencies: cd server && npm install && cd ..")
    print("4. Add these secrets to server/.env locally and to Render's backend environment:")
    print("   ADMIN_USERNAME=choose-a-private-username")
    print("   ADMIN_PASSWORD=use-a-long-unique-password")
    print("   JWT_SECRET=generate-a-long-random-secret")
    print("   CLOUDINARY_CLOUD_NAME=your-cloud-name")
    print("   CLOUDINARY_API_KEY=your-cloudinary-api-key")
    print("   CLOUDINARY_API_SECRET=your-cloudinary-api-secret")
    print("5. Ensure MONGODB_URI is configured. Do not commit .env or paste secrets into chat.")
    print("6. For local development, start backend with `cd server && npm run dev` and frontend with `cd client && npm run dev`.")
    print("7. Visit http://localhost:5173/uploads and sign in using the environment credentials.")
    print("8. Set VITE_API_BASE_URL to your backend URL for production builds if it is not the default Render URL.")
    print("9. Configure your static host to rewrite /uploads to index.html (SPA fallback) so refreshing that route works.")
    print("\nUse the 'Import existing GalleryData paintings' button in /uploads once to migrate existing paintings and their images into MongoDB/Cloudinary. Existing paintings remain available as a fallback until imported.")
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
