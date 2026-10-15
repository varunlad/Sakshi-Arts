#!/usr/bin/env python3
"""
apply_theme.py - adds a polished Light / Dark mode to the Sakshi Art client.

Usage (from your client folder, the one that contains src/ and index.html):
    python apply_theme.py                 # auto-finds src
    python apply_theme.py path/to/src     # or give the path to the client's src folder

What you get
  * A small 30px frosted-glass sun/moon button (top-right) that switches theme with a smooth
    colour fade, a spinning icon swap and a springy pop + ripple.
  * First visit follows the visitor's device setting (light/dark); their choice is then
    remembered. If they never chose, the site keeps following the device setting.
  * No white flash on load (the theme is set before the page paints).
  * All colours moved to CSS variables: gallery, cards, popup, share menu, forms, toasts,
    terms popup, footer - everything switches together and stays readable.

What the script changes (backups saved as <file>.bak, safe to run more than once):
  index.html                      - theme start-up snippet in <head>
  src/index.css                   - hard-coded colours -> variables, plus the theme block
  src/App.jsx                     - mounts the toggle, popup colours -> variables
  src/components/*.jsx            - hard-coded colours -> variables
  src/components/ThemeToggle.jsx  - NEW
"""
import os, sys, shutil

THEME_TOGGLE = r"""import React, { useState, useEffect, useRef } from 'react';
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
"""

