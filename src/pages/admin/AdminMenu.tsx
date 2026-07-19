import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Edit2, X, Trash2, Camera, Upload } from 'lucide-react';

const logoImg = "/flaym-logo.jpg";

export default function AdminMenu() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'Meatbox',
    description: '',
    cost_price: 0,
    selling_price: 0,
    image_url: '',
    is_available: true,
    sort_order: 1,
  });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('sort_order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error listening to products: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { is_available: !current });
    } catch (err) {
      console.error(err);
      alert('Failed to update product');
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setForm({
      name: '',
      category: 'Meatbox',
      description: '',
      cost_price: 0,
      selling_price: 0,
      image_url: '/src/assets/images/obsessed_meat_1784306318478.jpg', // Default premium visual as fallback
      is_available: true,
      sort_order: products.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setForm({
      name: product.name || '',
      category: product.category || 'Meatbox',
      description: product.description || '',
      cost_price: product.cost_price || 0,
      selling_price: product.selling_price || 0,
      image_url: product.image_url || '',
      is_available: product.is_available !== undefined ? product.is_available : true,
      sort_order: product.sort_order || 1,
    });
    setIsModalOpen(true);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        image_url: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalCategory = isCustomCategory ? customCategoryInput.trim() : form.category;
      if (!finalCategory) {
        alert('Please specify or enter a category name');
        return;
      }

      const productData = {
        ...form,
        category: finalCategory,
        cost_price: Number(form.cost_price),
        selling_price: Number(form.selling_price),
        sort_order: Number(form.sort_order),
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        alert('Product updated successfully!');
      } else {
        await addDoc(collection(db, 'products'), productData);
        alert('Product added successfully!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      alert('Product deleted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete product');
    }
  };

  const dynamicCategories = Array.from(new Set([
    'Meatbox', 
    'Shawarma', 
    'Combos', 
    ...products.map(p => p.category).filter(Boolean)
  ]));

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-4xl text-cream uppercase tracking-wider">Menu Management</h1>
        <button 
          onClick={openAddModal}
          className="bg-ember text-charcoal font-bold py-2 px-6 uppercase tracking-wider hover:bg-ember/90 transition-colors cursor-pointer"
        >
          Add Item
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-6 border border-cream/10 bg-charcoal/20" style={{ borderRadius: '6px' }}>
            <img 
              src={logoImg} 
              alt="Loading Menu..." 
              className="w-20 h-20 object-contain animate-pulse rounded-full border border-ember/20 p-2 shadow-[0_0_15px_rgba(255,90,31,0.1)]"
              referrerPolicy="no-referrer"
            />
            <h2 className="font-display text-sm uppercase tracking-widest text-ember mt-2 animate-pulse">Loading items...</h2>
          </div>
          <div className="bg-charcoal/30 border border-cream/10 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-cream/5 border-b border-cream/10">
                <tr>
                  <th className="p-4 text-xs tracking-widest text-cream/50 uppercase">Item</th>
                  <th className="p-4 text-xs tracking-widest text-cream/50 uppercase">Category</th>
                  <th className="p-4 text-xs tracking-widest text-cream/50 uppercase">Price</th>
                  <th className="p-4 text-xs tracking-widest text-cream/50 uppercase">Status</th>
                  <th className="p-4 text-xs tracking-widest text-cream/50 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream/5 animate-pulse">
                {[1, 2, 3, 4, 5].map(id => (
                  <tr key={id}>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cream/10 rounded" />
                        <div className="h-4 bg-cream/10 w-28 rounded" />
                      </div>
                    </td>
                    <td className="p-4"><div className="h-4 bg-cream/5 w-20 rounded" /></td>
                    <td className="p-4"><div className="h-4 bg-cream/10 w-12 rounded" /></td>
                    <td className="p-4"><div className="h-7 bg-cream/5 w-24 rounded border border-cream/10" /></td>
                    <td className="p-4"><div className="h-8 bg-cream/5 w-8 rounded-full" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-charcoal/30 border border-cream/10 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-cream/5 border-b border-cream/10">
              <tr>
                <th className="p-4 text-xs tracking-widest text-cream/50 uppercase">Item</th>
                <th className="p-4 text-xs tracking-widest text-cream/50 uppercase">Category</th>
                <th className="p-4 text-xs tracking-widest text-cream/50 uppercase">Price</th>
                <th className="p-4 text-xs tracking-widest text-cream/50 uppercase">Status</th>
                <th className="p-4 text-xs tracking-widest text-cream/50 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/5">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-cream/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover border border-cream/10" />
                      <span className="font-bold text-cream">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-cream/80">{product.category}</td>
                  <td className="p-4 font-bold text-ember">{product.selling_price}৳</td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleAvailability(product.id, product.is_available)}
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border transition-colors ${product.is_available ? 'border-green-500 text-green-500 hover:bg-green-500/10' : 'border-deep-red text-deep-red hover:bg-deep-red/10'}`}
                    >
                      {product.is_available ? 'Available' : 'Sold Out'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="p-2 text-cream/50 hover:text-ember transition-colors cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="p-2 text-cream/50 hover:text-deep-red transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-charcoal border border-ember/20 w-full max-w-lg p-6 relative" style={{ borderRadius: '6px' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-cream/50 hover:text-ember transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
            <h2 className="font-display text-3xl text-cream mb-6 uppercase border-b border-cream/10 pb-4">
              {editingProduct ? 'Edit Menu Item' : 'Add Menu Item'}
            </h2>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Item Name *</label>
                <input 
                  required 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="w-full bg-charcoal border border-cream/20 px-3 py-2 text-cream text-sm focus:border-ember outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Category *</label>
                  {!isCustomCategory ? (
                    <select 
                      value={form.category} 
                      onChange={e => {
                        if (e.target.value === 'NEW_CATEGORY') {
                          setIsCustomCategory(true);
                        } else {
                          setForm({...form, category: e.target.value});
                        }
                      }} 
                      className="w-full bg-charcoal border border-cream/20 px-3 py-2 text-cream text-sm focus:border-ember outline-none"
                    >
                      {dynamicCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="NEW_CATEGORY">+ Add New Category...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        placeholder="New category name"
                        value={customCategoryInput} 
                        onChange={e => setCustomCategoryInput(e.target.value)} 
                        className="w-full bg-charcoal border border-cream/20 px-3 py-2 text-cream text-sm focus:border-ember outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => setIsCustomCategory(false)}
                        className="text-xs font-bold text-ember border border-ember/20 px-3 hover:bg-ember/10 uppercase transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Sort Order</label>
                  <input 
                    type="number" 
                    value={form.sort_order} 
                    onChange={e => setForm({...form, sort_order: Number(e.target.value)})} 
                    className="w-full bg-charcoal border border-cream/20 px-3 py-2 text-cream text-sm focus:border-ember outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Description</label>
                <textarea 
                  rows={6} 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  className="w-full bg-charcoal border border-cream/20 px-3 py-2 text-cream text-sm focus:border-ember outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Cost Price (৳)</label>
                  <input 
                    type="number" 
                    value={form.cost_price} 
                    onChange={e => setForm({...form, cost_price: Number(e.target.value)})} 
                    className="w-full bg-charcoal border border-cream/20 px-3 py-2 text-cream text-sm focus:border-ember outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Selling Price (৳) *</label>
                  <input 
                    required 
                    type="number" 
                    value={form.selling_price} 
                    onChange={e => setForm({...form, selling_price: Number(e.target.value)})} 
                    className="w-full bg-charcoal border border-cream/20 px-3 py-2 text-cream text-sm focus:border-ember outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Image Source</label>
                <div className="flex gap-2">
                  <input 
                    required 
                    type="text" 
                    placeholder="Enter Photo link or upload"
                    value={form.image_url} 
                    onChange={e => setForm({...form, image_url: e.target.value})} 
                    className="flex-grow bg-charcoal border border-cream/20 px-3 py-2 text-cream text-sm focus:border-ember outline-none text-xs font-mono"
                  />
                  <label className="bg-ember/10 hover:bg-ember/20 border border-ember/20 hover:border-ember text-ember text-xs font-bold px-3 py-2 uppercase flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap">
                    <Upload size={14} />
                    Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleProductImageUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
                {form.image_url && form.image_url.startsWith('data:') && (
                  <p className="text-[10px] text-green-400 font-mono mt-1">✓ Photo uploaded successfully (Base64 saved)</p>
                )}
              </div>



              <div className="flex justify-end gap-3 pt-4 border-t border-cream/10">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="border border-cream/20 hover:border-cream/50 text-cream px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-ember text-charcoal hover:bg-ember/90 px-6 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
