import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Settings, MenuSquare, LogOut, ShieldAlert, Tag } from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminLayout() {
  const location = useLocation();
  const { user, role, loading, logout } = useAuth();

  const links = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/admin/menu', label: 'Menu', icon: MenuSquare },
    { path: '/admin/promos', label: 'Promos', icon: Tag },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-ember border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-display text-lg uppercase tracking-widest text-cream/60 animate-pulse">Checking Credentials...</p>
      </div>
    );
  }

  if (!user || role !== 'admin') {
    return (
      <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={64} className="text-ember mb-6 animate-bounce" />
        <h1 className="font-display text-4xl md:text-5xl text-cream uppercase mb-4 tracking-tight">Access Restricted</h1>
        <p className="text-cream/70 max-w-md mb-8 text-sm leading-relaxed">
          This panel is restricted to authorized FLAYM Administrators only. Please sign in with an admin account to proceed.
        </p>
        <div className="flex gap-4">
          <Link to="/" className="bg-cream/10 hover:bg-cream/20 text-cream font-bold py-3 px-6 uppercase tracking-wider transition-colors text-xs" style={{ borderRadius: '6px' }}>
            Go Home
          </Link>
          <Link to="/auth" className="bg-ember text-charcoal hover:bg-ember/90 font-bold py-3 px-6 uppercase tracking-wider transition-all duration-200 text-xs shadow-[0_0_15px_rgba(255,90,31,0.3)]" style={{ borderRadius: '6px' }}>
            Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-charcoal text-cream font-sans overflow-hidden w-full">
      {/* Mobile Top Header */}
      <header className="md:hidden border-b border-ember/20 bg-charcoal/90 p-4 flex justify-between items-center z-20 shrink-0">
        <Link to="/" className="font-display text-2xl text-ember tracking-widest">
          FLAYM <span className="text-xs text-cream/50 tracking-normal inline-block ml-1">Admin</span>
        </Link>
        <button 
          onClick={() => logout()} 
          className="flex items-center gap-1.5 px-3 py-1.5 border border-cream/10 rounded text-cream/60 hover:text-deep-red text-xs uppercase font-bold tracking-wider cursor-pointer"
        >
          <LogOut size={14} />
          Exit
        </button>
      </header>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden border-b border-ember/10 bg-charcoal/40 p-2 flex justify-around gap-1.5 z-20 shrink-0 overflow-x-auto">
        {links.map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-center transition-all ${
                isActive 
                  ? 'bg-ember text-charcoal font-black border-transparent' 
                  : 'text-cream/60 bg-cream/5 border border-cream/10'
              }`}
              style={{ borderRadius: '6px', minWidth: '70px' }}
            >
              <Icon size={16} />
              <span className="text-[10px] uppercase font-bold tracking-tight">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-ember/20 bg-charcoal/50 flex-col shrink-0">
        <div className="p-6 border-b border-ember/20">
          <Link to="/" className="font-display text-4xl text-ember tracking-widest">FLAYM <span className="text-sm text-cream/50 tracking-normal block">Admin Panel</span></Link>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          {links.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path} className={`flex items-center gap-3 p-3 transition-colors uppercase tracking-wider text-sm font-bold ${isActive ? 'bg-ember text-charcoal' : 'text-cream/70 hover:bg-cream/5 hover:text-cream'}`} style={{ borderRadius: '6px' }}>
                <Icon size={18} />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-ember/20">
          <button onClick={() => logout()} className="w-full flex items-center gap-3 p-3 text-cream/50 hover:text-deep-red transition-colors uppercase tracking-wider text-sm font-bold text-left cursor-pointer">
            <LogOut size={18} />
            Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow overflow-auto p-4 md:p-8 w-full max-w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="w-full min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
