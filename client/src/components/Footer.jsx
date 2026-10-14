import React, { useState, useEffect } from 'react';
import TermsModal from './TermsModal';

export default function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Listen for the popup trigger from anywhere in the app
  useEffect(() => {
    const handleOpen = () => setIsTermsOpen(true);
    window.addEventListener('open-terms', handleOpen);
    return () => window.removeEventListener('open-terms', handleOpen);
  }, []);


  return (
    <>
      <footer className="footer-section container text-center" style={{ padding: '1.5rem 1.5rem 2rem', borderTop: '1px solid #eaeaea', marginTop: '0.5rem' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          
          <h3 className="font-serif" style={{ fontSize: '1.6rem', color: '#333', marginBottom: '0.5rem' }}>
            Sakshi Lad
          </h3>

          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            <p style={{ marginBottom: '0.5rem' }}>© {new Date().getFullYear()} Sakshi Lad. All rights reserved.</p>
            <button 
              onClick={() => setIsTermsOpen(true)} 
              style={{ background: 'none', border: 'none', color: '#D9886A', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
            >
              Terms & Conditions
            </button>
          </div>

        </div>
      </footer>
      
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </>
  );
}
