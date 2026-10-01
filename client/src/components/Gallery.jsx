import React, { useState, useEffect } from 'react';
import { paintings } from '../data';
import { trackEvent } from '../analytics';

export default function Gallery({ setModalArt, smoothScrollTo }) {
  const [mood, setMood] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6; 

  useEffect(() => {
    setCurrentPage(1);
  }, [mood]);

  const filteredPaintings = paintings.filter(p => mood === 'all' || p.mood === mood);
  const totalPages = Math.ceil(filteredPaintings.length / ITEMS_PER_PAGE);
  const paginatedPaintings = filteredPaintings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <section id="gallery" className="section container text-center">
      <span className="font-hand">Stories in Colour</span>
      <h2 className="font-serif" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>Moments on Canvas</h2>
      
      <div className="mood-filters">
        {['all', 'sunset', 'ocean', 'moonlight', 'nature'].map(m => (
          <button key={m} className={`mood-btn ${mood === m ? 'active' : ''}`} onClick={() => { setMood(m); trackEvent('mood_filter_click', { meta: { mood: m } }); }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="gallery-grid">
        {paginatedPaintings.map((p) => (
          <div key={p.id} className="art-card" onClick={() => { setModalArt(p); trackEvent('painting_view', { paintingId: p.id }); }}>
            <img src={p.img} alt={p.title} loading="lazy" />
            <div className="art-info">
              <span className="font-mono text-muted" style={{fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px'}}>{p.mood} Collection</span>
              <h3 className="font-serif" style={{fontSize: '1.4rem', margin: '6px 0'}}>{p.title}</h3>
              <p className="text-muted" style={{fontSize: '0.9rem'}}>{p.size} • {p.availability}</p>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="page-btn" 
            disabled={currentPage === 1}
            onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); smoothScrollTo('gallery'); }}
          >
            Prev
          </button>

          {getPageNumbers().map((p, idx) => (
            p === '...' ? (
              <span key={idx} className="page-ellipsis">...</span>
            ) : (
              <button
                key={idx}
                className={`page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => { setCurrentPage(p); smoothScrollTo('gallery'); }}
              >
                {p}
              </button>
            )
          ))}

          <button 
            className="page-btn" 
            disabled={currentPage === totalPages}
            onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); smoothScrollTo('gallery'); }}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
