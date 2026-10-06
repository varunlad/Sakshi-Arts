export const trackEvent = async (eventName, eventData = {}) => {
  try {
    // ✨ UPDATED: Using explicit IP 127.0.0.1 instead of localhost
    await fetch('https://sakshi-arts-backend.onrender.com/api/analytics', {
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
