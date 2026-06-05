import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice.js';
import { PlusCircle, ClipboardList, Link2, BarChart2, Settings, FileText, LogOut, History } from 'lucide-react';
import { api } from '../services/api.js';
import { disconnectSocket } from '../services/socket.js';
import spritleLogo from '../assets/SPRITLE  Logo SVG.svg';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';

const NAV = [
  { to: '/build', label: 'New Build', icon: PlusCircle },
  { to: '/history', label: 'Build History', icon: History },
  { to: '/workspace', label: 'Connected workspace', icon: Link2 },
  { to: '/analytics', label: 'Analytical', icon: BarChart2 },
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.brandText}>Spritle Paddock</span>
              <span style={styles.brandSubtext}>Engineering Portal</span>
            </div>
          </div>
          <nav style={styles.nav}>
            {NAV.map(n => {
              const Icon = n.icon;
              if (n.to === '#') {
                return (
                  <a
                    key={n.label}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={styles.navItem}
                  >
                    <Icon size={18} />
                    <span>{n.label}</span>
                  </a>
                );
              }
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  style={({ isActive }) => ({
                    ...styles.navItem,
                    ...(isActive ? styles.navActive : {})
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} style={{ color: isActive ? Colors.sidebarActiveText : Colors.sidebarUnselectedText }} />
                      <span style={{ fontWeight: isActive ? '700' : 'normal' }}>{n.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div style={styles.sidebarBottom}>
          <div style={styles.bottomNav}>
            <a href="#settings" onClick={(e) => e.preventDefault()} style={styles.bottomNavItem}>
              <Settings size={18} style={{ color: '#64748b' }} />
              <span>Settings</span>
            </a>
            <a href="#documentation" onClick={(e) => e.preventDefault()} style={styles.bottomNavItem}>
              <FileText size={18} style={{ color: '#64748b' }} />
              <span>Documentation</span>
            </a>
            <button onClick={handleLogout} style={styles.bottomNavItem}>
              <LogOut size={18} style={{ color: '#64748b' }} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main} className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav style={styles.mobileNav} className="flex md:hidden items-center justify-around shrink-0">
        {NAV.filter(n => n.to !== '#').map(n => {
          const Icon = n.icon;
          return (
            <NavLink
              key={n.to}
              to={n.to}
              style={({ isActive }) => ({
                ...styles.mobileNavItem,
                ...(isActive ? styles.mobileNavActive : {})
              })}
            >
              <Icon size={20} style={{ marginBottom: '2px' }} />
              <span>{n.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

const styles = {
  // Desktop Styles
  sidebar: { width: 220, background: Colors.sidebarBg, borderRight: `1px solid ${Colors.border}`, paddingBottom: 'var(--space-4)' },
  sidebarTop: { padding: '20px 12px' },
  brand: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' },
  brandText: { ...Fonts.Bold, fontSize: '1.15rem', color: Colors.sidebarBrand, letterSpacing: '-0.3px', lineHeight: '1.2', whiteSpace: 'nowrap' },
  brandSubtext: { fontSize: '0.8rem', color: Colors.textMuted, fontFamily: 'var(--font-body)', fontWeight: '500', marginTop: '2px' },
  nav: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
  navItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', color: Colors.sidebarUnselectedText, fontSize: '13px', ...Fonts.Medium, transition: 'all var(--transition)', textDecoration: 'none', outline: 'none', whiteSpace: 'nowrap' },
  navActive: { background: Colors.sidebarActiveBg, color: Colors.sidebarActiveText, border: 'none', outline: 'none' },
  sidebarBottom: { padding: '0 12px', borderTop: `1px solid ${Colors.border}`, paddingTop: 'var(--space-4)' },
  bottomNav: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
  bottomNavItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', color: Colors.sidebarUnselectedText, fontSize: '13px', ...Fonts.Medium, transition: 'all var(--transition)', cursor: 'pointer', textAlign: 'left', width: '100%', background: 'transparent', border: 'none', whiteSpace: 'nowrap' },
  main: { background: '#f8fafc' },
  // Mobile Styles
  mobileHeader: { height: 60, padding: '0 var(--space-4)', background: Colors.surface, borderBottom: `1px solid ${Colors.border}` },
  mobileBrand: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
  mobileBrandText: { ...Fonts.ExtraBold, fontSize: '1.05rem', color: Colors.text },
  mobileUserActions: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' },
  mobileAvatar: { width: 28, height: 28, borderRadius: 'var(--radius-full)', flexShrink: 0 },
  mobileLogoutBtn: { color: Colors.textMuted, background: 'transparent', border: 'none', padding: 'var(--space-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  mobileNav: { height: 64, background: Colors.surface, borderTop: `1px solid ${Colors.border}`, padding: '0 var(--space-2)' },
  mobileNavItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: Colors.textMuted, fontSize: '10px', ...Fonts.Medium, textDecoration: 'none', transition: 'all var(--transition)', flex: 1, height: '100%', borderRadius: 'var(--radius-md)' },
  mobileNavActive: { color: '#2563eb', background: '#eff6ff' },
};

