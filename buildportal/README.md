# BuildPortal 🚀
> **A Premium, Self-Hosted Mobile CI/CD Build Server**

BuildPortal is a high-performance, cloud-native mobile build automation platform. It allows developers to trigger, queue, and compile Android (`.apk` and `.aab`) and iOS (`.ipa` and TestFlight) applications from GitHub repositories, stream build logs line-by-line in real-time, store build artifacts in AWS S3, and receive instant Slack notifications when builds complete.

**Android builds run entirely on GitHub Actions — no self-hosted runners, no Mac Mini required.**

---

## 📐 System Architecture

```mermaid
graph TD
    Developer[Developer Browser] <-->|HTTP / WebSockets| Frontend[Vite + React Frontend]

    Frontend <-->|REST API / Real-time Logs| Backend[Node.js Express Backend]

    Backend <-->|Mongoose ODM| MongoDB[(MongoDB Atlas)]
    Backend <-->|Enqueue Jobs| BullMQ[(Redis + Bull MQ)]

    Backend -->|workflow_dispatch API| GHA[GitHub Actions Runner]
    GHA -->|Upload APK/AAB| S3[AWS S3 Bucket]
    GHA -->|POST callback result| Backend

    Backend -->|Trigger Build Run| XcodeCloud[Apple Xcode Cloud]
    XcodeCloud -->|Poll status| Backend
    XcodeCloud -->|Distribute IPA| TestFlight[Apple TestFlight]

    Backend -->|Presigned Download URLs| S3
    Backend -->|Build notifications| Slack[Slack Webhook]
```

---

## 🔄 Build Flow

### Android Build Flow
```
User clicks "Trigger Build" (Android)
    ↓
Backend creates Build record → enqueues job in Redis Bull MQ
    ↓
Queue processor calls dispatchToGitHubActions()
    ↓
Backend calls GitHub Actions workflow_dispatch API on the user's repo
    ↓
GitHub Actions: checkout → npm install → gradlew assembleRelease/bundleRelease
    ↓
GitHub Actions uploads APK/AAB to AWS S3
    ↓
GitHub Actions POSTs callback to: POST /api/agent/github-actions/callback
    ↓
Backend updates build status, generates presigned S3 URL, emits socket event
    ↓
Frontend receives real-time update — build complete ✅
```

### iOS Build Flow
```
User clicks "Trigger Build" (iOS)
    ↓
Backend creates Build record → enqueues job in Redis Bull MQ
    ↓
Queue processor calls processXcodeCloudBuild()
    ↓
Backend calls Apple App Store Connect API to trigger Xcode Cloud workflow
    ↓
Backend polls Xcode Cloud run status every 15 seconds
    ↓
On completion → saves TestFlight link, emits socket event, notifies Slack
```

---

## ✨ Core Features

1. **GitHub Actions Android Builds**
   - All Android builds (Testing, UAT, Production) are dispatched via GitHub's `workflow_dispatch` API
   - No self-hosted Mac Mini or build agent required
   - Supports both `.apk` and `.aab` output formats
   - Real-time log streaming back to the portal via socket events

2. **Apple Xcode Cloud iOS Builds**
   - Triggers iOS build runs through the App Store Connect REST API
   - Polls build status and captures TestFlight distribution links automatically
   - Supports per-project Apple API credentials (`.p8` key file)

3. **Three Build Profiles**
   - 🧪 **Testing** — runs on GitHub Actions, fast feedback loop
   - 📋 **UAT** — runs on GitHub Actions, pre-production validation
   - 🚀 **Production** — runs on GitHub Actions, production-ready signed binary

4. **Real-time Live Log Console**
   - WebSocket (`Socket.io`) live log terminal showing compiler output line-by-line
   - Build status transitions streamed instantly to all connected clients

5. **Enterprise Authentication**
   - Secure sign-in with **GitHub OAuth 2.0**
   - User access tokens stored securely and reused for `workflow_dispatch` API calls (no extra PAT needed)

6. **AWS S3 Artifact Storage**
   - All APK/AAB build artifacts uploaded to S3 by the GitHub Actions runner
   - Time-limited presigned download URLs generated on demand (24h expiry)

