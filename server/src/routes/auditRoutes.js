import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get audit logs history (protected)
router.get('/', protect, getAuditLogs);

export default router;
