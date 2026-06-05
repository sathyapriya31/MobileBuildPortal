import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  Shield, ChevronUp, ChevronDown, Zap,
  Download, Trash2, Bell, ArrowLeft, RefreshCw,
  CheckCircle, Key,
} from 'lucide-react';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';
import { api } from '../services/api.js';

const inputStyle = {
  height: '42px',
  padding: '0 12px',
  fontSize: '14px',
  border: `1px solid ${Colors.cardBorder}`,
  borderRadius: '8px',
  background: '#f8fafc',
  color: Colors.text,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  ...Fonts.Regular,
};

const FileIcon = ({ color = Colors.ios }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const UploadFileIcon = ({ color = Colors.textMuted }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: '11px', ...Fonts.SemiBold, color: Colors.textMuted,
      letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px 0',
    }}>
      {children}
    </p>
  );
}

function IdentityCardSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 16px',
      background: '#f8fafc',
      border: `1px solid ${Colors.cardBorder}`,
      borderRadius: '10px',
    }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#e2e8f0', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: '14px', width: '160px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '6px' }} />
        <div style={{ height: '12px', width: '220px', background: '#e2e8f0', borderRadius: '4px' }} />
      </div>
    </div>
  );
}

function IdentityCard({ icon, iconBg, title, detail, onDownload, downloadLoading, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px',
      background: '#f8fafc',
      border: `1px solid ${Colors.cardBorder}`,
      borderRadius: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '8px',
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: '14px', ...Fonts.SemiBold, color: Colors.text, margin: '0 0 2px 0' }}>
            {title}
          </p>
          <p style={{ fontSize: '12px', color: Colors.textMuted, margin: 0 }}>
            {detail}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {onDownload && (
          <button
            onClick={onDownload}
            disabled={downloadLoading}
            title="Download"
            style={{
              background: 'none', border: 'none',
              cursor: downloadLoading ? 'not-allowed' : 'pointer',
              color: downloadLoading ? Colors.textFaint : Colors.textMuted,
              padding: '8px',
              display: 'flex', alignItems: 'center', borderRadius: '6px',
              transition: 'background 0.15s, color 0.15s',
              opacity: downloadLoading ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!downloadLoading) e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            <Download size={17} />
          </button>
        )}
        <button
          onClick={onDelete}
          title="Delete"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: Colors.error, padding: '8px',
            display: 'flex', alignItems: 'center', borderRadius: '6px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = Colors.errorBg; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function expiryText(createdAt) {
  if (!createdAt) return '';
  const exp = new Date(createdAt);
  exp.setFullYear(exp.getFullYear() + 25);
  const yrs = Math.floor((exp - new Date()) / (365.25 * 24 * 3600 * 1000));
  if (yrs > 1) return `Expires in ${yrs} years`;
  if (yrs === 1) return 'Expires in 1 year';
  const months = Math.floor((exp - new Date()) / (30.5 * 24 * 3600 * 1000));
  if (months > 0) return `Expires in ${months} months`;
  return 'Expired';
}

