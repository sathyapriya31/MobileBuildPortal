import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { triggerBuild, getBuildHistory, getBuildById, cancelBuild } from '../controllers/buildController.js';

const router = Router();
router.use(authenticate);
router.post('/', triggerBuild);
router.get('/', getBuildHistory);
router.get('/:id', getBuildById);
router.post('/:id/cancel', cancelBuild);
export default router;