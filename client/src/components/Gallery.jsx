import React, { useEffect, useMemo, useState } from 'react';
import { paintings as legacyPaintings } from '../GalleryData';
import { trackEvent } from '../analytics';
import { apiUrl } from '../api';
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
