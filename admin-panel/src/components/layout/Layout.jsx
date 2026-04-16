import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const NAV_ITEMS = [
  { path: '/dashboard',   icon: '📊', label: 'Dashboard'  },
  { path: '/products',    icon: '💍', label: 'Products'   },
  { path: '/categories',  icon: '🏷️',  label: 'Categories' },
  { path: '/orders',      icon: '📦', label: 'Orders'     },
  { path: '/users',       icon: '👥', label: 'Users'      },
  { path: '/coupons',     icon: '🎟️',  label: 'Coupons'   },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 64, background: '#1A1A2E', color: '#fff',
        transition: 'width .25s', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, overflowX: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #2A2A4A', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>✨</span>
          {sidebarOpen && <span style={{ fontSize: 16, fontWeight: 700, color: '#C8A96E' }}>Shringar Admin</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ path, icon, label }) => (
            <NavLink key={path} to={path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 18px', color: isActive ? '#C8A96E' : '#9CA3AF',
              background: isActive ? 'rgba(200,169,110,.13)' : 'transparent',
              borderLeft: isActive ? '3px solid #C8A96E' : '3px solid transparent',
              textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 400,
              transition: 'all .15s', whiteSpace: 'nowrap',
            })}>
              <span style={{ fontSize: 18, minWidth: 22, textAlign: 'center' }}>{icon}</span>
              {sidebarOpen && label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        {sidebarOpen && (
          <div style={{ padding: '16px', borderTop: '1px solid #2A2A4A' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{user?.email}</div>
            <div style={{ fontSize: 13, color: '#C8A96E', marginBottom: 10, fontWeight: 600 }}>{user?.name}</div>
            <button onClick={handleLogout} style={{
              width: '100%', padding: '8px', background: '#DC2626', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            }}>Logout</button>
          </div>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          position: 'absolute', bottom: 90, right: -12, width: 24, height: 24,
          borderRadius: '50%', background: '#C8A96E', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#1A1A2E',
        }}>{sidebarOpen ? '◀' : '▶'}</button>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: sidebarOpen ? 240 : 64, flex: 1, transition: 'margin .25s', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50, background: '#fff',
          borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1A1A2E' }}>
            ✨ Shringar Jewelry
          </h2>
          <span style={{
            background: '#FEF3C7', color: '#92400E', padding: '4px 12px',
            borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>Admin Panel</span>
        </header>
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}
