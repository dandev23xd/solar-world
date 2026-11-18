import { useEffect, useRef, useState } from 'react';
import { get, send } from './auth.js';
import { ThemeToggle } from './theme.jsx';
import { SearchIcon, CartIcon, TruckIcon, ChartIcon, ReceiptIcon, PanelIcon, BoltIcon, BatteryIcon, PlugIcon, BulbIcon, PowerIcon, DropIcon, BoxIcon, XIcon, GridIcon, SunLogo } from './icons.jsx';

const LOW = 5;
const peso = n => '₱' + Number(n || 0).toLocaleString();
const pic = p => p.image_url || `/products/${p.category.toLowerCase()}.svg`;
const fallback = p => e => { e.currentTarget.onerror = null; e.currentTarget.src = `/products/${p.category.toLowerCase()}.svg`; };
const stockText = n => (n < 1 ? 'Out of stock' : n <= LOW ? `Only ${n} left` : `${n} in stock`);
const stockClass = n => 'stock' + (n < 1 ? ' out' : n <= LOW ? ' low' : '');
const PLURAL = { Battery: 'Batteries', Accessory: 'Accessories' };
const plural = c => PLURAL[c] || c + 's';
const CAT_ICON = { Panel: PanelIcon, Inverter: BoltIcon, Battery: BatteryIcon, Accessory: PlugIcon, Light: BulbIcon, Generator: PowerIcon, Pump: DropIcon, Kit: BoxIcon };
const SORTS = { featured: 'Featured', low: 'Price: low to high', high: 'Price: high to low', name: 'Name A to Z' };
const sorters = { low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, name: (a, b) => a.name.localeCompare(b.name) };
const FEATURES = [
  { Icon: TruckIcon, title: 'Nationwide delivery', text: 'Estimated delivery date shown on every order.' },
  { Icon: ChartIcon, title: 'Live stock', text: 'What you see in the shop is what we have.' },
  { Icon: ReceiptIcon, title: 'Cancel before it ships', text: 'Changed your mind? Cancel from My orders.' },
];
const SHIP = { Luzon: { fee: 250, days: 3 }, Visayas: { fee: 150, days: 5 }, Mindanao: { fee: 350, days: 7 } };
const STAGES = ['Placed', 'Packed', 'Shipped', 'Delivered'];
const STAGE_OF = { Preparing: 0, Packed: 1, Shipped: 2, Delivered: 3 };
const stageIndex = o => STAGE_OF[o.stage] ?? 0;
const isCancelled = o => o.stage === 'Cancelled';
const ORDER_TABS = [['all', 'All'], ['active', 'Active'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']];
const inTab = (o, k) => {
  if (k === 'all') return true;
  if (k === 'cancelled') return isCancelled(o);
  if (isCancelled(o)) return false;
  return k === 'delivered' ? stageIndex(o) === 3 : stageIndex(o) < 3;
};
const niceDate = d => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-');
const NO_PROFILE = { name: '', phone: '', address: '', region: 'Luzon', type: 'Residential', email: '' };
const NO_PW = { current: '', next: '', again: '' };
const NO_EMAIL = { email: '', current: '' };
const ROW = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 0', borderTop: '1px solid var(--line)' };
const FIELDS = [
  { k: 'name', label: 'Name' },
  { k: 'phone', label: 'Phone number', type: 'tel', ph: '09123456789' },
  { k: 'address', label: 'Address', ph: 'House no., street, barangay, city' },
  { k: 'region', label: 'Region', options: ['Luzon', 'Visayas', 'Mindanao'] },
  { k: 'type', label: 'Buying as', options: ['Residential', 'Commercial'] },
];

export default function Shop({ user, onLogout }) {
  const key = 'cart-' + user.email;
  const [tab, setTab] = useState('shop'), [products, setProducts] = useState([]), [orders, setOrders] = useState([]);
  const [q, setQ] = useState(''), [cat, setCat] = useState('All'), [sort, setSort] = useState('featured');
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } });
  const [cartOpen, setCartOpen] = useState(false), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState(NO_PROFILE), [pw, setPw] = useState(NO_PW), [em, setEm] = useState(NO_EMAIL);
  const [open, setOpen] = useState(null), [draft, setDraft] = useState(''), [shownName, setShownName] = useState(user.name);
  const [loaded, setLoaded] = useState(false), [loadErr, setLoadErr] = useState(''), [region, setRegion] = useState('');
  const [viewId, setViewId] = useState(null), [qty, setQty] = useState(1), [toast, setToast] = useState(0);
  const [orderTab, setOrderTab] = useState('all');
  const lockSeen = useRef(false);

  const lockCheck = e => {
    if (!lockSeen.current && String(e.message).startsWith('Your account has been locked')) {
      lockSeen.current = true;
      alert(e.message);
      onLogout();
    }
  };
  const loadProducts = () => get('/api/shop/products').then(setProducts).catch(lockCheck);
  const loadOrders = () => get('/api/shop/orders').then(setOrders).catch(lockCheck);
  const loadProfile = () => {
    setLoaded(false); setLoadErr('');
    get('/api/shop/profile')
      .then(p => { setProfile({ ...NO_PROFILE, ...p, phone: p.phone || '', address: p.address || '' }); setRegion(p.region || 'Luzon'); setLoaded(true); })
      .catch(e => { lockCheck(e); setLoadErr(e.message); });
  };
  useEffect(() => { loadProducts(); loadOrders(); loadProfile(); }, []);
  useEffect(() => {
    window.addEventListener('focus', loadProducts);
    return () => window.removeEventListener('focus', loadProducts);
  }, []);
  useEffect(() => { localStorage.setItem(key, JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(0), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const viewed = viewId ? products.find(p => p.id === viewId) : null;
  const maxAdd = viewed ? Math.max(0, Math.min(50, viewed.stock) - (cart[viewed.id] || 0)) : 0;
  const openProduct = p => { setViewId(p.id); setQty(1); setMsg(null); window.scrollTo(0, 0); loadProducts(); };
  const bump = d => setQty(Math.max(1, Math.min(maxAdd, qty + d)));
  const toProducts = () => setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 0);
  const goShop = () => { setTab('shop'); setViewId(null); };

  const addToCart = (p, n, popup = true) => {
    const next = Math.min(50, p.stock, (cart[p.id] || 0) + n);
    setCart({ ...cart, [p.id]: next });
    if (popup) setToast(t => t + 1);
    setQty(1);
  };
  const buyNow = p => {
    if (maxAdd >= 1) addToCart(p, Math.min(qty, maxAdd), false);
    setCartOpen(true);
  };

  const change = (p, d) => {
    const n = Math.max(0, Math.min(50, p.stock, (cart[p.id] || 0) + d));
    const next = { ...cart };
    if (n) next[p.id] = n; else delete next[p.id];
    setCart(next);
  };
  const items = products.filter(p => cart[p.id]);
  const count = items.reduce((s, p) => s + cart[p.id], 0);
  const subtotal = items.reduce((s, p) => s + cart[p.id] * p.price, 0);
  const ship = SHIP[region] || null;
  const shipping = ship ? ship.fee * items.length : 0;
  const total = subtotal + shipping;

  const checkout = async () => {
    setBusy(true); setMsg(null);
    const left = { ...cart };
    try {
      for (const p of items) { await send('POST', '/api/shop/orders', { product_id: p.id, qty: cart[p.id] }); delete left[p.id]; }
      setMsg({ ok: true, text: `Order placed for ${count} item(s). Total ${peso(total)}. Thank you!` });
      setCartOpen(false); setViewId(null); setTab('orders');
    } catch (e) { lockCheck(e); setMsg({ ok: false, text: e.message }); }
    setCart(left); setBusy(false); loadOrders(); loadProducts();
  };

  const cancelOrder = async o => {
    if (!confirm(`Cancel order #${o.id} (${o.product})?`)) return;
    setBusy(true); setMsg(null);
    try {
      await send('DELETE', `/api/shop/orders/${o.id}`);
      setMsg({ ok: true, text: `Order #${o.id} was cancelled.` });
    } catch (err) { lockCheck(err); setMsg({ ok: false, text: err.message }); }
    setBusy(false); loadOrders(); loadProducts();
  };

  const setW = k => e => setPw({ ...pw, [k]: e.target.value });
  const setE = k => e => setEm({ ...em, [k]: e.target.value });
  const toggle = (k, start = '') => { setMsg(null); setEm(NO_EMAIL); setPw(NO_PW); setDraft(start); setOpen(open === k ? null : k); };

  const saveField = async e => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const next = { ...profile, [open]: String(draft).trim() };
    try {
      await send('PUT', '/api/shop/profile', next);
      setProfile(next);
      if (open === 'name') setShownName(next.name);
      if (open === 'region') setRegion(next.region);
      setOpen(null);
      setMsg({ ok: true, text: 'Your details were saved.' });
    } catch (err) { lockCheck(err); setMsg({ ok: false, text: err.message }); }
    setBusy(false);
  };

  const saveEmail = async e => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      await send('PUT', '/api/shop/email', em);
      setProfile({ ...profile, email: em.email.trim().toLowerCase() });
      setEm(NO_EMAIL); setOpen(null);
      setMsg({ ok: true, text: 'Your email was changed. Use the new email the next time you sign in.' });
    } catch (err) { lockCheck(err); setMsg({ ok: false, text: err.message }); }
    setBusy(false);
  };

  const savePassword = async e => {
    e.preventDefault(); setMsg(null);
    if (pw.next !== pw.again) { setMsg({ ok: false, text: 'The new passwords do not match' }); return; }
    setBusy(true);
    try {
      await send('PUT', '/api/shop/password', { current: pw.current, next: pw.next });
      setPw(NO_PW); setOpen(null);
      setMsg({ ok: true, text: 'Your password was changed.' });
    } catch (err) { lockCheck(err); setMsg({ ok: false, text: err.message }); }
    setBusy(false);
  };

  const shownOrders = orders.filter(o => inTab(o, orderTab));
  const counts = products.reduce((m, p) => ({ ...m, [p.category]: (m[p.category] || 0) + 1 }), {});
  const filtered = products.filter(p => (cat === 'All' || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()));
  const shown = sorters[sort] ? [...filtered].sort(sorters[sort]) : filtered;
  const initials = shownName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <div className="brand"><SunLogo /> Solar World</div>
          <nav className="nav-links" aria-label="Main">
            <button className={tab === 'shop' ? 'on' : ''} onClick={() => { goShop(); loadProducts(); }}>Shop</button>
            <button className={tab === 'orders' ? 'on' : ''} onClick={() => { setTab('orders'); loadOrders(); }}>My orders ({orders.length})</button>
            <button className={tab === 'settings' ? 'on' : ''} onClick={() => { setTab('settings'); setMsg(null); setOpen(null); loadProfile(); }}>Settings</button>
          </nav>
          <label className="nav-search">
            <SearchIcon />
            <span className="sr-only">Search products</span>
            <input type="search" placeholder="Search panels, inverters, batteries…" value={q}
              onChange={e => { setQ(e.target.value); if (tab !== 'shop' || viewId) goShop(); }} />
          </label>
          <ThemeToggle />
          <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Cart, ${count} items`}>
            <CartIcon /> Cart<span className="badge">{count}</span>
          </button>
          <span className="avatar hide-sm" title={shownName} aria-hidden="true">{initials}</span>
          <button className="link" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <main className="wrap">
        {msg && <div className={msg.ok ? 'notice' : 'error'} role="status" style={{ marginTop: 18 }}>{msg.text}</div>}

        {tab === 'shop' && viewed && (
          <div className="card" style={{ marginTop: 24 }}>
            <button onClick={() => setViewId(null)}>← Back to shop</button>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 18 }}>
              <img src={pic(viewed)} alt={viewed.name} onError={fallback(viewed)} style={{ width: 'min(400px, 100%)', maxHeight: 400, objectFit: 'contain', borderRadius: 16, background: 'var(--soft)' }} />
              <div style={{ flex: 1, minWidth: 260 }}>
                <span className="pill">{viewed.category}</span>
                <h2 style={{ margin: '12px 0', fontSize: 28, fontWeight: 800 }}>{viewed.name}</h2>
                <div className="price" style={{ fontSize: 32 }}>{peso(viewed.price)}</div>
                <div className={stockClass(viewed.stock)} style={{ marginTop: 10 }}><span className="dot" />{stockText(viewed.stock)}</div>
                {ship && <div className="ship-note"><TruckIcon size={16} /> Shipping to {region}: <b>{peso(ship.fee)}</b> · arrives in about {ship.days} days</div>}
                {cart[viewed.id] > 0 && <div className="muted small" style={{ marginTop: 6 }}>{cart[viewed.id]} already in your cart</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '22px 0' }}>
                  <span className="muted" style={{ margin: 0 }}>Quantity</span>
                  <div className="stepper">
                    <button disabled={maxAdd < 1 || qty <= 1} onClick={() => bump(-1)} aria-label="Less">−</button>
                    <b>{maxAdd < 1 ? 0 : Math.min(qty, maxAdd)}</b>
                    <button disabled={maxAdd < 1 || qty >= maxAdd} onClick={() => bump(1)} aria-label="More">+</button>
                  </div>
                </div>
                {viewed.stock >= 1 && maxAdd < 1 && <div className="muted small" style={{ marginBottom: 12 }}>You already have the most you can add in your cart.</div>}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button disabled={maxAdd < 1} onClick={() => addToCart(viewed, Math.min(qty, maxAdd))}><CartIcon /> Add to cart</button>
                  <button className="active" disabled={viewed.stock < 1} onClick={() => buyNow(viewed)}>Buy now</button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
              <h3>Product description</h3>
              <p style={{ whiteSpace: 'pre-line', margin: '10px 0 0' }}>{viewed.description || 'No description yet.'}</p>
            </div>
          </div>
        )}

        {tab === 'shop' && !viewed && <>
          <section className="hero-wrap">
            <div className="hero">
              <span className="hero-tag">Delivered across Luzon, Visayas and Mindanao</span>
              <h2>Power your home with the sun.</h2>
              <p>Panels, inverters, batteries and complete kits at honest prices. See live stock on every product and track your orders in one place.</p>
              <div className="hero-actions">
                <button onClick={toProducts}>Shop all products</button>
                <button className="ghost" onClick={() => { setTab('orders'); loadOrders(); }}>Track my orders</button>
              </div>
            </div>
            <div className="features">
              {FEATURES.map(({ Icon, title, text }) => (
                <div className="feature" key={title}>
                  <span className="feature-ico"><Icon size={20} /></span>
                  <div><b>{title}</b><p>{text}</p></div>
                </div>
              ))}
            </div>
          </section>

          {Object.keys(counts).length > 0 && <section>
            <h2 className="section-title">Shop by category</h2>
            <div className="cats">
              <button className={'cat' + (cat === 'All' ? ' on' : '')} aria-pressed={cat === 'All'} onClick={() => { setCat('All'); toProducts(); }}>
                <span className="cat-ico"><GridIcon size={20} /></span>
                <b>All</b>
                <span className="muted small">{products.length} product{products.length === 1 ? '' : 's'}</span>
              </button>
              {Object.entries(counts).map(([c, n]) => {
                const Icon = CAT_ICON[c] || BoxIcon;
                return (
                <button key={c} className={'cat' + (cat === c ? ' on' : '')} aria-pressed={cat === c} onClick={() => { setCat(cat === c ? 'All' : c); toProducts(); }}>
                  <span className="cat-ico"><Icon size={20} /></span>
                  <b>{plural(c)}</b>
                  <span className="muted small">{n} product{n > 1 ? 's' : ''}</span>
                </button>
                );
              })}
            </div>
          </section>}

          <div className="section-head" id="products">
            <h2 className="section-title">{cat === 'All' ? 'All products' : plural(cat)} <span className="count">· {shown.length}</span></h2>
            <div className="filters">
              {cat !== 'All' && <button className="clear-chip" onClick={() => setCat('All')}>{plural(cat)} <XIcon size={16} /><span className="sr-only">Clear filter</span></button>}
              <label className="sort">Sort
                <select value={sort} onChange={e => setSort(e.target.value)}>{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              </label>
            </div>
          </div>

          <div className="shop">
            {shown.map(p => (
              <article className="card product" key={p.id} role="button" tabIndex={0}
                onClick={() => openProduct(p)} onKeyDown={e => { if (e.key === 'Enter') openProduct(p); }}>
                <div className="pmedia">
                  <img className="pimg" src={pic(p)} alt={p.name} loading="lazy" onError={fallback(p)} />
                  <span className="pill">{p.category}</span>
                </div>
                <div className="pbody">
                  <h3>{p.name}</h3>
                  <div className={stockClass(p.stock)}><span className="dot" />{stockText(p.stock)}</div>
                  {cart[p.id] > 0 && <div className="muted small" style={{ margin: 0 }}>{cart[p.id]} in your cart</div>}
                  <div className="pfoot">
                    <span className="price">{peso(p.price)}</span>
                    <span className="view-btn">View</span>
                  </div>
                </div>
              </article>
            ))}
            {!shown.length && <div className="empty" style={{ gridColumn: '1 / -1' }}><SearchIcon size={32} /><p>No products match your search.</p></div>}
          </div>
        </>}

        {tab === 'orders' && <section className="orders">
          <h2 className="orders-title">My orders</h2>
          <p className="muted">Track your orders and see what you paid</p>
          <div className="seg order-tabs" role="tablist">
            {ORDER_TABS.map(([k, label]) => (
              <button key={k} role="tab" aria-selected={orderTab === k} className={orderTab === k ? 'on' : ''} onClick={() => setOrderTab(k)}>
                {label} ({orders.filter(o => inTab(o, k)).length})
              </button>
            ))}
          </div>

          {!orders.length && <div className="card empty"><ReceiptIcon size={32} /><p>You have not placed any orders yet.</p><button className="active" onClick={goShop}>Start shopping</button></div>}
          {orders.length > 0 && !shownOrders.length && <div className="card empty"><ReceiptIcon size={32} /><p>No orders here yet.</p></div>}

          {shownOrders.map(o => {
            const step = stageIndex(o);
            const off = isCancelled(o);
            return (
              <article className={'order-card' + (off ? ' cancelled' : '')} key={o.id}>
                <div className="order-main">
                  <div className="order-top">
                    <div><b className="order-no">Order #{o.id}</b> <span className="muted">· {niceDate(o.sale_date)}</span></div>
                    <span className={'obadge ' + (off ? 'off' : 's' + step)}>{off ? 'Cancelled' : STAGES[step]}</span>
                  </div>
                  <div className="order-item">
                    <img src={pic(o)} alt="" onError={fallback(o)} />
                    <div>
                      <b>{o.product}</b>
                      <div className="muted">{o.category} · Qty {o.qty}</div>
                    </div>
                  </div>
                  {off ? <div className="order-off">You cancelled this order. The item went back to stock and you will not be charged.</div> : <>
                  <ol className="ostep" aria-label="Order progress">
                    {STAGES.map((s, i) => (
                      <li key={s} className={i <= step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
                        <span className="odot">{i <= step ? '✓' : ''}</span>{s}
                      </li>
                    ))}
                  </ol>
                  <div className="muted">{step === 3 ? 'Delivered' : 'Estimated delivery'}: <b className="fg">{niceDate(o.est_delivery)}</b></div>
                  </>}
                </div>
                <div className="order-pay">
                  <b>Payment summary</b>
                  <div className="pay-row"><span>Subtotal</span><span>{peso(o.subtotal)}</span></div>
                  <div className="pay-row"><span>Shipping</span><span>{peso(o.shipping)}</span></div>
                  <div className="pay-total"><span>Total</span><span className={off ? 'struck' : undefined}>{peso(o.total)}</span></div>
                  {o.can_cancel && <button className="danger wide" disabled={busy} onClick={() => cancelOrder(o)}>Cancel order</button>}
                </div>
              </article>
            );
          })}

          {orders.length > 0 && <p className="muted small">Total spent: <b>{peso(orders.filter(o => !isCancelled(o)).reduce((s, o) => s + Number(o.total), 0))}</b></p>}
        </section>}

        {tab === 'settings' && <div className="card" style={{ marginTop: 24 }}>
          {loadErr && (
            <div className="error" role="alert">
              Could not load your details: {loadErr}.{' '}
              <button onClick={loadProfile}>Try again</button>
            </div>
          )}

          <h3>Personal details</h3>
          {FIELDS.map(f => (
            <div key={f.k}>
              <div style={ROW}>
                <div><b>{f.label}</b><div className="muted small" style={{ margin: 0 }}>{loaded ? (profile[f.k] || '-') : loadErr ? '-' : 'Loading…'}</div></div>
                <button disabled={!loaded} onClick={() => toggle(f.k, profile[f.k] || (f.options ? f.options[0] : ''))}>{open === f.k ? 'Cancel' : 'Edit'}</button>
              </div>
              {open === f.k && (
                <form className="crud-form" onSubmit={saveField}>
                  <label>{f.label}
                    {f.options
                      ? <select value={draft} onChange={e => setDraft(e.target.value)}>{f.options.map(o => <option key={o}>{o}</option>)}</select>
                      : <input type={f.type || 'text'} value={draft} onChange={e => setDraft(e.target.value)} placeholder={f.ph} required />}
                  </label>
                  <div className="crud-actions"><button className="active" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
                </form>
              )}
            </div>
          ))}

          <h3 style={{ marginTop: 28 }}>Login details</h3>

          <div style={ROW}>
            <div><b>Email</b><div className="muted small" style={{ margin: 0 }}>{profile.email || user.email}</div></div>
            <button onClick={() => toggle('email')}>{open === 'email' ? 'Cancel' : 'Edit'}</button>
          </div>
          {open === 'email' && (
            <form className="crud-form" onSubmit={saveEmail}>
              <label>New email<input type="email" value={em.email} onChange={setE('email')} placeholder="name@email.com" autoComplete="off" required /></label>
              <label>Current password<input type="password" value={em.current} onChange={setE('current')} autoComplete="current-password" required /></label>
              <div className="crud-actions"><button className="active" disabled={busy}>{busy ? 'Saving…' : 'Save email'}</button></div>
            </form>
          )}

          <div style={ROW}>
            <div><b>Password</b><div className="muted small" style={{ margin: 0 }}>••••••••</div></div>
            <button onClick={() => toggle('password')}>{open === 'password' ? 'Cancel' : 'Edit'}</button>
          </div>
          {open === 'password' && (
            <form className="crud-form" onSubmit={savePassword}>
              <label>Current password<input type="password" value={pw.current} onChange={setW('current')} autoComplete="current-password" required /></label>
              <label>New password<input type="password" value={pw.next} onChange={setW('next')} placeholder="At least 8 characters" autoComplete="new-password" required /></label>
              <label>Confirm new password<input type="password" value={pw.again} onChange={setW('again')} autoComplete="new-password" required /></label>
              <div className="crud-actions"><button className="active" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button></div>
            </form>
          )}
        </div>}
      </main>

      <footer className="foot">
        <div className="foot-inner"><span>© Solar World Corporation</span><span>Serving Luzon, Visayas and Mindanao</span></div>
      </footer>

      {toast > 0 && (
        <div role="status" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 80 }}>
          <div style={{ background: 'rgba(22, 24, 29, 0.88)', color: '#fff', borderRadius: 16, padding: '28px 36px', textAlign: 'center', maxWidth: 320 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F2A516', color: '#16181D', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>✓</div>
            <div>Item has been added to your shopping cart</div>
          </div>
        </div>
      )}

      {cartOpen && <>
        <div className="drawer-scrim" onClick={() => setCartOpen(false)} />
        <aside className="drawer" aria-label="Shopping cart">
          <div className="drawer-head"><h3>Your cart ({count})</h3><button onClick={() => setCartOpen(false)} aria-label="Close cart">✕</button></div>
          <div className="drawer-body">
            {items.length ? items.map(p => (
              <div className="line-item" key={p.id}>
                <img src={pic(p)} alt="" onError={fallback(p)} />
                <div>
                  <b>{p.name}</b>
                  <div className="muted">{peso(p.price)} each</div>
                  <div className="stepper"><button onClick={() => change(p, -1)} aria-label="Remove one">−</button><b>{cart[p.id]}</b><button disabled={cart[p.id] >= p.stock} onClick={() => change(p, 1)} aria-label="Add one">+</button></div>
                </div>
                <b>{peso(cart[p.id] * p.price)}</b>
              </div>
            )) : <div className="empty"><CartIcon size={32} /><p>Your cart is empty.</p></div>}
          </div>
          {items.length > 0 && <div className="drawer-foot">
            <div className="sum-row"><span>Subtotal</span><span>{peso(subtotal)}</span></div>
            <div className="sum-row"><span>Shipping fee{region ? ` (${region})` : ''}{items.length > 1 && ship ? ` · ${peso(ship.fee)} × ${items.length} orders` : ''}</span><span>{ship ? peso(shipping) : '…'}</span></div>
            {items.length > 1 && <p className="muted small" style={{ margin: '0 0 8px' }}>Each product ships as its own order, so each one has a shipping fee.</p>}
            <div className="total-row"><span>Total</span><span>{peso(total)}</span></div>
            <button className="active wide" disabled={busy} onClick={checkout}>{busy ? 'Placing order…' : 'Place order'}</button>
          </div>}
        </aside>
      </>}
    </>
  );
}