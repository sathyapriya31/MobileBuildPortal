import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchRepos, fetchBranches, selectRepo } from '../store/slices/reposSlice.js';
import { triggerBuild } from '../store/slices/buildsSlice.js';
import { api } from '../services/api.js';
import Colors from '../config/colors.js';

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

const LockIcon = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#9aa4b2">
    <path d="M18 11H16V7c0-2.21-1.79-4-4-4S8 4.79 8 7v4H6c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zm-6 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-6H8.9V7c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v4z" />
  </svg>
);

const GlobeIcon = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#9aa4b2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

const CheckCircleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="11" fill="white" stroke="#0F4CB5" strokeWidth="1.5" />
    <path d="M7.5 12.5l3 3 6-7" stroke="#0F4CB5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PerformanceIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#7b8794">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
  </svg>
);

const DebugIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#7b8794">
    <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z" />
  </svg>
);

function ToggleSwitch({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: '34px',
        height: '18px',
        background: on ? '#0b78d0' : '#d5dbe3',
        borderRadius: '20px',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 180ms ease',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '2px',
        left: on ? '16px' : '2px',
        width: '14px',
        height: '14px',
        background: 'white',
        borderRadius: '50%',
        transition: 'left 180ms ease',
      }} />
    </div>
  );
}

const PLATFORMS = [
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iOS' },
];

