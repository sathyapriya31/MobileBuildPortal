import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/database.js';
import { setupBuildQueue, resumeActiveBuilds } from './services/buildQueue.js';
import authRoutes from './routes/auth.js';
import repoRoutes from './routes/repos.js';
import buildRoutes from './routes/builds.js';
import keystoreRoutes from './routes/keystores.js';
import agentRoutes from './routes/agent.js';
import appleCredentialRoutes from './routes/appleCredentials.js';
import buildWebhookRoutes from './routes/buildWebhook.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketIO } from './services/socketService.js';

const app = express();
const httpServer = createServer(app);

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/builds', buildRoutes);
app.use('/api/build', buildWebhookRoutes);
app.use('/api/keystores', keystoreRoutes);
app.use('/api/apple-credentials', appleCredentialRoutes);
app.use('/api/agent', agentRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorHandler);
setupSocketIO(io);

const PORT = process.env.PORT || 4000;
async function startServer() {
  await connectDB();
  await setupBuildQueue(io);
  await resumeActiveBuilds(io);
  httpServer.listen(PORT, () => console.log(`🚀 BuildPortal API on port ${PORT}`));
}
startServer();