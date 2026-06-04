import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Settings, Rocket, Loader2, X } from 'lucide-react';
import { getWorkspaces, upsertWorkspace } from '../utils/workspacesStorage.js';
import { triggerBuild } from '../store/slices/buildsSlice.js';
import toast from 'react-hot-toast';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [hoveredSettings, setHoveredSettings] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [settingsWorkspace, setSettingsWorkspace] = useState(null);
  const [triggering, setTriggering] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    setWorkspaces(getWorkspaces().filter(ws => ws.buildTriggeredAt));
  }, []);

  const handleTriggerBuild = async (ws) => {
    setTriggering(ws.id);
    try {
      const repoUrl = ws.provider === 'github'
        ? `https://github.com/${ws.fullName}.git`
        : `https://gitlab.com/${ws.fullName}.git`;

      const result = await dispatch(triggerBuild({
        projectId: ws.id,
        projectName: ws.name,
        repoUrl,
        provider: ws.provider,
        branch: ws.selectedBranch,
        platform: ws.platform,
        androidFormat: ws.platform === 'android' ? ws.buildFormat : undefined,
        versionName: '1.0.0',
        buildType: ws.buildType || 'testing',
      }));

      if (triggerBuild.fulfilled.match(result)) {
        toast.success('Build queued! 🚀');
        upsertWorkspace({ ...ws, buildTriggeredAt: new Date().toISOString() });
      } else {
        toast.error(result.payload || 'Failed to trigger build');
      }
    } catch {
      toast.error('Failed to trigger build');
    } finally {
      setTriggering(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return '—';
    }
  };

  return (
    <div style={styles.page} className="page-workspaces">
      <div style={styles.contentArea}>
        <header className="page-header">
          <p style={styles.subtitle}>Manage your integrated source control repositories and build environments.</p>
        </header>

      {workspaces.length === 0 ? (
        <div style={styles.empty} className="empty-workspaces">
          <div style={styles.emptyIcon}>🔗</div>
          <h3 style={styles.emptyTitle}>No Connected Workspaces</h3>
          <p style={styles.emptyDesc}>Trigger your first build to create a connected workspace.</p>
          <button style={styles.emptyBtn} onClick={() => navigate('/build')}>
            Create New Build
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {workspaces.map(ws => (
            <div key={ws.id} style={styles.card} className="card-workspace">
              <div style={styles.leftSection}>
                <div style={styles.topRow}>
                  <span style={styles.repoName}>{ws.name}</span>
                  <span style={ws.platform === 'ios' ? styles.iosBadge : styles.androidBadge}>
                    {ws.platform === 'ios' ? 'iOS' : 'ANDROID'}
                  </span>
                </div>
                <div style={styles.repoPath}>{ws.fullName}</div>
              </div>
              <div style={styles.rightSection}>
                <button
                  style={{
                    ...styles.settingsBtn,
                    ...(hoveredSettings === ws.id ? styles.settingsBtnHover : {}),
                  }}
                  onMouseEnter={() => setHoveredSettings(ws.id)}
                  onMouseLeave={() => setHoveredSettings(null)}
                  onClick={() => setSettingsWorkspace(ws)}
                  title="Workspace settings"
                >
                  <Settings size={18} color="#374151" />
                </button>
                <button
                  onClick={() => handleTriggerBuild(ws)}
                  style={{
                    ...styles.actionBtn,
                    ...(hoveredAction === ws.id && triggering !== ws.id ? styles.actionBtnHover : {}),
                    ...(triggering === ws.id ? styles.actionBtnLoading : {}),
                  }}
                  onMouseEnter={() => setHoveredAction(ws.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  disabled={triggering === ws.id}
                  title="Trigger build"
                >
                  {triggering === ws.id ? (
                    <>
                      <Loader2 size={16} color="#FFFFFF" style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span style={styles.actionBtnLabel}>Triggering...</span>
                    </>
                  ) : (
                    <>
                      {/* <Rocket size={16} color="#FFFFFF" /> */}
                      <span style={styles.actionBtnLabel}>Build</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {settingsWorkspace && (
        <div style={styles.modalOverlay} onClick={() => setSettingsWorkspace(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Workspace Details</h2>
              <button style={styles.modalClose} onClick={() => setSettingsWorkspace(null)} title="Close">
                <X size={20} color="#374151" />
              </button>
            </div>
            <div style={styles.modalBody}>
              {[
                { label: 'Repository', value: settingsWorkspace.fullName || settingsWorkspace.name },
                { label: 'Branch', value: settingsWorkspace.selectedBranch },
                { label: 'Platform', value: settingsWorkspace.platform ? settingsWorkspace.platform.charAt(0).toUpperCase() + settingsWorkspace.platform.slice(1) : null },
                { label: 'Build Format', value: settingsWorkspace.buildFormat ? settingsWorkspace.buildFormat.toUpperCase() : null },
                { label: 'Build Profile', value: settingsWorkspace.buildType ? settingsWorkspace.buildType.charAt(0).toUpperCase() + settingsWorkspace.buildType.slice(1) : null },
                { label: 'Credential Type', value: settingsWorkspace.credentialType },
                { label: 'Triggered At', value: formatDate(settingsWorkspace.buildTriggeredAt) },
              ].filter(({ value }) => value != null && value !== '—').map(({ label, value }) => (
                <div key={label} style={styles.detailRow}>
                  <span style={styles.detailLabel}>{label}</span>
                  <span style={styles.detailValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '48px 48px',
  },
  contentArea: {
    maxWidth: 720,
  },
  title: {
    fontFamily: 'Google Sans',
    fontWeight: '800',
    fontSize: '20px',
    color: '#111827',
    margin: 0,
    marginBottom: '8px',
    lineHeight: 1.1,
  },
  subtitle: {
    fontFamily: 'Google Sans',
    fontWeight: '400',
    fontSize: '16px',
    color: '#6B7280',
    margin: '0 0 32px 0',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '80px 24px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '3rem',
    lineHeight: 1,
  },
  emptyTitle: {
    fontFamily: 'Google Sans',
    fontWeight: '700',
    fontSize: '22px',
    color: '#111827',
    margin: 0,
  },
  emptyDesc: {
    fontFamily: 'Google Sans',
    fontWeight: '400',
    fontSize: '15px',
    color: '#6B7280',
    margin: 0,
    maxWidth: '360px',
    lineHeight: 1.5,
  },
  emptyBtn: {
    marginTop: '8px',
    padding: '10px 24px',
    background: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontFamily: 'Google Sans',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'background 180ms ease',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 28px',
    minHeight: '100px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  repoName: {
    fontFamily: 'Google Sans',
    fontWeight: '700',
    fontSize: '28px',
    color: '#111827',
    lineHeight: 1.2,
  },
  androidBadge: {
    fontFamily: 'Google Sans',
    fontWeight: '600',
    fontSize: '12px',
    color: '#16A34A',
    background: '#DCFCE7',
    padding: '3px 10px',
    borderRadius: '999px',
    display: 'inline-flex',
    alignItems: 'center',
    letterSpacing: '0.02em',
    flexShrink: 0,
  },
  iosBadge: {
    fontFamily: 'Google Sans',
    fontWeight: '600',
    fontSize: '12px',
    color: '#2563EB',
    background: '#DBEAFE',
    padding: '3px 10px',
    borderRadius: '999px',
    display: 'inline-flex',
    alignItems: 'center',
    letterSpacing: '0.02em',
    flexShrink: 0,
  },
  repoPath: {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280',
  },
  rightSection: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexShrink: 0,
  },
  settingsBtn: {
    width: '40px',
    height: '40px',
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 180ms ease',
  },
  settingsBtnHover: {
    background: '#F3F4F6',
  },
  actionBtn: {
    height: '40px',
    padding: '0 16px',
    background: '#16A34A',
    border: 'none',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'background 180ms ease',
    whiteSpace: 'nowrap',
  },
  actionBtnHover: {
    background: '#15803D',
  },
  actionBtnLoading: {
    background: '#15803D',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  actionBtnLabel: {
    fontFamily: 'Google Sans',
    fontWeight: '600',
    fontSize: '14px',
    color: '#FFFFFF',
  },
  // Settings Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    background: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 16px 24px',
    borderBottom: '1px solid #E5E7EB',
  },
  modalTitle: {
    fontFamily: 'Google Sans',
    fontWeight: '700',
    fontSize: '18px',
    color: '#111827',
    margin: 0,
  },
  modalClose: {
    width: '32px',
    height: '32px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 180ms ease',
  },
  modalBody: {
    padding: '16px 24px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  detailLabel: {
    fontFamily: 'Google Sans',
    fontWeight: '500',
    fontSize: '13px',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  detailValue: {
    fontFamily: 'Google Sans',
    fontWeight: '600',
    fontSize: '14px',
    color: '#111827',
    textAlign: 'right',
    maxWidth: '220px',
    wordBreak: 'break-word',
  },
};
