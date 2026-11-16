import { useState } from 'react';
import { post, saveSession } from './auth.js';
import { ThemeToggle } from './theme.jsx';

const LOCKED = 'Your account has been locked';
const EMPTY = { name: '', email: '', password: '', region: 'Luzon', type: 'Residential', phone: '', address: '', message: '' };
const TITLES = {
  login: ['Welcome back', 'Sign in to your Solar World account'],
  register: ['Create your buyer account', 'Join Solar World and start shopping'],
  forgot: ['Forgot Password', 'Enter your email to receive a password reset link'],
  link: ['Password Reset Link', 'Click the link below to reset your password:'],
  reset: ['Reset Password', 'Enter your new password below.'],
  appeal: ['Request unlock', 'Tell us why your account should be unlocked. An admin will review it.'],
};
const BUTTONS = { login: 'Sign in', register: 'Create account', forgot: 'Send Reset Link', reset: 'Update Password', appeal: 'Send request' };

export default function Login({ onLogin }) {
  const [token, setToken] = useState(() => new URLSearchParams(window.location.search).get('reset') || '');
  const [mode, setMode] = useState(token ? 'reset' : 'login');
  const [form, setForm] = useState(EMPTY);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [locked, setLocked] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const bad = v => (touched && !String(v).trim() ? 'bad' : '');

  const go = m => {
    if (m === 'login' && token) { window.history.replaceState({}, '', window.location.pathname); setToken(''); }
    setLink(''); setMode(m); setError(''); setNotice(''); setTouched(false);
    if (m !== 'appeal') setLocked('');
  };

  const submit = async e => {
    e.preventDefault();
    setError(''); setNotice('');
    if (mode === 'login') {
      if (!form.email.trim() || !form.password) { setTouched(true); setError('Username and password required'); return; }
    } else if (mode === 'register') {
      if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.email.trim() || !form.password) {
        setTouched(true); setError('Please fill in all the fields'); return;
      }
      const digits = form.phone.replace(/\D/g, '');
      if (!/^\+?[0-9 \-]+$/.test(form.phone.trim()) || digits.length < 10 || digits.length > 13) {
        setTouched(true); setError('Enter a valid phone number, for example 09123456789'); return;
      }
    } else if (mode === 'forgot') {
      if (!form.email.trim()) { setTouched(true); setError('Enter the email of your account'); return; }
    } else if (mode === 'appeal') {
      if (!form.email.trim() || !form.password) { setTouched(true); setError('Enter your email and password'); return; }
      if (form.message.trim().length < 10) { setTouched(true); setError('Please write at least 10 characters'); return; }
    } else if (form.password.length < 8) {
      setTouched(true); setError('Password must be at least 8 characters'); return;
    }
    setBusy(true);
    try {
      if (mode === 'register') {
        await post('/api/register', form);
        setForm(EMPTY); setTouched(false); setMode('login');
        setNotice('Account created. Please sign in with your email and password.');
      } else if (mode === 'forgot') {
        const out = await post('/api/forgot', { email: form.email });
        setForm(EMPTY);
        if (out.link) { setLink(out.link); setMode('link'); }
        else { setMode('login'); setNotice('If that email is registered, a reset link is on its way. Check your inbox and spam folder. The link works for 1 hour.'); }
      } else if (mode === 'reset') {
        await post('/api/reset', { token, password: form.password });
        window.history.replaceState({}, '', window.location.pathname);
        setToken(''); setForm(EMPTY); setTouched(false); setMode('login');
        setNotice('Your password was changed. Please sign in with your new password.');
      } else if (mode === 'appeal') {
        await post('/api/unlock-request', { email: form.email, password: form.password, message: form.message });
        setForm({ ...EMPTY, email: form.email }); setTouched(false); setLocked(''); setMode('login');
        setNotice('Request sent ✓ An admin will review your request. Try signing in again later.');
      } else {
        const { token: session, user } = await post('/api/login', form);
        saveSession(session, user); onLogin(user);
      }
    } catch (err) {
      if (mode === 'login' && String(err.message).startsWith(LOCKED)) setLocked(err.message);
      else setError(err.message);
    }
    setBusy(false);
  };

  const [title, subtitle] = TITLES[mode];
  const pwLabel = mode === 'reset' ? 'New password' : mode === 'appeal' ? "Password (to confirm it's you)" : 'Password';

  return (
    <div className="auth">
      <div className="auth-art">
        <div className="art">☀️</div>
        <h2>Power your future with Solar World</h2>
        <p>Quality solar panels, inverters, batteries and kits delivered across Luzon, Visayas and Mindanao.</p>
        <ul>
          <li>Shop solar products with pictures and prices</li>
          <li>Track all your orders in one place</li>
          <li>Admins get live analytics and forecasts</li>
        </ul>
      </div>
      <div className="auth-form">
        <ThemeToggle />
        <form className="login-card" onSubmit={submit} noValidate>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
          {notice && <div className="notice" role="status">{notice}</div>}

          {mode === 'link' && <>
            <p style={{ wordBreak: 'break-all', margin: '14px 0' }}><a href={link} style={{ color: '#b45309', textDecoration: 'underline' }}>{link}</a></p>
            <p className="muted small">This link expires in 1 hour.</p>
            <button type="button" className="link wide" onClick={() => go('login')}>Back to Login</button>
          </>}

          {mode !== 'link' && <>
            {mode === 'register' && <>
              <label htmlFor="name">Name</label>
              <input id="name" className={bad(form.name)} value={form.name} onChange={set('name')} placeholder="Juan Dela Cruz" autoComplete="name" />
              <label htmlFor="phone">Phone number</label>
              <input id="phone" type="tel" inputMode="tel" className={bad(form.phone)} value={form.phone} onChange={set('phone')} placeholder="09123456789" autoComplete="tel" />
              <label htmlFor="address">Address</label>
              <input id="address" className={bad(form.address)} value={form.address} onChange={set('address')} placeholder="House no., street, barangay, city" autoComplete="street-address" />
              <div className="row2">
                <label>Region<select value={form.region} onChange={set('region')}>{['Luzon', 'Visayas', 'Mindanao'].map(r => <option key={r}>{r}</option>)}</select></label>
                <label>Buying as<select value={form.type} onChange={set('type')}>{['Residential', 'Commercial'].map(r => <option key={r}>{r}</option>)}</select></label>
              </div>
            </>}
            {mode !== 'reset' && <>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" className={bad(form.email)} value={form.email} onChange={set('email')} placeholder={mode === 'forgot' ? 'Enter your email' : 'name@email.com'} autoComplete="username" />
            </>}
            {mode !== 'forgot' && <>
              <label htmlFor="pw">{pwLabel}</label>
              <input id="pw" type="password" className={bad(form.password)} value={form.password} onChange={set('password')} placeholder={mode === 'login' || mode === 'appeal' ? 'Your password' : mode === 'reset' ? 'New Password' : 'At least 8 characters'} autoComplete={mode === 'login' || mode === 'appeal' ? 'current-password' : 'new-password'} />
            </>}
            {mode === 'appeal' && <>
              <label htmlFor="message">Your message</label>
              <textarea id="message" rows={4} maxLength={1000} className={touched && form.message.trim().length < 10 ? 'bad' : ''} value={form.message} onChange={set('message')} placeholder="Explain what happened and why your account should be unlocked." />
              <p className="muted small" style={{ margin: '6px 0 0' }}>At least 10 characters</p>
            </>}
            {mode === 'login' && locked && (
              <div className="lock-box" role="alert">
                <p>{locked}</p>
                <button type="button" className="lock-btn" onClick={() => go('appeal')}>Request unlock</button>
              </div>
            )}
            <div className="error" role="alert">{error}</div>
            <button className="active wide" disabled={busy}>{busy ? 'Please wait…' : BUTTONS[mode]}</button>
            {mode === 'login' && <button type="button" className="link wide" onClick={() => go('forgot')}>Forgot password?</button>}
            {mode === 'login' && <button type="button" className="link wide" onClick={() => go('register')}>New here? Create an account</button>}
            {mode === 'register' && <button type="button" className="link wide" onClick={() => go('login')}>Already have an account? Sign in</button>}
            {(mode === 'forgot' || mode === 'reset' || mode === 'appeal') && <button type="button" className="link wide" onClick={() => go('login')}>← Back to sign in</button>}
          </>}
        </form>
      </div>
    </div>
  );
}