function appleExpiryText(createdAt) {
  if (!createdAt) return '';
  const exp = new Date(createdAt);
  exp.setFullYear(exp.getFullYear() + 1);
  const months = Math.floor((exp - new Date()) / (30.5 * 24 * 3600 * 1000));
  if (months > 12) return 'Expires in 1 year';
  if (months > 0) return `Expires in ${months} months`;
  return 'Expired';
}

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);

  const [workspace, setWorkspace] = useState(null);
  const [sectionOpen, setSectionOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('android');

  // Keystore
  const [keystoreStatus, setKeystoreStatus] = useState(null);
  const [keystoreMode, setKeystoreMode] = useState('generate');
  const [keystoreFile, setKeystoreFile] = useState(null);
  const [keystoreAlias, setKeystoreAlias] = useState('');
  const [keystorePass, setKeystorePass] = useState('');
  const [keyPass, setKeyPass] = useState('');
  const [savingKS, setSavingKS] = useState(false);
  const [downloadingKS, setDownloadingKS] = useState(false);
  const [deletingKS, setDeletingKS] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadingKS, setLoadingKS] = useState(true);

  // Apple credentials
  const [appleCredsStatus, setAppleCredsStatus] = useState(null);
  const [appleKeyFile, setAppleKeyFile] = useState(null);
  const [appleKeyId, setAppleKeyId] = useState('');
  const [appleIssuerId, setAppleIssuerId] = useState('');
  const [appleTeamId, setAppleTeamId] = useState('');
  const [savingApple, setSavingApple] = useState(false);
  const [downloadingApple, setDownloadingApple] = useState(false);
  const [deletingApple, setDeletingApple] = useState(false);
  const [showDeleteAppleModal, setShowDeleteAppleModal] = useState(false);
  const [loadingApple, setLoadingApple] = useState(true);

  useEffect(() => {
    api.get('/builds/workspaces')
      .then(r => {
        const ws = (r.data.workspaces || []).find(w => w.projectId === workspaceId);
        setWorkspace(ws || null);
        if (ws?.platform === 'ios') setActiveTab('ios');
      })
      .catch(() => {});

    api.get(`/keystores/${workspaceId}`)
      .then(({ data }) => setKeystoreStatus(data.keystore || null))
      .catch(() => {})
      .finally(() => setLoadingKS(false));

    api.get(`/apple-credentials/${workspaceId}`)
      .then(({ data }) => setAppleCredsStatus(data.credentials || null))
      .catch(() => {})
      .finally(() => setLoadingApple(false));
  }, [workspaceId]);

  const handleSaveKeystore = async () => {
    if (keystoreMode === 'generate') {
      if (!keystoreAlias || !keystorePass || !keyPass) {
        return toast.error('Fill all keystore fields');
      }
      setSavingKS(true);
      try {
        const { data } = await api.post('/keystores/generate', {
          projectId: workspaceId,
          projectName: workspace?.repositoryName || workspaceId,
          provider: user.provider,
          keystoreAlias,
          keystorePassword: keystorePass,
          keyPassword: keyPass,
        });
        setKeystoreStatus(data.keystore);
        toast.success('Keystore generated!');
        setKeystoreAlias(''); setKeystorePass(''); setKeyPass('');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Generation failed');
      } finally {
        setSavingKS(false);
      }
    } else {
      if (!keystoreFile || !keystoreAlias || !keystorePass || !keyPass) {
        return toast.error('Fill all keystore fields and select a file');
      }
      setSavingKS(true);
      const fd = new FormData();
      fd.append('keystore', keystoreFile);
      fd.append('projectId', workspaceId);
      fd.append('projectName', workspace?.repositoryName || workspaceId);
      fd.append('provider', user.provider);
      fd.append('keystoreAlias', keystoreAlias);
      fd.append('keystorePassword', keystorePass);
      fd.append('keyPassword', keyPass);
      try {
        const { data } = await api.post('/keystores', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setKeystoreStatus(data.keystore);
        toast.success('Keystore uploaded!');
        setKeystoreFile(null); setKeystoreAlias(''); setKeystorePass(''); setKeyPass('');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Upload failed');
      } finally {
        setSavingKS(false);
      }
    }
  };

  const handleDownloadKeystore = async () => {
    setDownloadingKS(true);
    try {
      const { data } = await api.get(`/keystores/${workspaceId}/download`);
      const a = document.createElement('a');
      a.href = data.url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Download failed');
    } finally {
      setDownloadingKS(false);
    }
  };

  const handleDeleteKeystore = async () => {
    setDeletingKS(true);
    try {
      await api.delete(`/keystores/${workspaceId}`);
      setKeystoreStatus(null);
      setShowDeleteModal(false);
      toast.success('Android Keystore deleted successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeletingKS(false);
    }
  };

  const handleDeleteAppleCreds = async () => {
    setDeletingApple(true);
    try {
      await api.delete(`/apple-credentials/${workspaceId}`);
      setAppleCredsStatus(null);
      setShowDeleteAppleModal(false);
      toast.success('App Store Connect key deleted successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete credentials');
    } finally {
      setDeletingApple(false);
    }
  };

  const handleDownloadAppleCreds = async () => {
    setDownloadingApple(true);
    try {
      const { data } = await api.get(`/apple-credentials/${workspaceId}/download`);
      const a = document.createElement('a');
      a.href = data.url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Download failed');
    } finally {
      setDownloadingApple(false);
    }
  };

  const handleSaveApple = async () => {
    if (!appleKeyFile || !appleKeyId || !appleIssuerId) {
      return toast.error('Fill all Apple credential fields and select a .p8 file');
    }
    setSavingApple(true);
    const fd = new FormData();
    fd.append('keyFile', appleKeyFile);
    fd.append('projectId', workspaceId);
    fd.append('projectName', workspace?.repositoryName || workspaceId);
    fd.append('apiKeyId', appleKeyId);
    fd.append('apiIssuer', appleIssuerId);
    try {
      const { data } = await api.post('/apple-credentials', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAppleCredsStatus(data.credentials);
      toast.success('App Store Connect credentials saved!');
      setAppleKeyFile(null); setAppleKeyId(''); setAppleIssuerId(''); setAppleTeamId('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save credentials');
    } finally {
      setSavingApple(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: Colors.bg, ...Fonts.Regular }}>

      {/* Delete Keystore Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => { if (!deletingKS) setShowDeleteModal(false); }}
        >
          <div
            style={{
              background: '#fff', borderRadius: '12px', padding: '28px 28px 24px',
              width: '440px', maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(15,23,42,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', ...Fonts.SemiBold, color: Colors.text, margin: '0 0 10px 0' }}>
              Delete Android Keystore?
            </h3>
            <p style={{ fontSize: '14px', color: Colors.textMuted, margin: '0 0 6px 0', lineHeight: 1.6 }}>
              Are you sure you want to permanently delete{' '}
              <span style={{ ...Fonts.SemiBold, color: Colors.text }}>
                &ldquo;{keystoreStatus?.originalFilename || keystoreStatus?.filename || `${workspaceId}.keystore`}&rdquo;
              </span>?
            </p>
            <p style={{ fontSize: '13px', color: Colors.error, margin: '0 0 24px 0' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingKS}
                style={{
                  padding: '9px 20px', fontSize: '14px', ...Fonts.Medium,
                  border: `1px solid ${Colors.cardBorder}`,
                  borderRadius: '8px', background: '#fff',
                  color: Colors.textMuted, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteKeystore}
                disabled={deletingKS}
                style={{
                  padding: '9px 20px', fontSize: '14px', ...Fonts.SemiBold,
                  border: 'none', borderRadius: '8px',
                  background: Colors.error, color: '#fff',
                  cursor: deletingKS ? 'not-allowed' : 'pointer',
                  opacity: deletingKS ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {deletingKS ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Apple Key Confirmation Modal */}
      {showDeleteAppleModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => { if (!deletingApple) setShowDeleteAppleModal(false); }}
        >
          <div
            style={{
              background: '#fff', borderRadius: '12px', padding: '28px 28px 24px',
              width: '440px', maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(15,23,42,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', ...Fonts.SemiBold, color: Colors.text, margin: '0 0 10px 0' }}>
              Delete App Store Connect Key?
            </h3>
            <p style={{ fontSize: '14px', color: Colors.textMuted, margin: '0 0 6px 0', lineHeight: 1.6 }}>
              Are you sure you want to permanently delete{' '}
              <span style={{ ...Fonts.SemiBold, color: Colors.text }}>
                &ldquo;{appleCredsStatus?.filename}&rdquo;
              </span>?
            </p>
            <p style={{ fontSize: '13px', color: Colors.error, margin: '0 0 24px 0' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteAppleModal(false)}
                disabled={deletingApple}
                style={{
                  padding: '9px 20px', fontSize: '14px', ...Fonts.Medium,
                  border: `1px solid ${Colors.cardBorder}`,
                  borderRadius: '8px', background: '#fff',
                  color: Colors.textMuted, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAppleCreds}
                disabled={deletingApple}
                style={{
                  padding: '9px 20px', fontSize: '14px', ...Fonts.SemiBold,
                  border: 'none', borderRadius: '8px',
                  background: Colors.error, color: '#fff',
                  cursor: deletingApple ? 'not-allowed' : 'pointer',
                  opacity: deletingApple ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {deletingApple ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.headerBg, borderBottom: '1px solid ' + Colors.headerBorder,
        padding: '0 32px', height: '64px', boxSizing: 'border-box',
      }}>
        <button
          onClick={() => navigate('/workspaces')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: Colors.textMuted, fontSize: '14px', padding: 0, ...Fonts.Medium,
          }}
        >
          <ArrowLeft size={18} />
          Back to Workspaces
        </button>
        {user && (
          <img
            src={user.avatar} alt={user.name}
            style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid ' + Colors.headerBorder }}
          />
        )}
      </div>

      {/* Page Body */}
      <div style={{
        padding: '28px 32px', width: '100%', maxWidth: '1200px',
        margin: '0 auto', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: '24px',
      }}>

        {/* Page Title */}
        <div>
          <h1 style={{ fontSize: '24px', ...Fonts.Bold, color: Colors.text, margin: '0 0 4px 0' }}>
            {workspace?.repositoryName || 'Workspace Settings'}
          </h1>
          <p style={{ fontSize: '14px', color: Colors.textMuted, margin: 0 }}>
            Manage code signing identities and credentials for this workspace.
          </p>
        </div>

        {/* Code Signing Identities Card */}
        <div style={{
          background: '#fff',
          border: `1px solid ${Colors.cardBorder}`,
          borderRadius: '12px',
          boxShadow: Colors.cardShadow,
          overflow: 'hidden',
        }}>
          {/* Card Header */}
          <div
            onClick={() => setSectionOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', cursor: 'pointer',
              borderBottom: sectionOpen ? `1px solid ${Colors.cardBorder}` : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color={Colors.ios} />
              <span style={{ fontSize: '15px', ...Fonts.SemiBold, color: Colors.text }}>
                Code signing identities
              </span>
            </div>
            {sectionOpen
              ? <ChevronUp size={18} color={Colors.textMuted} />
              : <ChevronDown size={18} color={Colors.textMuted} />
            }
          </div>

          {sectionOpen && (
            <div style={{ padding: '24px' }}>

              {/* Description */}
              <p style={{ fontSize: '14px', color: Colors.textMuted, margin: '0 0 20px 0', lineHeight: 1.6 }}>
                Manage your personal account's{' '}
                <span style={{ color: Colors.ios, ...Fonts.Medium }}>code signing identities</span>
                {' '}in one place.
              </p>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${Colors.cardBorder}`, marginBottom: '28px' }}>
                {[
                  { id: 'ios', label: 'App Store Connect Credentials' },
                  { id: 'android', label: 'Android Keystores' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '10px 18px', fontSize: '14px', ...Fonts.Medium,
                      background: 'none', border: 'none',
                      borderBottom: activeTab === tab.id
                        ? `2px solid ${Colors.ios}`
                        : '2px solid transparent',
                      color: activeTab === tab.id ? Colors.ios : Colors.textMuted,
                      cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.15s',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Android Keystores Tab ── */}
              {activeTab === 'android' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Sub-heading + mode buttons */}
                  <div>
                    <h3 style={{ fontSize: '15px', ...Fonts.SemiBold, color: Colors.text, margin: '0 0 14px 0' }}>
                      Add or generate a keystore file
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setKeystoreMode('upload')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '8px 16px', fontSize: '13px', ...Fonts.Medium,
                          border: keystoreMode === 'upload'
                            ? `1.5px solid ${Colors.ios}`
                            : `1px solid ${Colors.cardBorder}`,
                          borderRadius: '8px', background: '#fff',
                          color: keystoreMode === 'upload' ? Colors.ios : Colors.textMuted,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <UploadFileIcon color={keystoreMode === 'upload' ? Colors.ios : Colors.textMuted} />
                        Upload Keystore
                      </button>
                      <button
                        onClick={() => setKeystoreMode('generate')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '8px 16px', fontSize: '13px', ...Fonts.Medium,
                          border: keystoreMode === 'generate'
                            ? `1.5px solid ${Colors.ios}`
                            : `1px solid ${Colors.cardBorder}`,
                          borderRadius: '8px', background: '#fff',
                          color: keystoreMode === 'generate' ? Colors.ios : Colors.textMuted,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <Zap size={14} />
                        Generate New Keystore
                      </button>
                    </div>
                  </div>

                  {/* Info banner — generate mode */}
                  {keystoreMode === 'generate' && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '12px 16px',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                    }}>
                      <Zap size={16} color={Colors.ios} style={{ flexShrink: 0, marginTop: '1px' }} />
                      <p style={{ fontSize: '13px', color: '#1e40af', margin: 0, lineHeight: 1.5 }}>
                        <span style={{ ...Fonts.SemiBold }}>Zero Configuration Generation:</span>
                        {' '}We will execute{' '}
                        <code style={{
                          background: '#dbeafe', padding: '1px 5px',
                          borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px',
                        }}>
                          keytool
                        </code>
                        {' '}directly on your host machine.
                      </p>
                    </div>
                  )}

                  {/* File upload area — upload mode */}
                  {keystoreMode === 'upload' && (
                    <label style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '20px',
                      border: '2px dashed #dadce0',
                      borderRadius: '8px',
                      color: Colors.textMuted, fontSize: '13px', cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}>
                      <input
                        type="file" accept=".jks,.keystore"
                        style={{ display: 'none' }}
                        onChange={e => setKeystoreFile(e.target.files[0])}
                      />
                      {keystoreFile ? `📎 ${keystoreFile.name}` : '+ Upload .jks / .keystore file'}
                    </label>
                  )}

                  {/* 3-column form */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', ...Fonts.Medium, color: Colors.textMuted }}>
                        Keystore Alias
                      </label>
                      <input
                        placeholder="e.g. my-app-key"
                        value={keystoreAlias}
                        onChange={e => setKeystoreAlias(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', ...Fonts.Medium, color: Colors.textMuted }}>
                        Keystore Password
                      </label>
                      <input
                        type="password"
                        value={keystorePass}
                        onChange={e => setKeystorePass(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', ...Fonts.Medium, color: Colors.textMuted }}>
                        Key Password
                      </label>
                      <input
                        type="password"
                        value={keyPass}
                        onChange={e => setKeyPass(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <button
                    onClick={handleSaveKeystore}
                    disabled={savingKS}
                    style={{
                      width: '100%', padding: '14px', fontSize: '14px', ...Fonts.SemiBold,
                      background: Colors.ios, color: '#fff', border: 'none',
                      borderRadius: '8px',
                      cursor: savingKS ? 'not-allowed' : 'pointer',
                      opacity: savingKS ? 0.7 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {savingKS
                      ? 'Saving...'
                      : keystoreMode === 'generate'
                        ? 'Generate & Save Keystore'
                        : 'Upload & Save Keystore'
                    }
                  </button>

                  {/* Active Identities */}
                  {(loadingKS || keystoreStatus) && (
                    <div>
                      <SectionLabel>Active Identities</SectionLabel>
                      {loadingKS ? (
                        <IdentityCardSkeleton />
                      ) : (
                        <IdentityCard
                          icon={<FileIcon />}
                          iconBg={Colors.iosBg}
                          title={keystoreStatus.originalFilename || keystoreStatus.filename || `${workspaceId}.keystore`}
                          detail={[
                            keystoreStatus.uploadedAt && `Created ${fmtDate(keystoreStatus.uploadedAt)}`,
                            keystoreStatus.uploadedAt && expiryText(keystoreStatus.uploadedAt),
                          ].filter(Boolean).join(' • ')}
                          onDownload={handleDownloadKeystore}
                          downloadLoading={downloadingKS}
                          onDelete={() => setShowDeleteModal(true)}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── iOS Credentials Tab ── */}
              {activeTab === 'ios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Upload Dropzone */}
                  <label style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    height: '140px', width: '100%',
                    border: '2px dashed #D1D5DB', borderRadius: '12px',
                    background: '#FFFFFF', cursor: 'pointer', gap: '8px',
                    boxSizing: 'border-box', transition: 'border-color 0.15s',
                  }}>
                    <input type="file" accept=".p8" style={{ display: 'none' }} onChange={e => setAppleKeyFile(e.target.files[0])} />
                    {appleKeyFile ? (
                      <span style={{ color: '#2563EB', fontSize: '15px', fontWeight: 600 }}>📎 {appleKeyFile.name}</span>
                    ) : (
                      <>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '50%',
                          background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FileIcon color="#2563EB" />
                        </div>
                        <span style={{ color: '#2563EB', fontSize: '15px', fontWeight: 600 }}>
                          + Upload AuthKey_xxx.p8 key file
                        </span>
                        <span style={{ color: '#6B7280', fontSize: '14px' }}>
                          Maximum file size 2MB (.p8 only)
                        </span>
                      </>
                    )}
                  </label>

                  {/* Apple API Key ID */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>Apple API Key ID</label>
                    <input
                      placeholder="Apple API Key ID (e.g. 2GZN4HH9K8)"
                      value={appleKeyId}
                      onChange={e => setAppleKeyId(e.target.value)}
                      style={{
                        height: '48px', padding: '0 12px', fontSize: '14px',
                        border: '1px solid #E5E7EB', borderRadius: '8px',
                        background: '#FFFFFF', color: '#111827',
                        outline: 'none', width: '100%', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Apple API Issuer ID */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>Apple API Issuer ID</label>
                    <input
                      placeholder="Apple API Issuer ID"
                      value={appleIssuerId}
                      onChange={e => setAppleIssuerId(e.target.value)}
                      style={{
                        height: '48px', padding: '0 12px', fontSize: '14px',
                        border: '1px solid #E5E7EB', borderRadius: '8px',
                        background: '#FFFFFF', color: '#111827',
                        outline: 'none', width: '100%', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Footer: security note + save button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={16} color="#2563EB" />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#2563EB' }}>
                        Data is encrypted at rest
                      </span>
                    </div>
                    <button
                      onClick={handleSaveApple}
                      disabled={savingApple}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        height: '48px', padding: '0 24px', fontSize: '14px', fontWeight: 600,
                        background: '#0F5BE1', color: '#ffffff',
                        border: 'none', borderRadius: '8px',
                        cursor: savingApple ? 'not-allowed' : 'pointer',
                        opacity: savingApple ? 0.7 : 1, transition: 'background 0.15s, opacity 0.2s',
                      }}
                      onMouseEnter={e => { if (!savingApple) e.currentTarget.style.background = '#0D4FC7'; }}
                      onMouseLeave={e => { if (!savingApple) e.currentTarget.style.background = '#0F5BE1'; }}
                    >
                      <CheckCircle size={16} />
                      {savingApple ? 'Saving...' : 'Save & Validate Credentials'}
                    </button>
                  </div>

                  {/* Active Keys */}
                  {(loadingApple || appleCredsStatus) && (
                    <>
                      <div style={{ borderTop: `1px solid ${Colors.cardBorder}`, margin: '4px 0' }} />
                      <div>
                        <SectionLabel>Active Keys</SectionLabel>
                        {loadingApple ? (
                          <IdentityCardSkeleton />
                        ) : (
                          <IdentityCard
                            icon={<Key size={18} color={Colors.ios} />}
                            iconBg={Colors.iosBg}
                            title={appleCredsStatus.filename}
                            detail={[
                              appleCredsStatus.createdAt && `Created ${fmtDate(appleCredsStatus.createdAt)}`,
                              appleCredsStatus.createdAt && appleExpiryText(appleCredsStatus.createdAt),
                            ].filter(Boolean).join(' • ')}
                            onDownload={handleDownloadAppleCreds}
                            downloadLoading={downloadingApple}
                            onDelete={() => setShowDeleteAppleModal(true)}
                          />
                        )}
                      </div>
                    </>
                  )}

                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Feature Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          {[
            {
              icon: <Shield size={22} color={Colors.ios} />,
              iconBg: Colors.iosBg,
              title: 'Encrypted Storage',
              desc: 'Your keystores are encrypted with AES-256 GCM at rest and never leave our secure enclave during the build process.',
            },
            {
              icon: <Bell size={22} color={Colors.warning} />,
              iconBg: Colors.warningBg,
              title: 'Expiry Alerts',
              desc: "We'll notify you via email and portal dashboard 30 days before any certificate or keystore is set to expire.",
            },
            {
              icon: <RefreshCw size={22} color={Colors.primary} />,
              iconBg: Colors.primaryBg,
              title: 'Global Use',
              desc: 'Once uploaded, these identities are available across all your CI/CD pipelines in the NearMind workspace.',
            },
          ].map((card, i) => (
            <div key={i} style={{
              background: '#fff',
              border: `1px solid ${Colors.cardBorder}`,
              borderRadius: '12px',
              padding: '24px',
              boxShadow: Colors.cardShadow,
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: card.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px',
              }}>
                {card.icon}
              </div>
              <h3 style={{ fontSize: '14px', ...Fonts.SemiBold, color: Colors.text, margin: '0 0 8px 0' }}>
                {card.title}
              </h3>
              <p style={{ fontSize: '13px', color: Colors.textMuted, margin: 0, lineHeight: 1.6 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile responsive styles */}
        <style>{`
          @media (max-width: 768px) {
            .ws-settings-grid-3 { grid-template-columns: 1fr !important; }
            .ws-settings-grid-2 { grid-template-columns: 1fr !important; }
            .ws-settings-form-row { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 640px) {
            .ws-settings-tabs button { padding: 8px 10px !important; font-size: 13px !important; }
          }
        `}</style>

      </div>
    </div>
  );
}
