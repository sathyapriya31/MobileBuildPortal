import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadAppleCredentials, getAppleCredentials, deleteAppleCredentials } from '../controllers/appleCredentialController.js';

const router = Router();
router.use(authenticate);

router.post('/', upload.single('keyFile'), uploadAppleCredentials);
router.get('/:projectId', getAppleCredentials);
router.delete('/:projectId', deleteAppleCredentials);

export default router;
