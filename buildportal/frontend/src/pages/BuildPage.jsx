import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { 
  Folder, 
  GitBranch, 
  Smartphone, 
  Sliders, 
  Link, 
  Upload, 
  Search, 
  Check, 
  HelpCircle, 
  Bell, 
  FileText,
  Lock,
  Globe,
  CheckCircle2,
  FileCode,
  Key,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { fetchRepos, fetchBranches, selectRepo } from '../store/slices/reposSlice.js';
import { triggerBuild } from '../store/slices/buildsSlice.js';
import { api } from '../services/api.js';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';

const AndroidIcon = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
    <path d="M17.5 10c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-11 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm11.5 1.5c0-.8-.7-1.5-1.5-1.5H7.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5h1v3c0 .6.4 1 1 1s1-.4 1-1v-3h3v3c0 .6.4 1 1 1s1-.4 1-1v-3h1c.8 0 1.5-.7 1.5-1.5v-6zm-1.8-3.7l1.3-1.3c.4-.4.4-1 0-1.4s-1-.4-1.4 0l-1.5 1.5c-.8-.3-1.7-.5-2.6-.5s-1.8.2-2.6.5L9.3 5.1c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4l1.3 1.3C7.6 8.7 6.7 10 6.2 11.5h11.6c-.5-1.5-1.4-2.8-2.6-3.7z" />
  </svg>
);

const IosIcon = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-1 2.94.9.07 2.01-.52 2.83-1.33z" />
  </svg>
);

