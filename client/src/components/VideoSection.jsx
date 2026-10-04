import React, { useState, useRef, useEffect } from 'react';

import vid1 from '../assets/Videos/104135.mp4';
import vid2 from '../assets/Videos/104137.mp4';
import vid3 from '../assets/Videos/104142.mp4';

const playlist = [vid1, vid2, vid3];

export default function VideoSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef([]);

  const handleEnded = (index) => {
    if (index === currentIndex) {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  useEffect(() => {
    playlist.forEach((_, i) => {
      if (i === currentIndex) {
        videoRefs.current[i]?.play().catch(e => console.log("Autoplay blocked:", e));
      } else {
        videoRefs.current[i]?.pause();
        if (videoRefs.current[i]) {
          videoRefs.current[i].currentTime = 0; 
        }
      }
    });
  }, [currentIndex]);

  return (
    <section className="section container text-center">
      {/* Updated Heading exactly as requested */}
      <h2 className="font-serif" style={{ fontSize: '2.5rem', marginBottom: '2.5rem' }}>
        Art Process Videos
      </h2>
      
      <div className="video-container">
        {playlist.map((src, index) => (
          <div 
            key={index}
            className={`video-wrapper ${index === currentIndex ? 'active' : 'inactive'}`}
            onClick={() => setCurrentIndex(index)}
          >
            <video 
              ref={(el) => (videoRefs.current[index] = el)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted         
              playsInline
              preload="auto"
              onEnded={() => handleEnded(index)}
              controlsList="nodownload noplaybackrate" 
              disablePictureInPicture 
              onContextMenu={(e) => e.preventDefault()} 
              draggable={false} 
            >
              <source src={src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ))}
      </div>
    </section>
  );
}
