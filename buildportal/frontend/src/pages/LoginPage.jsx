import React from 'react';
import spritleLogo from '../assets/SPRITLE  Logo SVG.svg';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';

export default function LoginPage() {
  const handleGithub = () => {
    const isLogout = localStorage.getItem('bp_logged_out') === 'true';
    window.location.href = isLogout ? '/api/auth/github?logout=true' : '/api/auth/github';
  };

  const handleGitlab = () => {
    const isLogout = localStorage.getItem('bp_logged_out') === 'true';
    window.location.href = isLogout ? '/api/auth/gitlab?logout=true' : '/api/auth/gitlab';
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <img src={spritleLogo} alt="Spritle Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
          <span style={styles.logoText}>BuildPortal</span>
        </div>
        <h1 style={styles.title}>Mobile Build Generator</h1>
        <p style={styles.subtitle}>Connect your GitHub or GitLab to start building iOS and Android apps from your Mac Mini.</p>

        <div style={styles.buttons}>
          <button style={{ ...styles.btn, ...styles.btnGithub }} onClick={handleGithub}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
          <button style={{ ...styles.btn, ...styles.btnGitlab }} onClick={handleGitlab}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
            </svg>
            Continue with GitLab
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: Colors.bg, padding: 'var(--space-4)' },
  card: { background: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-xl)', padding: 'var(--space-10)', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: Colors.shadow, animation: 'fadeIn 0.4s ease' },
  logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' },
  logoText: { ...Fonts.ExtraBold, fontSize: '1.5rem', color: Colors.text },
  title: { fontSize: 'var(--text-lg)', ...Fonts.Bold, marginBottom: 'var(--space-3)', color: Colors.text },
  subtitle: { color: Colors.textMuted, fontSize: 'var(--text-sm)', lineHeight: 1.7, marginBottom: 'var(--space-8)', maxWidth: '36ch', margin: '0 auto var(--space-8)', ...Fonts.Regular },
  buttons: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' },
  btn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)', ...Fonts.SemiBold, fontSize: 'var(--text-sm)', transition: 'all var(--transition)', border: '1px solid transparent' },
  btnGithub: { background: Colors.github, color: Colors.white, borderColor: 'rgba(255,255,255,0.1)' },
  btnGitlab: { background: Colors.gitlab, color: Colors.white },
};