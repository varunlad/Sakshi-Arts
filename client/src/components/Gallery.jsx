import React, { useState, useEffect } from 'react';
import { paintings } from '../GalleryData';
import { trackEvent } from '../analytics';

export default function Gallery({ setModalArt, smoothScrollTo }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth > 768 ? 6 : 4);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.ceil(paintings.length / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedPaintings = paintings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      <h2 className="font-serif" style={{fontSize: '2.5rem', marginBottom: '2rem'}}>
        Original Paintings
      </h2>

      <div className="gallery-grid">
        {paginatedPaintings.map((p) => (
          <div key={p.id} className="art-card" onClick={() => { setModalArt(p); trackEvent('painting_view', { paintingTitle: p.title }); }}>
            
            <img src={p.img} alt={p.title} loading="lazy" draggable={false} onContextMenu={(e) => e.preventDefault()} />
            
            <div className="art-info">
              <h3 className="font-serif">{p.title}</h3>
              
              <div className="price-row">
                <p className="font-serif price-text">
                  {p.price ? <>{p.price} <span className="price-only-text" style={{ color: 'var(--ink)' }}>only</span></> : 'DM for Price'}
                </p>
                
                <span className="availability-badge" style={{ 
                  background: p.availability === 'Sold Out' ? '#EAE5DF' : '#E8F5E9',
                  color: p.availability === 'Sold Out' ? 'var(--muted)' : '#2E7D32'
                }}>
                  {p.availability}
                </span>
              </div>

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
