import mongoose from 'mongoose';

const recipeItemSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  }
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  prepInstructions: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  nutritionalInfo: {
    calories: { type: Number, default: null },
    protein: { type: Number, default: null },
    carbs: { type: Number, default: null },
    fat: { type: Number, default: null }
  },
  recipe: [recipeItemSchema],
  isAvailable: {
    type: Boolean,
    default: true
  },
  isCustomization: {
    type: Boolean,
    default: false
  },
  customizationType: {
    type: String,
    enum: ['Base', 'Flavour', 'Topping', 'Filling', 'Syrup', 'None'],
    default: 'None'
  }
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);
