import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImagePlus, LogOut, Save, Trash2, X, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { apiUrl } from '../api';
import { paintings as legacyPaintings } from '../GalleryData';

const EMPTY_FORM = {
  title: '', slug: '', price: '', size: '', dimensions: '', medium: 'Acrylic on canvas', category: 'Seascape',
  availability: 'Available', story: '', finish: '', framing: '', tags: '', featured: false, sortOrder: 100, isPublished: true,
};
const EMPTY_STATS = { followersValue: 55, followersSuffix: 'K+', viewsValue: 23.25, viewsSuffix: 'M+' };
const moneyNote = 'Use the display price exactly as it should appear, for example ₹1,500 or DM for Price.';

async function request(path, options = {}, token = '') {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(apiUrl(path), { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function Field({ label, children, hint }) {
  return <label className="upload-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function AdminUploads() {
  const [token, setToken] = useState(() => sessionStorage.getItem('sakshiArtAdminToken') || '');
  const [login, setLogin] = useState({ username: '', password: '' });
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('artworks');

  const say = (type, text) => { setNotice({ type, text }); window.setTimeout(() => setNotice({ type: '', text: '' }), 5000); };
  const loadDashboard = useCallback(async (authToken) => {
    setLoading(true);
    try {
      const [artworks, siteStats] = await Promise.all([
        request('/api/admin/artworks', {}, authToken),
        request('/api/site-stats'),
      ]);
      setItems(artworks);
      setStats({ ...EMPTY_STATS, ...siteStats });
    } catch (error) {
      if (/session|sign in|token/i.test(error.message)) { sessionStorage.removeItem('sakshiArtAdminToken'); setToken(''); }
      say('error', error.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (token) loadDashboard(token); }, [token, loadDashboard]);
  useEffect(() => {
    const previews = files.map((file) => URL.createObjectURL(file));
    setFilePreviews(previews);
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const sortedItems = useMemo(() => [...items].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)), [items]);

  const signIn = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      const result = await request('/api/admin/login', { method: 'POST', body: JSON.stringify(login) });
      sessionStorage.setItem('sakshiArtAdminToken', result.token); setToken(result.token); setLogin({ username: '', password: '' });
      say('success', 'Signed in successfully.');
    } catch (error) { say('error', error.message); }
    finally { setBusy(false); }
  };

  const signOut = () => { sessionStorage.removeItem('sakshiArtAdminToken'); setToken(''); setItems([]); resetForm(); };
  const resetForm = () => { setForm({ ...EMPTY_FORM, sortOrder: (items.length + 1) * 10 }); setEditingId(''); setExistingImages([]); setFiles([]); };
  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const startEdit = (item) => {
    setEditingId(item._id || item.id);
    setForm({ ...EMPTY_FORM, ...item, tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''), sortOrder: Number(item.sortOrder ?? 100), isPublished: item.isPublished !== false });
    setExistingImages(Array.isArray(item.images) ? item.images : []);
    setFiles([]); setActiveTab('artworks'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveArtwork = async (event) => {
    event.preventDefault();
    if (!editingId && files.length === 0) return say('error', 'Please choose at least one artwork image.');
    if (existingImages.length + files.length === 0) return say('error', 'Keep at least one image.');
    setBusy(true);
    try {
      const payload = { ...form, tags: String(form.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean), sortOrder: Number(form.sortOrder), featured: Boolean(form.featured), isPublished: Boolean(form.isPublished) };
      const body = new FormData();
      body.append('artwork', JSON.stringify(payload));
      body.append('existingImages', JSON.stringify(existingImages));
      files.forEach((file) => body.append('images', file));
      await request(editingId ? `/api/admin/artworks/${editingId}` : '/api/admin/artworks', { method: editingId ? 'PUT' : 'POST', body }, token);
      say('success', editingId ? 'Artwork updated.' : 'Artwork uploaded and saved.');
      resetForm(); await loadDashboard(token);
    } catch (error) { say('error', error.message); }
    finally { setBusy(false); }
  };

  const importLegacyPaintings = async () => {
    const knownTitles = new Set(items.map((item) => String(item.title || '').trim().toLowerCase()));
    const pending = legacyPaintings.filter((item) => !knownTitles.has(String(item.title || '').trim().toLowerCase()));
    if (!pending.length) return say('success', 'All current GalleryData paintings are already managed in the database.');
    if (!window.confirm(`Import ${pending.length} existing GalleryData paintings into MongoDB and copy their images to Cloudinary? This is intended as a one-time migration.`)) return;
    setBusy(true);
    let imported = 0;
    try {
      for (let index = 0; index < pending.length; index += 1) {
        const item = pending[index];
        const imageResponse = await fetch(item.img);
        if (!imageResponse.ok) throw new Error(`Could not read the existing image for “${item.title}”.`);
        const imageBlob = await imageResponse.blob();
        const extension = (imageBlob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        const imageFile = new File([imageBlob], `${String(item.title || 'artwork').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${extension}`, { type: imageBlob.type || 'image/jpeg' });
        const payload = {
          title: item.title, price: item.price || '', size: item.size || '', dimensions: item.size || '',
          medium: 'Acrylic on canvas', category: 'Original painting', availability: item.availability || 'Available',
          story: item.story || '', finish: '', framing: '', tags: [], featured: false,
          sortOrder: (items.length + index + 1) * 10, isPublished: true,
        };
        const body = new FormData();
        body.append('artwork', JSON.stringify(payload));
        body.append('existingImages', '[]');
        body.append('images', imageFile);
        await request('/api/admin/artworks', { method: 'POST', body }, token);
        imported += 1;
      }
      await loadDashboard(token);
      say('success', `Imported ${imported} paintings. You can now edit their details and rank them in this manager.`);
    } catch (error) {
      await loadDashboard(token);
      say('error', `Imported ${imported} paintings before stopping: ${error.message}. You can run the import again; already imported titles are skipped.`);
    } finally { setBusy(false); }
  };

  const deleteArtwork = async (item) => {
    if (!window.confirm(`Delete “${item.title}” from the gallery? This cannot be undone.`)) return;
    setBusy(true);
    try { await request(`/api/admin/artworks/${item._id || item.id}`, { method: 'DELETE' }, token); say('success', 'Artwork deleted.'); if (editingId === (item._id || item.id)) resetForm(); await loadDashboard(token); }
    catch (error) { say('error', error.message); }
    finally { setBusy(false); }
  };

  const saveStats = async (event) => {
    event.preventDefault(); setBusy(true);
    try { const updated = await request('/api/admin/site-stats', { method: 'PUT', body: JSON.stringify({ ...stats, followersValue: Number(stats.followersValue), viewsValue: Number(stats.viewsValue) }) }, token); setStats(updated); say('success', 'Homepage follower and view counters updated.'); }
    catch (error) { say('error', error.message); }
    finally { setBusy(false); }
  };

  const moveRank = async (item, direction) => {
    const index = sortedItems.findIndex((entry) => String(entry._id || entry.id) === String(item._id || item.id));
    const other = sortedItems[index + direction];
    if (!other) return;
    const next = [...sortedItems]; [next[index], next[index + direction]] = [next[index + direction], next[index]];
    const ranked = next.map((entry, idx) => ({ ...entry, sortOrder: (idx + 1) * 10 }));
    setBusy(true);
    try {
      for (const entry of ranked) {
        await request(`/api/admin/artworks/${entry._id || entry.id}`, { method: 'PUT', body: (() => { const data = { ...entry, tags: entry.tags || [], sortOrder: entry.sortOrder, featured: Boolean(entry.featured), isPublished: entry.isPublished !== false }; const fd = new FormData(); fd.append('artwork', JSON.stringify(data)); fd.append('existingImages', JSON.stringify(entry.images || [])); return fd; })() }, token);
      }
      await loadDashboard(token); say('success', 'Display order saved.');
    } catch (error) { say('error', `Could not save order: ${error.message}`); }
    finally { setBusy(false); }
  };

  if (!token) return <main className="uploads-shell uploads-login-shell">
    <div className="uploads-login-card"><div className="uploads-brand-mark">SL</div><p className="uploads-eyebrow">SAKSHI LAD · ART STUDIO</p><h1>Artwork Studio</h1><p className="uploads-muted">Sign in to manage paintings, image galleries, display order and homepage statistics.</p>
      <form onSubmit={signIn} className="uploads-form">
        <Field label="Admin username"><input autoComplete="username" required value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} /></Field>
        <Field label="Password"><input type="password" autoComplete="current-password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></Field>
        <button className="uploads-primary-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</button>
      </form>
      {notice.text && <p className={`uploads-notice ${notice.type}`}>{notice.text}</p>}
      <a className="uploads-back-link" href="/">← Back to public portfolio</a>
    </div>
  </main>;

  return <main className="uploads-shell">
    <header className="uploads-header"><div><p className="uploads-eyebrow">SAKSHI LAD · ART STUDIO</p><h1>Artwork Manager</h1><p className="uploads-muted">A private workspace for your art catalogue and homepage statistics.</p></div><div className="uploads-header-actions"><a href="/" className="uploads-secondary-button">View website ↗</a><button className="uploads-secondary-button" onClick={signOut}><LogOut size={16}/> Sign out</button></div></header>
    <nav className="uploads-tabs"><button className={activeTab === 'artworks' ? 'active' : ''} onClick={() => setActiveTab('artworks')}>Paintings <span>{items.length}</span></button><button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>Homepage stats</button></nav>
    {notice.text && <div className={`uploads-notice ${notice.type}`}>{notice.text}</div>}
    {activeTab === 'stats' ? <section className="uploads-panel"><div className="uploads-section-heading"><div><p className="uploads-eyebrow">SOCIAL PROOF</p><h2>Homepage counters</h2><p className="uploads-muted">These values are displayed in the artist introduction section.</p></div></div>
      <form className="uploads-form uploads-stats-form" onSubmit={saveStats}>
        <div className="uploads-stat-edit"><Field label="Followers value"><input type="number" min="0" step="any" required value={stats.followersValue} onChange={(e) => setStats({ ...stats, followersValue: e.target.value })}/></Field><Field label="Followers suffix"><input maxLength="8" value={stats.followersSuffix} onChange={(e) => setStats({ ...stats, followersSuffix: e.target.value })} placeholder="K+"/></Field></div>
        <div className="uploads-stat-edit"><Field label="Views value"><input type="number" min="0" step="any" required value={stats.viewsValue} onChange={(e) => setStats({ ...stats, viewsValue: e.target.value })}/></Field><Field label="Views suffix"><input maxLength="8" value={stats.viewsSuffix} onChange={(e) => setStats({ ...stats, viewsSuffix: e.target.value })} placeholder="M+"/></Field></div>
        <div className="uploads-preview-note">Preview: <strong>{stats.followersValue}{stats.followersSuffix}</strong> followers · <strong>{stats.viewsValue}{stats.viewsSuffix}</strong> views</div>
        <button className="uploads-primary-button" disabled={busy}><Save size={16}/> {busy ? 'Saving…' : 'Save homepage statistics'}</button>
      </form>
    </section> : <div className="uploads-layout">
      <section className="uploads-panel uploads-editor-panel"><div className="uploads-section-heading"><div><p className="uploads-eyebrow">{editingId ? 'EDIT EXISTING WORK' : 'ADD NEW WORK'}</p><h2>{editingId ? 'Edit painting' : 'Upload a painting'}</h2><p className="uploads-muted">Add artwork details and one or more images. The first image is the cover.</p></div>{editingId && <button className="uploads-icon-button" type="button" title="Cancel editing" onClick={resetForm}><X size={18}/></button>}</div>
        <form className="uploads-form" onSubmit={saveArtwork}>
          <Field label="Artwork title *"><input required maxLength="120" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Moonlit ocean dreams"/></Field>
          <div className="uploads-two-col"><Field label="Display price" hint={moneyNote}><input value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="₹1,500"/></Field><Field label="Availability"><select value={form.availability} onChange={(e) => updateField('availability', e.target.value)}><option>Available</option><option>Reserved</option><option>Sold Out</option><option>Commission Only</option></select></Field></div>
          <div className="uploads-two-col"><Field label="Size"><input value={form.size} onChange={(e) => updateField('size', e.target.value)} placeholder="6 × 6 inch"/></Field><Field label="Dimensions"><input value={form.dimensions} onChange={(e) => updateField('dimensions', e.target.value)} placeholder="15.2 × 15.2 cm"/></Field></div>
          <div className="uploads-two-col"><Field label="Medium"><input value={form.medium} onChange={(e) => updateField('medium', e.target.value)} placeholder="Acrylic on canvas"/></Field><Field label="Category / theme"><input value={form.category} onChange={(e) => updateField('category', e.target.value)} placeholder="Moonlight, ocean, nature…"/></Field></div>
          <div className="uploads-two-col"><Field label="Finish"><input value={form.finish} onChange={(e) => updateField('finish', e.target.value)} placeholder="Protective gloss varnish"/></Field><Field label="Framing"><input value={form.framing} onChange={(e) => updateField('framing', e.target.value)} placeholder="White frame included"/></Field></div>
          <Field label="Artwork story / description"><textarea rows="5" maxLength="5000" value={form.story} onChange={(e) => updateField('story', e.target.value)} placeholder="Describe the inspiration, materials and details…"/></Field>
          <Field label="Tags (comma-separated)"><input value={form.tags} onChange={(e) => updateField('tags', e.target.value)} placeholder="moon, ocean, original acrylic"/></Field>
          <Field label={editingId ? 'Add more images (optional)' : 'Artwork images *'} hint="JPG, PNG, WEBP or AVIF · up to 10 images · 8 MB each. Stored in Cloudinary, not on the temporary server disk."><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))}/></Field>
          {existingImages.length > 0 && <div className="uploads-image-grid"><p className="uploads-image-grid-label">Saved images — untick any you want to remove</p>{existingImages.map((image, index) => <label className="uploads-image-tile" key={`${image.url}-${index}`}><img src={image.url} alt={image.alt || form.title}/><span><input type="checkbox" checked={existingImages.some((entry) => entry.url === image.url)} onChange={(e) => setExistingImages((current) => e.target.checked ? [...current, image].filter((entry, idx, arr) => arr.findIndex((x) => x.url === entry.url) === idx) : current.filter((entry) => entry.url !== image.url))}/> Keep image {index + 1}</span></label>)}</div>}
          {filePreviews.length > 0 && <div className="uploads-image-grid"><p className="uploads-image-grid-label">New images preview</p>{filePreviews.map((url, index) => <div className="uploads-image-tile" key={url}><img src={url} alt={files[index]?.name || 'New artwork preview'}/><span>{files[index]?.name}</span></div>)}</div>}
          <div className="uploads-two-col"><Field label="Display rank *" hint="Lower numbers appear first."><input type="number" min="0" step="1" required value={form.sortOrder} onChange={(e) => updateField('sortOrder', e.target.value)}/></Field><Field label="URL slug (optional)"><input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} placeholder="moonlit-ocean-dreams"/></Field></div>
          <div className="uploads-checkbox-row"><label><input type="checkbox" checked={Boolean(form.featured)} onChange={(e) => updateField('featured', e.target.checked)}/> Featured artwork</label><label><input type="checkbox" checked={Boolean(form.isPublished)} onChange={(e) => updateField('isPublished', e.target.checked)}/> Published on website</label></div>
          <div className="uploads-form-actions"><button className="uploads-primary-button" disabled={busy}><ImagePlus size={17}/>{busy ? 'Saving artwork…' : editingId ? 'Save changes' : 'Upload artwork'}</button><button className="uploads-secondary-button" type="button" onClick={resetForm}>Clear form</button></div>
        </form>
      </section>
      <section className="uploads-panel uploads-list-panel"><div className="uploads-section-heading"><div><p className="uploads-eyebrow">CATALOGUE</p><h2>Managed paintings</h2><p className="uploads-muted">Use the arrows to adjust rank, or edit a painting to set an exact rank.</p></div><button className="uploads-icon-button" onClick={() => loadDashboard(token)} title="Refresh"><RefreshCw size={17}/></button></div>
        <button className="uploads-secondary-button uploads-import-button" type="button" disabled={busy} onClick={importLegacyPaintings}>Import existing GalleryData paintings</button>
        {loading ? <p className="uploads-muted">Loading artwork…</p> : sortedItems.length === 0 ? <div className="uploads-empty"><ImagePlus size={28}/><h3>Your managed gallery starts here</h3><p>Upload your first painting. Your existing bundled gallery will remain visible on the public website.</p></div> : <div className="uploads-managed-list">{sortedItems.map((item, index) => <article className="uploads-managed-item" key={item._id || item.id}><img className="uploads-managed-thumb" src={item.images?.[0]?.url || item.img} alt={item.title}/><div className="uploads-managed-info"><div className="uploads-item-title-row"><h3>{item.title}</h3><span className={`uploads-status ${item.isPublished === false ? 'unpublished' : ''}`}>{item.isPublished === false ? 'Draft' : item.availability || 'Available'}</span></div><p>{item.price || 'DM for Price'} · {item.size || item.dimensions || 'Size not set'}</p><small>Rank {item.sortOrder ?? 0} · {item.images?.length || (item.img ? 1 : 0)} image(s)</small><div className="uploads-item-actions"><button onClick={() => startEdit(item)}>Edit</button><button onClick={() => moveRank(item, -1)} disabled={index === 0 || busy} aria-label="Move artwork up"><ArrowUp size={15}/></button><button onClick={() => moveRank(item, 1)} disabled={index === sortedItems.length - 1 || busy} aria-label="Move artwork down"><ArrowDown size={15}/></button><button className="danger" onClick={() => deleteArtwork(item)} disabled={busy}><Trash2 size={15}/> Delete</button></div></div></article>)}</div>}
      </section>
    </div>}
    <footer className="uploads-footer">Private artist workspace · Artwork metadata is stored in MongoDB; uploaded images are stored in Cloudinary.</footer>
  </main>;
}
