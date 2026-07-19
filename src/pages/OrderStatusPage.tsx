import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Flame, CheckCircle, Clock, Truck, Home, Mail, Bell, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';

export default function OrderStatusPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone');
  
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );
  
  const notifiedRef = useRef(false);
  const prevStatusRef = useRef<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    body: string;
    type: 'success' | 'info' | 'delivery' | 'email' | null;
  }>({
    show: false,
    title: '',
    body: '',
    type: null,
  });

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getOrderDate = (createdAt: any) => {
    if (!createdAt) return new Date();
    if (typeof createdAt.toDate === 'function') return createdAt.toDate();
    return new Date(createdAt);
  };

  useEffect(() => {
    if (!id || !phone) {
      setError('Order Number or Phone missing.');
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('order_number', '==', id)
    );

    const unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
      const docSnap = querySnapshot.docs.find(d => d.data().phone === phone);
      if (!docSnap) {
        setError('Order not found.');
        setLoading(false);
      } else {
        const orderData = { id: docSnap.id, ...docSnap.data() };
        setOrder(orderData);
        setError('');

        // Real-time listen to order items subcollection
        const itemsRef = collection(db, 'orders', docSnap.id, 'items');
        onSnapshot(itemsRef, (itemsSnap) => {
          setOrderItems(itemsSnap.docs.map(doc => doc.data()));
          setLoading(false);
        }, (itemsErr) => {
          console.error("Error loading order items subcollection:", itemsErr);
          setLoading(false);
        });
      }
    }, (err) => {
      console.error(err);
      setError('Error fetching order.');
      setLoading(false);
    });

    return () => unsubscribeOrders();
  }, [id, phone]);

  const triggerPushNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title,
            options: {
              body,
              data: window.location.href,
              tag: `order-${order?.order_number}`
            }
          }
        });
      } else {
        try {
          new Notification(title, {
            body,
            tag: `order-${order?.order_number}`
          });
        } catch (e) {
          console.error('Notification constructor failed:', e);
        }
      }
    }
  };

  useEffect(() => {
    if (!order?.id) return;
    const q = query(collection(db, 'notifications'), where('orderId', '==', order.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = change.doc.data();
          if (notification.type === 'customer') {
            const currentStatus = notification.status;
            
            // Trigger toast
            let toastData: any = null;
            if (currentStatus === 'confirmed') {
              toastData = { title: '🔥 Order Confirmed!', body: `Order #${order.order_number} confirmed!`, type: 'success' };
              triggerPushNotification('Order Confirmed! 🔥🍢', `Your order #${order.order_number} has been confirmed.`);
            } else if (currentStatus === 'preparing') {
              toastData = { title: '🍢 Grilling in Progress!', body: `Order #${order.order_number} is sizzling!`, type: 'info' };
              triggerPushNotification('Order is Grilling! 🍢🔥', `Order #${order.order_number} is sizzling!`);
            } else if (currentStatus === 'out-for-delivery') {
              toastData = { title: '🚚 On the Way!', body: `Order #${order.order_number} is on the way!`, type: 'delivery' };
              triggerPushNotification('Order Out for Delivery! 🚚💨', `Your order #${order.order_number} is on its way!`);
            } else if (currentStatus === 'delivered') {
              toastData = { title: '🎉 Order Delivered!', body: `Order #${order.order_number} delivered!`, type: 'success' };
              triggerPushNotification('Order Delivered! 🎉🔥', `Enjoy your Flaym feast!`);
            }

            if (toastData) {
              setToast({ show: true, ...toastData });
            }
          }
        }
      });
    });
    return () => unsubscribe();
  }, [order?.id]);

  const requestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SHOW_NOTIFICATION',
              payload: {
                title: 'Alerts Enabled! 🔔🔥',
                options: {
                  body: 'We will notify you here when your grill gets on the road!',
                  tag: 'flaym-test-notification'
                }
              }
            });
          }
        }
      });
    }
  };

  if (loading) return (
    <div className="flex-grow flex items-center justify-center min-h-[50vh]">
      <Helmet>
        <title>Flaym | Order Status</title>
      </Helmet>
      <Flame size={48} className="text-ember animate-bounce" />
    </div>
  );

  if (error || !order) return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
      <Helmet>
        <title>Flaym | Order Not Found</title>
      </Helmet>
      <h2 className="font-display text-4xl text-ember mb-4 uppercase">{error}</h2>
      <Link to="/" className="text-cream hover:text-ember underline underline-offset-4">Return Home</Link>
    </div>
  );

  const steps = [
    { 
      status: 'pending', 
      label: 'Order Received', 
      desc: 'We have received your order and added it to our grilling queue.', 
      icon: Clock 
    },
    { 
      status: 'confirmed', 
      label: 'Confirmed', 
      desc: 'Our chefs have verified your feast and reserved the grill space.', 
      icon: CheckCircle 
    },
    { 
      status: 'preparing', 
      label: 'Grilling Now', 
      desc: 'Sizzling over hot embers! Our custom marinades are locking in the heat.', 
      icon: Flame 
    },
    { 
      status: 'out-for-delivery', 
      label: 'On the Way', 
      desc: 'Our speed-runner rider is out with your piping-hot package!', 
      icon: Truck 
    },
    { 
      status: 'delivered', 
      label: 'Delivered', 
      desc: 'Enjoy your smokey, fiery feast! Share the love and tag @FLAYM.', 
      icon: Home 
    },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.status);

  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-12">
      <Helmet>
        <title>Flaym | Order #{order.order_number}</title>
        <meta name="description" content={`Track the real-time status of your Flaym order #${order.order_number}.`} />
        <meta property="og:title" content={`Flaym | Order #${order.order_number}`} />
        <meta property="og:description" content={`Track the real-time status of your Flaym order #${order.order_number}.`} />
        <meta property="og:image" content="/flaym-logo.jpg" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Dynamic Floating Toast System */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            id="status-update-toast"
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-charcoal border border-ember shadow-[0_0_25px_rgba(255,90,31,0.25)] p-5 flex gap-4"
            style={{ borderRadius: '8px' }}
          >
            <div className="shrink-0">
              {toast.type === 'success' && (
                <div className="p-2.5 bg-green-500/10 border border-green-500/30 text-green-500 rounded-full">
                  <CheckCircle size={20} />
                </div>
              )}
              {toast.type === 'email' && (
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-500 rounded-full animate-bounce">
                  <Mail size={20} />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="p-2.5 bg-ember/10 border border-ember/30 text-ember rounded-full">
                  <Flame size={20} className="animate-pulse" />
                </div>
              )}
              {toast.type === 'delivery' && (
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 text-purple-500 rounded-full">
                  <Truck size={20} />
                </div>
              )}
            </div>
            <div className="flex-grow text-left">
              <h4 className="font-display font-bold text-cream uppercase text-sm tracking-wide flex items-center gap-1.5">
                {toast.title}
                {toast.type === 'email' && (
                  <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono font-medium">
                    SIMULATED EMAIL
                  </span>
                )}
              </h4>
              <p className="text-xs text-cream/80 mt-1 leading-relaxed">
                {toast.body}
              </p>
            </div>
            <button 
              onClick={() => setToast({ ...toast, show: false })}
              className="text-cream/40 hover:text-cream/85 self-start p-1 transition-colors cursor-pointer"
              id="close-toast-btn"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {notificationPermission === 'default' && (
        <div className="bg-ember/10 border border-ember/30 p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div className="text-left">
              <p className="font-bold text-cream">Want real-time order alerts?</p>
              <p className="text-xs text-cream/70">Enable push notifications to know exactly when your food goes Out for Delivery.</p>
            </div>
          </div>
          <button 
            onClick={requestPermission}
            className="bg-ember text-black font-bold py-2 px-4 uppercase text-xs tracking-wider hover:bg-ember/90 transition-colors shrink-0"
          >
            Enable Alerts
          </button>
        </div>
      )}

      <div className="bg-charcoal border border-ember/20 p-8 text-center mb-8 shadow-lg">
        <h1 className="font-display text-5xl text-ember mb-2 tracking-wide uppercase">Order #{order.order_number}</h1>
        <p className="text-cream/60">Placed on {new Date(order.created_at).toLocaleString()}</p>
      </div>

      {/* Current Stage Highlight Box */}
      <div className="bg-charcoal border-l-4 border-l-ember border-cream/10 p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md rounded-r-lg">
        <div>
          <span className="text-[10px] bg-ember/10 text-ember font-bold uppercase tracking-widest border border-ember/20 px-2.5 py-1 rounded-full mb-2 inline-block">
            Current Status
          </span>
          <h2 className="font-display text-3xl text-cream uppercase tracking-wide">
            {steps[currentStepIndex]?.label || order.status}
          </h2>
          <p className="text-sm text-cream/75 mt-1 leading-relaxed">
            {steps[currentStepIndex]?.desc || 'Your order is being processed.'}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-cream/5 px-4 py-3 border border-cream/10 w-full md:w-auto justify-center rounded">
          <div className="relative">
            <span className="absolute inline-flex h-3 w-3 rounded-full bg-ember opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-ember"></span>
          </div>
          <span className="text-xs font-mono text-cream uppercase tracking-wider font-bold">
            Real-time tracking active
          </span>
        </div>
      </div>

      {/* Dynamic Delivery Countdown & Progress */}
      {(() => {
        const orderDate = getOrderDate(order.created_at);
        const totalDurationMs = 45 * 60 * 1000; // 45 minutes
        const targetDate = new Date(orderDate.getTime() + totalDurationMs);
        const differenceMs = targetDate.getTime() - now.getTime();
        const elapsedMs = now.getTime() - orderDate.getTime();
        const percentProgress = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

        const formatRemainingText = () => {
          if (order.status === 'delivered') return 'Enjoy your hot, smoky feast! 🎉';
          if (order.status === 'canceled') return 'This order was canceled.';
          if (differenceMs <= 0) return 'Arriving any second! 🚚💨';
          const totalSecs = Math.floor(differenceMs / 1000);
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          return `~ ${mins}m ${secs}s remaining`;
        };

        // Determine sub-phases
        const elapsedMinutes = elapsedMs / (60 * 1000);
        let activePhase = 'grilling';
        if (elapsedMinutes >= 15 && elapsedMinutes < 25) activePhase = 'packing';
        else if (elapsedMinutes >= 25 && elapsedMinutes < 30) activePhase = 'dispatch';
        else if (elapsedMinutes >= 30) activePhase = 'delivering';

        return (
          <div className="bg-charcoal border border-ember/20 p-6 mb-8 relative overflow-hidden text-left" style={{ borderRadius: '6px' }} id="delivery-countdown-card">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-ember rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div className="text-left">
                <h3 className="font-display text-xs text-ember font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Clock size={12} className="animate-spin-slow" />
                  Estimated Delivery Time
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl md:text-4xl text-cream font-black tracking-tight">
                    {targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs text-cream/50 uppercase font-medium">
                    ({order.status === 'delivered' ? 'Completed' : 'Within 45 Mins'})
                  </span>
                </div>
              </div>

              <div className="text-left md:text-right">
                <span className="text-[10px] bg-cream/5 border border-cream/10 text-cream/40 uppercase tracking-widest font-mono px-2.5 py-1 rounded-full mb-1 inline-block">
                  Countdown Tracker
                </span>
                <div className="font-display text-lg md:text-xl text-ember font-bold uppercase tracking-wider">
                  {formatRemainingText()}
                </div>
              </div>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="relative h-3 bg-cream/5 border border-cream/10 w-full mb-6 overflow-hidden" style={{ borderRadius: '6px' }}>
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-ember/60 via-ember to-deep-red shadow-[0_0_15px_rgba(255,90,31,0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${order.status === 'delivered' ? 100 : percentProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Sub-phase Milestone Indicator Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className={`p-3 border transition-colors ${activePhase === 'grilling' && order.status !== 'delivered' && order.status !== 'canceled' ? 'border-ember/30 bg-ember/5 text-ember' : 'border-cream/5 bg-cream/5 text-cream/40'}`} style={{ borderRadius: '4px' }}>
                <span className="text-[10px] font-mono block uppercase tracking-widest mb-1">Phase 1</span>
                <p className="font-bold text-xs uppercase tracking-wide">Live Grilling</p>
                <span className="text-[9px] block opacity-60">0 - 15 mins</span>
              </div>

              <div className={`p-3 border transition-colors ${activePhase === 'packing' && order.status !== 'delivered' && order.status !== 'canceled' ? 'border-ember/30 bg-ember/5 text-ember' : 'border-cream/5 bg-cream/5 text-cream/40'}`} style={{ borderRadius: '4px' }}>
                <span className="text-[10px] font-mono block uppercase tracking-widest mb-1">Phase 2</span>
                <p className="font-bold text-xs uppercase tracking-wide">Fiery Packing</p>
                <span className="text-[9px] block opacity-60">15 - 25 mins</span>
              </div>

              <div className={`p-3 border transition-colors ${activePhase === 'dispatch' && order.status !== 'delivered' && order.status !== 'canceled' ? 'border-ember/30 bg-ember/5 text-ember' : 'border-cream/5 bg-cream/5 text-cream/40'}`} style={{ borderRadius: '4px' }}>
                <span className="text-[10px] font-mono block uppercase tracking-widest mb-1">Phase 3</span>
                <p className="font-bold text-xs uppercase tracking-wide">Dispatching</p>
                <span className="text-[9px] block opacity-60">25 - 30 mins</span>
              </div>

              <div className={`p-3 border transition-colors ${(activePhase === 'delivering' || order.status === 'delivered') && order.status !== 'canceled' ? 'border-ember/30 bg-ember/5 text-ember' : 'border-cream/5 bg-cream/5 text-cream/40'}`} style={{ borderRadius: '4px' }}>
                <span className="text-[10px] font-mono block uppercase tracking-widest mb-1">Phase 4</span>
                <p className="font-bold text-xs uppercase tracking-wide">On the Road</p>
                <span className="text-[9px] block opacity-60">30 - 45 mins</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Step-by-Step Progress Tracker */}
      <div className="bg-charcoal border border-cream/10 p-8 mb-8 relative overflow-hidden">
        {/* Horizontal Tracker for Desktop */}
        <div className="relative hidden md:block min-h-[140px]">
          {/* Progress Line Behind Circles (Desktop) */}
          <div className="absolute top-[28px] left-12 right-12 h-1 bg-cream/10 -translate-y-1/2 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-ember/50 to-ember shadow-[0_0_10px_rgba(255,90,31,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>

          <div className="relative flex justify-between z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.status} className="flex flex-col items-center w-32 text-center group">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 mb-4 transition-all duration-300 bg-charcoal ${
                      isCompleted 
                        ? 'border-ember text-ember' 
                        : 'border-cream/20 text-cream/20'
                    } ${isCurrent ? 'shadow-[0_0_20px_rgba(255,90,31,0.6)] scale-110 border-ember text-ember' : ''}`}
                  >
                    <Icon size={26} className={isCurrent ? 'animate-pulse' : ''} />
                  </motion.div>
                  <span className={`text-xs font-bold uppercase tracking-wider block transition-colors ${
                    isCompleted ? 'text-cream' : 'text-cream/30'
                  }`}>
                    {step.label}
                  </span>
                  <span className={`text-[10px] mt-1 hidden lg:block leading-snug px-1 transition-opacity ${
                    isCurrent ? 'text-cream/60 opacity-100' : 'opacity-0'
                  }`}>
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical Stepper for Mobile */}
        <div className="md:hidden space-y-8 relative before:absolute before:top-4 before:bottom-4 before:left-6 before:w-[2px] before:bg-cream/10">
          {/* Active Vertical Progress Line */}
          <div 
            className="absolute top-4 left-[23px] w-[2px] bg-ember shadow-[0_0_10px_rgba(255,90,31,0.5)] transition-all duration-1000" 
            style={{ 
              height: `${currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 90 : 0}%`
            }}
          />
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={step.status} className="flex items-start gap-6 relative z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-300 bg-charcoal ${
                  isCompleted 
                    ? 'border-ember text-ember' 
                    : 'border-cream/20 text-cream/20'
                } ${isCurrent ? 'shadow-[0_0_15px_rgba(255,90,31,0.5)] scale-110 border-ember text-ember' : ''}`}>
                  <Icon size={22} className={isCurrent ? 'animate-pulse' : ''} />
                </div>
                <div className="text-left py-1">
                  <h4 className={`font-display text-lg tracking-wide uppercase ${
                    isCompleted ? 'text-cream font-bold' : 'text-cream/40'
                  }`}>
                    {step.label}
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed ${
                    isCompleted ? 'text-cream/70' : 'text-cream/20'
                  }`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-charcoal border border-cream/10 p-6 text-left">
          <h3 className="font-display text-2xl text-cream mb-4 uppercase border-b border-cream/10 pb-2">Delivery Details</h3>
          <p className="text-cream/80"><strong className="text-cream">Name:</strong> {order.customer_name}</p>
          <p className="text-cream/80"><strong className="text-cream">Phone:</strong> {order.phone}</p>
          <p className="text-cream/80"><strong className="text-cream">Address:</strong> {order.address}</p>
          {order.landmark && <p className="text-cream/80"><strong className="text-cream">Landmark:</strong> {order.landmark}</p>}
          {order.map_location && (
            <p className="text-cream/80 flex items-center gap-2 mt-1">
              <strong className="text-cream">GPS:</strong> 
              <a href={order.map_location} target="_blank" rel="noreferrer" className="text-ember text-sm underline font-bold tracking-wider uppercase">View Map</a>
            </p>
          )}
        </div>
        <div className="bg-charcoal border border-cream/10 p-6 text-left">
          <h3 className="font-display text-2xl text-cream mb-4 uppercase border-b border-cream/10 pb-2">Payment Details</h3>
          <p className="text-cream/80"><strong className="text-cream">Method:</strong> {order.payment_method}</p>
          {order.discount_amount > 0 && (
            <p className="text-green-400 font-semibold">
              <strong className="text-cream font-bold">Discount ({order.applied_promo_code}):</strong> -{order.discount_amount}৳
            </p>
          )}
          <p className="text-cream/80"><strong className="text-cream">Total:</strong> {order.total}৳</p>
          {order.transaction_id && <p className="text-cream/80"><strong className="text-cream">Txn ID:</strong> {order.transaction_id}</p>}
        </div>
      </div>

      {/* Official Order Receipt & Confirmation (Email/WhatsApp Format Simulator) */}
      <div className="bg-charcoal border border-ember/20 p-6 md:p-8 space-y-6 text-left" style={{ borderRadius: '6px' }}>
        <div className="border-b border-cream/10 pb-4">
          <span className="text-[10px] bg-ember/10 border border-ember/20 text-ember font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 inline-block">
            Receipt System
          </span>
          <h3 className="font-display text-3xl text-cream uppercase">Flame Confirmation Receipt</h3>
          <p className="text-xs text-cream/50 mt-1">A beautifully stylized copy of this receipt has been prepared. If a Gmail address is missing, we prioritize sending these details directly to WhatsApp.</p>
        </div>

        {/* Invoice template container styled like a real premium letter receipt */}
        <div className="bg-black/40 border border-cream/5 p-6 space-y-6 font-sans text-cream/90" style={{ borderRadius: '4px' }}>
          
          {/* Brand header */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-cream/10">
            <span className="font-display text-3xl tracking-widest text-ember">FLAYM</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-cream/40 mt-1">GRILL. SIZZLE. DEVOUR.</span>
            <span className="text-[10px] text-cream/50 mt-2">📍 Mirpur, Dhaka | 📞 +8801577464706 | ✉️ flaymbd@gmail.com</span>
          </div>

          {/* Letter intro / Positive info */}
          <div className="space-y-3">
            <p className="font-bold text-sm text-ember">Thank you for choosing FLAYM!</p>
            <p className="text-xs text-cream/70 leading-relaxed">
              We highly appreciate your order! At FLAYM, our items are hand-marinated with custom spices and flame-grilled over fresh coals to lock in that sizzling, deep smoky flavour. Mirpur's most authentic gourmet Meatbox experience is now heading your way!
            </p>
          </div>

          {/* Customer Metadata info */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-cream/5 p-4 border border-cream/5 font-mono">
            <div>
              <p className="text-cream/40 uppercase text-[9px] tracking-wider">Order Reference</p>
              <p className="font-bold text-cream mt-0.5">#{order.order_number}</p>
            </div>
            <div>
              <p className="text-cream/40 uppercase text-[9px] tracking-wider">Date</p>
              <p className="font-bold text-cream mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-cream/40 uppercase text-[9px] tracking-wider">Delivery To</p>
              <p className="font-bold text-cream mt-0.5">{order.customer_name} ({order.phone})</p>
              <p className="text-cream/60 text-[11px] mt-0.5">{order.address}</p>
            </div>
          </div>

          {/* Order items listing */}
          <div className="space-y-2">
            <p className="font-mono text-xs text-cream/40 uppercase tracking-widest border-b border-cream/5 pb-1">Items Summary</p>
            <div className="divide-y divide-cream/5">
              {orderItems.length > 0 ? (
                orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between py-2 text-xs">
                    <div>
                      <span className="font-bold text-cream">{item.name_snapshot}</span>
                      <span className="text-cream/40 font-mono ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-mono text-ember font-bold">{item.line_total}৳</span>
                  </div>
                ))
              ) : (
                <div className="py-2 text-xs text-cream/40 font-mono">Loading ordered items details...</div>
              )}
            </div>
          </div>

          {/* Pricing breakdowns */}
          <div className="border-t border-cream/10 pt-4 space-y-1.5 text-xs font-mono text-right">
            <div className="flex justify-between">
              <span className="text-cream/50">Subtotal:</span>
              <span className="text-cream">{order.subtotal}৳</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-400 font-semibold">
                <span>Discount ({order.applied_promo_code}):</span>
                <span>-{order.discount_amount}৳</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-cream/50">Delivery Charge:</span>
              <span className="text-cream">{order.delivery_charge}৳</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-cream/5 text-sm font-bold">
              <span className="text-ember">Grand Total:</span>
              <span className="text-ember">{order.total}৳</span>
            </div>
          </div>

          {/* Positive Company info footer */}
          <div className="pt-6 border-t border-cream/10 text-[10px] text-cream/40 space-y-1.5 font-mono">
            <p className="text-center text-cream/60">✦ FLAYM COMPANY POSITIVE MOTTO ✦</p>
            <p className="text-center leading-relaxed italic text-cream/50">"Our mission is simple: zero compromise on flavor, top-tier wood-fired grills, and instant customer happiness. Sizzle, Grill, Devour!"</p>
            <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-cream/5">
              <a href="https://facebook.com/flaymbd" target="_blank" rel="noopener noreferrer" className="text-ember hover:underline">🌐 FACEBOOK PAGE</a>
              <a href="https://wa.me/8801577464706" className="text-green-400 hover:underline">💬 WHATSAPP ORDER HELPDESK</a>
            </div>
          </div>

        </div>

        {/* Dynamic dispatch action handler */}
        <div className="p-4 bg-cream/5 border border-cream/10 rounded space-y-4">
          {order.customer_email ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-ember">Email Sent Successfully</p>
                <p className="text-xs text-cream/60 mt-0.5">A complete receipt with brand details is sent to your Gmail: <span className="font-bold text-cream">{order.customer_email}</span></p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="text-xs uppercase font-bold tracking-widest text-green-400">WhatsApp Dispatch Ready</p>
                  <p className="text-xs text-cream/60 mt-0.5">No Gmail address was specified. You can send this beautifully pre-formatted receipt to our official WhatsApp support number instantly!</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  const itemsStr = orderItems.map(i => `${i.name_snapshot} x${i.quantity} (${i.line_total}৳)`).join(', ');
                  const msg = `🔥 *FLAYM ORDER RECEIPT* 🔥\n\n` +
                              `• *Order Reference:* #${order.order_number}\n` +
                              `• *Customer:* ${order.customer_name}\n` +
                              `• *Phone:* ${order.phone}\n` +
                              `• *Address:* ${order.address}\n` +
                              `• *Items:* ${itemsStr}\n` +
                              `• *Grand Total:* ${order.total}৳\n\n` +
                              `📍 Mirpur, Dhaka\n` +
                              `📞 Hotline: +8801577464706\n` +
                              `🌐 FB: facebook.com/flaymbd\n\n` +
                              `Thank you for choosing FLAYM! Sizzle, Grill, Devour. 🔥🍖`;
                  window.open(`https://api.whatsapp.com/send?phone=8801577464706&text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-4 rounded flex items-center justify-center gap-2 uppercase tracking-wider text-xs transition-colors cursor-pointer"
              >
                💬 Click to Send Receipt to WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
