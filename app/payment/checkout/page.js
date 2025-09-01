'use client'
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function CheckoutContent() {
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sessionId = searchParams.get('session_id');
  const amount = searchParams.get('amount');
  const service = searchParams.get('service');
  const type = searchParams.get('type');

  useEffect(() => {
    console.log('💳 Checkout: Auth state check - User:', user ? user.email : 'null', 'Loading:', loading);
    
    // Only redirect if loading is complete and no user
    if (!loading && !user) {
      console.log('🔴 Checkout: No user after loading complete, redirecting to login');
      router.push('/login');
    }
  }, [user, loading, router]);

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update payment status in database
      const response = await fetch('/api/payments/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          status: 'COMPLETED'
        }),
      });

      if (response.ok) {
        setPaymentStatus('success');
        setTimeout(() => {
          router.push('/payment/success?session_id=' + sessionId);
        }, 1500);
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Checkout</h1>
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Service</p>
            <p className="font-semibold text-gray-900">{decodeURIComponent(service || '')}</p>
            <p className="text-sm text-gray-600 mt-2">Type: {type}</p>
          </div>
          
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            ${amount}
          </div>
          <p className="text-gray-500 text-sm">One-time payment</p>
        </div>

        {paymentStatus === 'success' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Payment successful! Redirecting...
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Payment failed. Please try again.
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm">CARD</div>
              <span className="text-gray-600">**** **** **** 4242</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Billing Information</h3>
            <p className="text-gray-600 text-sm">{user.name}</p>
            <p className="text-gray-600 text-sm">{user.email}</p>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </div>
            ) : (
              `Pay $${amount}`
            )}
          </button>

          <button
            onClick={() => router.push('/portfolio')}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Your payment information is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}