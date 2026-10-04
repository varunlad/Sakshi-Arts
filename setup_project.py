#!/usr/bin/env python3
import os

def create_file(path, content):
    dir_name = os.path.dirname(path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"  [+] Updated: {path}")

def main():
    # ==========================================
    # 1. UPDATE HERO.JSX (Remove Session Storage)
    # ==========================================
    create_file("client/src/components/Hero.jsx", """
import React, { useState, useEffect, useRef } from 'react';
import { Instagram, Facebook, Youtube, Mail } from 'lucide-react';
import Hero_Img from '../assets/Images/Hero_Pic.jpeg';

// ✨ UPDATED: Counter will now animate every time the page loads or refreshes
const AnimatedCounter = ({ end, suffix, duration = 2500 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only trigger when the number is actually visible on the screen
        if (entry.isIntersecting) {
          observer.disconnect(); // Stop observing so it only fires once per page load
          let startTimestamp = null;
          
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Smooth ease-out curve so it counts quickly then slows down at the end
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOutProgress * end));
            
            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setCount(end); // Ensure it lands perfectly on the target number
            }
          };
          
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.9 } // 90% of the element must be visible before starting
    );

    if (countRef.current) observer.observe(countRef.current);
    return () => { if (countRef.current) observer.disconnect(); };
  }, [end, duration]);

  return <span ref={countRef} className="stat-value">{count}{suffix}</span>;
};

export default function Hero({ openIG, openFB, openYT, openMail }) {
  return (
    <header className="hero" style={{ padding: '3rem 1.5rem 2rem' }}>
      <div className="reveal-1 standard-img-card hero-pic" style={{ marginBottom: '2rem' }}>
        <img 
          src={Hero_Img}
          alt="Sakshi Lad" 
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80"; }}
        />
      </div>

      <h1 className="font-serif reveal-2" style={{ fontSize: '3rem', color: '#D9886A', marginBottom: '1.5rem' }}>
        Sakshi Lad
      </h1>

      <div className="reveal-3" style={{ textAlign: 'center', maxWidth: '650px', lineHeight: '1.8', color: 'var(--ink)', fontSize: '1.1rem', margin: '0 auto 1.5rem' }}>
        <p style={{ marginBottom: '1rem' }}>Hi, I am Sakshi - an acrylic artist from India.</p>
        <p style={{ marginBottom: '1rem' }}>I create dreamy paintings inspired by sunsets, moonlit skies, oceans, nature, and quiet little moments.</p>
        <p>I started painting as a way to turn the feelings I find in these moments into something tangible. Today, my art is all about creating peaceful little worlds that you can escape into for a while.</p>
      </div>

      {/* Stats Area */}
      <div className="reveal-3 hero-stats">
        <div className="stat-item">
          <AnimatedCounter end={50} suffix="K+" />
          <span className="stat-label">Followers</span>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat-item">
          <AnimatedCounter end={2} suffix="M+" />
          <span className="stat-label">Views</span>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat-item">
          <AnimatedCounter end={15} suffix="K+" />
          <span className="stat-label">Subscribers</span>
        </div>
      </div>

      <div className="reveal-4 social-pills-row">
        <button className="social-pill-icon" onClick={openIG} title="Instagram"><Instagram size={20} /></button>
        <button className="social-pill-icon" onClick={openFB} title="Facebook"><Facebook size={20} /></button>
        <button className="social-pill-icon" onClick={openYT} title="YouTube"><Youtube size={20} /></button>
        <button className="social-pill-icon" onClick={openMail} title="Mail"><Mail size={20} /></button>
      </div>
    </header>
  );
}
""")

if __name__ == "__main__":
    main()