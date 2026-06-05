import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchRepos, fetchBranches, selectRepo } from '../store/slices/reposSlice.js';
import { triggerBuild } from '../store/slices/buildsSlice.js';
import { api } from '../services/api.js';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';
import { Bell, HelpCircle, Folder, Search, Check, ChevronDown, GitBranch, Link as LinkIcon, Upload, Sliders, Smartphone } from 'lucide-react';

const getRelativeTime = (dateString) => {
  if (!dateString) return 'Last commit recent';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return 'Last commit recent';
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `Last commit ${Math.max(1, diffMins)}m ago`;
  } else if (diffHours < 24) {
    return `Last commit ${diffHours}h ago`;
  } else {
    return `Last commit ${diffDays}d ago`;
  }
};

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
  const [isReplacingKeystore, setIsReplacingKeystore] = useState(false);
  const [keystoreFile, setKeystoreFile] = useState(null);
  const [keystoreAlias, setKeystoreAlias] = useState('');
  const [keystorePass, setKeystorePass] = useState('');
  const [keyPass, setKeyPass] = useState('');
  const [uploadingKS, setUploadingKS] = useState(false);
  const [keystoreMode, setKeystoreMode] = useState('upload'); // 'upload' or 'generate'
  const [versionName, setVersionName] = useState('1.0.0');
  const [buildType, setBuildType] = useState('testing');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [versionCode, setVersionCode] = useState('');
  const [appleKeyFile, setAppleKeyFile] = useState(null);
  const [appleKeyId, setAppleKeyId] = useState('');
  const [appleIssuerId, setAppleIssuerId] = useState('');
  const [appleCredsStatus, setAppleCredsStatus] = useState(null);
  const [isReplacingApple, setIsReplacingApple] = useState(false);
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
        setIsReplacingKeystore(false);
      });
      // Check Apple credentials
      api.get(`/apple-credentials/${selectedRepo.id}`).then(({ data }) => {
        setAppleCredsStatus(data.credentials);
        setIsReplacingApple(false);
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
        setIsReplacingKeystore(false);
        toast.success('Keystore uploaded successfully!');
        setKeystoreFile(null);
        setKeystoreAlias('');
        setKeystorePass('');
        setKeyPass('');
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
        setIsReplacingKeystore(false);
        toast.success('Keystore generated dynamically! ⚡');
        setKeystoreAlias('');
        setKeystorePass('');
        setKeyPass('');
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
      setIsReplacingApple(false);
      toast.success('App Store Connect credentials saved successfully! 🍎');
      setAppleKeyFile(null);
      setAppleKeyId('');
      setAppleIssuerId('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save credentials');
    } finally {
      setUploadingApple(false);
    }
  };

  const handleBuild = async () => {
    if (!selectedRepo || !branch) return toast.error('Select a repo and branch');
    if (platform === 'android' && buildType === 'release' && !versionCode) return toast.error('Enter a version code for Play Store builds');
    
    const isAndroidPlaystore = platform === 'android' && buildType === 'release';
    const result = await dispatch(triggerBuild({
      projectId: selectedRepo.id,
      projectName: selectedRepo.name,
      repoUrl: selectedRepo.cloneUrl,
      provider: user.provider,
      branch,
      platform,
      androidFormat: (platform === 'android' || platform === 'both') ? androidFormat : undefined,
      versionName: isAndroidPlaystore ? versionName : undefined,
      buildType,
      releaseNotes: isAndroidPlaystore ? releaseNotes : undefined,
      versionCode: isAndroidPlaystore ? versionCode : undefined,
    }));
    if (triggerBuild.fulfilled.match(result)) {
      toast.success('Build queued! 🚀');
    } else {
      toast.error(result.payload || 'Failed to trigger build');
    }
  };

  // Keystore section is now optional — Android builds run on GitHub Actions which uses repo secrets for signing.
  const needsKeystore = false;
  const needsAppleCreds = platform === 'ios';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: Colors.bg, ...Fonts.Regular }}>

      {/* ── Top Header Bar ── */}
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
        {/* Left Side: Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569', ...Fonts.Medium }}>
          <span style={{ color: '#00388d', ...Fonts.Bold }}>New Configuration</span>
        </div>

        {/* Right Side: Actions */}
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

      {/* ── Page Content Container ── */}
      <div style={{ padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Header */}
          <div>
            <h1 style={{ fontSize: '24px', ...Fonts.Bold, color: '#1e293b', margin: '0 0 4px 0' }}>Configure New Build</h1>
            <p style={{ fontSize: '14px', color: '#5f6368', lineHeight: '1.5', margin: 0 }}>
              Set up your build parameters. Select your source code repository, define the target environment, and choose your platform options.
            </p>
          </div>

          {/* Grid Layout (Step 1 on Left, Steps 2 & 3 on Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '16px', alignItems: 'stretch' }}>

            {/* Left Column Grid Cell - position:relative so absolutely-positioned card doesn't drive row height */}
            <div style={{ position: 'relative' }}>
              {/* Left Card - fills exactly the grid cell height (set by right column) */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #dadce0',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#edf3fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0c5df4' }}>
                    <Folder size={20} />
                  </div>
                  <h2 style={{ fontSize: '18px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>1. Select Repository</h2>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', color: '#5f6368' }} />
                  <input
                    placeholder="Search repository by name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: '#f1f3f4',
                      border: 'none',
                      borderRadius: '8px',
                      paddingLeft: '44px',
                      paddingRight: '16px',
                      fontSize: '14px',
                      color: '#1e293b',
                      outline: 'none',
                      ...Fonts.Regular
                    }}
                  />
                </div>

                {/* Repo Cards Grid - scrolls within the constrained card height */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px', alignContent: 'start' }}>
                  {loading ? (
                    <SkeletonList />
                  ) : (
                    repos.map(r => {
                      const isSelected = selectedRepo?.id === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleRepoSelect(r)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            position: 'relative',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #0c5df4' : '1px solid #dadce0',
                            backgroundColor: '#ffffff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            width: '100%'
                          }}
                        >
                          <GitBranch size={20} style={{ color: isSelected ? '#0c5df4' : '#5f6368', marginRight: '12px', flexShrink: 0 }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                            <span style={{ fontSize: '14px', ...Fonts.Bold, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {r.name}
                            </span>
                            <div style={styles.repoMeta}>{r.private ? '🔒 Private' : '🌐 Public'} · {r.fullName}</div>
                          </div>
                          {isSelected && (
                            <div style={{ position: 'absolute', top: '12px', right: '12px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#0c5df4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={11} color="#ffffff" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                  {!loading && repos.length === 0 && (
                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '32px', color: '#5f6368', fontSize: '14px' }}>
                      No repositories found
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Step 2 & Step 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Step 2: Branch */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#edf3fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0c5df4' }}>
                    <GitBranch size={20} />
                  </div>
                  <h2 style={{ fontSize: '16px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>2. Branch</h2>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <select
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    disabled={!selectedRepo}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: '#f1f3f4',
                      border: 'none',
                      borderRadius: '8px',
                      paddingLeft: '16px',
                      paddingRight: '40px',
                      fontSize: '14px',
                      color: selectedRepo ? '#1e293b' : '#5f6368',
                      appearance: 'none',
                      cursor: selectedRepo ? 'pointer' : 'not-allowed',
                      outline: 'none',
                      ...Fonts.Regular
                    }}
                  >
                    {!selectedRepo && <option value="">Select a repo first</option>}
                    {branchesLoading ? (
                      <option value="">Loading branches...</option>
                    ) : (
                      branches.map(b => (
                        <option key={b.sha} value={b.name}>
                          {b.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown size={18} style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: '#5f6368' }} />
                </div>
              </div>

              {/* Step 3: Platform */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00875a' }}>
                    <Smartphone size={20} />
                  </div>
                  <h2 style={{ fontSize: '16px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>3. Platform</h2>
                </div>

                {/* Android / iOS Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  {/* Android Button */}
                  <button
                    onClick={() => {
                      setPlatform('android');
                      setBuildType('testing'); // reset to first valid option
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      height: '38px',
                      borderRadius: '8px',
                      border: platform === 'android' ? '2px solid #00388d' : '1px solid #dadce0',
                      backgroundColor: '#ffffff',
                      color: platform === 'android' ? '#00388d' : '#5f6368',
                      cursor: 'pointer',
                      fontSize: '14px',
                      ...Fonts.Bold,
                      transition: 'all 0.2s'
                    }}
                  >
                    <AndroidIcon size={20} style={{ color: platform === 'android' ? '#00388d' : '#5f6368' }} />
                    <span>Android</span>
                  </button>

                  {/* iOS Button */}
                  <button
                    onClick={() => {
                      setPlatform('ios');
                      setBuildType('release'); // iOS only has release
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      height: '44px',
                      borderRadius: '8px',
                      border: platform === 'ios' ? '2px solid #00388d' : '1px solid #dadce0',
                      backgroundColor: '#ffffff',
                      color: platform === 'ios' ? '#00388d' : '#5f6368',
                      cursor: 'pointer',
                      fontSize: '14px',
                      ...Fonts.Bold,
                      transition: 'all 0.2s'
                    }}
                  >
                    <IosIcon size={20} style={{ color: platform === 'ios' ? '#00388d' : '#5f6368' }} />
                    <span>iOS</span>
                  </button>
                </div>

                {/* Build Format (only for Android) */}
                {platform === 'android' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>ANDROID BUILD FORMAT</span>
                    {buildType === 'release' ? (
                      // Play Store requires AAB — lock it
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          height: '36px', borderRadius: '8px', flex: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', ...Fonts.Bold,
                          border: '1.5px solid #00875a',
                          backgroundColor: '#ffffff', color: '#00875a'
                        }}>
                          AAB
                        </div>
                        <span style={{ fontSize: '11px', color: '#5f6368', flex: 2, lineHeight: '1.4' }}>
                          Play Store requires AAB format.
                        </span>
                      </div>
                    ) : (
                      // Share via Link — allow APK or AAB
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button
                          onClick={() => setAndroidFormat('apk')}
                          style={{
                            height: '36px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: '13px', ...Fonts.Bold,
                            border: androidFormat === 'apk' ? '1.5px solid #00875a' : 'none',
                            backgroundColor: androidFormat === 'apk' ? '#ffffff' : '#f1f3f4',
                            color: androidFormat === 'apk' ? '#00875a' : '#5f6368',
                            transition: 'all 0.2s'
                          }}
                        >
                          APK
                        </button>
                        <button
                          onClick={() => setAndroidFormat('aab')}
                          style={{
                            height: '36px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: '13px', ...Fonts.Bold,
                            border: androidFormat === 'aab' ? '1.5px solid #00875a' : 'none',
                            backgroundColor: androidFormat === 'aab' ? '#ffffff' : '#f1f3f4',
                            color: androidFormat === 'aab' ? '#00875a' : '#5f6368',
                            transition: 'all 0.2s'
                          }}
                        >
                          AAB
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Width Row: Step 4 (Build Options) */}
          {platform === 'android' && (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fef7e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2a100' }}>
                  <Sliders size={20} />
                </div>
                <h2 style={{ fontSize: '18px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>4. Build Options</h2>
              </div>

              {/* Build Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

                {/* Android: Share via Link */}
                <div
                  onClick={() => setBuildType('testing')}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '20px',
                    borderRadius: '8px',
                    border: buildType === 'testing' ? '2px solid #00875a' : '1px solid #dadce0',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    backgroundColor: buildType === 'testing' ? '#e6f4ea' : '#f1f3f4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: buildType === 'testing' ? '#00875a' : '#5f6368', flexShrink: 0
                  }}>
                    <LinkIcon size={20} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '24px' }}>
                    <span style={{ fontSize: '15px', ...Fonts.Bold, color: '#1e293b' }}>Share via Link</span>
                    <span style={{ fontSize: '12px', color: '#5f6368', lineHeight: '1.4' }}>
                      Generate a downloadable APK/AAB link for manual installation.
                    </span>
                  </div>
                  {buildType === 'testing' ? (
                    <div style={{ position: 'absolute', top: '20px', right: '20px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#00875a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color="#ffffff" strokeWidth={3} />
                    </div>
                  ) : (
                    <div style={{ position: 'absolute', top: '20px', right: '20px', width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #dadce0' }} />
                  )}
                </div>

                {/* Android: Play Store Internal Testing */}
                <div
                  onClick={() => {
                    setBuildType('release');
                    setAndroidFormat('aab'); // Play Store requires AAB
                  }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '20px',
                    borderRadius: '8px',
                    border: buildType === 'release' ? '2px solid #00875a' : '1px solid #dadce0',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    backgroundColor: buildType === 'release' ? '#e6f4ea' : '#f1f3f4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: buildType === 'release' ? '#00875a' : '#5f6368',
                    flexShrink: 0
                  }}>
                    <Upload size={20} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '24px' }}>
                    <span style={{ fontSize: '15px', ...Fonts.Bold, color: '#1e293b' }}>
                      Play Store Internal Testing
                    </span>
                    <span style={{ fontSize: '12px', color: '#5f6368', lineHeight: '1.4' }}>
                      Upload directly to Google Play internal testing track.
                    </span>
                  </div>
                  {buildType === 'release' ? (
                    <div style={{ position: 'absolute', top: '20px', right: '20px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#00875a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color="#ffffff" strokeWidth={3} />
                    </div>
                  ) : (
                    <div style={{ position: 'absolute', top: '20px', right: '20px', width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #dadce0' }} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Android Configuration — single card with two columns inside */}
          {selectedRepo && platform === 'android' && (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>

              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00875a' }}>
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>Android Configuration</h3>
                  <p style={{ fontSize: '12px', color: '#5f6368', margin: 0 }}>Keystore signing{buildType === 'release' ? ' and Play Store metadata.' : ' for your build.'}</p>
                </div>
              </div>

              {/* Inner 2-column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: buildType === 'release' ? '1fr 1px 1fr' : '1fr', gap: '0', alignItems: 'start' }}>

                {/* Left column: Play Store Config — only when release */}
                {buildType === 'release' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '24px' }}>
                      <span style={{ fontSize: '12px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.4px' }}>PLAY STORE CONFIG</span>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>VERSION NAME</span>
                          <input type="text" placeholder="e.g. 1.0.0" value={versionName} onChange={e => setVersionName(e.target.value)}
                            style={{ height: '40px', backgroundColor: '#f8fafc', border: '1px solid #dadce0', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#1e293b', outline: 'none', ...Fonts.Regular }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>VERSION CODE</span>
                          <input type="number" placeholder="e.g. 101" value={versionCode} onChange={e => setVersionCode(e.target.value)} min="1"
                            style={{ height: '40px', backgroundColor: '#f8fafc', border: '1px solid #dadce0', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box', ...Fonts.Regular }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>RELEASE NOTES</span>
                        <textarea placeholder="Describe what's new in this build..." value={releaseNotes} onChange={e => setReleaseNotes(e.target.value)}
                          style={{ height: '80px', backgroundColor: '#f8fafc', border: '1px solid #dadce0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#1e293b', resize: 'none', outline: 'none', ...Fonts.Regular }} />
                      </div>
                    </div>

                    {/* Vertical divider */}
                    <div style={{ backgroundColor: '#dadce0', width: '1px', alignSelf: 'stretch' }} />
                  </>
                )}

                {/* Right column: Keystore */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingLeft: buildType === 'release' ? '24px' : '0' }}>
                  <span style={{ fontSize: '12px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.4px' }}>KEYSTORE SIGNING</span>

                  {keystoreStatus && !isReplacingKeystore ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', maxWidth: buildType === 'release' ? 'none' : '500px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', ...Fonts.Bold, color: '#15803d' }}>✅ Keystore on file</span>
                        <span style={{ fontSize: '12px', color: '#5f6368' }}>
                          Alias: <strong>{keystoreStatus.keystoreAlias}</strong> &nbsp;·&nbsp; File: <strong>{keystoreStatus.filename}</strong>
                        </span>
                      </div>
                      <button style={{ fontSize: '12px', color: '#5f6368', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => setIsReplacingKeystore(true)}>Replace</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxWidth: buildType === 'release' ? 'none' : '400px' }}>
                        <button onClick={() => setKeystoreMode('upload')} style={{ height: '36px', borderRadius: '8px', fontSize: '12px', ...Fonts.Bold, cursor: 'pointer', border: keystoreMode === 'upload' ? '1.5px solid #00875a' : '1px solid #dadce0', backgroundColor: keystoreMode === 'upload' ? '#f0fdf4' : '#f1f3f4', color: keystoreMode === 'upload' ? '#00875a' : '#5f6368' }}>Upload Keystore</button>
                        <button onClick={() => setKeystoreMode('generate')} style={{ height: '36px', borderRadius: '8px', fontSize: '12px', ...Fonts.Bold, cursor: 'pointer', border: keystoreMode === 'generate' ? '1.5px solid #00875a' : '1px solid #dadce0', backgroundColor: keystoreMode === 'generate' ? '#f0fdf4' : '#f1f3f4', color: keystoreMode === 'generate' ? '#00875a' : '#5f6368' }}>Auto-Generate</button>
                      </div>

                      {keystoreMode === 'upload' && (
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', border: '2px dashed #dadce0', borderRadius: '8px', color: '#5f6368', fontSize: '13px', cursor: 'pointer', maxWidth: buildType === 'release' ? 'none' : '400px' }}>
                          <input type="file" accept=".jks,.keystore" style={{ display: 'none' }} onChange={e => setKeystoreFile(e.target.files[0])} />
                          {keystoreFile ? `📎 ${keystoreFile.name}` : '+ Upload .jks / .keystore file'}
                        </label>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: buildType === 'release' ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>KEY ALIAS</span>
                          <input placeholder="e.g. my-key-alias" value={keystoreAlias} onChange={e => setKeystoreAlias(e.target.value)} style={{ height: '40px', backgroundColor: '#f8fafc', border: '1px solid #dadce0', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#1e293b', outline: 'none', ...Fonts.Regular }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>KEYSTORE PASSWORD</span>
                          <input type="password" placeholder="Keystore password" value={keystorePass} onChange={e => setKeystorePass(e.target.value)} style={{ height: '40px', backgroundColor: '#f8fafc', border: '1px solid #dadce0', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#1e293b', outline: 'none', ...Fonts.Regular }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>KEY PASSWORD</span>
                          <input type="password" placeholder="Key password" value={keyPass} onChange={e => setKeyPass(e.target.value)} style={{ height: '40px', backgroundColor: '#f8fafc', border: '1px solid #dadce0', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#1e293b', outline: 'none', ...Fonts.Regular }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {isReplacingKeystore && (
                          <button
                            onClick={() => {
                              setIsReplacingKeystore(false);
                              setKeystoreFile(null);
                              setKeystoreAlias('');
                              setKeystorePass('');
                              setKeyPass('');
                            }}
                            style={{
                              height: '36px',
                              padding: '0 20px',
                              borderRadius: '8px',
                              backgroundColor: '#f1f3f4',
                              color: '#5f6368',
                              border: '1px solid #dadce0',
                              fontSize: '13px',
                              ...Fonts.Bold,
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        )}
                        <button onClick={handleSaveKeystore} disabled={uploadingKS} style={{ height: '36px', padding: '0 20px', borderRadius: '8px', backgroundColor: '#00875a', color: '#ffffff', border: 'none', fontSize: '13px', ...Fonts.Bold, cursor: uploadingKS ? 'not-allowed' : 'pointer', opacity: uploadingKS ? 0.7 : 1 }}>
                          {uploadingKS ? 'Saving...' : (keystoreMode === 'upload' ? 'Save Keystore' : 'Generate Keystore')}
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* iOS Configuration — single card with two columns inside */}
          {selectedRepo && platform === 'ios' && (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>

              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#edf3fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0c5df4' }}>
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>iOS Configuration</h3>
                  <p style={{ fontSize: '12px', color: '#5f6368', margin: 0 }}>Build distribution and App Store Connect credentials.</p>
                </div>
              </div>

              {/* Inner 2-column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '0', alignItems: 'start' }}>

                {/* Left column: Build Options (TestFlight only for iOS) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '24px' }}>
                  <span style={{ fontSize: '12px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.4px' }}>BUILD OPTIONS</span>
                  
                  {/* TestFlight Button */}
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '2px solid #00875a',
                      backgroundColor: '#ffffff',
                      cursor: 'default',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      backgroundColor: '#e6f4ea',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#00875a',
                      flexShrink: 0
                    }}>
                      <Upload size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '24px' }}>
                      <span style={{ fontSize: '15px', ...Fonts.Bold, color: '#1e293b' }}>TestFlight</span>
                      <span style={{ fontSize: '12px', color: '#5f6368', lineHeight: '1.4' }}>
                        Upload directly to Apple TestFlight for beta distribution.
                      </span>
                    </div>
                    <div style={{ position: 'absolute', top: '20px', right: '20px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#00875a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color="#ffffff" strokeWidth={3} />
                    </div>
                  </div>
                </div>

                {/* Vertical divider */}
                <div style={{ backgroundColor: '#dadce0', width: '1px', alignSelf: 'stretch' }} />

                {/* Right column: App Store Connect Credentials */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingLeft: '24px' }}>
                  <span style={{ fontSize: '12px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.4px' }}>APP STORE CONNECT CREDENTIALS</span>

                  {appleCredsStatus && !isReplacingApple ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', ...Fonts.Bold, color: '#15803d' }}>✅ Credentials on file</span>
                        <span style={{ fontSize: '12px', color: '#5f6368' }}>
                          Key ID: <strong>{appleCredsStatus.apiKeyId}</strong> &nbsp;·&nbsp; File: <strong>{appleCredsStatus.filename}</strong>
                        </span>
                      </div>
                      <button style={{ fontSize: '12px', color: '#5f6368', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => setIsReplacingApple(true)}>Replace</button>
                    </div>
                  ) : (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', border: '2px dashed #dadce0', borderRadius: '8px', color: '#5f6368', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="file" accept=".p8" style={{ display: 'none' }} onChange={e => setAppleKeyFile(e.target.files[0])} />
                        {appleKeyFile ? `📎 ${appleKeyFile.name}` : '+ Upload AuthKey_xxx.p8 key file'}
                      </label>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>APPLE API KEY ID</span>
                          <input placeholder="e.g. 2GZN4HH9K8" value={appleKeyId} onChange={e => setAppleKeyId(e.target.value)}
                            style={{ height: '40px', backgroundColor: '#f8fafc', border: '1px solid #dadce0', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#1e293b', outline: 'none', ...Fonts.Regular }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', ...Fonts.Bold, color: '#5f6368', letterSpacing: '0.5px' }}>APPLE API ISSUER ID</span>
                          <input placeholder="e.g. Issuer ID" value={appleIssuerId} onChange={e => setAppleIssuerId(e.target.value)}
                            style={{ height: '40px', backgroundColor: '#f8fafc', border: '1px solid #dadce0', borderRadius: '8px', padding: '0 12px', fontSize: '13px', color: '#1e293b', outline: 'none', ...Fonts.Regular }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {isReplacingApple && (
                          <button
                            onClick={() => {
                              setIsReplacingApple(false);
                              setAppleKeyFile(null);
                              setAppleKeyId('');
                              setAppleIssuerId('');
                            }}
                            style={{
                              height: '36px',
                              padding: '0 20px',
                              borderRadius: '8px',
                              backgroundColor: '#f1f3f4',
                              color: '#5f6368',
                              border: '1px solid #dadce0',
                              fontSize: '13px',
                              ...Fonts.Bold,
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        )}
                        <button onClick={handleSaveAppleCredentials} disabled={uploadingApple} style={{ height: '36px', padding: '0 20px', borderRadius: '8px', backgroundColor: '#00875a', color: '#ffffff', border: 'none', fontSize: '13px', ...Fonts.Bold, cursor: uploadingApple ? 'not-allowed' : 'pointer', opacity: uploadingApple ? 0.7 : 1 }}>
                          {uploadingApple ? 'Saving...' : 'Save Credentials'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Trigger Build Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', marginBottom: '32px' }}>
            <button
              onClick={handleBuild}
              disabled={!selectedRepo || !branch || (platform === 'android' && buildType === 'release' && !versionCode) || triggerLoading}
              style={{
                backgroundColor: (triggerLoading || !selectedRepo || !branch || (platform === 'android' && buildType === 'release' && !versionCode)) ? '#80b89e' : Colors.mockupTriggerBtn,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 36px',
                fontSize: '16px',
                ...Fonts.Bold,
                cursor: (triggerLoading || !selectedRepo || !branch || (platform === 'android' && buildType === 'release' && !versionCode)) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {triggerLoading ? 'Queuing Build...' : 'Trigger Build'}
            </button>
          </div>

        </div>
      </div>
    </div >
  );
}

function SkeletonList() {
  return Array.from({ length: 4 }).map((_, i) => (
    <div key={i} style={{ height: 60, borderRadius: 8, background: Colors.surface2, animation: 'shimmer 1.5s ease infinite', backgroundSize: '200% 100%', backgroundImage: `linear-gradient(90deg, ${Colors.surface2} 25%, ${Colors.surface3} 50%, ${Colors.surface2} 75%)` }} />
  ));
}

function getStyles() {
  return {
    ksFound: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: Colors.successBg, borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: Colors.success },
    ksReplace: { fontSize: 'var(--text-xs)', color: Colors.textMuted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' },
    ksForm: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' },
    fileLabel: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)', border: `2px dashed ${Colors.border}`, borderRadius: 'var(--radius-md)', color: Colors.textMuted, fontSize: 'var(--text-sm)', cursor: 'pointer' },
    input: { padding: 'var(--space-2) var(--space-3)', background: Colors.surface2, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-md)', color: Colors.text, fontSize: 'var(--text-sm)' },
    uploadBtn: { padding: 'var(--space-2) var(--space-4)', background: Colors.surface3, border: `1px solid ${Colors.border}`, borderRadius: 'var(--radius-md)', color: Colors.text, fontSize: 'var(--text-sm)', ...Fonts.SemiBold, cursor: 'pointer' },
    repoMeta: { fontSize: '11px', color: '#5f6368', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
  };
}
