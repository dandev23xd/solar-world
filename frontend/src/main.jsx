import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Login from './Login.jsx';
import Shop from './Shop.jsx';
import { getToken, savedUser, clearSession } from './auth.js';
import './styles.css';

function Root() {
  const [user, setUser] = useState(() => (getToken() ? savedUser() : null));
  const logout = () => { clearSession(); setUser(null); };
  if (!user) return <Login onLogin={setUser} />;
  return user.role === 'buyer' ? <Shop user={user} onLogout={logout} /> : <App user={user} onLogout={logout} />;
}
createRoot(document.getElementById('root')).render(<Root />);