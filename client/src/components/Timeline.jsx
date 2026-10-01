import React from 'react';

export default function Timeline() {
  return (
    <section className="section container text-center">
      <span className="font-hand">Sometimes a Feeling Becomes a Painting</span>
      <h2 className="font-serif" style={{fontSize: '2.5rem', margin: '0.5rem 0'}}>The Studio Process</h2>
      <div className="timeline">
        {['The Inspiration', 'Color & Feeling', 'Brushes on Canvas'].map((t, i) => (
          <div key={i} className="time-step">
            <span className="font-mono text-muted" style={{fontSize: '0.85rem', letterSpacing: '1px'}}>STEP 0{i+1}</span>
            <h4 className="font-serif" style={{margin: '0.8rem 0 0', fontSize: '1.2rem'}}>{t}</h4>
          </div>
        ))}
      </div>
    </section>
  );
}
