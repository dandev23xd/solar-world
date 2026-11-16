import { Fragment, useEffect, useState } from 'react';
import { get, savedUser } from './auth.js';

const STEPS = [
  { name: '1. Descriptive', q: 'What happened?', does: 'Totals revenue, units and orders, and groups revenue by month, product category and region.', out: 'Charts on the Descriptive tab' },
  { name: '2. Predictive', q: 'What will happen?', does: 'Takes the monthly revenue from step 1 and fits a linear regression trend.', out: '3-month forecast on the Predictive tab' },
  { name: '3. Prescriptive', q: 'What should we do?', does: 'Uses the revenue per channel (step 1), the trend (step 2) and the shipping costs to split a budget and choose the cheapest region.', out: 'Budget allocation and recommendation on the Prescriptive tab' },
];
const VARS = [
  ['customers', 'Customers', 'Name, region, customer type, date joined'],
  ['products', 'Products', 'Name, category, price, unit cost, picture'],
  ['sales', 'Sales', 'Customer, product, quantity, date, sales channel'],
  ['marketing', 'Marketing', 'Channel, campaign, spend, leads, start date'],
  ['shipments', 'Shipments', 'Sale, region, shipping cost, delivery days'],
];

const RANGES = [7, 30, 90];
const peso = n => '₱' + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const compact = v => (v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${+(v / 1e3).toFixed(1)}K` : `${Math.round(v)}`);
const short = day => new Date(day + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const tone = s => (s === 'Delivered' ? 'ok' : s === 'Cancelled' ? 'bad' : 'warn');

function Change({ cur, prev, days }) {
  if (!prev && !cur) return <span className="kbadge">No activity</span>;
  if (!prev) return <span className="kbadge up">New this period</span>;
  const pct = ((cur - prev) / prev) * 100;
  const up = pct >= 0;
  return <span className={'kbadge ' + (up ? 'up' : 'down')}>{up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% vs prev {days}d</span>;
}

function Kpi({ label, value, cur, prev, days, note }) {
  return (
    <div className="card kcard">
      <div className="klabel">{label}</div>
      <div className="kvalue">{value}</div>
      {note ? <span className="kbadge up">{note}</span> : <Change cur={cur} prev={prev} days={days} />}
    </div>
  );
}

function Trend({ data }) {
  const W = 640, H = 220, L = 52, R = 12, T = 14, B = 30;
  const max = Math.max(1, ...data.map(p => p.revenue));
  const pow = 10 ** Math.floor(Math.log10(max));
  const top = Math.ceil(max / pow) * pow;
  const x = i => L + (W - L - R) * (data.length > 1 ? i / (data.length - 1) : 0.5);
  const y = v => T + (H - T - B) * (1 - v / top);
  const line = data.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.revenue).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const ticks = [0, 1, 2, 3, 4].map(i => (top * i) / 4);
  const marks = [0, Math.floor((data.length - 1) / 2), data.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', marginTop: 16 }} role="img" aria-label="Revenue per day">
      {ticks.map(t => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" />
          <text x={L - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{'₱' + compact(t)}</text>
        </g>
      ))}
      <path d={area} fill="rgba(242, 165, 22, 0.16)" />
      <path d={line} fill="none" stroke="#D98E00" strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((p, i) => (
        <circle key={p.day} cx={x(i)} cy={y(p.revenue)} r={5} fill={p.revenue > 0 ? '#D98E00' : 'transparent'}>
          <title>{`${short(p.day)}: ${peso(p.revenue)} from ${p.orders} order(s)`}</title>
        </circle>
      ))}
      {marks.map(i => (
        <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="11" fill="var(--muted)">{short(data[i].day)}</text>
      ))}
    </svg>
  );
}

export default function Overview() {
  const [n, setN] = useState({});
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { get('/api/overview').then(setN).catch(() => {}); }, []);
  useEffect(() => { setErr(''); get('/api/dashboard?days=' + days).then(setD).catch(e => setErr(e.message)); }, [days]);

  const user = savedUser();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const aov = x => (x.orders ? x.revenue / x.orders : 0);
  const catTotal = d ? d.category.reduce((s, c) => s + c.revenue, 0) : 0;
  const catMax = d ? Math.max(1, ...d.category.map(c => c.revenue)) : 1;

  return (
    <>
      <div className="greet-row">
        <div>
          <div className="muted small" style={{ margin: 0 }}>{today}</div>
          <h2 className="greet">{greet}, {user?.name || 'Admin'}</h2>
        </div>
        <div className="seg" role="group" aria-label="Date range">
          {RANGES.map(r => <button key={r} className={days === r ? 'on' : ''} aria-pressed={days === r} onClick={() => setDays(r)}>{r} days</button>)}
        </div>
      </div>

      {err && <div className="error" role="alert">Could not load the dashboard: {err}</div>}
      {!d && !err && <div className="card"><p className="muted">Loading the dashboard…</p></div>}

      {d && <>
        <div className="kpis">
          <Kpi label="Revenue" value={peso(d.cur.revenue)} cur={d.cur.revenue} prev={d.prev.revenue} days={days} />
          <Kpi label="Profit" value={peso(d.cur.profit)} note={`${d.cur.revenue ? Math.round((d.cur.profit / d.cur.revenue) * 100) : 0}% margin`} />
          <Kpi label="Orders" value={d.cur.orders} cur={d.cur.orders} prev={d.prev.orders} days={days} />
          <Kpi label="Units sold" value={d.cur.units} cur={d.cur.units} prev={d.prev.units} days={days} />
          <Kpi label="Avg. order value" value={peso(aov(d.cur))} cur={aov(d.cur)} prev={aov(d.prev)} days={days} />
          <Kpi label="New customers" value={d.newCustomers.cur} note={`${d.customers.locked} locked`} />
        </div>

        <div className="ov-grid">
          <section className="card">
            <div className="card-head"><h3>Revenue per day</h3><span className="muted small">{peso(d.cur.revenue)} in the last {days} days</span></div>
            <Trend data={d.series} />
          </section>
          <section className="card ov-side">
            <h3>Revenue by category</h3>
            {d.category.length
              ? d.category.map(c => (
                  <div key={c.category} className="cat-bar">
                    <div className="cat-bar-top"><span>{c.category}</span><b>{peso(c.revenue)} · {catTotal ? Math.round((c.revenue / catTotal) * 100) : 0}%</b></div>
                    <div className="track"><div style={{ width: `${Math.max(2, (c.revenue / catMax) * 100)}%` }} /></div>
                  </div>
                ))
              : <p className="muted">No sales in this period.</p>}
            {d.category.length < 3 && <div className="hint-box">Other categories appear here as soon as they sell.</div>}
          </section>
        </div>

        <div className="grid2">
          <section className="card">
            <h3>Top products</h3>
            {d.top.length
              ? d.top.map((p, i) => (
                  <div key={p.name} className="list-row">
                    <span className={'rank' + (i === 0 ? ' first' : '')}>{i + 1}</span>
                    <div className="grow"><b>{p.name}</b><div className="muted small" style={{ margin: 0 }}>{p.units} sold</div></div>
                    <b className="num">{peso(p.revenue)}</b>
                  </div>
                ))
              : <p className="muted">No sales in this period.</p>}
          </section>
          <section className="card">
            <h3>Low stock alerts</h3>
            {d.lowStock.length
              ? d.lowStock.map(p => (
                  <div key={p.id} className="list-row">
                    <span className={'dot-lg' + (p.stock < 1 ? ' bad' : '')} aria-hidden="true" />
                    <div className="grow"><b>{p.name}</b><div className="muted small" style={{ margin: 0 }}>{p.category}</div></div>
                    <span className={'status ' + (p.stock < 1 ? 'bad' : 'warn')}>{p.stock < 1 ? 'Out of stock' : `${p.stock} left`}</span>
                  </div>
                ))
              : <p className="muted">Every product has enough stock.</p>}
          </section>
        </div>

        <section className="card">
          <h3>Recent orders</h3>
          {d.recent.length
            ? <div className="table-wrap"><table className="rtable">
                <thead><tr><th>Order</th><th>Customer</th><th>Product</th><th>Date</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                <tbody>{d.recent.map(o => <tr key={o.id}>
                  <td data-label="Order"><b>#{o.id}</b></td><td data-label="Customer">{o.customer}</td><td data-label="Product">{o.product}</td>
                  <td data-label="Date" className="muted-cell">{short(o.sale_date)}</td>
                  <td data-label="Status"><span className={'status ' + tone(o.status)}>{o.status || 'Pending'}</span></td>
                  <td data-label="Total" style={{ textAlign: 'right' }}><b className="num">{peso(o.total)}</b></td>
                </tr>)}</tbody>
              </table></div>
            : <p className="muted">No orders yet.</p>}
        </section>
      </>}

      <h3 className="section-title" style={{ margin: '28px 0 12px' }}>Project overview</h3>

      <div className="card">
        <h3>Case study: Solar World Corporation</h3>
        <p><b>Company.</b> Solar World Corporation sells solar panels, inverters, batteries and mounting kits to residential and commercial customers in Luzon, Visayas and Mindanao. Sales come from five channels: Facebook, Google Ads, Email, Referral and Trade Show.</p>
        <p><b>Problem.</b> The company spreads its marketing budget over several channels and ships to three regions, but it does not know which channel gives the best return, which products and regions earn the most, or where shipping costs reduce profit.</p>
        <p><b>Goal.</b> Find the best advertising strategy and keep shipping cost as low as possible by analyzing the company's own data.</p>
      </div>

      <div className="card">
        <h3>Data collected (at least 50 records in each variable)</h3>
        <div className="table-wrap"><table className="rtable">
          <thead><tr><th>Variable</th><th>What it records</th><th>Records</th><th>At least 50?</th></tr></thead>
          <tbody>{VARS.map(([k, name, what]) => <tr key={k}>
            <td data-label="Variable"><b>{name}</b></td><td data-label="What it records">{what}</td><td data-label="Records">{n[k] ?? '...'}</td>
            <td data-label="At least 50?">{n[k] === undefined ? '' : <span className={'status ' + (n[k] >= 50 ? 'ok' : 'warn')}>{n[k] >= 50 ? 'Yes' : 'No'}</span>}</td>
          </tr>)}</tbody>
        </table></div>
      </div>

      <div className="card">
        <h3>Analytics process: step-wise connections</h3>
        <div className="flow">
          {STEPS.map((s, i) => (
            <Fragment key={s.name}>
              <div className="step"><b>{s.name}</b><div className="muted" style={{ margin: 0 }}>{s.q}</div><p>{s.does}</p><p className="muted">Output: {s.out}</p></div>
              {i < STEPS.length - 1 && <div className="arrow" aria-hidden="true">→</div>}
            </Fragment>
          ))}
        </div>
      </div>
    </>
  );
}