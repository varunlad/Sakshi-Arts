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
      {/* Updated text capitalization below */}
      <span className="font-hand reveal-2" style={{ fontSize: '1.6rem', marginBottom: '1.5rem', display: 'block' }}>About the Artist</span>

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
