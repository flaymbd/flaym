import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, Star, ChevronRight, Sparkles, Utensils, Award } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import PromotionalBanner from '../components/PromotionalBanner';

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
}

export default function LandingPage() {
  const [isSystemDark, setIsSystemDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div className={`flex-grow transition-colors duration-500 ${isSystemDark ? 'bg-charcoal text-cream' : 'bg-[#FAF6EB] text-gray-900'}`}>
      <Helmet>
        <title>Flaym | Home - Meatbox & Shawarma</title>
        <meta name="description" content="Welcome to FLAYM - Home of the legendary Meatbox & sizzling Shawarma. Order online for flame-grilled perfection." />
        <meta property="og:title" content="Flaym | Home" />
        <meta property="og:description" content="Welcome to FLAYM - Home of the legendary Meatbox & sizzling Shawarma." />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-charcoal/80 z-10" />
          <img 
            src="/src/assets/images/flaym_hero_meat_1784290684310.jpg" 
            alt="FLAYM Flame-grilled meats" 
            className="w-full h-full object-cover scale-105 animate-pulse-slow"
          />
        </div>
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-7xl md:text-9xl tracking-tighter text-cream mb-6 uppercase"
          >
            Feel the <span className="text-ember">Flaym.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-3xl text-cream/90 mb-10 max-w-2xl font-light"
          >
            Juicy Meatbox & Sizzling Shawarma - Grilled to Perfection, Delivered to Your Door.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/menu" className="bg-ember text-black font-bold py-4 px-10 text-xl hover:bg-ember/90 transition-all shadow-[0_0_20px_rgba(255,90,31,0.4)] uppercase tracking-wider">
              Order Now
            </Link>
            <a href="#about" className="border border-cream text-cream font-bold py-4 px-10 text-xl hover:bg-cream hover:text-charcoal transition-all uppercase tracking-wider">
              Find Us
            </a>
          </motion.div>
        </div>
      </section>

      {/* Promotional Banner Section */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-12">
        <PromotionalBanner />
      </section>

      {/* About Section */}
      <section id="about" className={`py-24 px-6 transition-colors duration-500 ${isSystemDark ? 'bg-charcoal' : 'bg-[#FAF6EB]'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-5xl md:text-7xl text-ember mb-8 uppercase drop-shadow-sm">We Don't Just Cook. We Ignite.</h2>
          <div className={`text-lg md:text-2xl space-y-6 leading-relaxed transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-900'}`}>
            <p>At FLAYM, every bite tells a story of fire, spice, and passion.</p>
            <p>We bring you the boldest Meatbox combos and the most authentic Shawarma in town - slow-marinated, flame-grilled, and packed with flavor that hits different.</p>
            <p className={`font-bold transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-black'}`}>No shortcuts. No compromises. Just real food, real heat, real good.</p>
          </div>
        </div>
      </section>

      {/* Menu Highlights */}
      <section className={`py-24 px-6 border-t border-b transition-colors duration-500 ${isSystemDark ? 'bg-charcoal border-ember/10' : 'bg-[#FAF6EB] border-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`font-display text-5xl md:text-7xl text-center mb-16 uppercase transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>Pick Your <span className="text-ember">Flaym</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`border transition-all duration-500 p-8 flex flex-col group backdrop-blur-xl ${isSystemDark ? 'bg-charcoal/60 border-ember/20 hover:border-ember shadow-lg shadow-black/20' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
              <div className="h-64 mb-6 overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent transition-colors duration-300 opacity-40 ${isSystemDark ? 'from-charcoal' : 'from-white'}`} />
                <img src="/src/assets/images/flaym_meatbox_1784290718155.jpg" alt="Meatbox" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="font-display text-4xl text-ember mb-4 uppercase">Meatbox</h3>
              <p className={`mb-6 flex-grow transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-800'}`}>Loaded boxes of grilled chicken, beef, and lamb - served with fries, garlic sauce, and our secret Flaym spice blend.</p>
              <blockquote className={`border-l-4 border-ember pl-4 italic font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-black'}`}>"One box. Maximum satisfaction."</blockquote>
            </div>

            <div className={`border transition-all duration-500 p-8 flex flex-col group backdrop-blur-xl ${isSystemDark ? 'bg-charcoal/60 border-ember/20 hover:border-ember shadow-lg shadow-black/20' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
              <div className="h-64 mb-6 overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent transition-colors duration-300 opacity-40 ${isSystemDark ? 'from-charcoal' : 'from-white'}`} />
                <img src="/src/assets/images/flaym_shawarma_1784290704330.jpg" alt="Shawarma" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="font-display text-4xl text-ember mb-4 uppercase">Shawarma</h3>
              <p className={`mb-6 flex-grow transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-800'}`}>Tender, juicy meat wrapped in fresh bread with crispy veggies, creamy sauces, and the perfect kick of spice.</p>
              <blockquote className={`border-l-4 border-ember pl-4 italic font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-black'}`}>"Every wrap, a flavor explosion."</blockquote>
            </div>

            <div className={`border transition-all duration-500 p-8 flex flex-col group backdrop-blur-xl ${isSystemDark ? 'bg-charcoal/60 border-ember/20 hover:border-ember shadow-lg shadow-black/20' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
              <div className="h-64 mb-6 overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent transition-colors duration-300 opacity-40 ${isSystemDark ? 'from-charcoal' : 'from-white'}`} />
                <img src="/src/assets/images/flaym_hero_meat_1784290684310.jpg" alt="Combos" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="font-display text-4xl text-ember mb-4 uppercase">Flaym Combos</h3>
              <p className={`mb-6 flex-grow transition-colors duration-300 ${isSystemDark ? 'text-cream/70' : 'text-gray-800'}`}>Can't choose? Don't. Our combo platters bring the best of both worlds - Meatbox + Shawarma, side by side.</p>
              <blockquote className={`border-l-4 border-ember pl-4 italic font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-black'}`}>"The ultimate feast for the bold."</blockquote>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/menu" className="inline-flex items-center gap-2 text-ember hover:opacity-80 text-xl font-bold uppercase tracking-wider transition-all">
              See Full Menu <span className="text-2xl">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Flaym */}
      <section className={`py-24 px-6 transition-colors duration-500 ${isSystemDark ? 'bg-charcoal' : 'bg-[#FAF6EB]'}`}>
        <div className="max-w-4xl mx-auto">
          <h2 className={`font-display text-5xl md:text-7xl text-center mb-16 uppercase transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>Why Everyone's <span className="text-ember">Obsessed</span></h2>
          <div className="space-y-4">
            {[
              { icon: '/src/assets/images/obsessed_meat_1784306318478.jpg', text: 'Premium cuts, marinated overnight' },
              { icon: '/src/assets/images/obsessed_smoke_1784306346296.jpg', text: 'Flame-grilled to order for maximum juiciness' },
              { icon: '/src/assets/images/obsessed_spices_1784306364810.jpg', text: 'Secret Flaym spice blend you won\'t find anywhere else' },
              { icon: '/src/assets/images/obsessed_portions_1784306379426.jpg', text: 'Generous portions - we don\'t do small' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-6 p-6 border transition-all duration-300 backdrop-blur-md ${isSystemDark ? 'border-ember/20 bg-charcoal/50 hover:bg-charcoal/70' : 'border-gray-200 bg-white hover:bg-slate-50 shadow-sm'}`}>
                <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 overflow-hidden border transition-colors duration-300 ${isSystemDark ? 'border-ember/30' : 'border-gray-300'}`} style={{ borderRadius: '6px' }}>
                  <img src={item.icon} alt={item.text} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className={`text-xl md:text-2xl font-medium transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-gray-900'}`}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-24 px-6 border-t transition-colors duration-500 ${isSystemDark ? 'bg-charcoal border-ember/10' : 'bg-[#FAF6EB] border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-5xl md:text-7xl text-center text-ember mb-16 uppercase">What Our Fans Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`p-8 border transition-all duration-300 backdrop-blur-xl ${isSystemDark ? 'border-cream/10 bg-charcoal/30 hover:bg-charcoal/50' : 'border-gray-200 bg-white hover:bg-white/50 shadow-sm'}`}>
              <p className={`text-lg italic mb-6 transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-900'}`}>"FLAYM-er Meatbox is the best I've ever had. The spice blend is addictive!"</p>
              <p className="font-bold text-ember uppercase tracking-wider">— Rafid T., Dhaka</p>
            </div>
            <div className={`p-8 border transition-all duration-300 backdrop-blur-xl ${isSystemDark ? 'border-cream/10 bg-charcoal/30 hover:bg-charcoal/50' : 'border-gray-200 bg-white hover:bg-white/50 shadow-sm'}`}>
              <p className={`text-lg italic mb-6 transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-900'}`}>"Shawarma theke shuru kore Meatbox - sob e perfect. Daily order dii!"</p>
              <p className="font-bold text-ember uppercase tracking-wider">— Nusrat J., Chittagong</p>
            </div>
            <div className={`p-8 border transition-all duration-300 backdrop-blur-xl ${isSystemDark ? 'border-cream/10 bg-charcoal/30 hover:bg-charcoal/50' : 'border-gray-200 bg-white hover:bg-white/50 shadow-sm'}`}>
              <p className={`text-lg italic mb-6 transition-colors duration-300 ${isSystemDark ? 'text-cream/80' : 'text-gray-900'}`}>"Fastest delivery, hottest food. FLAYM never disappoints."</p>
              <p className="font-bold text-ember uppercase tracking-wider">— Tanvir H., Sylhet</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
