import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, X, Trash2, Edit2, ToggleLeft, ToggleRight, Tag, Percent, DollarSign, Calendar, Flame, AlertCircle } from 'lucide-react';

const logoImg = "/flaym-logo.jpg";

export default function AdminPromos() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    badge: 'Limited Offer',
    discount_type: 'percentage', // percentage | fixed
    discount_value: 0,
    is_active: true,
    category_restriction: 'All', // All | Combo | Meatbox | Shawarma
    expiryText: '',
    ctaText: 'Grab Offer',
    ctaLink: '/menu',
    sort_order: 1
  });

  // Listen to Firestore promos in real-time
  useEffect(() => {
    const q = query(collection(db, 'promos'), orderBy('sort_order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPromos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error listening to promos: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const togglePromoStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'promos', id), { is_active: !currentStatus });
    } catch (err) {
      console.error("Failed to toggle promo status: ", err);
      alert("Failed to update status.");
    }
  };

  const openAddModal = () => {
    setEditingPromo(null);
    setForm({
      code: '',
      title: '',
      description: '',
      badge: 'Limited Offer',
      discount_type: 'percentage',
      discount_value: 0,
      is_active: true,
      category_restriction: 'All',
      expiryText: '',
      ctaText: 'Grab Offer',
      ctaLink: '/menu',
      sort_order: promos.length + 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (promo: any) => {
    setEditingPromo(promo);
    setForm({
      code: promo.code || '',
      title: promo.title || '',
      description: promo.description || '',
      badge: promo.badge || 'Limited Offer',
      discount_type: promo.discount_type || 'percentage',
      discount_value: promo.discount_value || 0,
      is_active: promo.is_active !== undefined ? promo.is_active : true,
      category_restriction: promo.category_restriction || 'All',
      expiryText: promo.expiryText || '',
      ctaText: promo.ctaText || 'Grab Offer',
      ctaLink: promo.ctaLink || '/menu',
      sort_order: promo.sort_order || 1
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete promo code "${code}"?`)) return;
    try {
      await deleteDoc(doc(db, 'promos', id));
    } catch (err) {
      console.error("Failed to delete promo: ", err);
      alert("Failed to delete promo.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      alert("Promo code cannot be empty.");
      return;
    }

    setSaving(true);
    const promoCode = form.code.trim().toUpperCase();

    const promoData = {
      code: promoCode,
      title: form.title.trim(),
      description: form.description.trim(),
      badge: form.badge.trim(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      is_active: form.is_active,
      category_restriction: form.category_restriction,
      expiryText: form.expiryText.trim(),
      ctaText: form.ctaText.trim(),
      ctaLink: form.ctaLink.trim(),
      sort_order: Number(form.sort_order),
      created_at: editingPromo ? (editingPromo.created_at || Date.now()) : Date.now()
    };

    try {
      if (editingPromo) {
        // Update existing promo code
        await setDoc(doc(db, 'promos', editingPromo.id), promoData);
      } else {
        // Add new promo code
        // Ensure the promo code doesn't already exist as a collection doc name or custom code
        const alreadyExists = promos.some(p => p.code === promoCode);
        if (alreadyExists) {
          alert(`Promo code "${promoCode}" already exists! Please use a unique code.`);
          setSaving(false);
          return;
        }
        await addDoc(collection(db, 'promos'), promoData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving promo: ", err);
      alert("Failed to save promo. Please check console errors.");
    } finally {
      setSaving(false);
    }
  };

  // Seed default promo codes if the collection is empty so the user has some templates right away!
  const seedDefaultPromos = async () => {
    if (promos.length > 0) {
      alert("Promos already exist. Seeding is not required.");
      return;
    }
    setSaving(true);
    try {
      const defaultData = [
        {
          code: 'MIRPUR15',
          title: 'Mirpur Midweek Madness',
          description: 'Craving the heat? Get 15% OFF on any Combo meal when delivering in Mirpur. Order now and satisfy your soul.',
          badge: 'Mirpur Special',
          discount_type: 'percentage',
          discount_value: 15,
          is_active: true,
          category_restriction: 'Combos',
          expiryText: 'Valid Monday - Wednesday',
          ctaText: 'Grab Combo Now',
          ctaLink: '/menu',
          sort_order: 1,
          created_at: Date.now()
        },
        {
          code: 'SHAWARMADUO',
          title: 'Sizzling Shawarma Duo',
          description: 'Double the wraps, double the flavor! Buy any 2 Premium Shawarmas and get a Flaym Special Shawarma absolutely free.',
          badge: 'Limited Offer',
          discount_type: 'fixed',
          discount_value: 180, // value in BDT representing the free shawarma or general discount
          is_active: true,
          category_restriction: 'Shawarma',
          expiryText: 'Everyday from 4 PM - 7 PM',
          ctaText: 'Get Wraps',
          ctaLink: '/menu',
          sort_order: 2,
          created_at: Date.now()
        },
        {
          code: 'FLAYM20',
          title: 'New Customer Discount',
          description: 'First time ordering from FLAYM? Welcome to the heat! Use this code to get a flat 20% discount on your entire order.',
          badge: 'Welcome Offer',
          discount_type: 'percentage',
          discount_value: 20,
          is_active: true,
          category_restriction: 'All',
          expiryText: 'Valid on first order only',
          ctaText: 'Feast Now',
          ctaLink: '/menu',
          sort_order: 3,
          created_at: Date.now()
        }
      ];

      for (const p of defaultData) {
        await addDoc(collection(db, 'promos'), p);
      }
      alert("Successfully seeded default promo codes!");
    } catch (err) {
      console.error("Error seeding promos: ", err);
      alert("Seeding failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center py-20 border border-cream/10 bg-charcoal/20" style={{ borderRadius: '8px' }}>
          <img src={logoImg} alt="Loading..." className="w-20 h-20 animate-pulse rounded-full border border-ember/20 p-2" />
          <h2 className="font-display text-lg uppercase tracking-widest text-ember mt-4">Loading Promo Campaigns...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full text-left">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-cream/10 pb-6">
        <div>
          <h1 className="font-display text-4xl text-cream uppercase tracking-wider">Promo Campaigns</h1>
          <p className="text-xs text-cream/50 uppercase tracking-widest mt-1">Manage discount coupons, special codes, and homepage banners</p>
        </div>
        <div className="flex gap-3">
          {promos.length === 0 && (
            <button
              onClick={seedDefaultPromos}
              disabled={saving}
              className="border border-ember/40 hover:border-ember text-ember font-bold py-3 px-6 text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
              style={{ borderRadius: '6px' }}
            >
              Seed Default Promos
            </button>
          )}
          <button
            onClick={openAddModal}
            className="bg-ember text-charcoal font-bold py-3 px-6 text-xs uppercase tracking-wider hover:bg-ember/90 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,90,31,0.2)] cursor-pointer"
            style={{ borderRadius: '6px' }}
          >
            <Plus size={16} />
            Add New Promo Code
          </button>
        </div>
      </div>

      {promos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-cream/20 bg-charcoal/10 text-center" style={{ borderRadius: '8px' }}>
          <Tag size={48} className="text-cream/20 mb-4 animate-pulse" />
          <p className="text-cream font-display text-lg uppercase tracking-wide">No Promo Codes Registered</p>
          <p className="text-cream/50 text-xs mt-1 mb-6 max-w-sm">Create a promo code to offer instant percentages or flat discounts to your customers at checkout!</p>
          <button
            onClick={openAddModal}
            className="bg-cream/10 hover:bg-cream/20 text-cream font-bold py-2.5 px-6 uppercase tracking-wider text-xs transition-colors cursor-pointer"
            style={{ borderRadius: '6px' }}
          >
            Create Your First Promo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className={`bg-charcoal/40 border transition-all duration-300 p-6 flex flex-col justify-between relative group ${
                promo.is_active ? 'border-ember/30 hover:border-ember shadow-[0_0_15px_rgba(255,90,31,0.03)]' : 'border-cream/10 grayscale opacity-60'
              }`}
              style={{ borderRadius: '8px' }}
            >
              {/* Top Row with Badges and Active Switch */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <span className="bg-ember/10 text-ember border border-ember/20 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1" style={{ borderRadius: '4px' }}>
                  <Flame size={10} className="inline mr-1 -mt-0.5" />
                  {promo.badge || 'Promo'}
                </span>
                
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-mono uppercase tracking-wider font-bold ${promo.is_active ? 'text-green-500' : 'text-cream/40'}`}>
                    {promo.is_active ? 'On' : 'Off'}
                  </span>
                  <button
                    onClick={() => togglePromoStatus(promo.id, promo.is_active)}
                    className="text-cream/60 hover:text-ember transition-colors cursor-pointer focus:outline-none"
                    title={promo.is_active ? 'Deactivate Code' : 'Activate Code'}
                  >
                    {promo.is_active ? (
                      <ToggleRight size={28} className="text-ember" />
                    ) : (
                      <ToggleLeft size={28} className="text-cream/30" />
                    )}
                  </button>
                </div>
              </div>

              {/* Promo Code & Discount */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-mono text-2xl font-black text-cream tracking-wider uppercase bg-charcoal border border-cream/10 px-3 py-1 rounded w-fit">
                    {promo.code}
                  </h3>
                  <div className="flex items-center gap-1 text-ember font-bold font-display text-lg">
                    {promo.discount_type === 'percentage' ? (
                      <><Percent size={16} /> <span>{promo.discount_value}% OFF</span></>
                    ) : (
                      <><DollarSign size={16} /> <span>{promo.discount_value}৳ OFF</span></>
                    )}
                  </div>
                </div>
                <h4 className="font-display text-xl text-cream font-bold uppercase mt-3 leading-tight">{promo.title || 'Untitled Campaign'}</h4>
                <p className="text-xs text-cream/70 mt-1.5 leading-relaxed min-h-[40px]">{promo.description || 'No description provided.'}</p>
              </div>

              {/* Meta Stats & Restrictions */}
              <div className="border-t border-cream/10 pt-4 mt-2 space-y-2 text-xs text-cream/50">
                <div className="flex justify-between">
                  <span>Category Allowed:</span>
                  <span className="font-bold text-cream/80 bg-cream/5 px-2 py-0.5 rounded border border-cream/10">{promo.category_restriction || 'All'}</span>
                </div>
                {promo.expiryText && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-ember" /> Expiry:
                    </span>
                    <span className="text-cream/80 font-medium truncate max-w-[180px]">{promo.expiryText}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-2 border-t border-cream/10 pt-4 mt-4 relative z-10">
                <button
                  onClick={() => openEditModal(promo)}
                  className="p-2 border border-cream/10 hover:border-ember hover:bg-ember/10 text-cream/50 hover:text-ember transition-colors cursor-pointer"
                  style={{ borderRadius: '6px' }}
                  title="Edit Campaign"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(promo.id, promo.code)}
                  className="p-2 border border-cream/10 hover:border-deep-red hover:bg-deep-red/10 text-cream/50 hover:text-deep-red transition-colors cursor-pointer"
                  style={{ borderRadius: '6px' }}
                  title="Delete Code"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-charcoal border border-ember/30 max-w-xl w-full max-h-[90vh] overflow-y-auto" style={{ borderRadius: '8px' }}>
            {/* Modal Header */}
            <div className="p-6 border-b border-cream/10 flex items-center justify-between">
              <h2 className="font-display text-2xl uppercase text-cream flex items-center gap-2">
                <Tag className="text-ember" />
                {editingPromo ? `Modify Promo: ${form.code}` : 'Register New Promo Code'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-cream/50 hover:text-ember transition-colors cursor-pointer focus:outline-none">
                <X size={24} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Code */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Promo Code *</label>
                  <input
                    required
                    type="text"
                    disabled={!!editingPromo}
                    placeholder="e.g. MIRPUR15"
                    className="w-full bg-charcoal/50 border border-cream/20 px-4 py-2.5 text-cream font-mono font-bold uppercase focus:border-ember outline-none disabled:opacity-50 disabled:bg-black/20"
                    value={form.code}
                    onChange={e => setForm({...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')})}
                  />
                  <p className="text-[10px] text-cream/40">Uppercase letters & numbers only. Unique identifier.</p>
                </div>

                {/* Badge */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Mirpur Special"
                    className="w-full bg-charcoal/50 border border-cream/20 px-4 py-2.5 text-cream focus:border-ember outline-none"
                    value={form.badge}
                    onChange={e => setForm({...form, badge: e.target.value})}
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mirpur Midweek Madness"
                  className="w-full bg-charcoal/50 border border-cream/20 px-4 py-2.5 text-cream focus:border-ember outline-none"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Campaign Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell your customers about the terms, conditions, or mouth-watering menu items involved in this promotion."
                  className="w-full bg-charcoal/50 border border-cream/20 px-4 py-2.5 text-cream focus:border-ember outline-none text-sm leading-relaxed"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Discount Type */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Discount Type</label>
                  <select
                    className="w-full bg-charcoal border border-cream/20 px-4 py-2.5 text-cream focus:border-ember outline-none"
                    value={form.discount_type}
                    onChange={e => setForm({...form, discount_type: e.target.value})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Discount Value *</label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min="0"
                      className="w-full bg-charcoal/50 border border-cream/20 pl-4 pr-10 py-2.5 text-cream focus:border-ember outline-none"
                      value={form.discount_value || ''}
                      onChange={e => setForm({...form, discount_value: Math.max(0, Number(e.target.value))})}
                    />
                    <div className="absolute top-0 right-0 h-full flex items-center pr-4 text-cream/50 pointer-events-none">
                      {form.discount_type === 'percentage' ? '%' : '৳'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Restriction */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Category Restriction</label>
                  <select
                    className="w-full bg-charcoal border border-cream/20 px-4 py-2.5 text-cream focus:border-ember outline-none"
                    value={form.category_restriction}
                    onChange={e => setForm({...form, category_restriction: e.target.value})}
                  >
                    <option value="All">All Categories</option>
                    <option value="Combos">Combos</option>
                    <option value="Meatbox">Meatbox</option>
                    <option value="Shawarma">Shawarma</option>
                  </select>
                </div>

                {/* Expiry Text */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Validity / Expiry Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Valid Monday - Wednesday"
                    className="w-full bg-charcoal/50 border border-cream/20 px-4 py-2.5 text-cream focus:border-ember outline-none"
                    value={form.expiryText}
                    onChange={e => setForm({...form, expiryText: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CTA Text */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">CTA Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Grab Combo Now"
                    className="w-full bg-charcoal/50 border border-cream/20 px-4 py-2.5 text-cream focus:border-ember outline-none"
                    value={form.ctaText}
                    onChange={e => setForm({...form, ctaText: e.target.value})}
                  />
                </div>

                {/* CTA Link */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">CTA Link</label>
                  <input
                    type="text"
                    placeholder="e.g. /menu"
                    className="w-full bg-charcoal/50 border border-cream/20 px-4 py-2.5 text-cream focus:border-ember outline-none"
                    value={form.ctaLink}
                    onChange={e => setForm({...form, ctaLink: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* Active status */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-ember cursor-pointer"
                    checked={form.is_active}
                    onChange={e => setForm({...form, is_active: e.target.checked})}
                  />
                  <span className="text-xs font-bold text-cream/80 uppercase tracking-wider">Active Campaign</span>
                </label>

                {/* Sort Order */}
                <div className="flex items-center gap-3 justify-end">
                  <label className="text-xs font-bold text-cream/70 uppercase tracking-wider">Sort Order</label>
                  <input
                    type="number"
                    className="w-20 bg-charcoal/50 border border-cream/20 px-3 py-1.5 text-cream text-center focus:border-ember outline-none"
                    value={form.sort_order}
                    onChange={e => setForm({...form, sort_order: Number(e.target.value)})}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-cream/10 pt-5 mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border border-cream/15 hover:bg-cream/5 text-cream font-bold py-3 px-6 text-xs uppercase tracking-wider cursor-pointer"
                  style={{ borderRadius: '6px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-ember text-charcoal font-bold py-3 px-8 text-xs uppercase tracking-wider hover:bg-ember/90 transition-colors disabled:opacity-50 cursor-pointer"
                  style={{ borderRadius: '6px' }}
                >
                  {saving ? 'Processing...' : (editingPromo ? 'Save Changes' : 'Launch Promo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
