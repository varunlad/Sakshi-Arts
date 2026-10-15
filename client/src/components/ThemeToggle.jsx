import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { trackEvent } from '../analytics';

const STORAGE_KEY = 'theme';
const BROWSER_BAR_COLORS = { light: '#F4EFEB', dark: '#14100E' };

const readStored = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
};

const systemTheme = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

// Sets the theme on <html>. When `animate` is true the colours fade smoothly.
function applyTheme(theme, animate) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-transition');
    clearTimeout(window.__themeTimer);
    window.__themeTimer = setTimeout(() => root.classList.remove('theme-transition'), 550);
  }
  root.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', BROWSER_BAR_COLORS[theme]);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || readStored() || systemTheme()
  );

  const [toggling, setToggling] = useState(false);
  const toggleTimer = useRef(null);
  useEffect(() => () => clearTimeout(toggleTimer.current), []);

  // Make sure the page and the button agree on first load
  useEffect(() => {
    applyTheme(theme, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the device setting while the visitor has not picked a theme themselves
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (readStored()) return;
      const next = e.matches ? 'dark' : 'light';
      applyTheme(next, true);
      setTheme(next);
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // Keep several open tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        applyTheme(e.newValue, true);
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
    setTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* private mode: ignore */ }
    trackEvent('theme_toggle', { theme: next });

    // restart the pop / ripple animation on every click
    clearTimeout(toggleTimer.current);
    setToggling(false);
    requestAnimationFrame(() => {
      setToggling(true);
      toggleTimer.current = setTimeout(() => setToggling(false), 700);
    });
  };

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      className={`theme-toggle${toggling ? ' is-toggling' : ''}`}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Moon className="theme-icon theme-icon-moon" size={16} strokeWidth={1.7} />
      <Sun className="theme-icon theme-icon-sun" size={16} strokeWidth={1.7} />
    </button>
  );
}