7. **Slack Notifications**
   - Auto-publishes build summaries (project name, branch, platform, artifact link) on build completion

---

## 🛠️ Technology Stack

| Layer | Technologies | Key Modules |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | Redux Toolkit, Socket.io-client, React Router |
| **Backend** | Node.js, Express | Mongoose, Bull MQ, AWS SDK v3, Socket.io, Axios |
| **Android CI** | GitHub Actions | `workflow_dispatch`, `actions/checkout`, `setup-java`, AWS CLI |
| **iOS CI** | Apple Xcode Cloud | App Store Connect REST API, JWT (ES256) |
| **Storage** | AWS S3 | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` |
| **Queue** | Redis + Bull | Job queue, retry logic, event streaming |
| **Database** | MongoDB Atlas | Mongoose ODM |

---

## 📂 Project Directory Structure

```bash
buildportal/
├── backend/                          # Node.js + Express API Server
│   ├── src/
│   │   ├── config/                   # Database configuration
│   │   ├── controllers/              # Auth, Builds, Repos, Keystore, Apple Creds
│   │   ├── middleware/               # Auth guard & global error handler
│   │   ├── models/                   # Mongoose schemas (User, Build, Keystore)
│   │   ├── routes/
│   │   │   ├── agent.js              # /api/agent/* — GHA callback, Mac Mini callback, log stream
│   │   │   ├── builds.js             # /api/builds/* — trigger, history, cancel
│   │   │   ├── repos.js              # /api/repos/* — GitHub/GitLab repo & branch listing
│   │   │   └── auth.js               # /api/auth/* — OAuth flows
│   │   ├── services/
│   │   │   ├── buildQueue.js         # Bull MQ processor — routes Android→GHA, iOS→Xcode Cloud
│   │   │   ├── xcodeCloudService.js  # Apple App Store Connect API integration
│   │   │   ├── s3Service.js          # S3 upload & presigned URL generation
│   │   │   └── slackService.js       # Slack webhook notifications
│   │   └── server.js                 # Express + Socket.io entry point
│   └── package.json
│
├── frontend/                         # Vite + React SPA
│   ├── src/
│   │   ├── components/               # Sidebar, Header, layout wrappers
│   │   ├── pages/
│   │   │   ├── BuildPage.jsx         # Trigger build UI (repo, branch, platform, build type)
│   │   │   ├── HistoryPage.jsx       # Build history with live log viewer
│   │   │   ├── workspace.jsx         # Android keystore management
│   │   │   └── LoginPage.jsx         # GitHub / GitLab OAuth login
│   │   ├── store/                    # Redux Toolkit slices
│   │   └── main.jsx                  # SPA entry point
│   └── package.json
│
└── agent/
    └── github-actions-template/
        └── buildportal-android.yml   # ⬅ Copy this to your repo's .github/workflows/
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
PORT=4000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:4000/api/auth/github/callback

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=buildportal-artifacts

# Redis
REDIS_URL=redis://localhost:6379

# Slack (optional)
SLACK_BOT_TOKEN=xoxb-your-slack-token
SLACK_CHANNEL_ID=C0XXXXXXXXX

# GitHub Actions callback secret
# Must match BP_CALLBACK_SECRET in your GitHub repo secrets
GITHUB_ACTIONS_CALLBACK_SECRET=your_gha_callback_secret

# Apple Xcode Cloud (iOS builds)
APPLE_API_KEY_ID=your_key_id
APPLE_API_ISSUER=your_issuer_id
APPLE_API_KEY_PATH=/key/AuthKey_XXXXXXXX.p8

# Frontend origin
FRONTEND_URL=http://localhost:5173
BACKEND_URL=https://your-backend-url.com
```

---

## 🤖 GitHub Actions — One-Time Repo Setup

For every repository you want to build, commit the BuildPortal workflow file **once**:

### Step 1 — Copy the workflow file

Copy [`agent/github-actions-template/buildportal-android.yml`](agent/github-actions-template/buildportal-android.yml) to your repository at:

```
your-app-repo/
└── .github/
    └── workflows/
        └── buildportal-android.yml   ← commit this
