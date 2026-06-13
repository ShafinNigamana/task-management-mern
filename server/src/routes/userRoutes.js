import express from 'express';
import { getUsers } from '../controllers/authController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, restrictTo('manager'), getUsers);

export default router;
