'use client'
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { register, user, logout, loadUser } = useAuth();

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

  const handleGoogleSignUp = () => {
    if (!window.google) {
      setApiError('Google Sign-In not loaded. Please try again.');
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
      setApiError('');

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
        
        // Redirect to home page
        router.push('/');
      } else {
        setApiError(data.error || 'Google sign up failed');
      }
    } catch (error) {
      console.error('Google sign up error:', error);
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error message
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter a password';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter your phone number';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');
    
    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    
    if (result.success) {
      alert('Registration completed successfully!');
      router.push('/login');
    } else {
      setApiError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <style jsx>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #111827 !important;
          background-color: white !important;
        }
        
        input {
          background-color: white !important;
          color: #111827 !important;
        }
        
        input::placeholder {
          color: #9CA3AF !important;
        }
      `}</style>
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
                href="/portfolio" 
                className="mobile-menu-item block px-3 py-2 rounded-md text-base font-medium hover:text-indigo-600"
                style={{
                  fontWeight: pathname.startsWith('/portfolio') ? 'bold' : 'normal',
                  color: pathname.startsWith('/portfolio') ? '#4f46e5' : '#374151',
                  textDecoration: 'none'
                }}
              >
                Portfolio
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
      
      {/* Register Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <span className="text-2xl">🎨</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            NavaAI Studio
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create a new account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {apiError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {apiError}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                style={{ backgroundColor: 'white', color: '#111827' }}
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                style={{ backgroundColor: 'white', color: '#111827' }}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Company/Organization
              </label>
              <input
                id="company"
                name="company"
                type="text"
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                style={{ backgroundColor: 'white', color: '#111827' }}
                placeholder="Enter company name (optional)"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                style={{ backgroundColor: 'white', color: '#111827' }}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                style={{ backgroundColor: 'white', color: '#111827' }}
                placeholder="Enter password (minimum 8 characters)"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                style={{ backgroundColor: 'white', color: '#111827' }}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I agree to the <span>Terms of Service</span> and <span>Privacy Policy</span>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign In
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
                onClick={handleGoogleSignUp}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="mr-2">🔑</span>
                Sign up with Google
              </button>
            </div>
          </div>
        </form>
      </div>
      </div>
      </div>
    </>
  );
}