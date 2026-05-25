import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadKeystore, getKeystore, listKeystores } from '../controllers/keystoreController.js';

const router = Router();
router.use(authenticate);
router.post('/', upload.single('keystore'), uploadKeystore);
router.get('/', listKeystores);
router.get('/:projectId', getKeystore);
export default router;