import { useState } from "react";
import Colors from "../config/colors.js";
import Fonts from "../config/fonts.js";
import {
  FileText,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  BookOpen,
  Info,
} from "lucide-react";

// Custom icons
const AndroidIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M17.5 10c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-11 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm11.5 1.5c0-.8-.7-1.5-1.5-1.5H7.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5h1v3c0 .6.4 1 1 1s1-.4 1-1v-3h3v3c0 .6.4 1 1 1s1-.4 1-1v-3h1c.8 0 1.5-.7 1.5-1.5v-6zm-1.8-3.7l1.3-1.3c.4-.4.4-1 0-1.4s-1-.4-1.4 0l-1.5 1.5c-.8-.3-1.7-.5-2.6-.5s-1.8.2-2.6.5L9.3 5.1c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4l1.3 1.3C7.6 8.7 6.7 10 6.2 11.5h11.6c-.5-1.5-1.4-2.8-2.6-3.7z" />
  </svg>
);

const IosIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-1 2.94.9.07 2.01-.52 2.83-1.33z" />
  </svg>
);

const yamlSnippet = `# BuildPortal Configuration File
# Save as 'buildportal.yml' in the root of your repository

# iOS Xcode Cloud build configuration
xcode_cloud:
  # Name of your target Xcode Cloud workflow in App Store Connect
  workflow_name: "WebLaunchHub Release"
  # (Optional) Specify a workflow ID directly
  # workflow_id: "your-workflow-id-here"`;

