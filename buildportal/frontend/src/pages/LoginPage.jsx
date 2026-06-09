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
    <div style={styles.container}>
      <style>{`
        .login-btn-github:hover {
          background-color: #0f172a !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(30, 41, 59, 0.25);
        }
        .login-btn-gitlab:hover {
          background-color: #d84800 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(234, 88, 12, 0.25);
        }
        .feature-card:hover {
          transform: translateY(-6px);
          border-color: rgba(12, 93, 244, 0.25) !important;
          box-shadow: 0 16px 36px -12px rgba(12, 93, 244, 0.1), 0 0 1px 0 rgba(12, 93, 244, 0.15) !important;
        }
        .feature-card:hover .feature-icon-wrap {
          background-color: #0c5df4 !important;
          color: #ffffff !important;
          border-color: #0c5df4 !important;
          transform: scale(1.05);
          box-shadow: 0 8px 20px rgba(12, 93, 244, 0.2);
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; box-shadow: 0 0 0 0 rgba(12, 93, 244, 0.6); }
          70% { transform: scale(1.15); opacity: 0.8; box-shadow: 0 0 0 8px rgba(12, 93, 244, 0); }
          100% { transform: scale(0.9); opacity: 1; box-shadow: 0 0 0 0 rgba(12, 93, 244, 0); }
        }
        .pulse-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #0c5df4;
          display: inline-block;
          box-shadow: 0 0 8px rgba(12, 93, 244, 0.5);
          animation: pulse 2s infinite ease-in-out;
        }
        .gradient-text {
          background: linear-gradient(135deg, #0c5df4 0%, #00388d 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
      `}</style>

      {/* Decorative ambient blur blobs for premium SaaS interface depth */}
      <div style={styles.ambientBlobLeft}></div>
      <div style={styles.ambientBlobRight}></div>

      {/* ── Main Hero Section ── */}
      <div style={styles.heroSection}>
        {/* Left Side: Product Intro */}
        <div style={styles.introCol}>
          <div style={styles.badge}>
            <span className="pulse-dot" style={{ marginRight: '10px' }}></span>
            CI/CD for mobile dev teams
          </div>
          <h1 style={styles.heroTitle}>
            One tool for all your <span className="gradient-text">mobile app builds</span>.
          </h1>
          <p style={styles.heroDesc}>Test, build and release with ease.</p>
        </div>

        {/* Right Side: Login Card */}
        <div style={styles.cardCol}>
          <div style={styles.card}>
            {/* Logo */}
            <div style={styles.logo}>
              <img src={spritleLogo} alt="Spritle Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
              <span style={styles.logoText}>Spritle Paddock</span>
            </div>
            <h2 style={styles.title}>Mobile Build Generator</h2>
            <p style={styles.subtitle}>Connect your GitHub or GitLab to start building iOS and Android apps from your Mac Mini.</p>

            <div style={styles.buttons}>
              <button className="login-btn-github" style={{ ...styles.btn, ...styles.btnGithub }} onClick={handleGithub}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Continue with GitHub
              </button>
              <button className="login-btn-gitlab" style={{ ...styles.btn, ...styles.btnGitlab }} onClick={handleGitlab}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
                </svg>
                Continue with GitLab
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature Section: Why MobileBuildPortal? ── */}
      <div style={styles.featureSection}>
        <h2 style={styles.featureSectionTitle}>Why MobileBuildPortal?</h2>
        <p style={styles.featureSectionSubtitle}>
          The high-performance build engine for modern mobile teams. Automate your iOS and Android pipelines with zero configuration.
        </p>

        <div style={styles.featuresGrid}>
          {/* Feature 1 */}
          <div className="feature-card" style={styles.featureCard}>
            <div className="feature-icon-wrap" style={styles.featureIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Zero-Config Pipelines</h3>
            <p style={styles.featureDesc}>Just connect your repository and we automatically handle the build environment setup.</p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card" style={styles.featureCard}>
            <div className="feature-icon-wrap" style={styles.featureIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Real-time Monitoring</h3>
            <p style={styles.featureDesc}>Stream compile-time logs and track pipeline tasks live as they run on the build machine.</p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card" style={styles.featureCard}>
            <div className="feature-icon-wrap" style={styles.featureIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Secure Artifacts</h3>
            <p style={styles.featureDesc}>Your build binaries and signing certificates are encrypted and stored in secure enclaves.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    padding: '48px 24px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    ...Fonts.Regular
  },
  ambientBlobLeft: {
    position: 'absolute',
    top: '5%',
    left: '-5%',
    width: '450px',
    height: '450px',
    background: 'radial-gradient(circle, rgba(12, 93, 244, 0.05) 0%, rgba(12, 93, 244, 0) 70%)',
    borderRadius: '50%',
    filter: 'blur(80px)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  ambientBlobRight: {
    position: 'absolute',
    bottom: '5%',
    right: '-5%',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(20, 174, 213, 0.06) 0%, rgba(20, 174, 213, 0) 70%)',
    borderRadius: '50%',
    filter: 'blur(90px)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  heroSection: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '40px',
    maxWidth: '1100px',
    width: '100%',
    marginBottom: '56px',
  },
  introCol: {
    flex: '1 1 450px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    textAlign: 'left',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#edf3fe',
    color: '#0c5df4',
    padding: '10px 22px',
    borderRadius: '30px',
    fontSize: '15px',
    ...Fonts.Bold,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
    marginBottom: '16px',
    border: '1.5px solid rgba(12, 93, 244, 0.2)',
    boxShadow: '0 4px 12px rgba(12, 93, 244, 0.06)',
  },
  heroTitle: {
    fontSize: '3.5rem',
    lineHeight: '1.15',
    color: '#0f172a',
    margin: '0 0 12px 0',
    ...Fonts.Bold,
    letterSpacing: '-1px',
  },
  heroDesc: {
    fontSize: '1.45rem',
    lineHeight: '1.5',
    color: '#64748b',
    margin: 0,
    ...Fonts.Medium,
  },
  cardCol: {
    flex: '1 1 380px',
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(15, 23, 42, 0.08)',
    borderRadius: '20px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
    boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 1px 0 rgba(15, 23, 42, 0.1)',
    boxSizing: 'border-box',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  logoText: {
    fontSize: '1.55rem',
    color: '#00388d',
    ...Fonts.Bold,
  },
  title: {
    fontSize: '22px',
    color: '#1e293b',
    margin: '0 0 14px 0',
    ...Fonts.Bold,
  },
  subtitle: {
    fontSize: '14.5px',
    color: '#64748b',
    lineHeight: '1.6',
    margin: '0 0 28px 0',
    ...Fonts.Regular,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '14px 20px',
    borderRadius: '10px',
    fontSize: '15px',
    ...Fonts.SemiBold,
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid transparent',
  },
  btnGithub: {
    background: Colors.github,
    color: '#ffffff',
  },
  btnGitlab: {
    background: Colors.gitlab,
    color: '#ffffff',
  },
  featureSection: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '1100px',
    width: '100%',
    textAlign: 'center',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '56px',
  },
  featureSectionTitle: {
    fontSize: '32px',
    color: '#0f172a',
    margin: '0 0 14px 0',
    ...Fonts.Bold,
    letterSpacing: '-0.5px',
  },
  featureSectionSubtitle: {
    fontSize: '16px',
    color: '#5f6368',
    lineHeight: '1.6',
    maxWidth: '680px',
    margin: '0 auto 40px auto',
    ...Fonts.Regular,
  },
  featuresGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '28px',
    justifyContent: 'center',
  },
  featureCard: {
    flex: '1 1 300px',
    maxWidth: '340px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '36px 28px',
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)',
    borderRadius: '20px',
    boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.02)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'center',
  },
  featureIconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: 'rgba(12, 93, 244, 0.08)',
    color: '#0c5df4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    border: '1.5px solid rgba(12, 93, 244, 0.1)',
    transition: 'all 0.3s ease',
  },
  featureTitle: {
    fontSize: '19px',
    color: '#0f172a',
    margin: '0 0 12px 0',
    ...Fonts.Bold,
  },
  featureDesc: {
    fontSize: '14px',
    color: '#5f6368',
    lineHeight: '1.6',
    margin: 0,
    ...Fonts.Regular,
  },
};