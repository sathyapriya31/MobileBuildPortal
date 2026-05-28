import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadAppleCredentials, getAppleCredentials } from '../controllers/appleCredentialController.js';

const router = Router();
router.use(authenticate);

router.post('/', upload.single('keyFile'), uploadAppleCredentials);
router.get('/:projectId', getAppleCredentials);

export default router;
