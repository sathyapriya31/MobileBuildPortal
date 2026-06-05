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
    <>
      <style>{`
        .login-github-btn:hover { background: #002d70 !important; }
        .login-gitlab-btn:hover { background: #f1f5f9 !important; }
        @media (max-width: 900px) {
          .login-hero { flex-direction: column !important; padding: 40px 24px !important; gap: 48px !important; }
          .login-right { display: none !important; }
          .login-left { max-width: 100% !important; }
        }
      `}</style>

      <div style={styles.page}>

        <main className="login-hero" style={styles.hero}>

          {/* Left column */}
          <div className="login-left" style={styles.leftCol}>

            {/* Inline logo */}
            <div style={styles.logoRow}>
              <img src={spritleLogo} alt="Spritle" style={styles.logoImg} />
              <span style={styles.logoName}>Paddock</span>
            </div>

            {/* Pill */}
            <div style={styles.pill}>
              <span style={styles.pillDot} />
              Serverless Mobile Build Platform
            </div>

            {/* Headline */}
            <h1 style={styles.headline}>
              <span style={styles.headlineBlack}>Build iOS &amp; Android</span>
              <span style={styles.headlineBlack}>Apps</span>
              <span style={styles.headlineBlue}>Without Local</span>
              <span style={styles.headlineBlue}>Build Complexity</span>
            </h1>

            {/* Description */}
            <p style={styles.description}>
              Cloud-native build infrastructure with GitHub integration,
              secure credential signing, and automated deployment
              pipelines — without any local environment setup.
            </p>

            {/* Auth buttons */}
            <div style={styles.authBtns}>
              <button className="login-github-btn" style={styles.githubBtn} onClick={handleGithub}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Continue with GitHub
              </button>
              <button className="login-gitlab-btn" style={styles.gitlabBtn} onClick={handleGitlab}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
                </svg>
                Continue with GitLab
              </button>
            </div>
          </div>

          {/* Right column */}
          <div className="login-right" style={styles.rightCol}>

            {/* Feature list */}
            <div style={styles.featureList}>
              {[
                {
                  icon: '⚡',
                  title: 'Cloud Build Infrastructure',
                  desc: 'Deploy iOS on Apple Silicon and Android Gradle on fast cloud runners.',
                },
                {
                  icon: '🔒',
                  title: 'AES-256 Secure Credentials',
                  desc: 'App Store Connect .p8 and Android Keystores fully encrypted at rest.',
                },
                {
                  icon: '🚀',
                  title: 'Fast Build Pipeline',
                  desc: 'Trigger multiplatform production builds directly from your browser.',
                },
              ].map((f) => (
                <div key={f.title} style={styles.featureItem}>
                  <div style={styles.featureIconWrap}>
                    <span style={styles.featureIconEmoji}>{f.icon}</span>
                  </div>
                  <div>
                    <div style={styles.featureTitle}>{f.title}</div>
                    <div style={styles.featureDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Browser mockup */}
            <div style={styles.browserWindow}>
              <div style={styles.browserBar}>
                <div style={styles.browserDots}>
                  <span style={styles.dot1} />
                  <span style={styles.dot2} />
                  <span style={styles.dot3} />
                </div>
                <div style={styles.urlBar}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ marginRight: 5, flexShrink: 0 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  buildportal.paddock.io
                </div>
                <div style={{ width: 52 }} />
              </div>

              <div style={styles.pipelineBody}>
                <div style={styles.pipelineHeader}>
                  <span style={styles.pipelineTitle}>Build Pipeline</span>
                  <span style={styles.runningBadge}>
                    <span style={styles.runningDot} />
                    Running
                  </span>
                </div>

                {[
                  { label: 'Clone Repository',     status: 'done',    time: '2s' },
                  { label: 'Install Dependencies', status: 'done',    time: '18s' },
                  { label: 'Build Archive',        status: 'running', time: '1m 24s' },
                  { label: 'Sign & Package',       status: 'pending', time: '—' },
                ].map((step) => (
                  <div key={step.label} style={styles.pipelineStep}>
                    <div style={styles.stepLeft}>
                      {step.status === 'done' && (
                        <span style={styles.stepDone}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                      {step.status === 'running' && (
                        <span style={styles.stepRunning}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </span>
                      )}
                      {step.status === 'pending' && (
                        <span style={styles.stepPending}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        </span>
                      )}
                      <span style={styles.stepLabel}>{step.label}</span>
                    </div>
                    <span style={styles.stepTime}>{step.time}</span>
                  </div>
                ))}

                <div style={styles.consoleLog}>
                  {[
                    { time: '12:34:01', icon: '✓', text: 'Cloning repository...',    color: '#64748b' },
                    { time: '12:34:03', icon: '✓', text: 'Installing dependencies',  color: '#64748b' },
                    { time: '12:34:15', icon: '▶', text: 'Building iOS archive...',  color: '#2563eb' },
                    { time: '12:34:42', icon: '●', text: 'Signing with certificate', color: '#d97706' },
                  ].map((log, i) => (
                    <div key={i} style={styles.logLine}>
                      <span style={styles.logTime}>{log.time}</span>
                      <span style={{ color: log.color, marginRight: 4 }}>{log.icon}</span>
                      <span style={styles.logText}>{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    backgroundImage: [
      'linear-gradient(rgba(0,56,141,0.07) 1px, transparent 1px)',
      'linear-gradient(to right, rgba(0,56,141,0.07) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: '44px 44px',
    backgroundPosition: '0 0',
    position: 'relative',
    overflow: 'hidden',
  },

  hero: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 72,
    padding: '60px 80px',
    maxWidth: 1280,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },

  leftCol: {
    flex: 1,
    maxWidth: 500,
    display: 'flex',
    flexDirection: 'column',
    gap: 26,
  },

  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoImg: {
    height: 20,
    width: 'auto',
    display: 'block',
    flexShrink: 0,
  },
  logoName: {
    ...Fonts.Bold,
    fontSize: '1.15rem',
    color: '#2563eb',
    letterSpacing: '-0.02em',
  },

  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    borderRadius: 9999,
    border: '1px solid #2563eb',
    background: 'rgba(20,174,213,0.07)',
    ...Fonts.Medium,
    fontSize: '0.8rem',
    color: '#2563eb',
    width: 'fit-content',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: Colors.primary,
    display: 'inline-block',
    flexShrink: 0,
  },

  headline: {
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.1,
    letterSpacing: '-0.025em',
    fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
    gap: 0,
  },
  headlineBlack: {
    ...Fonts.Bold,
    color: '#0f172a',
    fontWeight: 800,
    display: 'block',
  },
  headlineBlue: {
    ...Fonts.Bold,
    color: '#2563eb',
    fontWeight: 800,
    display: 'block',
  },

  description: {
    ...Fonts.Regular,
    fontSize: '0.95rem',
    lineHeight: 1.75,
    color: '#64748b',
    maxWidth: 460,
    margin: 0,
  },

  authBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxWidth: 380,
  },
  githubBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '14px 24px',
    borderRadius: 10,
    background: Colors.sidebarBrand,
    color: '#ffffff',
    ...Fonts.SemiBold,
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.18s ease',
    width: '100%',
  },
  gitlabBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '14px 24px',
    borderRadius: 10,
    background: '#ffffff',
    color: '#1e293b',
    ...Fonts.SemiBold,
    fontSize: '0.9rem',
    border: '1.5px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'background 0.18s ease',
    width: '100%',
  },

  rightCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    width: '100%',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureIconEmoji: {
    fontSize: '1.2rem',
    lineHeight: 1,
  },
  featureTitle: {
    ...Fonts.SemiBold,
    fontSize: '0.875rem',
    color: '#0f172a',
    marginBottom: 4,
  },
  featureDesc: {
    ...Fonts.Regular,
    fontSize: '0.8rem',
    color: '#64748b',
    lineHeight: 1.55,
  },

  browserWindow: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 20px 56px rgba(15,23,42,0.1), 0 4px 16px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
  },
  browserBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  browserDots: {
    display: 'flex',
    gap: 5,
    alignItems: 'center',
  },
  dot1: { width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' },
  dot2: { width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' },
  dot3: { width: 11, height: 11, borderRadius: '50%', background: '#28c940', display: 'inline-block' },
  urlBar: {
    ...Fonts.Regular,
    fontSize: '0.72rem',
    color: '#64748b',
    background: '#ffffff',
    padding: '4px 12px',
    borderRadius: 6,
    flex: 1,
    textAlign: 'center',
    margin: '0 12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pipelineBody: {
    background: '#ffffff',
    padding: '16px 18px 18px',
  },
  pipelineHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pipelineTitle: {
    ...Fonts.SemiBold,
    fontSize: '0.875rem',
    color: '#1e293b',
  },
  runningBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    ...Fonts.Medium,
    fontSize: '0.72rem',
    color: '#2563eb',
  },
  runningDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#2563eb',
    display: 'inline-block',
  },

  pipelineStep: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  stepLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  stepDone: {
    width: 22,
    height: 22,
    borderRadius: 6,
    background: 'rgba(22,163,74,0.1)',
    color: '#16a34a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepRunning: {
    width: 22,
    height: 22,
    borderRadius: 6,
    background: 'rgba(37,99,235,0.1)',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepPending: {
    width: 22,
    height: 22,
    borderRadius: 6,
    background: '#f1f5f9',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepLabel: {
    ...Fonts.Regular,
    fontSize: '0.8rem',
    color: '#374151',
  },
  stepTime: {
    ...Fonts.Regular,
    fontSize: '0.75rem',
    color: '#94a3b8',
  },

  consoleLog: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 8,
    background: '#f8fafc',
    border: '1px solid #f1f5f9',
  },
  logLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: '0.7rem',
    lineHeight: 1.85,
  },
  logTime: {
    color: '#94a3b8',
    flexShrink: 0,
    minWidth: 52,
  },
  logText: {
    color: '#475569',
  },
};
