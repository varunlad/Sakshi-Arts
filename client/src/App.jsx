import React, { useState, useEffect } from 'react';
import { Instagram, Facebook, X } from 'lucide-react';
import { trackEvent } from './analytics';
import { INSTAGRAM_URL, FACEBOOK_URL, YOUTUBE_URL, EMAIL_ADDRESS } from './data';

import Hero from './components/Hero';
import FeaturedImage from './components/FeaturedImage';
import Reviews from './components/Reviews';
import Gallery from './components/Gallery';
import VideoSection from './components/VideoSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

export default function App() {
  const [modalArt, setModalArt] = useState(null);

  useEffect(() => {
    trackEvent('page_view');
    const handleContextMenu = (e) => { if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') e.preventDefault(); };
    const handleDragStart = (e) => { if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') e.preventDefault(); };
    const handleKeyDown = (e) => { if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) e.preventDefault(); };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (modalArt) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => { 
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [modalArt]);

  const openIG = () => { trackEvent('instagram_click'); window.open(INSTAGRAM_URL, '_blank'); };
  const openFB = () => { trackEvent('facebook_click'); window.open(FACEBOOK_URL, '_blank'); };
  const openYT = () => { trackEvent('youtube_click'); window.open(YOUTUBE_URL, '_blank'); };
  const openMail = () => { trackEvent('email_click'); window.location.href = `mailto:${EMAIL_ADDRESS}`; };

  const smoothScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 60; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const offsetPosition = (elementRect - bodyRect) - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div>
      <div className="ambient-bg">
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
        <div className="ambient-glow-3"></div>
      </div>

      <Hero openIG={openIG} openFB={openFB} openYT={openYT} openMail={openMail} />
      <FeaturedImage />
      <Reviews />
      <Gallery setModalArt={setModalArt} smoothScrollTo={smoothScrollTo} />
      <VideoSection />
      <ContactSection openIG={openIG} openFB={openFB} openYT={openYT} openMail={openMail} />
      <Footer />

      {/* --- MODALS --- */}
      {modalArt && (
        <div className="modal-bg" onClick={() => setModalArt(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalArt(null)}><X size={20} /></button>
            
            <div className="modal-left" onContextMenu={(e) => e.preventDefault()} style={{ position: 'relative' }}>
              <img src={modalArt.img} alt={modalArt.title} draggable={false} />
            </div>
            
            <div className="modal-right">
              
              <div className="modal-right-content">
                <h2 className="font-serif" style={{fontSize: '2.4rem', margin: '0 0 0.2rem 0', color: 'var(--ink)'}}>{modalArt.title}</h2>
                
                <p className="font-serif" style={{ fontSize: '1.4rem', color: '#2E7D32', fontWeight: 'bold', marginBottom: '1.2rem' }}>
                  {modalArt.price ? <>{modalArt.price} <span className="price-only-text" style={{ color: 'var(--ink)' }}>only</span></> : 'DM for Price'}
                </p>
                
                {modalArt.availability !== 'Sold Out' && (
                  <div style={{ 
                    background: '#FDECE8', 
                    color: 'var(--sunset-dark)', 
                    padding: '0.6rem 1rem', 
                    borderRadius: '8px', 
                    fontSize: '0.9rem', 
                    marginBottom: '1.2rem', 
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    ✨ Flat 10% off on prepaid orders
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.95rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
                  <span><strong>Size:</strong> {modalArt.size}</span>
                  <span>.</span>
                  <span><strong>Status:</strong> <span style={{ color: modalArt.availability === 'Sold Out' ? 'var(--muted)' : '#2E7D32', fontWeight: 'bold' }}>{modalArt.availability}</span></span>
                </div>
                
                <p style={{fontStyle: 'italic', margin: 0, lineHeight: 1.7, fontSize: '1.05rem', color: 'var(--ink)', whiteSpace: 'pre-line'}}>
                  {modalArt.story}
                </p>
              </div>
              
              <div className="modal-right-footer">
                <div style={{ display: 'flex', gap: '0.8rem', width: '100%' }}>
                  {/* ✨ UPDATED: Now passes the specific painting title to your analytics when they click to buy */}
                  <button className="btn btn-primary" style={{flex: 1, padding: '0.9rem 0.5rem', gap: '8px', fontSize: '0.95rem'}} onClick={() => { trackEvent('buy_ig', { paintingTitle: modalArt.title }); window.open(INSTAGRAM_URL); }}>
                    <Instagram size={18} /> {modalArt.availability === 'Sold Out' ? 'Request' : 'DM to Buy'}
                  </button>
                  <button className="btn btn-primary" style={{flex: 1, padding: '0.9rem 0.5rem', gap: '8px', fontSize: '0.95rem', background: '#3b5998', borderColor: '#3b5998'}} onClick={() => { trackEvent('buy_fb', { paintingTitle: modalArt.title }); window.open(FACEBOOK_URL); }}>
                    <Facebook size={18} /> {modalArt.availability === 'Sold Out' ? 'Request' : 'DM to Buy'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
