import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getGithubRepos, getGithubBranches, getGitlabRepos, getGitlabBranches } from '../controllers/repoController.js';

const router = Router();
router.use(authenticate);
router.get('/github', getGithubRepos);
router.get('/github/:owner/:repo/branches', getGithubBranches);
router.get('/gitlab', getGitlabRepos);
router.get('/gitlab/:projectId/branches', getGitlabBranches);
export default router;