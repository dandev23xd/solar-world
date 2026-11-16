export const getToken = () => localStorage.getItem('token');
export const savedUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
export const saveSession = (token, user) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); };
export const clearSession = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); };

const parse = async r => {
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || d.message || (r.status >= 500 ? 'Server error. Make sure the backend is running with php artisan serve.' : 'Request failed'));
  return d;
};

const unauthorized = r => {
  if (r.status === 401 && getToken()) { clearSession(); location.reload(); }
  return r;
};

export const get = u => fetch(u, {
  headers: { Accept: 'application/json', Authorization: 'Bearer ' + getToken() },
}).then(unauthorized).then(parse);

export const post = async (u, body) => {
  let r;
  try {
    r = await fetch(u, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Start the backend with php artisan serve.');
  }
  return parse(r);
};

export const send = (method, u, body) => fetch(u, {
  method,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
  body: body ? JSON.stringify(body) : undefined,
}).then(unauthorized).then(parse);