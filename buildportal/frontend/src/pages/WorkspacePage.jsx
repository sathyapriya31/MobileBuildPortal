import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { Bell, HelpCircle, Play, Search, Settings, X, Check } from 'lucide-react';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';
import { api } from '../services/api.js';

export default function WorkspacePage() {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [search, setSearch] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/builds/workspaces')
      .then(r => setWorkspaces(r.data.workspaces || []))
      .catch(() => setWorkspaces([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = workspaces.filter(w =>
    w.repositoryName &&
    (!search ||
    w.repositoryName?.toLowerCase().includes(search.toLowerCase()) ||
    w.repositoryFullName?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: Colors.bg, ...Fonts.Regular }}>

      {/* ── Top Header Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '24px',
        backgroundColor: Colors.headerBg,
        borderBottom: '1px solid ' + Colors.headerBorder,
        padding: '16px 32px',
        height: '64px',
        boxSizing: 'border-box'
      }}>
        <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', position: 'relative', padding: 0 }}>
          <Bell size={20} />
          <span style={{ position: 'absolute', top: 1, right: 1, width: 6, height: 6, backgroundColor: Colors.trendRed, borderRadius: '50%' }} />
        </button>
        <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', padding: 0 }}>
          <HelpCircle size={20} />
        </button>
        {user && <img src={user.avatar} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid ' + Colors.headerBorder }} />}
      </div>

      {/* ── Page Content Container ── */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

        {/* ── Page Header ── */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.headerTitle}>Connected Workspaces</h1>
            <p style={styles.headerSubtitle}>Manage repositories, monitor build activity, and trigger new builds.</p>
          </div>
        </div>

        <div style={styles.contentColumn}>
          <div style={styles.searchWrapper}>
            <Search size={16} style={{ color: Colors.textMuted, flexShrink: 0 }} />
            <input
              style={styles.searchInput}
              placeholder="Search workspaces..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={styles.empty}>
              <p style={styles.emptyText}>Loading workspaces...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>
              <span style={{ fontSize: '3rem' }}>🔗</span>
              <p style={styles.emptyText}>
                {search
                  ? 'No workspaces match your search.'
                  : 'No Connected Workspaces Found. Trigger your first build to create a workspace.'}
              </p>
              {!search && (
                <button style={styles.newBuildBtn} onClick={() => navigate('/build')}>
                  + New Build
                </button>
              )}
            </div>
          ) : (
            <div style={styles.grid}>
              {filtered.map(ws => (
                <WorkspaceCard key={ws.id} workspace={ws} navigate={navigate} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function PillGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '5px 14px',
              fontSize: '13px',
              fontWeight: active ? '600' : '400',
              border: `1px solid ${active ? Colors.sidebarBrand : Colors.cardBorder}`,
              borderRadius: '9999px',
              background: active ? Colors.sidebarBrand : '#fff',
              color: active ? '#fff' : '#374151',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function WorkspaceCard({ workspace, navigate }) {
  const { user } = useSelector(s => s.auth);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    projectId,
    repoUrl,
    repositoryName,
    repositoryFullName,
    triggeredAt,
  } = workspace;

  const [saved, setSaved] = useState({
    branch: workspace.branch || '',
    platform: workspace.platform || 'android',
    buildType: workspace.buildType || 'testing',
    androidFormat: workspace.androidFormat || 'apk',
  });
  const [draft, setDraft] = useState({ ...saved });

  const handleOpenSettings = () => {
    navigate(`/workspace/${projectId}/settings`);
  };

  const handleSave = () => {
    setSaved({ ...draft });
    setSettingsOpen(false);
  };

  const isIncomplete = !projectId || !saved.branch;

  const handleTrigger = () => {
    if (!projectId) { navigate('/build'); return; }
    navigate('/build', {
      state: {
        fromWorkspace: true,
        workspaceRepo: {
          id: projectId,
          name: repositoryName,
          fullName: repositoryFullName,
          cloneUrl: repoUrl,
        },
        workspaceConfig: {
          branch: saved.branch,
          platform: saved.platform,
          buildType: saved.buildType,
          androidFormat: saved.androidFormat,
          versionName: workspace.versionName || '',
          versionCode: workspace.versionCode || '',
          releaseNotes: workspace.releaseNotes || '',
        },
      },
    });
  };

  const platformLabel =
    saved.platform === 'android' ? 'ANDROID' :
    saved.platform === 'ios' ? 'iOS' :
    'ANDROID + iOS';

  const platformColor =
    saved.platform === 'android' ? '#166534' :
    saved.platform === 'ios' ? '#3730A3' :
    '#166534';

  const platformBg =
    saved.platform === 'android' ? '#86EFAC' :
    saved.platform === 'ios' ? '#C7D2FE' :
    '#86EFAC';

  return (
    <div style={{ ...cardStyles.card, flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>

      {/* ── Card Header Row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={cardStyles.leftSection}>
          <div style={cardStyles.titleRow}>
            <span style={cardStyles.repoName}>{repositoryName}</span>
            <span style={{ ...cardStyles.platformBadge, color: platformColor, background: platformBg }}>
              {platformLabel}
            </span>
          </div>
          <div style={cardStyles.fullName}>{repositoryFullName}</div>
        </div>

        <div style={cardStyles.rightSection}>
          <button
            onClick={handleOpenSettings}
            title="Workspace Settings"
            style={{
              ...cardStyles.iconBtn,
              background: settingsOpen ? '#F3F4F6' : 'transparent',
              border: `1px solid ${settingsOpen ? Colors.cardBorder : Colors.cardBorder}`,
            }}
          >
            <Settings size={17} color={settingsOpen ? Colors.sidebarBrand : '#6B7280'} />
          </button>
          <button
            style={{
              ...cardStyles.triggerBtn,
              ...(isIncomplete ? { background: '#6B7280' } : {}),
            }}
            onClick={handleTrigger}
            title={isIncomplete ? 'Incomplete — click to reconfigure in New Build' : 'Open in New Build'}
          >
            <Play size={18} color="#ffffff" fill="#ffffff" />
          </button>
        </div>
      </div>

      {isIncomplete && !settingsOpen && (
        <div style={cardStyles.incompleteNote}>Incomplete — click ▶ to reconfigure</div>
      )}

      {/* ── Inline Settings Panel ── */}
      {settingsOpen && (
        <div style={cardStyles.settingsPanel}>
          <div style={cardStyles.settingsDivider} />

          {/* Branch */}
          <div style={cardStyles.fieldRow}>
            <label style={cardStyles.fieldLabel}>Branch</label>
            <input
              style={cardStyles.textInput}
              value={draft.branch}
              onChange={e => setDraft(d => ({ ...d, branch: e.target.value }))}
              placeholder="e.g. main"
            />
          </div>

          {/* Platform */}
          <div style={cardStyles.fieldRow}>
            <label style={cardStyles.fieldLabel}>Platform</label>
            <PillGroup
              value={draft.platform}
              onChange={v => setDraft(d => ({ ...d, platform: v }))}
              options={[
                { value: 'android', label: 'Android' },
                { value: 'ios', label: 'iOS' },
                { value: 'both', label: 'Both' },
              ]}
            />
          </div>

          {/* Build Type */}
          <div style={cardStyles.fieldRow}>
            <label style={cardStyles.fieldLabel}>Build Type</label>
            <PillGroup
              value={draft.buildType}
              onChange={v => setDraft(d => ({ ...d, buildType: v }))}
              options={[
                { value: 'testing', label: 'Testing' },
                { value: 'uat', label: 'UAT' },
                { value: 'playstore', label: 'Playstore' },
              ]}
            />
          </div>

          {/* Android Format — only when platform includes android */}
          {(draft.platform === 'android' || draft.platform === 'both') && (
            <div style={cardStyles.fieldRow}>
              <label style={cardStyles.fieldLabel}>Android Format</label>
              <PillGroup
                value={draft.androidFormat}
                onChange={v => setDraft(d => ({ ...d, androidFormat: v }))}
                options={[
                  { value: 'apk', label: 'APK' },
                  { value: 'aab', label: 'AAB' },
                ]}
              />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button onClick={() => setSettingsOpen(false)} style={cardStyles.cancelBtn}>
              <X size={14} style={{ marginRight: 4 }} /> Cancel
            </button>
            <button onClick={handleSave} style={cardStyles.saveBtn}>
              <Check size={14} style={{ marginRight: 4 }} /> Save
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const cardStyles = {
  card: {
    background: Colors.cardBg,
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '16px',
    minHeight: '108px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: Colors.cardShadow,
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  repoName: {
    ...Fonts.Bold,
    fontSize: '24px',
    fontWeight: '500',
    color: '#111827',
  },
  platformBadge: {
    fontSize: '7px',
    fontWeight: '600',
    padding: '0 12px',
    height: '24px',
    borderRadius: '9999px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
  },
  fullName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#6B7280',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  iconBtn: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '10px',
    cursor: 'pointer',
    padding: 0,
    transition: 'background 0.15s',
  },
  triggerBtn: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#15803D',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    padding: 0,
  },
  incompleteNote: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#9CA3AF',
    paddingLeft: '2px',
  },
  settingsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  settingsDivider: {
    height: '1px',
    background: Colors.cardBorder,
    margin: '4px 0 2px',
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    width: '120px',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    maxWidth: '260px',
    padding: '6px 10px',
    fontSize: '13px',
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '8px',
    outline: 'none',
    color: '#111827',
    background: '#F9FAFB',
    ...Fonts.Regular,
  },
  cancelBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 16px',
    fontSize: '13px',
    fontWeight: '500',
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '8px',
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 16px',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    background: Colors.sidebarBrand,
    color: '#fff',
    cursor: 'pointer',
  },
};

const styles = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontFamily: 'Google Sans, sans-serif',
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: '1.1',
    color: '#1E293B',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  headerSubtitle: {
    fontFamily: 'Google Sans, sans-serif',
    fontSize: '14px',
    fontWeight: '400',
    color: '#5F6368',
    margin: '6px 0 0 0',
  },
  contentColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '780px',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: Colors.cardBg,
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '8px',
    padding: '10px 14px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '14px',
    color: '#0f172a',
    ...Fonts.Regular,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '64px 0',
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: '40ch',
    fontSize: '14px',
    ...Fonts.Regular,
    margin: 0,
  },
  newBuildBtn: {
    padding: '10px 24px',
    background: Colors.primary,
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    ...Fonts.SemiBold,
    cursor: 'pointer',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
};
