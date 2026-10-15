import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Facebook, Instagram, Link as LinkIcon, Check, MessageCircle, X } from 'lucide-react';
import { trackEvent } from '../analytics';

// Link that opens this painting directly on the site
export const getShareUrl = (painting) =>
  `${window.location.origin}/?painting=${painting.id}`;

const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(pointer: coarse)').matches;

// Turn the painting image into a File so phones can share the actual picture
async function getImageFile(painting) {
  try {
    const res = await fetch(painting.img);
    const blob = await res.blob();
    const ext = (blob.type.split('/')[1] || 'jpeg').replace('jpeg', 'jpg');
    const safeName = painting.title.replace(/[^a-z0-9]+/gi, '_');
    return new File([blob], `${safeName}.${ext}`, { type: blob.type });
  } catch {
    return null;
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / insecure contexts
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

export default function ShareButton({ painting, variant = 'card' }) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState(null); // { msg, instagram }
  const fileRef = useRef(null);
  const timerRef = useRef(null);

  const url = getShareUrl(painting);
  const text = `Check out "${painting.title}" — an original painting by Sakshi Lad 🎨`;

  // On phones, load the image ahead of time so the native share sheet can open
  // instantly on tap (iOS Safari rejects share() if we wait for a download first).
  useEffect(() => {
    fileRef.current = null;
    if (typeof navigator !== 'undefined' && navigator.share && isTouchDevice()) {
      let cancelled = false;
      getImageFile(painting).then((f) => { if (!cancelled) fileRef.current = f; });
      return () => { cancelled = true; };
    }
  }, [painting.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close the menu with the Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const flash = (msg, instagram = false) => {
    clearTimeout(timerRef.current);
    setNotice({ msg, instagram });
    timerRef.current = setTimeout(() => setNotice(null), instagram ? 8000 : 2500);
  };

  const track = (method) =>
    trackEvent('share_click', { paintingTitle: painting.title, method });

  // Main button: on phones use the native share sheet (WhatsApp, Instagram, Facebook...),
  // on desktop show our own menu.
  const handleMainClick = async (e) => {
    e.stopPropagation();

    if (navigator.share && isTouchDevice()) {
      try {
        const file = fileRef.current;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: painting.title, text: `${text}\n${url}` });
        } else {
          await navigator.share({ title: painting.title, text, url });
        }
        track('native');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // user closed the sheet
        // any other error: fall through to our own menu
      }
    }
    setNotice(null);
    setOpen(true);
  };

  const close = (e) => {
    if (e) e.stopPropagation();
    setOpen(false);
  };

  const shareWhatsApp = (e) => {
    e.stopPropagation();
    track('whatsapp');
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener,noreferrer');
  };

  const shareFacebook = (e) => {
    e.stopPropagation();
    track('facebook');
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // Instagram has no web "share link" URL, so copy the link and let the user open Instagram
  const shareInstagram = async (e) => {
    e.stopPropagation();
    track('instagram');
    const ok = await copyText(url);
    flash(ok ? 'Link copied! Paste it in an Instagram story or DM.' : 'Could not copy link', ok);
  };

  const copyLink = async (e) => {
    e.stopPropagation();
    track('copy_link');
    const ok = await copyText(url);
    flash(ok ? 'Link copied!' : 'Could not copy link');
  };

  const copied = notice && notice.msg === 'Link copied!';

  return (
    <>
      <button
        type="button"
        className={`share-btn share-btn-${variant}`}
        onClick={handleMainClick}
        aria-label={`Share ${painting.title}`}
        title="Share"
      >
        <Share2 size={variant === 'modal' ? 18 : 16} strokeWidth={1.6} />
      </button>

      {open &&
        createPortal(
          <div className="share-overlay" onClick={close}>
            <div className="share-sheet" role="dialog" aria-label="Share this painting" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="share-sheet-close" onClick={close} aria-label="Close">
                <X size={18} />
              </button>
              <h3 className="font-serif share-sheet-title">Share this painting</h3>
              <p className="share-sheet-sub">{painting.title}</p>

              <div className="share-options">
                <button type="button" className="share-option" onClick={shareWhatsApp}>
                  <span className="share-icon" style={{ background: '#25D366' }}><MessageCircle size={20} /></span>
                  WhatsApp
                </button>
                <button type="button" className="share-option" onClick={shareFacebook}>
                  <span className="share-icon" style={{ background: '#3b5998' }}><Facebook size={20} /></span>
                  Facebook
                </button>
                <button type="button" className="share-option" onClick={shareInstagram}>
                  <span
                    className="share-icon"
                    style={{ background: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)' }}
                  >
                    <Instagram size={20} />
                  </span>
                  Instagram
                </button>
                <button type="button" className="share-option" onClick={copyLink}>
                  <span className="share-icon" style={{ background: 'var(--btn-bg, var(--ink))' }}>
                    {copied ? <Check size={20} /> : <LinkIcon size={20} />}
                  </span>
                  Copy link
                </button>
              </div>

              {notice && (
                <p className="share-notice">
                  {notice.msg}
                  {notice.instagram && (
                    <>
                      {' '}
                      <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
                        Open Instagram
                      </a>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
