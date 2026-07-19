import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { triggerOrderNotification } from '../../lib/firebase';
import { 
  TrendingUp, ShoppingBag, DollarSign, Activity, ChevronRight, Clock, 
  Settings, Tag, X, Edit2, Check, ArrowRight, User, Phone, MapPin, 
  CreditCard, Sparkles, AlertCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const logoImg = "/flaym-logo.jpg";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProfit: 0,
  });
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    landmark: '',
    payment_method: '',
    subtotal: 0,
    delivery_charge: 0,
    discount_amount: 0,
    transaction_id: '',
  });

  useEffect(() => {
    // Listen to real-time updates of all orders
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let revenue = 0;
      let count = 0;
      let pending = 0;
      let cost = 0;
      const allOrders: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const order = { id: doc.id, ...data };
        allOrders.push(order);
        count++;

        if (data.status !== 'canceled') {
          revenue += Number(data.subtotal) || 0;
          cost += Number(data.total_cost) || 0;
        }
        if (data.status === 'pending') {
          pending++;
        }
      });

      setStats({
        totalRevenue: revenue,
        totalOrders: count,
        pendingOrders: pending,
        totalProfit: revenue - cost,
      });

      // Show active orders (pending, confirmed, preparing, out-for-delivery)
      const active = allOrders.filter(o => 
        ['pending', 'confirmed', 'preparing', 'out-for-delivery'].includes(o.status)
      );
      setActiveOrders(active);
      setLoading(false);
    }, (error) => {
      console.error("Real-time orders listener error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync edit form fields when selectedOrder shifts
  useEffect(() => {
    if (selectedOrder) {
      setEditForm({
        customer_name: selectedOrder.customer_name || '',
        phone: selectedOrder.phone || '',
        address: selectedOrder.address || '',
        landmark: selectedOrder.landmark || '',
        payment_method: selectedOrder.payment_method || 'Cash on Delivery',
        subtotal: Number(selectedOrder.subtotal) || 0,
        delivery_charge: Number(selectedOrder.delivery_charge) || 0,
        discount_amount: Number(selectedOrder.discount_amount) || 0,
        transaction_id: selectedOrder.transaction_id || '',
      });
      setIsEditing(false);
    }
  }, [selectedOrder]);

  const fetchOrderItems = async (order: any) => {
    setSelectedOrder(order);
    
    // Mark as acknowledged if needed
    if (order.status === 'pending' && !order.admin_acknowledged) {
       try {
         await updateDoc(doc(db, 'orders', order.id), { admin_acknowledged: true });
       } catch (err) {
         console.error("Failed to acknowledge order:", err);
       }
    }

    setItemsLoading(true);
    setOrderItems([]);
    try {
      const itemsSnap = await getDocs(collection(db, `orders/${order.id}/items`));
      setOrderItems(itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching order items:", err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: newStatus,
        updated_at: Date.now(),
        admin_acknowledged: true // Also acknowledge on status update
      });
      
      await triggerOrderNotification(id, newStatus, 'customer');

      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus, admin_acknowledged: true } : null);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status");
    }
  };

  const handleSaveOrderEdits = async () => {
    if (!selectedOrder) return;
    try {
      const calculatedTotal = Number(editForm.subtotal) + Number(editForm.delivery_charge) - Number(editForm.discount_amount);
      const updateData = {
        customer_name: editForm.customer_name,
        phone: editForm.phone,
        address: editForm.address,
        landmark: editForm.landmark,
        payment_method: editForm.payment_method,
        subtotal: Number(editForm.subtotal),
        delivery_charge: Number(editForm.delivery_charge),
        discount_amount: Number(editForm.discount_amount),
        transaction_id: editForm.transaction_id,
        total: calculatedTotal,
        updated_at: Date.now()
      };
      
      await updateDoc(doc(db, 'orders', selectedOrder.id), updateData);
      setSelectedOrder(prev => prev ? { ...prev, ...updateData } : null);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save order changes:", err);
      alert("Failed to save changes");
    }
  };

  const cards = [
    { label: 'Total Revenue', value: `${stats.totalRevenue}৳`, icon: DollarSign, color: 'text-ember' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-cream' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Activity, color: 'text-deep-red' },
    { label: 'Est. Profit', value: `${stats.totalProfit}৳`, icon: TrendingUp, color: 'text-green-500' },
  ];

  if (loading) {
    return (
      <div className="w-full max-w-full">
        <div className="flex flex-col items-center justify-center py-8 mb-10 border border-cream/10 bg-charcoal/20" style={{ borderRadius: '8px' }}>
          <img 
            src={logoImg} 
            alt="Loading FLAYM..." 
            className="w-24 h-24 object-contain animate-pulse rounded-full border border-ember/20 p-2 shadow-[0_0_15px_rgba(255,90,31,0.1)]"
            referrerPolicy="no-referrer"
          />
          <h2 className="font-display text-lg uppercase tracking-widest text-ember mt-3 animate-pulse">Synchronizing Analytics...</h2>
        </div>

        {/* Pulsing Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(id => (
            <div 
              key={id} 
              className="bg-charcoal/20 border border-cream/5 p-8 flex flex-col items-center text-center animate-pulse"
              style={{ borderRadius: '8px' }}
            >
              <div className="w-12 h-12 bg-cream/5 rounded-full mb-4" />
              <div className="h-4 bg-cream/10 w-24 rounded mb-2" />
              <div className="h-8 bg-cream/10 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* New order notification */}
      {activeOrders.filter(o => o.status === 'pending' && !o.admin_acknowledged).length > 0 && (
         <div className="mb-6 p-4 bg-ember/10 border border-ember rounded animate-pulse text-center">
            <p className="text-ember font-bold">You have {activeOrders.filter(o => o.status === 'pending' && !o.admin_acknowledged).length} new order(s)!</p>
         </div>
      )}
      {/* Title and Meta info */}
      <div className="mb-8 text-left">
        <h1 className="font-display text-4xl text-cream uppercase tracking-wider">Dashboard</h1>
        <p className="text-xs text-cream/50 uppercase tracking-widest mt-1">FLAYM System Operations & Real-time Metrics</p>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className="group relative bg-charcoal/30 border border-cream/10 hover:border-ember/30 p-8 sm:p-6 flex flex-col items-center text-center transition-all duration-300 overflow-hidden"
              style={{ borderRadius: '8px' }}
            >
              <div className="absolute -right-4 -bottom-4 text-cream/[0.02] group-hover:text-cream/[0.05] transition-all duration-500 scale-150 pointer-events-none">
                <Icon size={120} />
              </div>
              <div className="p-4 bg-cream/5 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 border border-cream/5">
                <Icon size={36} className={`${card.color}`} />
              </div>
              <p className="text-xs text-cream/50 uppercase tracking-widest font-mono font-bold mb-2">{card.label}</p>
              <p className="font-display text-4xl sm:text-3xl lg:text-4xl text-cream font-black tracking-tight">{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Premium Quick Actions Panel */}
      <div className="mt-10 text-left">
        <h2 className="font-display text-xs text-ember font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
          <Activity size={14} className="animate-pulse" />
          Quick Admin Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/admin/orders"
            className="group relative bg-gradient-to-br from-charcoal to-charcoal/80 border border-ember/30 hover:border-ember p-6 flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(255,90,31,0.15)] overflow-hidden"
            style={{ borderRadius: '8px' }}
          >
            <div className="absolute top-0 right-0 p-3 text-ember opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
              <ShoppingBag size={48} />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-mono text-ember uppercase tracking-widest">Orders Engine</span>
              <h3 className="font-display text-xl text-cream font-black uppercase mt-2 group-hover:text-ember transition-colors">Manage Orders</h3>
              <p className="text-xs text-cream/60 mt-1">Review pending requests, update tracking status, and cancel orders.</p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs text-ember font-bold uppercase tracking-wider">
              Launch Dispatch <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admin/menu"
            className="group relative bg-gradient-to-br from-charcoal to-charcoal/80 border border-cream/10 hover:border-cream/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden"
            style={{ borderRadius: '8px' }}
          >
            <div className="absolute top-0 right-0 p-3 text-cream opacity-10 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300">
              <TrendingUp size={48} />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-mono text-cream/50 uppercase tracking-widest">Inventory Control</span>
              <h3 className="font-display text-xl text-cream font-black uppercase mt-2 group-hover:text-ember transition-colors">Food Menu</h3>
              <p className="text-xs text-cream/60 mt-1">Add hot new wood-fired recipes, edit pricing, or toggle availability.</p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs text-cream/70 font-bold uppercase tracking-wider group-hover:text-ember transition-colors">
              Open Menu <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admin/promos"
            className="group relative bg-gradient-to-br from-charcoal to-charcoal/80 border border-cream/10 hover:border-cream/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden"
            style={{ borderRadius: '8px' }}
          >
            <div className="absolute top-0 right-0 p-3 text-cream opacity-10 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300">
              <Tag size={48} />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-mono text-cream/50 uppercase tracking-widest">Offers & Coupons</span>
              <h3 className="font-display text-xl text-cream font-black uppercase mt-2 group-hover:text-ember transition-colors">Promo Campaigns</h3>
              <p className="text-xs text-cream/60 mt-1">Create discount codes, toggle active statuses, and update homepage banners.</p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs text-cream/70 font-bold uppercase tracking-wider group-hover:text-ember transition-colors">
              Manage Promos <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admin/settings"
            className="group relative bg-gradient-to-br from-charcoal to-charcoal/80 border border-cream/10 hover:border-cream/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden"
            style={{ borderRadius: '8px' }}
          >
            <div className="absolute top-0 right-0 p-3 text-cream opacity-10 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300">
              <Settings size={48} />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-mono text-cream/50 uppercase tracking-widest">System Engine</span>
              <h3 className="font-display text-xl text-cream font-black uppercase mt-2 group-hover:text-ember transition-colors">Store Settings</h3>
              <p className="text-xs text-cream/60 mt-1">Configure bKash/Nagad accounts, delivery area names, and system details.</p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs text-cream/70 font-bold uppercase tracking-wider group-hover:text-ember transition-colors">
              Access Core <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
      
      {/* Live Orders Section (replaced Live Activity Stream) */}
      <div className="mt-12 bg-charcoal/30 border border-cream/10 p-6 md:p-8" style={{ borderRadius: '8px' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-cream/10 text-left">
          <div>
            <h2 className="font-display text-2xl text-cream uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping inline-block" />
              Live Orders
            </h2>
            <p className="text-xs text-cream/50 uppercase tracking-widest mt-1">Real-time active order dispatcher & operations</p>
          </div>
          <span className="text-xs bg-cream/5 border border-cream/10 text-cream/70 px-3 py-1 font-mono rounded-full uppercase tracking-wider font-bold">
            {activeOrders.length} Active Orders
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-cream/30">
            <Activity size={40} className="stroke-1 mb-3 text-cream/20 animate-pulse" />
            <p className="text-sm font-medium">All orders cleared! No active orders right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-cream/5 text-left">
            {activeOrders.map((order) => {
              let statusClass = 'border-cream/20 text-cream/60';
              if (order.status === 'pending') statusClass = 'border-yellow-500/30 bg-yellow-500/5 text-yellow-500';
              else if (order.status === 'confirmed') statusClass = 'border-blue-500/30 bg-blue-500/5 text-blue-500';
              else if (order.status === 'preparing') statusClass = 'border-indigo-500/30 bg-indigo-500/5 text-indigo-500';
              else if (order.status === 'out-for-delivery') statusClass = 'border-purple-500/30 bg-purple-500/5 text-purple-500';
              else if (order.status === 'delivered') statusClass = 'border-green-500/30 bg-green-500/5 text-green-500';
              else if (order.status === 'canceled') statusClass = 'border-red-500/30 bg-red-500/5 text-red-500';

              return (
                <div 
                  key={order.id} 
                  onClick={() => fetchOrderItems(order)}
                  className="py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-cream/5 transition-all px-4 rounded-lg border border-transparent hover:border-cream/5 my-2 cursor-pointer group"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="p-3 bg-ember/10 border border-ember/20 text-ember rounded-lg shrink-0 group-hover:bg-ember group-hover:text-charcoal transition-all">
                      <ShoppingBag size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-lg text-cream font-bold group-hover:text-ember transition-colors">{order.order_number}</span>
                        <span className="text-xs text-cream/40">•</span>
                        <span className="text-sm text-cream/80 font-bold">{order.customer_name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cream/50 mt-1.5 font-medium">
                        <span className="font-mono bg-cream/5 px-2 py-0.5 rounded border border-cream/10">{order.phone}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-ember" />
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="uppercase text-[9px] tracking-widest px-2 py-0.5 bg-ember/10 border border-ember/20 text-ember rounded font-bold">
                          {order.payment_method}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-cream/5 pt-3 sm:pt-0 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="font-display text-2xl text-cream font-black">{order.total}৳</p>
                      <p className="text-[10px] text-cream/40 uppercase tracking-widest font-mono">Amount Due</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3.5 py-1.5 border rounded-full font-mono shrink-0 ${statusClass}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Smooth transition popup for Order Details and Editing */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-charcoal border border-ember/20 w-full max-w-2xl p-6 relative my-8"
              style={{ borderRadius: '8px' }}
            >
              <button 
                onClick={() => setSelectedOrder(null)}
                className="absolute right-4 top-4 text-cream/50 hover:text-ember transition-colors cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-2 mb-4 border-b border-cream/10 pb-3">
                <h2 className="font-display text-2xl text-cream uppercase">
                  Order • <span className="text-ember">{selectedOrder.order_number}</span>
                </h2>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="ml-3 inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] bg-cream/5 hover:bg-ember/10 border border-cream/15 hover:border-ember/30 text-xs text-cream hover:text-ember font-bold uppercase tracking-wider transition-all"
                    style={{ borderRadius: '4px' }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                /* Editable Form Fields */
                <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto pr-1">
                  <div className="bg-cream/5 p-4 border border-cream/10 space-y-3" style={{ borderRadius: '6px' }}>
                    <h4 className="text-xs font-mono uppercase text-ember font-bold tracking-widest flex items-center gap-1.5">
                      <User size={12} /> Customer Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold mb-1 block">Name</label>
                        <input 
                          type="text"
                          value={editForm.customer_name}
                          onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 min-h-[44px] text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold mb-1 block">Phone</label>
                        <input 
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 min-h-[44px] text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold mb-1 block">Address</label>
                      <input 
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 min-h-[44px] text-sm outline-none focus:border-ember"
                        style={{ borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold mb-1 block">Landmark</label>
                      <input 
                        type="text"
                        value={editForm.landmark}
                        onChange={(e) => setEditForm({ ...editForm, landmark: e.target.value })}
                        className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 min-h-[44px] text-sm outline-none focus:border-ember"
                        style={{ borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  <div className="bg-cream/5 p-4 border border-cream/10 space-y-3" style={{ borderRadius: '6px' }}>
                    <h4 className="text-xs font-mono uppercase text-ember font-bold tracking-widest flex items-center gap-1.5">
                      <CreditCard size={12} /> Payment & Pricing
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold mb-1 block">Method</label>
                        <select 
                          value={editForm.payment_method}
                          onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 min-h-[44px] text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        >
                          <option value="Cash on Delivery">Cash on Delivery</option>
                          <option value="bKash">bKash</option>
                          <option value="Nagad">Nagad</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold mb-1 block">Transaction ID</label>
                        <input 
                          type="text"
                          value={editForm.transaction_id}
                          onChange={(e) => setEditForm({ ...editForm, transaction_id: e.target.value })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 min-h-[44px] text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold mb-1 block">Subtotal (৳)</label>
                        <input 
                          type="number"
                          value={editForm.subtotal}
                          onChange={(e) => setEditForm({ ...editForm, subtotal: Number(e.target.value) })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 min-h-[44px] text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold mb-1 block">Delivery (৳)</label>
                        <input 
                          type="number"
                          value={editForm.delivery_charge}
                          onChange={(e) => setEditForm({ ...editForm, delivery_charge: Number(e.target.value) })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 min-h-[44px] text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold mb-1 block">Discount (৳)</label>
                        <input 
                          type="number"
                          value={editForm.discount_amount}
                          onChange={(e) => setEditForm({ ...editForm, discount_amount: Number(e.target.value) })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 min-h-[44px] text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        />
                      </div>
                    </div>
                    <div className="text-right pt-2 border-t border-cream/10 text-sm font-bold text-cream">
                      Live Calculated Total: <span className="text-ember text-base">{editForm.subtotal + editForm.delivery_charge - editForm.discount_amount}৳</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Static Read-only Fields */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase text-cream/50 tracking-wider">Customer Details</h3>
                    <div className="text-sm space-y-1.5">
                      <p><span className="text-cream/50">Name:</span> <strong className="text-cream">{selectedOrder.customer_name}</strong></p>
                      <p><span className="text-cream/50">Phone:</span> <strong className="text-cream">{selectedOrder.phone}</strong></p>
                      <p><span className="text-cream/50">Address:</span> <strong className="text-cream">{selectedOrder.address}</strong></p>
                      {selectedOrder.landmark && (
                        <p><span className="text-cream/50">Landmark:</span> <strong className="text-cream">{selectedOrder.landmark}</strong></p>
                      )}
                      {selectedOrder.map_location && (
                        <p className="flex items-center gap-1.5 mt-1">
                          <span className="text-cream/50">GPS:</span> 
                          <a href={selectedOrder.map_location} target="_blank" rel="noreferrer" className="text-ember hover:text-ember/80 underline underline-offset-2 uppercase tracking-wider text-[10px] font-bold">View in Maps</a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase text-cream/50 tracking-wider">Payment Details</h3>
                    <div className="text-sm space-y-1.5">
                      <p><span className="text-cream/50">Method:</span> <strong className="text-cream">{selectedOrder.payment_method}</strong></p>
                      {selectedOrder.transaction_id && (
                        <p><span className="text-cream/50">TXID:</span> <strong className="text-ember font-mono">{selectedOrder.transaction_id}</strong></p>
                      )}
                      <p><span className="text-cream/50">Placed:</span> <strong className="text-cream">{new Date(selectedOrder.created_at).toLocaleString()}</strong></p>
                      <p>
                        <span className="text-cream/50">Status:</span>{' '}
                        <span className="uppercase text-[10px] px-2 py-0.5 border border-ember bg-ember/5 text-ember font-bold rounded">
                          {selectedOrder.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items Table */}
              <div className="border-t border-cream/10 pt-4 mb-6">
                <h3 className="text-xs font-bold uppercase text-cream/50 tracking-wider mb-3">Items Purchased</h3>
                {itemsLoading ? (
                  <div className="text-center py-4 text-xs text-cream/50">Loading items...</div>
                ) : (
                  <div className="border border-cream/10 rounded overflow-hidden">
                    <div className="divide-y divide-cream/5 text-cream/80 text-sm">
                      <div className="hidden sm:grid grid-cols-4 bg-cream/5 border-b border-cream/10 text-xs uppercase tracking-wider text-cream/50">
                        <div className="p-3 text-left col-span-2">Item</div>
                        <div className="p-3 text-center">Qty</div>
                        <div className="p-3 text-right">Total</div>
                      </div>
                      
                      {orderItems.map(item => (
                        <div key={item.id} className="p-3 hover:bg-cream/5 flex flex-col sm:grid sm:grid-cols-4 gap-2 sm:items-center">
                          <div className="col-span-2 flex justify-between sm:block">
                            <span className="font-semibold text-cream">{item.name_snapshot}</span>
                            <span className="sm:hidden text-xs text-cream/50">{item.unit_price}৳</span>
                          </div>
                          
                          <div className="flex justify-between sm:block text-center font-mono">
                            <span className="sm:hidden text-xs uppercase tracking-wider text-cream/50">Qty:</span>
                            <span>{item.quantity}</span>
                          </div>
                          
                          <div className="flex justify-between sm:block text-right font-bold text-cream">
                            <span className="sm:hidden text-xs uppercase tracking-wider text-cream/50">Total:</span>
                            <span>{item.line_total}৳</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* pricing calculation footer block */}
              {!isEditing && (
                <div className="border-t border-cream/10 pt-4 flex flex-col items-end text-sm space-y-1">
                  <p><span className="text-cream/50">Subtotal:</span> <strong className="text-cream">{selectedOrder.subtotal}৳</strong></p>
                  <p><span className="text-cream/50">Delivery Charge:</span> <strong className="text-cream">{selectedOrder.delivery_charge}৳</strong></p>
                  {selectedOrder.discount_amount > 0 && (
                    <p><span className="text-cream/50">Discount Applied:</span> <strong className="text-green-500">-{selectedOrder.discount_amount}৳</strong></p>
                  )}
                  <p className="text-base border-t border-cream/10 pt-1.5 mt-1 w-full text-right">
                    <span className="text-ember font-bold uppercase tracking-wider">Grand Total:</span>{' '}
                    <strong className="text-2xl text-ember font-black ml-2">{selectedOrder.total}৳</strong>
                  </p>
                </div>
              )}

              {/* Status workflow action row (Always visible in details modal) */}
              <div className="border-t border-cream/10 pt-4 mt-4">
                <p className="text-[10px] text-cream/50 uppercase tracking-wider font-bold mb-3">Quick Dispatch Flow Actions</p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}
                    className={`px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded transition-all cursor-pointer ${
                      selectedOrder.status === 'confirmed' 
                        ? 'bg-blue-500 border-blue-500 text-charcoal' 
                        : 'bg-transparent border-blue-500/30 text-blue-400 hover:bg-blue-500/10'
                    }`}
                  >
                    Accept (Confirm)
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                    className={`px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded transition-all cursor-pointer ${
                      selectedOrder.status === 'preparing' 
                        ? 'bg-indigo-500 border-indigo-500 text-charcoal' 
                        : 'bg-transparent border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'
                    }`}
                  >
                    Start Preparing
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'out-for-delivery')}
                    className={`px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded transition-all cursor-pointer ${
                      selectedOrder.status === 'out-for-delivery' 
                        ? 'bg-purple-500 border-purple-500 text-charcoal' 
                        : 'bg-transparent border-purple-500/30 text-purple-400 hover:bg-purple-500/10'
                    }`}
                  >
                    Out of Delivery
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                    className={`px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded transition-all cursor-pointer ${
                      selectedOrder.status === 'delivered' 
                        ? 'bg-green-500 border-green-500 text-charcoal' 
                        : 'bg-transparent border-green-500/30 text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    Mark Delivered
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'canceled')}
                    className={`px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded transition-all cursor-pointer ${
                      selectedOrder.status === 'canceled' 
                        ? 'bg-red-500 border-red-500 text-charcoal' 
                        : 'bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10'
                    }`}
                  >
                    Cancel Order
                  </button>
                </div>
              </div>

              {/* Bottom footer button actions */}
              <div className="flex justify-between items-center pt-5 border-t border-cream/10 mt-6 flex-wrap gap-3">
                <div className="w-full sm:w-auto">
                  {isEditing ? (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={handleSaveOrderEdits}
                        className="bg-green-500 text-charcoal hover:bg-green-400 px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                        style={{ borderRadius: '6px' }}
                      >
                        <Check size={14} /> Save Changes
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="bg-cream/10 hover:bg-cream/15 text-cream px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider cursor-pointer flex-1 sm:flex-none"
                        style={{ borderRadius: '6px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="bg-cream/10 hover:bg-cream/15 text-cream px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5"
                      style={{ borderRadius: '6px' }}
                    >
                      <Edit2 size={12} /> Edit Details
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="bg-ember text-charcoal hover:bg-ember/90 px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  style={{ borderRadius: '6px' }}
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
