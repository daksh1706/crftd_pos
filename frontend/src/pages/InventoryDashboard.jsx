import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

const InventoryDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrepareModalOpen, setIsPrepareModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [preparingItem, setPreparingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    currentStock: '',
    lowStockThreshold: '',
    recipe: []
  });

  const [prepareQuantity, setPrepareQuantity] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
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
        unit: item.unit,
        currentStock: item.currentStock,
        lowStockThreshold: item.lowStockThreshold,
        recipe: item.recipe || []
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', unit: 'kg', currentStock: '', lowStockThreshold: '', recipe: [] });
    }
    setIsModalOpen(true);
  };

  const handleAddRecipeItem = () => {
    if (inventory.length > 0) {
      setFormData({
        ...formData,
        recipe: [...formData.recipe, { ingredient: inventory[0]._id, quantity: '' }]
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
      const url = editingItem ? `/api/inventory/${editingItem._id}` : '/api/inventory';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          currentStock: Number(formData.currentStock) || 0,
          lowStockThreshold: Number(formData.lowStockThreshold) || 0,
          recipe: formData.recipe.map(r => ({ ...r, quantity: Number(r.quantity) || 0 }))
        })
      });

      if (res.ok) {
        fetchInventory();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error saving ingredient', error);
    }
  };

  const handlePrepareBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/inventory/${preparingItem._id}/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantityToPrepare: Number(prepareQuantity) })
      });
      if (res.ok) {
        fetchInventory();
        setIsPrepareModalOpen(false);
        setPrepareQuantity('');
        setPreparingItem(null);
      } else {
        const err = await res.json();
        alert('Failed to prepare batch: ' + err.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id) => {
    if(window.confirm('Are you sure you want to delete this ingredient?')) {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      fetchInventory();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Inventory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage raw materials and pre-cooked batches</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <tr>
              <th style={{ padding: '1.25rem' }}>Item Name</th>
              <th style={{ padding: '1.25rem' }}>Current Stock</th>
              <th style={{ padding: '1.25rem' }}>Status</th>
              <th style={{ padding: '1.25rem' }}>Type</th>
              <th style={{ padding: '1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item._id} className="table-row-hover" style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '1.25rem', fontWeight: '500' }}>{item.name}</td>
                <td style={{ padding: '1.25rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                  {item.currentStock} {item.unit}
                </td>
                <td style={{ padding: '1.25rem' }}>
                  {item.currentStock <= item.lowStockThreshold ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
                      <AlertCircle size={14} /> Low Stock
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
                      <Package size={14} /> In Stock
                    </span>
                  )}
                </td>
                <td style={{ padding: '1.25rem' }}>
                  {item.recipe && item.recipe.length > 0 ? (
                    <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>Pre-Cooked Batch</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Raw Material</span>
                  )}
                </td>
                <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    {item.recipe && item.recipe.length > 0 && (
                      <button 
                        onClick={() => { setPreparingItem(item); setIsPrepareModalOpen(true); }}
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        <RefreshCw size={14} /> Prepare
                      </button>
                    )}
                    <button onClick={() => openModal(item)} style={{ background: 'transparent', border: 'none', color: 'var(--info)', cursor: 'pointer', padding: '0.5rem' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => deleteItem(item._id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.5rem' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No inventory items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass animate-slide-up" style={{ width: '600px', borderRadius: 'var(--radius-lg)', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Flour, Pizza Dough" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Unit</label>
                  <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Current Stock</label>
                  <input type="number" required value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value})} placeholder="e.g. 50" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Low Stock Alert At</label>
                  <input type="number" required value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} placeholder="e.g. 10" />
                </div>
              </div>

              {/* Recipe for Pre-Cooked Items */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Batch Recipe (Optional)</h3>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>If this is a pre-cooked item, list its raw ingredients</p>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={handleAddRecipeItem} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <Plus size={14} /> Add Raw Material
                  </button>
                </div>
                
                {formData.recipe.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', background: '#ffffff', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <select 
                      style={{ flex: 2, background: 'var(--bg-dark)' }} 
                      value={r.ingredient} 
                      onChange={e => handleRecipeChange(i, 'ingredient', e.target.value)}
                    >
                      {inventory.map(ing => (
                        <option key={ing._id} value={ing._id}>{ing.name} ({ing.unit})</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      style={{ flex: 1, background: 'var(--bg-dark)' }} 
                      placeholder="Qty used" 
                      step="0.01"
                      value={r.quantity} 
                      onChange={e => handleRecipeChange(i, 'quantity', e.target.value)}
                    />
                    <button type="button" onClick={() => handleRemoveRecipeItem(i)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>Save Inventory Item</button>
            </form>
          </div>
        </div>
      )}

      {/* Prepare Batch Modal */}
      {isPrepareModalOpen && preparingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass animate-slide-up" style={{ width: '400px', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Prepare Batch</h2>
              <button onClick={() => setIsPrepareModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Preparing {preparingItem.name} will deduct its raw ingredients from your inventory and increase this item's stock.
            </p>
            
            <form onSubmit={handlePrepareBatch}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Quantity to Prepare ({preparingItem.unit})</label>
                <input required type="number" value={prepareQuantity} onChange={e => setPrepareQuantity(e.target.value)} placeholder="e.g. 10" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>Confirm & Prepare</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;
