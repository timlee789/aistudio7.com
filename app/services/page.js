'use client'
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Services() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [processing, setProcessing] = useState(null);

  // Debug user state when component loads or updates
  useEffect(() => {
    console.log('Services page: Component update - User:', user, 'Loading:', loading);
    if (typeof document !== 'undefined') {
      console.log('Services page: All cookies:', document.cookie);
    }
  }, [user, loading]);

  // Test function to manually check authentication
  const testAuth = async () => {
    console.log('🧪 === Manual Auth Test ===');
    console.log('👤 Current user state:', user);
    console.log('⏳ Loading state:', loading);
    console.log('🍪 Document cookies:', typeof document !== 'undefined' ? document.cookie : 'N/A (SSR)');
    
    try {
      console.log('🔍 Testing Profile API...');
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      });
      console.log('📡 Profile API status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile API data:', data);
      } else {
        const errorData = await response.json();
        console.log('❌ Profile API error:', errorData);
      }
    } catch (error) {
      console.log('💥 Profile API fetch error:', error);
    }

    // Also test payment API directly
    try {
      console.log('🔍 Testing Payment API...');
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          serviceType: 'PLAN',
          serviceName: 'Test Plan',
          amount: 1,
          serviceDetails: { test: true }
        }),
      });
      console.log('📡 Payment API status:', response.status);
      const data = await response.json();
      console.log('📊 Payment API response:', data);
    } catch (error) {
      console.log('💥 Payment API fetch error:', error);
    }

    console.log('🏁 === End Auth Test ===');
  };

  const handlePayment = async (serviceType, serviceName, amount, serviceDetails = {}) => {
    console.log('🚨🚨🚨 HANDLE PAYMENT FUNCTION CALLED 🚨🚨🚨');
    console.log('💳 ======= PAYMENT BUTTON CLICKED =======');
    console.log('👤 Services: Current user:', user ? user.email : 'null');
    console.log('⏳ Services: Loading state:', loading);
    console.log('🎯 Services: Payment details:', { serviceType, serviceName, amount });
    
    // 실제 결제 로직 실행
    console.log('🔍 Proceeding with actual payment logic...');
    
    // If still loading, wait
    if (loading) {
      console.log('⏳ Services: Still loading, please wait...');
      alert('Loading user data, please wait a moment and try again.');
      return;
    }
    
    // If no user, redirect to login
    if (!user) {
      console.log('❌ Services: No user found, redirecting to login');
      console.log('🔴 Services: REDIRECTING TO LOGIN - NO USER');
      router.push('/login');
      return;
    }

    // User exists, proceed with payment
    console.log('✅ Services: User authenticated, proceeding with payment');
    
    // 테스트: API 호출 없이 직접 결제 페이지로 이동
    if (serviceName === 'Test Plan') {
      console.log('🧪 Test mode: Skipping API call, going directly to checkout');
      const testUrl = 'http://localhost:3000/payment/checkout?session_id=test_session&amount=1&service=Test%20Plan&type=PLAN';
      console.log('🧪 Test URL:', testUrl);
      
      setTimeout(() => {
        console.log('🚀 Redirecting to test checkout page...');
        window.location.href = testUrl;
      }, 1000);
      return;
    }
    
    console.log('🔄 Services: Starting payment API call...');
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

      console.log('📡 Services: Payment API response status:', response.status);
      const data = await response.json();
      console.log('📊 Services: Payment API response data:', data);
      
      if (data.success) {
        console.log('✅ Services: Payment session created, URL:', data.url);
        console.log('🔗 Services: About to redirect...');
        
        // 더 안전한 리다이렉트 방법 시도
        try {
          console.log('🚀 Services: Attempting window.open...');
          window.open(data.url, '_self');
          console.log('✅ Services: window.open completed');
        } catch (error) {
          console.log('❌ Services: window.open failed, trying location.href:', error);
          window.location.href = data.url;
        }
      } else {
        console.error('❌ Services: Payment session error:', data);
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          router.push('/login');
        } else {
          alert(`Payment error: ${data.error || 'Failed to create payment session. Please try again.'}`);
        }
      }
    } catch (error) {
      console.error('💥 Services: Payment error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#f4d03f' }}>
      <nav className="shadow-lg" style={{ background: '#f4d03f' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" style={{ textDecoration: 'none' }}>
                <h1 className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Myriad Pro, Arial, sans-serif', cursor: 'pointer' }}>AiStudio7.com</h1>
              </a>
            </div>
            <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

        {/* Debug Panel - Remove after fixing */}
        <div className="mb-8 p-4 bg-yellow-100 rounded-lg border">
          <h3 className="font-bold text-yellow-800 mb-2">🔍 Authentication Status</h3>
          <div className="mb-4 p-3 bg-white rounded border">
            <p className="text-sm font-medium mb-1">
              Status: {loading ? '⏳ Loading...' : user ? '✅ Logged In' : '❌ Not Logged In'}
            </p>
            {user && (
              <p className="text-sm text-green-700">
                👤 User: {user.email} ({user.role})
              </p>
            )}
            <p className="text-sm text-gray-600">
              🍪 Cookies: {typeof document !== 'undefined' && document.cookie ? 'Present' : 'None'}
            </p>
          </div>
          <button 
            onClick={testAuth}
            className="bg-yellow-600 text-white px-4 py-2 rounded text-sm mr-2"
          >
            🧪 Test Auth API
          </button>
          <button 
            onClick={() => {
              console.clear();
              console.log('🧹 Console cleared - only our app logs will show now');
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded text-sm mr-2"
          >
            🧹 Clear Console
          </button>
          <button 
            type="button"
            onClick={(e) => {
              console.log('🚨 BUTTON CLICK EVENT TRIGGERED!');
              console.log('🚨 Event object:', e);
              console.log('🚨 Event target:', e.target);
              e.preventDefault();
              e.stopPropagation();
              console.log('🧪 Test Payment button clicked - preventing default');
              console.log('🧪 About to call handlePayment...');
              handlePayment('PLAN', 'Test Plan', 1, { test: true });
              console.log('🧪 handlePayment call completed');
            }}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm"
          >
            🧪 Test Payment
          </button>
        </div>

        {/* Pricing Plans */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Service Plans</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan to accelerate your business growth with AI-powered content
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-1">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Starter Plan</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-indigo-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$99</span>
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
                    <span className="text-gray-900 font-semibold text-base">4 Short-form Videos</span>
                    <p className="text-gray-500 text-sm mt-1">15~30 seconds per month</p>
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
                    features: ['8 SNS Image Contents', '4 Short-form Videos', 'SNS Upload Service', 'Caption & Hashtag Creation', 'Weekly Performance Reports']
                  });
                }}
                disabled={processing === 'Starter Plan'}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl hover:bg-indigo-700 transition-colors font-bold text-lg shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
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
            <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 p-8 relative hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-1 transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-8 mt-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Growth Plan</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-purple-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$149</span>
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
                    <span className="text-gray-900 font-semibold text-base">6 Short-form Videos</span>
                    <p className="text-gray-500 text-sm mt-1">High-quality production per month</p>
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
                    features: ['12 SNS Image Contents', '6 Short-form Videos', 'SNS + Ad Campaign Setup', 'Advanced Caption Strategy', 'Weekly Performance Reports']
                  });
                }}
                disabled={processing === 'Growth Plan'}
                className="w-full bg-purple-600 text-white py-4 px-6 rounded-xl hover:bg-purple-700 transition-colors font-bold text-lg shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
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
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-1">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Pro Marketing Plan</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-orange-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$199</span>
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
                    <span className="text-gray-900 font-semibold text-base">8 Short-form Videos</span>
                    <p className="text-gray-500 text-sm mt-1">Professional production per month</p>
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
                    features: ['16 SNS Image Contents', '8 Short-form Videos', 'Full Campaign Management', 'AI Avatar/Narration Videos', 'Advanced Analytics']
                  });
                }}
                disabled={processing === 'Pro Marketing Plan'}
                className="w-full bg-orange-600 text-white py-4 px-6 rounded-xl hover:bg-orange-700 transition-colors font-bold text-lg shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Other Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Additional professional services to complement your content strategy
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            
            {/* Menu, Flyer, Poster Design */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Menu・Flyer・Poster Design
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Promotional image creation with high-resolution files for printing
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$99</span>
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Product/Service Photography
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  On-site photo & video shoot (Buford, Georgia area, editing included)
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$199</span>
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  SNS Account Initial Setup
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Profile design, basic bio writing, initial hashtag setup
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$59</span>
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Story・Reels Focused Production
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Instagram/Facebook Story or Reels dedicated short video creation
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-pink-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$49</span>
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Website Landing Page Creation
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  WordPress-based advertising landing page with lead form integration
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-teal-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$249</span>
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Event Promotion Package
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Event poster + 3 SNS images + 15-second video creation bundle
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-red-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>$199</span>
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