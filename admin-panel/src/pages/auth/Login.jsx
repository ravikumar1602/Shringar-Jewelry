import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../store/slices/authSlice';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { loading, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginAdmin(form));
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg,#1A1A2E 0%,#16213E 50%,#0F3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 400,
        boxShadow: '0 25px 50px rgba(0,0,0,.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✨</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1A1A2E' }}>Shringar Admin</h1>
          <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 14 }}>Sign in to your admin panel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email Address</label>
            <input
              type="email" value={form.email} required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@shringar.com"
              style={{
                width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB',
                borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
            <input
              type="password" value={form.password} required
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB',
                borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: loading ? '#9CA3AF' : '#C8A96E',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .2s',
          }}>
            {loading ? '⏳ Signing in...' : '🔑 Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
