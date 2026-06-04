import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice.js';
import { LogOut, CirclePlus, History, Link2, BarChart2, Bell, HelpCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { disconnectSocket } from '../services/socket.js';
import spritleLogo from '../assets/SPRITLE  Logo SVG.svg';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';

const NAV = [
  { to: '/build', label: 'New Build', Icon: CirclePlus, emoji: '⚡' },
  { to: '/history', label: 'Build History', Icon: History, emoji: '📋' },
  { to: '/workspaces', label: 'Connected Workspaces', Icon: Link2, emoji: '🔗' },
  { to: '/analytics', label: 'Analytics', Icon: BarChart2, emoji: '📊' },
];

const PAGE_TITLES = {
  '/build': { title: 'New Build', live: false },
  '/history': { title: 'Build History', live: false },
  '/workspaces': { title: 'Connected Workspaces', live: false },
  '/analytics': { title: 'Analytical Dashboard', live: true },
  '/repositories': { title: 'Repositories', live: false },
  '/error-monitor': { title: 'Error Monitor', live: false },
};

export default function DashboardLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(s => s.auth);
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [bellHovered, setBellHovered] = useState(false);
  const [helpHovered, setHelpHovered] = useState(false);

  const currentPage = PAGE_TITLES[location.pathname] || { title: 'Dashboard', live: false };

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
            <span style={styles.brandTitle}>Spritle Paddock</span>
            <span style={styles.brandSubtitle}>Engineering Portal</span>
          </div>
          <nav style={styles.nav}>
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navActive : hoveredItem === n.to ? styles.navHover : {}),
                })}
                onMouseEnter={() => setHoveredItem(n.to)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {({ isActive }) => (
                  <>
                    <span style={isActive ? styles.iconWrapperActive : styles.iconWrapper}>
                      <n.Icon
                        size={isActive ? 18 : 22}
                        strokeWidth={2.2}
                        color={isActive ? '#FFFFFF' : '#4B5563'}
                      />
                    </span>
                    <span style={isActive ? styles.navLabelActive : styles.navLabel}>{n.label}</span>
                  </>
                )}
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

      {/* Content Wrapper: Desktop Content Header + Main */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
        {/* Desktop Content Header */}
        <header className="hidden md:flex items-center justify-between shrink-0" style={styles.contentHeader}>
          <div style={styles.pageTitleSection}>
            <h1 style={styles.pageTitle}>{currentPage.title}</h1>
            {currentPage.live && (
              <div style={styles.liveBadge}>
                <span style={styles.liveDot} />
                <span style={styles.liveBadgeText}>LIVE UPDATING</span>
              </div>
            )}
          </div>
          <div style={styles.headerActions}>
            <button
              style={{ ...styles.iconButton, ...(bellHovered ? styles.iconButtonHover : {}) }}
              onMouseEnter={() => setBellHovered(true)}
              onMouseLeave={() => setBellHovered(false)}
              title="Notifications"
            >
              <Bell size={20} color="#374151" />
            </button>
            <button
              style={{ ...styles.iconButton, ...(helpHovered ? styles.iconButtonHover : {}) }}
              onMouseEnter={() => setHelpHovered(true)}
              onMouseLeave={() => setHelpHovered(false)}
              title="Help"
            >
              <HelpCircle size={20} color="#374151" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main style={styles.main} className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

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
            <span style={{ fontSize: '1.25rem', marginBottom: '2px' }}>{n.emoji}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

const styles = {
  // Desktop Styles
  sidebar: {
    width: 260,
    background: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
  },
  sidebarTop: { padding: '24px 16px 16px 16px' },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: '32px',
    paddingLeft: '8px',
  },
  brandTitle: {
    fontFamily: 'Google Sans',
    fontWeight: '700',
    fontSize: '18px',
    color: '#0F4AA3',
    lineHeight: '1.2',
  },
  brandSubtitle: {
    fontFamily: 'Google Sans',
    fontWeight: '500',
    fontSize: '12px',
    color: '#4B5563',
    lineHeight: '1.4',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '0 12px',
    height: '50px',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'background 200ms ease',
    cursor: 'pointer',
  },
  navActive: {
    background: '#DDE4FF',
  },
  navHover: {
    background: '#F5F7FF',
  },
  navLabel: {
    color: '#4B5563',
    fontSize: '16px',
    fontFamily: 'Google Sans',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#0F4AA3',
    fontSize: '16px',
    fontFamily: 'Google Sans',
    fontWeight: '500',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    flexShrink: 0,
  },
  iconWrapperActive: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: '#0F4AA3',
    borderRadius: '4px',
    flexShrink: 0,
  },
  sidebarBottom: { padding: 'var(--space-4)', borderTop: '1px solid #E5E7EB' },
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

  // Desktop Content Header
  contentHeader: {
    height: '72px',
    padding: '0 28px',
    background: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    flexShrink: 0,
  },
  pageTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pageTitle: {
    fontFamily: 'Google Sans',
    fontSize: '22px',
    fontWeight: '700',
    color: '#0F3D99',
    margin: 0,
    lineHeight: '1',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#DCFCE7',
    borderRadius: '999px',
    padding: '5px 12px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#16A34A',
    flexShrink: 0,
  },
  liveBadgeText: {
    fontFamily: 'Google Sans',
    fontSize: '11px',
    fontWeight: '600',
    color: '#15803D',
    letterSpacing: '0.05em',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 180ms ease',
  },
  iconButtonHover: {
    background: '#F3F4F6',
  },
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