const androidWorkflowSnippet = `##############################################################################
# BuildPortal — Android Build Workflow
#
# INSTRUCTIONS:
#   1. Copy this file to your repository at:
#      .github/workflows/buildportal-android.yml
#   2. Add the following Repository Secrets in GitHub → Settings → Secrets:
#      - BP_AWS_ACCESS_KEY_ID      : Your AWS S3 access key
#      - BP_AWS_SECRET_ACCESS_KEY  : Your AWS S3 secret key
#      - BP_S3_BUCKET_NAME         : Your S3 bucket name (e.g. buildportal-artifacts)
#      - BP_AWS_REGION             : Your S3 region (e.g. ap-south-1)
#      - BP_PLAY_SERVICE_ACCOUNT_JSON : Your Google Play Console Service Account JSON (UAT track only)
#
#   The callback_url and callback_secret inputs are injected automatically
#   by BuildPortal when it dispatches the workflow — do not set them manually.
##############################################################################

name: BuildPortal Android Build

on:
  workflow_dispatch:
    inputs:
      build_id:
        description: 'BuildPortal internal build ID'
        required: true
        type: string
      version_code:
        description: 'Android version code (integer)'
        required: false
        default: '1'
        type: string
      version_name:
        description: 'Android version name (e.g. 1.0.0)'
        required: false
        default: '1.0.0'
        type: string
      build_type:
        description: 'Build type: testing | uat | production'
        required: false
        default: 'testing'
        type: string
      android_format:
        description: 'Output format: apk | aab'
        required: false
        default: 'apk'
        type: string
      release_notes:
        description: 'Release notes for the build'
        required: false
        default: 'New build triggered from BuildPortal.'
        type: string
      callback_url:
        description: 'BuildPortal backend callback URL'
        required: true
        type: string
      callback_secret:
        description: 'Secret to authenticate the callback'
        required: true
        type: string
      keystore_exists:
        description: 'Whether keystore configuration exists'
        required: false
        default: 'false'
        type: string
      keystore_url:
        description: 'Secure presigned URL to download keystore JKS file'
        required: false
        type: string
      keystore_filename:
        description: 'Original keystore filename'
        required: false
        default: 'release.keystore'
        type: string
      keystore_password:
        description: 'Keystore password'
        required: false
        type: string
      keystore_alias:
        description: 'Key alias'
        required: false
        type: string
      keystore_key_password:
        description: 'Key password'
        required: false
        type: string

jobs:
  build-android:
    name: Build Android (\${{ inputs.android_format }})
    runs-on: ubuntu-latest

    steps:
      # ── 1. Checkout ────────────────────────────────────────────────────────
      - name: Checkout repository
        uses: actions/checkout@v4

      # ── 1.5 Notify BuildPortal (started) ──────────────────────────────────
      - name: Notify BuildPortal (started)
        run: |
          JOBS_RES=\$(curl -s -H "Authorization: token \${{ secrets.GITHUB_TOKEN }}" \\
            -H "Accept: application/vnd.github+json" \\
            "\${{ github.api_url }}/repos/\${{ github.repository }}/actions/runs/\${{ github.run_id }}/jobs")
          JOB_URL=\$(echo "\$JOBS_RES" | jq -r '.jobs[0].html_url // empty')
          if [ -z "\$JOB_URL" ]; then
            JOB_URL="\${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }}"
          fi

          curl -s -X POST "\${{ inputs.callback_url }}" \\
            -H "Content-Type: application/json" \\
            -d "{
              \\"secret\\": \\"\${{ inputs.callback_secret }}\\",
              \\"buildId\\": \\"\${{ inputs.build_id }}\\",
              \\"status\\": \\"building\\",
              \\"githubRunUrl\\": \\"\$JOB_URL\\"
            }"

      # ── 2. Set up Java (required by Gradle) ─────────────────────────────
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      # ── 3. Install Node.js (for React Native / Expo projects) ────────────
      - name: Set up Node.js
        if: hashFiles('package.json') != ''
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # ── 4. Install JavaScript dependencies ───────────────────────────────
      - name: Install JS dependencies
        if: hashFiles('package.json') != ''
        run: |
          if [ -f yarn.lock ]; then
            yarn install --frozen-lockfile
          elif [ -f pnpm-lock.yaml ]; then
            npm install -g pnpm && pnpm install --frozen-lockfile
          elif [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi

      # ── 5. Make gradlew executable ───────────────────────────────────────
      - name: Make gradlew executable
        run: |
          if [ -f android/gradlew ]; then
            chmod +x android/gradlew
          elif [ -f gradlew ]; then
            chmod +x gradlew
          fi

      # ── 6. Set version code and version name ────────────────────────────
      - name: Set version in build.gradle
        run: |
          GRADLE_FILE="android/app/build.gradle"
          if [ ! -f "\$GRADLE_FILE" ]; then
            GRADLE_FILE="app/build.gradle"
          fi
          if [ -f "\$GRADLE_FILE" ]; then
            sed -i "s/versionCode [0-9]*/versionCode \${{ inputs.version_code }}/" "\$GRADLE_FILE"
            sed -i "s/versionName \\"[^\\"]*\\"/versionName \\"\${{ inputs.version_name }}\\"/" "\$GRADLE_FILE"
            echo "Updated versionCode=\${{ inputs.version_code }} versionName=\${{ inputs.version_name }} in \$GRADLE_FILE"
          fi

      # ── 6.5. Download Signing Keystore ──────────────────────────────────
      - name: Download Keystore from S3
        if: \${{ inputs.keystore_exists == 'true' }}
        run: |
          mkdir -p android/app
          curl -s -L -o "android/app/\${{ inputs.keystore_filename }}" "\${{ inputs.keystore_url }}"
          echo "Downloaded keystore file and saved to android/app/\${{ inputs.keystore_filename }}"

      # ── 7. Build APK or AAB ──────────────────────────────────────────────
      - name: Build Android (\${{ inputs.android_format }})
        id: compile
        run: |
          if [ -f android/gradlew ]; then
            GRADLE="./android/gradlew"
            GRADLE_DIR="android"
          else
            GRADLE="./gradlew"
            GRADLE_DIR="."
          fi

          if [ "\${{ inputs.keystore_exists }}" = "true" ]; then
            KEYSTORE_PATH="\$(pwd)/android/app/\${{ inputs.keystore_filename }}"
            echo "Building signed \${{ inputs.android_format }} using injected credentials from \$KEYSTORE_PATH..."
            if [ "\${{ inputs.android_format }}" = "aab" ]; then
              (cd "\$GRADLE_DIR" && ./gradlew bundleRelease --no-daemon \\
                -Pandroid.injected.signing.store.file="\$KEYSTORE_PATH" \\
                -Pandroid.injected.signing.store.password="\${{ inputs.keystore_password }}" \\
                -Pandroid.injected.signing.key.alias="\${{ inputs.keystore_alias }}" \\
                -Pandroid.injected.signing.key.password="\${{ inputs.keystore_key_password }}")
            else
              (cd "\$GRADLE_DIR" && ./gradlew assembleRelease --no-daemon \\
                -Pandroid.injected.signing.store.file="\$KEYSTORE_PATH" \\
                -Pandroid.injected.signing.store.password="\${{ inputs.keystore_password }}" \\
                -Pandroid.injected.signing.key.alias="\${{ inputs.keystore_alias }}" \\
                -Pandroid.injected.signing.key.password="\${{ inputs.keystore_key_password }}")
            fi
          else
            echo "Building unsigned/debug-signed \${{ inputs.android_format }}..."
            if [ "\${{ inputs.android_format }}" = "aab" ]; then
              (cd "\$GRADLE_DIR" && ./gradlew bundleRelease --no-daemon)
            else
              (cd "$GRADLE_DIR" && ./gradlew assembleRelease --no-daemon)
            fi
          fi

      # ── 8. Locate the build artifact ─────────────────────────────────────
      - name: Locate build artifact
        id: locate
        run: |
          if [ "\${{ inputs.android_format }}" = "aab" ]; then
            ARTIFACT=\summit=$(find . -name "app-release.aab" 2>/dev/null | head -n 1)
          else
            ARTIFACT=\$(find . -name "app-release.apk" 2>/dev/null | head -n 1)
          fi
          if [ -z "\$ARTIFACT" ]; then
            echo "ERROR: Build artifact not found!" >&2
            exit 1
          fi
          echo "artifact_path=\$ARTIFACT" >> "\$GITHUB_OUTPUT"
          echo "Found artifact: \$ARTIFACT"

      # ── 8.5. Extract package name & upload to Google Play Store (UAT & Production) ──
      - name: Extract Android package name
        if: \${{ inputs.build_type != 'testing' }}
        id: pkg
        run: |
          GRADLE_FILE="android/app/build.gradle"
          if [ ! -f "\$GRADLE_FILE" ]; then
            GRADLE_FILE="app/build.gradle"
          fi
          
          PACKAGE_NAME=""
          if [ -f "\$GRADLE_FILE" ]; then
            PACKAGE_NAME=\$(grep -o "applicationId\\s*['\\"][^'\\"]*['\\"]" "\$GRADLE_FILE" | head -n 1 | sed -E "s/applicationId\\s*['\\"]([^'\\"]*)['\\"]/\\1/")
            if [ -z "\$PACKAGE_NAME" ]; then
              PACKAGE_NAME=\$(grep -o "applicationId\\s*=\\s*['\\"][^'\\"]*['\\"]" "\$GRADLE_FILE" | head -n 1 | sed -E "s/applicationId\\s*=\\s*['\\"]([^'\\"]*)['\\"]/\\1/")
            fi
          fi
          
          if [ -z "\$PACKAGE_NAME" ]; then
            echo "applicationId not found in build.gradle. Falling back to default NearMind package."
            PACKAGE_NAME="com.spritle.nearmind"
          fi
          
          echo "Parsed Package Name: \$PACKAGE_NAME"
          echo "package_name=\$PACKAGE_NAME" >> "\$GITHUB_OUTPUT"

      - name: Create dynamic release notes file
        if: \${{ inputs.build_type != 'testing' }}
        run: |
          mkdir -p distribution/whatsnew
          echo "\${{ inputs.release_notes }}" > distribution/whatsnew/whatsnew-en-US
          echo "Created dynamic release notes file at distribution/whatsnew/whatsnew-en-US"

      - name: Upload to Google Play Store (UAT & Production Release only)
        if: \${{ inputs.build_type != 'testing' }}
        id: play
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: \${{ secrets.BP_PLAY_SERVICE_ACCOUNT_JSON }}
          packageName: \${{ steps.pkg.outputs.package_name }}
          releaseFiles: \${{ steps.locate.outputs.artifact_path }}
          track: internal
          whatsNewDirectory: distribution/whatsnew

      # ── 9. Upload artifact to BuildPortal ────────────────────────────────
      - name: Upload artifact to BuildPortal
        id: upload
        run: |
          FILE="\${{ steps.locate.outputs.artifact_path }}"
          FILENAME=\$(basename "\$FILE")
          CALLBACK_URL="\${{ inputs.callback_url }}"
          UPLOAD_URL="\${CALLBACK_URL%/callback}/upload"

          echo "Uploading \$FILE to \$UPLOAD_URL..."
          RESPONSE=\$(curl -s -S -F "file=@\$FILE" \\
            -F "secret=\${{ inputs.callback_secret }}" \\
            -F "buildId=\${{ inputs.build_id }}" \\
            -F "platform=android" \\
            "\$UPLOAD_URL")

          echo "Response: \$RESPONSE"
          S3_KEY=\$(echo "\$RESPONSE" | grep -o '"s3Key":"[^"]*' | grep -o '[^"]*$')
          if [ -z "\$S3_KEY" ]; then
            echo "ERROR: Artifact upload to BuildPortal failed!" >&2
            exit 1
          fi

          echo "s3_key=\${S3_KEY}" >> "\$GITHUB_OUTPUT"
          echo "Upload complete: s3_key=\${S3_KEY}"

      # ── 10. Get commit info ───────────────────────────────────────────────
      - name: Get commit info
        id: git
        run: |
          echo "sha=\$(git rev-parse --short HEAD)" >> "\$GITHUB_OUTPUT"
          echo "msg=\$(git log -1 --pretty=%s)" >> "\$GITHUB_OUTPUT"

      # ── 11. Callback to BuildPortal — SUCCESS ────────────────────────────
      - name: Notify BuildPortal (success)
        if: success()
        run: |
          curl -s -X POST "\${{ inputs.callback_url }}" \\
            -H "Content-Type: application/json" \\
            -d "{
              \\"secret\\": \\"\${{ inputs.callback_secret }}\\",
              \\"buildId\\": \\"\${{ inputs.build_id }}\\",
              \\"status\\": \\"success\\",
              \\"s3Key\\": \\"\${{ steps.upload.outputs.s3_key }}\\",
              \\"commitSha\\": \\"\${{ steps.git.outputs.sha }}\\",
              \\"commitMessage\\": \\"\${{ steps.git.outputs.msg }}\\",
              \\"githubRunUrl\\": \\"\${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }}\\"
            }"

      # ── 12. Callback to BuildPortal — FAILURE ────────────────────────────
      - name: Notify BuildPortal (failure)
        if: failure()
        run: |
          ERROR_MSG="GitHub Actions build failed. Check the workflow logs for details."
          if [ "\${{ steps.compile.outcome }}" = "failure" ]; then
            ERROR_MSG="Gradle compilation failed. Please verify your Android gradle configuration, dependencies, and code."
          elif [ "\${{ steps.locate.outcome }}" = "failure" ]; then
            ERROR_MSG="Locating compiled build artifact failed. The output binary could not be found."
          elif [ "\${{ steps.pkg.outcome }}" = "failure" ]; then
            ERROR_MSG="Extracting package name from build.gradle failed. Ensure applicationId is configured correctly."
          elif [ "\${{ steps.play.outcome }}" = "failure" ]; then
            ERROR_MSG="Google Play Store upload failed. Reason: Google Play does not accept APK format for new apps (use AAB) or service account permissions/JSON is invalid."
          elif [ "\${{ steps.upload.outcome }}" = "failure" ]; then
            ERROR_MSG="Uploading artifact to BuildPortal failed. Verify backend S3 configurations."
          fi

          ESCAPED_ERROR=\$(echo "$ERROR_MSG" | sed 's/"/\\\\"/g')

          curl -s -X POST "\${{ inputs.callback_url }}" \\
            -H "Content-Type: application/json" \\
            -d "{
              \\"secret\\": \\"\${{ inputs.callback_secret }}\\",
              \\"buildId\\": \\"\${{ inputs.build_id }}\\",
              \\"status\\": \\"failed\\",
              \\"error\\": \\"\$ESCAPED_ERROR\\",
              \\"githubRunUrl\\": \\"\${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }}\\"
            }"`;

