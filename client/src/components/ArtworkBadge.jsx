import React, { useState } from 'react';
import TermsModal from './TermsModal';

export default function ArtworkBadge() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <div style={{ margin: '1rem 0' }}>
      {/* Hand Painted Tag */}
      <span style={{
        display: 'inline-block', padding: '4px 12px', backgroundColor: 'var(--success-bg)', 
        color: 'var(--success-fg)', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', 
        marginBottom: '0.8rem', border: '1px solid var(--success-border)', fontFamily: 'var(--font-sans, sans-serif)'
      }}>
        ✨ Hand Painted
      </span>
      
      <br />

      {/* T&C Link */}
      <button 
        onClick={() => setIsTermsOpen(true)} 
        style={{ background: 'none', border: 'none', color: 'var(--sunset)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.85rem', fontFamily: 'var(--font-sans, sans-serif)' }}
      >
        View Terms & Conditions
      </button>
      
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}
