import { supabase } from '../config/supabase.js';

export const getMenuItems = async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('*, recipe:menu_item_recipes(quantity, ingredient:ingredients!ingredient_id(*))');

    if (error) throw error;

    // Format to match old Mongoose output
    const formattedItems = items.map(item => ({
      _id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      image: item.image,
      prepInstructions: item.prep_instructions,
      description: item.description,
      nutritionalInfo: {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      },
      isAvailable: item.is_available,
      isCustomization: item.is_customization,
      customizationType: item.customization_type,
      recipe: item.recipe ? item.recipe.map(r => ({
        quantity: r.quantity,
        ingredient: r.ingredient ? {
          _id: r.ingredient.id,
          name: r.ingredient.name,
          unit: r.ingredient.unit,
          currentStock: r.ingredient.current_stock
        } : null
      })) : []
    }));

    res.json(formattedItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addMenuItem = async (req, res) => {
  const { name, category, price, image, prepInstructions, description, nutritionalInfo, isAvailable, isCustomization, customizationType, recipe } = req.body;
  try {
    const { data: item, error } = await supabase
      .from('menu_items')
      .insert({
        name,
        category,
        price,
        image,
        prep_instructions: prepInstructions,
        description,
        calories: nutritionalInfo?.calories || null,
        protein: nutritionalInfo?.protein || null,
        carbs: nutritionalInfo?.carbs || null,
        fat: nutritionalInfo?.fat || null,
        is_available: isAvailable !== false,
        is_customization: isCustomization || false,
        customization_type: customizationType || 'None'
      })
      .select()
      .single();

    if (error) throw error;

    if (recipe && recipe.length > 0) {
      const recipeInserts = recipe.map(r => ({
        menu_item_id: item.id,
        ingredient_id: typeof r.ingredient === 'object' ? r.ingredient._id : r.ingredient,
        quantity: r.quantity
      }));
      await supabase.from('menu_item_recipes').insert(recipeInserts);
    }

    const formattedItem = { ...item, _id: item.id }; // Simplified for broadcast

    if (req.io) {
      req.io.emit('menu_updated', { type: 'add', item: formattedItem });
    }
    res.status(201).json(formattedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const { name, category, price, image, prepInstructions, description, nutritionalInfo, isAvailable, isCustomization, customizationType, recipe } = req.body;
  try {
    const { data: item, error } = await supabase
      .from('menu_items')
      .update({
        name,
        category,
        price,
        image,
        prep_instructions: prepInstructions,
        description,
        calories: nutritionalInfo?.calories || null,
        protein: nutritionalInfo?.protein || null,
        carbs: nutritionalInfo?.carbs || null,
        fat: nutritionalInfo?.fat || null,
        is_available: isAvailable,
        is_customization: isCustomization,
        customization_type: customizationType
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (recipe) {
      await supabase.from('menu_item_recipes').delete().eq('menu_item_id', id);
      if (recipe.length > 0) {
        const recipeInserts = recipe.map(r => ({
          menu_item_id: id,
          ingredient_id: typeof r.ingredient === 'object' ? r.ingredient._id : r.ingredient,
          quantity: r.quantity
        }));
        await supabase.from('menu_item_recipes').insert(recipeInserts);
      }
    }

    const formattedItem = { ...item, _id: item.id }; // Simplified for broadcast

    if (req.io) {
      req.io.emit('menu_updated', { type: 'update', item: formattedItem });
    }
    res.json(formattedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { data: item, error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (item) {
      if (req.io) req.io.emit('menu_updated', { type: 'delete', id: req.params.id });
      res.json({ message: 'Menu item removed' });
    } else {
      res.status(404).json({ message: 'Menu item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
