import React, { useEffect } from 'react';

export default function TermsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem'
    }} onClick={onClose}>
      
      <div style={{
        backgroundColor: '#fff', borderRadius: '16px', padding: '2rem',
        maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
        position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'left'
      }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem', background: 'none', 
          border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#666'
        }}>
          &times;
        </button>

        <h3 className="font-serif" style={{ fontSize: '1.8rem', color: '#333', marginBottom: '1rem', marginTop: 0 }}>Terms & Conditions</h3>
        
        <div style={{ fontSize: '0.95rem', color: '#444', lineHeight: '1.6', fontFamily: 'var(--font-sans, sans-serif)' }}>
          <p style={{ marginBottom: '1rem' }}><strong>1. Original Artwork:</strong> All paintings are 100% original, hand-painted acrylic works by Sakshi Lad.</p>
          <p style={{ marginBottom: '1rem' }}><strong>2. Commissions:</strong> Custom commission timelines vary based on size and complexity. A 50% non-refundable deposit is required to begin work.</p>
          <p style={{ marginBottom: '1rem' }}><strong>3. Shipping:</strong> Artworks are carefully packaged and shipped globally. The buyer is responsible for any customs or import taxes that may apply.</p>
          <p style={{ marginBottom: '1rem' }}><strong>4. Copyright:</strong> The artist retains all copyright and reproduction rights to the artwork even after sale. Artworks may not be reproduced without written permission.</p>
          <p><strong>5. Returns:</strong> Due to the fragile and custom nature of original art, all sales are final.</p>
        </div>
      </div>
    </div>
  );
}
