import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { trackEvent } from '../analytics';
import { getShareUrl } from './ShareButton';

// The text that gets pasted along with the picture (same message as the Share button)
function buildDetails(painting) {
  return `Check out "${painting.title}" — an original painting by Sakshi Lad 🎨\n${getShareUrl(painting)}`;
}

// Clipboard only accepts PNG images, so convert (and cap the size) via a canvas
async function toPngBlob(src) {
  const res = await fetch(src);
  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png failed'))), 'image/png')
  );
}

async function copyTextOnly(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
}

export default function CopyButton({ painting, variant = 'card' }) {
  const [state, setState] = useState('idle'); // idle | done | text | error
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const flash = (s) => {
    clearTimeout(timerRef.current);
    setState(s);
    timerRef.current = setTimeout(() => setState('idle'), 2200);
  };

  const handleClick = async (e) => {
    e.stopPropagation();
    const details = buildDetails(painting);
    let result = 'error';

    // 1) Picture + details together (works on Chrome, Edge, Safari, recent Firefox)
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': toPngBlob(painting.img),
            'text/plain': new Blob([details], { type: 'text/plain' })
          })
        ]);
        result = 'done';
      } catch {
        result = 'error';
      }
    }

    // 2) Fallback: details only
    if (result !== 'done') {
      result = (await copyTextOnly(details)) ? 'text' : 'error';
    }

    trackEvent('copy_details', { paintingTitle: painting.title, result });
    flash(result);
  };

  const label =
    state === 'done' ? 'Copied!' :
    state === 'text' ? 'Details copied (no image)' :
    state === 'error' ? 'Copy failed' : '';

  return (
    <button
      type="button"
      className={`share-btn copy-btn copy-btn-${variant}`}
      onClick={handleClick}
      aria-label={`Copy ${painting.title} image and details`}
      title="Copy image & details"
    >
      {state === 'done' || state === 'text'
        ? <Check size={variant === 'modal' ? 18 : 16} strokeWidth={1.8} />
        : <Copy size={variant === 'modal' ? 18 : 16} strokeWidth={1.6} />}
      {label && <span className="copy-tip" role="status">{label}</span>}
    </button>
  );
}