THEME_CSS = r"""/* ===== Theme (light / dark) ===== */
/* Every colour on the site comes from these variables. The light values below match the
   original design; the dark values live in the [data-theme="dark"] block. */
:root {
  color-scheme: light;
  --ink-soft: #444444;
  --glow-1: rgba(240, 185, 155, 0.8);
  --glow-2: rgba(195, 215, 190, 0.7);
  --glow-3: rgba(220, 200, 235, 0.5);
  --btn-bg: var(--ink);
  --btn-fg: #ffffff;
  --btn-border: transparent;
  --active-bg: var(--ink);
  --active-fg: var(--canvas);
  --tag-bg: rgba(255, 255, 255, 0.85);
  --price: #2E7D32;
  --success-fg: #2E7D32;
  --success-bg: #E8F5E9;
  --success-border: #C8E6C9;
  --danger: #D93025;
  --error-bg: #FDECE8;
  --promo-bg: #FDECE8;
  --sold-bg: #EAE5DF;
  --star: #E5987A;
  --modal-bg: rgba(250, 247, 242, 0.95);
  --modal-solid: #ffffff;
  --modal-border: rgba(255, 255, 255, 0.9);
  --modal-img-bg: rgba(224, 217, 207, 0.5);
  --input-bg: rgba(255, 255, 255, 0.6);
  --input-bg-focus: #ffffff;
  --hover-bg: rgba(0, 0, 0, 0.06);
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --canvas: #14100E;
  --surface: #1E1815;
  --ink: #F3ECE5;
  --ink-soft: #D8CEC5;
  --muted: #A89A8D;
  --border: #3A302A;
  --sunset-dark: #EBAA90;               /* lighter rust, used for emphasis text */

  --glass-bg: rgba(38, 31, 27, 0.62);
  --glass-border: rgba(255, 255, 255, 0.09);
  --glass-shadow: 0 20px 40px rgba(0, 0, 0, 0.40), inset 0 0 20px rgba(255, 255, 255, 0.03);

  --glow-1: rgba(217, 136, 106, 0.22);
  --glow-2: rgba(110, 150, 120, 0.15);
  --glow-3: rgba(130, 100, 175, 0.18);

  --btn-bg: #3A2F29;
  --btn-fg: #F6EFE8;
  --btn-border: rgba(255, 255, 255, 0.12);
  --active-bg: var(--sunset);
  --active-fg: #1A1411;
  --tag-bg: rgba(24, 19, 16, 0.72);

  --price: #7FCB84;
  --success-fg: #86C98A;
  --success-bg: rgba(76, 175, 80, 0.14);
  --success-border: rgba(76, 175, 80, 0.32);
  --danger: #FF8A80;
  --error-bg: rgba(255, 138, 128, 0.14);
  --promo-bg: rgba(217, 136, 106, 0.16);
  --sold-bg: rgba(255, 255, 255, 0.08);
  --star: #E5987A;

  --modal-bg: rgba(30, 24, 21, 0.96);
  --modal-solid: #221B17;
  --modal-border: rgba(255, 255, 255, 0.08);
  --modal-img-bg: rgba(0, 0, 0, 0.25);
  --input-bg: rgba(255, 255, 255, 0.05);
  --input-bg-focus: rgba(255, 255, 255, 0.09);
  --hover-bg: rgba(255, 255, 255, 0.09);
}

/* Share menu follows the theme */
.share-sheet { background: var(--modal-bg); border-color: var(--modal-border); }
.share-sheet-close { background: var(--hover-bg); color: var(--ink); }
.share-option:last-child .share-icon { background: var(--btn-bg) !important; }
.share-notice { color: var(--success-fg); }

/* Soft dark-mode touches */
:root[data-theme="dark"] .modal-bg,
:root[data-theme="dark"] .share-overlay { background: rgba(0, 0, 0, 0.72); }
:root[data-theme="dark"] .art-card img,
:root[data-theme="dark"] .standard-img-card img,
:root[data-theme="dark"] .modal-left img { filter: brightness(0.94); }
:root[data-theme="dark"] .form-input::placeholder { color: var(--muted); }

/* Theme toggle button (fixed, top-right): 30px frosted-glass circle, no border */
.theme-toggle { position: fixed; top: 0.9rem; right: 0.9rem; z-index: 900; width: 30px; height: 30px; padding: 0; border: none; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; background: rgba(24, 18, 14, 0.38); backdrop-filter: blur(10px) saturate(140%); -webkit-backdrop-filter: blur(10px) saturate(140%); box-shadow: 0 2px 12px rgba(0, 0, 0, 0.20); -webkit-tap-highlight-color: transparent; transition: background-color 0.3s ease; }
.theme-toggle:hover { background: rgba(24, 18, 14, 0.52); }
:root[data-theme="dark"] .theme-toggle { background: rgba(255, 255, 255, 0.13); box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35); }
:root[data-theme="dark"] .theme-toggle:hover { background: rgba(255, 255, 255, 0.21); }
.theme-toggle:focus-visible { outline: 2px solid var(--sunset); outline-offset: 3px; }
.theme-toggle::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.55); opacity: 0; pointer-events: none; }
.theme-icon { position: absolute; transition: transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease; }
.theme-icon-moon { opacity: 1; transform: rotate(0deg) scale(1); }
.theme-icon-sun { opacity: 0; transform: rotate(-140deg) scale(0.3); }
:root[data-theme="dark"] .theme-icon-moon { opacity: 0; transform: rotate(140deg) scale(0.3); }
:root[data-theme="dark"] .theme-icon-sun { opacity: 1; transform: rotate(0deg) scale(1); }

/* Click animation: the button pops like a spring and a soft ripple fades out */
@keyframes themePop { 0% { transform: scale(1); } 35% { transform: scale(0.78); } 70% { transform: scale(1.14); } 100% { transform: scale(1); } }
@keyframes themeRipple { 0% { opacity: 0.55; transform: scale(1); } 100% { opacity: 0; transform: scale(2.8); } }
.theme-toggle.is-toggling { animation: themePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.theme-toggle.is-toggling::after { animation: themeRipple 0.65s ease-out; }
@media (max-width: 768px) { .theme-toggle { top: 0.7rem; right: 0.7rem; } }

/* Smooth cross-fade while switching (class is added for ~0.5s by ThemeToggle) */
html.theme-transition,
html.theme-transition *:not(img):not(.theme-icon),
html.theme-transition *:not(img):not(.theme-icon)::before,
html.theme-transition *:not(img):not(.theme-icon)::after {
  transition: background-color 0.45s ease, color 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease, fill 0.45s ease, stroke 0.45s ease !important;
  transition-delay: 0s !important;
}
@media (prefers-reduced-motion: reduce) {
  html.theme-transition, html.theme-transition * { transition: none !important; }
  .theme-icon { transition: none; }
  .theme-toggle.is-toggling, .theme-toggle.is-toggling::after { animation: none; }
}
/* ===== End theme ===== */
"""

CSS_START = "/* ===== Theme (light / dark) ===== */"
CSS_END = "/* ===== End theme ===== */"

HEAD_MARKER = "<!-- theme-init -->"
HEAD_SNIPPET = """    <!-- theme-init -->
    <meta name="color-scheme" content="light dark">
    <meta name="theme-color" content="#F4EFEB">
    <script>
      (function () {
        try {
          var stored = localStorage.getItem('theme');
          var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
          var m = document.querySelector('meta[name="theme-color"]');
          if (m) m.setAttribute('content', dark ? '#14100E' : '#F4EFEB');
        } catch (e) {}
      })();
    </script>
  </head>"""

