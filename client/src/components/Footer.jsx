import React from 'react';

export default function Footer() {
  return (
    <footer style={{ 
      padding: '2.5rem 1rem', 
      borderTop: '1px solid var(--border)', 
      textAlign: 'center', 
      position: 'relative', 
      zIndex: 10, /* Ensures it renders above any stray elements */
      background: 'transparent'
    }}>
      <p className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--ink)', margin: 0 }}>
        Sakshi Lad Art
      </p>
      <p style={{ fontSize: '0.9rem', marginTop: '0.6rem', letterSpacing: '0.5px', color: 'var(--muted)' }}>
        © {new Date().getFullYear()} Sakshi Lad. All original artwork reserved.
      </p>
    </footer>
  );
}
