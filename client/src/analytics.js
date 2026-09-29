export const trackEvent = (eventType, payload = {}) => {
  try {
    // Use persistent local storage so a visitor is remembered across days
    let sessionId = localStorage.getItem('sakshi_sid');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('sakshi_sid', sessionId);
    }
    
    const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown';
    const language = typeof navigator !== 'undefined' ? navigator.language : 'unknown';
    const referrer = typeof document !== 'undefined' ? document.referrer : '';

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        eventType, 
        sessionId, 
        page: window.location.pathname, 
        screenRes,
        language,
        referrer,
        ...payload 
      })
    });
  } catch (e) {} // Silent fail
};
