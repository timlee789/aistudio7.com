'use client'
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { login, user, logout, loadUser } = useAuth();

  useEffect(() => {
    // Load Google Sign-In script
    const loadGoogleScript = () => {
      if (window.google) return;
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  const handleGoogleSignIn = () => {
    if (!window.google) {
      setError('Google Sign-In not loaded. Please try again.');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });

    window.google.accounts.id.prompt();
  };

  const handleGoogleResponse = async (response) => {
    try {
      setIsLoading(true);
      setError('');

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: response.credential,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh user context
        await loadUser();
        
        // Redirect based on user role
        if (data.user?.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'Google sign in failed');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    console.log('🔐 Login page: Starting login process');
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      console.log('✅ Login page: Login successful, user:', result.user);
      console.log('🔄 Login page: Redirecting to services page...');
      
      // Force reload user data and redirect
      await loadUser();
      
      // Redirect to services page
      if (result.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/portfolio');
      }
    } else {
      console.log('❌ Login page: Login failed:', result.error);
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#f4d03f' }}>
      <style jsx>{`
        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          color: #374151;
        }

        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 40;
          display: none;
        }

        .mobile-menu-overlay.open {
          display: block;
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          right: -100%;
          width: 280px;
          height: 100vh;
          background: #f4d03f;
          z-index: 50;
          transition: right 0.3s ease-in-out;
          padding: 1rem;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
        }

        .mobile-menu.open {
          right: 0;
        }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .mobile-menu-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #374151;
          cursor: pointer;
          padding: 0.5rem;
        }

        .mobile-menu-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mobile-menu-item {
          color: #374151;
          text-decoration: none;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }

        .mobile-menu-item:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .mobile-menu-item.active {
          background-color: rgba(79, 70, 229, 0.1);
          color: #4f46e5;
          font-weight: bold;
        }

        .mobile-logout-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          margin-top: 1rem;
          width: 100%;
        }

        .mobile-logout-button:hover {
          background: #dc2626;
        }

        @media (max-width: 1024px) {
          .desktop-menu {
            display: none;
          }

          .mobile-menu-button {
            display: block;
          }

          .nav-logo h1 {
            font-size: 1.25rem !important;
          }
        }

        @media (max-width: 768px) {
          .nav-logo h1 {
            font-size: 1.125rem !important;
          }

          .login-form-container {
            padding: 1rem !important;
          }

          .login-form-card {
            max-width: 100% !important;
            margin: 0 1rem !important;
          }

          .login-title {
            font-size: 2rem !important;
          }

          .login-input {
            padding: 1rem !important;
            font-size: 1rem !important;
          }

          .login-button {
            padding: 1rem !important;
            font-size: 1rem !important;
          }

          .google-signin-button {
            padding: 1rem !important;
            font-size: 1rem !important;
          }
        }

        @media (max-width: 480px) {
          .nav-logo h1 {
            font-size: 1rem !important;
          }

          .login-form-container {
            padding: 0.5rem !important;
          }

          .login-title {
            font-size: 1.75rem !important;
          }

          .login-subtitle {
            font-size: 0.875rem !important;
          }

          .login-input {
            padding: 0.875rem !important;
          }

          .login-button {
            padding: 0.875rem !important;
          }
        }
      `}</style>

      {/* Navigation Bar */}
      <nav className="shadow-lg" style={{ background: '#f4d03f' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center nav-logo">
              <a href="/" style={{ textDecoration: 'none' }}>
                <h1 className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Myriad Pro, Arial, sans-serif', cursor: 'pointer' }}>AiStudio7.com</h1>
              </a>
            </div>
            
            {/* Desktop Menu */}
            <div className="desktop-menu flex items-center space-x-4">
              <a 
                href="/" 
                className="hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  fontWeight: pathname === '/' ? 'bold' : 'normal',
                  color: pathname === '/' ? '#4f46e5' : '#374151'
                }}
              >
                Home
              </a>
              <a 
                href="/services" 
                className="hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  fontWeight: pathname === '/services' ? 'bold' : 'normal',
                  color: pathname === '/services' ? '#4f46e5' : '#374151'
                }}
              >
                Services
              </a>
              <a 
                href="/portfolio" 
                className="hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  fontWeight: pathname.startsWith('/portfolio') ? 'bold' : 'normal',
                  color: pathname.startsWith('/portfolio') ? '#4f46e5' : '#374151'
                }}
              >
                Portfolio
              </a>
              <a 
                href="/service-request" 
                className="hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  fontWeight: pathname === '/service-request' ? 'bold' : 'normal',
                  color: pathname === '/service-request' ? '#4f46e5' : '#374151'
                }}
              >
                Service Request
              </a>
              <a 
                href="/sns-settings" 
                className="hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  fontWeight: pathname === '/sns-settings' ? 'bold' : 'normal',
                  color: pathname === '/sns-settings' ? '#4f46e5' : '#374151'
                }}
              >
                Social Media Settings
              </a>
              {user && user.role === 'ADMIN' && (
                <a 
                  href="/admin" 
                  className="hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  style={{
                    fontWeight: pathname === '/admin' ? 'bold' : 'normal',
                    color: pathname === '/admin' ? '#4f46e5' : '#374151'
                  }}
                >
                  Admin
                </a>
              )}
              {user ? (
                <button 
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  Logout
                </button>
              ) : (
                <>
                  <a 
                    href="/login" 
                    className="hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                    style={{
                      fontWeight: pathname === '/login' ? 'bold' : 'normal',
                      color: pathname === '/login' ? '#4f46e5' : '#374151'
                    }}
                  >
                    Login
                  </a>
                  <a 
                    href="/register" 
                    className="hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                    style={{
                      fontWeight: pathname === '/register' ? 'bold' : 'normal',
                      color: pathname === '/register' ? '#4f46e5' : '#374151'
                    }}
                  >
                    Register
                  </a>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>Menu</span>
          <button 
            className="mobile-menu-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        
        <div className="mobile-menu-items">
          <a 
            href="/" 
            className={`mobile-menu-item ${pathname === '/' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </a>
          <a 
            href="/services"
            className={`mobile-menu-item ${pathname === '/services' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Services
          </a>
          <a 
            href="/portfolio"
            className={`mobile-menu-item ${pathname.startsWith('/portfolio') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Portfolio
          </a>
          <a 
            href="/client-portal"
            className={`mobile-menu-item ${pathname === '/client-portal' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            My Portal
          </a>
          <a 
            href="/service-request"
            className={`mobile-menu-item ${pathname === '/service-request' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Service Request
          </a>
          <a 
            href="/sns-settings"
            className={`mobile-menu-item ${pathname === '/sns-settings' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            SNS Settings
          </a>
          {user && user.role === 'ADMIN' && (
            <a 
              href="/admin"
              className={`mobile-menu-item ${pathname === '/admin' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </a>
          )}
          {user ? (
            <button 
              className="mobile-logout-button"
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
            >
              Logout
            </button>
          ) : (
            <>
              <a 
                href="/login"
                className={`mobile-menu-item ${pathname === '/login' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </a>
              <a 
                href="/register"
                className={`mobile-menu-item ${pathname === '/register' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </a>
            </>
          )}
        </div>
      </div>
      
      {/* Login Form */}
      <div className="login-form-container flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="login-form-card max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <span className="text-2xl">🎨</span>
          </div>
          <h2 className="login-title mt-6 text-center text-3xl font-extrabold text-gray-900">
            NavaAI Studio
          </h2>
          <p className="login-subtitle mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="login-input appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="login-input appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="login-button group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="google-signin-button w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="mr-2">🔑</span>
                Sign in with Google
              </button>
            </div>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}