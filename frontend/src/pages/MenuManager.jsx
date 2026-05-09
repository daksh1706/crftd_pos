import React, { useState, useEffect } from 'react';
import { ChefHat, Plus, Trash2, X, Upload, Info, Edit2 } from 'lucide-react';

const MenuManager = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(null); 
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('Signature');

  const initialFormState = {
    name: '',
    category: 'Waffles',
    price: '',
    image: '',
    description: '',
    prepInstructions: '',
    isAvailable: true,
    nutritionalInfo: { calories: '', protein: '', carbs: '', fat: '' },
    recipe: [],
    isCustomization: false,
    customizationType: 'None'
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchMenu();
    fetchIngredients();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      if(res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIngredients = async () => {
    try {
      const res = await fetch('/api/inventory');
      if(res.ok) {
        const data = await res.json();
        setIngredients(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        price: item.price,
        image: item.image || '',
        description: item.description || '',
        prepInstructions: item.prepInstructions || '',
        isAvailable: item.isAvailable !== false,
        nutritionalInfo: item.nutritionalInfo || { calories: '', protein: '', carbs: '', fat: '' },
        recipe: item.recipe || [],
        isCustomization: item.isCustomization || false,
        customizationType: item.customizationType || 'None'
      });
    } else {
      setEditingItem(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const deleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this dish?")) {
      try {
        await fetch(`/api/menu/${id}`, { method: 'DELETE' });
        fetchMenu();
      } catch (err) {
        console.error("Failed to delete", err);
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddRecipeItem = () => {
    if (ingredients.length > 0) {
      setFormData({
        ...formData,
        recipe: [...formData.recipe, { ingredient: ingredients[0]._id, quantity: '' }]
      });
    }
  };

  const handleRecipeChange = (index, field, value) => {
    const newRecipe = [...formData.recipe];
    newRecipe[index][field] = value;
    setFormData({ ...formData, recipe: newRecipe });
  };

  const handleRemoveRecipeItem = (index) => {
    const newRecipe = formData.recipe.filter((_, i) => i !== index);
    setFormData({ ...formData, recipe: newRecipe });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price) || 0,
        nutritionalInfo: {
          calories: formData.nutritionalInfo.calories ? Number(formData.nutritionalInfo.calories) : null,
          protein: formData.nutritionalInfo.protein ? Number(formData.nutritionalInfo.protein) : null,
          carbs: formData.nutritionalInfo.carbs ? Number(formData.nutritionalInfo.carbs) : null,
          fat: formData.nutritionalInfo.fat ? Number(formData.nutritionalInfo.fat) : null,
        },
        recipe: formData.recipe.map(r => ({
          ingredient: typeof r.ingredient === 'object' ? r.ingredient._id : r.ingredient,
          quantity: Number(r.quantity) || 0
        }))
      };

      const url = editingItem ? `/api/menu/${editingItem._id}` : '/api/menu';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchMenu();
        setIsModalOpen(false);
        setFormData(initialFormState);
        setEditingItem(null);
      } else {
        const err = await res.json();
        alert('Failed to save: ' + err.message);
      }
    } catch (error) {
      console.error('Error saving menu item', error);
      alert('Error saving menu item');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Menu & Recipes</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage dishes, prep instructions, availability, and recipes</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Create Dish
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('Signature')}
          style={{ background: activeTab === 'Signature' ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: activeTab === 'Signature' ? '#f59e0b' : 'var(--text-muted)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem' }}
        >
          Signature Dishes
        </button>
        <button 
          onClick={() => setActiveTab('Customization')}
          style={{ background: activeTab === 'Customization' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: activeTab === 'Customization' ? '#10b981' : 'var(--text-muted)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem' }}
        >
          Customization Components
        </button>
      </div>

      <div className="pos-grid">
        {menuItems.filter(item => activeTab === 'Signature' ? !item.isCustomization : item.isCustomization).map(item => (
          <div key={item._id} className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', opacity: item.isAvailable === false ? 0.6 : 1, filter: item.isAvailable === false ? 'grayscale(0.5)' : 'none' }}>
            
            {/* Card Header (Image, Title, Price, Actions) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: 0 }}>
                {item.image ? (
                   <img src={item.image} alt={item.name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                ) : (
                   <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ChefHat size={24} color="var(--text-muted)" /></div>
                )}
                
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '1.05rem', lineHeight: '1.3' }} title={item.name}>
                      {item.name} {item.isAvailable === false && <span style={{ color: 'var(--error)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>(Out of Stock)</span>}
                    </h3>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-main)', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {item.isCustomization ? `${item.customizationType}` : item.category}
                    </span>
                    <span style={{ color: '#10b981', fontWeight: '800', fontSize: '1.1rem' }}>₹{item.price}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                <button onClick={() => openModal(item)} style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition)' }} className="hover-brighten">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deleteItem(item._id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition)' }}>
                  <Trash2 size={14} />
                </button>
              </div>

            </div>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', flex: 1 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Recipe Map</p>
              {item.recipe && item.recipe.length > 0 ? (
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>
                  {item.recipe.map((r, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>{r.ingredient?.name || 'Unknown'} - {r.quantity} {r.ingredient?.unit}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--error)', margin: '0 0 1rem 0' }}>No recipe mapped</p>
              )}

              <div style={{ marginTop: 'auto' }}>
                <button 
                  onClick={() => setExpandedDetails(expandedDetails === item._id ? null : item._id)}
                  style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text-muted)', width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'var(--transition)' }}
                  className="hover-brighten"
                >
                  <Info size={16} />
                  {expandedDetails === item._id ? 'Hide Details' : 'View Details'}
                </button>
                
                {expandedDetails === item._id && (
                  <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {item.description && <p style={{ marginBottom: '0.5rem' }}><em>"{item.description}"</em></p>}
                    
                    {item.nutritionalInfo && (item.nutritionalInfo.calories || item.nutritionalInfo.protein) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem', background: '#ffffff', padding: '0.5rem', borderRadius: '4px' }}>
                        <div><strong>Cal:</strong> {item.nutritionalInfo.calories || '-'}</div>
                        <div><strong>Pro:</strong> {item.nutritionalInfo.protein || '-'}g</div>
                        <div><strong>Carb:</strong> {item.nutritionalInfo.carbs || '-'}g</div>
                        <div><strong>Fat:</strong> {item.nutritionalInfo.fat || '-'}g</div>
                      </div>
                    )}

                    {item.prepInstructions && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Prep:</strong><br/>
                        {item.prepInstructions}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass animate-fade-in" style={{ width: '750px', borderRadius: 'var(--radius-lg)', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{editingItem ? 'Edit Dish' : 'Create New Dish'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingItem(null); setFormData(initialFormState); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Row 1 */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{formData.isCustomization ? 'Component Name' : 'Dish Name'}</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Signature Truffle Pasta" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Price (₹)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="e.g. 450" />
                </div>
                {formData.isCustomization ? (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Customization Type</label>
                    <select value={formData.customizationType} onChange={e => setFormData({...formData, customizationType: e.target.value})}>
                      <option value="Base">Base</option>
                      <option value="Flavour">Flavour</option>
                      <option value="Topping">Topping</option>
                      <option value="Filling">Filling</option>
                      <option value="Syrup">Syrup</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                ) : (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option>Waffles</option>
                      <option>Pancakes</option>
                      <option>Coffee</option>
                      <option>Shakes and Smoothies</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <input 
                  type="checkbox" 
                  id="isCustomization"
                  checked={formData.isCustomization} 
                  onChange={e => setFormData({...formData, isCustomization: e.target.checked})} 
                  style={{ width: 'auto', transform: 'scale(1.2)' }}
                />
                <label htmlFor="isCustomization" style={{ cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600 }}>
                  This item is a Customization Component (e.g., Base, Topping)
                </label>
              </div>

              {/* Status Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <input 
                  type="checkbox" 
                  id="availability"
                  checked={formData.isAvailable} 
                  onChange={e => setFormData({...formData, isAvailable: e.target.checked})} 
                  style={{ width: 'auto', transform: 'scale(1.2)' }}
                />
                <label htmlFor="availability" style={{ cursor: 'pointer', color: formData.isAvailable ? 'var(--accent)' : 'var(--error)', fontWeight: 600 }}>
                  {formData.isAvailable ? 'Dish is currently Available' : 'Dish is Unavailable (Sold Out)'}
                </label>
              </div>

              {/* Row 2: Image Upload */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Dish Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
                      <Upload size={18} /> Upload Image
                    </button>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', left: 0, top: 0, opacity: 0, cursor: 'pointer', height: '100%' }} />
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>OR URL:</span>
                  <input 
                    style={{ flex: 1 }}
                    value={formData.image.startsWith('data:image') ? 'Local File Uploaded' : formData.image} 
                    onChange={e => setFormData({...formData, image: e.target.value})} 
                    placeholder="https://..." 
                    disabled={formData.image.startsWith('data:image')}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Description (Customer Facing)</label>
                <textarea 
                  rows="2"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="A delicious, rich truffle pasta..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Nutritional Info */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nutritional Information (Optional)</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="number" placeholder="Calories (kcal)" value={formData.nutritionalInfo.calories} onChange={e => setFormData({...formData, nutritionalInfo: {...formData.nutritionalInfo, calories: e.target.value}})} />
                  <input type="number" placeholder="Protein (g)" value={formData.nutritionalInfo.protein} onChange={e => setFormData({...formData, nutritionalInfo: {...formData.nutritionalInfo, protein: e.target.value}})} />
                  <input type="number" placeholder="Carbs (g)" value={formData.nutritionalInfo.carbs} onChange={e => setFormData({...formData, nutritionalInfo: {...formData.nutritionalInfo, carbs: e.target.value}})} />
                  <input type="number" placeholder="Fat (g)" value={formData.nutritionalInfo.fat} onChange={e => setFormData({...formData, nutritionalInfo: {...formData.nutritionalInfo, fat: e.target.value}})} />
                </div>
              </div>

              {/* Prep Instructions */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Preparation Instructions (Kitchen)</label>
                <textarea 
                  rows="3"
                  value={formData.prepInstructions}
                  onChange={e => setFormData({...formData, prepInstructions: e.target.value})}
                  placeholder="1. Boil pasta for 8 mins...\n2. Prepare truffle sauce..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Recipe Array */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.25rem 0' }}>Ingredient Formula</h3>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Define what gets deducted from inventory upon order</p>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={handleAddRecipeItem} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Add Ingredient
                  </button>
                </div>
                
                {formData.recipe.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>No ingredients added yet.</p>
                ) : formData.recipe.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', background: '#ffffff', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <select 
                      style={{ flex: 2, background: 'var(--bg-dark)', border: '1px solid var(--border)' }} 
                      value={typeof r.ingredient === 'object' ? r.ingredient._id : r.ingredient} 
                      onChange={e => handleRecipeChange(i, 'ingredient', e.target.value)}
                    >
                      {ingredients.map(ing => (
                        <option key={ing._id} value={ing._id}>{ing.name} ({ing.unit})</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      style={{ flex: 1, background: 'var(--bg-dark)', border: '1px solid var(--border)' }} 
                      placeholder="Qty required" 
                      step="0.01"
                      value={r.quantity} 
                      onChange={e => handleRecipeChange(i, 'quantity', e.target.value)}
                    />
                    <button type="button" onClick={() => handleRemoveRecipeItem(i)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.5rem' }}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1.25rem', fontSize: '1.1rem', letterSpacing: '1px', fontWeight: 'bold' }}>
                {editingItem ? 'Save Changes' : 'Save Dish to Menu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
