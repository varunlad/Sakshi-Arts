import React from 'react';
import { Star } from 'lucide-react';

export default function Reviews() {
  return (
    <section className="section container text-center" style={{ paddingTop: '1rem' }}>
      <span className="font-hand">from my collectors</span>
      <h2 className="font-serif" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Kind Words</h2>
      
      <div className="reviews-container">
        <div className="review-card">
          <div>
            <div style={{ display: 'flex', gap: '4px', color: '#E5987A', marginBottom: '1rem' }}>
              {[...Array(5)].map((_, i) => <Star fill="currentColor" key={i} size={16} />)}
            </div>
            <p style={{ fontStyle: 'italic', lineHeight: '1.7', color: 'var(--ink)', fontSize: '0.95rem' }}>
              "Each piece has such a different feel to it. I love the bold colours, textures, and different styles. You can really see the thought and effort behind every little detail. So happy to have these beautiful pieces of your art with me."
            </p>
          </div>
          <p className="font-hand" style={{ fontSize: '1.3rem', color: '#D9886A', marginTop: '1.5rem' }}>- Pooja</p>
        </div>

        <div className="review-card">
          <div>
            <div style={{ display: 'flex', gap: '4px', color: '#E5987A', marginBottom: '1rem' }}>
              {[...Array(5)].map((_, i) => <Star fill="currentColor" key={i} size={16} />)}
            </div>
            <p style={{ fontStyle: 'italic', lineHeight: '1.7', color: 'var(--ink)', fontSize: '0.95rem' }}>
              "The colours are so vibrant and the details in the waves and sunset are beautiful. The quality is excellent, and they look even better in person. Such lovely beach vibes!"
            </p>
          </div>
          <p className="font-hand" style={{ fontSize: '1.3rem', color: '#D9886A', marginTop: '1.5rem' }}>- Daksha</p>
        </div>

        <div className="review-card">
          <div>
            <div style={{ display: 'flex', gap: '4px', color: '#E5987A', marginBottom: '1rem' }}>
              {[...Array(5)].map((_, i) => <Star fill="currentColor" key={i} size={16} />)}
            </div>
            <p style={{ fontStyle: 'italic', lineHeight: '1.7', color: 'var(--ink)', fontSize: '0.95rem' }}>
              "Loved how it turned out! The creativity and colour combinations brought the painting to life in such a beautiful way."
            </p>
          </div>
          <p className="font-hand" style={{ fontSize: '1.3rem', color: '#D9886A', marginTop: '1.5rem' }}>- Harshal</p>
        </div>
      </div>
    </section>
  );
}
