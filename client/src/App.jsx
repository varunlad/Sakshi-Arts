import React, { useState, useEffect } from 'react';
import { Instagram, X } from 'lucide-react';
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

    // Anti-Download Protection
    const handleContextMenu = (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') e.preventDefault();
    };
    const handleDragStart = (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') e.preventDefault();
    };
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
            
            <div className="modal-left" onContextMenu={(e) => e.preventDefault()}>
              <img src={modalArt.img} alt={modalArt.title} draggable={false} />
            </div>
            
            <div className="modal-right">
              {/* Force text to display with proper capitalization automatically */}
              <span className="font-hand" style={{ textTransform: 'capitalize' }}>{modalArt.mood}</span>
              <h2 className="font-serif" style={{fontSize: '2.4rem', margin: '0.5rem 0'}}>{modalArt.title}</h2>
              <p className="text-muted" style={{margin: '1rem 0 1.5rem', fontSize: '1.05rem'}}>{modalArt.size} • {modalArt.medium}</p>
              <p style={{fontStyle: 'italic', marginBottom: '2.5rem', lineHeight: 1.7, fontSize: '1.1rem', color: 'var(--ink)'}}>"{modalArt.story}"</p>
              <button className="btn btn-primary" style={{width: '100%', justifyContent: 'center', padding: '1rem'}} onClick={() => { trackEvent('painting_inquiry_click'); window.open(INSTAGRAM_URL); }}>
                Enquire on Instagram <Instagram size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
