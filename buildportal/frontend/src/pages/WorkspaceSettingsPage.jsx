import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import toast from 'react-hot-toast';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';
import {
  Bell,
  HelpCircle,
  Search,
  Settings,
  ShieldAlert,
  Shield,
  Download,
  Trash2,
  Lock,
  Sparkles,
  ArrowLeft,
  Upload,
  Check
} from 'lucide-react';

const AndroidIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.5 10c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-11 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm11.5 1.5c0-.8-.7-1.5-1.5-1.5H7.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5h1v3c0 .6.4 1 1 1s1-.4 1-1v-3h3v3c0 .6.4 1 1 1s1-.4 1-1v-3h1c.8 0 1.5-.7 1.5-1.5v-6zm-1.8-3.7l1.3-1.3c.4-.4.4-1 0-1.4s-1-.4-1.4 0l-1.5 1.5c-.8-.3-1.7-.5-2.6-.5s-1.8.2-2.6.5L9.3 5.1c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4l1.3 1.3C7.6 8.7 6.7 10 6.2 11.5h11.6c-.5-1.5-1.4-2.8-2.6-3.7z" />
  </svg>
);

const IosIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-1 2.94.9.07 2.01-.52 2.83-1.33z" />
  </svg>
);

export default function WorkspaceSettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector(s => s.auth);

  const projectId = searchParams.get('id');
  const projectName = searchParams.get('name') || 'Workspace';
  const repoUrl = searchParams.get('repo');

  const [activeTab, setActiveTab] = useState('android'); // 'android' or 'ios'
  const [keystoreMode, setKeystoreMode] = useState('generate'); // 'upload' or 'generate'
  
  // Keystore State
  const [keystoreStatus, setKeystoreStatus] = useState(null);
  const [keystoreFile, setKeystoreFile] = useState(null);
  const [keystoreAlias, setKeystoreAlias] = useState('');
  const [keystorePass, setKeystorePass] = useState('');
  const [keyPass, setKeyPass] = useState('');
  const [loading, setLoading] = useState(false);

  // Apple Credentials State
  const [appleCredsStatus, setAppleCredsStatus] = useState(null);
  const [appleKeyFile, setAppleKeyFile] = useState(null);
  const [appleKeyId, setAppleKeyId] = useState('');
  const [appleIssuerId, setAppleIssuerId] = useState('');

  // Fetch current configs on load
  const loadConfigs = () => {
    if (!projectId) return;

    // Load Keystore
    api.get(`/keystores/${projectId}`)
      .then(({ data }) => {
        setKeystoreStatus(data.keystore);
      })
      .catch(err => console.error('Failed to load keystore config', err));

    // Load Apple credentials
    api.get(`/apple-credentials/${projectId}`)
      .then(({ data }) => {
        setAppleCredsStatus(data.credentials);
      })
      .catch(err => console.error('Failed to load Apple credentials config', err));
  };

  useEffect(() => {
    loadConfigs();
  }, [projectId]);

  const handleSaveKeystore = async (e) => {
    e.preventDefault();
    if (!projectId) return;

    if (keystoreMode === 'upload') {
      if (!keystoreFile || !keystoreAlias || !keystorePass || !keyPass) {
        return toast.error('Fill all fields and select a keystore file');
      }
      setLoading(true);
      const formData = new FormData();
      formData.append('keystore', keystoreFile);
      formData.append('projectId', projectId);
      formData.append('projectName', projectName);
      formData.append('provider', user?.provider || 'github');
      formData.append('keystoreAlias', keystoreAlias);
      formData.append('keystorePassword', keystorePass);
      formData.append('keyPassword', keyPass);

      try {
        const { data } = await api.post('/keystores', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setKeystoreStatus(data.keystore);
        toast.success('Keystore uploaded successfully!');
        // Reset form
        setKeystoreFile(null);
        setKeystoreAlias('');
        setKeystorePass('');
        setKeyPass('');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Upload failed');
      } finally {
        setLoading(false);
      }
    } else {
      if (!keystoreAlias || !keystorePass || !keyPass) {
        return toast.error('Fill key alias, keystore password, and key password');
      }
      setLoading(true);
      try {
        const { data } = await api.post('/keystores/generate', {
          projectId,
          projectName,
          provider: user?.provider || 'github',
          keystoreAlias,
          keystorePassword: keystorePass,
          keyPassword: keyPass
        });
        setKeystoreStatus(data.keystore);
        toast.success('Keystore generated and saved successfully! ⚡');
        // Reset form
        setKeystoreAlias('');
        setKeystorePass('');
        setKeyPass('');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Generation failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveAppleCredentials = async (e) => {
    e.preventDefault();
    if (!projectId) return;

    if (!appleKeyFile || !appleKeyId || !appleIssuerId) {
      return toast.error('Please fill in all Apple Key fields and select a file');
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('keyFile', appleKeyFile);
    formData.append('projectId', projectId);
    formData.append('projectName', projectName);
    formData.append('apiKeyId', appleKeyId);
    formData.append('apiIssuer', appleIssuerId);

    try {
      const { data } = await api.post('/apple-credentials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAppleCredsStatus(data.credentials);
      toast.success('App Store Connect credentials saved successfully! 🍎');
      // Reset form
      setAppleKeyFile(null);
      setAppleKeyId('');
      setAppleIssuerId('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKeystore = async () => {
    if (!window.confirm('Are you sure you want to delete this keystore?')) return;
    try {
      await api.delete(`/keystores/${projectId}`);
      setKeystoreStatus(null);
      toast.success('Keystore deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete keystore');
    }
  };

  const handleDeleteAppleCredentials = async () => {
    if (!window.confirm('Are you sure you want to delete these Apple credentials?')) return;
    try {
      await api.delete(`/apple-credentials/${projectId}`);
      setAppleCredsStatus(null);
      toast.success('Apple credentials deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete credentials');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: Colors.bg, ...Fonts.Regular }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.headerBg,
        borderBottom: '1px solid ' + Colors.headerBorder,
        padding: '16px 32px',
        height: '64px',
        boxSizing: 'border-box'
      }}>
        {/* Left Side Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/workspace')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: '18px', color: '#00388d', ...Fonts.Bold }}>
            Workspace Settings - {projectName}
          </span>
        </div>

        {/* Right Side Header Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', position: 'relative', padding: 0 }}>
            <Bell size={20} />
            <span style={{ position: 'absolute', top: 1, right: 1, width: 6, height: 6, backgroundColor: Colors.trendRed, borderRadius: '50%' }} />
          </button>
          <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', padding: 0 }}>
            <HelpCircle size={20} />
          </button>
          {user && <img src={user.avatar} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid ' + Colors.headerBorder }} />}
        </div>
      </div>

      {/* Main Container */}
      <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Card Wrapper */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #dadce0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            {/* Header Accordion-styled Title */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #dadce0',
              backgroundColor: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={18} style={{ color: '#0c5df4' }} />
                <span style={{ fontSize: '16px', ...Fonts.Bold, color: '#1e293b' }}>Code signing identities</span>
              </div>
            </div>

            {/* Inner Content */}
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', color: '#5f6368', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                Manage your personal account's <span style={{ color: '#0c5df4', fontWeight: '650' }}>code signing identities</span> in one place.
              </p>

              {/* Subtabs */}
              <div style={{
                display: 'flex',
                gap: '24px',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '24px'
              }}>
                <button
                  onClick={() => setActiveTab('ios')}
                  style={{
                    paddingBottom: '12px',
                    fontSize: '14px',
                    ...Fonts.Bold,
                    color: activeTab === 'ios' ? '#0c5df4' : '#64748b',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'ios' ? '3px solid #0c5df4' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  App Store Connect Credentials
                </button>
                <button
                  onClick={() => setActiveTab('android')}
                  style={{
                    paddingBottom: '12px',
                    fontSize: '14px',
                    ...Fonts.Bold,
                    color: activeTab === 'android' ? '#0c5df4' : '#64748b',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'android' ? '3px solid #0c5df4' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  Android keystores
                </button>
              </div>

              {/* Android Keystores Tab */}
              {activeTab === 'android' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <span style={{ fontSize: '15px', ...Fonts.Bold, color: '#1e293b' }}>Add or generate a keystore file</span>
                  
                  {/* Mode Toggles */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setKeystoreMode('upload')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1px solid #dadce0',
                        fontSize: '14px',
                        ...Fonts.Bold,
                        cursor: 'pointer',
                        backgroundColor: keystoreMode === 'upload' ? '#f1f3f4' : '#ffffff',
                        color: keystoreMode === 'upload' ? '#1e293b' : '#5f6368',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Upload size={16} />
                      Upload Keystore
                    </button>
                    <button
                      onClick={() => setKeystoreMode('generate')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: keystoreMode === 'generate' ? '1.5px solid #0c5df4' : '1px solid #dadce0',
                        fontSize: '14px',
                        ...Fonts.Bold,
                        cursor: 'pointer',
                        backgroundColor: '#ffffff',
                        color: keystoreMode === 'generate' ? '#0c5df4' : '#5f6368',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Sparkles size={16} style={{ color: keystoreMode === 'generate' ? '#0c5df4' : '#5f6368' }} />
                      Generate New Keystore
                    </button>
                  </div>

                  {/* Android Keystore Form */}
                  <form onSubmit={handleSaveKeystore} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {keystoreMode === 'generate' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        backgroundColor: '#edf3fe',
                        border: '1px solid #d2e9fc',
                        borderRadius: '8px',
                        color: '#0c5df4',
                        fontSize: '13px',
                        ...Fonts.Medium
                      }}>
                        <Sparkles size={16} style={{ flexShrink: 0 }} />
                        <span>
                          Zero Configuration Generation: We will execute <code style={{ backgroundColor: 'rgba(12, 93, 244, 0.08)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: '600' }}>keytool</code> directly on your host machine.
                        </span>
                      </div>
                    )}

                    {keystoreMode === 'upload' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>UPLOAD FILE</span>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '16px',
                          border: '2px dashed #dadce0',
                          borderRadius: '8px',
                          color: '#5f6368',
                          fontSize: '14px',
                          cursor: 'pointer',
                          backgroundColor: '#f8fafc',
                          transition: 'border-color 0.2s'
                        }}>
                          <input type="file" accept=".jks,.keystore" style={{ display: 'none' }} onChange={e => setKeystoreFile(e.target.files[0])} />
                          {keystoreFile ? `📎 ${keystoreFile.name}` : '+ Upload .jks / .keystore file'}
                        </label>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>KEYSTORE ALIAS</span>
                        <input
                          placeholder="e.g. my-app-key"
                          value={keystoreAlias}
                          onChange={e => setKeystoreAlias(e.target.value)}
                          style={{
                            height: '40px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '0 12px',
                            fontSize: '13px',
                            color: '#1e293b',
                            outline: 'none',
                            ...Fonts.Regular
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>KEYSTORE PASSWORD</span>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={keystorePass}
                          onChange={e => setKeystorePass(e.target.value)}
                          style={{
                            height: '40px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '0 12px',
                            fontSize: '13px',
                            color: '#1e293b',
                            outline: 'none',
                            ...Fonts.Regular
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>KEY PASSWORD</span>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={keyPass}
                          onChange={e => setKeyPass(e.target.value)}
                          style={{
                            height: '40px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '0 12px',
                            fontSize: '13px',
                            color: '#1e293b',
                            outline: 'none',
                            ...Fonts.Regular
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        height: '44px',
                        backgroundColor: '#0c5df4',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        ...Fonts.Bold,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                        opacity: loading ? 0.7 : 1,
                        marginTop: '8px',
                        width: 'fit-content',
                        padding: '0 32px'
                      }}
                    >
                      {loading ? 'Processing...' : (keystoreMode === 'upload' ? 'Upload & Save Keystore' : 'Generate & Save Keystore')}
                    </button>
                  </form>

                  {/* Active Identities section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>ACTIVE IDENTITIES</span>
                    {keystoreStatus ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        maxWidth: '500px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            backgroundColor: '#e6f4ea',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#137333',
                            flexShrink: 0
                          }}>
                            <AndroidIcon size={24} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '14px', ...Fonts.Bold, color: '#1e293b' }}>
                              {keystoreStatus.filename}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Created {keystoreStatus.uploadedAt ? new Date(keystoreStatus.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'} • Expires in 24 years
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {keystoreStatus.downloadUrl && (
                            <a
                              href={keystoreStatus.downloadUrl}
                              download={keystoreStatus.filename}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                border: '1px solid #dadce0',
                                backgroundColor: '#ffffff',
                                color: '#5f6368',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              title="Download keystore"
                            >
                              <Download size={16} />
                            </a>
                          )}
                          <button
                            onClick={handleDeleteKeystore}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid #fecdd3',
                              backgroundColor: '#fff1f2',
                              color: '#ef4444',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            title="Delete identity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        border: '1px dashed #dadce0',
                        borderRadius: '8px',
                        color: '#64748b',
                        fontSize: '13px',
                        textAlign: 'center'
                      }}>
                        No active android keystore found. Generate or upload one above.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* iOS Credentials Tab */}
              {activeTab === 'ios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <span style={{ fontSize: '15px', ...Fonts.Bold, color: '#1e293b' }}>Add App Store Connect credentials</span>

                  {/* iOS Form */}
                  <form onSubmit={handleSaveAppleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>UPLOAD AUTHKEY_XXX.P8 KEY FILE</span>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        border: '2px dashed #dadce0',
                        borderRadius: '8px',
                        color: '#5f6368',
                        fontSize: '14px',
                        cursor: 'pointer',
                        backgroundColor: '#f8fafc',
                        transition: 'border-color 0.2s'
                      }}>
                        <input type="file" accept=".p8" style={{ display: 'none' }} onChange={e => setAppleKeyFile(e.target.files[0])} />
                        {appleKeyFile ? `📎 ${appleKeyFile.name}` : '+ Upload AuthKey_xxx.p8 key file'}
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>APPLE API KEY ID</span>
                        <input
                          placeholder="e.g. 2GZN4HH9K8"
                          value={appleKeyId}
                          onChange={e => setAppleKeyId(e.target.value)}
                          style={{
                            height: '40px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '0 12px',
                            fontSize: '13px',
                            color: '#1e293b',
                            outline: 'none',
                            ...Fonts.Regular
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>APPLE API ISSUER ID</span>
                        <input
                          placeholder="e.g. Issuer ID"
                          value={appleIssuerId}
                          onChange={e => setAppleIssuerId(e.target.value)}
                          style={{
                            height: '40px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '0 12px',
                            fontSize: '13px',
                            color: '#1e293b',
                            outline: 'none',
                            ...Fonts.Regular
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        height: '44px',
                        backgroundColor: '#0c5df4',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        ...Fonts.Bold,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                        opacity: loading ? 0.7 : 1,
                        marginTop: '8px',
                        width: 'fit-content',
                        padding: '0 32px'
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Credentials'}
                    </button>
                  </form>

                  {/* Active Identities section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>ACTIVE IDENTITIES</span>
                    {appleCredsStatus ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        maxWidth: '500px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            backgroundColor: '#edf3fe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0c5df4',
                            flexShrink: 0
                          }}>
                            <IosIcon size={24} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '14px', ...Fonts.Bold, color: '#1e293b' }}>
                              {appleCredsStatus.filename}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Key ID: <strong>{appleCredsStatus.apiKeyId}</strong> • Issuer ID: <strong>{appleCredsStatus.apiIssuer}</strong>
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {appleCredsStatus.downloadUrl && (
                            <a
                              href={appleCredsStatus.downloadUrl}
                              download={appleCredsStatus.filename}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                border: '1px solid #dadce0',
                                backgroundColor: '#ffffff',
                                color: '#5f6368',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              title="Download credentials"
                            >
                              <Download size={16} />
                            </a>
                          )}
                          <button
                            onClick={handleDeleteAppleCredentials}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid #fecdd3',
                              backgroundColor: '#fff1f2',
                              color: '#ef4444',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            title="Delete identity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        border: '1px dashed #dadce0',
                        borderRadius: '8px',
                        color: '#64748b',
                        fontSize: '13px',
                        textAlign: 'center'
                      }}>
                        No App Store Connect credentials found. Upload them above.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Grid Info Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {/* Card 1: Encrypted Storage */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#edf3fe',
                color: '#0c5df4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={20} />
              </div>
              <h4 style={{ fontSize: '15px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>Encrypted Storage</h4>
              <p style={{ fontSize: '13px', color: '#5f6368', margin: 0, lineHeight: '1.5' }}>
                Your keystores are encrypted with AES-256 GCM at rest and never leave our secure enclave during the build process.
              </p>
            </div>

            {/* Card 2: Expiry Alerts */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#edf3fe',
                color: '#0c5df4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bell size={20} />
              </div>
              <h4 style={{ fontSize: '15px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>Expiry Alerts</h4>
              <p style={{ fontSize: '13px', color: '#5f6368', margin: 0, lineHeight: '1.5' }}>
                We'll notify you via email and portal dashboard 30 days before any certificate or keystore is set to expire.
              </p>
            </div>

            {/* Card 3: Global Use */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#edf3fe',
                color: '#0c5df4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Settings size={20} />
              </div>
              <h4 style={{ fontSize: '15px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>Global Use</h4>
              <p style={{ fontSize: '13px', color: '#5f6368', margin: 0, lineHeight: '1.5' }}>
                Once uploaded, these identities are available across all your CI/CD pipelines in the {projectName} workspace.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
