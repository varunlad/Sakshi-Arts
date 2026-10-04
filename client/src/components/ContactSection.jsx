import React from 'react';
import { Instagram, Facebook, Youtube, Mail } from 'lucide-react';

export default function ContactSection({ openIG, openFB, openYT, openMail }) {
  return (
    <section className="section container text-center">
      <div className="contact-box">
        <h2 className="font-serif" style={{fontSize: '2.5rem', marginBottom: '1.5rem'}}>
          Art Commissions & Collaborations
        </h2>
        
        <p className="text-muted" style={{maxWidth: '550px', margin: '0 auto 2.5rem', lineHeight: '1.7', fontSize: '1.05rem'}}>
          Every painting tells a story. If you're interested in an available piece, want to commission a custom canvas, or discuss a collaboration, I would absolutely love to hear from you.
        </p>
        <div className="social-pills-row" style={{ justifyContent: 'center' }}>
          <button className="social-pill-icon" onClick={openIG} title="Instagram"><Instagram size={20} /></button>
          <button className="social-pill-icon" onClick={openFB} title="Facebook"><Facebook size={20} /></button>
          <button className="social-pill-icon" onClick={openYT} title="YouTube"><Youtube size={20} /></button>
          <button className="social-pill-icon" onClick={openMail} title="Mail"><Mail size={20} /></button>
        </div>
      </div>
    </section>
  );
}
