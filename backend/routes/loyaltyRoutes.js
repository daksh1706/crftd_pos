import express from 'express';
import { getLoyaltySettings, updateLoyaltySettings } from '../controllers/loyaltyController.js';

const router = express.Router();

router.route('/')
  .get(getLoyaltySettings)
  .post(updateLoyaltySettings);

export default router;
