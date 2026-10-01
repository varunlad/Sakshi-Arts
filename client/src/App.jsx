import React, { useState, useEffect } from 'react';
import { Instagram, X } from 'lucide-react';
import { trackEvent } from './analytics';
import { INSTAGRAM_URL, FACEBOOK_URL, YOUTUBE_URL, EMAIL_ADDRESS } from './data';

// Import Components
import Hero from './components/Hero';
import FeaturedImage from './components/FeaturedImage';
import Reviews from './components/Reviews';
import Gallery from './components/Gallery';
import Timeline from './components/Timeline';
import YouTubeSection from './components/YouTubeSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

export default function App() {
  const [modalArt, setModalArt] = useState(null);
  const [modalVideo, setModalVideo] = useState(null);

  useEffect(() => {
    trackEvent('page_view');
  }, []);

  // Shared Link Functions
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

      <Hero 
        openIG={openIG} openFB={openFB} openYT={openYT} openMail={openMail} 
      />

      <FeaturedImage />
      <Reviews />
      
      <Gallery 
        setModalArt={setModalArt} 
        smoothScrollTo={smoothScrollTo} 
      />

      <Timeline />
      
      <YouTubeSection 
        setModalVideo={setModalVideo} 
      />
      
      <ContactSection 
        openIG={openIG} openFB={openFB} openYT={openYT} openMail={openMail} 
      />
      
      <Footer />

      {/* --- MODALS --- */}
      {modalArt && (
        <div className="modal-bg" onClick={() => setModalArt(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalArt(null)}><X size={20} /></button>
            <div className="modal-left"><img src={modalArt.img} alt={modalArt.title} /></div>
            <div className="modal-right">
              <span className="font-hand">{modalArt.mood}</span>
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

      {modalVideo && (
        <div className="modal-bg" onClick={() => setModalVideo(null)}>
          <div className="modal-content" style={{background: '#000', height: '60vw', maxHeight: '650px', border: '1px solid rgba(255,255,255,0.2)'}}>
            <button className="modal-close" onClick={() => setModalVideo(null)}><X size={20} /></button>
            <iframe src={`https://www.youtube.com/embed/${modalVideo.youtubeId}?autoplay=1`} style={{width: '100%', height: '100%', border: 'none'}} allowFullScreen />
          </div>
        </div>
      )}
    </div>
  );
}
