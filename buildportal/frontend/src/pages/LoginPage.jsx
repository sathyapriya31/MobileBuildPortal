import React from 'react';
import spritleLogo from '../assets/SPRITLE  Logo SVG.svg';
import Fonts from '../config/fonts.js';

function GitHubIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', flexShrink: 0 }}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GitLabIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', flexShrink: 0 }}>
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
    </svg>
  );
}

const features = [
  {
    icon: '⚡',
    title: 'Cloud Build Infrastructure',
    desc: 'Build iOS & Android on dedicated cloud runners — no local setup.',
  },
  {
    icon: '🔒',
    title: 'AES-256 Secure Credentials',
    desc: 'Keystores and certificates encrypted at rest with enterprise-grade security.',
  },
  {
    icon: '🚀',
    title: 'Fast Build Pipeline',
    desc: 'Parallel builds with intelligent caching for rapid delivery.',
  },
];

const pipelineSteps = [
  { label: 'Clone Repository',     dur: '2s',     state: 'done' },
  { label: 'Install Dependencies', dur: '18s',    state: 'done' },
  { label: 'Build Archive',        dur: '1m 24s', state: 'active' },
  { label: 'Sign & Package',       dur: '—',      state: 'idle' },
];

const logLines = [
  { time: '12:34:01', icon: '✓', iconColor: '#22c55e', text: 'Cloning repository...' },
  { time: '12:34:03', icon: '✓', iconColor: '#22c55e', text: 'Installing dependencies' },
  { time: '12:34:15', icon: '▶', iconColor: '#0F4CB5', text: 'Building iOS archive...' },
  { time: '12:34:42', icon: '●', iconColor: '#f59e0b', text: 'Signing with certificate' },
];