# (old text, new text) replacements, per file (paths relative to src/)
CSS_EDITS = [
    ("pointer-events: none; background: #F4EFEB; }",
     "pointer-events: none; background: var(--canvas); transition: background-color 0.4s ease; }"),
    ("rgba(240, 185, 155, 0.8) 0%", "var(--glow-1) 0%"),
    ("rgba(195, 215, 190, 0.7) 0%", "var(--glow-2) 0%"),
    ("rgba(220, 200, 235, 0.5) 0%", "var(--glow-3) 0%"),
    (".btn-primary { background: var(--ink); color: #fff; }",
     ".btn-primary { background: var(--btn-bg); color: var(--btn-fg); border-color: var(--btn-border); }"),
    (".page-btn.active { background: var(--ink); color: var(--canvas); border-color: var(--ink);",
     ".page-btn.active { background: var(--active-bg); color: var(--active-fg); border-color: var(--active-bg);"),
    ("background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px)",
     "background: var(--tag-bg); backdrop-filter: blur(8px)"),
    (".price-text { font-size: 1.1rem; color: #2E7D32;", ".price-text { font-size: 1.1rem; color: var(--price);"),
    ("background: rgba(250, 247, 242, 0.95); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.9);",
     "background: var(--modal-bg); backdrop-filter: blur(30px); border: 1px solid var(--modal-border);"),
    (".modal-left { flex: 1; background: rgba(224, 217, 207, 0.5);",
     ".modal-left { flex: 1; background: var(--modal-img-bg);"),
    ("background: rgba(255, 255, 255, 0.6);\n  font-family: var(--font-sans);",
     "background: var(--input-bg);\n  font-family: var(--font-sans);"),
    ("  background: #fff;\n  box-shadow: 0 0 0 3px rgba(217, 136, 106, 0.15);",
     "  background: var(--input-bg-focus);\n  box-shadow: 0 0 0 3px rgba(217, 136, 106, 0.15);"),
]

JSX_EDITS = {
    "components/TermsModal.jsx": [
        ("backgroundColor: '#fff', borderRadius: '16px'", "backgroundColor: 'var(--modal-solid)', borderRadius: '16px'"),
        ("fontSize: '1.5rem', color: '#666'", "fontSize: '1.5rem', color: 'var(--muted)'"),
        ("fontSize: '1.8rem', color: '#333'", "fontSize: '1.8rem', color: 'var(--ink)'"),
        ("color: '#444', lineHeight", "color: 'var(--ink-soft)', lineHeight"),
    ],
    "components/ArtworkBadge.jsx": [
        ("backgroundColor: '#e8f5e9'", "backgroundColor: 'var(--success-bg)'"),
        ("color: '#2e7d32'", "color: 'var(--success-fg)'"),
        ("border: '1px solid #c8e6c9'", "border: '1px solid var(--success-border)'"),
        ("color: '#D9886A'", "color: 'var(--sunset)'"),
    ],
    "components/Reviews.jsx": [
        ("color: '#E5987A'", "color: 'var(--star)'"),
        ("color: '#D9886A'", "color: 'var(--sunset)'"),
    ],
    "components/Hero.jsx": [
        ('color: "#D9886A"', 'color: "var(--sunset)"'),
    ],
    "components/Footer.jsx": [
        ("1px solid #eaeaea", "1px solid var(--border)"),
        ("color: '#333'", "color: 'var(--ink)'"),
        ("color: '#666'", "color: 'var(--muted)'"),
        ("color: '#D9886A'", "color: 'var(--sunset)'"),
    ],
    "components/ContactSection.jsx": [
        ("'#d93025'", "'var(--danger)'"),
        ("'#e8f5e9'", "'var(--success-bg)'"),
        ("'#fdece8'", "'var(--error-bg)'"),
        ("'#2e7d32'", "'var(--success-fg)'"),
    ],
    "components/Gallery.jsx": [
        ("'#EAE5DF'", "'var(--sold-bg)'"),
        ("'#E8F5E9'", "'var(--success-bg)'"),
        ("'#2E7D32'", "'var(--success-fg)'"),
    ],
    "App.jsx": [
        ('"#2E7D32"', '"var(--success-fg)"'),
        ('background: "#FDECE8"', 'background: "var(--promo-bg)"'),
        ('color: "#D9886A"', 'color: "var(--sunset)"'),
    ],
    # share menu: copy-link icon should follow the theme (only present if share feature is installed)
    "components/ShareButton.jsx": [
        ("style={{ background: 'var(--ink)' }}", "style={{ background: 'var(--btn-bg, var(--ink))' }}"),
    ],
}


