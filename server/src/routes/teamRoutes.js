import express from 'express';
import {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam,
} from '../controllers/teamController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getTeams);

router.post('/', restrictTo('manager'), createTeam);
router.put('/:id', restrictTo('manager'), updateTeam);
router.delete('/:id', restrictTo('manager'), deleteTeam);

export default router;
