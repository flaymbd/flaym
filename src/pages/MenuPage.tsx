import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCartStore } from '../lib/store';
import { useAuth } from '../lib/authContext';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart, Search, X, Sparkles, Flame } from 'lucide-react';

const logoImg = "/flaym-logo.jpg";

export default function MenuPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [flatDiscount, setFlatDiscount] = useState(0);
  const [addingItems, setAddingItems] = useState<Record<string, boolean>>({});
  const addItem = useCartStore(state => state.addItem);
  const cartItems = useCartStore(state => state.items);

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

  const handleAddToCart = (product: any) => {
    setAddingItems(prev => ({ ...prev, [product.id]: true }));
    addItem({ id: product.id, name: product.name, price: getDiscountedPrice(product.selling_price), quantity: 1, category: product.category } as any);
    
    setTimeout(() => {
      setAddingItems(prev => ({ ...prev, [product.id]: false }));
    }, 500);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'store_config'), (snapshot) => {
      if (snapshot.exists()) {
        setFlatDiscount(Number(snapshot.data().flat_discount_percent) || 0);
      }
    }, (err) => {
      console.error("Failed to listen to store config settings:", err);
    });
    return () => unsubscribe();
  }, []);

  const getDiscountedPrice = (price: number) => {
    if (flatDiscount <= 0) return price;
    return Math.round(price * (1 - flatDiscount / 100));
  };

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('sort_order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    }, (err) => {
      console.error("Failed to listen to menu:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Removed fetchRecommendations

  const categories = Array.from(new Set([
    'Meatbox', 
    'Shawarma', 
    'Combos', 
    ...products.map(p => p.category).filter(Boolean)
  ]));

  const getFilteredProducts = (category: string) => {
    return products.filter(product => {
      if (product.category !== category || !product.is_available) return false;
      if (searchQuery.trim() !== '' && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  };

  const hasAnyMatches = categories.some(category => getFilteredProducts(category).length > 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-6 py-12">
        {/* Skeleton Header */}
        <div className="flex flex-col items-center justify-center py-8 mb-12">
          <div className="relative mb-6">
            <img 
              src={logoImg} 
              alt="Loading FLAYM..." 
              className="w-32 h-32 object-contain animate-pulse rounded-full border-2 border-ember/20 p-2 shadow-[0_0_20px_rgba(255,90,31,0.15)]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 rounded-full border border-ember/30 animate-ping opacity-25 pointer-events-none" />
          </div>
          <h2 className="font-display text-2xl uppercase tracking-widest text-ember animate-pulse">Igniting the Grills...</h2>
          <p className="text-xs text-cream/40 uppercase tracking-widest mt-1">Preparing flame-grilled goodness</p>
        </div>

        {/* Skeleton Grid */}
        <div className="space-y-12">
          <div className="border-b border-ember/20 pb-4">
            <div className="h-8 bg-cream/10 w-48 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(id => (
              <div 
                key={id} 
                className="bg-charcoal/50 border border-cream/10 p-6 flex flex-col h-full animate-pulse"
                style={{ borderRadius: '6px' }}
              >
                <div className="h-44 bg-cream/5 w-full rounded mb-6 flex items-center justify-center overflow-hidden relative">
                  <img src={logoImg} alt="Loading..." className="w-20 h-20 opacity-10 object-contain grayscale" />
                </div>
                <div className="flex justify-between items-start mb-3">
                  <div className="h-6 bg-cream/10 w-2/3 rounded" />
                  <div className="h-6 bg-cream/10 w-16 rounded" />
                </div>
                <div className="space-y-2 flex-grow">
                  <div className="h-4 bg-cream/5 w-full rounded" />
                  <div className="h-4 bg-cream/5 w-5/6 rounded" />
                </div>
                <div className="h-12 bg-cream/5 w-full rounded mt-6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-12">
      <Helmet>
        <title>Flaym | Menu - Meatbox & Shawarma</title>
        <meta name="description" content="Explore our legendary menu of flame-grilled Meatboxes and sizzling Shawarmas." />
        <meta property="og:title" content="Flaym | Menu - Meatbox & Shawarma" />
        <meta property="og:description" content="Explore our legendary menu of flame-grilled Meatboxes and sizzling Shawarmas." />
        <meta property="og:image" content="/flaym-logo.jpg" />
        <meta property="og:type" content="website" />
      </Helmet>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className={`font-display text-6xl md:text-8xl uppercase tracking-tight transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>Our <span className="text-ember">Menu</span></h1>
        <p className={`text-xl mt-4 font-light transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-800'}`}>Flame-grilled. Bold flavors. Zero regrets.</p>
      </motion.div>

      {/* Real-time Search Bar */}
      <div className="max-w-md mx-auto mb-6 relative z-20">
        <div className="relative flex items-center">
          <Search className={`absolute left-4 transition-colors duration-300 ${isSystemDark ? 'text-cream/40' : 'text-gray-400'}`} size={20} />
          <input
            type="text"
            placeholder="Search our legendary menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full backdrop-blur-md border focus:border-ember focus:outline-none py-3.5 pl-12 pr-10 transition-all uppercase tracking-wider text-xs font-bold ${isSystemDark ? 'bg-charcoal/60 border-cream/10 text-cream placeholder-cream/40' : 'bg-white/70 border-gray-200 text-gray-900 placeholder-gray-400'}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-4 transition-colors ${isSystemDark ? 'text-cream/40 hover:text-ember' : 'text-gray-400 hover:text-ember'}`}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Non-overlapping Horizontal Category Selection Bar */}
      {hasAnyMatches && searchQuery === '' && (
        <div className="flex gap-2 justify-start md:justify-center overflow-x-auto pb-6 mb-12 scrollbar-none scroll-smooth max-w-full">
          {categories.map(category => {
            const count = products.filter(p => p.category === category && p.is_available).length;
            if (count === 0) return null;
            return (
              <button
                key={`nav-cat-${category}`}
                onClick={() => {
                  const element = document.getElementById(`section-${category}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className={`px-5 py-2.5 backdrop-blur-sm border text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer hover:border-ember hover:text-ember ${isSystemDark ? 'bg-charcoal/50 border-cream/10 text-cream hover:bg-ember/10' : 'bg-white border-gray-300 text-gray-800 hover:bg-ember/5 shadow-sm'}`}
                style={{ borderRadius: '4px' }}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!hasAnyMatches ? (
          <motion.div 
            key="no-match"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-center py-20 border backdrop-blur-md max-w-xl mx-auto transition-colors duration-300 ${isSystemDark ? 'border-cream/10 bg-charcoal/30' : 'border-gray-200 bg-white shadow-sm'}`}
          >
            <span className="text-4xl">🔍</span>
            <h3 className={`font-display text-2xl uppercase mt-4 mb-2 transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>No Items Match Your Search</h3>
            <p className={`text-sm mb-6 transition-colors duration-300 ${isSystemDark ? 'text-cream/60' : 'text-gray-600'}`}>Try clearing your search to find your perfect flavor.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
              }}
              className="bg-ember text-charcoal font-bold py-2.5 px-6 uppercase tracking-wider hover:bg-ember/90 transition-colors text-sm cursor-pointer"
            >
              Clear Search
            </button>
          </motion.div>
        ) : (
          <div className="space-y-20">
            {categories.map((category, catIndex) => {
              const categoryProducts = getFilteredProducts(category);
              if (categoryProducts.length === 0) return null;

              return (
                <motion.section 
                  layout="position"
                  key={category} 
                  id={`section-${category}`}
                  className="mb-20 scroll-mt-24"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIndex * 0.05 }}
                >
                  <h2 className="font-display text-4xl md:text-5xl text-ember mb-8 uppercase tracking-wider border-b border-ember/20 pb-4">
                    {category}
                  </h2>
                  <motion.div 
                    layout 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    <AnimatePresence mode="popLayout">
                      {categoryProducts.map(product => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.25 }}
                          key={product.id} 
                          className={`border hover:border-ember/50 transition-all group flex flex-col h-full shadow-lg overflow-hidden backdrop-blur-xl ${isSystemDark ? 'bg-charcoal/60 border-cream/10' : 'bg-white/80 border-gray-100'}`}
                        >
                          <div className="h-48 overflow-hidden relative">
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className={`absolute inset-0 bg-gradient-to-t to-transparent opacity-40 transition-colors duration-300 ${isSystemDark ? 'from-charcoal' : 'from-white'}`}></div>
                          </div>
                          <div className={`p-6 flex flex-col flex-grow -mt-6 relative z-10 transition-colors duration-300 ${isSystemDark ? 'bg-charcoal/80' : 'bg-white/90'}`}>
                            <div className="flex justify-between items-start mb-4">
                              <h3 className={`text-2xl font-display tracking-wide transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>{product.name}</h3>
                              <div className="flex flex-col items-end shrink-0">
                                {flatDiscount > 0 ? (
                                  <>
                                    <span className={`text-xs line-through transition-colors duration-300 ${isSystemDark ? 'text-cream/40' : 'text-gray-400'}`}>{product.selling_price}৳</span>
                                    <span className="text-xl font-bold text-ember">{getDiscountedPrice(product.selling_price)}৳</span>
                                  </>
                                ) : (
                                  <span className="text-xl font-bold text-ember">{product.selling_price}৳</span>
                                )}
                              </div>
                            </div>

                            <p className={`text-sm mb-6 flex-grow leading-relaxed transition-colors duration-300 ${isSystemDark ? 'text-cream/60' : 'text-gray-700'}`}>{product.description}</p>
                            <button 
                              onClick={() => handleAddToCart(product)}
                              disabled={addingItems[product.id]}
                              className={`w-full font-bold py-3 px-4 flex items-center justify-between transition-all border uppercase tracking-wider ${addingItems[product.id] ? 'bg-ember text-white border-ember' : isSystemDark ? 'bg-cream/5 hover:bg-ember text-cream hover:text-charcoal border-cream/10 hover:border-ember' : 'bg-gray-50 hover:bg-ember text-gray-900 hover:text-white border-gray-200 hover:border-ember shadow-sm'}`}
                            >
                              <span className="flex items-center gap-2">
                                <ShoppingCart size={18} />
                                {addingItems[product.id] ? 'Added!' : 'Add to cart'}
                              </span>
                              {(cartItems.find(i => i.id === product.id)?.quantity || 0) > 0 && (
                                <span className={`text-xs font-bold px-2 py-0.5 border transition-colors duration-300 ${isSystemDark ? 'bg-charcoal/50 text-ember border-ember/30' : 'bg-white text-ember border-ember/50'}`}>
                                  {cartItems.find(i => i.id === product.id)?.quantity || 0}
                                </span>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </motion.section>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
