import React, { useState, useEffect } from 'react';
import FeaturedImageReview from '../assets/Images/Review_Img.jpg';

export default function FeaturedImage() {
  // Add your images to this array. 
  // I added placeholders alongside your local image so you can see the transition working!
  const images = [
    FeaturedImageReview,
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&q=80",
    "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&q=80"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Change the image every 2.5 seconds (2500 milliseconds)
  useEffect(() => {
    if (images.length <= 1) return; // No need to slide if there's only 1 image
    
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
              transition: 'opacity 0.8s ease-in-out', /* Smooth premium fade */
              zIndex: index === currentIndex ? 2 : 1
            }}
          />
        ))}
      </div>
    </section>
  );
}
