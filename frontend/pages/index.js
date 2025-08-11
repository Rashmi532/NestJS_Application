import { useState } from 'react';
import Router from 'next/router';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Login() {
  const [username, setUsername] = useState('frontdesk');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function doLogin(e) {
    e.preventDefault();
    setErr('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const txt = await res.text();
        setErr('Login failed: ' + txt);
        return;
      }
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      Router.push('/dashboard');
    } catch (e) {
      setErr('Network error: ' + e.message);
    }
  }

  return (
    <div className="root">
      <div className="card">
        <img src="/logo.png" alt="logo" className="logo"/>
        <h1>Clinic Front Desk</h1>
        <p className="subtitle">Login to manage queue & appointments</p>
        <form onSubmit={doLogin}>
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          {err && <div className="err">{err}</div>}
          <button className="primary-btn" type="submit">Sign in</button>
        </form>
        <p style={{fontSize:12, color:'#666'}}>Use username <strong>frontdesk</strong> and the password <em>frontdesk123</em>.</p>
      </div>
      <style jsx>{`
        .root {
          font-family: 'Inter', sans-serif;
          display:flex;
          min-height:100vh;
          align-items:center;
          justify-content:center;
          background: linear-gradient(180deg,#eaf4ff 0%, #ffffff 100%);
          padding: 24px;
        }
        .card {
          width:380px;
          padding:28px;
          border-radius:12px;
          box-shadow: 0 8px 30px rgba(20,40,80,0.08);
          background: white;
          text-align:center;
        }
        .logo { width:64px; height:64px; object-fit:contain; margin-bottom:8px; }
        h1 { margin:0; color:#034b7a }
        .subtitle { color:#377e9e; margin-bottom:16px; }
        label { display:block; text-align:left; font-weight:600; margin-top:10px; font-size:13px; }
        input { width:100%; padding:10px; border-radius:8px; border:1px solid #e4eef8; margin-top:6px; box-sizing:border-box; }
        .primary-btn { margin-top:16px; width:100%; padding:10px; border-radius:10px; border:0; background:#0077b6; color:white; font-weight:600; cursor:pointer; }
        .err { color:#b00020; margin-top:8px; font-size:13px; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
    </div>
  );
}
