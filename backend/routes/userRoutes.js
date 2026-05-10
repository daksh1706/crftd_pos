import express from 'express';
import { getPendingUsers, updateUserStatus } from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/pending', protect, adminOnly, getPendingUsers);
router.put('/:id/status', protect, adminOnly, updateUserStatus);

export default router;
