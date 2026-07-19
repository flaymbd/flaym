import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Gift, Tag, Check, Copy, ArrowRight, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Promotion {
  id: string;
  badge: string;
  title: string;
  description: string;
  discountCode?: string;
  discountText?: string;
  expiryText?: string;
  ctaText?: string;
  ctaLink?: string;
}

const defaultPromotions: Promotion[] = [
  {
    id: 'mirpur-madness',
    badge: 'Mirpur Special',
    title: 'Mirpur Midweek Madness',
    description: 'Craving the heat? Get 15% OFF on any Combo meal when delivering in Mirpur. Order now and satisfy your soul.',
    discountCode: 'MIRPUR15',
    discountText: '15% OFF ALL COMBOS',
    expiryText: 'Valid Monday - Wednesday',
    ctaText: 'Grab Combo Now',
    ctaLink: '/menu'
  },
  {
    id: 'shawarma-deal',
    badge: 'Limited Offer',
    title: 'Sizzling Shawarma Duo',
    description: 'Double the wraps, double the flavor! Buy any 2 Premium Shawarmas and get a Flaym Special Shawarma absolutely free.',
    discountCode: 'SHAWARMADUO',
    discountText: 'BUY 2 GET 1 FREE',
    expiryText: 'Everyday from 4 PM - 7 PM',
    ctaText: 'Get Wraps',
    ctaLink: '/menu'
  },
  {
    id: 'meatbox-feast',
    badge: 'Mirpur Exclusive',
    title: 'The Ultimate Mirpur Meatbox Feast',
    description: 'Get our loaded Flaym Meatbox + Beef Shawarma + Family Feast combo for just 899৳ instead of 1030৳. Perfect for sharing with the squad!',
    discountText: 'SAVE 130৳ ON FEASTS',
    expiryText: 'Valid for Mirpur residents only',
    ctaText: 'Feast Now',
    ctaLink: '/menu'
  }
];

interface PromotionalBannerProps {
  promotions?: Promotion[];
  className?: string;
}

