import React, { useState, useEffect } from 'react';

// Fixed the filenames to match what is actually in your assets folder!
import wall_display from '../assets/Images/wall_display.png';
import Img_Nature from '../assets/Images/94264.jpg';
import Img_View from '../assets/Images/94134.jpg';
import Moon from '../assets/Images/Moon.jpeg';

export default function FeaturedImage() {
  const images = [
    wall_display,
    Img_Nature,
    Img_View,
    Moon
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return; 
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="section container text-center" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
      <div className="standard-img-card" style={{ position: 'relative' }}>
        
        {/* Invisible spacer image to establish the correct responsive height dynamically */}
        <img 
          src={images[0]} 
          alt="spacer" 
          style={{ opacity: 0, position: 'relative', zIndex: 0, pointerEvents: 'none' }} 
        />
        
        {/* The overlapping images that crossfade */}
        {images.map((imgSrc, index) => (
          <img 
            key={index}
            src={imgSrc} 
            alt={`Studio View ${index + 1}`} 
            draggable={false} 
            onContextMenu={(e) => e.preventDefault()}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: index === currentIndex ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out', 
              zIndex: index === currentIndex ? 2 : 1
            }}
          />
        ))}
      </div>
    </section>
  );
}
