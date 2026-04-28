import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', protect, adminOnly, registerUser); // Only admins can create users
router.post('/login', loginUser);

export default router;
