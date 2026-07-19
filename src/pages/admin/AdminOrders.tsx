import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Search, X, Edit2, Check, User, Phone, MapPin, CreditCard, ShoppingBag, 
  Clock, AlertCircle, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const logoImg = "/flaym-logo.jpg";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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
    // Real-time subscription to the entire orders collection
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Real-time orders sync error: ", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync edit form fields when selectedOrder changes
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: newStatus,
        updated_at: Date.now()
      });
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert('Failed to update status');
    }
  };

  const fetchOrderItems = async (order: any) => {
    setSelectedOrder(order);
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
      console.error("Failed to save order updates:", err);
      alert("Failed to save changes");
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const matchesSearch = 
      o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone?.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const statusOptions = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'canceled'];

  return (
    <div className="w-full max-w-full overflow-x-hidden text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-cream uppercase tracking-wider">Orders</h1>
          <p className="text-xs text-cream/50 uppercase tracking-widest mt-1">Real-time Customer Purchase Logs</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Real-time search bar */}
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-cream/40" size={16} />
            <input 
              type="text"
              placeholder="Search order#, name, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-charcoal border border-cream/20 text-cream pl-9 pr-4 py-2 outline-none focus:border-ember text-sm w-full sm:w-64"
              style={{ borderRadius: '4px' }}
            />
          </div>

          <select 
            className="bg-charcoal border border-cream/20 text-cream px-4 py-2 text-sm outline-none focus:border-ember cursor-pointer"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ borderRadius: '4px' }}
          >
            <option value="all">All Statuses</option>
            {statusOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-6 border border-cream/10 bg-charcoal/20" style={{ borderRadius: '6px' }}>
            <img 
              src={logoImg} 
              alt="Loading Orders..." 
              className="w-20 h-20 object-contain animate-pulse rounded-full border border-ember/20 p-2 shadow-[0_0_15px_rgba(255,90,31,0.1)]"
              referrerPolicy="no-referrer"
            />
            <h2 className="font-display text-sm uppercase tracking-widest text-ember mt-2 animate-pulse">Synchronizing orders...</h2>
          </div>
        </div>
      ) : (
        <div className="bg-charcoal/30 border border-cream/10 overflow-hidden" style={{ borderRadius: '8px' }}>
          <div className="divide-y divide-cream/5">
            {/* Desktop Header */}
            <div className="hidden md:grid grid-cols-6 gap-4 p-4 bg-cream/5 border-b border-cream/10 text-xs tracking-widest text-cream/50 uppercase font-bold">
              <div>Order #</div>
              <div>Customer</div>
              <div>Date Placed</div>
              <div>Total</div>
              <div>Payment</div>
              <div>Status</div>
            </div>
            
            {filteredOrders.map(order => {
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
                  className="p-4 hover:bg-cream/5 transition-colors cursor-pointer group flex flex-col md:grid md:grid-cols-6 gap-3 md:gap-4 md:items-center"
                >
                  <div className="flex justify-between md:block w-full">
                    <span className="md:hidden text-xs text-cream/50 uppercase tracking-widest font-bold">Order #</span>
                    <span className="font-bold text-ember group-hover:underline">{order.order_number}</span>
                  </div>
                  
                  <div className="flex justify-between md:block w-full">
                    <span className="md:hidden text-xs text-cream/50 uppercase tracking-widest font-bold">Customer</span>
                    <div className="text-right md:text-left">
                      <div className="font-semibold text-cream">{order.customer_name}</div>
                      <div className="text-xs text-cream/50 font-mono mt-0.5">{order.phone}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between md:block w-full text-cream/80 text-sm">
                    <span className="md:hidden text-xs text-cream/50 uppercase tracking-widest font-bold">Date</span>
                    <span>{new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  
                  <div className="flex justify-between md:block w-full">
                    <span className="md:hidden text-xs text-cream/50 uppercase tracking-widest font-bold">Total</span>
                    <span className="font-black text-cream text-lg">{order.total}৳</span>
                  </div>
                  
                  <div className="flex justify-between md:block w-full">
                    <span className="md:hidden text-xs text-cream/50 uppercase tracking-widest font-bold">Payment</span>
                    <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 bg-ember/10 border border-ember/20 text-ember font-bold rounded inline-block">
                      {order.payment_method}
                    </span>
                  </div>
                  
                  <div className="flex justify-between md:block w-full mt-2 md:mt-0 pt-3 md:pt-0 border-t border-cream/5 md:border-t-0">
                    <span className="md:hidden text-xs text-cream/50 uppercase tracking-widest font-bold pt-1">Status</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border rounded-full font-mono inline-block ${statusClass}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredOrders.length === 0 && (
              <div className="p-12 text-center text-cream/30">
                No orders found matching the filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smooth transition popup for Order Details and Operations */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
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
                className="absolute right-4 top-4 text-cream/50 hover:text-ember transition-colors cursor-pointer"
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
                    className="ml-3 inline-flex items-center gap-1.5 px-3 py-1 bg-cream/5 hover:bg-ember/10 border border-cream/15 hover:border-ember/30 text-xs text-cream hover:text-ember font-bold uppercase tracking-wider transition-all"
                    style={{ borderRadius: '4px' }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                /* Editable Form Fields */
                <div className="space-y-4 mb-6 max-h-[380px] overflow-y-auto pr-1">
                  <div className="bg-cream/5 p-4 border border-cream/10 space-y-3" style={{ borderRadius: '6px' }}>
                    <h4 className="text-xs font-mono uppercase text-ember font-bold tracking-widest flex items-center gap-1.5">
                      <User size={12} /> Customer Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold">Name</label>
                        <input 
                          type="text"
                          value={editForm.customer_name}
                          onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold">Phone</label>
                        <input 
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold">Address</label>
                      <input 
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 text-sm outline-none focus:border-ember"
                        style={{ borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold">Landmark</label>
                      <input 
                        type="text"
                        value={editForm.landmark}
                        onChange={(e) => setEditForm({ ...editForm, landmark: e.target.value })}
                        className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 text-sm outline-none focus:border-ember"
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
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold">Method</label>
                        <select 
                          value={editForm.payment_method}
                          onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        >
                          <option value="Cash on Delivery">Cash on Delivery</option>
                          <option value="bKash">bKash</option>
                          <option value="Nagad">Nagad</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold">Transaction ID</label>
                        <input 
                          type="text"
                          value={editForm.transaction_id}
                          onChange={(e) => setEditForm({ ...editForm, transaction_id: e.target.value })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold">Subtotal (৳)</label>
                        <input 
                          type="number"
                          value={editForm.subtotal}
                          onChange={(e) => setEditForm({ ...editForm, subtotal: Number(e.target.value) })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold">Delivery (৳)</label>
                        <input 
                          type="number"
                          value={editForm.delivery_charge}
                          onChange={(e) => setEditForm({ ...editForm, delivery_charge: Number(e.target.value) })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 text-sm outline-none focus:border-ember"
                          style={{ borderRadius: '4px' }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cream/50 uppercase tracking-wider font-bold">Discount (৳)</label>
                        <input 
                          type="number"
                          value={editForm.discount_amount}
                          onChange={(e) => setEditForm({ ...editForm, discount_amount: Number(e.target.value) })}
                          className="w-full bg-charcoal border border-cream/20 text-cream px-3 py-2 text-sm outline-none focus:border-ember"
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
                        <p className="flex items-center gap-2">
                          <span className="text-cream/50">GPS Location:</span> 
                          <a href={selectedOrder.map_location} target="_blank" rel="noreferrer" className="text-ember underline text-xs font-bold">
                            Open in Map
                          </a>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(selectedOrder.map_location);
                              alert("Map link copied to clipboard!");
                            }}
                            className="bg-cream/10 hover:bg-cream/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-cream"
                          >
                            Copy Link
                          </button>
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
                    onClick={() => handleStatusChange(selectedOrder.id, 'confirmed')}
                    className={`px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded transition-all cursor-pointer ${
                      selectedOrder.status === 'confirmed' 
                        ? 'bg-blue-500 border-blue-500 text-charcoal' 
                        : 'bg-transparent border-blue-500/30 text-blue-400 hover:bg-blue-500/10'
                    }`}
                  >
                    Accept (Confirm)
                  </button>
                  <button 
                    onClick={() => handleStatusChange(selectedOrder.id, 'preparing')}
                    className={`px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded transition-all cursor-pointer ${
                      selectedOrder.status === 'preparing' 
                        ? 'bg-indigo-500 border-indigo-500 text-charcoal' 
                        : 'bg-transparent border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'
                    }`}
                  >
                    Start Preparing
                  </button>
                  <button 
                    onClick={() => handleStatusChange(selectedOrder.id, 'out-for-delivery')}
                    className={`px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded transition-all cursor-pointer ${
                      selectedOrder.status === 'out-for-delivery' 
                        ? 'bg-purple-500 border-purple-500 text-charcoal' 
                        : 'bg-transparent border-purple-500/30 text-purple-400 hover:bg-purple-500/10'
                    }`}
                  >
                    Out of Delivery
                  </button>
                  <button 
                    onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}
                    className={`px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded transition-all cursor-pointer ${
                      selectedOrder.status === 'delivered' 
                        ? 'bg-green-500 border-green-500 text-charcoal' 
                        : 'bg-transparent border-green-500/30 text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    Mark Delivered
                  </button>
                  <button 
                    onClick={() => handleStatusChange(selectedOrder.id, 'canceled')}
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
                      className="bg-cream/10 hover:bg-cream/15 text-cream px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
                      style={{ borderRadius: '6px' }}
                    >
                      <Edit2 size={12} /> Edit Details
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="bg-ember text-black hover:bg-ember/90 px-5 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider cursor-pointer w-full sm:w-auto"
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
