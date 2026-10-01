import React from 'react';
import { Play } from 'lucide-react';
import { videos } from '../data';
import { trackEvent } from '../analytics';

export default function YouTubeSection({ setModalVideo }) {
  return (
    <section className="section container text-center">
      <span className="font-hand">Watch the Art Come to Life</span>
      <h2 className="font-serif" style={{fontSize: '2.5rem', marginBottom: '2.5rem'}}>Behind the Scenes</h2>
      
      <div className="vid-featured" onClick={() => { setModalVideo(videos[0]); trackEvent('youtube_click'); }}>
        <img src={videos[0].thumbnail} alt="Featured Video" />
        <div className="play-icon"><Play fill="white" size={36} style={{marginLeft: '4px'}} /></div>
      </div>

      <div className="vid-grid">
        {videos.slice(1).map(v => (
          <div key={v.id} className="vid-featured" style={{height: '240px'}} onClick={() => { setModalVideo(v); trackEvent('youtube_click'); }}>
            <img src={v.thumbnail} alt={v.title} />
            <div className="play-icon" style={{width: '55px', height: '55px'}}><Play fill="white" size={26} style={{marginLeft: '2px'}} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}