export default function LoginPage() {
  // ── Authentication logic — UNCHANGED ──────────────────────────────
  const handleGithub = () => {
    const isLogout = localStorage.getItem('bp_logged_out') === 'true';
    window.location.href = isLogout ? '/api/auth/github?logout=true' : '/api/auth/github';
  };

  const handleGitlab = () => {
    const isLogout = localStorage.getItem('bp_logged_out') === 'true';
    window.location.href = isLogout ? '/api/auth/gitlab?logout=true' : '/api/auth/gitlab';
  };
  // ──────────────────────────────────────────────────────────────────

  return (
    <div className="login-page">
      {/* Background layers */}
      <div className="login-grid-bg" />
      <div className="login-glow-tr" />
      <div className="login-glow-bl" />

      <div className="login-container">

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div className="login-left">

          {/* Logo */}
          <div style={s.logoRow}>
            <img src={spritleLogo} alt="Paddock" style={s.logoImg} />
            <span style={s.logoText}>Paddock</span>
          </div>

          {/* Badge */}
          <div style={s.badge}>
            <span style={s.badgeDot} />
            Serverless Mobile Build Platform
          </div>

          {/* Hero headline */}
          <h1 style={s.headline}>
            Build iOS &amp; Android Apps
            <br />
            <span style={s.headlineBlue}>
              Without Local
              <br />
              Build Complexity
            </span>
          </h1>

          {/* Description */}
          <p style={s.description}>
            Cloud-native build infrastructure with GitHub integration,
            secure credential signing, and automated deployment pipelines —
            without any local environment setup.
          </p>

          {/* Auth buttons */}
          <div style={s.btnGroup}>
            <button className="login-btn-github" onClick={handleGithub}>
              <GitHubIcon size={18} />
              Continue with GitHub
            </button>
            <button className="login-btn-gitlab" onClick={handleGitlab}>
              <GitLabIcon size={18} />
              Continue with GitLab
            </button>
          </div>

        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div className="login-right">
          <div className="login-showcase">

            {/* Feature highlights */}
            <div style={s.features}>
              {features.map((f, i) => (
                <div
                  key={i}
                  style={{
                    ...s.featureItem,
                    borderBottom:
                      i < features.length - 1
                        ? '1px solid rgba(15,23,42,0.06)'
                        : 'none',
                  }}
                >
                  <div style={s.featureIconBox}>{f.icon}</div>
                  <div>
                    <div style={s.featureTitle}>{f.title}</div>
                    <div style={s.featureDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mock browser window */}
            <div className="login-browser">
              {/* Chrome bar */}
              <div style={s.chromeBar}>
                <div style={s.chromeDots}>
                  <span style={{ ...s.dot, background: '#ff5f57' }} />
                  <span style={{ ...s.dot, background: '#febc2e' }} />
                  <span style={{ ...s.dot, background: '#28c840' }} />
                </div>
                <div style={s.chromeUrlBar}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>buildportal.paddock.io</span>
                </div>
              </div>

              {/* Browser body */}
              <div style={s.browserBody}>
                {/* Pipeline header */}
                <div style={s.pipelineHeader}>
                  <span style={s.pipelineTitle}>Build Pipeline</span>
                  <span style={s.pipelineBadge}>
                    <span style={s.pipelineDot} />
                    Running
                  </span>
                </div>

                {/* Steps */}
                <div style={s.steps}>
                  {pipelineSteps.map((step, i) => {
                    const done   = step.state === 'done';
                    const active = step.state === 'active';
                    return (
                      <div key={i} style={s.step}>
                        <div style={{
                          ...s.stepIcon,
                          background : done ? 'rgba(34,197,94,0.12)'  : active ? 'rgba(20,174,213,0.12)'  : 'rgba(148,163,184,0.1)',
                          border     : `1.5px solid ${done ? '#22c55e' : active ? '#0F4CB5' : '#cbd5e1'}`,
                          color      : done ? '#22c55e' : active ? '#0F4CB5' : '#94a3b8',
                        }}>
                          {done ? '✓' : active ? '▶' : '○'}
                        </div>
                        <div style={s.stepBody}>
                          <span style={{ ...s.stepLabel, color: step.state === 'idle' ? '#94a3b8' : '#0f172a' }}>
                            {step.label}
                          </span>
                          <span style={s.stepDur}>{step.dur}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Log preview */}
                <div style={s.logBox}>
                  {logLines.map((line, i) => (
                    <div key={i} style={s.logLine}>
                      <span style={s.logTime}>{line.time}</span>
                      <span style={{ color: line.iconColor, fontSize: '0.625rem', flexShrink: 0 }}>
                        {line.icon}
                      </span>
                      <span style={s.logText}>{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Inline styles (layout / typography / static colors) ─────────── */
const s = {
  /* Logo row */
  logoRow  : { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoImg  : { width: 38, height: 38, objectFit: 'contain' },
  logoText : { ...Fonts.Bold, fontSize: '1.25rem', color: '#0F4CB5', letterSpacing: '-0.01em' },

  /* Badge */
  badge : {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'rgba(20,174,213,0.08)', border: '1px solid rgba(20,174,213,0.2)',
    borderRadius: 999, padding: '5px 14px',
    fontSize: '0.8125rem', color: '#0F4CB5', ...Fonts.Medium,
    marginBottom: 22,
  },
  badgeDot : {
    display: 'inline-block', width: 6, height: 6,
    borderRadius: '50%', background: '#0F4CB5', flexShrink: 0,
  },

  /* Headline */
  headline : {
    fontSize: 'clamp(2rem, 3vw + 0.5rem, 3.25rem)',
    ...Fonts.Bold, lineHeight: 1.1,
    color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 22,
  },
  headlineBlue : { color: '#0F4CB5' },

  /* Description */
  description : {
    fontSize: '1.0625rem', color: '#64748b',
    lineHeight: 1.72, maxWidth: 480, ...Fonts.Regular, marginBottom: 32,
  },

  /* Button group */
  btnGroup : {
    display: 'flex', flexDirection: 'column', gap: 12,
    marginBottom: 40, alignSelf: 'stretch', maxWidth: 380,
  },

  /* Features */
  features     : { width: '100%', marginBottom: 20 },
  featureItem  : { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0' },
  featureIconBox : {
    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
    background: 'rgba(20,174,213,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
  },
  featureTitle : { ...Fonts.SemiBold, fontSize: '0.9rem', color: '#0f172a', marginBottom: 2 },
  featureDesc  : { ...Fonts.Regular,  fontSize: '0.8125rem', color: '#64748b' },

  /* Browser chrome */
  chromeBar : {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px', background: '#f1f5f9',
    borderBottom: '1px solid rgba(15,23,42,0.07)',
  },
  chromeDots : { display: 'flex', gap: 5, flexShrink: 0 },
  dot        : { display: 'inline-block', width: 9, height: 9, borderRadius: '50%' },
  chromeUrlBar : {
    flex: 1, display: 'flex', alignItems: 'center', gap: 5,
    background: '#fff', border: '1px solid rgba(15,23,42,0.09)',
    borderRadius: 5, padding: '3px 9px',
    fontSize: '0.6875rem', color: '#64748b', ...Fonts.Regular,
  },

  /* Browser body */
  browserBody : { padding: '14px', background: '#fff' },

  pipelineHeader : { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  pipelineTitle  : { ...Fonts.SemiBold, fontSize: '0.8125rem', color: '#0F4CB5' },
  pipelineBadge  : { display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#0F4CB5', ...Fonts.Medium },
  pipelineDot    : { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#0F4CB5' },

  /* Pipeline steps */
  steps    : { display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 },
  step     : { display: 'flex', alignItems: 'center', gap: 8 },
  stepIcon : {
    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.625rem', fontWeight: 600,
  },
  stepBody  : { display: 'flex', justifyContent: 'space-between', flex: 1 },
  stepLabel : { ...Fonts.Medium, fontSize: '0.75rem' },
  stepDur   : { ...Fonts.Regular, fontSize: '0.6875rem', color: '#94a3b8' },

  /* Log box */
  logBox  : {
    background: '#f8fafc', border: '1px solid rgba(15,23,42,0.07)',
    borderRadius: 7, padding: '9px 11px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  logLine : { display: 'flex', alignItems: 'center', gap: 7 },
  logTime : { ...Fonts.Regular, fontSize: '0.625rem', color: '#94a3b8', flexShrink: 0 },
  logText : { ...Fonts.Regular, fontSize: '0.6875rem', color: '#64748b' },

};
