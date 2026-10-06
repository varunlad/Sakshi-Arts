export const trackEvent = async (eventName, eventData = {}) => {
  try {
    // ✨ UPDATED: Using explicit IP 127.0.0.1 instead of localhost
    await fetch('http://127.0.0.1:5001/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    });
  } catch (error) {
    console.error("Analytics tracking failed (this is non-fatal):", error);
  }
};
