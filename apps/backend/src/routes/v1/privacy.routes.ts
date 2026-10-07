// apps/backend/src/routes/v1/privacy.routes.ts
import { Router } from 'express';
import { PrivacyController } from '../../controllers/PrivacyController';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Apply authentication: only verified users can access or erase their data
router.use(authenticate);

// DPDP Act 2023: Right to Data Portability / Export
router.get('/export-data', PrivacyController.exportUserData);
router.get('/export', PrivacyController.exportUserData);

// DPDP Act 2023: Right to Erasure / "Erase My Data"
router.post('/erase-my-data', PrivacyController.eraseUserData);
router.delete('/erase', PrivacyController.eraseUserData);

export default router;
