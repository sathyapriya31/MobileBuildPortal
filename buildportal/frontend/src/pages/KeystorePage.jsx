import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';

export default function KeystorePage() {
  const [keystores, setKeystores] = useState([]);
  const [loading, setLoading] = useState(true);
  const styles = getStyles();

  useEffect(() => {
    api.get('/keystores').then(({ data }) => {
      setKeystores(data.keystores);
      setLoading(false);
    });
  }, []);

  return (
    <div style={styles.page} className="page-keystore">
      <header className="page-header">
        <h1 style={styles.title} className="text-lg md:text-xl">Keystores</h1>
        <p style={styles.subtitle}>Manage Android signing keystores. Each project has exactly one keystore — upload once, reuse forever.</p>
      </header>

      {loading ? <p style={{ color: Colors.textMuted }}>Loading...</p> : (
        keystores.length === 0 ? (
          <div style={styles.empty} className="empty-keystore">
            <span style={{ fontSize: '3rem' }}>🔑</span>
            <p>No keystores uploaded yet. Upload a keystore from the New Build page when building Android.</p>
          </div>
        ) : (
          <div className="grid-keystore">
            {keystores.map(ks => (
              <div key={ks._id} style={styles.card} className="card-keystore">
                <div style={styles.cardIcon}>🔑</div>
                <div style={styles.cardInfo}>
                  <div style={styles.projectName}>{ks.projectName}</div>
                  <div style={styles.meta}>📁 {ks.originalFilename}</div>
                  <div style={styles.meta}>🔗 {ks.provider} · Project ID: {ks.projectId}</div>
                  <div style={styles.meta}>🕒 Updated {formatDistanceToNow(new Date(ks.updatedAt), { addSuffix: true })}</div>
                </div>
                <span style={styles.activeTag}>✅ Active</span>
              </div>
            ))}
          </div>
        )
      )}

      <div style={styles.infoBox} className="infobox-keystore">
        <h3 style={styles.infoTitle}>ℹ️ How Keystores Work</h3>
        <ul style={styles.infoList}>
          <li>Each project has a unique keystore stored securely in S3.</li>
          <li>Once uploaded, subsequent builds reuse it automatically.</li>
          <li>To replace a keystore, upload a new one from the New Build page — it will overwrite the existing one.</li>
          <li>Keystore passwords are encrypted and never exposed in the UI.</li>
        </ul>
      </div>
    </div>
  );
}

function getStyles() {
  return {
    page: { maxWidth: 900, margin: '0 auto' },
    title: { ...Fonts.ExtraBold, color: Colors.text, marginBottom: 'var(--space-2)' },
    subtitle: { color: Colors.textMuted, fontSize: 'var(--text-sm)', maxWidth: '60ch' },
    empty: { textAlign: 'center', color: Colors.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' },
    card: { background: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' },
    cardIcon: { fontSize: '2rem' },
    cardInfo: { flex: 1 },
    projectName: { ...Fonts.Bold, fontSize: 'var(--text-sm)', color: Colors.text, marginBottom: 'var(--space-2)' },
    meta: { fontSize: 'var(--text-xs)', color: Colors.textMuted, marginBottom: 'var(--space-1)' },
    activeTag: { fontSize: 'var(--text-xs)', color: Colors.success, background: Colors.successBg, padding: '3px 10px', borderRadius: 'var(--radius-full)', alignSelf: 'flex-start' },
    infoBox: { background: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-lg)' },
    infoTitle: { fontSize: 'var(--text-sm)', ...Fonts.Bold, color: Colors.text, marginBottom: 'var(--space-4)' },
    infoList: { paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', color: Colors.textMuted, fontSize: 'var(--text-sm)' },
  };
}