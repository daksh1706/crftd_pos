import express from 'express';
import { getIngredients, addIngredient, updateIngredient, deleteIngredient, prepareIngredientBatch } from '../controllers/inventoryController.js';
import { protect, managerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getIngredients)
  .post(addIngredient);

router.route('/:id')
  .put(updateIngredient)
  .delete(deleteIngredient);

router.post('/:id/prepare', prepareIngredientBatch);

export default router;
