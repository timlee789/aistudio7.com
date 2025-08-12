'use client'
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Password reset instructions have been sent to your email.');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Network error. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#f4d03f' }}>
      {/* Navigation Bar */}
      <nav className="shadow-lg" style={{ background: '#f4d03f' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" style={{ textDecoration: 'none' }}>
                <h1 className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Myriad Pro, Arial, sans-serif', cursor: 'pointer' }}>AiStudio7.com</h1>
              </a>
            </div>
            
            {/* Mobile menu button */}
            <div className="mobile-menu-toggle flex lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="mobile-hamburger text-gray-700 hover:text-indigo-600"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
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
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu lg:hidden" style={{ background: '#f4d03f', borderTop: '1px solid #e5e7eb' }}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a 
                href="/" 
                className="mobile-menu-item block px-3 py-2 rounded-md text-base font-medium hover:text-indigo-600"
                style={{
                  fontWeight: pathname === '/' ? 'bold' : 'normal',
                  color: pathname === '/' ? '#4f46e5' : '#374151',
                  textDecoration: 'none'
                }}
              >
                Home
              </a>
              <a 
                href="/service-request" 
                className="mobile-menu-item block px-3 py-2 rounded-md text-base font-medium hover:text-indigo-600"
                style={{
                  fontWeight: pathname === '/service-request' ? 'bold' : 'normal',
                  color: pathname === '/service-request' ? '#4f46e5' : '#374151',
                  textDecoration: 'none'
                }}
              >
                Service Request
              </a>
              <a 
                href="/sns-settings" 
                className="mobile-menu-item block px-3 py-2 rounded-md text-base font-medium hover:text-indigo-600"
                style={{
                  fontWeight: pathname === '/sns-settings' ? 'bold' : 'normal',
                  color: pathname === '/sns-settings' ? '#4f46e5' : '#374151',
                  textDecoration: 'none'
                }}
              >
                Social Media Settings
              </a>
              {user && user.role === 'ADMIN' && (
                <a 
                  href="/admin" 
                  className="mobile-menu-item block px-3 py-2 rounded-md text-base font-medium hover:text-indigo-600"
                  style={{
                    fontWeight: pathname === '/admin' ? 'bold' : 'normal',
                    color: pathname === '/admin' ? '#4f46e5' : '#374151',
                    textDecoration: 'none'
                  }}
                >
                  Admin
                </a>
              )}
              {user ? (
                <button 
                  onClick={logout}
                  className="mobile-menu-item w-full text-left block px-3 py-2 rounded-md text-base font-medium bg-red-500 hover:bg-red-700 text-white mt-2"
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  Logout
                </button>
              ) : (
                <>
                  <a 
                    href="/login" 
                    className="mobile-menu-item block px-3 py-2 rounded-md text-base font-medium hover:text-indigo-600"
                    style={{
                      fontWeight: pathname === '/login' ? 'bold' : 'normal',
                      color: pathname === '/login' ? '#4f46e5' : '#374151',
                      textDecoration: 'none'
                    }}
                  >
                    Login
                  </a>
                  <a 
                    href="/register" 
                    className="mobile-menu-item block px-3 py-2 rounded-md text-base font-medium hover:text-indigo-600"
                    style={{
                      fontWeight: pathname === '/register' ? 'bold' : 'normal',
                      color: pathname === '/register' ? '#4f46e5' : '#374151',
                      textDecoration: 'none'
                    }}
                  >
                    Register
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {/* Forgot Password Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
              <span className="text-2xl">🔑</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
                {message}
              </div>
            )}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send reset link'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}