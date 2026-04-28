import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  unit: {
    type: String, // e.g., 'kg', 'g', 'L', 'ml', 'pcs'
    required: true
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  recipe: [{
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    }
  }]
}, { timestamps: true });

export default mongoose.model('Ingredient', ingredientSchema);
