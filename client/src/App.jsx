import React, { useState, useEffect } from 'react';
import { Compass, Instagram, Play, X, Mail, ArrowRight, MessageCircle } from 'lucide-react';
import { paintings, videos, INSTAGRAM_URL, THREADS_URL, YOUTUBE_URL, EMAIL_ADDRESS } from './data';
import { trackEvent } from './analytics';

export default function App() {
  const [modalArt, setModalArt] = useState(null);
  const [modalVideo, setModalVideo] = useState(null);
  const [mood, setMood] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSticky, setShowSticky] = useState(false);

  const ITEMS_PER_PAGE = 6; 

  useEffect(() => {
    trackEvent('page_view');
    const handleScroll = () => setShowSticky(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [mood]);

  const openIG = () => { trackEvent('instagram_click'); window.open(INSTAGRAM_URL, '_blank'); };
  const openThreads = () => { trackEvent('threads_click'); window.open(THREADS_URL, '_blank'); };

  const smoothScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 60; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const filteredPaintings = paintings.filter(p => mood === 'all' || p.mood === mood);
  const totalPages = Math.ceil(filteredPaintings.length / ITEMS_PER_PAGE);
  const paginatedPaintings = filteredPaintings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div>
      <div className="ambient-bg">
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
        <div className="ambient-glow-3"></div>
      </div>

      {/* 1. HERO */}
      <header className="hero">
        <div className="brand-badge reveal-1" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontFamily: 'var(--font-hand)', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: '#D9886A', letterSpacing: '0.5px' }}>
            Sakshi Lad Art • Original Handmade Acrylic Works
          </span>
        </div>
        
        <h1 className="font-serif reveal-3">Little Worlds, Painted by Hand ♡</h1>
        <p className="hero-p text-center reveal-4">
          Welcome to my studio. I create dreamy, textured acrylic paintings inspired by the quiet beauty of sunsets, oceans, and moonlit skies. Each canvas is a tangible memory, crafted to bring a sense of peace and stillness into your everyday space.
        </p>
        <div className="btn-row reveal-4">
          <button className="btn btn-primary" onClick={() => smoothScrollTo('gallery')}>
            Explore Paintings <Compass size={18} />
          </button>
          <button className="btn btn-outline" onClick={openIG}>
            Instagram <Instagram size={18} color="var(--sunset)" />
          </button>
          <button className="btn btn-outline" onClick={openThreads}>
            Threads <MessageCircle size={18} color="var(--sunset)" />
          </button>
        </div>
      </header>

      {/* 2. GALLERY & SMART PAGINATION */}
      <section id="gallery" className="section container text-center">
        <span className="font-hand">Stories in Colour</span>
        <h2 className="font-serif" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>Moments on Canvas</h2>
        
        <div className="mood-filters">
          {['all', 'sunset', 'ocean', 'moonlight', 'nature'].map(m => (
            <button key={m} className={`mood-btn ${mood === m ? 'active' : ''}`} onClick={() => { setMood(m); trackEvent('mood_filter_click', { meta: { mood: m } }); }}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div className="gallery-grid">
          {paginatedPaintings.map((p) => (
            <div key={p.id} className="art-card" onClick={() => { setModalArt(p); trackEvent('painting_view', { paintingId: p.id }); }}>
              <img src={p.img} alt={p.title} loading="lazy" />
              <div className="art-info">
                <span className="font-mono text-muted" style={{fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px'}}>{p.mood} Collection</span>
                <h3 className="font-serif" style={{fontSize: '1.4rem', margin: '6px 0'}}>{p.title}</h3>
                <p className="text-muted" style={{fontSize: '0.9rem'}}>{p.size} • {p.availability}</p>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn" 
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); smoothScrollTo('gallery'); }}
            >
              Prev
            </button>

            {getPageNumbers().map((p, idx) => (
              p === '...' ? (
                <span key={idx} className="page-ellipsis">...</span>
              ) : (
                <button
                  key={idx}
                  className={`page-btn ${currentPage === p ? 'active' : ''}`}
                  onClick={() => { setCurrentPage(p); smoothScrollTo('gallery'); }}
                >
                  {p}
                </button>
              )
            ))}

            <button 
              className="page-btn" 
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); smoothScrollTo('gallery'); }}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* 3. STORYTELLING */}
      <section className="section container text-center">
        <span className="font-hand">Sometimes a Feeling Becomes a Painting ♡</span>
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

      {/* 4. YOUTUBE SECTION */}
      <section className="section container text-center">
        <span className="font-hand">Watch the Art Come to Life ♡</span>
        <h2 className="font-serif" style={{fontSize: '2.5rem', marginBottom: '2.5rem'}}>Behind the Scenes</h2>
        
        <div className="vid-featured" onClick={() => { setModalVideo(videos[0]); trackEvent('youtube_click'); }}>
          <img src={videos[0].thumbnail} alt="Featured Video" />
          <div className="play-icon"><Play fill="white" size={36} style={{marginLeft: '4px'}}/></div>
        </div>

        <div className="vid-grid">
          {videos.slice(1).map(v => (
            <div key={v.id} className="vid-featured" style={{height: '240px'}} onClick={() => { setModalVideo(v); trackEvent('youtube_click'); }}>
              <img src={v.thumbnail} alt={v.title} />
              <div className="play-icon" style={{width: '55px', height: '55px'}}><Play fill="white" size={26} style={{marginLeft: '2px'}}/></div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CONTACT / COMMISSIONS */}
      <section className="section container text-center">
        <div className="contact-box">
          <span className="font-hand">Connect & Collect</span>
          <h2 className="font-serif" style={{fontSize: '2.8rem', margin: '0.5rem 0 1.2rem'}}>Commissions & Collaborations</h2>
          <p className="text-muted" style={{maxWidth: '550px', margin: '0 auto 2.5rem', lineHeight: '1.7', fontSize: '1.05rem'}}>
            Every painting tells a story. If you're interested in an available piece, want to commission a custom canvas, or discuss a collaboration, I would absolutely love to hear from you.
          </p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={openIG}>
              DM on Instagram <Instagram size={18} />
            </button>
            <button className="btn btn-outline" onClick={openThreads}>
              Connect on Threads <MessageCircle size={18} />
            </button>
            <a href={`mailto:${EMAIL_ADDRESS}`} className="btn btn-outline" onClick={() => trackEvent('email_click')}>
              Email Studio <Mail size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="section text-center text-muted">
        <p className="font-serif text-ink" style={{ fontSize: '1.4rem' }}>Sakshi Lad Art Studio</p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.8rem', letterSpacing: '0.5px' }}>© {new Date().getFullYear()} Sakshi Lad. All original artwork reserved.</p>
      </footer>

      {/* --- PREMIUM MODALS --- */}
      {modalArt && (
        <div className="modal-bg" onClick={() => setModalArt(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalArt(null)}><X size={20}/></button>
            <div className="modal-left"><img src={modalArt.img} alt={modalArt.title}/></div>
            <div className="modal-right">
              <span className="font-hand">{modalArt.mood}</span>
              <h2 className="font-serif" style={{fontSize: '2.4rem', margin: '0.5rem 0'}}>{modalArt.title}</h2>
              <p className="text-muted" style={{margin: '1rem 0 1.5rem', fontSize: '1.05rem'}}>{modalArt.size} • {modalArt.medium}</p>
              <p style={{fontStyle: 'italic', marginBottom: '2.5rem', lineHeight: 1.7, fontSize: '1.1rem', color: 'var(--ink)'}}>"{modalArt.story}"</p>
              <button className="btn btn-primary" style={{width: '100%', justifyContent: 'center', padding: '1rem'}} onClick={() => { trackEvent('painting_inquiry_click'); window.open(INSTAGRAM_URL); }}>
                Enquire on Instagram <Instagram size={18}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {modalVideo && (
        <div className="modal-bg" onClick={() => setModalVideo(null)}>
          <div className="modal-content" style={{background: '#000', height: '60vw', maxHeight: '650px', border: '1px solid rgba(255,255,255,0.2)'}}>
            <button className="modal-close" onClick={() => setModalVideo(null)}><X size={20}/></button>
            <iframe src={`https://www.youtube.com/embed/${modalVideo.youtubeId}?autoplay=1`} style={{width: '100%', height: '100%', border: 'none'}} allowFullScreen />
          </div>
        </div>
      )}

      {/* ✨ COMPACT MOBILE STICKY CTA WITH MESSAGE BUTTON */}
      {showSticky && (
        <div className="sticky-cta">
          <div style={{ lineHeight: '1.2' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Interested in a piece?</span>
            <span className="font-hand" style={{ fontSize: '1.15rem', color: 'var(--sunset-dark)' }}>Let's connect ♡</span>
          </div>
          <button className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', gap: '0.3rem' }} onClick={openIG}>
            <Instagram size={14} /> DM
          </button>
        </div>
      )}
    </div>
  );
}
