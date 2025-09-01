'use client'
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function PaymentSuccessContent() {
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    console.log('🎉 Success: Auth state check - User:', user ? user.email : 'null', 'Auth Loading:', authLoading);
    
    if (!authLoading && !user) {
      console.log('🔴 Success: No user after loading complete, redirecting to login');
      router.push('/login');
      return;
    }
    
    if (!user) {
      console.log('⏳ Success: Still loading user, waiting...');
      return;
    }

    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(`/api/payments/details?session_id=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setPaymentDetails(data.payment);
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchPaymentDetails();
    } else {
      setLoading(false);
    }
  }, [sessionId, user, authLoading, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Thank you for your purchase</p>
        </div>

        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium text-gray-900">{paymentDetails.serviceName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-900">
                  {paymentDetails.serviceType === 'PLAN' ? 'Service Plan' : 'Other Service'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-gray-900">${paymentDetails.amount}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Completed</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(paymentDetails.paidAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium text-gray-900 text-sm">{paymentDetails.id.slice(-8).toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              📧 A receipt has been sent to your email address. Our team will contact you within 24 hours to begin your service.
            </p>
          </div>

          <button
            onClick={() => router.push('/client-portal')}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Go to My Portal
          </button>

          <button
            onClick={() => router.push('/portfolio')}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Browse More Services
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}