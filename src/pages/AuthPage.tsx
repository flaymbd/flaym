import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { Shield, Key, Chrome, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth();

  const handleAuthError = (err: any) => {
    console.error(err);
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      setError('Invalid email or password.');
    } else if (err.code === 'auth/email-already-in-use') {
      setError('An account with this email already exists.');
    } else if (err.code === 'auth/weak-password') {
      setError('Password should be at least 6 characters.');
    } else {
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
        setSuccess('Logged in successfully!');
        setTimeout(() => {
          if (email.toLowerCase() === 'flaymbd@gmail.com') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1000);
      } else {
        await signUpWithEmail(email, password, name);
        setSuccess('Account created successfully!');
        setTimeout(() => {
          if (email.toLowerCase() === 'flaymbd@gmail.com') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1000);
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await loginWithGoogle();
      setSuccess('Logged in with Google successfully!');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // Demo Admin Bypass (extremely friendly for instant preview/testing of roles)
  const handleDemoAdmin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      try {
        await loginWithEmail('flaymbd@gmail.com', 'admin123');
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          // Attempt automatic registration for demo admin
          await signUpWithEmail('flaymbd@gmail.com', 'admin123', 'FLAYM Admin');
        } else {
          throw authErr;
        }
      }
      setSuccess('Demo Admin role activated successfully!');
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError('Demo Admin login failed. Standard Firebase email login is likely not initialized yet. Please try Google Sign-In instead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-6">
      <div className="bg-charcoal border border-ember/20 p-8 w-full max-w-md shadow-2xl" style={{ borderRadius: '6px' }}>
        <div className="flex justify-center mb-6">
          <img src="/flaym-logo.jpg" alt="FLAYM Logo" className="h-24 w-auto object-contain rounded-lg shadow-lg border border-ember/10" />
        </div>
        <h1 className="font-display text-4xl text-ember mb-6 uppercase tracking-wider text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>

        {error && (
          <div className="bg-deep-red/10 border border-deep-red text-deep-red text-xs px-4 py-3 mb-6" style={{ borderRadius: '6px' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 text-xs px-4 py-3 mb-6" style={{ borderRadius: '6px' }}>
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-charcoal/50 border border-cream/20 px-4 py-3 text-cream focus:border-ember focus:outline-none transition-colors text-sm" 
                style={{ borderRadius: '6px' }}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-charcoal/50 border border-cream/20 px-4 py-3 text-cream focus:border-ember focus:outline-none transition-colors text-sm" 
              style={{ borderRadius: '6px' }}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-bold text-cream/70 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-charcoal/50 border border-cream/20 px-4 py-3 text-cream focus:border-ember focus:outline-none transition-colors text-sm" 
              style={{ borderRadius: '6px' }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-ember text-charcoal font-bold py-3.5 text-sm hover:bg-ember/90 transition-all uppercase tracking-wider shadow-[0_0_15px_rgba(255,90,31,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ borderRadius: '6px' }}
          >
            {isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-cream/10 w-full absolute"></div>
          <span className="bg-charcoal px-3 text-xs text-cream/40 uppercase tracking-wider z-10">Or Continue With</span>
        </div>

        <div className="space-y-3">
          {/* Google Sign-In */}
          <button 
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full bg-cream/5 hover:bg-cream/10 border border-cream/10 text-cream font-bold py-3 text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            style={{ borderRadius: '6px' }}
          >
            <Chrome size={16} className="text-ember" />
            Sign In with Google
          </button>

          {/* Simulated Demo Admin Bypass */}
          <button 
            type="button"
            disabled={loading}
            onClick={handleDemoAdmin}
            className="w-full bg-ember/10 hover:bg-ember/20 border border-ember/30 text-ember font-bold py-3 text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            style={{ borderRadius: '6px' }}
          >
            <Shield size={16} />
            Instant Admin Bypass
          </button>
        </div>

        <div className="mt-6 text-center border-t border-cream/5 pt-4">
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
            className="text-xs text-cream/50 hover:text-ember transition-colors underline uppercase tracking-wider"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
