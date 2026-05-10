import express from 'express';
import { getCustomerByPhone, getAllCustomers } from '../controllers/customerController.js';

const router = express.Router();

router.route('/')
  .get(getAllCustomers);

router.route('/:phone')
  .get(getCustomerByPhone);

export default router;
