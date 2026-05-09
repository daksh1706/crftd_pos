import { supabase } from '../config/supabase.js';

export const getIngredients = async (req, res) => {
  try {
    const { data: ingredients, error } = await supabase
      .from('ingredients')
      .select('*, recipe:ingredient_recipes(quantity, ingredient:ingredients!child_ingredient_id(*))');

    if (error) throw error;
    
    // Format to match old Mongoose output
    const formattedIngredients = ingredients.map(ing => ({
      _id: ing.id,
      name: ing.name,
      unit: ing.unit,
      currentStock: ing.current_stock,
      lowStockThreshold: ing.low_stock_threshold,
      recipe: ing.recipe ? ing.recipe.map(r => ({
        quantity: r.quantity,
        ingredient: {
          _id: r.ingredient.id,
          name: r.ingredient.name,
          unit: r.ingredient.unit,
          currentStock: r.ingredient.current_stock
        }
      })) : []
    }));

    res.json(formattedIngredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addIngredient = async (req, res) => {
  const { name, unit, currentStock, lowStockThreshold, recipe } = req.body;
  try {
    const { data: ingredient, error } = await supabase
      .from('ingredients')
      .insert({
        name,
        unit,
        current_stock: currentStock || 0,
        low_stock_threshold: lowStockThreshold || 10
      })
      .select()
      .single();

    if (error) throw error;

    if (recipe && recipe.length > 0) {
      const recipeInserts = recipe.map(r => ({
        parent_ingredient_id: ingredient.id,
        child_ingredient_id: r.ingredient,
        quantity: r.quantity
      }));
      await supabase.from('ingredient_recipes').insert(recipeInserts);
    }

    const formattedIngredient = {
      _id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      currentStock: ingredient.current_stock,
      lowStockThreshold: ingredient.low_stock_threshold
    };

    if (req.io) {
      req.io.emit('inventory_updated', { type: 'add', item: formattedIngredient });
    }
    res.status(201).json(formattedIngredient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateIngredient = async (req, res) => {
  const { id } = req.params;
  const { name, unit, currentStock, lowStockThreshold, recipe } = req.body;
  try {
    const { data: ingredient, error } = await supabase
      .from('ingredients')
      .update({
        name,
        unit,
        current_stock: currentStock,
        low_stock_threshold: lowStockThreshold
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (recipe) {
      await supabase.from('ingredient_recipes').delete().eq('parent_ingredient_id', id);
      if (recipe.length > 0) {
        const recipeInserts = recipe.map(r => ({
          parent_ingredient_id: id,
          child_ingredient_id: typeof r.ingredient === 'object' ? r.ingredient._id : r.ingredient,
          quantity: r.quantity
        }));
        await supabase.from('ingredient_recipes').insert(recipeInserts);
      }
    }

    const formattedIngredient = {
      _id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      currentStock: ingredient.current_stock,
      lowStockThreshold: ingredient.low_stock_threshold
    };

    if (req.io) {
      req.io.emit('inventory_updated', { type: 'update', item: formattedIngredient });
    }
    res.json(formattedIngredient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteIngredient = async (req, res) => {
  try {
    const { data: ingredient, error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (ingredient) {
      if (req.io) req.io.emit('inventory_updated', { type: 'delete', id: req.params.id });
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
    const { data: ingredient, error } = await supabase
      .from('ingredients')
      .select('*, recipe:ingredient_recipes(quantity, child_ingredient_id, ingredient:ingredients!child_ingredient_id(*))')
      .eq('id', id)
      .single();

    if (error || !ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    if (!ingredient.recipe || ingredient.recipe.length === 0) {
      return res.status(400).json({ message: 'Ingredient does not have a recipe to prepare' });
    }

    // Check stock
    for (const recipeItem of ingredient.recipe) {
      const rawMaterial = recipeItem.ingredient;
      const totalNeeded = recipeItem.quantity * quantityToPrepare;
      if (!rawMaterial || rawMaterial.current_stock < totalNeeded) {
        return res.status(400).json({ message: `Insufficient stock for raw material: ${rawMaterial ? rawMaterial.name : 'Unknown'}` });
      }
    }

    // Deduct raw materials and emit
    for (const recipeItem of ingredient.recipe) {
      const rawMaterial = recipeItem.ingredient;
      const totalNeeded = recipeItem.quantity * quantityToPrepare;
      
      const { data: updatedRaw } = await supabase
        .from('ingredients')
        .update({ current_stock: rawMaterial.current_stock - totalNeeded })
        .eq('id', rawMaterial.id)
        .select()
        .single();
      
      if (req.io && updatedRaw) {
        req.io.emit('inventory_updated', { type: 'update', item: { _id: updatedRaw.id, currentStock: updatedRaw.current_stock, name: updatedRaw.name, unit: updatedRaw.unit } });
        if (updatedRaw.current_stock <= updatedRaw.low_stock_threshold) {
          req.io.emit('low_stock_alert', { ingredient: { _id: updatedRaw.id, name: updatedRaw.name } });
        }
      }
    }

    // Increase pre-cooked stock
    const { data: finalIngredient } = await supabase
      .from('ingredients')
      .update({ current_stock: ingredient.current_stock + quantityToPrepare })
      .eq('id', id)
      .select()
      .single();

    if (req.io && finalIngredient) {
      req.io.emit('inventory_updated', { type: 'update', item: { _id: finalIngredient.id, currentStock: finalIngredient.current_stock, name: finalIngredient.name, unit: finalIngredient.unit } });
    }

    res.json({ message: `Successfully prepared ${quantityToPrepare} ${ingredient.unit} of ${ingredient.name}`, ingredient: finalIngredient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
