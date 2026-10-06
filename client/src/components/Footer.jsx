import React from 'react';
import { Instagram, Facebook, Youtube, Mail } from 'lucide-react';
import { INSTAGRAM_URL, FACEBOOK_URL, YOUTUBE_URL, EMAIL_ADDRESS } from '../data';

export default function Footer() {
  const openIG = () => window.open(INSTAGRAM_URL, '_blank');
  const openFB = () => window.open(FACEBOOK_URL, '_blank');
  const openYT = () => window.open(YOUTUBE_URL, '_blank');
  const openMail = () => { window.location.href = `mailto:${EMAIL_ADDRESS}`; };

  return (
    <footer className="footer-section container text-center" style={{ padding: '3rem 1.5rem', borderTop: '1px solid var(--border)', marginTop: '3rem' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        <h3 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--ink)', marginBottom: '1.2rem' }}>
          Sakshi Lad
        </h3>

        {/* Social Icons Row */}
        <div className="social-pills-row" style={{ justifyContent: 'center', marginBottom: '1.8rem' }}>
          <button className="social-pill-icon" onClick={openIG} title="Instagram"><Instagram size={18} /></button>
          <button className="social-pill-icon" onClick={openFB} title="Facebook"><Facebook size={18} /></button>
          <button className="social-pill-icon" onClick={openYT} title="YouTube"><Youtube size={18} /></button>
          <button className="social-pill-icon" onClick={openMail} title="Mail"><Mail size={18} /></button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          <p>© {new Date().getFullYear()} Sakshi Lad. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}
