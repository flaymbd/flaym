import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Flame, User, LogOut, LayoutDashboard, History, LogIn, UserPlus, X, Minus, Plus, Trash2, ArrowRight, Phone, Facebook, Instagram, MessageCircle, Mail } from 'lucide-react';
import { useCartStore } from '../lib/store';
import { useAuth } from '../lib/authContext';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Layout() {
  const { 
    items: cartItems, 
    isCartOpen, 
    setCartOpen, 
    updateQuantity, 
    removeItem, 
    getTotal 
  } = useCartStore();
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const { user, role, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [facebookOpen, setFacebookOpen] = useState(false);
  const [instagramOpen, setInstagramOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const whatsAppRef = useRef<HTMLDivElement>(null);
  const facebookRef = useRef<HTMLDivElement>(null);
  const instagramRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [deliveryCharge, setDeliveryCharge] = useState(70);

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

  useEffect(() => {
    if (itemCount > 0) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  useEffect(() => {
    const fetchDeliveryCharge = async () => {
      try {
        const docRef = doc(db, 'settings', 'store_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (typeof data.delivery_charge === 'number') {
            setDeliveryCharge(data.delivery_charge);
          }
        }
      } catch (err) {
        console.error("Error loading delivery charge in Layout:", err);
      }
    };
    fetchDeliveryCharge();
  }, [isCartOpen]);

  // Close dropdown and WhatsApp widget on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (whatsAppRef.current && !whatsAppRef.current.contains(event.target as Node)) {
        setWhatsAppOpen(false);
      }
      if (facebookRef.current && !facebookRef.current.contains(event.target as Node)) {
        setFacebookOpen(false);
      }
      if (instagramRef.current && !instagramRef.current.contains(event.target as Node)) {
        setInstagramOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col min-h-screen transition-colors duration-300 bg-charcoal text-cream font-sans">
      <header className={`sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b transition-colors duration-300 ${isSystemDark ? 'bg-charcoal/90 border-ember/20' : 'bg-white/90 border-gray-100'}`}>
        <Link to="/" className="flex items-center gap-2 text-ember hover:text-ember/80 transition-colors">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-black">
            <img 
              src="/flaym_favicon.jpg" 
              alt="FLAYM Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-display text-4xl tracking-wider leading-none mt-1">FLAYM</span>
        </Link>
        <nav className={`hidden md:flex items-center gap-8 font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>
          <Link to="/" className="hover:text-ember transition-colors">Home</Link>
          <Link to="/menu" className="hover:text-ember transition-colors">Menu</Link>
        </nav>
        <div className="flex items-center gap-4">
          {/* Organized Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className={`p-2 transition-colors flex items-center gap-1 focus:outline-none ${isSystemDark ? 'hover:text-ember' : 'hover:text-ember'}`}
              title="Profile & Settings"
            >
              <User size={24} className={user ? "text-ember" : isSystemDark ? "text-cream" : "text-gray-900"} />
              {user && (
                <span className={`hidden md:inline text-xs font-bold uppercase tracking-wider max-w-[80px] truncate transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-500'}`}>
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              )}
            </button>
            
            {profileOpen && (
              <div 
                className={`absolute right-0 mt-2 w-72 backdrop-blur-xl border p-5 shadow-2xl z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-top-3 duration-200 transition-colors duration-300 ${isSystemDark ? 'bg-charcoal/95 border-ember/20' : 'bg-white/95 border-gray-100'}`}
                style={{ borderRadius: '6px' }}
              >
                {/* User Info Header */}
                <div className={`border-b pb-3 transition-colors duration-300 ${isSystemDark ? 'border-cream/10' : 'border-gray-100'}`}>
                  <p className="text-[10px] font-bold text-ember uppercase tracking-widest">Account Status</p>
                  {user ? (
                    <div>
                      <p className={`font-display text-lg truncate mt-1 transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>
                        {user.displayName || 'FLAYM Customer'}
                      </p>
                      <p className={`text-xs truncate transition-colors duration-300 ${isSystemDark ? 'text-cream/50' : 'text-gray-500'}`}>
                        {user.email}
                      </p>
                      {role === 'admin' && (
                        <span className="inline-block bg-ember/10 text-ember text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest mt-1.5" style={{ borderRadius: '4px' }}>
                          Administrator
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className={`font-display text-lg mt-1 transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>Welcome to FLAYM</p>
                      <p className={`text-xs transition-colors duration-300 ${isSystemDark ? 'text-cream/50' : 'text-gray-500'}`}>Sign in to track orders & view history.</p>
                    </div>
                  )}
                </div>

                {/* Nav Links List */}
                <div className="flex flex-col gap-1">
                  {user ? (
                    <>
                      {/* Customer Orders */}
                      <Link 
                        to="/account/orders" 
                        onClick={() => setProfileOpen(false)}
                        className={`flex items-center gap-3 p-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${isSystemDark ? 'text-cream/80 hover:bg-cream/5 hover:text-ember' : 'text-gray-700 hover:bg-gray-50 hover:text-ember'}`}
                        style={{ borderRadius: '6px' }}
                      >
                        <History size={16} />
                        My Orders
                      </Link>

                      {/* Admin Dashboard - ONLY visible to admins */}
                      {role === 'admin' && (
                        <Link 
                          to="/admin" 
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 p-2.5 text-xs font-bold uppercase tracking-wider text-charcoal bg-ember hover:bg-ember/90 transition-all shadow-[0_0_10px_rgba(255,90,31,0.2)] mt-1"
                          style={{ borderRadius: '6px' }}
                        >
                          <LayoutDashboard size={16} />
                          Admin Dashboard
                        </Link>
                      )}

                      {/* Sign Out */}
                      <button 
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                          navigate('/');
                        }}
                        className={`flex items-center gap-3 p-2.5 text-xs font-bold uppercase tracking-wider transition-colors text-left w-full mt-2 border-t pt-3 ${isSystemDark ? 'text-cream/50 hover:text-deep-red hover:bg-deep-red/5 border-cream/5' : 'text-gray-400 hover:text-deep-red hover:bg-deep-red/5 border-gray-100'}`}
                        style={{ borderRadius: '6px' }}
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link 
                        to="/auth" 
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center justify-center gap-2 bg-ember text-charcoal font-bold p-3 text-xs uppercase tracking-wider hover:bg-ember/90 transition-colors"
                        style={{ borderRadius: '6px' }}
                      >
                        <LogIn size={14} />
                        Sign In / Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <motion.button 
            onClick={() => setCartOpen(!isCartOpen)} 
            animate={isShaking ? { rotate: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={`relative p-2 hover:text-ember transition-colors cursor-pointer focus:outline-none ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}
            title="Open Cart"
          >
            <ShoppingCart size={24} />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 bg-deep-red text-cream text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </motion.button>
        </div>
      </header>

      <main className="flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="flex-grow flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className={`border-t py-12 px-6 mt-auto text-center md:text-left transition-colors duration-300 ${isSystemDark ? 'bg-charcoal border-ember/20' : 'bg-white border-gray-100'}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-3xl text-ember mb-4">FLAYM</h3>
            <p className={`max-w-sm mx-auto md:mx-0 mb-6 transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-800'}`}>
              Meatbox & Shawarma done right. Flame-grilled. Bold flavors. Zero regrets.
            </p>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <button 
                onClick={() => setFacebookOpen(true)}
                className={`transition-colors p-2.5 border rounded-[5px] cursor-pointer focus:outline-none ${isSystemDark ? 'text-cream/50 hover:text-[#1877F2] bg-cream/5 hover:bg-[#1877F2]/10 border-cream/10 hover:border-[#1877F2]/30' : 'text-gray-500 hover:text-[#1877F2] bg-white hover:bg-[#1877F2]/5 border-gray-200 hover:border-[#1877F2]/20'}`}
                title="Facebook"
              >
                <Facebook size={18} />
              </button>
              <button 
                onClick={() => setInstagramOpen(true)}
                className={`transition-colors p-2.5 border rounded-[5px] cursor-pointer focus:outline-none ${isSystemDark ? 'text-cream/50 hover:text-[#E4405F] bg-cream/5 hover:bg-[#E4405F]/10 border-cream/10 hover:border-[#E4405F]/30' : 'text-gray-500 hover:text-[#E4405F] bg-white hover:bg-[#E4405F]/5 border-gray-200 hover:border-[#E4405F]/20'}`}
                title="Instagram"
              >
                <Instagram size={18} />
              </button>
              <button 
                onClick={() => setWhatsAppOpen(true)}
                className={`transition-colors p-2.5 border rounded-[5px] cursor-pointer focus:outline-none ${isSystemDark ? 'text-cream/50 hover:text-[#25D366] bg-cream/5 hover:bg-[#25D366]/10 border-cream/10 hover:border-[#25D366]/30' : 'text-gray-500 hover:text-[#25D366] bg-white hover:bg-[#25D366]/5 border-gray-200 hover:border-[#25D366]/20'}`}
                title="WhatsApp"
              >
                <MessageCircle size={18} />
              </button>
              <a 
                href="mailto:flaymbd@gmail.com" 
                className={`transition-colors p-2.5 border rounded-full ${isSystemDark ? 'text-cream/50 hover:text-ember bg-cream/5 hover:bg-ember/10 border-cream/10 hover:border-ember/30' : 'text-gray-500 hover:text-ember bg-white hover:bg-ember/5 border-gray-200 hover:border-ember/20'}`}
                title="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
          <div>
            <h4 className={`font-bold mb-6 uppercase tracking-wider text-sm transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>Links</h4>
            <div className="flex flex-col gap-3 items-center md:items-start">
              <Link to="/menu" className={`inline-flex items-center justify-center gap-2 border px-6 py-3 transition-all duration-300 group w-fit ${isSystemDark ? 'bg-charcoal border-cream/10 hover:border-ember hover:bg-ember/5' : 'bg-white border-gray-200 hover:border-ember hover:bg-ember/5'}`} style={{ borderRadius: '6px' }}>
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>Explore</span>
                <span className="text-ember text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">Menu &rarr;</span>
              </Link>
              <button 
                onClick={() => setCartOpen(true)} 
                className={`inline-flex items-center justify-center gap-2 border px-6 py-3 transition-all duration-300 group text-left cursor-pointer focus:outline-none w-fit ${isSystemDark ? 'bg-charcoal border-cream/10 hover:border-ember hover:bg-ember/5' : 'bg-white border-gray-200 hover:border-ember hover:bg-ember/5'}`} 
                style={{ borderRadius: '6px' }}
              >
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>My</span>
                <span className="text-ember text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">Cart &rarr;</span>
              </button>
              <Link to="/auth" className={`inline-flex items-center justify-center gap-2 border px-6 py-3 transition-all duration-300 group w-fit ${isSystemDark ? 'bg-charcoal border-cream/10 hover:border-ember hover:bg-ember/5' : 'bg-white border-gray-200 hover:border-ember hover:bg-ember/5'}`} style={{ borderRadius: '6px' }}>
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>Customer</span>
                <span className="text-ember text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">Sign In &rarr;</span>
              </Link>
            </div>
          </div>
          <div>
            <h4 className={`font-bold mb-4 uppercase tracking-wider transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>Location & Contact</h4>
            <p className={`mb-4 transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-800'}`}>
              Mirpur, Dhaka<br />
              Open Daily: 12 PM - 11 PM
            </p>
            <div className="flex flex-col gap-2 items-center md:items-start text-xs font-mono">
              <a href="tel:+8801577464706" className="text-ember hover:text-ember/85 font-bold flex items-center gap-1.5 transition-colors">
                📞 CALL: +8801577464706
              </a>
              <button 
                onClick={() => setWhatsAppOpen(true)}
                className="text-green-600 hover:text-green-500 font-bold flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none"
              >
                💬 WHATSAPP SUPPORT
              </button>
            </div>
          </div>
        </div>
        <div className={`text-center mt-12 pt-8 border-t transition-colors duration-300 ${isSystemDark ? 'border-cream/10 text-cream/50' : 'border-gray-200 text-gray-700'} text-sm`}>
          &copy; {new Date().getFullYear()} FLAYM. Grill. Sizzle. Devour.
        </div>
      </footer>

      {/* Slide-out Cart Drawer Overlay & Panel */}
      {/* Backdrop */}
      <div
        onClick={() => setCartOpen(false)}
        className={`fixed inset-0 bg-black/45 z-50 cursor-pointer backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer Container */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-md shadow-2xl z-50 flex flex-col h-screen border-l transition-all duration-300 ease-in-out ${isCartOpen ? 'translate-x-0 pointer-events-auto opacity-100' : 'translate-x-full pointer-events-none opacity-0'} ${isSystemDark ? 'bg-charcoal/95 border-cream/5 text-cream' : 'bg-white border-gray-200 text-gray-900'}`}
      >
              {/* Drawer Header */}
              <div className={`p-6 flex items-center justify-between border-b transition-colors duration-300 ${isSystemDark ? 'bg-black/20 border-cream/5' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <ShoppingCart className="text-ember" size={20} />
                  <h2 className="font-display text-xl uppercase tracking-wider">Your Order</h2>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors duration-300 ${isSystemDark ? 'bg-ember/20 text-ember' : 'bg-ember text-white'}`}>{itemCount} items</span>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className={`p-2 transition-colors rounded-full focus:outline-none cursor-pointer ${isSystemDark ? 'text-cream/50 hover:text-white bg-white/5 hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 bg-black/5 hover:bg-black/10'}`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body - Scrollable cart items */}
              <div className="flex-grow overflow-y-auto px-6 py-2 scrollbar-thin">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${isSystemDark ? 'bg-cream/5' : 'bg-gray-100'}`}>
                      <ShoppingCart size={40} className={isSystemDark ? 'text-cream/20' : 'text-gray-300'} />
                    </div>
                    <p className="font-display text-xl uppercase tracking-wide">Your cart is empty</p>
                    <p className={`text-sm mt-2 mb-8 transition-colors duration-300 ${isSystemDark ? 'text-cream/50' : 'text-gray-600'}`}>Looks like you haven't added anything yet.</p>
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        navigate('/menu');
                      }}
                      className={`font-bold py-3 px-8 rounded-full uppercase tracking-wider text-xs transition-all cursor-pointer border hover:scale-105 ${isSystemDark ? 'bg-cream/10 hover:bg-cream/20 text-cream border-cream/10' : 'bg-ember text-white border-ember shadow-md shadow-ember/20'}`}
                    >
                      Start Ordering
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                       key={item.id}
                      className={`flex items-center gap-4 py-5 border-b last:border-0 transition-colors duration-300 ${isSystemDark ? 'border-cream/5' : 'border-gray-100'}`}
                    >
                      <div className="flex-grow text-left">
                        <h4 className={`font-bold text-base tracking-wide ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>{item.name}</h4>
                        <p className="text-ember text-sm font-bold mt-0.5">{item.price}৳</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`flex items-center rounded-full border transition-colors duration-300 ${isSystemDark ? 'bg-black/30 border-cream/10' : 'bg-gray-100 border-gray-300 shadow-sm'}`}>
                          <button
                            onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                            className={`p-2 transition-colors cursor-pointer rounded-l-full ${isSystemDark ? 'text-cream/60 hover:text-ember' : 'text-gray-500 hover:text-ember'}`}
                          >
                            <Minus size={12} />
                          </button>
                          <span className={`w-8 text-center text-sm font-bold ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className={`p-2 transition-colors cursor-pointer rounded-r-full ${isSystemDark ? 'text-cream/60 hover:text-ember' : 'text-gray-500 hover:text-ember'}`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className={`w-14 text-right font-bold text-sm ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>
                          {item.price * item.quantity}৳
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className={`p-2 transition-colors cursor-pointer rounded-full ${isSystemDark ? 'text-cream/30 hover:text-deep-red hover:bg-deep-red/10' : 'text-gray-400 hover:text-deep-red hover:bg-deep-red/5'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer - Price breakdown & Action */}
              {cartItems.length > 0 && (
                <div className={`p-6 border-t transition-colors duration-300 ${isSystemDark ? 'bg-black/20 border-cream/5' : 'bg-white border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]'}`}>
                  <div className={`space-y-3 mb-6 text-sm transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-800'}`}>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className={`font-bold ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>{getTotal()}৳</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge</span>
                      <span className={`font-bold ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>{deliveryCharge}৳</span>
                    </div>
                    <div className={`flex justify-between pt-4 mt-2 border-t text-lg font-bold transition-colors duration-300 ${isSystemDark ? 'border-cream/5 text-cream' : 'border-gray-200 text-gray-900'}`}>
                      <span>Total</span>
                      <span className="text-ember text-xl font-display">{getTotal() + deliveryCharge}৳</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCartOpen(false);
                      navigate('/checkout');
                    }}
                    className="w-full bg-ember text-black font-bold py-4 rounded-full flex items-center justify-center gap-2 hover:bg-ember/90 transition-all uppercase tracking-wider text-sm shadow-[0_4px_20px_rgba(255,90,31,0.25)] cursor-pointer hover:scale-[1.02]"
                  >
                    Proceed to Checkout
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>

      {/* Floating WhatsApp Support Widget with Preview Window */}
      <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex flex-col items-start gap-2" ref={whatsAppRef}>
        <AnimatePresence>
          {whatsAppOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`mb-3 w-[290px] sm:w-[330px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)] border flex flex-col font-sans text-left transition-colors duration-300 ${isSystemDark ? 'bg-[#121b22] text-[#e9edef] border-[#222e35]' : 'bg-white text-gray-800 border-gray-200'}`}
              style={{ borderRadius: '12px' }}
            >
              {/* Cover Photo */}
              <div className="h-24 w-full relative">
                <img 
                  src="/src/assets/images/flaym_hero_meat_1784290684310.jpg" 
                  alt="FLAYM Cover" 
                  className="w-full h-full object-cover brightness-[0.7]"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent transition-colors duration-300 ${isSystemDark ? 'from-[#121b22]' : 'from-white'}`} />
                <button 
                  onClick={() => setWhatsAppOpen(false)}
                  className={`absolute top-2 right-2 rounded-full p-1 transition-colors focus:outline-none cursor-pointer text-white/80 hover:text-white ${isSystemDark ? 'bg-[#121b22]/60 hover:bg-[#121b22]/90' : 'bg-black/40 hover:bg-black/60'}`}
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Profile Photo Overlap & Details */}
              <div className="relative px-4 pb-4 pt-8">
                {/* Overlapping Rounded WhatsApp Profile Photo */}
                <div className={`absolute top-[-24px] left-4 w-12 h-12 rounded-full border-2 overflow-hidden shadow-md transition-colors duration-300 ${isSystemDark ? 'border-[#121b22] bg-[#121b22]' : 'border-white bg-white'}`}>
                  <img 
                    src="/flaym-logo.jpg" 
                    alt="FLAYM Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Profile Info */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className={`font-bold text-base tracking-wide transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>FLAYM Support</span>
                    {/* WhatsApp Verified Badge */}
                    <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span className={`text-[10px] font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream/50' : 'text-gray-500'}`}>Official Business Account</span>
                  
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#25D366] font-semibold">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#25D366]"></span>
                    </span>
                    Typically replies instantly
                  </div>
                </div>

                {/* Custom Welcome Message Chat Bubble */}
                <div className={`mt-3 text-xs p-3 rounded-lg border relative shadow-sm transition-colors duration-300 ${isSystemDark ? 'bg-[#202c33] text-cream/90 border-[#2c3941]' : 'bg-[#f0f2f5] text-gray-800 border-gray-100'}`}>
                  <p className="leading-relaxed">
                    Hi there! 👋 Welcome to FLAYM Support. Click below to message us directly on WhatsApp!
                  </p>
                  {/* Little chat bubble pointer triangle */}
                  <div className={`absolute top-3 left-[-5px] w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent transition-colors duration-300 ${isSystemDark ? 'border-r-[#202c33]' : 'border-r-[#f0f2f5]'}`} />
                </div>

                {/* WhatsApp Link button */}
                <a 
                  href="https://wa.me/8801577464706" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => setWhatsAppOpen(false)}
                  className="mt-3 w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(37,211,102,0.2)] text-[11px] uppercase tracking-wider text-center cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Send Message
                </a>
                <div className={`text-center mt-2 text-[9px] transition-colors duration-300 ${isSystemDark ? 'text-cream/40' : 'text-gray-400'}`}>
                  Usually online: 12:00 PM - 11:00 PM
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setWhatsAppOpen(!whatsAppOpen)} 
          title="WhatsApp Support"
          className="bg-[#25D366] text-white w-10 h-10 sm:w-12 sm:h-12 hover:bg-[#128C7E] transition-all duration-300 shadow-lg hover:scale-110 flex items-center justify-center border border-[#25D366]/30 focus:outline-none cursor-pointer"
          style={{ borderRadius: '5px' }}
        >
          {whatsAppOpen ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Centered Facebook Popup */}
      <AnimatePresence>
        {facebookOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setFacebookOpen(false)}
          >
            <motion.div
              ref={facebookRef}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`w-full max-w-sm overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)] border flex flex-col font-sans text-left transition-colors duration-300 ${isSystemDark ? 'bg-[#1C2B33] text-[#e9edef] border-[#222e35]' : 'bg-white text-gray-800 border-gray-200'}`}
              style={{ borderRadius: '12px' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="h-28 w-full relative">
                <img 
                  src="/src/assets/images/flaym_hero_meat_1784290684310.jpg" 
                  alt="FLAYM Cover" 
                  className="w-full h-full object-cover brightness-[0.7]"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent transition-colors duration-300 ${isSystemDark ? 'from-[#1C2B33]' : 'from-white'}`} />
                <button 
                  onClick={() => setFacebookOpen(false)}
                  className={`absolute top-3 right-3 rounded-full p-1.5 transition-colors focus:outline-none cursor-pointer text-white/80 hover:text-white ${isSystemDark ? 'bg-[#1C2B33]/60 hover:bg-[#1C2B33]/90' : 'bg-black/40 hover:bg-black/60'}`}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative px-5 pb-5 pt-10">
                <div className={`absolute top-[-32px] left-5 w-16 h-16 rounded-full border-[3px] overflow-hidden bg-black shadow-lg transition-colors duration-300 ${isSystemDark ? 'border-[#1C2B33]' : 'border-white'}`}>
                  <img 
                    src="/flaym-logo.jpg" 
                    alt="FLAYM Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold text-lg tracking-wide transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>FLAYM</span>
                    <svg className="w-4 h-4 text-[#1877F2] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span className={`text-xs font-medium mt-0.5 transition-colors duration-300 ${isSystemDark ? 'text-cream/60' : 'text-gray-500'}`}>@flaymbd • Restaurant</span>
                </div>

                <div className={`mt-4 text-sm p-4 rounded-xl border relative shadow-sm transition-colors duration-300 ${isSystemDark ? 'bg-[#273841] text-cream/90 border-[#30434e]' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  <p className="leading-relaxed">
                    Check out our latest offers, mouth-watering photos, and updates on our official Facebook page! 🍔🔥
                  </p>
                </div>

                <a 
                  href="https://www.facebook.com/flaymbd/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => setFacebookOpen(false)}
                  className="mt-5 w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(24,119,242,0.3)] text-xs uppercase tracking-wider text-center cursor-pointer"
                >
                  <Facebook size={18} />
                  Visit Facebook Page
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centered Instagram Popup */}
      <AnimatePresence>
        {instagramOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setInstagramOpen(false)}
          >
            <motion.div
              ref={instagramRef}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`w-full max-w-sm overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)] border flex flex-col font-sans text-left transition-colors duration-300 ${isSystemDark ? 'bg-[#1C2B33] text-[#e9edef] border-[#222e35]' : 'bg-white text-gray-800 border-gray-200'}`}
              style={{ borderRadius: '12px' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="h-28 w-full relative">
                <img 
                  src="/src/assets/images/flaym_hero_meat_1784290684310.jpg" 
                  alt="FLAYM Cover" 
                  className="w-full h-full object-cover brightness-[0.7]"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent transition-colors duration-300 ${isSystemDark ? 'from-[#1C2B33]' : 'from-white'}`} />
                <button 
                  onClick={() => setInstagramOpen(false)}
                  className={`absolute top-3 right-3 rounded-full p-1.5 transition-colors focus:outline-none cursor-pointer text-white/80 hover:text-white ${isSystemDark ? 'bg-[#1C2B33]/60 hover:bg-[#1C2B33]/90' : 'bg-black/40 hover:bg-black/60'}`}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative px-5 pb-5 pt-10">
                <div className="absolute top-[-32px] left-5 w-16 h-16 rounded-full overflow-hidden shadow-lg p-0.5 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]">
                  <div className={`w-full h-full rounded-full border-[2px] overflow-hidden bg-black transition-colors duration-300 ${isSystemDark ? 'border-[#1C2B33]' : 'border-white'}`}>
                    <img 
                      src="/flaym-logo.jpg" 
                      alt="FLAYM Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold text-lg tracking-wide transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>FLAYM</span>
                    <svg className="w-4 h-4 text-[#3897f0] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span className={`text-xs font-medium mt-0.5 transition-colors duration-300 ${isSystemDark ? 'text-cream/60' : 'text-gray-500'}`}>@flaymbd • Food & Beverage</span>
                </div>

                <div className={`mt-4 text-sm p-4 rounded-xl border relative shadow-sm transition-colors duration-300 ${isSystemDark ? 'bg-[#273841] text-cream/90 border-[#30434e]' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  <p className="leading-relaxed">
                    Follow us on Instagram for behind-the-scenes, stories, and our most aesthetic food shots! 📸✨
                  </p>
                </div>

                <a 
                  href="https://instagram.com/flaymbd" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => setInstagramOpen(false)}
                  className="mt-5 w-full text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(228,64,95,0.3)] text-xs uppercase tracking-wider text-center cursor-pointer bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90"
                >
                  <Instagram size={18} />
                  Visit Instagram Profile
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
