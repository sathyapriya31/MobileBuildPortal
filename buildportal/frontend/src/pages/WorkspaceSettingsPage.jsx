import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Bell, HelpCircle, Shield, ChevronUp,
  Upload, Zap, Download, Trash2, RefreshCw, ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, differenceInYears } from 'date-fns';
import { api } from '../services/api.js';
import { BP_WORKSPACES_KEY } from './WorkspacePage.jsx';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';
import androidIconSrc from '../assets/android.png';
import iosIconSrc from '../assets/ios.png';

const BLUE = '#2563eb';
const BLUE_BG = 'rgba(37,99,235,0.06)';
const BLUE_BORDER = 'rgba(37,99,235,0.18)';

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);

  const workspaces = JSON.parse(localStorage.getItem(BP_WORKSPACES_KEY) || '[]');
  const workspace = workspaces.find(w => w.id === workspaceId);

  const platform = workspace?.platform || 'android';
  const showAndroidTab = platform === 'android' || platform === 'both';
  const showIosTab = platform === 'ios' || platform === 'both';

  const [activeTab, setActiveTab] = useState(showAndroidTab ? 'android' : 'ios');

  // Android state
  const [ksMode, setKsMode] = useState('generate');
  const [ksAlias, setKsAlias] = useState('');
  const [ksPass, setKsPass] = useState('');
  const [kPass, setKPass] = useState('');
  const [ksFile, setKsFile] = useState(null);
  const [ksData, setKsData] = useState(null);
  const [ksLoading, setKsLoading] = useState(false);
  const [ksGenerating, setKsGenerating] = useState(false);
  const [ksUploading, setKsUploading] = useState(false);

  // iOS state
  const [appleKeyFile, setAppleKeyFile] = useState(null);
  const [appleKeyId, setAppleKeyId] = useState('');
  const [appleIssuerId, setAppleIssuerId] = useState('');
  const [appleData, setAppleData] = useState(null);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleUploading, setAppleUploading] = useState(false);

  const loadKs = () => {
    if (!workspace?.projectId) return;
    setKsLoading(true);
    api.get(`/keystores/${workspace.projectId}`)
      .then(r => setKsData(r.data?.filename ? r.data : null))
      .catch(() => setKsData(null))
      .finally(() => setKsLoading(false));
  };

  const loadApple = () => {
    if (!workspace?.projectId) return;
    setAppleLoading(true);
    api.get(`/apple-credentials/${workspace.projectId}`)
      .then(r => setAppleData(r.data?.filename ? r.data : null))
      .catch(() => setAppleData(null))
      .finally(() => setAppleLoading(false));
  };

  useEffect(() => {
    if (showAndroidTab) loadKs();
    if (showIosTab) loadApple();
  }, [workspace?.projectId]);

  const handleKsGenerate = async () => {
    if (!ksAlias || !ksPass || !kPass) { toast.error('All fields are required'); return; }
    setKsGenerating(true);
    try {
      const res = await api.post('/keystores/generate', {
        projectId: workspace.projectId,
        alias: ksAlias,
        keystorePassword: ksPass,
        keyPassword: kPass,
      });
      toast.success('Keystore generated!');
      setKsData(res.data);
      setKsAlias(''); setKsPass(''); setKPass('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Generation failed');
    } finally {
      setKsGenerating(false);
    }
  };

  const handleKsUpload = async () => {
    if (!ksFile) { toast.error('Please select a keystore file'); return; }
    if (!ksAlias || !ksPass || !kPass) { toast.error('All fields are required'); return; }
    setKsUploading(true);
    try {
      const fd = new FormData();
      fd.append('keystore', ksFile);
      fd.append('projectId', workspace.projectId);
      fd.append('alias', ksAlias);
      fd.append('keystorePassword', ksPass);
      fd.append('keyPassword', kPass);
      const res = await api.post('/keystores', fd);
      toast.success('Keystore uploaded!');
      setKsData(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed');
    } finally {
      setKsUploading(false);
    }
  };

  const handleKsDelete = async () => {
    try {
      await api.delete(`/keystores/${workspace.projectId}`);
      setKsData(null);
      toast.success('Keystore deleted');
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const handleAppleUpload = async () => {
    if (!appleKeyFile) { toast.error('Please select a .p8 file'); return; }
    if (!appleKeyId || !appleIssuerId) { toast.error('Key ID and Issuer ID are required'); return; }
    setAppleUploading(true);
    try {
      const fd = new FormData();
      fd.append('keyFile', appleKeyFile);
      fd.append('projectId', workspace.projectId);
      fd.append('apiKeyId', appleKeyId);
      fd.append('apiIssuer', appleIssuerId);
      const res = await api.post('/apple-credentials', fd);
      toast.success('Credentials uploaded!');
      setAppleData(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed');
    } finally {
      setAppleUploading(false);
    }
  };

  const handleAppleDelete = async () => {
    try {
      await api.delete(`/apple-credentials/${workspace.projectId}`);
      setAppleData(null);
      toast.success('Credentials deleted');
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  if (!workspace) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: Colors.bg, gap: '16px' }}>
        <p style={{ fontSize: '16px', color: Colors.textMuted, ...Fonts.Regular }}>Workspace not found.</p>
        <button
          onClick={() => navigate('/workspaces')}
          style={{ padding: '10px 24px', background: BLUE, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', ...Fonts.SemiBold }}
        >
          Back to Workspaces
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: Colors.bg, ...Fonts.Regular }}>

      {/* ── Top Header Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: '24px', backgroundColor: Colors.headerBg,
        borderBottom: '1px solid ' + Colors.headerBorder,
        padding: '16px 32px', height: '64px', boxSizing: 'border-box',
      }}>
        <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', position: 'relative', padding: 0 }}>
          <Bell size={20} />
          <span style={{ position: 'absolute', top: 1, right: 1, width: 6, height: 6, backgroundColor: Colors.trendRed, borderRadius: '50%' }} />
        </button>
        <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', padding: 0 }}>
          <HelpCircle size={20} />
        </button>
        {user && (
          <img src={user.avatar} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid ' + Colors.headerBorder }} />
        )}
      </div>

      {/* ── Page Content ── */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

        {/* ── Page Header ── */}
        <div>
          <button
            onClick={() => navigate('/workspaces')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textMuted, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', padding: '0 0 10px 0', ...Fonts.Regular }}
          >
            <ArrowLeft size={14} />
            Back to Workspaces
          </button>
          <h1 style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '28px', fontWeight: '700', lineHeight: '1.1', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Workspace Settings
          </h1>
          <p style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '14px', color: '#94A3B8', margin: '5px 0 0 0' }}>
            {workspace.repositoryFullName || workspace.repositoryName}
          </p>
        </div>

        {/* ── Main Settings Card ── */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>

          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color={BLUE} />
              <span style={{ fontSize: '17px', fontWeight: '600', color: '#0f172a', ...Fonts.SemiBold }}>
                Code signing identities
              </span>
            </div>
            <ChevronUp size={18} color={Colors.textMuted} />
          </div>

          {/* Subtitle */}
          <div style={{ padding: '10px 28px 0' }}>
            <p style={{ fontSize: '14px', color: Colors.textMuted, margin: 0, lineHeight: '1.55' }}>
              Manage your personal account's{' '}
              <span style={{ color: BLUE, fontWeight: '500' }}>code signing identities</span>
              {' '}in one place.
            </p>
          </div>

          {/* ── Tab Bar ── */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '14px 28px 0', marginTop: '6px', gap: 0 }}>
            {showIosTab && (
              <button
                onClick={() => setActiveTab('ios')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 16px 11px', marginBottom: '-1px',
                  fontSize: '14px', color: activeTab === 'ios' ? BLUE : Colors.textMuted,
                  fontWeight: activeTab === 'ios' ? '600' : '400',
                  borderBottom: activeTab === 'ios' ? `2px solid ${BLUE}` : '2px solid transparent',
                  ...Fonts.Medium,
                }}
              >
                App Store Connect Credentials
              </button>
            )}
            {showAndroidTab && (
              <button
                onClick={() => setActiveTab('android')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 16px 11px', marginBottom: '-1px',
                  fontSize: '14px', color: activeTab === 'android' ? BLUE : Colors.textMuted,
                  fontWeight: activeTab === 'android' ? '600' : '400',
                  borderBottom: activeTab === 'android' ? `2px solid ${BLUE}` : '2px solid transparent',
                  ...Fonts.Medium,
                }}
              >
                Android Keystores
              </button>
            )}
          </div>

          {/* ── Tab Content ── */}
          <div style={{ padding: '24px 28px 28px' }}>
            {activeTab === 'android' && showAndroidTab && (
              <AndroidPanel
                mode={ksMode} setMode={setKsMode}
                alias={ksAlias} setAlias={setKsAlias}
                ksPass={ksPass} setKsPass={setKsPass}
                kPass={kPass} setKPass={setKPass}
                ksFile={ksFile} setKsFile={setKsFile}
                ksData={ksData}
                loading={ksLoading}
                generating={ksGenerating}
                uploading={ksUploading}
                onGenerate={handleKsGenerate}
                onUpload={handleKsUpload}
                onDelete={handleKsDelete}
              />
            )}
            {activeTab === 'ios' && showIosTab && (
              <IosPanel
                keyFile={appleKeyFile} setKeyFile={setAppleKeyFile}
                keyId={appleKeyId} setKeyId={setAppleKeyId}
                issuerId={appleIssuerId} setIssuerId={setAppleIssuerId}
                appleData={appleData}
                loading={appleLoading}
                uploading={appleUploading}
                onUpload={handleAppleUpload}
                onDelete={handleAppleDelete}
              />
            )}
          </div>
        </div>

        {/* ── Feature Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <FeatureCard
            icon={<Shield size={22} color={BLUE} />}
            title="Encrypted Storage"
            description="Your keystores are encrypted with AES-256 GCM at rest and never leave our secure enclave during the build process."
          />
          <FeatureCard
            icon={<Bell size={22} color={BLUE} />}
            title="Expiry Alerts"
            description="We'll notify you via email and portal dashboard 30 days before any certificate or keystore is set to expire."
          />
          <FeatureCard
            icon={<RefreshCw size={22} color={BLUE} />}
            title="Global Use"
            description="Once uploaded, these identities are available across all your CI/CD pipelines in the NearMind workspace."
          />
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Android Keystore Panel
───────────────────────────────────────────── */
function AndroidPanel({ mode, setMode, alias, setAlias, ksPass, setKsPass, kPass, setKPass, ksFile, setKsFile, ksData, loading, generating, uploading, onGenerate, onUpload, onDelete }) {
  const isWorking = generating || uploading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0, ...Fonts.SemiBold }}>
        Add or generate a keystore file
      </h3>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setMode('upload')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
            background: '#ffffff',
            border: `1.5px solid ${mode === 'upload' ? BLUE : '#d1d5db'}`,
            color: mode === 'upload' ? BLUE : '#374151',
            fontWeight: '500', ...Fonts.Medium,
          }}
        >
          <Upload size={15} color={mode === 'upload' ? BLUE : '#9ca3af'} />
          Upload Keystore
        </button>
        <button
          onClick={() => setMode('generate')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
            background: '#ffffff',
            border: `1.5px solid ${mode === 'generate' ? BLUE : '#d1d5db'}`,
            color: mode === 'generate' ? BLUE : '#374151',
            fontWeight: '500', ...Fonts.Medium,
          }}
        >
          <Zap size={15} color={mode === 'generate' ? BLUE : '#9ca3af'} />
          Generate New Keystore
        </button>
      </div>

      {/* Info banner – generate mode only */}
      {mode === 'generate' && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          background: BLUE_BG, border: `1px solid ${BLUE_BORDER}`,
          borderRadius: '10px', padding: '14px 16px',
        }}>
          <Zap size={16} color={BLUE} style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '13.5px', color: '#374151', margin: 0, lineHeight: '1.55' }}>
            <span style={{ fontWeight: '600', color: BLUE }}>Zero Configuration Generation:</span>
            {' '}We will execute{' '}
            <code style={{ background: '#e0e7ff', borderRadius: '3px', padding: '1px 6px', fontSize: '12px', color: '#3730a3', fontFamily: 'monospace' }}>
              keytool
            </code>
            {' '}directly on your host machine.
          </p>
        </div>
      )}

      {/* File picker – upload mode */}
      {mode === 'upload' && (
        <div>
          <label style={labelStyle}>Keystore File (.jks / .keystore)</label>
          <input
            type="file"
            accept=".jks,.keystore"
            onChange={e => setKsFile(e.target.files?.[0] || null)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          />
        </div>
      )}

      {/* 3-column form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Keystore Alias</label>
          <input
            type="text"
            placeholder="e.g. my-app-key"
            value={alias}
            onChange={e => setAlias(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Keystore Password</label>
          <input
            type="password"
            value={ksPass}
            onChange={e => setKsPass(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Key Password</label>
          <input
            type="password"
            value={kPass}
            onChange={e => setKPass(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Primary action button */}
      <button
        onClick={mode === 'generate' ? onGenerate : onUpload}
        disabled={isWorking}
        style={{
          width: '100%', padding: '14px 0', background: BLUE, color: '#ffffff',
          border: 'none', borderRadius: '10px', fontSize: '15px',
          cursor: isWorking ? 'not-allowed' : 'pointer',
          opacity: isWorking ? 0.7 : 1,
          ...Fonts.SemiBold,
        }}
      >
        {mode === 'generate'
          ? (generating ? 'Generating...' : 'Generate & Save Keystore')
          : (uploading ? 'Uploading...' : 'Upload Keystore')}
      </button>

      {/* Active Identities */}
      <ActiveIdentitiesDivider />
      {loading ? (
        <p style={emptyMsgStyle}>Loading...</p>
      ) : ksData ? (
        <CredentialItem
          icon={<img src={androidIconSrc} alt="Android" style={{ width: 24, height: 24, objectFit: 'contain' }} />}
          name={ksData.filename}
          createdAt={ksData.createdAt}
          expiresAt={ksData.expiresAt}
          downloadUrl={ksData.downloadUrl}
          onDelete={onDelete}
        />
      ) : (
        <p style={emptyMsgStyle}>No keystores uploaded yet</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   iOS Credentials Panel
───────────────────────────────────────────── */
function IosPanel({ keyFile, setKeyFile, keyId, setKeyId, issuerId, setIssuerId, appleData, loading, uploading, onUpload, onDelete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0, ...Fonts.SemiBold }}>
        Upload App Store Connect credentials
      </h3>

      {/* File picker */}
      <div>
        <label style={labelStyle}>Apple AuthKey (.p8 file)</label>
        <input
          type="file"
          accept=".p8"
          onChange={e => setKeyFile(e.target.files?.[0] || null)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        />
      </div>

      {/* 2-column form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Apple API Key ID</label>
          <input
            type="text"
            placeholder="e.g. 2GZN4HH9K8"
            value={keyId}
            onChange={e => setKeyId(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Apple API Issuer ID</label>
          <input
            type="text"
            placeholder="e.g. 12345678-1234-1234-1234-123456789abc"
            value={issuerId}
            onChange={e => setIssuerId(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <button
        onClick={onUpload}
        disabled={uploading}
        style={{
          width: '100%', padding: '14px 0', background: BLUE, color: '#ffffff',
          border: 'none', borderRadius: '10px', fontSize: '15px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.7 : 1,
          ...Fonts.SemiBold,
        }}
      >
        {uploading ? 'Uploading...' : 'Upload Credentials'}
      </button>

      {/* Active Identities */}
      <ActiveIdentitiesDivider />
      {loading ? (
        <p style={emptyMsgStyle}>Loading...</p>
      ) : appleData ? (
        <CredentialItem
          icon={<img src={iosIconSrc} alt="iOS" style={{ width: 24, height: 24, objectFit: 'contain' }} />}
          name={appleData.filename || `AuthKey_${appleData.apiKeyId}.p8`}
          createdAt={appleData.createdAt}
          expiresAt={appleData.expiresAt}
          downloadUrl={appleData.downloadUrl}
          onDelete={onDelete}
        />
      ) : (
        <p style={emptyMsgStyle}>No credentials uploaded yet</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared: Active Identities divider
───────────────────────────────────────────── */
function ActiveIdentitiesDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        Active Identities
      </span>
      <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared: Credential item row
───────────────────────────────────────────── */
function CredentialItem({ icon, name, createdAt, expiresAt, downloadUrl, onDelete }) {
  let metaText = '';
  try {
    if (createdAt) metaText = `Created ${format(new Date(createdAt), 'MMM d, yyyy')}`;
    if (expiresAt) {
      const yrs = differenceInYears(new Date(expiresAt), new Date());
      metaText += ` • Expires in ${yrs} year${yrs !== 1 ? 's' : ''}`;
    }
  } catch {}

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#f8fafc', borderRadius: '10px', padding: '13px 16px',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a', ...Fonts.SemiBold }}>{name}</p>
          {metaText && (
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: Colors.textMuted }}>{metaText}</p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', color: '#6b7280', textDecoration: 'none', borderRadius: '8px' }}
            title="Download"
          >
            <Download size={17} />
          </a>
        )}
        <button
          onClick={onDelete}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', borderRadius: '8px', padding: 0 }}
          title="Delete"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Feature Card
───────────────────────────────────────────── */
function FeatureCard({ icon, title, description }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '12px' }}>{icon}</div>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px', ...Fonts.SemiBold }}>{title}</h4>
      <p style={{ fontSize: '13px', color: Colors.textMuted, margin: 0, lineHeight: '1.65' }}>{description}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared styles
───────────────────────────────────────────── */
const labelStyle = {
  display: 'block', fontSize: '13px', fontWeight: '500',
  color: '#374151', marginBottom: '6px', ...Fonts.Medium,
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
  border: '1px solid #e5e7eb', borderRadius: '8px',
  background: '#f8fafc', fontSize: '14px', color: '#0f172a',
  outline: 'none', ...Fonts.Regular,
};

const emptyMsgStyle = {
  fontSize: '13px', color: Colors.textFaint,
  textAlign: 'center', padding: '14px 0', margin: 0,
};
