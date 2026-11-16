import { useEffect, useState } from 'react';
import { get, send } from './auth.js';

const CHANNELS = ['Facebook', 'Google Ads', 'Email', 'Referral', 'Trade Show'];
export const PAGES = {
  customers: { name: 'customers', title: 'Customers', cols: ['id', 'name', 'phone', 'address', 'region', 'type', 'joined', 'status', 'lock_reason', 'unlock_request'], money: [],
    fields: [{ k: 'name', label: 'Name' }, { k: 'phone', label: 'Phone number', type: 'tel', optional: true }, { k: 'address', label: 'Address', optional: true },
             { k: 'region', label: 'Region', options: ['Luzon', 'Visayas', 'Mindanao'] },
             { k: 'type', label: 'Type', options: ['Residential', 'Commercial'] }, { k: 'joined', label: 'Joined', type: 'date' }] },
  products: { name: 'products', title: 'Products', cols: ['id', 'name', 'category', 'price', 'unit_cost', 'stock'], money: ['price', 'unit_cost'],
    fields: [{ k: 'name', label: 'Name' }, { k: 'category', label: 'Category', options: ['Panel', 'Inverter', 'Battery', 'Kit', 'Accessory', 'Light', 'Generator', 'Pump'] },
             { k: 'price', label: 'Price', type: 'number' }, { k: 'unit_cost', label: 'Unit cost', type: 'number' },
             { k: 'stock', label: 'Stock', type: 'number' },
             { k: 'image_url', label: 'Image URL (optional)', optional: true },
             { k: 'description', label: 'Description (optional)', optional: true, area: true }] },
  sales: { name: 'sales', title: 'Sales', cols: ['id', 'customer', 'product', 'category', 'qty', 'sale_date', 'total'], money: ['total'],
    fields: [{ k: 'customer_id', label: 'Customer', lookup: 'customers' }, { k: 'product_id', label: 'Product', lookup: 'products' },
             { k: 'qty', label: 'Quantity', type: 'number' }, { k: 'sale_date', label: 'Date', type: 'date' },
             { k: 'channel', label: 'Channel', options: [...CHANNELS, 'Website'] }] },
  marketing: { name: 'marketing', title: 'Marketing', cols: ['id', 'channel', 'campaign', 'spend', 'leads', 'start_date'], money: ['spend'],
    fields: [{ k: 'channel', label: 'Channel', options: CHANNELS }, { k: 'campaign', label: 'Campaign' },
             { k: 'spend', label: 'Spend', type: 'number' }, { k: 'leads', label: 'Leads', type: 'number' }, { k: 'start_date', label: 'Start date', type: 'date' }] },
  shipments: { name: 'shipments', title: 'Shipments', cols: ['id', 'sale_id', 'customer', 'phone', 'address', 'product', 'qty', 'region', 'price', 'cost', 'total', 'sale_date', 'est_delivery'], money: ['price', 'cost', 'total'],
    fields: [{ k: 'region', label: 'Region', options: ['Luzon', 'Visayas', 'Mindanao'] },
             { k: 'cost', label: 'Shipping cost', type: 'number' }] },
};
const label = c => (c === 'cost' ? 'shipping fee' : c.replace('_', ' '));
const peso = n => '₱' + Number(n || 0).toLocaleString();
const NO_ADD = ['customers', 'sales', 'shipments'];
const NO_EDIT = ['customers', 'sales'];
const NO_DELETE = ['customers', 'sales', 'shipments'];
const LOCKABLE = ['customers'];
const FULL = { flex: '1 0 100%', gridColumn: '1 / -1' };
const ACTIONS = { ...FULL, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 };
const STATUS_TONE = { Active: 'ok', Locked: 'bad', 'Unlock requested': 'warn', 'No account': '' };

