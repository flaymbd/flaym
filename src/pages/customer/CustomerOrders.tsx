import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/authContext';
import { Link } from 'react-router-dom';
import { ClipboardList, ArrowRight, Clock, ShieldAlert, RotateCcw, TrendingUp, BarChart3 } from 'lucide-react';
import { useCartStore } from '../../lib/store';
import { Helmet } from 'react-helmet-async';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function CustomerOrders() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const addItem = useCartStore(state => state.addItem);
  const setCartOpen = useCartStore(state => state.setCartOpen);

  // Spending Analytics calculations
  const getOrderDate = (createdAt: any) => {
    if (!createdAt) return new Date();
    if (typeof createdAt.toDate === 'function') return createdAt.toDate();
    return new Date(createdAt);
  };

  const activeOrders = orders.filter(o => o.status !== 'canceled');
  const totalSpent = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const averageSpent = activeOrders.length > 0 ? Math.round(totalSpent / activeOrders.length) : 0;

  // Group by month
  const monthlyDataMap: { [key: string]: number } = {};
  activeOrders.forEach(order => {
    const date = getOrderDate(order.created_at);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthlyDataMap[monthYear] = (monthlyDataMap[monthYear] || 0) + (Number(order.total) || 0);
  });

  // Convert to array and sort chronologically
  const chartData = Object.entries(monthlyDataMap)
    .map(([month, amount]) => {
      const [mStr, yStr] = month.split(' ');
      const date = new Date(`${mStr} 1, ${yStr}`);
      return { month, amount, timestamp: date.getTime() };
    })
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ month, amount }) => ({ month, amount }));

  const handleReorder = async (order: any) => {
    setReorderingId(order.id);
    try {
      const itemsSnap = await getDocs(collection(db, `orders/${order.id}/items`));
      const fetchedItems = itemsSnap.docs.map(d => d.data());
      
      if (fetchedItems.length === 0) {
        alert("No items found in this past order.");
        return;
      }

      fetchedItems.forEach(item => {
        addItem({
          id: item.product_id,
          name: item.name_snapshot,
          price: item.unit_price,
          quantity: item.quantity || 1,
        });
      });

      setCartOpen(true);
    } catch (err) {
      console.error("Failed to reorder past items:", err);
      alert("Failed to reorder items. Please try again.");
    } finally {
      setReorderingId(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    } else {
      setFetching(false);
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      setFetching(true);
      const q = query(
        collection(db, 'orders'), 
        where('customer_id', '==', user?.uid),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Failed to fetch user orders:", err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="max-w-4xl mx-auto w-full px-6 py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-ember border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-cream/50 font-display uppercase tracking-widest text-xs">Loading orders...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto w-full px-6 py-20 text-center flex flex-col items-center">
        <ShieldAlert size={48} className="text-ember mb-4 animate-pulse" />
        <h1 className="font-display text-3xl text-cream uppercase mb-3 tracking-wider">Access Denied</h1>
        <p className="text-cream/60 mb-8 text-sm leading-relaxed">
          Please sign in to view your order history and track active orders in real time.
        </p>
        <Link 
          to="/auth" 
          className="bg-ember text-black font-bold py-3.5 px-8 uppercase tracking-wider text-xs hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,90,31,0.2)]"
          style={{ borderRadius: '6px' }}
        >
          Sign In / Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full max-w-full overflow-x-hidden px-4 md:px-6 py-12">
      <Helmet>
        <title>Flaym | My Orders</title>
      </Helmet>
      <div className="flex items-center gap-4 border-b border-cream/10 pb-6 mb-8">
        <ClipboardList size={36} className="text-ember" />
        <div>
          <h1 className="font-display text-4xl text-cream uppercase tracking-wider">My Orders</h1>
          <p className="text-xs text-cream/50 uppercase tracking-widest mt-0.5">Track and view your order history</p>
        </div>
      </div>

      {/* Spending Analytics Bento Dashboard */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-1 bg-charcoal/40 border border-cream/10 p-6 flex flex-col justify-between" style={{ borderRadius: '6px' }}>
            <div>
              <h3 className="text-xs text-cream/40 uppercase tracking-widest font-mono mb-6 flex items-center gap-2">
                <TrendingUp size={14} className="text-ember" />
                Spending Summary
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-cream/50 uppercase tracking-wider">Total Invested in Feasts</p>
                  <p className="font-display text-4xl text-cream font-black mt-1">{totalSpent}৳</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cream/5">
                  <div>
                    <p className="text-[10px] text-cream/40 uppercase tracking-wider">Valid Orders</p>
                    <p className="font-display text-lg text-cream font-bold mt-0.5">{activeOrders.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-cream/40 uppercase tracking-wider">Average / Feast</p>
                    <p className="font-display text-lg text-cream font-bold mt-0.5">{averageSpent}৳</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-cream/30 uppercase mt-6 pt-3 border-t border-cream/5 font-mono">
              * Excludes canceled orders
            </div>
          </div>

          <div className="lg:col-span-2 bg-charcoal/40 border border-cream/10 p-6 flex flex-col justify-between" style={{ borderRadius: '6px' }}>
            <h3 className="text-xs text-cream/40 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
              <BarChart3 size={14} className="text-ember" />
              Monthly Feast Analytics
            </h3>
            <div className="h-[180px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="month" stroke="#ffffff40" tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff40" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#FF5A1F', borderRadius: '4px', color: '#FFF' }}
                    labelStyle={{ fontWeight: 'bold', color: '#FF5A1F' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#FF5A1F" strokeWidth={2} fillOpacity={1} fill="url(#colorSpent)" name="Total Spent (৳)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center bg-charcoal/30 border border-cream/10 p-12" style={{ borderRadius: '6px' }}>
          <p className="text-cream/40 text-sm mb-6">You haven't placed any orders yet.</p>
          <Link 
            to="/menu" 
            className="inline-flex items-center gap-2 bg-ember text-black font-bold py-3.5 px-6 uppercase tracking-wider text-xs hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,90,31,0.2)]"
            style={{ borderRadius: '6px' }}
          >
            Browse Food Menu <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-charcoal/30 border border-cream/10 hover:border-ember/30 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all"
              style={{ borderRadius: '6px' }}
            >
              <div className="space-y-1.5 w-full md:w-auto">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="font-display text-lg sm:text-xl text-ember font-bold">{order.order_number}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 sm:px-2.5 py-1 ${
                    order.status === 'delivered' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                    order.status === 'canceled' ? 'bg-deep-red/10 text-deep-red border border-deep-red/20' :
                    'bg-ember/10 text-ember border border-ember/20'
                  }`} style={{ borderRadius: '4px' }}>
                    {order.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-cream/50 font-medium">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.created_at).toLocaleString()}</span>
                  <span>Method: <strong className="text-cream/80">{order.payment_method}</strong></span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end w-full md:w-auto gap-3 sm:gap-6 border-t md:border-t-0 border-cream/5 pt-4 md:pt-0">
                <div className="text-left md:text-right w-full sm:w-auto flex justify-between sm:block">
                  <p className="text-[10px] uppercase font-bold text-cream/40 tracking-wider">Total amount</p>
                  <p className="font-display text-xl sm:text-2xl text-cream mt-0.5">{order.total}৳</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link 
                    to={`/order/${order.order_number}?phone=${order.phone}`}
                    className="flex-1 sm:flex-none justify-center bg-cream/5 hover:bg-cream/10 border border-cream/20 text-cream hover:text-ember hover:border-ember font-bold py-2.5 px-3 sm:py-3 sm:px-4 text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 shrink-0"
                    style={{ borderRadius: '6px' }}
                  >
                    Track Order
                  </Link>
                  <button 
                    onClick={() => handleReorder(order)}
                    disabled={reorderingId !== null}
                    className="flex-1 sm:flex-none justify-center bg-ember/10 hover:bg-ember border border-ember/30 text-ember hover:text-black disabled:opacity-50 font-bold py-2.5 px-3 sm:py-3 sm:px-4 text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0"
                    style={{ borderRadius: '6px' }}
                  >
                    {reorderingId === order.id ? (
                      <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RotateCcw size={12} className="sm:w-[14px] sm:h-[14px]" />
                    )}
                    Reorder
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
