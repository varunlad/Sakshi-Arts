import React from 'react';

export default function Footer() {
  return (
    <footer className="section text-center text-muted">
      <p className="font-serif text-ink" style={{ fontSize: '1.4rem' }}>Sakshi Lad Art Studio</p>
      <p style={{ fontSize: '0.85rem', marginTop: '0.8rem', letterSpacing: '0.5px' }}>© {new Date().getFullYear()} Sakshi Lad. All original artwork reserved.</p>
    </footer>
  );
}