export default function PromotionalBanner({ promotions = defaultPromotions, className = '' }: PromotionalBannerProps) {
  const [livePromos, setLivePromos] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
    const q = query(
      collection(db, 'promos'),
      where('is_active', '==', true),
      orderBy('sort_order', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setLivePromos([]);
      } else {
        const mapped = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            badge: d.badge || 'Limited Offer',
            title: d.title || d.code,
            description: d.description || '',
            discountCode: d.code,
            discountText: d.discount_type === 'percentage' ? `${d.discount_value}% OFF` : `${d.discount_value}৳ OFF`,
            expiryText: d.expiryText || '',
            ctaText: d.ctaText || 'Grab Offer',
            ctaLink: d.ctaLink || '/menu'
          };
        });
        setLivePromos(mapped);
      }
    }, (error) => {
      console.error("Error listening to live promos in banner: ", error);
    });
    return () => unsubscribe();
  }, []);

  const promoList = livePromos.length > 0 ? livePromos : promotions;

  useEffect(() => {
    if (!isAutoPlaying || promoList.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % promoList.length);
    }, 6000); // Cycle every 6 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, promoList.length]);

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % promoList.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + promoList.length) % promoList.length);
  };

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const activePromo = promoList[currentIndex];

  if (promoList.length === 0) return null;

  return (
    <div 
      id="promotional-banner-container"
      className={`relative w-full overflow-hidden border shadow-[0_4px_20px_rgba(0,0,0,0.05)] py-8 px-6 md:px-12 transition-all duration-500 backdrop-blur-md ${isSystemDark ? 'bg-charcoal border-ember/30' : 'bg-white border-gray-100'} ${className}`}
      style={{ borderRadius: '6px' }}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Sizzling Grid Accents */}
      <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${isSystemDark ? 'opacity-20' : 'opacity-10'}`}>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-ember rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-deep-red rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Animated Slide-out Content */}
        <div className="flex-1 min-w-0 w-full text-left">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePromo.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Badge & Expiry info */}
              <div className="flex flex-wrap items-center gap-3">
                <span 
                  id={`promo-badge-${activePromo.id}`}
                  className="bg-ember/10 text-ember border border-ember/20 text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1"
                  style={{ borderRadius: '4px' }}
                >
                  <Flame size={12} className="inline-block mr-1 -mt-0.5 animate-bounce" />
                  {activePromo.badge}
                </span>
                
                {activePromo.expiryText && (
                  <span className={`text-xs uppercase font-medium tracking-wider flex items-center gap-1 transition-colors duration-300 ${isSystemDark ? 'text-cream/50' : 'text-gray-500'}`}>
                    <Sparkles size={12} className="text-ember" />
                    {activePromo.expiryText}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 
                id={`promo-title-${activePromo.id}`}
                className={`font-display text-4xl md:text-5xl lg:text-6xl tracking-tight uppercase leading-none transition-colors duration-300 ${isSystemDark ? 'text-cream' : 'text-charcoal'}`}
              >
                {activePromo.title}
              </h2>

              {/* Description */}
              <p className={`text-sm md:text-base lg:text-lg leading-relaxed max-w-3xl transition-colors duration-300 ${isSystemDark ? 'text-cream/75' : 'text-gray-600'}`}>
                {activePromo.description}
              </p>

              {/* Promo details (Discount tag / codes) */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {activePromo.discountText && (
                  <div className="flex items-center gap-2 text-ember font-bold uppercase tracking-wide bg-ember/5 border border-ember/10 py-1.5 px-3 rounded">
                    <Tag size={16} />
                    <span className="text-xs md:text-sm font-display tracking-widest">{activePromo.discountText}</span>
                  </div>
                )}

                {activePromo.discountCode && (
                  <div 
                    id={`promo-code-box-${activePromo.id}`}
                    className={`flex items-center border border-dashed transition-all ${isSystemDark ? 'border-ember/40 bg-charcoal hover:border-ember' : 'border-ember/40 bg-white hover:border-ember shadow-sm'}`}
                    style={{ borderRadius: '6px' }}
                  >
                    <span className={`px-3.5 py-1.5 font-mono text-xs md:text-sm font-bold tracking-wider transition-colors ${isSystemDark ? 'text-cream/90 bg-charcoal' : 'text-charcoal bg-white'}`}>
                      {activePromo.discountCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(activePromo.discountCode!, activePromo.id)}
                      className="border-l border-dashed border-ember/30 p-2.5 hover:bg-ember/10 text-ember hover:text-ember transition-all focus:outline-none flex items-center justify-center cursor-pointer"
                      title="Copy promo code"
                      id={`promo-copy-btn-${activePromo.id}`}
                    >
                      {copiedId === activePromo.id ? (
                        <Check size={16} className="text-green-500 animate-scale-up" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Navigation & CTA */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-4 shrink-0 w-full md:w-auto">
          {/* CTA Action button */}
          <Link 
            to={activePromo.ctaLink || '/menu'}
            id={`promo-cta-link-${activePromo.id}`}
            className="bg-ember text-charcoal font-bold py-3.5 px-8 text-sm md:text-base hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,90,31,0.2)] text-center uppercase tracking-wider flex items-center justify-center gap-2 group w-full md:w-fit"
            style={{ borderRadius: '6px' }}
          >
            {activePromo.ctaText || 'Get Offer'}
            <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </Link>

          {/* Carousel controls */}
          <div className="flex items-center justify-center md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0">
            <button
              onClick={handlePrev}
              className={`p-2 border transition-all focus:outline-none cursor-pointer ${isSystemDark ? 'border-cream/10 hover:border-ember text-cream/50 hover:text-ember' : 'border-gray-200 hover:border-ember text-gray-400 hover:text-ember shadow-sm'}`}
              style={{ borderRadius: '4px' }}
              aria-label="Previous Offer"
              id="promo-prev-btn"
            >
              <ChevronLeft size={16} />
            </button>
            
            {/* Indicators */}
            <div className="flex items-center gap-1.5 px-1">
              {promoList.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`h-1.5 transition-all duration-300 focus:outline-none cursor-pointer ${
                    currentIndex === index ? 'w-6 bg-ember' : isSystemDark ? 'w-1.5 bg-cream/20 hover:bg-cream/40' : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                  }`}
                  style={{ borderRadius: '3px' }}
                  aria-label={`Go to slide ${index + 1}`}
                  id={`promo-dot-${index}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className={`p-2 border transition-all focus:outline-none cursor-pointer ${isSystemDark ? 'border-cream/10 hover:border-ember text-cream/50 hover:text-ember' : 'border-gray-200 hover:border-ember text-gray-400 hover:text-ember shadow-sm'}`}
              style={{ borderRadius: '4px' }}
              aria-label="Next Offer"
              id="promo-next-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
