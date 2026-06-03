import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { formatDistanceToNow } from 'date-fns';
import Colors from '../config/colors.js';
import {
  Key, Folder, Link2, Clock, Info, Plus, Trash2, Download,
  Filter, CheckCircle, PlusCircle,
} from 'lucide-react';

const ACTIVITY = [
  {
    id: 1,
    user: 'sathya priya',
    target: 'NearMind',
    date: 'Oct 24, 2023 at 14:22 PM',
    hasDiff: true,
  },
  {
    id: 2,
    user: null,
    action: 'Keystore access rotated for System',
    date: 'Oct 20, 2023 at 09:15 AM',
    hasDiff: false,
  },
];

/* ─── component ─── */

export default function KeystorePage() {
  const [keystores, setKeystores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  function loadKeystores() {
    api.get('/keystores').then(({ data }) => {
      setKeystores(data.keystores ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => { loadKeystores(); }, []);

  async function handleDownload(keystore) {
    const { data } = await api.get(`/keystores/${keystore.projectId}/download`);
    const a = document.createElement('a');
    a.href = data.url;
    a.download = data.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleDelete(keystore) {
    if (!window.confirm(`Delete keystore for "${keystore.projectName}"? This cannot be undone.`)) return;
    setDeletingId(keystore._id);
    try {
      await api.delete(`/keystores/${keystore.projectId}`);
      setKeystores(prev => prev.filter(k => k._id !== keystore._id));
    } catch {
      alert('Failed to delete keystore. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={styles.page}>

      {/* ── Header ── */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Keystores</h1>
          <p style={styles.subtitle}>
            Manage Android signing keystores securely. Each project has exactly one keystore —{' '}
            upload once, reuse forever across your CI/CD pipeline.
          </p>
        </div>
        <button style={styles.addBtn}>
          <PlusCircle size={18} color="#2563EB" style={{ flexShrink: 0 }} />
          <span>Add Keystore</span>
        </button>
      </div>

      {loading ? (
        <p style={{ color: Colors.textMuted, fontSize: 14 }}>Loading…</p>
      ) : (
        <>
          {/* ── Cards Row ── */}
          <div style={styles.cardsGrid} className="keystores-cards-grid">

            {/* Keystore Cards — one per saved keystore */}
            {keystores.length === 0 ? (
              <div style={{ ...styles.keystoreCard, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontSize: '2rem' }}>🔑</span>
                <p style={{ color: Colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                  No keystores yet. Upload one from the New Build page.
                </p>
              </div>
            ) : (
              keystores.map(ks => (
                <div key={ks._id} style={styles.keystoreCard}>
                  <div style={styles.keystoreCardTop}>
                    <div style={styles.keyIconBox}>
                      <Key size={20} color="#2563EB" />
                    </div>
                    <span style={styles.activeBadge}>ACTIVE</span>
                  </div>

                  <div style={styles.projectName}>{ks.projectName}</div>

                  <div style={styles.metaList}>
                    <div style={styles.metaRow}>
                      <Folder size={13} color="#6B7280" style={{ flexShrink: 0 }} />
                      <span style={styles.metaText}>{ks.originalFilename}</span>
                    </div>
                    <div style={styles.metaRow}>
                      <Link2 size={13} color="#6B7280" style={{ flexShrink: 0 }} />
                      <span style={styles.metaText}>
                        {ks.provider} · Project ID: {ks.projectId}
                      </span>
                    </div>
                    <div style={styles.metaRow}>
                      <Clock size={13} color="#6B7280" style={{ flexShrink: 0 }} />
                      <span style={styles.metaText}>
                        Updated{' '}
                        {formatDistanceToNow(new Date(ks.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div style={styles.cardActions}>
                    <button
                      style={styles.downloadBtn}
                      className="keystore-download-btn"
                      onClick={() => handleDownload(ks)}
                    >
                      <Download size={15} color="#ffffff" />
                      <span>Download</span>
                    </button>
                    <button
                      style={{
                        ...styles.deleteBtn,
                        ...(deletingId === ks._id ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                      }}
                      className="keystore-delete-btn"
                      onClick={() => handleDelete(ks)}
                      disabled={deletingId === ks._id}
                      aria-label={`Delete keystore for ${ks.projectName}`}
                    >
                      <Trash2 size={15} color="#DC2626" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Card — Blue info */}
            <div style={styles.infoCard}>
              <div style={styles.infoCardTitle}>
                <Info size={16} color="white" style={{ flexShrink: 0 }} />
                <span>How Keystores Work</span>
              </div>
              <ul style={styles.infoBulletList}>
                {[
                  'Unique per-project keys stored securely in S3.',
                  'Automatic reuse in subsequent build triggers.',
                  'Encrypted at rest using AES-256.',
                ].map((item) => (
                  <li key={item} style={styles.infoBulletRow}>
                    <CheckCircle size={14} color="white" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a href="#" style={styles.infoCardLink}>
                Read Security Documentation →
              </a>
            </div>

            {/* Card 3 — New Project Key */}
            <div style={styles.newProjectCard}>
              <div style={styles.plusBox}>
                <Plus size={22} color="#374151" />
              </div>
              <div style={styles.newProjectTitle}>New Project Key</div>
              <div style={styles.newProjectDesc}>
                Add a new signing identity for a different project
              </div>
            </div>
          </div>

          {/* ── Recent Activity ── */}
          <div style={styles.activitySection}>
            <div style={styles.activityHeaderRow}>
              <span style={styles.activityHeading}>Recent Activity</span>
              <Filter size={20} color="#6B7280" style={{ cursor: 'pointer' }} />
            </div>
            <div style={styles.activityDivider} />

            {ACTIVITY.map((item, idx) => (
              <React.Fragment key={item.id}>
                <div style={styles.activityRow}>
                  <div style={styles.activityRowLeft}>
                    <div style={{
                      ...styles.activityDot,
                      background: item.hasDiff ? '#EFF6FF' : '#F3F4F6',
                    }}>
                      <Key size={14} color={item.hasDiff ? '#2563EB' : '#9CA3AF'} />
                    </div>
                    <div>
                      {item.user ? (
                        <div style={styles.activityDesc}>
                          <span style={styles.activityUser}>{item.user}</span>
                          {' updated '}
                          <span style={styles.activityTarget}>{item.target}</span>
                        </div>
                      ) : (
                        <div style={{ ...styles.activityDesc, color: Colors.textMuted }}>
                          {item.action}
                        </div>
                      )}
                      <div style={styles.activityDate}>{item.date}</div>
                    </div>
                  </div>
                  {item.hasDiff && (
                    <button style={styles.viewDiffBtn}>View Diff</button>
                  )}
                </div>
                {idx < ACTIVITY.length - 1 && <div style={styles.activityRowDivider} />}
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── styles ─── */

const styles = {
  page: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '24px 32px 64px',
  },

  /* Header */
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  title: {
    fontFamily: 'Google Sans, sans-serif',
    fontWeight: 700,
    fontSize: '32px',
    color: '#0f172a',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  subtitle: {
    fontFamily: 'Google Sans, sans-serif',
    fontWeight: 400,
    fontSize: '15px',
    color: '#64748b',
    maxWidth: 650,
    lineHeight: '24px',
    marginTop: '12px',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 44,
    padding: '0 18px',
    background: 'white',
    border: '1px solid #D1D5DB',
    borderRadius: 12,
    fontFamily: 'Google Sans',
    fontWeight: 600,
    fontSize: 14,
    color: '#111827',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 6,
  },

  /* Cards grid */
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 16,
    marginBottom: 28,
  },

  /* Card 1 — Keystore */
  keystoreCard: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 210,
  },
  keystoreCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  keyIconBox: {
    width: 40,
    height: 40,
    background: '#F3F4F6',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    background: '#16A34A',
    color: 'white',
    borderRadius: 9999,
    fontSize: 11,
    fontFamily: 'Google Sans',
    fontWeight: 600,
    height: 24,
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    letterSpacing: '0.05em',
  },
  projectName: {
    fontFamily: 'Google Sans',
    fontWeight: 700,
    fontSize: 28,
    color: '#111827',
    marginBottom: 10,
    lineHeight: 1.15,
  },
  metaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    flex: 1,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: 'Google Sans',
    fontSize: 13,
    color: '#6B7280',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    height: 42,
    justifyContent: 'center',
    background: '#0F4CB5',
    border: '1px solid #0F4CB5',
    borderRadius: 8,
    fontFamily: 'Google Sans',
    fontWeight: 500,
    fontSize: 13,
    color: '#ffffff',
    cursor: 'pointer',
  },
  deleteBtn: {
    width: 42,
    height: 42,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 8,
    cursor: 'pointer',
    flexShrink: 0,
  },

  /* Card 2 — Blue info */
  infoCard: {
    background: '#0f4cb5',
    borderRadius: 12,
    padding: 20,
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 210,
  },
  infoCardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'Google Sans',
    fontWeight: 600,
    fontSize: 16,
    marginBottom: 14,
  },
  infoBulletList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  infoBulletRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontFamily: 'Google Sans',
    fontSize: 13,
    lineHeight: 1.45,
    color: 'rgba(255,255,255,0.92)',
  },
  infoCardLink: {
    fontFamily: 'Google Sans',
    fontSize: 13,
    color: 'white',
    textDecoration: 'underline',
    marginTop: 14,
    cursor: 'pointer',
  },

  /* Card 3 — New Project Key */
  newProjectCard: {
    border: '2px dashed #D1D5DB',
    background: '#FAFAFA',
    borderRadius: 12,
    minHeight: 210,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
    cursor: 'pointer',
  },
  plusBox: {
    width: 48,
    height: 48,
    background: '#E5E7EB',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  newProjectTitle: {
    fontFamily: 'Google Sans',
    fontWeight: 600,
    fontSize: 18,
    color: '#111827',
  },
  newProjectDesc: {
    fontFamily: 'Google Sans',
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 180,
    lineHeight: 1.45,
  },

  /* Recent Activity */
  activitySection: {
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
  },
  activityHeading: {
    fontFamily: 'Google Sans',
    fontWeight: 600,
    fontSize: 20,
    color: '#111827',
  },
  activityDivider: {
    height: 1,
    background: '#E5E7EB',
  },
  activityRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    gap: 12,
  },
  activityRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  activityDot: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityDesc: {
    fontFamily: 'Google Sans',
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  activityUser: {
    fontWeight: 600,
    color: '#111827',
  },
  activityTarget: {
    fontWeight: 600,
    color: '#2563EB',
  },
  activityDate: {
    fontFamily: 'Google Sans',
    fontSize: 12,
    color: '#9CA3AF',
  },
  viewDiffBtn: {
    fontFamily: 'Google Sans',
    fontWeight: 500,
    fontSize: 13,
    color: '#2563EB',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  activityRowDivider: {
    height: 1,
    background: '#F3F4F6',
    margin: '0 20px',
  },
};
