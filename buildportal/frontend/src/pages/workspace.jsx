import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';
import { Bell, HelpCircle, Search, Settings, Play, GitBranch } from 'lucide-react';

export default function WorkspacePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useSelector(s => s.auth);

  const [workspaces, setWorkspaces] = useState([]);
  const [latestBuilds, setLatestBuilds] = useState({});

  useEffect(() => {
    if (!user) return;
    const provider = user.provider || 'github';

    api.get(`/repos/${provider}`)
      .then(({ data }) => {
        const repos = data.repos || [];

        api.get('/builds?limit=100')
          .then(({ data: buildsData }) => {
            const builds = buildsData.builds || [];

            const mappedWorkspaces = [];
            repos.forEach(r => {
              const wsBuilds = builds.filter(b =>
                (b.repoUrl && b.repoUrl.toLowerCase().includes(r.fullName.toLowerCase())) ||
                (b.projectName && b.projectName.toLowerCase() === r.name.toLowerCase())
              );

              // Only include repositories that have triggered builds
              if (wsBuilds.length > 0) {
                const platform = wsBuilds[0].platform.toUpperCase();
                mappedWorkspaces.push({
                  id: r.id,
                  name: r.name,
                  platform: platform === 'BOTH' ? 'BOTH' : platform,
                  repo: r.fullName
                });
              }
            });

            setWorkspaces(mappedWorkspaces);

            const latest = {};
            mappedWorkspaces.forEach(ws => {
              const wsBuilds = builds.filter(b =>
                (b.repoUrl && b.repoUrl.toLowerCase().includes(ws.repo.toLowerCase())) ||
                (b.projectName && b.projectName.toLowerCase() === ws.name.toLowerCase())
              );
              if (wsBuilds.length > 0) {
                latest[ws.id] = wsBuilds[0];
              }
            });
            setLatestBuilds(latest);
          })
          .catch(err => {
            console.error('Failed to fetch builds for workspaces', err);
          });
      })
      .catch(err => {
        console.error('Failed to fetch workspaces from provider', err);
      });
  }, [user]);

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ws.repo.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* Left Side: Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', color: '#00388d', ...Fonts.Bold }}>
          <span>Workspaces</span>
        </div>

        {/* Middle/Right: Search bar & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1, justifyContent: 'flex-end' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', maxWidth: '320px', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', color: '#64748b' }} />
            <input
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                borderRadius: '9999px',
                paddingLeft: '40px',
                paddingRight: '16px',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                ...Fonts.Regular
              }}
            />
          </div>

          {/* Actions */}
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
      </div>

      {/* ── Page Content Container ── */}
      <div style={{ padding: '20px var(--space-8)', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto' }}>
          {/* Header Section */}
          <div style={{ marginBottom: '32px', marginLeft: 'calc(-1 * var(--space-12))' }}>
            <h1 style={{ fontSize: '32px', ...Fonts.ExtraBold, color: '#0f172a', marginBottom: '8px', lineHeight: '1.2' }}>
              Connected Workspaces
            </h1>
            <p style={{ fontSize: '15px', color: '#64748b', ...Fonts.Regular }}>
              Manage your integrated source control repositories and build environments.
            </p>
          </div>

          {/* Workspaces List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredWorkspaces.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '64px 24px',
                background: Colors.surface,
                border: `1px solid ${Colors.border}`,
                borderRadius: '12px',
                color: '#64748b'
              }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔍</span>
                <p style={{ fontSize: '15px', ...Fonts.Medium }}>No workspaces match "{searchQuery}"</p>
              </div>
            ) : (
              filteredWorkspaces.map(ws => (
                <div
                  key={ws.id}
                  className="workspace-card"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                  }}
                >
                  {/* Left Side Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px', ...Fonts.Bold, color: '#0f172a' }}>
                        {ws.name}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        ...Fonts.Bold,
                        letterSpacing: '0.05em',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: ws.platform === 'ANDROID' ? '#e6f4ea' : ws.platform === 'IOS' ? '#edf3fe' : '#fef7e0',
                        color: ws.platform === 'ANDROID' ? '#137333' : ws.platform === 'IOS' ? '#0c5df4' : '#e2a100',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}>
                        {ws.platform}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#64748b', fontFamily: Fonts.Regular.fontFamily }}>
                      {ws.repo}
                    </span>

                    {/* Latest Build Details */}
                    {latestBuilds[ws.id] ? (
                      <div style={{
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px dashed #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                          <span style={{ color: '#64748b', ...Fonts.Medium }}>Last Build:</span>
                          <span style={{ color: '#0f172a', ...Fonts.Bold }}>#MB-{latestBuilds[ws.id].buildNumber}</span>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            ...Fonts.Bold,
                            backgroundColor:
                              latestBuilds[ws.id].status === 'success' ? '#e6f4ea' :
                                latestBuilds[ws.id].status === 'failed' ? '#fce8e6' :
                                  latestBuilds[ws.id].status === 'building' ? '#e8f0fe' :
                                    latestBuilds[ws.id].status === 'queued' ? '#fef7e0' : '#f1f3f4',
                            color:
                              latestBuilds[ws.id].status === 'success' ? '#137333' :
                                latestBuilds[ws.id].status === 'failed' ? '#c5221f' :
                                  latestBuilds[ws.id].status === 'building' ? '#1a73e8' :
                                    latestBuilds[ws.id].status === 'queued' ? '#b06000' : '#5f6368',
                          }}>
                            {latestBuilds[ws.id].status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: '#64748b' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <GitBranch size={12} style={{ color: '#64748b' }} />
                            {latestBuilds[ws.id].branch}
                          </span>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(latestBuilds[ws.id].createdAt))} ago</span>
                          {latestBuilds[ws.id].duration && (
                            <>
                              <span>·</span>
                              <span>Duration: {Math.floor(latestBuilds[ws.id].duration / 60)}m {Math.round(latestBuilds[ws.id].duration % 60)}s</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px dashed #e2e8f0',
                        fontSize: '12px',
                        color: '#94a3b8',
                        fontStyle: 'italic'
                      }}>
                        No builds triggered yet
                      </div>
                    )}
                  </div>

                  {/* Right Side Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/workspace/settings?id=${ws.id}&name=${ws.name}&repo=${ws.repo}`);
                      }}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1px solid #dadce0',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                      title="Settings"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const latestBuild = latestBuilds[ws.id];
                        if (latestBuild) {
                          const params = new URLSearchParams({
                            repo: ws.repo,
                            branch: latestBuild.branch,
                            platform: latestBuild.platform,
                            buildType: latestBuild.buildType,
                            androidFormat: latestBuild.androidFormat || '',
                            versionName: latestBuild.versionName || '',
                            versionCode: latestBuild.versionCode || '',
                            releaseNotes: latestBuild.releaseNotes || ''
                          });
                          navigate(`/build?${params.toString()}`);
                        } else {
                          navigate(`/build?repo=${ws.repo}`);
                        }
                      }}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#00875a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#00703c'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#00875a'}
                      title="Trigger Build"
                    >
                      <Play size={18} fill="#ffffff" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStyles() {
  return {};
}