```

### Step 2 — Add Repository Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name | Description |
| :--- | :--- |
| `BP_AWS_ACCESS_KEY_ID` | AWS access key (same as backend) |
| `BP_AWS_SECRET_ACCESS_KEY` | AWS secret key (same as backend) |
| `BP_S3_BUCKET_NAME` | S3 bucket name (e.g. `buildportal-artifacts`) |
| `BP_AWS_REGION` | AWS region (e.g. `ap-south-1`) |

> **Note:** `callback_url` and `callback_secret` are injected automatically by BuildPortal when it dispatches the workflow — you do **not** need to set these manually.

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** v18+
- **Redis** (local or [Upstash](https://upstash.com) free tier)
- **MongoDB** (local or [MongoDB Atlas](https://mongodb.com/atlas) free tier)
- GitHub OAuth App (for login + `workflow_dispatch`)
- AWS S3 bucket

### Step 1 — Start the Backend

```bash
cd backend
npm install
npm run dev       # development (nodemon)
# or
npm start         # production
```

Backend runs at `http://localhost:4000`

### Step 2 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Step 3 — Expose Backend Publicly (for GitHub Actions callbacks)

GitHub Actions needs to POST build results back to your backend. Use a tunnel during development:

```bash
# Option A: ngrok
ngrok http 4000

# Option B: Cloudflare Tunnel
cloudflared tunnel --url http://localhost:4000
```

Set `BACKEND_URL` in `backend/.env` to the public tunnel URL.

---

## 🌐 API Endpoints

### Build Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/builds` | Trigger a new build |
| `GET` | `/api/builds` | Get build history (paginated, filterable) |
| `GET` | `/api/builds/:id` | Get single build by ID |
| `POST` | `/api/builds/:id/cancel` | Cancel a queued/building job |

### Agent / Callback Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/agent/github-actions/callback` | GitHub Actions posts build result here |
| `POST` | `/api/agent/upload` | Upload build artifact (multipart) |
| `POST` | `/api/agent/log` | Stream a log line from a runner |
| `GET` | `/api/agent/keystore/:buildId` | Securely stream keystore file |

### Auth Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/github` | Initiate GitHub OAuth flow |
| `GET` | `/api/auth/github/callback` | GitHub OAuth callback |
| `GET` | `/api/auth/me` | Get authenticated user profile |
| `POST` | `/api/auth/logout` | Log out and clear session |

---

## 🗄️ Database Schemas

### Build Schema (`Build.js`)

```javascript
{
  userId:       ObjectId,         // ref → User
  projectId:    String,           // GitHub repo ID
  projectName:  String,
  repoUrl:      String,           // e.g. https://github.com/org/repo
  provider:     'github' | 'gitlab',
  branch:       String,
  platform:     'android' | 'ios' | 'both',
  androidFormat:'apk' | 'aab',
  versionName:  String,           // e.g. '1.2.0'
  buildType:    'testing' | 'uat' | 'production',
  buildNumber:  Number,
  status:       'queued' | 'building' | 'success' | 'failed' | 'cancelled',
  logs:         [{ timestamp, level, message }],
  artifacts: {
    android: { s3Key, presignedUrl, size },
    ios:     { s3Key, presignedUrl, testFlightLink, size }
  },
  buildMetadata: { commitSha, commitMessage, appVersion },
  startedAt:    Date,
  finishedAt:   Date,
  duration:     Number,           // seconds
  error:        String
}
```

---

## 🧼 Database Maintenance

Reset all collections for a clean slate:

```bash
cd backend
node clearDb.js
```

---

## 🔒 Security

1. **GitHub Actions Callback Secret**: `GITHUB_ACTIONS_CALLBACK_SECRET` in `.env` must match `BP_CALLBACK_SECRET` in GitHub repo secrets. All inbound GHA callbacks are rejected if the secret doesn't match.
2. **OAuth Token Reuse**: The user's stored GitHub OAuth access token is used to call `workflow_dispatch` — no extra Personal Access Token required.
3. **Presigned S3 URLs**: Build artifacts are never publicly exposed. Download links are time-limited (24h) presigned URLs generated on demand.
4. **JWT Auth**: All API routes are protected with signed JWTs (`Bearer` scheme).
5. **Helmet + CORS**: Express hardening via `helmet` and strict CORS origin policies.
