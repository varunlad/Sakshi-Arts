import React from 'react';

export default function Footer() {
  return (
    <footer className="footer-section container text-center" style={{ padding: '3rem 1.5rem', borderTop: '1px solid var(--border)', marginTop: '3rem' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        <h3 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>
          Sakshi Lad
        </h3>

        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          <p>© {new Date().getFullYear()} Sakshi Lad. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}
