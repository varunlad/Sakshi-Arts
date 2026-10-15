import React, { useState } from 'react';
import { Instagram, Facebook, Youtube, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContactSection({ openIG, openFB, openYT }) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://sakshi-arts-backend.onrender.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        showToast('Email sent successfully! I will get back to you soon.', 'success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        showToast('Failed to send email. Please try reaching out via social media.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Connection failed. Please check your internet or try again later.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section container text-center">
      <div className="contact-box" style={{ maxWidth: '650px', position: 'relative', margin: '0 auto' }}>
        <h2 className="font-serif" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>
          Contact
        </h2>
        
        <p className="text-muted" style={{maxWidth: '550px', margin: '0 auto 2rem', lineHeight: '1.7', fontSize: '1.05rem'}}>
         If you're interested in an available piece, want to commission a custom canvas, or discuss a collaboration, I would absolutely love to hear from you.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Name</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Your Name" 
              disabled={isSubmitting}
              maxLength={50}
              pattern="^[a-zA-Z\s]{2,50}$"
              title="Name should only contain letters and spaces (2-50 characters)"
            />
          </div>
          
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Email</label>
            <input 
              type="email" 
              className="form-input" 
              required 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="your.email@example.com" 
              disabled={isSubmitting}
              maxLength={100}
              pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
              title="Please enter a valid email address"
            />
          </div>
          
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Message</label>
            <textarea 
              className="form-input" 
              rows="4" 
              required 
              value={formData.message} 
              onChange={e => setFormData({...formData, message: e.target.value})} 
              placeholder="Tell me about what you're looking for..." 
              disabled={isSubmitting}
              maxLength={500}
            ></textarea>
            {/* Real-time character counter */}
            <div style={{ 
              textAlign: 'right', 
              fontSize: '0.75rem', 
              color: formData.message.length >= 500 ? 'var(--danger)' : 'var(--muted)', 
              marginTop: '4px' 
            }}>
              {formData.message.length}/500
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              padding: '0.8rem', 
              fontSize: '1rem', 
              marginTop: '0.5rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 size={20} className="animate-spin" /> Please wait, sending...</>
            ) : (
              'Send Email'
            )}
          </button>
        </form>

        <div className="stat-divider" style={{ width: '100%', height: '1px', margin: '0 auto 2rem', backgroundColor: 'var(--border)' }}></div>

        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '500' }}>Connect across platforms</p>
        <div className="social-pills-row">
          <button className="social-pill-icon" onClick={openIG} title="Instagram"><Instagram size={20} /></button>
          <button className="social-pill-icon" onClick={openFB} title="Facebook"><Facebook size={20} /></button>
          <button className="social-pill-icon" onClick={openYT} title="YouTube"><Youtube size={20} /></button>
        </div>
      </div>

      {toast && (
        <div className={`toast-notification toast-${toast.type}`} style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
          color: toast.type === 'success' ? 'var(--success-fg)' : 'var(--danger)',
          padding: '12px 24px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, fontWeight: 'bold'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {toast.message}
        </div>
      )}
    </section>
  );
}