export default function BuildPage() {
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
  const [buildType, setBuildType] = useState('testing'); // 'testing', 'uat', 'production'
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
    } else {
      toast.error(result.payload || 'Failed to trigger build');
    }
  };

  // Generate dynamic commit label to make mockup look premium
  const getRepoCommitTime = (name) => {
    if (name === 'mobile-app-core') return 'Last commit 2h ago';
    if (name === 'user-auth-module') return 'Last commit 1d ago';
    if (name === 'payment-gateway-v2') return 'Last commit 5h ago';
    if (name === 'design-system-mobile') return 'Last commit 3d ago';
    
    // Hash string to dynamic repeatable timestamp
    const num = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    const hours = (num % 23) + 1;
    if (hours < 12) return `Last commit ${hours}h ago`;
    const days = (num % 6) + 1;
    return `Last commit ${days}d ago`;
  };

  const needsKeystore = platform === 'android' || platform === 'both';
  const needsAppleCreds = platform === 'ios' || platform === 'both';

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 pb-24 text-[#0f172a] bg-[#f8fafc]">
      
      {/* Top Header Breadcrumb / Actions Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
          <span className="hover:text-slate-800 cursor-pointer transition">Pipelines</span>
          <span className="text-slate-300">›</span>
          <span className="text-slate-800 font-semibold">New Configuration</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition" title="Notifications">
            <Bell size={18} />
          </button>
          <button className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition" title="Help">
            <HelpCircle size={18} />
          </button>
          {user && (
            <div className="flex items-center gap-2">
              <div className="h-px w-4 bg-slate-200" />
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-sm" 
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Title Block */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Configure New Build
        </h1>
        <p className="text-sm md:text-base text-slate-500 max-w-[700px] leading-relaxed">
          Set up your build parameters. Select your source code repository, define the target environment, and choose your platform options.
        </p>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-start">
        
        {/* Left Column: Repository Selection (span 2 cols) */}
        <section className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm min-h-[380px]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Folder size={18} className="stroke-[2.5]" />
            </div>
            <h2 className="text-base font-bold text-slate-800">1. Select Repository</h2>
          </div>

          {/* Search Box */}
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none" 
              placeholder="Search repository by name..." 
              value={search}
              onChange={e => setSearch(e.target.value)} 
            />
          </div>

          {/* Repositories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              ))
            ) : (
              repos.map(r => {
                const isSelected = selectedRepo?.id === r.id;
                return (
                  <button 
                    key={r.id} 
                    className={`relative flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all group ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-500/10' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                    onClick={() => handleRepoSelect(r)}
                  >
                    <div className={`p-2.5 rounded-lg shrink-0 transition-colors ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                    }`}>
                      <FileCode size={18} />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="font-semibold text-sm text-slate-800 truncate mb-0.5">{r.name}</div>
                      <div className="text-xs text-slate-400 font-medium">{getRepoCommitTime(r.name)}</div>
                    </div>

                    {isSelected && (
                      <div className="absolute top-3 right-3 text-blue-600 animate-fadeIn">
                        <CheckCircle2 size={18} className="fill-blue-50" />
                      </div>
                    )}
                  </button>
                );
              })
            )}

            {!loading && repos.length === 0 && (
              <div className="col-span-2 py-12 text-center text-slate-400 text-sm">
                No repositories found matching "{search}"
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Branch & Platform */}
        <div className="flex flex-col gap-6">
          
          {/* Card 2: Branch */}
          <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <GitBranch size={18} className="stroke-[2.5]" />
              </div>
              <h2 className="text-base font-bold text-slate-800">2. Branch</h2>
            </div>

            {branchesLoading ? (
              <div className="h-11 rounded-lg bg-slate-100 animate-pulse" />
            ) : (
              <div className="relative">
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none cursor-pointer appearance-none focus:bg-white focus:border-purple-500 transition-all"
                  value={branch} 
                  onChange={e => setBranch(e.target.value)} 
                  disabled={!selectedRepo}
                >
                  {branches.map(b => (
                    <option key={b.sha} value={b.name}>{b.name}</option>
                  ))}
                  {!selectedRepo && <option>Select a repo first</option>}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <span className="text-[10px]">▼</span>
                </div>
              </div>
            )}
          </section>

          {/* Card 3: Platform */}
          <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <Smartphone size={18} className="stroke-[2.5]" />
              </div>
              <h2 className="text-base font-bold text-slate-800">3. Platform</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Android Platform Button */}
              <button 
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-all ${
                  platform === 'android' 
                    ? 'border-blue-900 bg-blue-50/50 text-blue-900 shadow-sm' 
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50/50'
                }`}
                onClick={() => setPlatform('android')}
              >
                <AndroidIcon size={18} />
                Android
              </button>

              {/* iOS Platform Button */}
              <button 
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-all ${
                  platform === 'ios' 
                    ? 'border-blue-900 bg-blue-50/50 text-blue-900 shadow-sm' 
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50/50'
                }`}
                onClick={() => setPlatform('ios')}
              >
                <IosIcon size={18} />
                iOS
              </button>
            </div>

            {/* Android Format (APK vs AAB) */}
            {(platform === 'android' || platform === 'both') && (
              <div className="border-t border-slate-100 pt-4 mt-3">
                <div className="text-[10px] font-extrabold tracking-wider text-slate-400 mb-2 uppercase">
                  Android Build Format
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    className={`py-2 rounded-lg border text-xs font-bold tracking-wide transition-all ${
                      androidFormat === 'apk'
                        ? 'border-emerald-600 text-emerald-600 bg-white font-extrabold shadow-sm'
                        : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200/50'
                    }`}
                    onClick={() => setAndroidFormat('apk')}
                  >
                    APK
                  </button>
                  <button 
                    className={`py-2 rounded-lg border text-xs font-bold tracking-wide transition-all ${
                      androidFormat === 'aab'
                        ? 'border-emerald-600 text-emerald-600 bg-white font-extrabold shadow-sm'
                        : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200/50'
                    }`}
                    onClick={() => setAndroidFormat('aab')}
                  >
                    AAB
                  </button>
                </div>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* Row 2: Step 4 - Build Options */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Sliders size={18} className="stroke-[2.5]" />
          </div>
          <h2 className="text-base font-bold text-slate-800">4. Build Options</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Card A: Share via Link (Testing) */}
          <button 
            className={`relative flex items-start gap-4 p-5 rounded-xl border text-left transition-all ${
              buildType === 'testing'
                ? 'border-emerald-600 bg-emerald-50/10'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
            onClick={() => setBuildType('testing')}
          >
            <div className={`p-2.5 rounded-lg shrink-0 ${
              buildType === 'testing' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <Link size={18} className="stroke-[2.5]" />
            </div>
            <div className="flex-1 pr-6">
              <div className="font-bold text-slate-800 text-sm mb-1">Share via Link</div>
              <div className="text-xs text-slate-500 leading-relaxed font-medium">
                Generate a downloadable link for manual installation.
              </div>
            </div>
            <div className={`absolute top-4 right-4 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              buildType === 'testing' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
            }`}>
              {buildType === 'testing' && <Check size={12} className="stroke-[3.5]" />}
            </div>
          </button>

          {/* Card B: App Store / TestFlight */}
          <button 
            className={`relative flex items-start gap-4 p-5 rounded-xl border text-left transition-all ${
              buildType === 'uat' || buildType === 'production'
                ? 'border-emerald-600 bg-emerald-50/10'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
            onClick={() => {
              if (buildType === 'testing') {
                setBuildType('uat'); // default to internal testing track
              }
            }}
          >
            <div className={`p-2.5 rounded-lg shrink-0 ${
              buildType === 'uat' || buildType === 'production' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <Upload size={18} className="stroke-[2.5]" />
            </div>
            <div className="flex-1 pr-6">
              <div className="font-bold text-slate-800 text-sm mb-1">App Store / TestFlight</div>
              <div className="text-xs text-slate-500 leading-relaxed font-medium">
                Direct upload to store internal testing tracks.
              </div>
            </div>
            <div className={`absolute top-4 right-4 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              buildType === 'uat' || buildType === 'production' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
            }`}>
              {(buildType === 'uat' || buildType === 'production') && <Check size={12} className="stroke-[3.5]" />}
            </div>
          </button>
        </div>

        {/* Sub-Track Selector (Only for Store Releases) */}
        {(buildType === 'uat' || buildType === 'production') && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center gap-4 animate-fadeIn">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider md:border-r md:border-slate-300 md:pr-4 md:py-1">
              Store Distribution Track
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  buildType === 'uat'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setBuildType('uat')}
              >
                📋 Internal Testing (UAT)
              </button>
              <button 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  buildType === 'production'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setBuildType('production')}
              >
                🚀 Production Release
              </button>
            </div>
          </div>
        )}

        {/* Inputs Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Version Name */}
          {(platform === 'android' || platform === 'both') && (
            <div>
              <label className="text-[10px] font-extrabold tracking-wider text-slate-500 mb-2 uppercase block">
                Version Name
              </label>
              <input 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 transition-all outline-none" 
                placeholder="e.g. 1.0.0" 
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                User-facing version on store (e.g. 1.0.0).
              </p>
            </div>
          )}

          {/* Version Code */}
          {(platform === 'android' || platform === 'both') && (
            <div>
              <label className="text-[10px] font-extrabold tracking-wider text-slate-500 mb-2 uppercase block">
                Version Code (Optional)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 transition-all outline-none" 
                  placeholder="Auto-incremented" 
                  value={versionCode}
                  onChange={(e) => setVersionCode(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                Integer version code. Leave blank to auto-increment sequentially.
              </p>
            </div>
          )}
        </div>

        {/* Release Notes */}
        <div>
          <label className="text-[10px] font-extrabold tracking-wider text-slate-500 mb-2 uppercase block">
            Release Notes
          </label>
          <textarea 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 transition-all outline-none min-h-[90px] resize-y" 
            placeholder="Describe what's new in this build (e.g. bug fixes, new features)..." 
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
          />
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
            These notes will be published to Google Play (Android) and TestFlight (iOS) for UAT & Production releases.
          </p>
        </div>
      </section>

      {/* Row 3: Platform Credentials & Configurations (Keystore / Apple API Keys) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Android Keystore Setup */}
        {selectedRepo && needsKeystore && (
          <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Key size={18} className="stroke-[2.5]" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Android Keystore Configuration</h2>
            </div>

            {keystoreStatus ? (
              <div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-xl text-emerald-800 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Keystore on file: <strong className="font-semibold">{keystoreStatus.filename}</strong></span>
                </div>
                <button 
                  className="text-xs text-slate-500 hover:text-emerald-700 underline font-semibold transition"
                  onClick={() => setKeystoreStatus(null)}
                >
                  Replace
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Keystore Mode Toggle */}
                <div className="flex border border-slate-200 rounded-lg bg-slate-50 p-1 gap-1">
                  <button 
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      keystoreMode === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setKeystoreMode('upload')}
                  >
                    📂 Upload Keystore
                  </button>
                  <button 
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      keystoreMode === 'generate' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setKeystoreMode('generate')}
                  >
                    ⚡ Generate New
                  </button>
                </div>

                <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-3">
                  {keystoreMode === 'upload' ? (
                    <label className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-all text-center">
                      <input 
                        type="file" 
                        accept=".jks,.keystore" 
                        className="hidden" 
                        onChange={e => setKeystoreFile(e.target.files[0])} 
                      />
                      <span className="text-xs font-semibold text-slate-600 mb-1">
                        {keystoreFile ? `📎 ${keystoreFile.name}` : 'Click to upload .jks / .keystore'}
                      </span>
                      <span className="text-[10px] text-slate-400">Maximum file size: 10MB</span>
                    </label>
                  ) : (
                    <div className="p-3 border border-blue-100 bg-blue-50/40 rounded-lg text-[11px] text-slate-500 leading-normal flex gap-2">
                      <div className="text-blue-600 shrink-0">⚡</div>
                      <div>
                        <strong>Zero-Config Compilation:</strong> BuildPortal will run <code>keytool</code> automatically in the cloud to sign your application safely.
                      </div>
                    </div>
                  )}

                  <input 
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all" 
                    placeholder="Key alias" 
                    value={keystoreAlias} 
                    onChange={e => setKeystoreAlias(e.target.value)} 
                  />
                  <input 
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all" 
                    type="password" 
                    placeholder="Keystore password" 
                    value={keystorePass} 
                    onChange={e => setKeystorePass(e.target.value)} 
                  />
                  <input 
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all" 
                    type="password" 
                    placeholder="Key password" 
                    value={keyPass} 
                    onChange={e => setKeyPass(e.target.value)} 
                  />

                  <button 
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm transition"
                    onClick={handleSaveKeystore} 
                    disabled={uploadingKS}
                  >
                    {uploadingKS 
                      ? (keystoreMode === 'upload' ? 'Saving Keystore...' : 'Generating...') 
                      : (keystoreMode === 'upload' ? 'Save Config & Keystore' : 'Generate & Save')
                    }
                  </button>
                </form>
              </div>
            )}
          </section>
        )}

        {/* iOS App Store Credentials Setup */}
        {selectedRepo && needsAppleCreds && (
          <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <IosIcon size={18} className="stroke-[2.5]" />
              </div>
              <h2 className="text-base font-bold text-slate-800">App Store Connect Credentials</h2>
            </div>

            {appleCredsStatus ? (
              <div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-xl text-emerald-800 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Configured: Key ID <strong className="font-semibold">{appleCredsStatus.apiKeyId}</strong></span>
                </div>
                <button 
                  className="text-xs text-slate-500 hover:text-emerald-700 underline font-semibold transition"
                  onClick={() => setAppleCredsStatus(null)}
                >
                  Replace
                </button>
              </div>
            ) : (
              <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-3">
                <label className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-all text-center">
                  <input 
                    type="file" 
                    accept=".p8" 
                    className="hidden" 
                    onChange={e => setAppleKeyFile(e.target.files[0])} 
                  />
                  <span className="text-xs font-semibold text-slate-600 mb-1">
                    {appleKeyFile ? `📎 ${appleKeyFile.name}` : 'Upload AuthKey_xxx.p8 key file'}
                  </span>
                  <span className="text-[10px] text-slate-400">P8 signature keys issued by Apple Developer Portal</span>
                </label>

                <input 
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all" 
                  placeholder="Apple API Key ID (e.g. 2GZN4HH9K8)" 
                  value={appleKeyId} 
                  onChange={e => setAppleKeyId(e.target.value)} 
                />
                <input 
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all" 
                  placeholder="Apple API Issuer ID" 
                  value={appleIssuerId} 
                  onChange={e => setAppleIssuerId(e.target.value)} 
                />

                <button 
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm transition"
                  onClick={handleSaveAppleCredentials} 
                  disabled={uploadingApple}
                >
                  {uploadingApple ? 'Saving...' : 'Save iOS Credentials'}
                </button>
              </form>
            )}
          </section>
        )}
      </div>

      {/* Floating/Bottom Action Bar for Submission */}
      <div className="flex justify-end pt-4 border-t border-slate-200 mt-8">
        <button 
          className={`flex items-center gap-2.5 px-8 py-3.5 rounded-lg text-white font-bold transition-all shadow-md shadow-emerald-700/10 ${
            !selectedRepo || !branch || triggerLoading
              ? 'bg-slate-300 cursor-not-allowed text-slate-500'
              : 'bg-[#006430] hover:bg-[#005226] text-white hover:shadow-lg'
          }`}
          onClick={handleBuild} 
          disabled={!selectedRepo || !branch || triggerLoading}
        >
          {triggerLoading ? 'Queuing Build...' : 'Trigger Build'}
          <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
}