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
    print("✨ Removing Sticky CTA and Hero Compass Button from the codebase...")
    print("=" * 60)

    # ==========================================
    # 1. UPDATE HERO COMPONENT (Remove the compass button)
    # ==========================================
    create_file("client/src/components/Hero.jsx", """
import React from 'react';
import { Instagram, Facebook, Youtube, Mail } from 'lucide-react';
import Hero_Img from '../assets/Images/Hero_Pic.jpeg';

export default function Hero({ openIG, openFB, openYT, openMail }) {
  return (
    <header className="hero" style={{ padding: '3rem 1.5rem 2rem' }}>
      <div className="reveal-1 standard-img-card hero-pic" style={{ marginBottom: '2rem' }}>
        <img 
          src={Hero_Img}
          alt="Sakshi Lad" 
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80"; }}
        />
      </div>

      <h2 className="font-serif reveal-2" style={{ fontSize: '2.5rem', color: '#D9886A', marginBottom: '0.2rem' }}>Sakshi Lad Art</h2>
      <span className="font-hand reveal-2" style={{ fontSize: '1.6rem', marginBottom: '1.5rem', display: 'block' }}>about the artist</span>

      <div className="reveal-3" style={{ textAlign: 'center', maxWidth: '650px', lineHeight: '1.8', color: 'var(--ink)', fontSize: '1.1rem', margin: '0 auto 2rem' }}>
        <p style={{ marginBottom: '1rem' }}>Hi, I am Sakshi - an acrylic artist from India.</p>
        <p style={{ marginBottom: '1rem' }}>I create dreamy paintings inspired by sunsets, moonlit skies, oceans, nature, and quiet little moments.</p>
        <p>I started painting as a way to turn the feelings I find in these moments into something tangible. Today, my art is all about creating peaceful little worlds that you can escape into for a while.</p>
      </div>

      <div className="reveal-4 social-pills-row">
        <button className="social-pill-icon" onClick={openIG} title="Instagram"><Instagram size={20} /></button>
        <button className="social-pill-icon" onClick={openFB} title="Facebook"><Facebook size={20} /></button>
        <button className="social-pill-icon" onClick={openYT} title="YouTube"><Youtube size={20} /></button>
        <button className="social-pill-icon" onClick={openMail} title="Mail"><Mail size={20} /></button>
      </div>
    </header>
  );
}
""")

    # ==========================================
    # 2. UPDATE APP.JSX (Remove the Sticky CTA completely)
    # ==========================================
    create_file("client/src/App.jsx", """
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
""")

    print("\n✅ Success! Both the Sticky CTA and the Explore button have been completely removed from your codebase.")

if __name__ == "__main__":
    main()