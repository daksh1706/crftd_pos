import express from 'express';
import { getCustomerByPhone } from '../controllers/customerController.js';

const router = express.Router();

router.route('/:phone')
  .get(getCustomerByPhone);

export default router;