def find_src():
    cands = [sys.argv[1]] if len(sys.argv) > 1 else ["src", "client/src", "client/client/src"]
    for c in cands:
        if os.path.isfile(os.path.join(c, "App.jsx")) and os.path.isfile(os.path.join(c, "index.css")):
            return c
    sys.exit("Could not find the src folder. Run: python apply_theme.py path/to/client/src")


def read(p):
    with open(p, "r", encoding="utf-8", newline="") as f:
        return f.read()


def write(p, t):
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(t)


def backup(p):
    if os.path.exists(p) and not os.path.exists(p + ".bak"):
        shutil.copy2(p, p + ".bak")


def edit_file(path, edits, label):
    """Apply exact-text replacements, keeping the file's line endings."""
    if not os.path.exists(path):
        print(f"  - {label}: file not found, skipped")
        return
    text = read(path)
    crlf = "\r\n" in text
    t = text.replace("\r\n", "\n")
    changed, missing = 0, []
    for old, new in edits:
        n = t.count(old)
        if n:
            t = t.replace(old, new)
            changed += n
        elif new not in t:
            missing.append(old.strip().split("\n")[0][:60])
    if changed:
        backup(path)
        write(path, t.replace("\n", "\r\n") if crlf else t)
    msg = f"  + {label}: {changed} colour(s) switched to theme variables" if changed else f"  - {label}: already themed"
    if missing:
        msg += f"  (not found, check manually: {'; '.join(missing)})"
    print(msg)


def update_theme_css(path):
    text = read(path)
    crlf = "\r\n" in text
    t = text.replace("\r\n", "\n")
    s = t.find(CSS_START)
    if s != -1:
        e = t.find(CSS_END, s)
        if e != -1:
            t = t[:s].rstrip() + "\n\n" + t[e + len(CSS_END):].lstrip("\n")
        else:
            t = t[:s].rstrip() + "\n"
    t = t.rstrip() + "\n\n" + THEME_CSS.strip() + "\n"
    backup(path)
    write(path, t.replace("\n", "\r\n") if crlf else t)
    print("  + index.css: theme block written")


def patch_html(path):
    if not os.path.exists(path):
        print("  ! index.html not found next to src/ - add the theme snippet manually (see below)")
        print(HEAD_SNIPPET)
        return
    text = read(path)
    if HEAD_MARKER in text:
        print("  - index.html: already has the theme snippet")
        return
    crlf = "\r\n" in text
    t = text.replace("\r\n", "\n")
    if "</head>" not in t:
        sys.exit("ERROR: no </head> found in index.html")
    t = t.replace("  </head>", HEAD_SNIPPET, 1) if "  </head>" in t else t.replace("</head>", HEAD_SNIPPET.lstrip(), 1)
    backup(path)
    write(path, t.replace("\n", "\r\n") if crlf else t)
    print("  + index.html: theme start-up snippet added")


def main():
    src = find_src()
    print(f"Using: {os.path.abspath(src)}")

    # 1. ThemeToggle component
    p = os.path.join(src, "components", "ThemeToggle.jsx")
    backup(p)
    write(p, THEME_TOGGLE)
    print("  + components/ThemeToggle.jsx: written")

    # 2. mount the toggle in App.jsx
    app = os.path.join(src, "App.jsx")
    text = read(app)
    if "ThemeToggle" not in text:
        crlf = "\r\n" in text
        t = text.replace("\r\n", "\n")
        a1 = 'import Footer from "./components/Footer";'
        a2 = '<div className="ambient-bg">'
        if a1 not in t or a2 not in t:
            sys.exit("ERROR: App.jsx differs from what this script expects - nothing was changed there.")
        t = t.replace(a1, a1 + '\nimport ThemeToggle from "./components/ThemeToggle";', 1)
        t = t.replace(a2, "<ThemeToggle />\n      " + a2, 1)
        backup(app)
        write(app, t.replace("\n", "\r\n") if crlf else t)
        print("  + App.jsx: ThemeToggle mounted")
    else:
        print("  - App.jsx: ThemeToggle already mounted")

    # 3. colours -> variables
    for rel, edits in JSX_EDITS.items():
        edit_file(os.path.join(src, rel), edits, rel)
    edit_file(os.path.join(src, "index.css"), CSS_EDITS, "index.css (existing rules)")

    # 4. theme variables + toggle styles
    update_theme_css(os.path.join(src, "index.css"))

    # 5. no-flash start-up snippet
    patch_html(os.path.join(os.path.dirname(os.path.abspath(src)), "index.html"))

    print("\nDone. Restart `npm run dev` if it is running, then hard-refresh (Ctrl+Shift+R).")


if __name__ == "__main__":
    main()