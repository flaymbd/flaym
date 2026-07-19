import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import PromotionalBanner from '../components/PromotionalBanner';

export default function LandingPage() {
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

  return (
    <div className="flex flex-col w-full">
      <Helmet>
        <title>Flaym | Best Meatbox & Shawarma in Town</title>
        <meta name="description" content="Feel the Flaym. Juicy Meatbox & Sizzling Shawarma - Grilled to Perfection, Delivered to Your Door." />
        <meta property="og:title" content="Flaym | Best Meatbox & Shawarma in Town" />
        <meta property="og:description" content="Feel the Flaym. Juicy Meatbox & Sizzling Shawarma - Grilled to Perfection, Delivered to Your Door." />
        <meta property="og:image" content="/flaym-logo.jpg" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Hero Section */}
      <section className="relative min-h-[65vh] md:min-h-[75vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-charcoal/80 z-10" />
          <img 
            src="/src/assets/images/flaym_hero_meat_1784290684310.jpg" 
            alt="Flame grilled meat" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center py-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tighter text-cream mb-4 uppercase"
          >
            Feel the <span className="text-ember">Flaym.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-2xl text-cream/90 mb-8 max-w-2xl font-light"
          >
            Juicy Meatbox & Sizzling Shawarma - Grilled to Perfection, Delivered to Your Door.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/menu" className="bg-ember text-black font-bold py-3 px-8 text-base md:text-lg hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,90,31,0.4)] uppercase tracking-wider rounded" style={{ borderRadius: '6px' }}>
              Order Now
            </Link>
            <a href="#about" className="border border-cream text-cream font-bold py-3 px-8 text-base md:text-lg hover:bg-cream hover:text-charcoal transition-all uppercase tracking-wider rounded" style={{ borderRadius: '6px' }}>
              Find Us
            </a>
          </motion.div>
        </div>
      </section>

      {/* Promotional Banner Section */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 md:pt-12">
        <PromotionalBanner />
      </section>

      {/* About Section */}
      <section id="about" className={`py-12 md:py-20 px-4 sm:px-6 transition-colors duration-500 ${isSystemDark ? 'bg-charcoal' : 'bg-[#FAF6EB]'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl text-ember mb-6 uppercase drop-shadow-sm">We Don't Just Cook. We Ignite.</h2>
          <div className={`text-base sm:text-lg md:text-xl space-y-4 md:space-y-6 leading-relaxed transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-900'}`}>
            <p>At FLAYM, every bite tells a story of fire, spice, and passion.</p>
            <p>We bring you the boldest Meatbox combos and the most authentic Shawarma in town - slow-marinated, flame-grilled, and packed with flavor that hits different.</p>
            <p className={`font-bold transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-black'}`}>No shortcuts. No compromises. Just real food, real heat, real good.</p>
          </div>
        </div>
      </section>

      {/* Menu Highlights */}
      <section className={`py-12 md:py-20 px-4 sm:px-6 border-t border-b transition-colors duration-500 ${isSystemDark ? 'bg-charcoal border-ember/10' : 'bg-[#FAF6EB] border-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`font-display text-3xl sm:text-5xl md:text-6xl text-center mb-10 md:mb-16 uppercase transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>Pick Your <span className="text-ember">Flaym</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className={`border transition-all duration-500 p-6 md:p-8 flex flex-col group backdrop-blur-xl rounded-lg ${isSystemDark ? 'bg-charcoal/60 border-ember/20 hover:border-ember shadow-lg shadow-black/20' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
              <div className="h-48 sm:h-56 lg:h-64 mb-4 md:mb-6 overflow-hidden relative rounded-md">
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent transition-colors duration-300 opacity-40 ${isSystemDark ? 'from-charcoal' : 'from-white'}`} />
                <img src="/src/assets/images/flaym_meatbox_1784290718155.jpg" alt="Meatbox" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-ember mb-3 uppercase">Meatbox</h3>
              <p className={`mb-4 md:mb-6 flex-grow text-sm md:text-base transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-800'}`}>Loaded boxes of grilled chicken, beef, and lamb - served with fries, garlic sauce, and our secret Flaym spice blend.</p>
              <blockquote className={`border-l-4 border-ember pl-4 italic text-sm md:text-base font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-black'}`}>"One box. Maximum satisfaction."</blockquote>
            </div>

            <div className={`border transition-all duration-500 p-6 md:p-8 flex flex-col group backdrop-blur-xl rounded-lg ${isSystemDark ? 'bg-charcoal/60 border-ember/20 hover:border-ember shadow-lg shadow-black/20' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
              <div className="h-48 sm:h-56 lg:h-64 mb-4 md:mb-6 overflow-hidden relative rounded-md">
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent transition-colors duration-300 opacity-40 ${isSystemDark ? 'from-charcoal' : 'from-white'}`} />
                <img src="/src/assets/images/flaym_shawarma_1784290704330.jpg" alt="Shawarma" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-ember mb-3 uppercase">Shawarma</h3>
              <p className={`mb-4 md:mb-6 flex-grow text-sm md:text-base transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-800'}`}>Tender, juicy meat wrapped in fresh bread with crispy veggies, creamy sauces, and the perfect kick of spice.</p>
              <blockquote className={`border-l-4 border-ember pl-4 italic text-sm md:text-base font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-black'}`}>"Every wrap, a flavor explosion."</blockquote>
            </div>

            <div className={`border transition-all duration-500 p-6 md:p-8 flex flex-col group backdrop-blur-xl rounded-lg ${isSystemDark ? 'bg-charcoal/60 border-ember/20 hover:border-ember shadow-lg shadow-black/20' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
              <div className="h-48 sm:h-56 lg:h-64 mb-4 md:mb-6 overflow-hidden relative rounded-md">
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent transition-colors duration-300 opacity-40 ${isSystemDark ? 'from-charcoal' : 'from-white'}`} />
                <img src="/src/assets/images/flaym_hero_meat_1784290684310.jpg" alt="Combos" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-ember mb-3 uppercase">Flaym Combos</h3>
              <p className={`mb-4 md:mb-6 flex-grow text-sm md:text-base transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-800'}`}>Can't choose? Don't. Our combo platters bring the best of both worlds - Meatbox + Shawarma, side by side.</p>
              <blockquote className={`border-l-4 border-ember pl-4 italic text-sm md:text-base font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-black'}`}>"The ultimate feast for the bold."</blockquote>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link to="/menu" className="inline-flex items-center gap-2 text-ember hover:opacity-80 text-lg font-bold uppercase tracking-wider transition-all">
              See Full Menu <span className="text-xl">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Flaym */}
      <section className={`py-12 md:py-20 px-4 sm:px-6 transition-colors duration-500 ${isSystemDark ? 'bg-charcoal' : 'bg-[#FAF6EB]'}`}>
        <div className="max-w-4xl mx-auto">
          <h2 className={`font-display text-3xl sm:text-5xl md:text-6xl text-center mb-10 md:mb-16 uppercase transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>Why Everyone's <span className="text-ember">Obsessed</span></h2>
          <div className="space-y-4">
            {[
              { icon: '/src/assets/images/obsessed_meat_1784306318478.jpg', text: 'Premium cuts, marinated overnight' },
              { icon: '/src/assets/images/obsessed_flame_1784306334382.jpg', text: 'Flame-grilled for that smoky, bold flavor' },
              { icon: '/src/assets/images/obsessed_delivery_1784306348528.jpg', text: 'Fast delivery - hot food, every time' },
              { icon: '/src/assets/images/obsessed_spices_1784306364810.jpg', text: 'Secret Flaym spice blend you won\'t find anywhere else' },
              { icon: '/src/assets/images/obsessed_portions_1784306379426.jpg', text: 'Generous portions - we don\'t do small' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-4 sm:gap-6 p-4 md:p-6 border transition-all duration-300 backdrop-blur-md rounded-lg ${isSystemDark ? 'border-ember/20 bg-charcoal/50 hover:bg-charcoal/70' : 'border-gray-200 bg-white hover:bg-slate-50 shadow-sm'}`}>
                <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 overflow-hidden border transition-colors duration-300 ${isSystemDark ? 'border-ember/30' : 'border-gray-300'}`} style={{ borderRadius: '6px' }}>
                  <img src={item.icon} alt={item.text} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className={`text-base sm:text-lg md:text-xl font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-12 md:py-20 px-4 sm:px-6 border-t transition-colors duration-500 ${isSystemDark ? 'bg-charcoal border-ember/10' : 'bg-[#FAF6EB] border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl text-center text-ember mb-10 md:mb-16 uppercase">What Our Fans Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className={`p-6 md:p-8 border transition-all duration-300 backdrop-blur-xl rounded-lg ${isSystemDark ? 'border-cream/10 bg-charcoal/30 hover:bg-charcoal/50' : 'border-gray-200 bg-white hover:bg-white/50 shadow-sm'}`}>
              <p className={`text-base md:text-lg italic mb-4 md:mb-6 transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-900'}`}>"FLAYM-er Meatbox is the best I've ever had. The spice blend is addictive!"</p>
              <p className="font-bold text-ember text-sm uppercase tracking-wider">— Rafid T., Dhaka</p>
            </div>
            <div className={`p-6 md:p-8 border transition-all duration-300 backdrop-blur-xl rounded-lg ${isSystemDark ? 'border-cream/10 bg-charcoal/30 hover:bg-charcoal/50' : 'border-gray-200 bg-white hover:bg-white/50 shadow-sm'}`}>
              <p className={`text-base md:text-lg italic mb-4 md:mb-6 transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-900'}`}>"Shawarma theke shuru kore Meatbox - sob e perfect. Daily order dii!"</p>
              <p className="font-bold text-ember text-sm uppercase tracking-wider">— Nusrat J., Chittagong</p>
            </div>
            <div className={`p-6 md:p-8 border transition-all duration-300 backdrop-blur-xl rounded-lg ${isSystemDark ? 'border-cream/10 bg-charcoal/30 hover:bg-charcoal/50' : 'border-gray-200 bg-white hover:bg-white/50 shadow-sm'}`}>
              <p className={`text-base md:text-lg italic mb-4 md:mb-6 transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-900'}`}>"Fastest delivery, hottest food. FLAYM never disappoints."</p>
              <p className="font-bold text-ember text-sm uppercase tracking-wider">— Tanvir H., Sylhet</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
