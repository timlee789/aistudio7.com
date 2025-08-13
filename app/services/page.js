'use client'
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Services() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [processing, setProcessing] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);



  const handlePayment = async (serviceType, serviceName, amount, serviceDetails = {}) => {
    
    // If still loading, wait
    if (loading) {
      alert('Loading user data, please wait a moment and try again.');
      return;
    }
    
    // If no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }
    setProcessing(serviceName);
    
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 중요: 쿠키 포함
        body: JSON.stringify({
          serviceType,
          serviceName,
          amount,
          serviceDetails
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to payment session
        try {
          window.open(data.url, '_self');
        } catch (error) {
          window.location.href = data.url;
        }
      } else {
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          router.push('/login');
        } else {
          alert(`Payment error: ${data.error || 'Failed to create payment session. Please try again.'}`);
        }
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setProcessing(null);
    }
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

          main {
            padding: 1rem !important;
          }

          .service-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }

          .pricing-title {
            font-size: 2rem !important;
            margin-bottom: 1rem !important;
          }

          .pricing-subtitle {
            font-size: 1rem !important;
            padding: 0 1rem !important;
          }

          .service-card {
            padding: 1.5rem !important;
          }

          .service-card h3 {
            font-size: 1.5rem !important;
          }

          .price-text {
            font-size: 2.5rem !important;
          }

          .other-services-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }

          .other-service-card {
            padding: 1.25rem !important;
          }

          .other-service-title {
            font-size: 1.125rem !important;
          }

          .other-service-price {
            font-size: 1.5rem !important;
          }
        }

        @media (max-width: 480px) {
          .nav-logo h1 {
            font-size: 1rem !important;
          }

          main {
            padding: 0.5rem !important;
          }

          .pricing-title {
            font-size: 1.75rem !important;
          }

          .service-card {
            padding: 1.25rem !important;
          }

          .service-card h3 {
            font-size: 1.25rem !important;
          }

          .price-text {
            font-size: 2rem !important;
          }

          .service-button {
            padding: 1rem !important;
            font-size: 1rem !important;
          }
        }
      `}</style>

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
                href="/client-portal" 
                className="hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  fontWeight: pathname === '/client-portal' ? 'bold' : 'normal',
                  color: pathname === '/client-portal' ? '#4f46e5' : '#374151'
                }}
              >
                My Portal
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
                SNS Settings
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
                <a href="/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </a>
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
            <a 
              href="/login"
              className={`mobile-menu-item ${pathname === '/login' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </a>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">


        {/* Pricing Plans */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="pricing-title text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Service Plans</h2>
            <p className="pricing-subtitle text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan to accelerate your business growth with AI-powered content creation
            </p>
          </div>
          
          <div className="service-grid grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            
            {/* Starter Plan */}
            <div className="service-card bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-1">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Starter Plan</h3>
                <div className="mb-6">
                  <span className="price-text text-5xl font-bold text-indigo-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$99</span>
                  <span className="text-lg text-gray-500 ml-2">/month</span>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium inline-block">
                  Perfect for Small Businesses
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-indigo-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">8 SNS Image Contents</span>
                    <p className="text-gray-500 text-sm mt-1">AI design + basic editing per month</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-indigo-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">SNS Upload Service</span>
                    <p className="text-gray-500 text-sm mt-1">Facebook, Instagram management</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-indigo-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">Caption & Hashtag Creation</span>
                    <p className="text-gray-500 text-sm mt-1">Basic optimization included</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-indigo-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">Weekly Performance Reports</span>
                    <p className="text-gray-500 text-sm mt-1">Automated delivery & insights</p>
                  </div>
                </li>
              </ul>
              
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePayment('PLAN', 'Starter Plan', 99, {
                    description: 'Perfect for Small Businesses',
                    features: ['8 SNS Image Contents', 'SNS Upload Service', 'Caption & Hashtag Creation', 'Weekly Performance Reports']
                  });
                }}
                disabled={processing === 'Starter Plan'}
                className="service-button w-full bg-indigo-600 text-white py-4 px-6 rounded-xl hover:bg-indigo-700 transition-colors font-bold text-lg shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing === 'Starter Plan' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Get Started'
                )}
              </button>
            </div>

            {/* Growth Plan */}
            <div className="service-card bg-white rounded-2xl shadow-xl border-2 border-purple-200 p-8 relative hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-1 transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-8 mt-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Growth Plan</h3>
                <div className="mb-6">
                  <span className="price-text text-5xl font-bold text-purple-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$149</span>
                  <span className="text-lg text-gray-500 ml-2">/month</span>
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium inline-block">
                  Best for Growing Companies
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-purple-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">12 SNS Image Contents</span>
                    <p className="text-gray-500 text-sm mt-1">Premium AI design per month</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-purple-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">SNS + Ad Campaign Setup</span>
                    <p className="text-gray-500 text-sm mt-1">Paid advertising optimization (ad spend separate)</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-purple-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">Advanced Caption Strategy</span>
                    <p className="text-gray-500 text-sm mt-1">Optimized hashtags & engagement tactics</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-purple-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">Weekly Performance Reports</span>
                    <p className="text-gray-500 text-sm mt-1">Detailed analytics & recommendations</p>
                  </div>
                </li>
              </ul>
              
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePayment('PLAN', 'Growth Plan', 149, {
                    description: 'Best for Growing Companies',
                    features: ['12 SNS Image Contents', 'SNS + Ad Campaign Setup', 'Advanced Caption Strategy', 'Weekly Performance Reports']
                  });
                }}
                disabled={processing === 'Growth Plan'}
                className="service-button w-full bg-purple-600 text-white py-4 px-6 rounded-xl hover:bg-purple-700 transition-colors font-bold text-lg shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing === 'Growth Plan' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Get Started'
                )}
              </button>
            </div>

            {/* Pro Marketing Plan */}
            <div className="service-card bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-1">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Pro Marketing Plan</h3>
                <div className="mb-6">
                  <span className="price-text text-5xl font-bold text-orange-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$199</span>
                  <span className="text-lg text-gray-500 ml-2">/month</span>
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-medium inline-block">
                  Enterprise Solutions
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-orange-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">16 SNS Image Contents</span>
                    <p className="text-gray-500 text-sm mt-1">Premium AI design & editing per month</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-orange-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">Full Campaign Management</span>
                    <p className="text-gray-500 text-sm mt-1">SNS upload + ad campaign optimization (ad spend separate)</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-orange-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">AI Avatar/Narration Videos</span>
                    <p className="text-gray-500 text-sm mt-1">2 premium AI videos per month included</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-orange-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-900 font-semibold text-base">Advanced Analytics</span>
                    <p className="text-gray-500 text-sm mt-1">Weekly reports with strategic insights</p>
                  </div>
                </li>
              </ul>
              
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePayment('PLAN', 'Pro Marketing Plan', 199, {
                    description: 'Enterprise Solutions',
                    features: ['16 SNS Image Contents', 'Full Campaign Management', 'AI Avatar/Narration Videos', 'Advanced Analytics']
                  });
                }}
                disabled={processing === 'Pro Marketing Plan'}
                className="service-button w-full bg-orange-600 text-white py-4 px-6 rounded-xl hover:bg-orange-700 transition-colors font-bold text-lg shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing === 'Pro Marketing Plan' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Get Started'
                )}
              </button>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <div className="bg-gray-50 rounded-2xl p-6 max-w-4xl mx-auto">
              <p className="text-gray-700 text-base font-medium mb-2">
                📞 Need a custom solution? Contact us for enterprise packages
              </p>
              <p className="text-gray-500 text-sm">
                All plans are monthly contracts and can be changed or cancelled at any time. No setup fees.
              </p>
            </div>
          </div>
        </div>

        {/* Other Services */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="pricing-title text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Other Services</h2>
            <p className="pricing-subtitle text-lg text-gray-600 max-w-2xl mx-auto">
              Additional professional services to complement your content strategy
            </p>
          </div>
          
          <div className="other-services-grid grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            
            {/* Menu, Flyer, Poster Design */}
            <div className="other-service-card bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="other-service-title text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Menu・Flyer・Poster Design
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Promotional image creation with high-resolution files for printing
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="other-service-price text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$99</span>
                    <span className="text-gray-500 text-sm ml-1">/piece</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePayment('OTHER_SERVICE', 'Menu・Flyer・Poster Design', 99, {
                        description: 'Promotional image creation with high-resolution files for printing',
                        unit: 'per piece'
                      });
                    }}
                    disabled={processing === 'Menu・Flyer・Poster Design'}
                    className="bg-indigo-600 text-white py-3 px-5 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processing === 'Menu・Flyer・Poster Design' ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Processing...
                      </div>
                    ) : (
                      'Order Now'
                    )}
                  </button>
                </div>
              </div>
            </div>


            {/* Product/Service Photography */}
            <div className="other-service-card bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="other-service-title text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Product/Service Photography
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  On-site photo & video shoot (Buford, Georgia area, editing included)
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="other-service-price text-2xl font-bold text-green-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$199</span>
                    <span className="text-gray-500 text-sm ml-1">/session</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePayment('OTHER_SERVICE', 'Product/Service Photography', 199, {
                        description: 'On-site photo & video shoot (Buford, Georgia area, editing included)',
                        unit: 'per session'
                      });
                    }}
                    disabled={processing === 'Product/Service Photography'}
                    className="bg-green-600 text-white py-3 px-5 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processing === 'Product/Service Photography' ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Processing...
                      </div>
                    ) : (
                      'Order Now'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* SNS Account Setup */}
            <div className="other-service-card bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="other-service-title text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  SNS Account Initial Setup
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Profile design, basic bio writing, initial hashtag setup
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="other-service-price text-2xl font-bold text-blue-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$59</span>
                    <span className="text-gray-500 text-sm ml-1">/account</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePayment('OTHER_SERVICE', 'SNS Account Initial Setup', 59, {
                        description: 'Profile design, basic bio writing, initial hashtag setup',
                        unit: 'per account'
                      });
                    }}
                    disabled={processing === 'SNS Account Initial Setup'}
                    className="bg-blue-600 text-white py-3 px-5 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processing === 'SNS Account Initial Setup' ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Processing...
                      </div>
                    ) : (
                      'Order Now'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Story & Reels Production */}
            <div className="other-service-card bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="other-service-title text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Story・Reels Focused Production
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Instagram/Facebook Story or Reels dedicated short video creation
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="other-service-price text-2xl font-bold text-pink-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$49</span>
                    <span className="text-gray-500 text-sm ml-1">/video</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePayment('OTHER_SERVICE', 'Story・Reels Focused Production', 49, {
                        description: 'Instagram/Facebook Story or Reels dedicated short video creation',
                        unit: 'per video'
                      });
                    }}
                    disabled={processing === 'Story・Reels Focused Production'}
                    className="bg-pink-600 text-white py-3 px-5 rounded-lg hover:bg-pink-700 transition-colors font-semibold text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processing === 'Story・Reels Focused Production' ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Processing...
                      </div>
                    ) : (
                      'Order Now'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Website Landing Page */}
            <div className="other-service-card bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="other-service-title text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Website Landing Page Creation
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  WordPress-based advertising landing page with lead form integration
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="other-service-price text-2xl font-bold text-teal-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$249</span>
                    <span className="text-gray-500 text-sm ml-1">(one-time)</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePayment('OTHER_SERVICE', 'Website Landing Page Creation', 249, {
                        description: 'WordPress-based advertising landing page with lead form integration',
                        unit: 'one-time'
                      });
                    }}
                    disabled={processing === 'Website Landing Page Creation'}
                    className="bg-teal-600 text-white py-3 px-5 rounded-lg hover:bg-teal-700 transition-colors font-semibold text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processing === 'Website Landing Page Creation' ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Processing...
                      </div>
                    ) : (
                      'Order Now'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Event Promotion Package */}
            <div className="other-service-card bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="other-service-title text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Event Promotion Package
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Event poster + 3 SNS images + 15-second video creation bundle
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="other-service-price text-2xl font-bold text-red-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$199</span>
                    <span className="text-gray-500 text-sm ml-1">/package</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePayment('OTHER_SERVICE', 'Event Promotion Package', 199, {
                        description: 'Event poster + 3 SNS images + 15-second video creation bundle',
                        unit: 'per package'
                      });
                    }}
                    disabled={processing === 'Event Promotion Package'}
                    className="bg-red-600 text-white py-3 px-5 rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processing === 'Event Promotion Package' ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Processing...
                      </div>
                    ) : (
                      'Order Now'
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
          
          <div className="text-center mt-12">
            <div className="bg-gray-50 rounded-2xl p-6 max-w-4xl mx-auto">
              <p className="text-gray-700 text-base font-medium mb-2">
                💼 Mix and match services to create your perfect marketing solution
              </p>
              <p className="text-gray-500 text-sm">
                All services can be combined with monthly plans for additional discounts. Contact us for custom packages.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}