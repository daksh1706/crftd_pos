import Ingredient from '../models/Ingredient.js';

export const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({});
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addIngredient = async (req, res) => {
  const { name, unit, currentStock, lowStockThreshold } = req.body;
  try {
    const ingredient = new Ingredient({ name, unit, currentStock, lowStockThreshold });
    const createdIngredient = await ingredient.save();
    req.io.emit('inventory_updated', { type: 'add', item: createdIngredient });
    res.status(201).json(createdIngredient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateIngredient = async (req, res) => {
  const { id } = req.params;
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(id, req.body, { new: true });
    if (ingredient) {
      req.io.emit('inventory_updated', { type: 'update', item: ingredient });
      res.json(ingredient);
    } else {
      res.status(404).json({ message: 'Ingredient not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (ingredient) {
      req.io.emit('inventory_updated', { type: 'delete', id: req.params.id });
      res.json({ message: 'Ingredient removed' });
    } else {
      res.status(404).json({ message: 'Ingredient not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const prepareIngredientBatch = async (req, res) => {
  const { id } = req.params;
  const { quantityToPrepare } = req.body;

  try {
    const ingredient = await Ingredient.findById(id).populate('recipe.ingredient');
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    if (!ingredient.recipe || ingredient.recipe.length === 0) {
      return res.status(400).json({ message: 'Ingredient does not have a recipe to prepare' });
    }

    // Check if enough raw materials exist
    for (const recipeItem of ingredient.recipe) {
      const rawMaterial = await Ingredient.findById(recipeItem.ingredient._id);
      const totalNeeded = recipeItem.quantity * quantityToPrepare;
      if (!rawMaterial || rawMaterial.currentStock < totalNeeded) {
        return res.status(400).json({ message: `Insufficient stock for raw material: ${rawMaterial ? rawMaterial.name : 'Unknown'}` });
      }
    }

    // Deduct raw materials and emit updates
    for (const recipeItem of ingredient.recipe) {
      const rawMaterial = await Ingredient.findById(recipeItem.ingredient._id);
      const totalNeeded = recipeItem.quantity * quantityToPrepare;
      rawMaterial.currentStock -= totalNeeded;
      await rawMaterial.save();
      
      if (req.io) {
        req.io.emit('inventory_updated', { type: 'update', item: rawMaterial });
        if (rawMaterial.currentStock <= rawMaterial.lowStockThreshold) {
          req.io.emit('low_stock_alert', { ingredient: rawMaterial });
        }
      }
    }

    // Increase pre-cooked item stock
    ingredient.currentStock += quantityToPrepare;
    await ingredient.save();

    if (req.io) {
      req.io.emit('inventory_updated', { type: 'update', item: ingredient });
    }

    res.json({ message: `Successfully prepared ${quantityToPrepare} ${ingredient.unit} of ${ingredient.name}`, ingredient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
