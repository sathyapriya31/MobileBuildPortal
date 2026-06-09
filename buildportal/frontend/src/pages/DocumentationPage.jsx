import { useState } from 'react';
import Colors from '../config/colors.js';
import Fonts from '../config/fonts.js';
import {
  FileText,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  BookOpen,
  Info
} from 'lucide-react';

// Custom icons
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

const yamlSnippet = `# BuildPortal Configuration File
# Save as 'buildportal.yml' in the root of your repository

# Android build configuration
android:
  # (Optional) Saved keystore filename for code signing
  keystore_filename: "app-keystore.jks"
  keystore_alias: "my-alias"
  # Format of target bundle: 'apk' (default) or 'aab'
  android_format: "apk"

# iOS Xcode Cloud build configuration
xcode_cloud:
  # Name of your target Xcode Cloud workflow in App Store Connect
  workflow_name: "WebLaunchHub Release"
  # (Optional) Specify a workflow ID directly
  # workflow_id: "your-workflow-id-here"`;

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'android' | 'ios'
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: Colors.bg, ...Fonts.Regular }}>
      {/* ── Header Bar ── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={20} style={{ color: '#0c5df4' }} />
          <span style={{ fontSize: '18px', color: '#00388d', ...Fonts.Bold }}>
            Spritle Paddock Documentation
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button style={{ background: 'none', border: 'none', color: Colors.headerIcon, cursor: 'pointer', padding: 0 }}>
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Documentation tabs */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #dadce0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              gap: '24px',
              borderBottom: '1px solid #e2e8f0',
              padding: '20px 24px 0 24px',
              backgroundColor: '#ffffff'
            }}>
              <button
                onClick={() => setActiveTab('config')}
                style={{
                  paddingBottom: '12px',
                  fontSize: '14px',
                  ...Fonts.Bold,
                  color: activeTab === 'config' ? '#0c5df4' : '#64748b',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'config' ? '3px solid #0c5df4' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FileText size={16} />
                Repository Config (YAML)
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
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AndroidIcon size={16} />
                Android Play Store Setup
              </button>
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
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <IosIcon size={16} />
                iOS TestFlight Setup
              </button>
            </div>

            {/* ── Tab Content ── */}
            <div style={{ padding: '30px 24px' }}>

              {/* ── Tab 1: Repository configuration ── */}
              {activeTab === 'config' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>Project Configuration</h2>
                    <p style={{ fontSize: '14px', color: '#5f6368', margin: 0, lineHeight: '1.6' }}>
                      To trigger builds on BuildPortal, you need to add a configuration file named <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: '650' }}>buildportal.yml</code> (or <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>.buildportal.yml</code>, <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>spritle.yaml</code>) in the root of your git repository.
                    </p>
                  </div>

                  {/* Code snippet card */}
                  <div style={{ border: '1px solid #dadce0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #dadce0', backgroundColor: '#f1f5f9' }}>
                      <span style={{ fontSize: '12px', ...Fonts.Bold, color: '#64748b', fontFamily: 'monospace' }}>buildportal.yml</span>
                      <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0c5df4', border: 'none', background: 'none', cursor: 'pointer', ...Fonts.Bold }}>
                        {copied ? <Check size={14} style={{ color: '#137333' }} /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy Template'}
                      </button>
                    </div>
                    <pre style={{ margin: 0, padding: '16px', fontSize: '13px', color: '#0f172a', overflowX: 'auto', fontFamily: 'Courier New, Courier, monospace', lineHeight: '1.5' }}>
                      {yamlSnippet}
                    </pre>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: '#edf3fe',
                    borderRadius: '8px',
                    color: '#0c5df4',
                    fontSize: '13px',
                    ...Fonts.Medium
                  }}>
                    <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ ...Fonts.Bold }}>How OAuth Workspace Connections Work:</span>
                      <span style={{ color: '#5f6368', lineHeight: '1.5' }}>
                        When you connect your workspace using GitHub or GitLab, BuildPortal checks out the repository dynamically on demand, reads your config file, and automates Play Store (GHA workflow runs) or Xcode Cloud triggers.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 2: Android Setup ── */}
              {activeTab === 'android' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>Android Play Store Setup</h2>
                    <p style={{ fontSize: '14px', color: '#5f6368', margin: 0, lineHeight: '1.6' }}>
                      Follow these steps to configure your Android app for code signing and publishing to Google Play Store internal tracks.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4ea', color: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', ...Fonts.Bold, flexShrink: 0 }}>1</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', ...Fonts.Bold, color: '#1e293b' }}>Add Keystore in Workspace Settings</span>
                        <span style={{ fontSize: '13px', color: '#5f6368', lineHeight: '1.5' }}>
                          Go to <strong>Connected workspace &rarr; Settings &rarr; Android Keystores</strong>. You can either upload an existing <code style={{ backgroundColor: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>.keystore</code> file or use the <strong>Generate New Keystore</strong> utility to run <code style={{ backgroundColor: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>keytool</code> and secure your workspace signing identity automatically.
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4ea', color: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', ...Fonts.Bold, flexShrink: 0 }}>2</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', ...Fonts.Bold, color: '#1e293b' }}>Google Play Store Credentials</span>
                        <span style={{ fontSize: '13px', color: '#5f6368', lineHeight: '1.6' }}>
                          To automate publication to Google Play Store Internal Testing, complete the following setup:
                          <ul style={{ paddingLeft: '20px', marginTop: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li>
                              <strong>Create Service Account:</strong> Go to the Google Cloud Console, navigate to <strong>IAM &amp; Admin &rarr; Service Accounts</strong>, and click <strong>Create Service Account</strong>.
                            </li>
                            <li>
                              <strong>Generate Private Key:</strong> Select the created service account, go to the <strong>Keys</strong> tab, click <strong>Add Key &rarr; Create new key</strong>, choose <strong>JSON</strong>, and download the generated file.
                            </li>
                            <li>
                              <strong>Link in Google Play Console:</strong> Open Play Console, go to <strong>Users &amp; permissions</strong>, click <strong>Invite new users</strong>, paste the service account email address, and grant it permissions to <strong>Release to testing tracks</strong> and <strong>Manage releases</strong> for your target application.
                            </li>
                            <li>
                              <strong>Add Secret to Repository:</strong> Save the contents of the downloaded JSON file as a secret named <code>BP_PLAY_SERVICE_ACCOUNT_JSON</code> in your GitHub repository secrets. This will be read by the GitHub Action workflow to deploy your bundle.
                            </li>
                          </ul>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4ea', color: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', ...Fonts.Bold, flexShrink: 0 }}>3</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', ...Fonts.Bold, color: '#1e293b' }}>Triggering Builds</span>
                        <span style={{ fontSize: '13px', color: '#5f6368', lineHeight: '1.5' }}>
                          When initiating a <strong>Play Store Internal Testing</strong> build, make sure to specify a custom <strong>Version Name</strong> (e.g. `1.0.0`), a unique <strong>Version Code</strong> (which must exceed all previous uploads), and descriptive **Release Notes**. BuildPortal will sign the binary and push it straight to Google Play.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 16px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    color: '#15803d',
                    fontSize: '13px',
                    ...Fonts.Medium
                  }}>
                    <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                    <span>All keystore binaries and code-signing credentials are fully encrypted at rest.</span>
                  </div>
                </div>
              )}

              {/* ── Tab 3: iOS Setup ── */}
              {activeTab === 'ios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', ...Fonts.Bold, color: '#1e293b', margin: 0 }}>iOS TestFlight Setup (Xcode Cloud)</h2>
                    <p style={{ fontSize: '14px', color: '#5f6368', margin: 0, lineHeight: '1.6' }}>
                      Configure Xcode Cloud triggers and App Store Connect API keys to distribute builds to TestFlight automatically.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#edf3fe', color: '#0c5df4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', ...Fonts.Bold, flexShrink: 0 }}>1</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', ...Fonts.Bold, color: '#1e293b' }}>Generate Apple App Store Connect API Key</span>
                        <span style={{ fontSize: '13px', color: '#5f6368', lineHeight: '1.5' }}>
                          Log into the Apple Developer portal, go to <strong>App Store Connect &rarr; Users and Access &rarr; Keys</strong>. Create a new API Key with Developer access. Download the private key file (e.g. <code style={{ backgroundColor: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>AuthKey_XXXXXX.p8</code>) and copy the **Key ID** and **Issuer ID**.
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#edf3fe', color: '#0c5df4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', ...Fonts.Bold, flexShrink: 0 }}>2</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', ...Fonts.Bold, color: '#1e293b' }}>Save Credentials in BuildPortal</span>
                        <span style={{ fontSize: '13px', color: '#5f6368', lineHeight: '1.5' }}>
                          Navigate to <strong>Connected workspace &rarr; Settings &rarr; App Store Connect Credentials</strong>. Upload your <code style={{ backgroundColor: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>.p8</code> private key file, fill in the Key ID, and Issuer ID. BuildPortal uses these dynamically to sign JWT tokens to talk to Xcode Cloud.
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#edf3fe', color: '#0c5df4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', ...Fonts.Bold, flexShrink: 0 }}>3</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', ...Fonts.Bold, color: '#1e293b' }}>Establish Xcode Cloud Workflows</span>
                        <span style={{ fontSize: '13px', color: '#5f6368', lineHeight: '1.6' }}>
                          To configure and link Xcode Cloud workflows, follow these steps:
                          <ul style={{ paddingLeft: '20px', marginTop: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li>
                              <strong>Create Workflow in Xcode:</strong> Open your iOS project workspace (<code>.xcworkspace</code>) in Xcode on macOS. Navigate to the <strong>Report Navigator &rarr; Cloud</strong> tab, click <strong>Get Started</strong>, select your target app bundle ID, and click <strong>Create Workflow</strong>.
                            </li>
                            <li>
                              <strong>Configure Trigger &amp; SCM:</strong> In the workflow configurations, add a <strong>Trigger</strong> (e.g., a git trigger set to start on manual runs or branch pushes). Ensure your repository (GitHub/GitLab) is connected and authorized in App Store Connect.
                            </li>
                            <li>
                              <strong>Set Build Actions:</strong> Define the workflow action to <strong>Archive</strong> the iOS application and specify the appropriate TestFlight (Internal/External) post-action distribution group.
                            </li>
                            <li>
                              <strong>Link to Config File:</strong> Note the exact name of the workflow you created (e.g., <code>WebLaunchHub Release</code>) and define it in your <code>buildportal.yml</code> file under the <code>xcode_cloud.workflow_name</code> field.
                            </li>
                          </ul>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#edf3fe', color: '#0c5df4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', ...Fonts.Bold, flexShrink: 0 }}>4</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', ...Fonts.Bold, color: '#1e293b' }}>TestFlight Release Notes</span>
                        <span style={{ fontSize: '13px', color: '#5f6368', lineHeight: '1.5' }}>
                          When triggering an iOS build, write your custom release notes. Once Xcode Cloud finishes building and Apple registers the build, BuildPortal will automatically query App Store Connect and update the TestFlight "What to Test" field with your custom release notes!
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
