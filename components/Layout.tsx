import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Scale, Menu, X, User as UserIcon, LogOut, Shield, Moon, Sun } from 'lucide-react';
import { AuthModal } from './AuthModal';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  // Auth Modal State (Global)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const profileRef = useRef<HTMLDivElement>(null);

  // Handle Global Auth Params (?login=true)
  useEffect(() => {
    const loginParam = searchParams.get('login');
    const signupParam = searchParams.get('signup');

    if (loginParam === 'true' || signupParam === 'true') {
      if (!isAuthenticated) {
        setAuthModalMode(signupParam === 'true' ? 'signup' : 'login');
        setShowAuthModal(true);
      } else {
        // If already authenticated, redirect to dashboard if on landing
        if (location.pathname === '/') {
            navigate('/dashboard');
        }
      }
      // Clean URL without refresh
      setSearchParams(params => {
        params.delete('login');
        params.delete('signup');
        return params;
      });
    }
  }, [searchParams, isAuthenticated, location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Check initial theme
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }

    // Click outside handler for profile dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    
    await logout();
    
    // Hard refresh to ensure all states (including Supabase singleton) are completely reset.
    // Use replace to avoid back button taking user to a logged-in state page.
    window.location.replace('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd] dark:bg-[#020617] text-[#1a1c21] dark:text-[#f8fafc] transition-colors duration-300">
      
      {/* GLOBAL AUTH MODAL */}
      {showAuthModal && (
        <AuthModal 
          initialView={authModalMode}
          onClose={() => setShowAuthModal(false)} 
        />
      )}

      {/* Navbar - Hidden when Printing */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 print:hidden ${scrolled ? 'bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
              <div className="p-1.5 rounded-lg bg-blue-600 mr-3 shadow-sm group-hover:shadow-md transition-all">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white block leading-none">Clause IQ</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Business Decision Engine</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {!isAuthenticated ? (
                <>
                  <Link to="/pricing" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">Pricing</Link>
                  <button 
                    onClick={() => { setAuthModalMode('login'); setShowAuthModal(true); }}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                  >
                    Log in
                  </button>
                  <button 
                    onClick={() => { setAuthModalMode('signup'); setShowAuthModal(true); }}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors hidden lg:block"
                  >
                    Sign Up
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard')} 
                    className="gradient-bg text-white px-6 py-2.5 rounded-full font-semibold transition-all hover:shadow-lg hover:opacity-90 active:scale-95"
                  >
                    Analyze Contract
                  </button>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">Dashboard</Link>
                  <div className="relative" ref={profileRef}>
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-3 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-none bg-slate-100/50 dark:bg-slate-800/50 pl-2 pr-4 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center overflow-hidden">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <span className="font-semibold text-sm">{user?.name}</span>
                    </button>
                    
                    {/* Dropdown Menu - Click Based */}
                    {isProfileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 pt-2 z-50 animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                          <div className="p-2">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Account Credits</p>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{user?.analysesUsed} / {user?.plan === 'Free' ? 3 : '∞'} used</p>
                            </div>
                            <button 
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors flex items-center font-semibold"
                            >
                              <LogOut className="h-4 w-4 mr-3" />
                              Sign out
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
               <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 dark:text-slate-300 p-2">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-6 space-y-4 animate-reveal shadow-xl">
             {!isAuthenticated ? (
                <>
                   <Link to="/pricing" onClick={() => setIsMenuOpen(false)} className="block w-full text-left font-semibold text-slate-700 dark:text-slate-200 py-2">Pricing</Link>
                   <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="block w-full text-left font-semibold text-slate-700 dark:text-slate-200 py-2">Contact</Link>
                   <button onClick={() => {setAuthModalMode('login'); setShowAuthModal(true); setIsMenuOpen(false)}} className="block w-full text-left font-semibold text-slate-700 dark:text-slate-200 py-2">Log in</button>
                   <button onClick={() => {setAuthModalMode('signup'); setShowAuthModal(true); setIsMenuOpen(false)}} className="block w-full text-left font-semibold text-slate-700 dark:text-slate-200 py-2">Sign Up</button>
                   <button onClick={() => {navigate('/dashboard'); setIsMenuOpen(false)}} className="block w-full gradient-bg text-white px-4 py-3 rounded-xl text-center font-bold">Get Started</button>
                </>
             ) : (
                <>
                  <Link to="/dashboard" className="block font-semibold text-slate-700 dark:text-slate-200 py-2" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                           {user?.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                           ) : (
                              <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                           )}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-slate-500">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-red-600 dark:text-red-400 font-bold block w-full text-left py-2">Sign out</button>
                  </div>
                </>
             )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-24">
        {children}
      </main>

      {/* Footer - Hidden when Printing */}
      <footer className="bg-white dark:bg-[#020617] border-t border-slate-100 dark:border-slate-800 py-16 transition-colors duration-300 print:hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center mb-4">
                <Scale className="h-6 w-6 text-slate-400 mr-3" />
                <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Clause IQ</span>
              </div>
              <p className="text-slate-400 text-sm max-w-xs font-medium">
                The business decision engine for contracts. Translating legal complexity into financial clarity.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-12 gap-y-6 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <Link to="/pricing" className="hover:text-blue-600 dark:hover:text-blue-400">Pricing</Link>
              <Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">Contact</Link>
              <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">Terms of Service</Link>
              <Link to="/refund-policy" className="hover:text-blue-600 dark:hover:text-blue-400">Refund Policy</Link>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-slate-50 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest gap-4">
            <div className="flex items-center">
              <Shield className="h-3 w-3 mr-2 text-slate-300 dark:text-slate-600" />
              <span>Private & Secure</span>
            </div>
            <span>© {new Date().getFullYear()} Clause IQ • Not Legal Advice</span>
          </div>
        </div>
      </footer>
    </div>
  );
};