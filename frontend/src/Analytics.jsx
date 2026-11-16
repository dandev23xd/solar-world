  import { useEffect, useState } from 'react';
  import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
  import { get } from './auth.js';

  const peso = n => '₱' + Math.round(n || 0).toLocaleString();
  const short = n => n >= 1e6 ? '₱' + (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? '₱' + Math.round(n / 1e3) + 'K' : '₱' + Math.round(n || 0);
  const axis = { tickFormatter: short, width: 58, tick: { fontSize: 12 } };
  const xt = { tick: { fontSize: 12 } };
  const GRID = { display: 'grid', gap: 14, marginBottom: 14 };
  const KPIS = { ...GRID, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' };
  const PAIR = { ...GRID, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' };
  const NOM = { margin: 0 };
  const RANGES = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [0, 'All time']];
  const TONE = { urgent: '#b91c1c', soon: '#b45309', tip: '#15803d', ok: '#15803d', low: '#b45309', critical: '#b91c1c', out: '#b91c1c', idle: '#6b7280' };
  const STATUS = { out: 'Out of stock', critical: 'Order now', low: 'Order soon', ok: 'OK', idle: 'No recent sales' };
  const LEVEL = { urgent: 'Urgent', soon: 'Soon', tip: 'Idea' };

  function useLoad(url) {
    const [d, setD] = useState(null), [err, setErr] = useState('');
    useEffect(() => {
      let on = true;
      setErr('');
      get(url).then(x => { if (on) setD(x); }).catch(e => { if (on) setErr(e.message); });
      return () => { on = false; };
    }, [url]);
    return [d, err];
  }

  function State({ d, err }) {
    if (err) return <div className="error" role="alert">Could not load this page: {err}</div>;
    if (!d) return <div className="card"><p className="muted">Loading…</p></div>;
    return null;
  }

  function Change({ cur, prev, days }) {
    if (prev === null || prev === undefined) return null;
    if (!prev && !cur) return <div className="muted small">No activity in either period</div>;
    if (!prev) return <div className="small" style={{ color: '#15803d' }}>New this period</div>;
    const pct = ((cur - prev) / prev) * 100, up = pct >= 0;
    return <div className="small" style={{ color: up ? '#15803d' : '#b91c1c' }}>{up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% vs previous {days} days</div>;
  }

  function Kpi({ label, value, cur, prev, days, sub }) {
    return (
      <div className="card" style={NOM}>
        <div className="muted small">{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, margin: '4px 0' }}>{value}</div>
        <Change cur={cur} prev={prev} days={days} />
        {sub && <div className="muted small" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
    );
  }

  function Card({ title, sub, children, grid }) {
    return (
      <div className="card" style={grid ? { ...NOM, minWidth: 0 } : { minWidth: 0 }}>
        <h3>{title}</h3>
        {sub && <p className="muted small">{sub}</p>}
        {children}
      </div>
    );
  }

  function MoneyBars({ data, profit, height = 240 }) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" {...xt} />
          <YAxis {...axis} />
          <Tooltip formatter={peso} />
          {profit && <Legend />}
          <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          {profit && <Bar dataKey="profit" name="Profit" fill="#16a34a" radius={[6, 6, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  export function Descriptive({ region }) {
    const [days, setDays] = useState(30);
    const [d, err] = useLoad(`/api/descriptive?region=${region}&days=${days}`);
    const margin = x => (x.revenue ? (x.profit / x.revenue) * 100 : 0);
    const aov = x => (x.orders ? x.revenue / x.orders : 0);
    const none = <p className="muted">No sales in this period.</p>;
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div className="muted small">Showing {region === 'All' ? 'all regions' : region}, {days ? `last ${days} days` : 'all time'}</div>
          <div className="chips">{RANGES.map(([v, t]) => <button key={v} className={'chip' + (days === v ? ' on' : '')} onClick={() => setDays(v)}>{t}</button>)}</div>
        </div>
        <State d={d} err={err} />
        {d && <>
          <div style={KPIS}>
            <Kpi label="Revenue" value={peso(d.cur.revenue)} cur={d.cur.revenue} prev={d.prev?.revenue} days={days} />
            <Kpi label="Profit" value={peso(d.cur.profit)} cur={d.cur.profit} prev={d.prev?.profit} days={days} />
            <Kpi label="Profit margin" value={`${margin(d.cur).toFixed(1)}%`} />
            <Kpi label="Orders" value={d.cur.orders} cur={d.cur.orders} prev={d.prev?.orders} days={days} />
            <Kpi label="Units sold" value={d.cur.units} cur={d.cur.units} prev={d.prev?.units} days={days} />
            <Kpi label="Average order value" value={peso(aov(d.cur))} cur={aov(d.cur)} prev={d.prev ? aov(d.prev) : undefined} days={days} />
            <Kpi label="Customers who ordered" value={d.cur.buyers} cur={d.cur.buyers} prev={d.prev?.buyers} days={days} />
          </div>

          <Card title="Revenue and profit over time" sub={d.days ? 'One point per day' : 'One point per month'}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={d.series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" {...xt} interval="preserveStartEnd" minTickGap={24} />
                <YAxis {...axis} />
                <Tooltip formatter={peso} />
                <Legend />
                <Area dataKey="revenue" name="Revenue" stroke="#f59e0b" fill="#fde68a" />
                <Area dataKey="profit" name="Profit" stroke="#16a34a" fill="#bbf7d0" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div style={PAIR}>
            <Card grid title="By product category">{d.category.length ? <MoneyBars data={d.category} profit /> : none}</Card>
            <Card grid title="By region" sub="Shows every region, whatever you picked in the top bar">{d.regions.length ? <MoneyBars data={d.regions} profit /> : none}</Card>
          </div>

          <div style={PAIR}>
            <Card grid title="By customer type">{d.customerType.length ? <MoneyBars data={d.customerType} profit /> : none}</Card>
            <Card grid title="By sales channel">{d.channel.length ? <MoneyBars data={d.channel} profit /> : none}</Card>
          </div>

          <Card title="Revenue by day of the week" sub="Which days your customers buy the most">
            <MoneyBars data={d.weekday} height={220} />
          </Card>

          <div style={PAIR}>
            <Card grid title="Top products">
              {d.topProducts.length
                ? <div className="table-wrap"><table className="rtable">
                    <thead><tr><th>Product</th><th>Units</th><th>Revenue</th><th>Margin</th></tr></thead>
                    <tbody>{d.topProducts.map(p => <tr key={p.id}>
                      <td data-label="Product">{p.name}</td><td data-label="Units">{p.units}</td><td data-label="Revenue">{peso(p.revenue)}</td>
                      <td data-label="Margin">{p.revenue ? ((p.profit / p.revenue) * 100).toFixed(1) : '0.0'}%</td>
                    </tr>)}</tbody>
                  </table></div>
                : none}
            </Card>
            <Card grid title="Top customers">
              {d.topCustomers.length
                ? <div className="table-wrap"><table className="rtable">
                    <thead><tr><th>Customer</th><th>Region</th><th>Orders</th><th>Spent</th></tr></thead>
                    <tbody>{d.topCustomers.map(c => <tr key={c.id}>
                      <td data-label="Customer">{c.name}</td><td data-label="Region">{c.region}</td><td data-label="Orders">{c.orders}</td><td data-label="Spent">{peso(c.revenue)}</td>
                    </tr>)}</tbody>
                  </table></div>
                : none}
            </Card>
          </div>
        </>}
      </>
    );
  }

  export function Predictive({ region }) {
    const [d, err] = useLoad(`/api/predictive?region=${region}`);
    return (
      <>
        <p className="muted small" style={{ marginBottom: 14 }}>Forecasts use the last 60 days of sales. They get more accurate as you collect more orders.</p>
        <State d={d} err={err} />
        {d && <>
          <div style={KPIS}>
            <Kpi label="Expected revenue, next 30 days" value={peso(d.next30)} cur={d.next30} prev={d.last30} days={30} />
            <Kpi label="Revenue trend" value={d.slope >= 0 ? 'Growing' : 'Declining'} sub={`${peso(Math.abs(d.slope))} per day`} />
            <Kpi label="New customers per week" value={d.customers.perWeek.toFixed(1)} sub="Average of the last 4 weeks" />
            <Kpi label="Expected new customers" value={d.customers.next4} sub="In the next 4 weeks" />
          </div>

          <Card title="Daily revenue and 30-day forecast" sub="The orange line is the 7-day average of real sales. The red dashed line is the forecast.">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={d.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" {...xt} interval="preserveStartEnd" minTickGap={30} />
                <YAxis {...axis} />
                <Tooltip formatter={peso} />
                <Legend />
                <Line dataKey="actual" name="7-day average" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line dataKey="forecast" name="Forecast" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Monthly trend and 3-month forecast">
            {d.monthly.length
              ? <>
                  <p className="muted small">Trend slope: <b>{peso(d.monthlySlope)}</b> per month ({d.monthlySlope >= 0 ? 'growing' : 'declining'})</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={d.monthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" {...xt} />
                      <YAxis {...axis} />
                      <Tooltip formatter={peso} />
                      <Legend />
                      <Line dataKey="actual" name="Actual" stroke="#f59e0b" strokeWidth={2} />
                      <Line dataKey="trend" name="Trend" stroke="#94a3b8" dot={false} />
                      <Line dataKey="forecast" name="Forecast" stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              : <p className="muted">A monthly forecast needs sales in at least 2 different months.</p>}
          </Card>

          <Card title="When will each product run out?" sub="Based on how many were sold in the last 30 days">
            <div className="table-wrap"><table className="rtable">
              <thead><tr><th>Product</th><th>In stock</th><th>Sells per day</th><th>Runs out in</th><th>Expected date</th><th>Status</th></tr></thead>
              <tbody>{d.stockout.map(r => <tr key={r.id}>
                <td data-label="Product">{r.name}</td><td data-label="In stock">{r.stock}</td><td data-label="Sells per day">{r.perDay}</td>
                <td data-label="Runs out in">{r.left === null ? '-' : r.left < 1 ? 'Today' : `${Math.floor(r.left)} days`}</td>
                <td data-label="Expected date">{r.date || '-'}</td>
                <td data-label="Status"><b style={{ color: TONE[r.status] }}>{STATUS[r.status]}</b></td>
              </tr>)}</tbody>
            </table></div>
          </Card>

          <Card title="New customers per week" sub="The last 8 weeks">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.customers.weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" {...xt} />
                <YAxis allowDecimals={false} width={40} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="customers" name="New customers" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>}
      </>
    );
  }

  export function Prescriptive() {
    const [budget, setBudget] = useState(500000);
    const [d, err] = useLoad(`/api/prescriptive?budget=${budget}`);
    return (
      <>
        <State d={d} err={err} />
        {d && <>
          <Card title="Recommended actions" sub="The most useful things to do next, most important first">
            {d.actions.length
              ? d.actions.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i ? '1px solid #f1e3b8' : 'none' }}>
                    <b style={{ color: TONE[a.level], minWidth: 62 }}>{LEVEL[a.level]}</b>
                    <span>{a.text}</span>
                  </div>
                ))
              : <p className="muted">Nothing needs your attention right now.</p>}
          </Card>

          <Card title="Marketing budget plan" sub="Money is split by how much each channel returns for every ₱1 spent">
            <label className="slider" style={{ display: 'block', marginBottom: 10 }}>Budget: <b>{peso(budget)}</b>
              <input type="range" min={100000} max={2000000} step={50000} value={budget} onChange={e => setBudget(+e.target.value)} style={{ width: '100%' }} />
            </label>
            {d.allocation.length
              ? <>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={d.allocation}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="channel" {...xt} />
                      <YAxis {...axis} />
                      <Tooltip formatter={peso} />
                      <Bar dataKey="allocate" name="Recommended budget" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="table-wrap"><table className="rtable">
                    <thead><tr><th>Channel</th><th>Spent so far</th><th>Revenue</th><th>Return per ₱1</th><th>Recommended budget</th></tr></thead>
                    <tbody>{d.allocation.map(a => <tr key={a.channel}>
                      <td data-label="Channel">{a.channel}</td><td data-label="Spent so far">{peso(a.spend)}</td><td data-label="Revenue">{peso(a.revenue)}</td>
                      <td data-label="Return per ₱1">₱{a.roi}</td><td data-label="Recommended budget"><b>{peso(a.allocate)}</b></td>
                    </tr>)}</tbody>
                  </table></div>
                </>
              : <p className="muted">Add marketing campaigns to get a budget plan.</p>}
          </Card>

          <Card title="Restock plan" sub="Enough stock for the next 30 days plus a week of safety">
            {d.restock.length
              ? <>
                  <div className="table-wrap"><table className="rtable">
                    <thead><tr><th>Product</th><th>In stock</th><th>Sells per day</th><th>Runs out in</th><th>Order</th><th>Estimated cost</th></tr></thead>
                    <tbody>{d.restock.map(r => <tr key={r.id}>
                      <td data-label="Product">{r.name} <b style={{ color: TONE[r.level] }}>{LEVEL[r.level]}</b></td>
                      <td data-label="In stock">{r.stock}</td><td data-label="Sells per day">{r.perDay}</td>
                      <td data-label="Runs out in">{r.left === null ? '-' : r.left < 1 ? 'Today' : `${Math.floor(r.left)} days`}</td>
                      <td data-label="Order"><b>{r.qty}</b></td><td data-label="Estimated cost">{peso(r.cost)}</td>
                    </tr>)}</tbody>
                  </table></div>
                  <p className="muted small">Total to restock: <b>{peso(d.restock.reduce((s, r) => s + r.cost, 0))}</b></p>
                </>
              : <p className="muted">Every product that is selling has enough stock for now.</p>}
          </Card>

          <div style={PAIR}>
            <Card grid title="Margin watch" sub="Products earning less than 20% on each sale">
              {d.margin.length
                ? <div className="table-wrap"><table className="rtable">
                    <thead><tr><th>Product</th><th>Price</th><th>Margin</th><th>For 25%</th></tr></thead>
                    <tbody>{d.margin.map(m => <tr key={m.id}>
                      <td data-label="Product">{m.name}</td><td data-label="Price">{peso(m.price)}</td>
                      <td data-label="Margin"><b style={{ color: TONE.critical }}>{m.margin}%</b></td><td data-label="For 25%">{peso(m.suggested)}</td>
                    </tr>)}</tbody>
                  </table></div>
                : <p className="muted">All products earn at least 20%.</p>}
            </Card>
            <Card grid title="Slow movers" sub="In stock, but no sales in the last 30 days">
              {d.slow.length
                ? <div className="table-wrap"><table className="rtable">
                    <thead><tr><th>Product</th><th>In stock</th><th>Money tied up</th></tr></thead>
                    <tbody>{d.slow.map(s => <tr key={s.id}>
                      <td data-label="Product">{s.name}</td><td data-label="In stock">{s.stock}</td><td data-label="Money tied up">{peso(s.tied)}</td>
                    </tr>)}</tbody>
                  </table></div>
                : <p className="muted">Everything in stock has sold recently.</p>}
            </Card>
          </div>

          <Card title="Shipping cost by region" sub="Average cost and delivery time per shipment">
            {d.shipping.length
              ? <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={d.shipping}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" {...xt} />
                    <YAxis tick={{ fontSize: 12 }} width={58} />
                    <Tooltip />
                    <Bar dataKey="avg_cost" name="Average cost" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              : <p className="muted">No shipments recorded yet.</p>}
          </Card>
        </>}
      </>
    );
  }