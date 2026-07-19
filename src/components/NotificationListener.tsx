import { useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../lib/authContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function NotificationListener() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  // Keep track of the initial load to avoid alerting on existing data
  const isFirstLoadAdmin = useRef(true);
  const initialLoadOrders = useRef<Set<string>>(new Set());

  // Customer order statuses we care about
  const previousStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    // Request permission for push notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const showNotification = (title: string, options?: any) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            payload: {
              title,
              options: {
                ...options,
                icon: '/flaym-logo.jpg',
                badge: '/flaym-logo.jpg',
                data: options?.data || window.location.origin + '/account/orders'
              }
            }
          });
        } else {
          try {
            new Notification(title, {
              ...options,
              icon: '/flaym-logo.jpg'
            });
          } catch (e) {
            console.error('Notification constructor failed:', e);
          }
        }
      }
    };

    if (role === 'admin') {
      // Listen for NEW orders (pending)
      // Since we can't easily distinguish 'new' vs 'existing' on first load,
      // we'll fetch once, record IDs, and then alert on newly added ones.
      
      const ordersRef = collection(db, 'orders');
      // We can query by status = 'pending' and maybe limit to recent ones to not load everything
      const q = query(
        ordersRef,
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (isFirstLoadAdmin.current) {
          snapshot.docs.forEach(doc => {
            initialLoadOrders.current.add(doc.id);
          });
          isFirstLoadAdmin.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const orderId = change.doc.id;
            // Only alert if it's truly new (not in initial load)
            if (!initialLoadOrders.current.has(orderId)) {
              initialLoadOrders.current.add(orderId);
              
              const orderData = change.doc.data();
              const notifTitle = 'New Order Received!';
              const notifBody = `Order #${orderData.order_number} has been placed.`;

              showNotification(notifTitle, {
                body: notifBody,
                icon: '/flaym-logo.jpg',
                data: window.location.origin + '/admin/orders'
              });

              toast(
                (t) => (
                  <div className="flex flex-col gap-1 cursor-pointer animate-pulse" onClick={() => {
                    toast.dismiss(t.id);
                    navigate('/admin/orders');
                  }}>
                    <span className="font-bold text-lg text-ember">You have a new order!</span>
                    <span className="text-sm">Order #{orderData.order_number}</span>
                  </div>
                ),
                {
                  duration: 8000,
                  position: 'top-right',
                  style: {
                    background: '#1C2B33',
                    color: '#e9edef',
                    border: '2px solid #FF5A1F',
                    boxShadow: '0 0 20px rgba(255,90,31,0.5)',
                  },
                  icon: '🔥',
                }
              );
            }
          }
        });
      });

      return () => unsubscribe();
    } else {
      // Customer: Listen to their orders to check for status changes
      const ordersRef = collection(db, 'orders');
      // Ensure we have an index for user_id, or just use what we have
      const q = query(
        ordersRef,
        where('user_id', '==', user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach((doc) => {
          const orderId = doc.id;
          const data = doc.data();
          const currentStatus = data.status;
          const prevStatus = previousStatuses.current[orderId];

          if (prevStatus && prevStatus !== currentStatus) {
            // Status changed
            let message = '';
            let icon = 'ℹ️';
            
            if (currentStatus === 'confirmed') {
              message = 'Your order has been accepted!';
              icon = '✅';
            } else if (currentStatus === 'preparing') {
              message = 'Your food is being prepared!';
              icon = '👨‍🍳';
            } else if (currentStatus === 'out-for-delivery') {
              message = 'Your order is out for delivery!';
              icon = '🛵';
            } else if (currentStatus === 'delivered') {
              message = 'Your order has been delivered!';
              icon = '🎉';
            } else if (currentStatus === 'canceled') {
              message = 'Your order has been cancelled.';
              icon = '❌';
            }

            if (message) {
              showNotification(`Order Status: ${currentStatus.toUpperCase()}`, {
                body: message,
                icon: '/flaym-logo.jpg',
                data: window.location.origin + `/order/${orderId}`
              });

              toast.success(message, {
                duration: 5000,
                position: 'top-center',
                style: {
                  background: '#222e35',
                  color: '#e9edef',
                  border: '1px solid #FF5A1F',
                },
                icon: icon,
              });
            }
          }

          // Update previous status
          previousStatuses.current[orderId] = currentStatus;
        });
      });

      return () => unsubscribe();
    }
  }, [user, role, navigate]);

  return null;
}
