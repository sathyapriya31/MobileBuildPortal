import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchRepos, fetchBranches, selectRepo } from '../store/slices/reposSlice.js';
import { triggerBuild } from '../store/slices/buildsSlice.js';
import { api } from '../services/api.js';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';
import { upsertWorkspace } from '../utils/workspacesStorage.js';

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

const PLATFORMS = [
  { id: 'android', label: 'Android', color: Colors.android },
  { id: 'ios', label: 'iOS', color: Colors.ios },
];

export default function BuildPage() {
  const styles = getStyles();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { repos, branches, loading, branchesLoading, selectedRepo } = useSelector(s => s.repos);
  const { triggerLoading } = useSelector(s => s.builds);

  const [branch, setBranch] = useState('');
  const [platform, setPlatform] = useState('android');
  const [androidFormat, setAndroidFormat] = useState('apk');
  const [search, setSearch] = useState('');
  const [keystoreStatus, setKeystoreStatus] = useState(null);
  const [keystoreFile, setKeystoreFile] = useState(null);
  const [keystoreAlias, setKeystoreAlias] = useState('');
  const [keystorePass, setKeystorePass] = useState('');
  const [keyPass, setKeyPass] = useState('');
  const [uploadingKS, setUploadingKS] = useState(false);
  const [keystoreMode, setKeystoreMode] = useState('upload'); // 'upload' or 'generate'
  const [versionName, setVersionName] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [buildType, setBuildType] = useState('testing');
  const [appleKeyFile, setAppleKeyFile] = useState(null);
  const [appleKeyId, setAppleKeyId] = useState('');
  const [appleIssuerId, setAppleIssuerId] = useState('');
  const [appleCredsStatus, setAppleCredsStatus] = useState(null);
  const [uploadingApple, setUploadingApple] = useState(false);

  useEffect(() => {
    if (user) dispatch(fetchRepos({ provider: user.provider, search }));
  }, [user, search]);

  useEffect(() => {
    if (selectedRepo) {
      const [owner, repo] = selectedRepo.fullName.split('/');
      dispatch(fetchBranches({ provider: user.provider, owner, repo, projectId: selectedRepo.id }));
      // Check keystore
      api.get(`/keystores/${selectedRepo.id}`).then(({ data }) => {
        setKeystoreStatus(data.keystore);
      });
      // Check Apple credentials
      api.get(`/apple-credentials/${selectedRepo.id}`).then(({ data }) => {
        setAppleCredsStatus(data.credentials);
      });
    }
  }, [selectedRepo]);

  useEffect(() => {
    if (branches.length) setBranch(branches[0].name);
  }, [branches]);

  const handleRepoSelect = (repo) => {
    dispatch(selectRepo(repo));
    setBranch('');
  };

  const handleSaveKeystore = async () => {
    if (keystoreMode === 'upload') {
      if (!keystoreFile || !keystoreAlias || !keystorePass || !keyPass) {
        return toast.error('Fill all keystore fields and select a file');
      }
      setUploadingKS(true);
      const formData = new FormData();
      formData.append('keystore', keystoreFile);
      formData.append('projectId', selectedRepo.id);
      formData.append('projectName', selectedRepo.name);
      formData.append('provider', user.provider);
      formData.append('keystoreAlias', keystoreAlias);
      formData.append('keystorePassword', keystorePass);
      formData.append('keyPassword', keyPass);
      try {
        const { data } = await api.post('/keystores', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setKeystoreStatus(data.keystore);
        toast.success('Keystore uploaded successfully!');
        setKeystoreFile(null);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Upload failed');
      } finally {
        setUploadingKS(false);
      }
    } else {
      if (!keystoreAlias || !keystorePass || !keyPass) {
        return toast.error('Fill key alias, keystore password, and key password');
      }
      setUploadingKS(true);
      try {
        const { data } = await api.post('/keystores/generate', {
          projectId: selectedRepo.id,
          projectName: selectedRepo.name,
          provider: user.provider,
          keystoreAlias,
          keystorePassword: keystorePass,
          keyPassword: keyPass
        });
        setKeystoreStatus(data.keystore);
        toast.success('Keystore generated dynamically! ⚡');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Generation failed');
      } finally {
        setUploadingKS(false);
      }
    }
  };

  const handleSaveAppleCredentials = async () => {
    if (!appleKeyFile || !appleKeyId || !appleIssuerId) {
      return toast.error('Please fill in all Apple Key fields and select a file');
    }
    setUploadingApple(true);
    const formData = new FormData();
    formData.append('keyFile', appleKeyFile);
    formData.append('projectId', selectedRepo.id);
    formData.append('projectName', selectedRepo.name);
    formData.append('apiKeyId', appleKeyId);
    formData.append('apiIssuer', appleIssuerId);
    try {
      const { data } = await api.post('/apple-credentials', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAppleCredsStatus(data.credentials);
      toast.success('App Store Connect credentials saved successfully! 🍎');
      setAppleKeyFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save credentials');
    } finally {
      setUploadingApple(false);
    }
  };

  const handleBuild = async () => {
    if (!selectedRepo || !branch) return toast.error('Select a repo and branch');
    const result = await dispatch(triggerBuild({
      projectId: selectedRepo.id,
      projectName: selectedRepo.name,
      repoUrl: selectedRepo.cloneUrl,
      provider: user.provider,
      branch,
      platform,
      androidFormat: (platform === 'android' || platform === 'both') ? androidFormat : undefined,
      versionName,
      buildNumber: versionCode ? parseInt(versionCode) : undefined,
      buildType,
      releaseNotes,
    }));
    if (triggerBuild.fulfilled.match(result)) {
      toast.success('Build queued! 🚀');
      upsertWorkspace({
        id: String(selectedRepo.id),
        name: selectedRepo.name,
        fullName: selectedRepo.fullName,
        provider: user.provider,
        platform,
        selectedBranch: branch,
        buildFormat: androidFormat,
        buildType,
        credentialType: (platform === 'android' || platform === 'both') && keystoreStatus ? 'android-keystore'
          : (platform === 'ios' || platform === 'both') && appleCredsStatus ? 'ios-credentials'
          : null,
        buildTriggeredAt: new Date().toISOString(),
        workspaceId: result.payload?.id || result.payload?._id || null,
      });
    } else {
      toast.error(result.payload || 'Failed to trigger build');
    }
  };

  // Keystore and Apple Credentials visibility conditional based on selected platform(s)
  const needsKeystore = platform === 'android' || platform === 'both';
  const needsAppleCreds = platform === 'ios' || platform === 'both';

  return (
    <div style={styles.page} className="page-build">
      <header className="page-header">
        <h1 style={styles.title} className="text-lg md:text-xl">New Build</h1>
        <p style={styles.subtitle}>Select your project, branch, and platform to trigger a build via <strong>GitHub Actions</strong>.</p>
      </header>

      <div className="grid-build">
        {/* Step 1 – Repo */}
        <section style={styles.card} className="card-build">
          <div style={styles.stepLabel}><span style={styles.stepNum}>1</span> Select Repository</div>
          <input style={styles.searchInput} placeholder="Search repositories..." value={search}
            onChange={e => setSearch(e.target.value)} />
          <div style={styles.repoList}>
            {loading ? <SkeletonList /> : repos.map(r => (
              <button key={r.id} style={{ ...styles.repoItem, ...(selectedRepo?.id === r.id ? styles.repoActive : {}) }}
                onClick={() => handleRepoSelect(r)}>
                <div style={styles.repoName}>{r.name}</div>
                <div style={styles.repoMeta}>{r.private ? '🔒 Private' : '🌐 Public'} · {r.fullName}</div>
              </button>
            ))}
            {!loading && repos.length === 0 && <p style={styles.empty}>No repositories found</p>}
          </div>
        </section>

        {/* Step 2 – Branch + Platform */}
        <div style={styles.rightCol}>
          <section style={styles.card} className="card-build">
            <div style={styles.stepLabel}><span style={styles.stepNum}>2</span> Branch</div>
            {branchesLoading ? <div style={styles.skeletonBar} /> : (
              <select style={styles.select} value={branch} onChange={e => setBranch(e.target.value)} disabled={!selectedRepo}>
                {branches.map(b => <option key={b.sha} value={b.name}>{b.name}</option>)}
                {!selectedRepo && <option>Select a repo first</option>}
              </select>
            )}
          </section>

          <section style={styles.card} className="card-build">
            <div style={styles.stepLabel}><span style={styles.stepNum}>3</span> Platform</div>
            <div className="platform-grid-build">
              {PLATFORMS.map(p => {
                const isAndroid = p.id === 'android';
                const isIos = p.id === 'ios';
                const isBoth = p.id === 'both';
                return (
                  <button key={p.id} style={{ ...styles.platformBtn, ...(platform === p.id ? { ...styles.platformActive, border: '1px solid ' + p.color, color: p.color } : {}) }}
                    className="platform-btn-build"
                    onClick={() => setPlatform(p.id)}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '32px', color: platform === p.id ? p.color : Colors.textMuted }} className="platform-icon-wrapper-build">
                      {isAndroid && <AndroidIcon size={28} />}
                      {isIos && <IosIcon size={28} />}
                      {isBoth && (
                        <>
                          <AndroidIcon size={22} />
                          <IosIcon size={22} />
                        </>
                      )}
                    </div>
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
            {(platform === 'android' || platform === 'both') && (
              <div style={styles.formatContainer}>
                <div style={styles.formatLabel}>Android Build Format</div>
                <div style={styles.formatGrid}>
                  <button
                    style={{
                      ...styles.formatBtn,
                      ...(androidFormat === 'apk' ? styles.formatActive : {}),
                    }}
                    onClick={() => setAndroidFormat('apk')}
                  >
                    📦 APK (Package)
                  </button>
                  <button
                    style={{
                      ...styles.formatBtn,
                      ...(androidFormat === 'aab' ? styles.formatActive : {}),
                    }}
                    onClick={() => setAndroidFormat('aab')}
                  >
                    🎁 AAB (App Bundle)
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Build Options */}
          {selectedRepo && (
            <section style={styles.card} className="card-build">
              <div style={styles.stepLabel}><span style={styles.stepNum}>4</span> Build Options</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <div>
                  <label style={{ ...styles.formatLabel, marginBottom: '8px', display: 'block' }}>Build Profile / Type</label>
                  <div style={styles.formatGrid}>
                    <button
                      style={{
                        ...styles.formatBtn,
                        ...(buildType === 'testing' ? styles.formatActive : {}),
                        ...(buildType === 'testing' ? { border: '1px solid ' + Colors.primary, color: Colors.primary, background: Colors.primaryBg } : {})
                      }}
                      onClick={() => setBuildType('testing')}
                    >
                      🧪 Testing
                    </button>
                    <button
                      style={{
                        ...styles.formatBtn,
                        ...(buildType === 'uat' ? styles.formatActive : {}),
                        ...(buildType === 'uat' ? { border: '1px solid ' + Colors.warning, color: Colors.warning, background: Colors.warningBg } : {})
                      }}
                      onClick={() => setBuildType('uat')}
                    >
                      📋 UAT Release
                    </button>
                    <button
                      style={{
                        ...styles.formatBtn,
                        ...(buildType === 'production' ? styles.formatActive : {}),
                        ...(buildType === 'production' ? { border: '1px solid ' + Colors.success, color: Colors.success, background: Colors.successBg } : {})
                      }}
                      onClick={() => setBuildType('production')}
                    >
                      🚀 Production Release
                    </button>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: Colors.textMuted, marginTop: '10px', lineHeight: '1.5' }}>
                    {buildType === 'testing' && (
                      <span>🧪 <strong>Testing Profile:</strong> Triggers a <strong>GitHub Actions</strong> workflow on your repository. Builds the APK/AAB in the cloud and streams results back in real-time.</span>
                    )}
                    {buildType === 'uat' && (
                      <span>📋 <strong>UAT Profile:</strong> Compiles a UAT-signed binary, uploads it to S3, and flags it ready for User Acceptance Testing environments.</span>
                    )}
                    {buildType === 'production' && (
                      <span>🚀 <strong>Production Profile:</strong> Compiles a production-ready signed binary and hosts it on AWS S3 for final deployment.</span>
                    )}
                  </p>
                </div>

                {(platform === 'android' || platform === 'both') && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                    <div>
                      <label style={{ ...styles.formatLabel, marginBottom: '8px', display: 'block' }}>Version Name</label>
                      <input
                        type="text"
                        value={versionName}
                        onChange={(e) => setVersionName(e.target.value)}
                        placeholder="e.g. 1.0.0"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: `1px solid ${Colors.border || '#333'}`,
                          borderRadius: 'var(--radius-md)',
                          background: Colors.surface2 || '#111',
                          color: Colors.text,
                          fontSize: 'var(--text-sm)',
                          outline: 'none',
                          boxSizing: 'border-box',
                          transition: 'border-color var(--transition)'
                        }}
                        onFocus={(e) => e.target.style.borderColor = Colors.primary}
                        onBlur={(e) => e.target.style.borderColor = Colors.border || '#333'}
                      />
                      <p style={{ fontSize: 'var(--text-xs)', color: Colors.textMuted, marginTop: '6px' }}>
                        User-facing version on store (e.g. 1.0.0).
                      </p>
                    </div>

                    <div>
                      <label style={{ ...styles.formatLabel, marginBottom: '8px', display: 'block' }}>Version Code (Optional)</label>
                      <input
                        type="number"
                        value={versionCode}
                        onChange={(e) => setVersionCode(e.target.value)}
                        placeholder="Auto-incremented"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: `1px solid ${Colors.border || '#333'}`,
                          borderRadius: 'var(--radius-md)',
                          background: Colors.surface2 || '#111',
                          color: Colors.text,
                          fontSize: 'var(--text-sm)',
                          outline: 'none',
                          boxSizing: 'border-box',
                          transition: 'border-color var(--transition)'
                        }}
                        onFocus={(e) => e.target.style.borderColor = Colors.primary}
                        onBlur={(e) => e.target.style.borderColor = Colors.border || '#333'}
                      />
                      <p style={{ fontSize: 'var(--text-xs)', color: Colors.textMuted, marginTop: '6px' }}>
                        Integer version code. Leave blank to auto-increment sequentially.
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '16px' }}>
                  <label style={{ ...styles.formatLabel, marginBottom: '8px', display: 'block' }}>Release Notes (UAT & Production)</label>
                  <textarea
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    placeholder="Describe what's new in this build (e.g. bug fixes, new features)..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${Colors.border || '#333'}`,
                      borderRadius: 'var(--radius-md)',
                      background: Colors.surface2 || '#111',
                      color: Colors.text,
                      fontSize: 'var(--text-sm)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      transition: 'border-color var(--transition)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = Colors.primary}
                    onBlur={(e) => e.target.style.borderColor = Colors.border || '#333'}
                  />
                  <p style={{ fontSize: 'var(--text-xs)', color: Colors.textMuted, marginTop: '6px' }}>
                    These notes will be published to Google Play (Android) and TestFlight (iOS) for UAT & Production releases.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Keystore */}
          {selectedRepo && needsKeystore && (
            <section style={styles.card} className="card-build">
              <div style={styles.stepLabel}><span style={styles.stepNum}>5</span> Android Keystore</div>
              {keystoreStatus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  <div style={styles.ksFound}>
                    <span>✅ Keystore on file: <strong>{keystoreStatus.filename}</strong></span>
                    <button style={styles.ksReplace} onClick={() => setKeystoreStatus(null)}>Replace</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  {/* Keystore Mode Toggle */}
                  <div style={{ display: 'flex', border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-md)', background: Colors.surface2, padding: '4px', gap: '4px' }}>
                    <button 
                      style={{ flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-sm)', background: keystoreMode === 'upload' ? Colors.surface : 'transparent', color: keystoreMode === 'upload' ? Colors.text : Colors.textMuted, fontSize: 'var(--text-xs)', ...Fonts.SemiBold, cursor: 'pointer', transition: 'all var(--transition)' }} 
                      onClick={() => setKeystoreMode('upload')}>
                      📂 Upload Keystore
                    </button>
                    <button 
                      style={{ flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-sm)', background: keystoreMode === 'generate' ? Colors.surface : 'transparent', color: keystoreMode === 'generate' ? Colors.text : Colors.textMuted, fontSize: 'var(--text-xs)', ...Fonts.SemiBold, cursor: 'pointer', transition: 'all var(--transition)' }} 
                      onClick={() => setKeystoreMode('generate')}>
                      ⚡ Generate New Keystore
                    </button>
                  </div>

                  <form onSubmit={e => e.preventDefault()} style={styles.ksForm}>
                    {keystoreMode === 'upload' ? (
                      <label style={styles.fileLabel}>
                        <input type="file" accept=".jks,.keystore" style={{ display: 'none' }}
                          onChange={e => setKeystoreFile(e.target.files[0])} />
                        {keystoreFile ? `📎 ${keystoreFile.name}` : '+ Upload .jks / .keystore file'}
                      </label>
                    ) : (
                      <div style={{ padding: 'var(--space-3)', border: `1px dashed ${Colors.primary}44`, background: Colors.primaryBg, borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: Colors.textMuted, lineHeight: '1.4' }}>
                        ⚡ <strong>Zero Configuration Generation:</strong> We will execute <code>keytool</code> directly on your host machine to compile and sign your application dynamically.
                      </div>
                    )}
                    
                    <input style={styles.input} placeholder="Key alias" value={keystoreAlias} onChange={e => setKeystoreAlias(e.target.value)} />
                    <input style={styles.input} type="password" placeholder="Keystore password" value={keystorePass} onChange={e => setKeystorePass(e.target.value)} />
                    <input style={styles.input} type="password" placeholder="Key password" value={keyPass} onChange={e => setKeyPass(e.target.value)} />

                    <button style={styles.uploadBtn} onClick={handleSaveKeystore} disabled={uploadingKS}>
                      {uploadingKS 
                        ? (keystoreMode === 'upload' ? 'Uploading...' : 'Generating...') 
                        : (keystoreMode === 'upload' ? 'Save Config & Keystore' : 'Generate & Save Keystore')
                      }
                    </button>
                  </form>
                </div>
              )}
            </section>
          )}

          {/* iOS Credentials */}
          {selectedRepo && needsAppleCreds && (
            <section style={styles.card} className="card-build">
              <div style={styles.stepLabel}><span style={styles.stepNum}>5</span> App Store Connect Credentials</div>
              {appleCredsStatus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  <div style={styles.ksFound}>
                    <span>✅ Credentials on file: Key ID <strong>{appleCredsStatus.apiKeyId}</strong> ({appleCredsStatus.filename})</span>
                    <button style={styles.ksReplace} onClick={() => setAppleCredsStatus(null)}>Replace</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={e => e.preventDefault()} style={styles.ksForm}>
                  <label style={styles.fileLabel}>
                    <input type="file" accept=".p8" style={{ display: 'none' }}
                      onChange={e => setAppleKeyFile(e.target.files[0])} />
                    {appleKeyFile ? `📎 ${appleKeyFile.name}` : '+ Upload AuthKey_xxx.p8 key file'}
                  </label>
                  <input style={styles.input} placeholder="Apple API Key ID (e.g. 2GZN4HH9K8)" value={appleKeyId} onChange={e => setAppleKeyId(e.target.value)} />
                  <input style={styles.input} placeholder="Apple API Issuer ID" value={appleIssuerId} onChange={e => setAppleIssuerId(e.target.value)} />

                  <button style={styles.uploadBtn} onClick={handleSaveAppleCredentials} disabled={uploadingApple}>
                    {uploadingApple ? 'Saving...' : 'Save iOS Credentials'}
                  </button>
                </form>
              )}
            </section>
          )}

          {/* Build Button */}
          <button style={{ ...styles.buildBtn, ...(triggerLoading ? styles.buildBtnLoading : {}) }}
            className="build-btn-build"
            onClick={handleBuild} disabled={!selectedRepo || !branch || triggerLoading}>
            {triggerLoading ? '⏳ Queuing Build...' : '⚡ Trigger Build'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return Array.from({ length: 5 }).map((_, i) => (
    <div key={i} style={{ height: 56, borderRadius: 8, background: Colors.surface2, marginBottom: 8, animation: 'shimmer 1.5s ease infinite', backgroundSize: '200% 100%', backgroundImage: `linear-gradient(90deg, ${Colors.surface2} 25%, ${Colors.surface3} 50%, ${Colors.surface2} 75%)` }} />
  ));
}

function getStyles() {
  return {
    page: { maxWidth: 1100, margin: '0 auto' },
    title: { ...Fonts.ExtraBold, color: Colors.text, marginBottom: 'var(--space-2)' },
    subtitle: { color: Colors.textMuted, fontSize: 'var(--text-sm)' },
    card: { background: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' },
    stepLabel: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', ...Fonts.SemiBold, fontSize: 'var(--text-sm)', color: Colors.text, marginBottom: 'var(--space-4)' },
    stepNum: { width: 24, height: 24, borderRadius: 'var(--radius-full)', background: Colors.primary, color: Colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', ...Fonts.Bold },
    searchInput: { width: '100%', padding: 'var(--space-2) var(--space-3)', background: Colors.surface2, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-md)', color: Colors.text, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' },
    repoList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 340, overflow: 'auto' },
    repoItem: { padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: `1px solid ${Colors.border}`, background: Colors.surface2, textAlign: 'left', transition: 'all var(--transition)', width: '100%' },
    repoActive: { border: '1px solid ' + Colors.primary, background: Colors.primaryBg },
    repoName: { ...Fonts.SemiBold, fontSize: 'var(--text-sm)', color: Colors.text, marginBottom: 'var(--space-1)' },
    repoMeta: { fontSize: 'var(--text-xs)', color: Colors.textMuted },
    empty: { color: Colors.textFaint, fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-8)' },
    rightCol: { display: 'flex', flexDirection: 'column' },
    select: { width: '100%', padding: 'var(--space-2) var(--space-3)', background: Colors.surface2, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-md)', color: Colors.text, fontSize: 'var(--text-sm)' },
    skeletonBar: { height: 40, borderRadius: 8, background: Colors.surface2, animation: 'shimmer 1.5s ease infinite' },
    platformBtn: { display: 'flex', gap: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: `1px solid ${Colors.border}`, background: Colors.surface2, color: Colors.textMuted, fontSize: 'var(--text-sm)', ...Fonts.Medium, transition: 'all var(--transition)' },
    platformActive: { background: Colors.primaryBg },
    formatContainer: { marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: `1px solid ${Colors.border}`, animation: 'fadeIn 0.3s ease' },
    formatLabel: { fontSize: 'var(--text-xs)', ...Fonts.SemiBold, color: Colors.textMuted, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    formatGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' },
    formatBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', padding: 'var(--space-2.5) var(--space-4)', borderRadius: 'var(--radius-md)', border: `1px solid ${Colors.border}`, background: Colors.surface2, color: Colors.textMuted, fontSize: 'var(--text-sm)', ...Fonts.Medium, transition: 'all var(--transition)', cursor: 'pointer' },
    formatActive: { border: '1px solid ' + Colors.android, color: Colors.android, background: Colors.androidBg },
    ksFound: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: Colors.successBg, borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: Colors.success },
    ksReplace: { fontSize: 'var(--text-xs)', color: Colors.textMuted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' },
    ksForm: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' },
    fileLabel: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)', border: `2px dashed ${Colors.border}`, borderRadius: 'var(--radius-md)', color: Colors.textMuted, fontSize: 'var(--text-sm)', cursor: 'pointer' },
    input: { padding: 'var(--space-2) var(--space-3)', background: Colors.surface2, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-md)', color: Colors.text, fontSize: 'var(--text-sm)' },
    uploadBtn: { padding: 'var(--space-2) var(--space-4)', background: Colors.surface3, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-md)', color: Colors.text, fontSize: 'var(--text-sm)', ...Fonts.SemiBold, cursor: 'pointer' },
    buildBtn: { padding: 'var(--space-4)', background: Colors.primary, color: Colors.white, borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-base)', ...Fonts.Bold, border: 'none', cursor: 'pointer', textAlign: 'center', marginTop: 'auto', transition: 'all var(--transition)', letterSpacing: '0.02em' },
    buildBtnLoading: { opacity: 0.7, cursor: 'not-allowed' },
  };
}