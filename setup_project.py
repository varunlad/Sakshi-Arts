#!/usr/bin/env python3
import os

def create_file(path, content):
    dir_name = os.path.dirname(path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"  [+] Updated: {path}")

def main():
    print("=" * 60)
    print("✨ Hiding the 'only' text on mobile gallery cards...")
    print("=" * 60)

    # ==========================================
    # 1. UPDATE GALLERY.JSX (Add class to 'only')
    # ==========================================
    create_file("client/src/components/Gallery.jsx", """
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
        Canvas Gallery
      </h2>

      <div className="gallery-grid">
        {paginatedPaintings.map((p) => (
          <div key={p.id} className="art-card" onClick={() => { setModalArt(p); trackEvent('painting_view', { paintingId: p.id }); }}>
            
            <div className="handmade-tag-overlay">
              Handmade
            </div>

            <img src={p.img} alt={p.title} loading="lazy" draggable={false} onContextMenu={(e) => e.preventDefault()} />
            
            <div className="art-info">
              <h3 className="font-serif">{p.title}</h3>
              
              <div className="price-row">
                <p className="font-serif price-text">
                  {/* ✨ Added 'price-only-text' class here to target it on mobile */}
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
""")

    # ==========================================
    # 2. UPDATE CSS (Hide 'price-only-text' on mobile)
    # ==========================================
    create_file("client/src/index.css", """
:root {
  --canvas: #F4EFEB; --surface: #ECE3D7; --ink: #221C18; --muted: #6E6157;
  --sunset: #D9886A; --sunset-dark: #A74E2B; --border: #DCD0C0;
  --font-sans: 'Inter', sans-serif; --font-serif: 'Playfair Display', serif; --font-hand: 'Caveat', cursive;
  --transition-smooth: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);

  --glass-bg: rgba(255, 252, 248, 0.55);
  --glass-border: rgba(255, 255, 255, 0.85);
  --glass-blur: blur(20px);
  --glass-shadow: 0 20px 40px rgba(40, 30, 20, 0.08), inset 0 0 20px rgba(255, 255, 255, 0.7);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  color: var(--ink); font-family: var(--font-sans);
  overflow-x: hidden !important;
  scroll-behavior: smooth;
  background-color: var(--canvas);
  width: 100%;
  position: relative;
}

img, video { -webkit-user-drag: none; user-drag: none; user-select: none; pointer-events: auto; }
::selection { background-color: var(--sunset); color: #fff; }

.ambient-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -2; overflow: hidden; pointer-events: none; background: #F4EFEB; }
.ambient-glow-1 { position: absolute; top: -10%; left: -10%; width: 65vw; height: 65vw; border-radius: 50%; background: radial-gradient(circle, rgba(240, 185, 155, 0.8) 0%, transparent 70%); filter: blur(70px); animation: ambientDrift 18s infinite alternate; }
.ambient-glow-2 { position: absolute; bottom: -10%; right: -10%; width: 75vw; height: 75vw; border-radius: 50%; background: radial-gradient(circle, rgba(195, 215, 190, 0.7) 0%, transparent 70%); filter: blur(70px); animation: ambientDrift 22s infinite alternate-reverse; }
.ambient-glow-3 { position: absolute; top: 40%; left: 30%; width: 50vw; height: 50vw; border-radius: 50%; background: radial-gradient(circle, rgba(220, 200, 235, 0.5) 0%, transparent 70%); filter: blur(80px); animation: ambientDrift 30s infinite ease-in-out; }

.container { max-width: 1100px; margin: 0 auto; padding-left: 1.5rem; padding-right: 1.5rem; width: 100%; }
.section { padding-top: 2.5rem; padding-bottom: 2.5rem; position: relative; z-index: 1; } 
.text-center { text-align: center; }
.font-serif { font-family: var(--font-serif); font-weight: normal; }
.font-hand { font-family: var(--font-hand); color: var(--sunset); font-size: 1.9rem; }
.text-muted { color: var(--muted); }

.hero { min-height: auto; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 2.5rem 1.5rem 1.5rem; z-index: 1; text-align: center; }
.hero-pic img { object-position: top !important; }

.reveal-1, .reveal-2, .reveal-3, .reveal-4 { opacity: 0; animation: fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.reveal-1 { animation-delay: 0.1s; } .reveal-2 { animation-delay: 0.3s; }
.reveal-3 { animation-delay: 0.5s; } .reveal-4 { animation-delay: 0.7s; }

.standard-img-card { max-width: 520px; width: 100%; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); background: var(--glass-bg); backdrop-filter: var(--glass-blur); }
.standard-img-card img { width: 100%; height: auto; aspect-ratio: 6 / 5 !important; object-fit: cover; object-position: center; display: block; margin: 0 auto; }

.social-pills-row { display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; margin-top: 0.3rem; }
.social-pill-icon { width: 45px; height: 45px; border-radius: 50px; background: var(--glass-bg); backdrop-filter: var(--glass-blur); border: 1px solid var(--glass-border); color: var(--sunset); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: var(--transition-smooth); box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
.social-pill-icon:hover { border-color: var(--sunset); color: var(--sunset-dark); transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.08); }

.btn { cursor: pointer; font-family: var(--font-sans); font-weight: 500; border-radius: 50px; transition: var(--transition-smooth); border: 1px solid transparent; display: inline-flex; align-items: center; justify-content: center; }
.btn-primary { background: var(--ink); color: #fff; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.15); opacity: 0.9; }

.reviews-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 2rem; padding: 0.5rem 0; }
.review-card { padding: 1.8rem; border-radius: 18px; text-align: left; background: var(--glass-bg); backdrop-filter: var(--glass-blur); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); display: flex; flex-direction: column; justify-content: space-between; transition: var(--transition-smooth); }
.review-card:hover { transform: translateY(-5px); box-shadow: 0 30px 60px rgba(0,0,0,0.1); }

.gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 1rem; padding: 0.5rem 0; width: 100%; }
.art-card { padding: 1rem; border-radius: 14px; cursor: pointer; position: relative; transition: var(--transition-smooth); background: var(--glass-bg); backdrop-filter: var(--glass-blur); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); text-align: left; }
.art-card:hover { transform: translateY(-8px); z-index: 10; box-shadow: 0 30px 60px rgba(0,0,0,0.12); }
.art-card img { width: 100%; height: auto; aspect-ratio: 6 / 5 !important; object-fit: cover; border-radius: 8px; transition: var(--transition-smooth); }
.art-card:hover img { transform: scale(1.03); }
.art-info { margin-top: 1rem; }

.handmade-tag-overlay { position: absolute; top: 26px; left: 26px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 6px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--ink); z-index: 2; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.mobile-handmade-text { display: none; }
.art-info h3 { font-size: 1.4rem; margin: 6px 0; color: var(--ink); }
.price-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
.price-text { font-size: 1.1rem; color: #2E7D32; font-weight: bold; margin: 0; }
.availability-badge { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; padding: 4px 8px; border-radius: 4px; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 2rem; flex-wrap: wrap; }
.page-btn { min-width: 38px; height: 38px; padding: 0 0.6rem; border-radius: 50px; border: 1px solid var(--glass-border); background: var(--glass-bg); backdrop-filter: var(--glass-blur); cursor: pointer; font-weight: 500; font-family: var(--font-sans); color: var(--ink); transition: var(--transition-smooth); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
.page-btn:hover:not(:disabled) { border-color: var(--sunset); color: var(--sunset-dark); transform: translateY(-2px); }
.page-btn.active { background: var(--ink); color: var(--canvas); border-color: var(--ink); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
.page-ellipsis { padding: 0 0.4rem; color: var(--muted); font-weight: bold; }

.video-container { display: flex; gap: 1.5rem; justify-content: center; align-items: center; max-width: 850px; margin: 0 auto; }
.video-wrapper { position: relative; flex: 1; aspect-ratio: 9/16; border-radius: 20px; overflow: hidden; box-shadow: var(--glass-shadow); border: 1px solid var(--glass-border); background: #000; transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
.video-wrapper.inactive { opacity: 0.4; transform: scale(0.92); }
.video-wrapper.active { opacity: 1; transform: scale(1); box-shadow: 0 25px 50px rgba(0,0,0,0.2); }

.contact-box { padding: 3rem 1.5rem; border-radius: 20px; max-width: 750px; margin: 0 auto; transition: var(--transition-smooth); background: var(--glass-bg); backdrop-filter: blur(24px); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); text-align: center; }
.contact-box:hover { box-shadow: 0 30px 60px rgba(0,0,0,0.08); transform: translateY(-4px); }

/* Modal Styling */
.modal-bg { position: fixed; inset: 0; background: rgba(30,25,23,0.7); backdrop-filter: blur(12px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 0; animation: fadeIn 0.4s forwards; }
.modal-content { width: 100%; max-width: 900px; border-radius: 20px; display: flex; overflow: hidden; position: relative; max-height: 85vh; opacity: 0; transform: scale(0.96) translateY(20px); animation: modalPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; background: rgba(250, 247, 242, 0.95); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 40px 80px rgba(0,0,0,0.3); }
.modal-close { position: absolute; top: 1.2rem; right: 1.2rem; background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.9); width: 38px; height: 38px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: var(--transition-smooth); }
.modal-close:hover { transform: scale(1.1) rotate(90deg); background: #fff; }
.modal-left { flex: 1; background: rgba(224, 217, 207, 0.5); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.modal-left img { width: 100%; height: 100%; object-fit: cover; }
.modal-right { flex: 1.1; display: flex; flex-direction: column; overflow: hidden; }
.modal-right-content { flex: 1; overflow-y: auto; padding: 3rem 3rem 1.5rem; display: flex; flex-direction: column; justify-content: flex-start; }
.modal-right-footer { padding: 1rem 3rem 3rem; background: transparent; flex-shrink: 0; }

@keyframes fadeUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes ambientDrift { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(10vw, -10vh) scale(1.25); } }
@keyframes modalPop { 0% { opacity: 0; transform: scale(0.96) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }

@media (max-width: 900px) { .gallery-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) {
  .container { padding-left: 1rem; padding-right: 1rem; } 
  .section { padding-top: 2rem; padding-bottom: 2rem; } 
  
  .reviews-container { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 0.8rem; padding-bottom: 1rem; padding-left: 0.2rem; scrollbar-width: none; }
  .reviews-container::-webkit-scrollbar { display: none; }
  .review-card { min-width: 85%; max-width: 85%; flex: 0 0 auto; scroll-snap-align: start; padding: 1.5rem; }
  
  .gallery-grid { grid-template-columns: repeat(2, 1fr); gap: 0.8rem; }
  .art-card { padding: 0.6rem; }
  
  .handmade-tag-overlay { display: none !important; }
  .mobile-handmade-text { display: none !important; }
  .art-info h3 { font-size: 1rem !important; margin: 2px 0 6px !important; line-height: 1.2; }
  
  /* ✨ HIDES THE WORD 'ONLY' ON MOBILE VIEWS */
  .price-only-text { display: none !important; }

  .price-row { 
    flex-direction: row !important; 
    justify-content: space-between !important; 
    align-items: center !important; 
    flex-wrap: wrap; 
    gap: 4px; 
    margin-top: 4px; 
  }
  .price-text { font-size: 0.9rem !important; }
  .availability-badge { font-size: 0.55rem !important; padding: 3px 6px !important; }
  
  .modal-content { flex-direction: column; overflow: hidden; max-height: 90vh; }
  .modal-left { flex: 0 0 auto; width: 100%; aspect-ratio: 6 / 5 !important; height: auto; min-height: unset; }
  .modal-right { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
  .modal-right-content { flex: 1; overflow-y: auto; padding: 1.5rem 1.5rem 1rem; justify-content: flex-start; } 
  .modal-right-footer { padding: 0.5rem 1.5rem 1.5rem; flex-shrink: 0; }
  
  .contact-box { padding: 2rem 1rem; }
  .video-container { position: relative; display: block; height: 65vh; max-height: 550px; min-height: 350px; width: 100%; max-width: 380px; margin: 0 auto; }
  .video-wrapper { position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: none !important; transition: opacity 0.8s ease; }
  .video-wrapper.inactive { opacity: 0; pointer-events: none; }
  .video-wrapper.active { opacity: 1; z-index: 2; }
}
""")

if __name__ == "__main__":
    main()