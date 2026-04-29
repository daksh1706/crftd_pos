import express from 'express';
import { createOrder, getOrders, updateOrderStatus, createPaymentIntent, createCheckoutSession, confirmStripePayment } from '../controllers/orderController.js';
import { protect, managerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-payment-intent', createPaymentIntent);
router.post('/create-checkout-session', createCheckoutSession);
router.post('/confirm-payment', confirmStripePayment);

router.route('/')
  .get(getOrders)
  .post(createOrder);

router.route('/:id/status')
  .put(updateOrderStatus);

export default router;
