'use client'
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Load Stripe.js
const loadStripe = async () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';
  
  if (typeof window !== 'undefined' && !window.Stripe) {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    document.head.appendChild(script);
    
    return new Promise((resolve) => {
      script.onload = () => {
        const stripe = window.Stripe(publishableKey);
        resolve(stripe);
      };
    });
  } else if (window.Stripe) {
    return window.Stripe(publishableKey);
  }
  return null;
};

export default function Services() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);

  const handlePayment = async (serviceType, serviceName, amount, serviceDetails = {}) => {
    if (loading) {
      alert('Loading user data, please wait a moment and try again.');
      return;
    }
    
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
        credentials: 'include',
        body: JSON.stringify({
          serviceType,
          serviceName,
          amount,
          serviceDetails,
          embedded: false
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentUrl(data.url);
        setCurrentPlan({ serviceType, serviceName, amount });
        setShowPaymentModal(true);
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
    <div style={{ 
      background: '#f4d03f', 
      minHeight: '100vh', 
      fontFamily: 'Arial, sans-serif',
      overflowX: 'hidden',
      margin: 0,
      padding: 0,
      paddingTop: 0
    }}>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .enter-tool {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          z-index: 1000;
          cursor: pointer;
        }

        .page-title {
          text-align: center;
          padding: 60px 20px;
          margin-top: 0px;
        }

        .page-title h1 {
          font-size: 3rem;
          font-weight: bold;
          color: #333;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
          margin: 0 0 10px 0;
          letter-spacing: 2px;
        }

        .subtitle {
          font-size: 1.2rem;
          color: #666;
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.6;
          font-weight: 400;
        }

        .section-title {
          text-align: center;
          margin: 0 0 40px 0;
        }

        .section-title h2 {
          font-size: 2.5rem;
          font-weight: bold;
          color: #333;
          margin: 0;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .page-title {
            padding: 40px 20px;
          }
          
          .page-title h1 {
            font-size: 2.5rem;
          }
          
          .subtitle {
            font-size: 1rem;
            padding: 0 10px;
          }
          
          .section-title h2 {
            font-size: 2rem;
            margin-bottom: 20px;
          }
          
          .nav-content {
            height: 3.5rem;
          }
          
          .logo-section h1 {
            font-size: 1.25rem !important;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            padding: 30px 15px;
          }
          
          .page-title h1 {
            font-size: 2rem;
          }
          
          .subtitle {
            font-size: 0.9rem;
            line-height: 1.4;
            padding: 0 5px;
          }
          
          .section-title h2 {
            font-size: 1.75rem;
            margin-bottom: 15px;
          }
          
          .nav-content {
            height: 3rem;
          }
          
          .logo-section h1 {
            font-size: 1.125rem !important;
          }
        }

        nav a {
          color: #374151;
          transition: color 0.3s ease;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
        }

        nav a:hover {
          color: #4f46e5;
        }

        nav {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        nav .nav-container {
          max-width: 80rem;
          margin: 0 auto;
          padding: 0 1rem;
        }

        @media (min-width: 640px) {
          nav .nav-container {
            padding: 0 1.5rem;
          }
        }

        @media (min-width: 1024px) {
          nav .nav-container {
            padding: 0 2rem;
          }
        }

        .nav-content {
          display: flex;
          justify-content: space-between;
          height: 4rem;
        }

        .logo-section {
          display: flex;
          align-items: center;
        }

        .menu-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

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

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .menu-section {
            display: none;
          }

          .mobile-menu-button {
            display: block;
          }
        }
      `}</style>

      <nav style={{ background: '#f4d03f' }}>
        <div className="nav-container">
          <div className="nav-content">
            <div className="logo-section">
              <a href="/" style={{ textDecoration: 'none' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5', margin: 0, fontFamily: 'Myriad Pro, Arial, sans-serif', cursor: 'pointer' }}>AiStudio7.com</h1>
              </a>
            </div>
            
            {/* Desktop Menu */}
            <div className="menu-section">
              <a 
                href="/" 
                style={{
                  fontWeight: pathname === '/' ? 'bold' : 'normal',
                  color: pathname === '/' ? '#4f46e5' : '#374151'
                }}
              >
                Home
              </a>
              <a 
                href="/services"
                style={{
                  fontWeight: pathname === '/services' ? 'bold' : 'normal',
                  color: pathname === '/services' ? '#4f46e5' : '#374151'
                }}
              >
                Services
              </a>
              <a 
                href="/portfolio"
                style={{
                  fontWeight: pathname.startsWith('/portfolio') ? 'bold' : 'normal',
                  color: pathname.startsWith('/portfolio') ? '#4f46e5' : '#374151'
                }}
              >
                Portfolio
              </a>
              <a 
                href="/client-portal"
                style={{
                  fontWeight: pathname === '/client-portal' ? 'bold' : 'normal',
                  color: pathname === '/client-portal' ? '#4f46e5' : '#374151'
                }}
              >
                My Portal
              </a>
              <a 
                href="/service-request"
                style={{
                  fontWeight: pathname === '/service-request' ? 'bold' : 'normal',
                  color: pathname === '/service-request' ? '#4f46e5' : '#374151'
                }}
              >
                Service Request
              </a>
              <a 
                href="/sns-settings"
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
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#dc2626'}
                  onMouseOut={(e) => e.target.style.background = '#ef4444'}
                >
                  Logout
                </button>
              ) : (
                <a href="/login">Login</a>
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
      
      {/* Services Section */}
      <div style={{ maxWidth: '1200px', margin: '80px auto 0 auto', padding: '0 40px' }}>
        
        {/* Pricing Plans */}
        <div style={{ marginBottom: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', marginBottom: '16px', fontFamily: 'Inter, system-ui, sans-serif' }}>Service Plans</h2>
            <p style={{ fontSize: '1.125rem', color: '#666', maxWidth: '640px', margin: '0 auto' }}>
              Choose the perfect plan to accelerate your business growth with AI-powered content creation
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            
            {/* Starter Plan */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '32px', transition: 'all 0.3s ease', cursor: 'pointer' }}
                 onMouseEnter={(e) => {
                   e.target.style.transform = 'translateY(-4px)';
                   e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.transform = 'translateY(0)';
                   e.target.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
                 }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', marginBottom: '16px', fontFamily: 'Inter, system-ui, sans-serif' }}>Starter Plan</h3>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#4f46e5', fontFamily: 'Inter, system-ui, sans-serif' }}>$99</span>
                  <span style={{ fontSize: '1.125rem', color: '#666', marginLeft: '8px' }}>/month</span>
                </div>
                <div style={{ background: '#eef2ff', color: '#4f46e5', padding: '8px 16px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '500', display: 'inline-block' }}>
                  Perfect for local shops starting online
                </div>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>8 SNS Image Contents</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>AI design + basic editing</p>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>SNS Upload</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Facebook, Instagram</p>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>Basic Captions & Hashtags</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Basic optimization included</p>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>Automated Weekly Performance Reports</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Automated delivery & insights</p>
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
                style={{ 
                  width: '100%', 
                  background: processing === 'Starter Plan' ? '#9ca3af' : '#4f46e5', 
                  color: 'white', 
                  padding: '16px 24px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  fontSize: '1.125rem', 
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', 
                  cursor: processing === 'Starter Plan' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!processing) {
                    e.target.style.background = '#4338ca';
                    e.target.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!processing) {
                    e.target.style.background = '#4f46e5';
                    e.target.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
                  }
                }}
              >
                {processing === 'Starter Plan' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '20px', height: '20px', animation: 'spin 1s linear infinite', marginRight: '8px' }}></div>
                    Processing...
                  </div>
                ) : (
                  'Get Started'
                )}
              </button>
            </div>

            {/* Growth Plan */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', border: '2px solid #a855f7', padding: '32px', position: 'relative', transition: 'all 0.3s ease', cursor: 'pointer', transform: 'scale(1.05)' }}
                 onMouseEnter={(e) => {
                   e.target.style.transform = 'scale(1.05) translateY(-4px)';
                   e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.transform = 'scale(1.05) translateY(0)';
                   e.target.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
                 }}>
              <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)' }}>
                <span style={{ background: 'linear-gradient(to right, #9333ea, #7c3aed)', color: 'white', padding: '8px 24px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)' }}>
                  Most Popular
                </span>
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', marginBottom: '16px', fontFamily: 'Inter, system-ui, sans-serif' }}>Growth Plan</h3>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#9333ea', fontFamily: 'Inter, system-ui, sans-serif' }}>$149</span>
                  <span style={{ fontSize: '1.125rem', color: '#666', marginLeft: '8px' }}>/month</span>
                </div>
                <div style={{ background: '#f3e8ff', color: '#7c3aed', padding: '8px 16px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '500', display: 'inline-block' }}>
                  Best for businesses ready to grow
                </div>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#f3e8ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#9333ea', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>12 Premium SNS Image Contents</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Premium AI design per month</p>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#f3e8ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#9333ea', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>SNS + Ad Campaign Setup</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>ad spend separate</p>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#f3e8ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#9333ea', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>Advanced Caption Strategy</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Optimized hashtags & engagement tactics</p>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#f3e8ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#9333ea', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>Detailed Weekly Analytics Reports</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Detailed analytics & recommendations</p>
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
                style={{ 
                  width: '100%', 
                  background: processing === 'Growth Plan' ? '#9ca3af' : '#9333ea', 
                  color: 'white', 
                  padding: '16px 24px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  fontSize: '1.125rem', 
                  cursor: processing === 'Growth Plan' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!processing) {
                    e.target.style.background = '#7c3aed';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!processing) {
                    e.target.style.background = '#9333ea';
                  }
                }}
              >
                {processing === 'Growth Plan' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '20px', height: '20px', animation: 'spin 1s linear infinite', marginRight: '8px' }}></div>
                    Processing...
                  </div>
                ) : (
                  'Get Started'
                )}
              </button>
            </div>

            {/* Pro Marketing Plan */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '32px', transition: 'all 0.3s ease', cursor: 'pointer' }}
                 onMouseEnter={(e) => {
                   e.target.style.transform = 'translateY(-4px)';
                   e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.transform = 'translateY(0)';
                   e.target.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
                 }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', marginBottom: '16px', fontFamily: 'Inter, system-ui, sans-serif' }}>Pro Marketing Plan</h3>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ea580c', fontFamily: 'Inter, system-ui, sans-serif' }}>$199</span>
                  <span style={{ fontSize: '1.125rem', color: '#666', marginLeft: '8px' }}>/month</span>
                </div>
                <div style={{ background: '#fff7ed', color: '#c2410c', padding: '8px 16px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '500', display: 'inline-block' }}>
                  All-in-one for serious growth
                </div>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>16 Premium SNS Image Contents</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Premium AI design & editing per month</p>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>Full Campaign Management</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>SNS upload + ad campaign optimization (ad spend separate)</p>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>AI Avatar / Narration Videos</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>up to 4 per month</p>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flexShrink: 0, width: '24px', height: '24px', background: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '0.875rem' }}>✓</span>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <span style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>Advanced Analytics & Strategic Insights</span>
                    <p style={{ color: '#666', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Weekly reports with strategic insights</p>
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
                style={{ 
                  width: '100%', 
                  background: processing === 'Pro Marketing Plan' ? '#9ca3af' : '#ea580c', 
                  color: 'white', 
                  padding: '16px 24px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  fontSize: '1.125rem', 
                  cursor: processing === 'Pro Marketing Plan' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!processing) {
                    e.target.style.background = '#dc2626';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!processing) {
                    e.target.style.background = '#ea580c';
                  }
                }}
              >
                {processing === 'Pro Marketing Plan' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '20px', height: '20px', animation: 'spin 1s linear infinite', marginRight: '8px' }}></div>
                    Processing...
                  </div>
                ) : (
                  'Get Started'
                )}
              </button>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
              <p style={{ color: '#374151', fontSize: '1rem', fontWeight: '500', marginBottom: '8px' }}>
                📞 Need a custom solution? Contact us for enterprise packages
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                All plans are monthly contracts and can be changed or cancelled at any time. No setup fees.
              </p>
            </div>
          </div>
        </div>

        {/* Other Services */}
        <div style={{ marginBottom: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', marginBottom: '16px', fontFamily: 'Inter, system-ui, sans-serif' }}>Other Services</h2>
            <p style={{ fontSize: '1.125rem', color: '#666', maxWidth: '640px', margin: '0 auto' }}>
              Additional professional services to complement your content strategy
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Menu, Flyer, Poster Design */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => {
                   e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Menu・Flyer・Poster Design
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
                  High-resolution, print-ready promotional materials for restaurants, cafes, and local events.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5', fontFamily: 'Inter, system-ui, sans-serif' }}>$99</span>
                    <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '4px' }}>/piece</span>
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
                    style={{ 
                      background: processing === 'Menu・Flyer・Poster Design' ? '#9ca3af' : '#4f46e5', 
                      color: 'white', 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      fontWeight: '600', 
                      fontSize: '0.875rem', 
                      cursor: processing === 'Menu・Flyer・Poster Design' ? 'not-allowed' : 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) e.target.style.background = '#4338ca';
                    }}
                    onMouseLeave={(e) => {
                      if (!processing) e.target.style.background = '#4f46e5';
                    }}
                  >
                    {processing === 'Menu・Flyer・Poster Design' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite', marginRight: '4px' }}></div>
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
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => {
                   e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Product/Service Photography
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
                  On-site photo & video shoot (Buford & Gainesville area). Editing included.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669', fontFamily: 'Inter, system-ui, sans-serif' }}>$199</span>
                    <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '4px' }}>/session</span>
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
                    style={{ 
                      background: processing === 'Product/Service Photography' ? '#9ca3af' : '#059669', 
                      color: 'white', 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      fontWeight: '600', 
                      fontSize: '0.875rem', 
                      cursor: processing === 'Product/Service Photography' ? 'not-allowed' : 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) e.target.style.background = '#047857';
                    }}
                    onMouseLeave={(e) => {
                      if (!processing) e.target.style.background = '#059669';
                    }}
                  >
                    {processing === 'Product/Service Photography' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite', marginRight: '4px' }}></div>
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
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => {
                   e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  SNS Account Setup
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
                  Profile design, bio writing, and initial hashtag optimization. Perfect for first-time SNS users.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb', fontFamily: 'Inter, system-ui, sans-serif' }}>$59</span>
                    <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '4px' }}>/account</span>
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
                    style={{ 
                      background: processing === 'SNS Account Initial Setup' ? '#9ca3af' : '#2563eb', 
                      color: 'white', 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      fontWeight: '600', 
                      fontSize: '0.875rem', 
                      cursor: processing === 'SNS Account Initial Setup' ? 'not-allowed' : 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) e.target.style.background = '#1d4ed8';
                    }}
                    onMouseLeave={(e) => {
                      if (!processing) e.target.style.background = '#2563eb';
                    }}
                  >
                    {processing === 'SNS Account Initial Setup' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite', marginRight: '4px' }}></div>
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
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => {
                   e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Story · Reels Production
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
                  15–30 sec short video optimized for Instagram/Facebook Stories & Reels. Boost engagement with trending content.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#db2777', fontFamily: 'Inter, system-ui, sans-serif' }}>$49</span>
                    <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '4px' }}>/video</span>
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
                    style={{ 
                      background: processing === 'Story・Reels Focused Production' ? '#9ca3af' : '#db2777', 
                      color: 'white', 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      fontWeight: '600', 
                      fontSize: '0.875rem', 
                      cursor: processing === 'Story・Reels Focused Production' ? 'not-allowed' : 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) e.target.style.background = '#be185d';
                    }}
                    onMouseLeave={(e) => {
                      if (!processing) e.target.style.background = '#db2777';
                    }}
                  >
                    {processing === 'Story・Reels Focused Production' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite', marginRight: '4px' }}></div>
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
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => {
                   e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Website Landing Page
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
                  WordPress-based advertising landing page with lead form integration. Optimized for paid campaigns.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0d9488', fontFamily: 'Inter, system-ui, sans-serif' }}>$249</span>
                    <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '4px' }}>/one-time</span>
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
                    style={{ 
                      background: processing === 'Website Landing Page Creation' ? '#9ca3af' : '#0d9488', 
                      color: 'white', 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      fontWeight: '600', 
                      fontSize: '0.875rem', 
                      cursor: processing === 'Website Landing Page Creation' ? 'not-allowed' : 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) e.target.style.background = '#0f766e';
                    }}
                    onMouseLeave={(e) => {
                      if (!processing) e.target.style.background = '#0d9488';
                    }}
                  >
                    {processing === 'Website Landing Page Creation' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite', marginRight: '4px' }}></div>
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
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => {
                   e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Event Promotion Package
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
                  Bundle: Event poster + 3 SNS images + 15-second video for seasonal promotions or events.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', fontFamily: 'Inter, system-ui, sans-serif' }}>$199</span>
                    <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '4px' }}>/package</span>
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
                    style={{ 
                      background: processing === 'Event Promotion Package' ? '#9ca3af' : '#dc2626', 
                      color: 'white', 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      fontWeight: '600', 
                      fontSize: '0.875rem', 
                      cursor: processing === 'Event Promotion Package' ? 'not-allowed' : 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) e.target.style.background = '#b91c1c';
                    }}
                    onMouseLeave={(e) => {
                      if (!processing) e.target.style.background = '#dc2626';
                    }}
                  >
                    {processing === 'Event Promotion Package' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite', marginRight: '4px' }}></div>
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
          
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
              <p style={{ color: '#374151', fontSize: '1rem', fontWeight: '500', marginBottom: '8px' }}>
                💼 Mix and match services to create your perfect marketing solution
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                All services can be combined with monthly plans for additional discounts. Contact us for custom packages.
              </p>
            </div>
          </div>
        </div>

        {/* Recommended Bundles */}
        <div style={{ marginBottom: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', marginBottom: '16px', fontFamily: 'Inter, system-ui, sans-serif' }}>Recommended Bundles</h2>
            <p style={{ fontSize: '1.125rem', color: '#666', maxWidth: '640px', margin: '0 auto' }}>
              Save money with our carefully curated service packages
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Local Restaurant Starter Pack */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => {
                   e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Local Restaurant Starter Pack
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
                  Starter Plan ($99) + Poster Design ($99)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5', fontFamily: 'Inter, system-ui, sans-serif' }}>$179</span>
                    <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '4px' }}>/month</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePayment('BUNDLE', 'Local Restaurant Starter Pack', 179, {
                        description: 'Starter Plan + Poster Design',
                        unit: 'per month'
                      });
                    }}
                    disabled={processing === 'Local Restaurant Starter Pack'}
                    style={{ 
                      background: processing === 'Local Restaurant Starter Pack' ? '#9ca3af' : '#4f46e5', 
                      color: 'white', 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      fontWeight: '600', 
                      fontSize: '0.875rem', 
                      cursor: processing === 'Local Restaurant Starter Pack' ? 'not-allowed' : 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) e.target.style.background = '#4338ca';
                    }}
                    onMouseLeave={(e) => {
                      if (!processing) e.target.style.background = '#4f46e5';
                    }}
                  >
                    {processing === 'Local Restaurant Starter Pack' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite', marginRight: '4px' }}></div>
                        Processing...
                      </div>
                    ) : (
                      'Order Now'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Real Estate Growth Pack */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => {
                   e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Real Estate Growth Pack
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
                  Growth Plan ($149) + Photography ($199) + Landing Page ($249)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9333ea', fontFamily: 'Inter, system-ui, sans-serif' }}>$597</span>
                    <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '4px' }}>/month</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePayment('BUNDLE', 'Real Estate Growth Pack', 597, {
                        description: 'Growth Plan + Photography + Landing Page',
                        unit: 'per month'
                      });
                    }}
                    disabled={processing === 'Real Estate Growth Pack'}
                    style={{ 
                      background: processing === 'Real Estate Growth Pack' ? '#9ca3af' : '#9333ea', 
                      color: 'white', 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      fontWeight: '600', 
                      fontSize: '0.875rem', 
                      cursor: processing === 'Real Estate Growth Pack' ? 'not-allowed' : 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) e.target.style.background = '#7c3aed';
                    }}
                    onMouseLeave={(e) => {
                      if (!processing) e.target.style.background = '#9333ea';
                    }}
                  >
                    {processing === 'Real Estate Growth Pack' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite', marginRight: '4px' }}></div>
                        Processing...
                      </div>
                    ) : (
                      'Order Now'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Event Special Pack */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => {
                   e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Event Special Pack
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
                  Pro Plan ($199) + Event Promotion Package ($199)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ea580c', fontFamily: 'Inter, system-ui, sans-serif' }}>$398</span>
                    <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '4px' }}>/month</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePayment('BUNDLE', 'Event Special Pack', 398, {
                        description: 'Pro Plan + Event Promotion Package',
                        unit: 'per month'
                      });
                    }}
                    disabled={processing === 'Event Special Pack'}
                    style={{ 
                      background: processing === 'Event Special Pack' ? '#9ca3af' : '#ea580c', 
                      color: 'white', 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      fontWeight: '600', 
                      fontSize: '0.875rem', 
                      cursor: processing === 'Event Special Pack' ? 'not-allowed' : 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) e.target.style.background = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      if (!processing) e.target.style.background = '#ea580c';
                    }}
                  >
                    {processing === 'Event Special Pack' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite', marginRight: '4px' }}></div>
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
        </div>

        {/* Footer CTA */}
        <div style={{ textAlign: 'center', marginBottom: '80px', padding: '60px 40px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', maxWidth: '800px', margin: '0 auto 80px auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', marginBottom: '32px', fontFamily: 'Inter, system-ui, sans-serif' }}>Ready to grow your business with AiStudio7?</h2>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a 
              href="#plans" 
              style={{ 
                background: '#4f46e5', 
                color: 'white', 
                padding: '16px 32px', 
                borderRadius: '8px', 
                textDecoration: 'none', 
                fontWeight: 'bold', 
                fontSize: '1.125rem',
                transition: 'background 0.3s ease',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => e.target.style.background = '#4338ca'}
              onMouseLeave={(e) => e.target.style.background = '#4f46e5'}
            >
              Start Now
            </a>
            <a 
              href="#plans" 
              style={{ 
                background: '#ff3b3b', 
                color: 'white', 
                padding: '16px 32px', 
                borderRadius: '8px', 
                textDecoration: 'none', 
                fontWeight: 'bold', 
                fontSize: '1.125rem',
                transition: 'background 0.3s ease',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => e.target.style.background = '#dc2626'}
              onMouseLeave={(e) => e.target.style.background = '#ff3b3b'}
            >
              Book a Free Demo
            </a>
          </div>
        </div>
      </div>


      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '500', color: '#333', margin: 0 }}>
                  Complete Payment - {currentPlan?.serviceName}
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setProcessing(null);
                  }}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.25rem', cursor: 'pointer', padding: '4px' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#374151', fontWeight: '500' }}>Service:</span>
                  <span style={{ color: '#333' }}>{currentPlan?.serviceName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ color: '#374151', fontWeight: '500' }}>Amount:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9333ea' }}>${currentPlan?.amount}</span>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flexShrink: 0 }}>
                      <span style={{ color: '#2563eb', fontSize: '1.125rem' }}>🔒</span>
                    </div>
                    <div style={{ marginLeft: '12px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e40af', margin: '0 0 4px 0' }}>Secure Payment</h4>
                      <p style={{ fontSize: '0.875rem', color: '#1d4ed8', margin: 0 }}>
                        Your payment is processed securely by Stripe. We never store your card information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                      onClick={() => {
                        window.location.href = paymentUrl;
                      }}
                      style={{ 
                        flex: 1, 
                        background: processing ? '#9ca3af' : '#9333ea', 
                        color: 'white', 
                        fontWeight: 'bold', 
                        padding: '12px 24px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        cursor: processing ? 'not-allowed' : 'pointer',
                        transition: 'background 0.3s ease'
                      }}
                      disabled={processing}
                      onMouseEnter={(e) => {
                        if (!processing) e.target.style.background = '#7c3aed';
                      }}
                      onMouseLeave={(e) => {
                        if (!processing) e.target.style.background = '#9333ea';
                      }}
                    >
                      {processing ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite', marginRight: '8px' }}></div>
                          Processing...
                        </div>
                      ) : (
                        'Continue to Payment'
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        window.open(paymentUrl, '_blank');
                      }}
                      style={{ 
                        flex: 1, 
                        background: processing ? '#9ca3af' : '#6b7280', 
                        color: 'white', 
                        fontWeight: 'bold', 
                        padding: '12px 24px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        cursor: processing ? 'not-allowed' : 'pointer',
                        transition: 'background 0.3s ease'
                      }}
                      disabled={processing}
                      onMouseEnter={(e) => {
                        if (!processing) e.target.style.background = '#4b5563';
                      }}
                      onMouseLeave={(e) => {
                        if (!processing) e.target.style.background = '#6b7280';
                      }}
                    >
                      Open in New Tab
                    </button>
                  </div>
                </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setProcessing(null);
                  }}
                  style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.875rem', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Cancel and go back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}