const iosPostCloneSnippet = `#!/bin/sh

# Prevent CocoaPods from running as root
export COCOAPODS_ALLOW_ROOT=1

# Install Node.js (via Homebrew, pre-installed on Xcode Cloud)
brew install node

# Go to repository root and install JavaScript dependencies
cd ../..
npm install # or yarn install if using yarn

# Go back to ios directory and install CocoaPods
cd ios
pod install`;

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState("config"); // 'config' | 'android' | 'ios'
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [copiedIosScript, setCopiedIosScript] = useState(false);

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(yamlSnippet);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(androidWorkflowSnippet);
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2000);
  };

  const handleCopyIosScript = () => {
    navigator.clipboard.writeText(iosPostCloneSnippet);
    setCopiedIosScript(true);
    setTimeout(() => setCopiedIosScript(false), 2000);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: Colors.bg,
        ...Fonts.Regular,
      }}
    >
      {/* ── Header Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: Colors.headerBg,
          borderBottom: "1px solid " + Colors.headerBorder,
          padding: "16px 32px",
          height: "64px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <BookOpen size={20} style={{ color: "#0c5df4" }} />
          <span style={{ fontSize: "18px", color: "#00388d", ...Fonts.Bold }}>
            Spritle Paddock Documentation
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <button
            style={{
              background: "none",
              border: "none",
              color: Colors.headerIcon,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div
        style={{
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          flex: 1,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Documentation tabs */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #dadce0",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "24px",
                borderBottom: "1px solid #e2e8f0",
                padding: "20px 24px 0 24px",
                backgroundColor: "#ffffff",
              }}
            >
              <button
                onClick={() => setActiveTab("config")}
                style={{
                  paddingBottom: "12px",
                  fontSize: "14px",
                  ...Fonts.Bold,
                  color: activeTab === "config" ? "#0c5df4" : "#64748b",
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeTab === "config"
                      ? "3px solid #0c5df4"
                      : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  outline: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FileText size={16} />
                Repository Config (YAML)
              </button>
              <button
                onClick={() => setActiveTab("android")}
                style={{
                  paddingBottom: "12px",
                  fontSize: "14px",
                  ...Fonts.Bold,
                  color: activeTab === "android" ? "#0c5df4" : "#64748b",
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeTab === "android"
                      ? "3px solid #0c5df4"
                      : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  outline: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AndroidIcon size={16} />
                Android Play Store Setup
              </button>
              <button
                onClick={() => setActiveTab("ios")}
                style={{
                  paddingBottom: "12px",
                  fontSize: "14px",
                  ...Fonts.Bold,
                  color: activeTab === "ios" ? "#0c5df4" : "#64748b",
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeTab === "ios"
                      ? "3px solid #0c5df4"
                      : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  outline: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <IosIcon size={16} />
                iOS TestFlight Setup
              </button>
            </div>

            {/* ── Tab Content ── */}
            <div style={{ padding: "30px 24px" }}>
              {/* ── Tab 1: Repository configuration ── */}
              {activeTab === "config" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: "18px",
                        ...Fonts.Bold,
                        color: "#1e293b",
                        margin: 0,
                      }}
                    >
                      Project Configuration
                    </h2>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#5f6368",
                        margin: 0,
                        lineHeight: "1.6",
                      }}
                    >
                      Adding the configuration file{" "}
                      <code
                        style={{
                          backgroundColor: "#f1f5f9",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontFamily: "monospace",
                          fontWeight: "650",
                        }}
                      >
                        buildportal.yml
                      </code>{" "}
                      is <strong>optional</strong>. If you do not create it, BuildPortal will use default settings to run your builds. If you want to specify a custom Xcode Cloud workflow name, you must create this file in the root of your git repository and define it there.
                    </p>
                  </div>

                  {/* Code snippet card */}
                  <div
                    style={{
                      border: "1px solid #dadce0",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 16px",
                        borderBottom: "1px solid #dadce0",
                        backgroundColor: "#f1f5f9",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          ...Fonts.Bold,
                          color: "#64748b",
                          fontFamily: "monospace",
                        }}
                      >
                        buildportal.yml
                      </span>
                      <button
                        onClick={handleCopyConfig}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          color: "#0c5df4",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          ...Fonts.Bold,
                        }}
                      >
                        {copiedConfig ? (
                          <Check size={14} style={{ color: "#137333" }} />
                        ) : (
                          <Copy size={14} />
                        )}
                        {copiedConfig ? "Copied!" : "Copy Template"}
                      </button>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        padding: "16px",
                        fontSize: "13px",
                        color: "#0f172a",
                        overflowX: "auto",
                        fontFamily: "Courier New, Courier, monospace",
                        lineHeight: "1.5",
                      }}
                    >
                      {yamlSnippet}
                    </pre>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "16px",
                      backgroundColor: "#edf3fe",
                      borderRadius: "8px",
                      color: "#0c5df4",
                      fontSize: "13px",
                      ...Fonts.Medium,
                    }}
                  >
                    <Info
                      size={18}
                      style={{ flexShrink: 0, marginTop: "2px" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <span style={{ ...Fonts.Bold }}>
                        How OAuth Workspace Connections Work:
                      </span>
                      <span style={{ color: "#5f6368", lineHeight: "1.5" }}>
                        When you connect your workspace using GitHub or GitLab,
                        BuildPortal checks out the repository dynamically on
                        demand, reads your config file, and automates Play Store
                        (GHA workflow runs) or Xcode Cloud triggers.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 2: Android Setup ── */}
              {activeTab === "android" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: "18px",
                        ...Fonts.Bold,
                        color: "#1e293b",
                        margin: 0,
                      }}
                    >
                      Android Play Store Setup
                    </h2>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#5f6368",
                        margin: 0,
                        lineHeight: "1.6",
                      }}
                    >
                      Follow these steps to configure your Android app for code
                      signing and publishing to Google Play Store internal
                      tracks.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    {/* Step 1 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#e6f4ea",
                          color: "#137333",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          ...Fonts.Bold,
                          flexShrink: 0,
                        }}
                      >
                        1
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            ...Fonts.Bold,
                            color: "#1e293b",
                          }}
                        >
                          Add Keystore in Workspace Settings
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#5f6368",
                            lineHeight: "1.5",
                          }}
                        >
                          Go to{" "}
                          <strong>
                            Connected workspace &rarr; Settings &rarr; Android
                            Keystores
                          </strong>
                          . You can either upload an existing{" "}
                          <code
                            style={{
                              backgroundColor: "#f1f5f9",
                              padding: "2px 4px",
                              borderRadius: "4px",
                            }}
                          >
                            .keystore
                          </code>{" "}
                          file or use the <strong>Generate New Keystore</strong>{" "}
                          utility to run{" "}
                          <code
                            style={{
                              backgroundColor: "#f1f5f9",
                              padding: "2px 4px",
                              borderRadius: "4px",
                            }}
                          >
                            keytool
                          </code>{" "}
                          and secure your workspace signing identity
                          automatically.
                        </span>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#e6f4ea",
                          color: "#137333",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          ...Fonts.Bold,
                          flexShrink: 0,
                        }}
                      >
                        2
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            ...Fonts.Bold,
                            color: "#1e293b",
                          }}
                        >
                          Add GitHub Actions Workflow File
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#5f6368",
                            lineHeight: "1.5",
                          }}
                        >
                          Create a new workflow file at{" "}
                          <code
                            style={{
                              backgroundColor: "#f1f5f9",
                              padding: "2px 4px",
                              borderRadius: "4px",
                              fontFamily: "monospace",
                            }}
                          >
                            .github/workflows/buildportal-android.yml
                          </code>{" "}
                          in your repository and copy the template below.
                          BuildPortal dispatches this workflow dynamically to
                          assemble, sign, and distribute your binary:
                        </span>

                        {/* Code snippet card */}
                        <div
                          style={{
                            border: "1px solid #dadce0",
                            borderRadius: "8px",
                            overflow: "hidden",
                            backgroundColor: "#fafafa",
                            marginTop: "6px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 16px",
                              borderBottom: "1px solid #dadce0",
                              backgroundColor: "#f1f5f9",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                ...Fonts.Bold,
                                color: "#64748b",
                                fontFamily: "monospace",
                              }}
                            >
                              buildportal-android.yml
                            </span>
                            <button
                              onClick={handleCopyWorkflow}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "12px",
                                color: "#0c5df4",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                ...Fonts.Bold,
                              }}
                            >
                              {copiedWorkflow ? (
                                <Check size={14} style={{ color: "#137333" }} />
                              ) : (
                                <Copy size={14} />
                              )}
                              {copiedWorkflow ? "Copied!" : "Copy Template"}
                            </button>
                          </div>
                          <pre
                            style={{
                              margin: 0,
                              padding: "16px",
                              fontSize: "12px",
                              color: "#0f172a",
                              maxHeight: "280px",
                              overflowY: "auto",
                              overflowX: "auto",
                              fontFamily: "Courier New, Courier, monospace",
                              lineHeight: "1.45",
                              backgroundColor: "#ffffff",
                            }}
                          >
                            {androidWorkflowSnippet}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#e6f4ea",
                          color: "#137333",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          ...Fonts.Bold,
                          flexShrink: 0,
                        }}
                      >
                        3
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            ...Fonts.Bold,
                            color: "#1e293b",
                          }}
                        >
                          Google Play Store Credentials
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#5f6368",
                            lineHeight: "1.6",
                          }}
                        >
                          To automate publication to Google Play Store Internal
                          Testing, complete the following setup:
                          <ul
                            style={{
                              paddingLeft: "20px",
                              marginTop: "8px",
                              marginBottom: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <li>
                              <strong>Create Service Account:</strong> Go to the
                              Google Cloud Console, navigate to{" "}
                              <strong>
                                IAM &amp; Admin &rarr; Service Accounts
                              </strong>
                              , and click{" "}
                              <strong>Create Service Account</strong>.
                            </li>
                            <li>
                              <strong>Generate Private Key:</strong> Select the
                              created service account, go to the{" "}
                              <strong>Keys</strong> tab, click{" "}
                              <strong>Add Key &rarr; Create new key</strong>,
                              choose <strong>JSON</strong>, and download the
                              generated file.
                            </li>
                            <li>
                              <strong>Link in Google Play Console:</strong> Open
                              Play Console, go to{" "}
                              <strong>Users &amp; permissions</strong>, click{" "}
                              <strong>Invite new users</strong>, paste the
                              service account email address, and grant it
                              permissions to{" "}
                              <strong>Release to testing tracks</strong> and{" "}
                              <strong>Manage releases</strong> for your target
                              application.
                            </li>
                            <li>
                              <strong>Add Secret to Repository:</strong> Save
                              the contents of the downloaded JSON file as a
                              secret named{" "}
                              <code>BP_PLAY_SERVICE_ACCOUNT_JSON</code> in your
                              GitHub repository secrets. This will be read by
                              the GitHub Action workflow to deploy your bundle.
                            </li>
                          </ul>
                        </span>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#e6f4ea",
                          color: "#137333",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          ...Fonts.Bold,
                          flexShrink: 0,
                        }}
                      >
                        4
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            ...Fonts.Bold,
                            color: "#1e293b",
                          }}
                        >
                          Triggering Builds
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#5f6368",
                            lineHeight: "1.5",
                          }}
                        >
                          When initiating a{" "}
                          <strong>Play Store Internal Testing</strong> build,
                          make sure to specify a custom{" "}
                          <strong>Version Name</strong> (e.g. `1.0.0`), a unique{" "}
                          <strong>Version Code</strong> (which must exceed all
                          previous uploads), and descriptive **Release Notes**.
                          BuildPortal will sign the binary and push it straight
                          to Google Play.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "14px 16px",
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      color: "#15803d",
                      fontSize: "13px",
                      ...Fonts.Medium,
                    }}
                  >
                    <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                    <span>
                      All keystore binaries and code-signing credentials are
                      fully encrypted at rest.
                    </span>
                  </div>
                </div>
              )}

              {/* ── Tab 3: iOS Setup ── */}
              {activeTab === "ios" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: "18px",
                        ...Fonts.Bold,
                        color: "#1e293b",
                        margin: 0,
                      }}
                    >
                      iOS TestFlight Setup (Xcode Cloud)
                    </h2>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#5f6368",
                        margin: 0,
                        lineHeight: "1.6",
                      }}
                    >
                      Configure Xcode Cloud triggers and App Store Connect API
                      keys to distribute builds to TestFlight automatically.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#edf3fe",
                          color: "#0c5df4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          ...Fonts.Bold,
                          flexShrink: 0,
                        }}
                      >
                        1
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            ...Fonts.Bold,
                            color: "#1e293b",
                          }}
                        >
                          Generate Apple App Store Connect API Key
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#5f6368",
                            lineHeight: "1.5",
                          }}
                        >
                          Log into the Apple Developer portal, go to{" "}
                          <strong>
                            App Store Connect &rarr; Users and Access &rarr;
                            Keys
                          </strong>
                          . Create a new API Key with Developer access. Download
                          the private key file (e.g.{" "}
                          <code
                            style={{
                              backgroundColor: "#f1f5f9",
                              padding: "2px 4px",
                              borderRadius: "4px",
                            }}
                          >
                            AuthKey_XXXXXX.p8
                          </code>
                          ) and copy the **Key ID** and **Issuer ID**.
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#edf3fe",
                          color: "#0c5df4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          ...Fonts.Bold,
                          flexShrink: 0,
                        }}
                      >
                        2
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            ...Fonts.Bold,
                            color: "#1e293b",
                          }}
                        >
                          Save Credentials in BuildPortal
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#5f6368",
                            lineHeight: "1.5",
                          }}
                        >
                          Navigate to{" "}
                          <strong>
                            Connected workspace &rarr; Settings &rarr; App Store
                            Connect Credentials
                          </strong>
                          . Upload your{" "}
                          <code
                            style={{
                              backgroundColor: "#f1f5f9",
                              padding: "2px 4px",
                              borderRadius: "4px",
                            }}
                          >
                            .p8
                          </code>{" "}
                          private key file, fill in the Key ID, and Issuer ID.
                          BuildPortal uses these dynamically to sign JWT tokens
                          to talk to Xcode Cloud.
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#edf3fe",
                          color: "#0c5df4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          ...Fonts.Bold,
                          flexShrink: 0,
                        }}
                      >
                        3
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            ...Fonts.Bold,
                            color: "#1e293b",
                          }}
                        >
                          Establish Xcode Cloud Workflows
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#5f6368",
                            lineHeight: "1.6",
                          }}
                        >
                          To configure and link Xcode Cloud workflows, follow
                          these steps:
                          <ul
                            style={{
                              paddingLeft: "20px",
                              marginTop: "8px",
                              marginBottom: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <li>
                              <strong>Create Workflow in Xcode:</strong> Open
                              your iOS project workspace (
                              <code>.xcworkspace</code>) in Xcode on macOS.
                              Navigate to the{" "}
                              <strong>Report Navigator &rarr; Cloud</strong>{" "}
                              tab, click <strong>Get Started</strong>, select
                              your target app bundle ID, and click{" "}
                              <strong>Create Workflow</strong>.
                            </li>
                            <li>
                              <strong>Configure Trigger &amp; SCM:</strong> In
                              the workflow configurations, add a{" "}
                              <strong>Trigger</strong> (e.g., a git trigger set
                              to start on manual runs or branch pushes). Ensure
                              your repository (GitHub/GitLab) is connected and
                              authorized in App Store Connect.
                            </li>
                            <li>
                              <strong>Set Build Actions:</strong> Define the
                              workflow action to <strong>Archive</strong> the
                              iOS application and specify the appropriate
                              TestFlight (Internal/External) post-action
                              distribution group.
                            </li>
                            <li>
                              <strong>Link to Config File:</strong> Note the
                              exact name of the workflow you created (e.g.,{" "}
                              <code>WebLaunchHub Release</code>) and define it
                              in your <code>buildportal.yml</code> file under
                              the <code>xcode_cloud.workflow_name</code> field.
                            </li>
                          </ul>
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#edf3fe",
                          color: "#0c5df4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          ...Fonts.Bold,
                          flexShrink: 0,
                        }}
                      >
                        4
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            ...Fonts.Bold,
                            color: "#1e293b",
                          }}
                        >
                          Configure Xcode Cloud Post-Clone Script (React Native)
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#5f6368",
                            lineHeight: "1.5",
                          }}
                        >
                          For React Native applications, Xcode Cloud requires a post-clone script to download JavaScript dependencies and install CocoaPods before building. Create a folder named <code style={{ backgroundColor: "#f1f5f9", padding: "2px 4px", borderRadius: "4px", fontFamily: "monospace" }}>ci_scripts</code> inside your <code style={{ backgroundColor: "#f1f5f9", padding: "2px 4px", borderRadius: "4px", fontFamily: "monospace" }}>ios</code> directory, create a file named <code style={{ backgroundColor: "#f1f5f9", padding: "2px 4px", borderRadius: "4px", fontFamily: "monospace" }}>ci_post_clone.sh</code>, and copy the template below:
                        </span>

                        {/* Code snippet card */}
                        <div
                          style={{
                            border: "1px solid #dadce0",
                            borderRadius: "8px",
                            overflow: "hidden",
                            backgroundColor: "#fafafa",
                            marginTop: "6px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 16px",
                              borderBottom: "1px solid #dadce0",
                              backgroundColor: "#f1f5f9",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                ...Fonts.Bold,
                                color: "#64748b",
                                fontFamily: "monospace",
                              }}
                            >
                              ios/ci_scripts/ci_post_clone.sh
                            </span>
                            <button
                              onClick={handleCopyIosScript}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "12px",
                                color: "#0c5df4",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                ...Fonts.Bold,
                              }}
                            >
                              {copiedIosScript ? (
                                <Check size={14} style={{ color: "#137333" }} />
                              ) : (
                                <Copy size={14} />
                              )}
                              {copiedIosScript ? "Copied!" : "Copy Template"}
                            </button>
                          </div>
                          <pre
                            style={{
                              margin: 0,
                              padding: "16px",
                              fontSize: "12px",
                              color: "#0f172a",
                              maxHeight: "240px",
                              overflowY: "auto",
                              overflowX: "auto",
                              fontFamily: "Courier New, Courier, monospace",
                              lineHeight: "1.45",
                              backgroundColor: "#ffffff",
                            }}
                          >
                            {iosPostCloneSnippet}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#edf3fe",
                          color: "#0c5df4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          ...Fonts.Bold,
                          flexShrink: 0,
                        }}
                      >
                        5
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            ...Fonts.Bold,
                            color: "#1e293b",
                          }}
                        >
                          TestFlight Release Notes
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#5f6368",
                            lineHeight: "1.5",
                          }}
                        >
                          When triggering an iOS build, write your custom
                          release notes. Once Xcode Cloud finishes building and
                          Apple registers the build, BuildPortal will
                          automatically query App Store Connect and update the
                          TestFlight "What to Test" field with your custom
                          release notes!
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