export default function Crud({ page, canEdit }) {
  const [rows, setRows] = useState([]), [look, setLook] = useState({}), [form, setForm] = useState(null), [q, setQ] = useState(''), [msg, setMsg] = useState('');
  const url = '/api/' + page.name;
  const wide = page.fields.some(f => f.area);
  const hasActions = !NO_EDIT.includes(page.name) || !NO_DELETE.includes(page.name) || LOCKABLE.includes(page.name);
  const showActions = canEdit && hasActions;
  const load = () => get(url).then(setRows);
  useEffect(() => {
    load();
    page.fields.filter(f => f.lookup).forEach(f => get('/api/' + f.lookup).then(d => setLook(l => ({ ...l, [f.lookup]: d }))));
  }, []);

  const blank = () => Object.fromEntries(page.fields.map(f => [f.k, f.options ? f.options[0] : '']));
  const save = async e => {
    e.preventDefault(); setMsg('');
    try { await (form.id ? send('PUT', `${url}/${form.id}`, form) : send('POST', url, form)); setForm(null); load(); }
    catch (err) { setMsg(err.message); }
  };
  const del = async r => {
    if (!confirm(`Delete ${page.title.toLowerCase()} record #${r.id}?`)) return;
    setMsg('');
    try { await send('DELETE', `${url}/${r.id}`); load(); } catch (err) { setMsg(err.message); }
  };
  const toggleLock = async r => {
    setMsg('');
    let reason = '';
    if (r.locked) {
      if (!confirm(`Unlock ${r.name}? They will be able to sign in again.`)) return;
    } else {
      const answer = prompt(`Lock ${r.name}'s account?\n\nThey will not be able to sign in. Type a reason (the customer sees it when they try to sign in), or leave it empty:`, '');
      if (answer === null) return;
      reason = answer;
    }
    try { await send('PUT', `${url}/${r.id}/lock`, { locked: !r.locked, reason }); load(); } catch (err) { setMsg(err.message); }
  };
  const dismiss = async r => {
    if (!confirm(`Keep ${r.name}'s account locked? Their unlock request will be removed.`)) return;
    setMsg('');
    try { await send('PUT', `${url}/${r.id}/dismiss-request`); load(); } catch (err) { setMsg(err.message); }
  };

  const pending = LOCKABLE.includes(page.name) ? rows.filter(r => r.unlock_request).length : 0;
  const shown = rows.filter(r => Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase()));
  const field = f => {
    const v = form[f.k] ?? '', on = e => setForm({ ...form, [f.k]: e.target.value });
    if (f.options) return <select value={v} onChange={on}>{f.options.map(o => <option key={o}>{o}</option>)}</select>;
    if (f.lookup) return <select value={v} onChange={on} required><option value="">Choose…</option>{(look[f.lookup] || []).map(o => <option key={o.id} value={o.id}>{o.id} – {o.name}</option>)}</select>;
    if (f.area) return <textarea rows={5} maxLength={2000} value={v} onChange={on} placeholder="Describe the product: features, size, warranty, what is included…" style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', font: 'inherit' }} />;
    return <input type={f.type || 'text'} min={f.type === 'number' ? 0 : undefined} step={f.type === 'number' ? 'any' : undefined} value={v} onChange={on} required={!f.optional} />;
  };
  const cell = (r, c) => {
    if (page.money.includes(c)) return peso(r[c]);
    if (c === 'status' && LOCKABLE.includes(page.name)) return <span className={'status ' + (STATUS_TONE[r.status] || '')}>{r.status}</span>;
    if (c === 'unlock_request') return r.unlock_request
      ? <div className="appeal-msg">“{r.unlock_request}”<small>Sent {r.unlock_requested_at}</small></div>
      : '-';
    return r[c] ?? '-';
  };

  return (
    <div className="card">
      <div className="crud-head">
        <h3>{page.title}</h3>
        <input className="search" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
        {canEdit && !NO_ADD.includes(page.name) && <button className="active" onClick={() => { setForm(blank()); setMsg(''); }}>+ Add</button>}
      </div>
      {pending > 0 && <div className="appeal-banner" role="status">{pending} customer{pending > 1 ? 's are' : ' is'} asking to be unlocked. Review the request{pending > 1 ? 's' : ''} below.</div>}
      {msg && <div className="error" role="alert">{msg}</div>}
      {form && (
        <form className="crud-form" onSubmit={save}>
          {page.fields.map(f => <label key={f.k} style={f.area ? FULL : undefined}>{f.label}{field(f)}</label>)}
          <div className="crud-actions" style={wide ? ACTIONS : undefined}><button className="active">{form.id ? 'Save changes' : 'Add record'}</button><button type="button" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
      <div className="table-wrap"><table className="rtable">
        <thead><tr>{page.cols.map(c => <th key={c}>{label(c)}</th>)}{showActions && <th>Action</th>}</tr></thead>
        <tbody>
          {shown.map(r => <tr key={r.id}>
            {page.cols.map(c => <td key={c} data-label={label(c)}>{cell(r, c)}</td>)}
            {showActions && <td data-label="Action">
              {!NO_EDIT.includes(page.name) && <button onClick={() => { setForm({ ...r }); setMsg(''); }}>Edit</button>}{' '}
              {LOCKABLE.includes(page.name) && r.unlock_request && <>
                <button className="ok-btn" onClick={() => toggleLock(r)}>Unlock</button>{' '}
                <button onClick={() => dismiss(r)}>Keep locked</button>
              </>}
              {LOCKABLE.includes(page.name) && !r.unlock_request && <button className={r.locked ? undefined : 'danger'} onClick={() => toggleLock(r)}>{r.locked ? 'Unlock' : 'Lock'}</button>}
              {!NO_DELETE.includes(page.name) && <button className="danger" onClick={() => del(r)}>Delete</button>}
            </td>}
          </tr>)}
        </tbody>
      </table></div>
      <p className="muted small">Showing {shown.length} of {rows.length} records{canEdit ? '' : ' (view only: sign in as an admin to edit)'}</p>
    </div>
  );
}