const BUILD_TYPES = [
  {
    id: 'testing',
    label: 'Testing',
    description: 'Triggers a GitHub Actions workflow on your repository. Builds the APK/AAB in the cloud and streams results back in real-time.',
  },
  {
    id: 'uat',
    label: 'UAT Release',
    description: 'Builds a UAT release candidate for user acceptance testing. Deploys to internal test tracks for stakeholder review.',
  },
  {
    id: 'production',
    label: 'Production Release',
    description: 'Builds a signed production release ready for app store submission or enterprise distribution.',
  },
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
  const [iosFormat, setIosFormat] = useState('adhoc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [keystoreStatus, setKeystoreStatus] = useState(null);
  const [keystoreFile, setKeystoreFile] = useState(null);
  const [keystoreAlias, setKeystoreAlias] = useState('');
  const [keystorePass, setKeystorePass] = useState('');
  const [keyPass, setKeyPass] = useState('');
  const [uploadingKS, setUploadingKS] = useState(false);
  const [keystoreMode, setKeystoreMode] = useState('upload');
  const [versionName, setVersionName] = useState('1.0.0');
  const [buildType, setBuildType] = useState('testing');
  const [appleKeyFile, setAppleKeyFile] = useState(null);
  const [appleKeyId, setAppleKeyId] = useState('');
  const [appleIssuerId, setAppleIssuerId] = useState('');
  const [appleCredsStatus, setAppleCredsStatus] = useState(null);
  const [uploadingApple, setUploadingApple] = useState(false);
  const [buildNumber, setBuildNumber] = useState('1');
  const [perfMonitoring, setPerfMonitoring] = useState(false);
  const [debugMode, setDebugMode] = useState(true);
  const [playKeyFile, setPlayKeyFile] = useState(null);
  const [uploadingPlay, setUploadingPlay] = useState(false);
  const [playCredMode, setPlayCredMode] = useState('upload');
  const [playSaveSuccess, setPlaySaveSuccess] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('Initial UAT Release');
  // Upload mode fields
  const [uploadKeyAlias, setUploadKeyAlias] = useState('');
  const [uploadKeystorePass, setUploadKeystorePass] = useState('');
  const [uploadKeyPass, setUploadKeyPass] = useState('');
  // Generate mode fields
  const [genKeyAlias, setGenKeyAlias] = useState('');
  const [genKeystorePass, setGenKeystorePass] = useState('');
  const [genKeyPass, setGenKeyPass] = useState('');
  const [genCredsSaved, setGenCredsSaved] = useState(false);
  const p8InputRef = useRef(null);
  const playP8InputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (user) dispatch(fetchRepos({ provider: user.provider, search: debouncedSearch }));
  }, [user, debouncedSearch]);

  // Handles returning to the page when selectedRepo is already set in store
  useEffect(() => {
    if (selectedRepo) {
      const [owner, repo] = selectedRepo.fullName.split('/');
      dispatch(fetchBranches({ provider: user.provider, owner, repo, projectId: selectedRepo.id }));
      api.get(`/keystores/${selectedRepo.id}`).then(({ data }) => {
        setKeystoreStatus(data.keystore);
        if (data.keystore) {
          const id = selectedRepo.id;
          if (sessionStorage.getItem(`mbp_upload_ok_${id}`)) setPlaySaveSuccess(true);
          else if (sessionStorage.getItem(`mbp_gen_ok_${id}`)) { setGenCredsSaved(true); setPlayCredMode('generate'); }
        }
      });
      api.get(`/apple-credentials/${selectedRepo.id}`).then(({ data }) => setAppleCredsStatus(data.credentials));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (branches.length) setBranch(branches[0].name);
  }, [branches]);


  useEffect(() => {
    if (buildType === 'uat' || buildType === 'production') {
      setAndroidFormat('aab');
    }
  }, [buildType, platform]);

  const handleRepoSelect = (repo) => {
    dispatch(selectRepo(repo));
    setBranch('');
    const [owner, repoName] = repo.fullName.split('/');
    dispatch(fetchBranches({ provider: user.provider, owner, repo: repoName, projectId: repo.id }));
    api.get(`/keystores/${repo.id}`).then(({ data }) => setKeystoreStatus(data.keystore));
    api.get(`/apple-credentials/${repo.id}`).then(({ data }) => setAppleCredsStatus(data.credentials));
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
          keyPassword: keyPass,
        });
        setKeystoreStatus(data.keystore);
        toast.success('Keystore generated dynamically!');
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
      toast.success('App Store Connect credentials saved successfully!');
      setAppleKeyFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save credentials');
    } finally {
      setUploadingApple(false);
    }
  };

  const handleSavePlayCredentials = async () => {
    if (!selectedRepo) return toast.error('Please select a repository first');

    if (playCredMode === 'upload') {
      if (!playKeyFile) return toast.error('Please select a .jks or .keystore file');
      const ext = playKeyFile.name.split('.').pop().toLowerCase();
      if (ext !== 'jks' && ext !== 'keystore') {
        return toast.error('Only .jks and .keystore files are supported.');
      }
      if (!uploadKeyAlias || !uploadKeystorePass || !uploadKeyPass) {
        return toast.error('Please fill in Key Alias, Keystore Password, and Key Password');
      }
      setUploadingPlay(true);
      const formData = new FormData();
      formData.append('keystore', playKeyFile);
      formData.append('projectId', selectedRepo.id);
      formData.append('projectName', selectedRepo.name);
      formData.append('provider', user.provider);
      formData.append('keystoreAlias', uploadKeyAlias);
      formData.append('keystorePassword', uploadKeystorePass);
      formData.append('keyPassword', uploadKeyPass);
      try {
        const { data } = await api.post('/keystores', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setKeystoreStatus(data.keystore);
        setPlayKeyFile(null);
        setPlaySaveSuccess(true);
        sessionStorage.setItem(`mbp_upload_ok_${selectedRepo.id}`, '1');
        sessionStorage.removeItem(`mbp_gen_ok_${selectedRepo.id}`);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to save credentials');
      } finally {
        setUploadingPlay(false);
      }
    } else {
      if (!genKeyAlias || !genKeystorePass || !genKeyPass) {
        return toast.error('Fill key alias, keystore password, and key password');
      }
      setUploadingPlay(true);
      try {
        const { data } = await api.post('/keystores/generate', {
          projectId: selectedRepo.id,
          projectName: selectedRepo.name,
          provider: user.provider,
          keystoreAlias: genKeyAlias,
          keystorePassword: genKeystorePass,
          keyPassword: genKeyPass,
        });
        setKeystoreStatus(data.keystore);
        setGenCredsSaved(true);
        sessionStorage.setItem(`mbp_gen_ok_${selectedRepo.id}`, '1');
        sessionStorage.removeItem(`mbp_upload_ok_${selectedRepo.id}`);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to generate credentials');
      } finally {
        setUploadingPlay(false);
      }
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
      androidFormat: platform === 'android' ? androidFormat : undefined,
      iosFormat: platform === 'ios' ? iosFormat : undefined,
      versionName,
      buildType,
    }));
    if (triggerBuild.fulfilled.match(result)) {
      toast.success('Build queued!');
    } else {
      toast.error(result.payload || 'Failed to trigger build');
    }
  };

  const needsKeystore = false;
  const needsAppleCreds = platform === 'ios';

  return (
    <div style={styles.page} className="page-build">
      <header className="page-header">
        <h1 style={styles.title} className="build-page-title">New Build</h1>
        <p style={styles.subtitle} className="build-page-subtitle">
          Select your project, branch, and platform to trigger a build via <strong>GitHub Actions</strong>.
        </p>
      </header>

      <div className="grid-build">
        {/* Step 1 – Repository */}
        <section style={styles.card} className="card-build">
          <div style={styles.stepLabel}>
            <span style={styles.stepNum}>1</span>
            Select Repository
          </div>

          <div style={styles.searchWrapper}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa4b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              style={styles.searchInput}
              className="repo-search-input"
              placeholder="Search repositories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={styles.repoList} className="repo-list-scroll">
            {loading ? (
              <SkeletonList />
            ) : (
              repos.map(r => {
                const isSelected = selectedRepo?.id === r.id;
                return (
                  <button
                    key={r.id}
                    style={{ ...styles.repoItem, ...(isSelected ? styles.repoActive : {}) }}
                    onClick={() => handleRepoSelect(r)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                      <div style={isSelected ? { ...styles.repoIconBox, ...styles.repoIconBoxSelected } : styles.repoIconBox}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isSelected ? 'white' : '#9aa5b5'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                      </div>

                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={styles.repoName}>{r.name}</div>
                        <div style={styles.repoMeta}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            {r.private ? <LockIcon /> : <GlobeIcon />}
                            {r.private ? 'Private' : 'Public'}
                          </span>
                          <span style={{ margin: '0 3px' }}>·</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.fullName}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <span style={{ marginLeft: '6px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                          <CheckCircleIcon size={18} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
            {!loading && repos.length === 0 && (
              <p style={styles.empty}>No repositories found</p>
            )}
          </div>
        </section>

        {/* Right column */}
        <div style={styles.rightCol}>
          {/* Step 2 – Branch */}
          <section style={styles.card} className="card-build">
            <div style={styles.stepLabel}>
              <span style={styles.stepNum}>2</span>
              Branch
            </div>
            {branchesLoading ? (
              <div style={styles.skeletonBar} />
            ) : (
              <div style={styles.selectWrapper}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <line x1="6" y1="3" x2="6" y2="15" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="M18 9a9 9 0 0 1-9 9" />
                </svg>
                <select
                  style={styles.select}
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  disabled={!selectedRepo}
                >
                  {branches.map(b => <option key={b.sha} value={b.name}>{b.name}</option>)}
                  {!selectedRepo && <option>Select a repo first</option>}
                </select>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            )}
          </section>

          {/* Step 3 – Platform */}
          <section style={styles.card} className="card-build">
            <div style={styles.stepLabel}>
              <span style={styles.stepNum}>3</span>
              Platform
            </div>

            <div className="platform-grid-build">
              {PLATFORMS.map(p => {
                const isAndroid = p.id === 'android';
                const isIos = p.id === 'ios';
                const isSelected = platform === p.id;

                let activeStyle = {};
                let iconColor = '#3a4658';
                let labelColor = '#3a4658';

                if (isSelected) {
                  activeStyle = { background: '#ffffff', border: '2px solid #0f4cb5' };
                  iconColor = '#0f4cb5';
                  labelColor = '#0f4cb5';
                }

                return (
                  <button
                    key={p.id}
                    style={{ ...styles.platformBtn, ...activeStyle }}
                    className="platform-btn-build"
                    onClick={() => setPlatform(p.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: iconColor, marginBottom: '4px' }}>
                      {isAndroid && <AndroidIcon size={14} style={{ color: iconColor }} />}
                      {isIos && <IosIcon size={14} style={{ color: iconColor }} />}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: labelColor, fontFamily: 'Google Sans' }}>
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {platform === 'android' && (
              <div style={styles.formatContainer}>
                <div style={styles.formatLabel}>ANDROID BUILD FORMAT</div>
                <div style={styles.formatGrid}>
                  {(() => {
                    const apkDisabled = buildType === 'uat' || buildType === 'production';
                    return (
                      <button
                        style={{
                          ...styles.formatBtn,
                          ...(androidFormat === 'apk' && !apkDisabled ? styles.apkFormatActive : {}),
                          ...(apkDisabled ? styles.formatBtnDisabled : {}),
                        }}
                        onClick={() => setAndroidFormat('apk')}
                        disabled={apkDisabled}
                        title={apkDisabled ? 'APK is not available for UAT Release and Production Release builds' : undefined}
                        aria-disabled={apkDisabled}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6-4H6V4h12v12z" />
                        </svg>
                        APK (Package)
                      </button>
                    );
                  })()}
                  <button
                    style={{ ...styles.formatBtn, ...(androidFormat === 'aab' ? styles.apkFormatActive : {}) }}
                    onClick={() => setAndroidFormat('aab')}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1z" />
                    </svg>
                    AAB (App Bundle)
                  </button>
                </div>
              </div>
            )}

          </section>

          {/* Step 4 – Build Profile / Type */}
          <section style={styles.card} className="card-build">
            <div style={styles.stepLabel}>
              <span style={styles.stepNum}>4</span>
              Build Options
            </div>

            <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#7b8794', marginBottom: '12px', fontFamily: 'Google Sans' }}>
              BUILD PROFILE / TYPE
            </div>

            <div className="build-type-grid">
              {BUILD_TYPES.map(bt => {
                const isActive = buildType === bt.id;
                return (
                  <button
                    key={bt.id}
                    className={`build-type-card${isActive ? ' build-type-card--active' : ''}`}
                    onClick={() => setBuildType(bt.id)}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{bt.icon}</span>
                    <span className="build-type-card-label">{bt.label}</span>
                  </button>
                );
              })}
            </div>

            {(() => {
              const active = BUILD_TYPES.find(bt => bt.id === buildType);
              if (!active) return null;
              return (
                <div style={{ marginTop: '14px', padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', fontFamily: 'Google Sans', marginBottom: '4px' }}>
                    {active.label} Profile
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', fontFamily: 'Google Sans' }}>
                    {active.description}
                  </div>
                </div>
              );
            })()}

            {buildType === 'uat' && (
              <>
                <div style={styles.optionsDivider} />

                <div className="version-info-grid">
                  {/* Version Code */}
                  <div>
                    <div style={styles.versionLabel}>VERSION CODE</div>
                    <input
                      type="number"
                      min="1"
                      style={styles.versionInput}
                      className="version-field-input"
                      value={buildNumber}
                      onChange={e => setBuildNumber(e.target.value)}
                      aria-label="Version Code"
                    />
                    <p style={styles.versionHelperText}>
                      Internal positive integer used to identify this build on Google Play. Auto-increment is removed.
                    </p>
                  </div>

                  {/* Version Name */}
                  <div>
                    <div style={styles.versionLabel}>VERSION NAME</div>
                    <input
                      type="text"
                      style={styles.versionInput}
                      className="version-field-input"
                      value={versionName}
                      onChange={e => setVersionName(e.target.value)}
                      aria-label="Version Name"
                    />
                    <p style={styles.versionHelperText}>
                      The user-facing version string shown to users on their devices.
                    </p>
                  </div>
                </div>

                <div style={styles.optionsDivider} />

                <div>
                  <div style={styles.versionLabel}>PLAY STORE RELEASE NOTES</div>
                  <textarea
                    style={styles.releaseNotesTextarea}
                    className="release-notes-textarea"
                    value={releaseNotes}
                    onChange={e => setReleaseNotes(e.target.value)}
                    aria-label="Play Store Release Notes"
                  />
                </div>
              </>
            )}
          </section>

          {/* Step 5 – Play Store Connect Credentials (Android only) */}
          {platform === 'android' && (
            <section style={styles.psCard} className="ps-creds-card">

              {/* Header */}
              <div style={styles.psHeader}>
                <span style={styles.psBadge}>5</span>
                <span style={styles.psTitle}>Play Store Connect Credentials</span>
              </div>


              {/* Segmented Control */}
              <div style={styles.psSegmentedControl} className="ps-segmented-responsive">
                <button
                  type="button"
                  style={{ ...styles.psSegTab, ...(playCredMode === 'upload' ? styles.psSegTabActive : styles.psSegTabInactive) }}
                  onClick={() => { setPlayCredMode('upload'); setGenKeyAlias(''); setGenKeystorePass(''); setGenKeyPass(''); setUploadKeyAlias(''); setUploadKeystorePass(''); setUploadKeyPass(''); setPlayKeyFile(null); if (playP8InputRef.current) playP8InputRef.current.value = ''; }}
                  aria-pressed={playCredMode === 'upload'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                  </svg>
                  Upload Credentials
                </button>
                <button
                  type="button"
                  style={{ ...styles.psSegTab, ...(playCredMode === 'generate' ? styles.psSegTabActive : styles.psSegTabInactive) }}
                  onClick={() => { setPlayCredMode('generate'); setPlayKeyFile(null); if (playP8InputRef.current) playP8InputRef.current.value = ''; setUploadKeyAlias(''); setUploadKeystorePass(''); setUploadKeyPass(''); setGenKeyAlias(''); setGenKeystorePass(''); setGenKeyPass(''); }}
                  aria-pressed={playCredMode === 'generate'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                  Generate New Credentials
                </button>
              </div>

              {/* Hidden file input — shared between modes */}
              <input
                ref={playP8InputRef}
                id="play-p8-file-input"
                type="file"
                accept=".jks,.keystore"
                style={{ display: 'none' }}
                onChange={e => setPlayKeyFile(e.target.files[0] || null)}
                aria-label="Upload JKS or Keystore file"
              />

              {/* ── Upload Credentials View ── */}
              {playCredMode === 'upload' && (
                <>
                  {playSaveSuccess ? (
                    <div style={styles.psSuccessBanner}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="12" fill="#16A34A" />
                        <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={styles.psSuccessText}>Successfully Saved Credentials</span>
                      <button
                        type="button"
                        style={styles.psReplaceLink}
                        onClick={() => { setPlaySaveSuccess(false); sessionStorage.removeItem(`mbp_upload_ok_${selectedRepo.id}`); setUploadKeyAlias(''); setUploadKeystorePass(''); setUploadKeyPass(''); setPlayKeyFile(null); if (playP8InputRef.current) playP8InputRef.current.value = ''; }}
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        style={styles.psUploadArea}
                        className="play-upload-area"
                        onClick={() => playP8InputRef.current.click()}
                        aria-label="Upload JKS or Keystore file"
                      >
                        <span style={styles.psUploadText}>
                          {playKeyFile ? playKeyFile.name : '+ Upload .jks / .keystore File'}
                        </span>
                      </button>

                      <input
                        type="text"
                        style={styles.psInput}
                        className="play-creds-input"
                        placeholder="Key Alias"
                        value={uploadKeyAlias}
                        onChange={e => setUploadKeyAlias(e.target.value)}
                        aria-label="Key Alias"
                      />
                      <input
                        type="text"
                        style={styles.psInput}
                        className="play-creds-input"
                        placeholder="Keystore Password"
                        value={uploadKeystorePass}
                        onChange={e => setUploadKeystorePass(e.target.value)}
                        aria-label="Keystore Password"
                      />
                      <input
                        type="text"
                        style={{ ...styles.psInput, marginBottom: '20px' }}
                        className="play-creds-input"
                        placeholder="Key Password"
                        value={uploadKeyPass}
                        onChange={e => setUploadKeyPass(e.target.value)}
                        aria-label="Key Password"
                      />

                      <button
                        type="button"
                        style={{
                          ...styles.psSaveBtn,
                          ...(uploadingPlay ? { opacity: 0.65, cursor: 'not-allowed' } : {}),
                        }}
                        className="play-save-btn"
                        onClick={handleSavePlayCredentials}
                        disabled={uploadingPlay}
                        aria-label="Save Play Store Credentials"
                      >
                        {uploadingPlay ? 'Saving…' : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                              <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                            </svg>
                            Save Config &amp; Credentials
                          </>
                        )}
                      </button>
                    </>
                  )}
                </>
              )}

              {/* ── Generate New Credentials View ── */}
              {playCredMode === 'generate' && (
                <>
                  {genCredsSaved ? (
                    <div style={styles.psSuccessBanner}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="12" fill="#16A34A" />
                        <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={styles.psSuccessText}>Successfully Generated &amp; Saved Credentials</span>
                      <button
                        type="button"
                        style={styles.psReplaceLink}
                        onClick={() => { setGenCredsSaved(false); sessionStorage.removeItem(`mbp_gen_ok_${selectedRepo.id}`); setGenKeyAlias(''); setGenKeystorePass(''); setGenKeyPass(''); setPlayCredMode('upload'); setPlaySaveSuccess(false); setUploadKeyAlias(''); setUploadKeystorePass(''); setUploadKeyPass(''); setPlayKeyFile(null); if (playP8InputRef.current) playP8InputRef.current.value = ''; }}
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        style={styles.psInput}
                        className="play-creds-input"
                        placeholder="Key Alias"
                        value={genKeyAlias}
                        onChange={e => setGenKeyAlias(e.target.value)}
                        aria-label="Key alias"
                      />
                      <input
                        type="text"
                        style={styles.psInput}
                        className="play-creds-input"
                        placeholder="Keystore Password"
                        value={genKeystorePass}
                        onChange={e => setGenKeystorePass(e.target.value)}
                        aria-label="Keystore Password"
                      />
                      <input
                        type="text"
                        style={{ ...styles.psInput, marginBottom: '20px' }}
                        className="play-creds-input"
                        placeholder="Key Password"
                        value={genKeyPass}
                        onChange={e => setGenKeyPass(e.target.value)}
                        aria-label="Key Password"
                      />

                      <button
                        type="button"
                        style={{
                          ...styles.psSaveBtn,
                          ...(uploadingPlay ? { opacity: 0.65, cursor: 'not-allowed' } : {}),
                        }}
                        className="play-save-btn"
                        onClick={handleSavePlayCredentials}
                        disabled={uploadingPlay}
                        aria-label="Generate and Save Play Store Credentials"
                      >
                        {uploadingPlay ? 'Generating…' : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                              <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                            </svg>
                            Generate &amp; Save Credentials
                          </>
                        )}
                      </button>
                    </>
                  )}
                </>
              )}

            </section>
          )}

           {/* Step 5 – App Store Connect Credentials (iOS only) */}
          {platform === 'ios' && (
            <section style={styles.appleCredsCard} className="card-build">
              <div style={styles.stepLabel}>
                <span style={styles.stepNum}>6</span>
                App Store Connect Credentials
              </div>

              {/* Upload area */}
              <input
                ref={p8InputRef}
                id="p8-file-input"
                type="file"
                accept=".p8"
                style={{ display: 'none' }}
                onChange={e => setAppleKeyFile(e.target.files[0] || null)}
                aria-label="Upload AuthKey p8 key file"
              />
              <button
                type="button"
                style={styles.appleUploadArea}
                className="apple-upload-area"
                onClick={() => p8InputRef.current.click()}
                aria-label="Upload AuthKey p8 key file"
              >
                <span style={styles.appleUploadText}>
                  {appleKeyFile ? appleKeyFile.name : '+ Upload AuthKey_xxx.p8 key file'}
                </span>
              </button>

              {/* API Key ID */}
              <input
                type="text"
                style={styles.appleInput}
                className="apple-input"
                placeholder="Apple API Key ID (e.g. 2GZN4HH9K8)"
                value={appleKeyId}
                onChange={e => setAppleKeyId(e.target.value)}
                aria-label="Apple API Key ID"
              />

              {/* Issuer ID */}
              <input
                type="text"
                style={{ ...styles.appleInput, marginBottom: '10px' }}
                className="apple-input"
                placeholder="Apple API Issuer ID"
                value={appleIssuerId}
                onChange={e => setAppleIssuerId(e.target.value)}
                aria-label="Apple API Issuer ID"
              />

              {/* Save button */}
              <button
                type="button"
                style={{
                  ...styles.appleSaveBtn,
                  ...(uploadingApple ? { opacity: 0.65, cursor: 'not-allowed' } : {}),
                }}
                className="apple-save-btn"
                onClick={handleSaveAppleCredentials}
                disabled={uploadingApple}
                aria-label="Save iOS Credentials"
              >
                {uploadingApple ? 'Saving…' : 'Save iOS Credentials'}
              </button>
            </section>
          )}

          {/* Trigger Build */}
          <button
            style={{
              ...styles.buildBtn,
              ...(triggerLoading ? styles.buildBtnLoading : {}),
            }}
            onClick={handleBuild}
            disabled={!selectedRepo || !branch || triggerLoading}
          >
            {triggerLoading ? 'Building…' : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Trigger Build
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return Array.from({ length: 4 }).map((_, i) => (
    <div
      key={i}
      style={{
        height: 58,
        borderRadius: 3,
        background: Colors.surface2,
        animation: 'shimmer 1.5s ease infinite',
        backgroundSize: '200% 100%',
        backgroundImage: `linear-gradient(90deg, ${Colors.surface2} 25%, ${Colors.surface3} 50%, ${Colors.surface2} 75%)`,
      }}
    />
  ));
}

function getStyles() {
  return {
    page: { maxWidth: 1120, margin: '0 auto' },
    title: {
      fontFamily: 'Google Sans, sans-serif',
      fontSize: '32px',
      fontWeight: '700',
      lineHeight: '1.1',
      color: '#0f172a',
      letterSpacing: '-0.02em',
      margin: 0,
    },
    subtitle: {
      fontFamily: 'Google Sans, sans-serif',
      fontWeight: '400',
      fontSize: '15px',
      lineHeight: '24px',
      color: '#64748b',
      marginTop: '12px',
    },
    card: {
      background: '#FFFFFF',
      border: '1px solid #D9DEE7',
      borderRadius: '4px',
      marginBottom: '12px',
      boxShadow: 'none',
    },
    stepLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'Google Sans',
      fontWeight: '600',
      fontSize: '14px',
      color: '#2F3A4A',
      marginBottom: '10px',
    },
    stepNum: {
      width: '24px',
      height: '24px',
      minWidth: '24px',
      borderRadius: '9999px',
      background: '#0F4CB5',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontFamily: 'Google Sans',
      fontWeight: '600',
    },
    searchWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#EEF3F9',
      border: '1px solid #D5DCE6',
      borderRadius: '2px',
      padding: '0 10px',
      height: '34px',
      marginBottom: '8px',
    },
    searchInput: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      fontSize: '13px',
      color: '#3B4350',
      fontFamily: 'Google Sans',
    },
    repoList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      maxHeight: 320,
      overflowY: 'auto',
      paddingRight: '6px',
    },
    repoItem: {
      padding: '8px 12px',
      minHeight: '54px',
      borderRadius: '2px',
      border: '1px solid #D8DEE8',
      background: '#F7F9FC',
      textAlign: 'left',
      transition: 'all var(--transition)',
      width: '100%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
    },
    repoActive: {
      border: '2px solid #0F4CB5',
      background: '#F0F7FF',
    },
    repoIconBox: {
      width: '28px',
      height: '28px',
      minWidth: '28px',
      borderRadius: '3px',
      background: '#EDF1F7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    repoIconBoxSelected: {
      background: '#005A9C',
    },
    repoName: {
      fontFamily: 'Google Sans',
      fontSize: '13px',
      fontWeight: '600',
      color: '#2F3A4A',
      marginBottom: '2px',
    },
    repoMeta: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '11px',
      color: '#7D8797',
    },
    empty: {
      color: '#94a3b8',
      fontSize: '13px',
      textAlign: 'center',
      padding: '24px',
    },
    rightCol: {
      display: 'flex',
      flexDirection: 'column',
    },
    selectWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },
    select: {
      width: '100%',
      height: '36px',
      background: '#EEF3F9',
      border: '1px solid #D5DCE6',
      borderRadius: '2px',
      color: '#3B4350',
      fontSize: '13px',
      padding: '0 32px',
      appearance: 'none',
      WebkitAppearance: 'none',
      cursor: 'pointer',
      fontFamily: 'Google Sans',
    },
    skeletonBar: {
      height: 36,
      borderRadius: 2,
      background: Colors.surface2,
      animation: 'shimmer 1.5s ease infinite',
    },
    platformBtn: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      border: '1px solid #d5dbe3',
      background: '#f7f8fa',
      transition: 'all var(--transition)',
      height: '52px',
      cursor: 'pointer',
      padding: '0',
      width: '100%',
    },
    formatContainer: {
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: '1px solid #E5E7EB',
      animation: 'fadeIn 0.3s ease',
    },
    formatLabel: {
      fontSize: '10px',
      fontWeight: '700',
      color: '#7b8794',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      fontFamily: 'Google Sans',
    },
    formatGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
    },
    formatBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      height: '30px',
      borderRadius: '3px',
      border: '1px solid #d5dbe3',
      background: '#ffffff',
      color: '#3a4658',
      fontSize: '11px',
      fontWeight: '600',
      transition: 'all var(--transition)',
      cursor: 'pointer',
      fontFamily: 'Google Sans',
    },
    formatActive: {
      background: '#16933a',
      border: '1px solid #148535',
      color: '#FFFFFF',
    },
    apkFormatActive: {
      background: '#0f4cb5',
      border: '1px solid #0d43a0',
      color: '#FFFFFF',
    },
    formatBtnDisabled: {
      background: '#f1f5f9',
      border: '1px solid #e2e8f0',
      color: '#94a3b8',
      cursor: 'not-allowed',
      pointerEvents: 'none',
    },
    iosFormatActive: {
      background: '#005A9C',
      border: '1px solid #005A9C',
      color: '#FFFFFF',
    },
    inputLabel: {
      fontSize: '9px',
      fontWeight: '700',
      letterSpacing: '0.8px',
      textTransform: 'uppercase',
      color: '#7b8794',
      marginBottom: '4px',
      fontFamily: 'Google Sans',
    },
    inputField: {
      width: '100%',
      height: '34px',
      background: '#eef2f6',
      border: '1px solid #d7dde5',
      borderRadius: '3px',
      color: '#425466',
      fontSize: '12px',
      fontWeight: '500',
      padding: '0 10px',
      fontFamily: 'Google Sans',
      outline: 'none',
    },
    optionsDivider: {
      height: '1px',
      background: '#e5e9ef',
      margin: '14px 0',
    },
    toggleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '28px',
    },
    toggleLabel: {
      fontSize: '12px',
      fontWeight: '400',
      color: '#425466',
      fontFamily: 'Google Sans',
    },
    buildBtn: {
      width: '100%',
      height: '44px',
      background: '#0F4CB5',
      color: 'white',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: 'Google Sans',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background var(--transition)',
      letterSpacing: '0.01em',
    },
    buildBtnLoading: {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
    appleCredsCard: {
      background: '#FFFFFF',
      border: '1px solid #D9DEE7',
      borderRadius: '12px',
      marginBottom: '12px',
      boxShadow: 'none',
    },
    appleUploadArea: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '52px',
      border: '1.5px dashed #c5cdd8',
      borderRadius: '10px',
      background: '#ffffff',
      cursor: 'pointer',
      marginBottom: '10px',
      transition: 'border-color var(--transition)',
    },
    appleUploadText: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#6b7a93',
      fontFamily: 'Google Sans',
      pointerEvents: 'none',
    },
    appleInput: {
      display: 'block',
      width: '100%',
      height: '44px',
      background: '#eef2f7',
      border: '1px solid #d7dde5',
      borderRadius: '10px',
      color: '#425466',
      fontSize: '13px',
      fontWeight: '400',
      padding: '0 14px',
      fontFamily: 'Google Sans',
      outline: 'none',
      marginBottom: '10px',
      boxSizing: 'border-box',
    },
    appleSaveBtn: {
      width: '100%',
      height: '44px',
      background: '#0F4CB5',
      color: '#FFFFFF',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: 'Google Sans',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background var(--transition)',
    },

    /* ── Play Store Connect Credentials ── */
    psCard: {
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '4px',
      marginBottom: '10px',
    },
    psHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px',
    },
    psBadge: {
      width: '24px',
      height: '24px',
      minWidth: '24px',
      borderRadius: '50%',
      background: '#0F4CB5',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontFamily: 'Google Sans',
      fontWeight: '700',
      flexShrink: 0,
    },
    psTitle: {
      fontFamily: 'Google Sans',
      fontWeight: '700',
      fontSize: '14px',
      color: '#2F3A4A',
      lineHeight: 1.2,
    },
    psSegmentedControl: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: '#F3F4F6',
      borderRadius: '4px',
      padding: '4px',
      height: '64px',
      marginBottom: '10px',
      gap: '4px',
    },
    psSegTab: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontFamily: 'Google Sans',
      fontWeight: '600',
      cursor: 'pointer',
      border: 'none',
      transition: 'all 180ms ease',
      padding: '0 10px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    psSegTabActive: {
      background: '#0F4CB5',
      color: '#FFFFFF',
      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
    },
    psSegTabInactive: {
      background: 'transparent',
      color: '#6B7280',
    },
    psUploadArea: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '50px',
      border: '1.5px dashed #D1D5DB',
      borderRadius: '4px',
      background: '#ffffff',
      cursor: 'pointer',
      marginBottom: '10px',
      transition: 'border-color 180ms ease, background 180ms ease',
    },
    psUploadText: {
      fontSize: '12px',
      fontWeight: '500',
      color: '#6B7280',
      fontFamily: 'Google Sans',
      pointerEvents: 'none',
    },
    psInput: {
      display: 'block',
      width: '100%',
      height: '50px',
      background: '#F3F4F6',
      border: '1px solid #D1D5DB',
      borderRadius: '4px',
      color: '#374151',
      fontSize: '12px',
      padding: '0 20px',
      fontFamily: 'Google Sans',
      outline: 'none',
      marginBottom: '10px',
      boxSizing: 'border-box',
    },
    psInfoBanner: {
      background: '#EFF6FF',
      border: '1.5px dashed #93C5FD',
      borderRadius: '4px',
      padding: '20px',
      marginBottom: '16px',
      fontSize: '12px',
      color: '#1D4ED8',
      lineHeight: '1.6',
      fontFamily: 'Google Sans',
    },
    psSaveBtn: {
      width: '100%',
      height: '50px',
      background: '#0F4CB5',
      color: '#FFFFFF',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '700',
      fontFamily: 'Google Sans',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background 180ms ease',
    },
    psSuccessBanner: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: '#F0FDF4',
      border: '1px solid #86EFAC',
      borderRadius: '4px',
      padding: '12px 16px',
      marginTop: '12px',
      animation: 'fadeIn 0.25s ease',
    },
    psSuccessText: {
      fontFamily: 'Google Sans',
      fontWeight: '600',
      fontSize: '13px',
      color: '#16A34A',
    },
    psReplaceLink: {
      marginLeft: 'auto',
      flexShrink: 0,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'Google Sans',
      fontWeight: '600',
      fontSize: '12px',
      color: '#0F4CB5',
      textDecoration: 'underline',
      padding: '0',
    },
    psConfiguredBanner: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#F0FDF4',
      border: '1px solid #BBF7D0',
      borderRadius: '4px',
      padding: '8px 12px',
      marginBottom: '16px',
    },
    psConfiguredText: {
      fontFamily: 'Google Sans',
      fontWeight: '500',
      fontSize: '12px',
      color: '#15803D',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    psRepoSelected: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#F0FDF4',
      border: '1px solid #BBF7D0',
      borderRadius: '4px',
      padding: '10px 14px',
      marginBottom: '16px',
      fontSize: '12px',
      color: '#166534',
      fontFamily: 'Google Sans',
    },

    /* ── Version Information Section ── */
    versionLabel: {
      fontSize: '10px',
      fontWeight: '700',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      color: '#7b8794',
      marginBottom: '6px',
      fontFamily: 'Google Sans',
    },
    versionInput: {
      display: 'block',
      width: '100%',
      height: '34px',
      background: '#eef2f6',
      border: '1px solid #d7dde5',
      borderRadius: '3px',
      color: '#425466',
      fontSize: '12px',
      fontWeight: '500',
      padding: '0 10px',
      fontFamily: 'Google Sans',
      outline: 'none',
      boxSizing: 'border-box',
      marginBottom: '6px',
    },
    versionHelperText: {
      fontSize: '11px',
      color: '#64748b',
      lineHeight: '1.5',
      fontFamily: 'Google Sans',
      margin: 0,
    },
    releaseNotesTextarea: {
      display: 'block',
      width: '100%',
      minHeight: '88px',
      background: '#eef2f6',
      border: '1px solid #d7dde5',
      borderRadius: '3px',
      color: '#425466',
      fontSize: '12px',
      fontWeight: '500',
      padding: '8px 10px',
      fontFamily: 'Google Sans',
      outline: 'none',
      boxSizing: 'border-box',
      resize: 'vertical',
      lineHeight: '1.5',
    },
  };
}
