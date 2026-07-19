import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../lib/store';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, setDoc, writeBatch, getDoc, query, where, getDocs } from 'firebase/firestore';
import { Flame, Tag, Check, AlertCircle, Sparkles, Heart, MapPin } from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { Helmet } from 'react-helmet-async';

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    delivery_charge: 70,
    bkash_number: '01712345678',
    nagad_number: '01712345678',
    bkash_qr_url: '',
    nagad_qr_url: '',
    delivery_area: 'Mirpur Area'
  });

  const [isSystemDark, setIsSystemDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    address: '',
    landmark: '',
    paymentMethod: 'Cash on Delivery',
    transactionId: '',
    map_location: ''
  });

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const [tipType, setTipType] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetPercentage, setSelectedPresetPercentage] = useState<number>(0);
  const [customTipInput, setCustomTipInput] = useState<string>('');

  const subtotal = getTotal();
  
  const tipAmount = tipType === 'preset'
    ? Math.round(subtotal * (selectedPresetPercentage / 100))
    : (Number(customTipInput) || 0);

  const deliveryCharge = formData.paymentMethod === 'Cash on Delivery' ? 70 : 40;
  const total = subtotal - discountAmount + deliveryCharge + tipAmount;

  // Real-time recalculation of promo discount if cart subtotal changes
  useEffect(() => {
    if (appliedPromo) {
      let calculatedDiscount = 0;
      if (appliedPromo.discount_type === 'percentage') {
        calculatedDiscount = Math.round(subtotal * (Number(appliedPromo.discount_value) / 100));
      } else {
        calculatedDiscount = Number(appliedPromo.discount_value);
      }
      calculatedDiscount = Math.min(calculatedDiscount, subtotal);
      setDiscountAmount(calculatedDiscount);
    } else {
      setDiscountAmount(0);
    }
  }, [subtotal, appliedPromo]);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) {
      setPromoError("Please enter a promo code.");
      setPromoSuccess(null);
      return;
    }
    setValidatingPromo(true);
    setPromoError(null);
    setPromoSuccess(null);
    const code = promoCodeInput.trim().toUpperCase();

    try {
      const q = query(
        collection(db, 'promos'),
        where('code', '==', code),
        where('is_active', '==', true)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setPromoError("Invalid or expired promo code.");
        setAppliedPromo(null);
        setDiscountAmount(0);
      } else {
        const promoDoc = snapshot.docs[0];
        const promoData = promoDoc.data();
        
        // Check category restriction
        const restriction = promoData.category_restriction || 'All';
        if (restriction !== 'All') {
          // Check if any item in cart matches the restricted category
          const hasEligibleItem = items.some(item => {
            return (item as any).category === restriction;
          });

          if (!hasEligibleItem) {
            setPromoError(`This promo code is only valid for items in the "${restriction}" category.`);
            setAppliedPromo(null);
            setDiscountAmount(0);
            setValidatingPromo(false);
            return;
          }
        }

        // Calculate discount
        let calculatedDiscount = 0;
        if (promoData.discount_type === 'percentage') {
          calculatedDiscount = Math.round(subtotal * (Number(promoData.discount_value) / 100));
        } else {
          calculatedDiscount = Number(promoData.discount_value);
        }

        // Bound discount by subtotal
        calculatedDiscount = Math.min(calculatedDiscount, subtotal);

        setDiscountAmount(calculatedDiscount);
        setAppliedPromo({ id: promoDoc.id, ...promoData });
        setPromoSuccess(`Promo code "${code}" applied successfully! Saved ${calculatedDiscount}৳`);
      }
    } catch (err) {
      console.error("Error validating promo:", err);
      setPromoError("Failed to apply promo code. Please try again.");
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoCodeInput('');
    setPromoSuccess(null);
    setPromoError(null);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'store_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            delivery_charge: typeof data.delivery_charge === 'number' ? data.delivery_charge : 70,
            bkash_number: data.bkash_number || '01712345678',
            nagad_number: data.nagad_number || '01712345678',
            bkash_qr_url: data.bkash_qr_url || '',
            nagad_qr_url: data.nagad_qr_url || '',
            delivery_area: data.delivery_area || 'Mirpur Area'
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    };
    fetchSettings();
  }, []);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderNumber = `FL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const orderRef = doc(collection(db, 'orders'));
      const batch = writeBatch(db);

      batch.set(orderRef, {
        order_number: orderNumber,
        customer_id: user?.uid || null,
        customer_email: user?.email || null,
        customer_name: formData.name,
        phone: formData.phone,
        address: formData.address,
        landmark: formData.landmark,
        map_location: formData.map_location,
        payment_method: formData.paymentMethod,
        transaction_id: formData.transactionId,
        subtotal,
        delivery_charge: deliveryCharge,
        discount_amount: discountAmount,
        tip_amount: tipAmount,
        applied_promo_code: appliedPromo ? appliedPromo.code : null,
        total,
        total_cost: items.reduce((acc, item) => acc + (item.price * 0.7 * item.quantity), 0), // Placeholder cost logic
        status: 'pending',
        admin_acknowledged: false,
        created_at: Date.now(),
        updated_at: Date.now()
      });

      items.forEach(item => {
        const itemRef = doc(collection(db, `orders/${orderRef.id}/items`));
        batch.set(itemRef, {
          product_id: item.id,
          name_snapshot: item.name,
          unit_price: item.price,
          unit_cost: item.price * 0.7,
          quantity: item.quantity,
          line_total: item.price * item.quantity
        });
      });

      await batch.commit();
      clearCart();
      navigate(`/order/${orderNumber}?phone=${formData.phone}`);
    } catch (err) {
      console.error("Failed to place order:", err);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8 md:py-12">
      <Helmet>
        <title>Flaym | Checkout</title>
        <meta name="description" content="Complete your order and get ready for the best flame-grilled experience." />
      </Helmet>
      <h1 className={`font-display text-3xl md:text-4xl mb-6 md:mb-8 uppercase tracking-tight transition-colors duration-300 ${isSystemDark ? 'text-ember' : 'text-ember'}`}>Checkout</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        <div className={`backdrop-blur-xl border p-4 md:p-6 rounded-md transition-colors duration-300 ${isSystemDark ? 'bg-charcoal/60 border-ember/20 shadow-lg shadow-black/20' : 'bg-white/80 border-gray-100 shadow-sm'}`}>
          <h2 className={`font-display text-xl md:text-2xl mb-4 md:mb-6 uppercase border-b pb-3 md:pb-4 transition-colors duration-300 ${isSystemDark ? 'text-cream border-cream/10' : 'text-gray-900 border-gray-200'}`}>Delivery Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div className="space-y-1.5">
              <label className={`block text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-700'}`}>Full Name *</label>
              <input required type="text" className={`w-full border px-3 py-2.5 text-sm focus:border-ember focus:outline-none transition-all rounded ${isSystemDark ? 'bg-charcoal/50 border-cream/20 text-cream' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className={`block text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-700'}`}>Phone Number *</label>
              <input required type="tel" className={`w-full border px-3 py-2.5 text-sm focus:border-ember focus:outline-none transition-all rounded ${isSystemDark ? 'bg-charcoal/50 border-cream/20 text-cream' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className={`block text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-700'}`}>Full Address ({settings.delivery_area}) *</label>
              <textarea required rows={2} className={`w-full border px-3 py-2.5 text-sm focus:border-ember focus:outline-none transition-all rounded ${isSystemDark ? 'bg-charcoal/50 border-cream/20 text-cream' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className={`block text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-700'}`}>Landmark (Optional)</label>
              <input type="text" className={`w-full border px-3 py-2.5 text-sm focus:border-ember focus:outline-none transition-all rounded ${isSystemDark ? 'bg-charcoal/50 border-cream/20 text-cream' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} />
            </div>
          </div>
        </div>

        <div className={`backdrop-blur-xl border p-4 md:p-6 rounded-md transition-colors duration-300 ${isSystemDark ? 'bg-charcoal/60 border-ember/20 shadow-lg shadow-black/20' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h2 className={`font-display text-xl md:text-2xl mb-4 md:mb-6 uppercase border-b pb-3 md:pb-4 transition-colors duration-300 ${isSystemDark ? 'text-cream border-cream/10' : 'text-gray-900 border-gray-200'}`}>Payment Method</h2>
          <div className="space-y-3">
            {['Cash on Delivery', 'bKash', 'Nagad'].map(method => (
              <label key={method} className={`flex items-center gap-3 p-3 border cursor-pointer transition-all rounded ${formData.paymentMethod === method ? 'border-ember bg-ember/5 shadow-inner' : isSystemDark ? 'border-cream/20 hover:border-cream/50' : 'border-gray-200 hover:border-gray-400'}`}>
                <input type="radio" name="paymentMethod" value={method} checked={formData.paymentMethod === method} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="accent-ember w-4 h-4" />
                <span className={`text-sm md:text-base font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>{method}</span>
              </label>
            ))}
          </div>

          {(formData.paymentMethod === 'bKash' || formData.paymentMethod === 'Nagad') && (
            <div className={`mt-5 p-4 border border-ember/30 bg-ember/5 space-y-4 text-left rounded backdrop-blur-md`}>
              <p className={`text-xs md:text-sm transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-600'}`}>Please send {total}৳ to our merchant number: <span className="font-bold text-ember">{formData.paymentMethod === 'bKash' ? settings.bkash_number : settings.nagad_number}</span></p>
              
              {formData.paymentMethod === 'bKash' && settings.bkash_qr_url && (
                <div className={`flex flex-col items-center py-3 border rounded my-2 transition-colors duration-300 ${isSystemDark ? 'bg-black/40 border-cream/5' : 'bg-gray-50 border-gray-100'}`}>
                  <span className={`text-[10px] font-mono uppercase tracking-widest mb-2 transition-colors duration-300 ${isSystemDark ? 'text-cream/50' : 'text-gray-400'}`}>Scan QR to pay</span>
                  <img src={settings.bkash_qr_url} alt="bKash QR" className="w-40 h-40 object-contain border border-ember/20 p-2 bg-white rounded" />
                </div>
              )}

              {formData.paymentMethod === 'Nagad' && settings.nagad_qr_url && (
                <div className={`flex flex-col items-center py-3 border rounded my-2 transition-colors duration-300 ${isSystemDark ? 'bg-black/40 border-cream/5' : 'bg-gray-50 border-gray-100'}`}>
                  <span className={`text-[10px] font-mono uppercase tracking-widest mb-2 transition-colors duration-300 ${isSystemDark ? 'text-cream/50' : 'text-gray-400'}`}>Scan QR to pay</span>
                  <img src={settings.nagad_qr_url} alt="Nagad QR" className="w-40 h-40 object-contain border border-ember/20 p-2 bg-white rounded" />
                </div>
              )}

              <div className="space-y-1.5">
                <label className={`block text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-500'}`}>Transaction ID *</label>
                <input required type="text" className={`w-full border px-3 py-2.5 text-sm focus:border-ember focus:outline-none rounded transition-all ${isSystemDark ? 'bg-charcoal/50 border-ember/50 text-cream' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.transactionId} onChange={e => setFormData({...formData, transactionId: e.target.value})} />
              </div>
            </div>
          )}
        </div>

        {/* Delivery Tip Selector */}
        <div className={`backdrop-blur-xl border p-4 md:p-6 rounded-md transition-colors duration-300 ${isSystemDark ? 'bg-charcoal/60 border-cream/10 shadow-lg shadow-black/20' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h2 className={`font-display text-xl md:text-2xl mb-4 md:mb-6 uppercase border-b pb-3 md:pb-4 flex items-center gap-2 transition-colors duration-300 ${isSystemDark ? 'text-cream border-cream/10' : 'text-gray-900 border-gray-200'}`}>
            <Heart size={20} className="text-ember animate-pulse" />
            Delivery Tip
          </h2>
          <p className={`text-[10px] md:text-xs uppercase tracking-wider font-mono mb-4 transition-colors duration-300 ${isSystemDark ? 'text-cream/60' : 'text-gray-700'}`}>100% of your tip goes to your delivery rider.</p>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 md:gap-3">
              {[0, 5, 10, 15].map((preset) => (
                <button
                  key={`tip-${preset}`}
                  type="button"
                  onClick={() => {
                    setTipType('preset');
                    setSelectedPresetPercentage(preset);
                    setCustomTipInput('');
                  }}
                  className={`flex-1 min-w-[70px] py-2.5 px-3 font-bold uppercase tracking-wider text-xs transition-all rounded ${
                    tipType === 'preset' && selectedPresetPercentage === preset
                      ? 'bg-ember text-charcoal border border-ember shadow-[0_0_10px_rgba(255,90,31,0.25)]'
                      : isSystemDark ? 'bg-charcoal/50 text-cream/70 border border-cream/20 hover:border-ember/50 hover:text-ember' : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-ember/50 hover:text-ember'
                  }`}
                >
                  {preset === 0 ? 'No Tip' : `${preset}%`}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className={`block text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1.5 transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-700'}`}>Custom Tip Amount (৳)</label>
              <input
                type="number"
                min="0"
                placeholder="Enter amount"
                className={`w-full border px-3 py-2.5 text-sm font-mono font-bold focus:outline-none transition-all rounded ${
                  tipType === 'custom' ? 'border-ember' : isSystemDark ? 'bg-charcoal/50 border-cream/20 text-cream focus:border-ember/70' : 'bg-white border-gray-300 text-gray-900 focus:border-ember/70'
                }`}
                value={customTipInput}
                onChange={(e) => {
                  setTipType('custom');
                  setCustomTipInput(e.target.value);
                  setSelectedPresetPercentage(0);
                }}
              />
            </div>
          </div>
        </div>

        {/* Promo Code Entry Box */}
        <div className={`backdrop-blur-xl border p-4 md:p-6 rounded-md transition-colors duration-300 ${isSystemDark ? 'bg-charcoal/60 border-cream/10 shadow-lg shadow-black/20' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h2 className={`font-display text-xl md:text-2xl mb-4 md:mb-6 uppercase border-b pb-3 md:pb-4 flex items-center gap-2 transition-colors duration-300 ${isSystemDark ? 'text-cream border-cream/10' : 'text-gray-900 border-gray-200'}`}>
            <Tag size={20} className="text-ember animate-pulse" />
            Promo Code
          </h2>

          {!appliedPromo ? (
            <div className="space-y-3">
              <p className={`text-[10px] md:text-xs uppercase tracking-wider font-mono transition-colors duration-300 ${isSystemDark ? 'text-cream/60' : 'text-gray-700'}`}>Have a special coupon or promotional discount code?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. MIRPUR15"
                  className={`border px-3 py-2.5 text-sm font-mono font-bold uppercase focus:border-ember focus:outline-none transition-all flex-grow rounded ${isSystemDark ? 'bg-charcoal/50 border-cream/20 text-cream' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={promoCodeInput}
                  onChange={e => {
                    setPromoCodeInput(e.target.value.toUpperCase());
                    setPromoError(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyPromo();
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={validatingPromo}
                  onClick={handleApplyPromo}
                  className="bg-ember hover:bg-ember/90 text-charcoal font-bold py-2.5 px-4 uppercase tracking-wider text-[10px] md:text-xs transition-all flex items-center gap-2 cursor-pointer rounded shadow-sm"
                >
                  {validatingPromo ? 'Verifying...' : 'Apply Code'}
                </button>
              </div>
              {promoError && (
                <div className="flex items-center gap-1.5 text-deep-red text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1.5">
                  <AlertCircle size={12} />
                  {promoError}
                </div>
              )}
            </div>
          ) : (
            <div className={`bg-ember/5 border border-dashed border-ember/40 p-3 flex justify-between items-center rounded backdrop-blur-sm`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-ember/10 text-ember rounded-full">
                  <Check size={16} />
                </div>
                <div>
                  <h4 className={`font-mono font-bold text-base uppercase tracking-wider flex items-center gap-1.5 transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>
                    {appliedPromo.code}
                    <span className="text-[9px] bg-ember/25 text-ember font-bold px-1.5 py-0.5 rounded uppercase tracking-widest font-sans">
                      {appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}% OFF` : `${appliedPromo.discount_value}৳ OFF`}
                    </span>
                  </h4>
                  <p className={`text-[10px] md:text-xs mt-0.5 leading-relaxed transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-800'}`}>{appliedPromo.title || 'Coupon applied successfully!'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemovePromo}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 border transition-all cursor-pointer rounded ${isSystemDark ? 'text-cream/50 hover:text-deep-red border-cream/10 hover:border-deep-red/30' : 'text-gray-600 hover:text-deep-red border-gray-300 hover:border-deep-red/30'}`}
              >
                Remove
              </button>
            </div>
          )}
          {promoSuccess && !promoError && (
            <div className="flex items-center gap-1.5 text-green-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-2.5 bg-green-500/5 border border-green-500/10 p-2 rounded">
              <Sparkles size={12} className="animate-bounce" />
              {promoSuccess}
            </div>
          )}
        </div>

        {/* Real-time Order Summary Breakdown */}
        <div className={`backdrop-blur-xl border p-4 md:p-6 space-y-3 md:space-y-4 rounded-md transition-colors duration-300 ${isSystemDark ? 'bg-charcoal/60 border-ember/20 shadow-lg shadow-black/20' : 'bg-white/80 border-gray-100 shadow-sm'}`}>
          <h2 className={`font-display text-xl md:text-2xl mb-4 md:mb-6 uppercase border-b pb-3 md:pb-4 transition-colors duration-300 ${isSystemDark ? 'text-cream border-cream/10' : 'text-gray-900 border-gray-100'}`}>Order Summary</h2>
          <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
            <div className={`flex justify-between items-center transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-800'}`}>
              <span>Cart Subtotal</span>
              <span className={`font-mono text-sm md:text-base font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>{subtotal}৳</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-500 font-bold">
                <span className="flex items-center gap-1.5">
                  <Tag size={10} /> Promo Discount ({appliedPromo?.code})
                </span>
                <span className="font-mono text-sm md:text-base">-{discountAmount}৳</span>
              </div>
            )}
            <div className={`flex justify-between items-center transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-800'}`}>
              <span>Delivery Fee ({settings.delivery_area})</span>
              <span className={`font-mono text-sm md:text-base font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>+{deliveryCharge}৳</span>
            </div>
            {tipAmount > 0 && (
              <div className={`flex justify-between items-center transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-800'}`}>
                <span className="flex items-center gap-1.5">
                  <Heart size={10} className="text-ember" /> Delivery Tip
                </span>
                <span className={`font-mono text-sm md:text-base font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>+{tipAmount}৳</span>
              </div>
            )}
            <div className={`border-t pt-3 md:pt-4 flex justify-between items-center font-bold transition-colors duration-300 ${isSystemDark ? 'border-cream/10 text-cream' : 'border-gray-200 text-gray-900'}`}>
              <span className="text-base md:text-lg uppercase font-display tracking-wider">Final Payable Total</span>
              <span className="font-mono text-xl md:text-2xl text-ember">{total}৳</span>
            </div>
          </div>
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full bg-ember text-charcoal font-bold py-3.5 md:py-4 px-4 md:px-6 text-base md:text-lg hover:bg-ember/90 transition-all shadow-[0_4px_20px_rgba(255,90,31,0.25)] uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer rounded-md hover:scale-[1.01]"
        >
          {loading ? <Flame className="animate-pulse" size={18} /> : null}
          {loading ? 'Processing Order...' : `Place Order • ${total}৳`}
        </button>
      </form>
    </div>
  );
}
