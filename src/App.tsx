import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './lib/authContext';
import LandingPage from './pages/LandingPage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderStatusPage from './pages/OrderStatusPage';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminMenu from './pages/admin/AdminMenu';
import AdminSettings from './pages/admin/AdminSettings';
import AdminPromos from './pages/admin/AdminPromos';
import CustomerOrders from './pages/customer/CustomerOrders';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import NotificationListener from './components/NotificationListener';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    }
  }, []);

  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Toaster />
          <NotificationListener />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order/:id" element={<OrderStatusPage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="account/orders" element={<CustomerOrders />} />
            </Route>
            
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="menu" element={<AdminMenu />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="promos" element={<AdminPromos />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}
