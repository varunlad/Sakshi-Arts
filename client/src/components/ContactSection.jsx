import React, { useState } from 'react';
import { Instagram, Facebook, Youtube, Mail } from 'lucide-react';

export default function ContactSection({ openIG, openFB, openYT, openMail }) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    
    try {
      const response = await fetch('http://127.0.0.1:5001/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setStatus('Message sent successfully! I will get back to you soon.');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error(error);
      setStatus('An error occurred. Please try reaching out via social media.');
    }
  };

  return (
    <section className="section container text-center">
      <div className="contact-box" style={{ maxWidth: '650px' }}>
        <h2 className="font-serif" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>
          Commissions
        </h2>
        
        <p className="text-muted" style={{maxWidth: '550px', margin: '0 auto 2rem', lineHeight: '1.7', fontSize: '1.05rem'}}>
          Every painting tells a story. If you're interested in an available piece, want to commission a custom canvas, or discuss a collaboration, I would absolutely love to hear from you.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Name</label>
            <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your Name" />
          </div>
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Email</label>
            <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="your.email@example.com" />
          </div>
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Message</label>
            <textarea className="form-input" rows="4" required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Tell me about what you're looking for..."></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem' }}>Send Message</button>
          
          {status && <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.95rem', color: status.includes('success') ? '#2E7D32' : '#D9886A' }}>{status}</p>}
        </form>

        <div className="stat-divider" style={{ width: '100%', height: '1px', margin: '0 auto 2rem' }}></div>

        {/* ✨ UPDATED TEXT HERE */}
        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '500' }}>Connect across platforms:</p>
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
