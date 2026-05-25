import { Router } from 'express';
import { githubAuth, githubCallback, gitlabAuth, gitlabCallback, getMe, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);
router.get('/gitlab', gitlabAuth);
router.get('/gitlab/callback', gitlabCallback);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
export default router;