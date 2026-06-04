import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice.js';
import { LogOut } from 'lucide-react';
import { api } from '../services/api.js';
import { disconnectSocket } from '../services/socket.js';
import spritleLogo from '../assets/SPRITLE  Logo SVG.svg';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';

const NAV = [
  { to: '/build', label: 'New Build', icon: '⚡' },
  { to: '/history', label: 'Build History', icon: '📋' },
  { to: '/keystores', label: 'Keystores', icon: '🔑' },
];

export default function DashboardLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [logoutHovered, setLogoutHovered] = useState(false);

  const handleLogout = async () => {
    try {
      disconnectSocket();
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      sessionStorage.removeItem('bp_token');
      localStorage.setItem('bp_logged_out', 'true');
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-dvh overflow-hidden" style={{ background: Colors.bg }}>
      {/* Mobile Top Header Bar */}
      <header style={styles.mobileHeader} className="flex md:hidden items-center justify-between shrink-0">
        <div style={styles.mobileBrand}>
          <img src={spritleLogo} alt="Spritle Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <span style={styles.mobileBrandText}>BuildPortal</span>
        </div>
        {user && (
          <div style={styles.mobileUserActions}>
            <img src={user.avatar} alt={user.name} style={styles.mobileAvatar} />
            <button
              onClick={handleLogout}
              style={styles.mobileLogoutBtn}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside style={styles.sidebar} className="hidden md:flex flex-col justify-between shrink-0">
        <div style={styles.sidebarTop}>

          <div style={styles.brand}>
            <img src={spritleLogo} alt="Spritle Logo" style={{ width: '60px', height: '50px', objectFit: 'contain', }} />
            <span style={styles.brandText}>BuildPortal</span>
          </div>
          <nav style={styles.nav}>
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navActive : {}) })}>
                <span>{n.icon}</span>
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div style={styles.sidebarBottom}>
          {user && (
            <div style={styles.userRow}>
              <img src={user.avatar} alt={user.name} style={styles.avatar} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.userName}>{user.name}</div>
                <div style={styles.userProvider}>{user.provider}</div>
              </div>
              <button
                onClick={handleLogout}
                onMouseEnter={() => setLogoutHovered(true)}
                onMouseLeave={() => setLogoutHovered(false)}
                style={{
                  ...styles.logoutBtn,
                  ...(logoutHovered ? styles.logoutBtnHover : {})
                }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
          <div style={styles.footerBrand}>
            <span style={styles.poweredByText}>Powered by</span>
            <img
              src={spritleLogo}
              alt="Spritle Logo"
              style={{ width: '60px', height: '40px', objectFit: 'contain' }}
            />
          </div>
        </div>

      </aside>

      {/* Main content */}
      <main style={styles.main} className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav style={styles.mobileNav} className="flex md:hidden items-center justify-around shrink-0">
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            style={({ isActive }) => ({
              ...styles.mobileNavItem,
              ...(isActive ? styles.mobileNavActive : {})
            })}
          >
            <span style={{ fontSize: '1.25rem', marginBottom: '2px' }}>{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

const styles = {
  // Desktop Styles
  sidebar: { width: 220, background: Colors.surface, borderRight: `1px solid ${Colors.border}` },
  sidebarTop: { padding: 'var(--space-5)' },
  brand: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' },
  brandText: { ...Fonts.ExtraBold, fontSize: '1.1rem', color: Colors.text },
  nav: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
  navItem: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', color: Colors.textMuted, fontSize: 'var(--text-sm)', ...Fonts.Medium, transition: 'all var(--transition)' },
  navActive: { background: Colors.primaryBg, color: Colors.text, border: `1px solid ${Colors.primary}` },
  sidebarBottom: { padding: 'var(--space-4)', borderTop: `1px solid ${Colors.border}` },
  userRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' },
  avatar: { width: 32, height: 32, borderRadius: 'var(--radius-full)', flexShrink: 0 },
  userName: { fontSize: 'var(--text-sm)', ...Fonts.SemiBold, color: Colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userProvider: { fontSize: 'var(--text-xs)', color: Colors.textFaint, textTransform: 'capitalize' },
  logoutBtn: {
    color: Colors.textMuted,
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-2)',
    cursor: 'pointer',
    transition: 'all var(--transition)'
  },
  logoutBtnHover: {
    color: Colors.error,
    background: Colors.errorBg
  },
  main: { background: Colors.bg },
  footerBrand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-1)',
    paddingTop: 'var(--space-5)',
  },
  poweredByText: {
    fontSize: 'var(--text-xs)',
    color: Colors.textFaint,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    ...Fonts.Medium,
  },
  // Mobile Styles
  mobileHeader: { height: 60, padding: '0 var(--space-4)', background: Colors.surface, borderBottom: `1px solid ${Colors.border}` },
  mobileBrand: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
  mobileBrandText: { ...Fonts.ExtraBold, fontSize: '1.05rem', color: Colors.text },
  mobileUserActions: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' },
  mobileAvatar: { width: 28, height: 28, borderRadius: 'var(--radius-full)', flexShrink: 0 },
  mobileLogoutBtn: { color: Colors.textMuted, background: 'transparent', border: 'none', padding: 'var(--space-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  mobileNav: { height: 64, background: Colors.surface, borderTop: `1px solid ${Colors.border}`, padding: '0 var(--space-2)' },
  mobileNavItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: Colors.textMuted, fontSize: '10px', ...Fonts.Medium, textDecoration: 'none', transition: 'all var(--transition)', flex: 1, height: '100%', borderRadius: 'var(--radius-md)' },
  mobileNavActive: { color: Colors.primary, background: Colors.primaryBg },
};

