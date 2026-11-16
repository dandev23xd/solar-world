import { useEffect, useState } from 'react';
import Crud, { PAGES } from './Crud.jsx';
import Overview from './Overview.jsx';
import { Descriptive, Predictive, Prescriptive } from './Analytics.jsx';
import { get } from './auth.js';
import { ThemeToggle } from './theme.jsx';
import { SunLogo, GridIcon, BarsIcon, TrendIcon, TargetIcon, UsersIcon, BoxIcon, ReceiptIcon, MegaphoneIcon, TruckIcon, LogoutIcon } from './icons.jsx';

const NAV = [
  ['Analytics', [['overview', 'Overview', GridIcon], ['descriptive', 'Descriptive', BarsIcon], ['predictive', 'Predictive', TrendIcon], ['prescriptive', 'Prescriptive', TargetIcon]]],
  ['Manage', [['customers', 'Customers', UsersIcon], ['products', 'Products', BoxIcon], ['sales', 'Sales', ReceiptIcon], ['marketing', 'Marketing', MegaphoneIcon], ['shipments', 'Shipments', TruckIcon]]],
];
const INFO = {
  overview: 'Business dashboard, case study and data collected',
  descriptive: 'What happened? Sales, profit and customers in detail',
  predictive: 'What will happen? Revenue and stock forecasts',
  prescriptive: 'What should we do? Restocking, pricing and budget advice',
  customers: 'Manage customers', products: 'Manage products', sales: 'Manage sales', marketing: 'Manage marketing campaigns',
  shipments: 'Shipping cost and delivery days for each order',
};
const LABEL = Object.fromEntries(NAV.flatMap(([, items]) => items.map(([k, l]) => [k, l])));
const COUNTED = ['customers', 'products', 'sales'];

export default function App({ user, onLogout }) {
  const [tab, setTab] = useState('overview'), [open, setOpen] = useState(false), [region, setRegion] = useState('All');
  const [counts, setCounts] = useState({});
  const go = k => { setTab(k); setOpen(false); window.scrollTo(0, 0); };
  const initial = (user.name || 'A').trim()[0].toUpperCase();

  useEffect(() => { get('/api/overview').then(setCounts).catch(() => {}); }, [tab]);

  return (
    <div className="layout">
      <aside className={'side' + (open ? ' open' : '')}>
        <div className="brand"><SunLogo /> Solar World<ThemeToggle className="side-theme" /></div>
        {NAV.map(([group, items]) => (
          <nav key={group} aria-label={group}>
            <div className="nav-group">{group}</div>
            {items.map(([k, label, Icon]) => (
              <button key={k} className={'nav-item' + (tab === k ? ' on' : '')} onClick={() => go(k)} aria-current={tab === k ? 'page' : undefined}>
                <Icon />
                {label}
                {k === 'customers' && counts.unlock_requests > 0
                  ? <span className="count alert" title="Unlock requests">{counts.unlock_requests}</span>
                  : COUNTED.includes(k) && counts[k] !== undefined && <span className="count">{counts[k]}</span>}
              </button>
            ))}
          </nav>
        ))}
        <div className="side-foot">
          <div className="side-user">
            <span className="side-avatar" aria-hidden="true">{initial}</span>
            <div className="grow">
              <div className="who">{user.name}</div>
              <p className="muted small">{user.role === 'admin' ? 'Administrator' : 'Staff'}</p>
            </div>
            <button className="icon-btn" onClick={onLogout} aria-label="Sign out" title="Sign out"><LogoutIcon /></button>
          </div>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <main className="main">
        <header className={'topbar' + (tab === 'overview' ? ' only-burger' : '')}>
          <button className="burger" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          {tab !== 'overview' && <div className="grow"><h1>{LABEL[tab]}</h1><p className="muted">{INFO[tab]}</p></div>}
          {['descriptive', 'predictive'].includes(tab) && <select value={region} onChange={e => setRegion(e.target.value)} aria-label="Region">{['All', 'Luzon', 'Visayas', 'Mindanao'].map(x => <option key={x} value={x}>{x === 'All' ? 'All regions' : x}</option>)}</select>}
        </header>

        {tab === 'overview' && <Overview />}
        {PAGES[tab] && <Crud key={tab} page={PAGES[tab]} canEdit={user.role === 'admin'} />}
        {tab === 'descriptive' && <Descriptive region={region} />}
        {tab === 'predictive' && <Predictive region={region} />}
        {tab === 'prescriptive' && <Prescriptive />}
      </main>
    </div>
  );
}