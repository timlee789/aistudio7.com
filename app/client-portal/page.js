'use client'
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';

export default function ClientPortal() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasPaidService, setHasPaidService] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { user, logout, loading: userLoading } = useAuth();
  const pathname = usePathname();
  const { orders, fetchOrders, updateOrder } = useOrder();

  // Date formatting function (resolves timezone issues)
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const dateStr = dateString.split('T')[0]; // Extract YYYY-MM-DD part only
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // Create in local timezone
    return localDate.toLocaleDateString('en-US');
  };

  // Check payment status when user changes
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!user) {
        setHasPaidService(false);
        setCheckingPayment(false);
        return;
      }
      
      setCheckingPayment(true);
      
      try {
        const response = await fetch('/api/user/page-access?page=client-portal');
        const data = await response.json();
        
        if (response.ok) {
          setHasPaidService(data.hasAccess);
        } else {
          setHasPaidService(false);
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
        setHasPaidService(false);
      } finally {
        setCheckingPayment(false);
      }
    };

    // Only check payment status if user loading is complete
    if (!userLoading) {
      if (user) {
        checkPaymentStatus();
      } else {
        setHasPaidService(false);
        setCheckingPayment(false);
      }
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (user && hasPaidService === true) {
      const loadOrders = async () => {
        setLoading(true);
        await fetchOrders();
        setLoading(false);
      };
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user, hasPaidService]); // Remove fetchOrders dependency

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      case 'REVISION': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'IN_PROGRESS': return 'In Progress';
      case 'REVIEW': return 'Under Review';
      case 'PENDING': return 'Pending';
      case 'REVISION': return 'Revision Requested';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'URGENT': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'Critical';
      case 'URGENT': return 'Urgent';
      case 'NORMAL': return 'Normal';
      default: return priority;
    }
  };

  const handleApprove = async (orderId) => {
    if (!user || hasPaidService !== true) return;
    
    const result = await updateOrder(orderId, {
      action: 'addFeedback',
      type: 'APPROVAL',
      message: 'Approved successfully.'
    });
    
    if (result.success) {
      setSelectedOrder(null);
      // OrderContext's updateOrder has already updated state, no need to call fetchOrders
    } else {
      alert('An error occurred while processing approval.');
    }
  };

  const handleRequestChanges = async (orderId, feedback) => {
    if (!user || hasPaidService !== true) return;
    
    if (!feedback.trim()) {
      alert('Please enter your revision request details.');
      return;
    }

    const result = await updateOrder(orderId, {
      action: 'addFeedback',
      type: 'REVISION',
      message: feedback
    });
    
    if (result.success) {
      setFeedbackText('');
      setSelectedOrder(null);
      // OrderContext's updateOrder has already updated state, no need to call fetchOrders
    } else {
      alert('An error occurred while processing revision request.');
    }
  };

  const canUseService = user && hasPaidService === true;
  const isDisabled = !user || hasPaidService === false;

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
                href="/client-portal" 
                className="mobile-menu-item block px-3 py-2 rounded-md text-base font-medium hover:text-indigo-600"
                style={{
                  fontWeight: pathname === '/client-portal' ? 'bold' : 'normal',
                  color: pathname === '/client-portal' ? '#4f46e5' : '#374151',
                  textDecoration: 'none'
                }}
              >
                My Portal
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
                SNS Settings
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
                <a href="/login" className="mobile-menu-item block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600" style={{ textDecoration: 'none' }}>
                  Login
                </a>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Client Portal</h2>
          <p className="text-gray-600">Track and manage your order status and progress</p>
        </div>

        {(userLoading || checkingPayment) ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking payment status...</p>
          </div>
        ) : !user ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Login Required</h3>
            <p className="text-blue-700 mb-4">Please log in to access your client portal and view your orders.</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Go to Login
            </button>
          </div>
        ) : hasPaidService === false ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Payment Required</h3>
            <p className="text-yellow-700 mb-4">The client portal is only available to users with completed payments. Please purchase a service plan to access your order history and management features.</p>
            <button
              onClick={() => window.location.href = '/portfolio'}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
            >
              View Services
            </button>
          </div>
        ) : null}

        <div className={`bg-white shadow-xl rounded-lg overflow-hidden ${isDisabled ? 'opacity-50' : ''}`}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Order List {isDisabled && '(Disabled)'}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!canUseService ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      {!user ? 'Please login to view your orders' : 'Payment required to access order history'}
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No orders found. Request your first service!
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                          {getPriorityText(order.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.dueDate) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => canUseService && setSelectedOrder(order)}
                          className={`${canUseService ? 'text-indigo-600 hover:text-indigo-900' : 'text-gray-400 cursor-not-allowed'}`}
                          disabled={!canUseService}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail View Modal */}
        {selectedOrder && canUseService && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Order Details: {selectedOrder.id}</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Title</h4>
                    <p className="text-gray-600">{selectedOrder.title}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Description</h4>
                    <p className="text-gray-600">{selectedOrder.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Created Date</h4>
                      <p className="text-gray-600">{new Date(selectedOrder.createdAt).toLocaleDateString('en-US')}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Due Date</h4>
                      <p className="text-gray-600">
                        {formatDate(selectedOrder.dueDate) || 'Not set'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Status</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Priority</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedOrder.priority)}`}>
                        {getPriorityText(selectedOrder.priority)}
                      </span>
                    </div>
                  </div>

                  {/* Uploaded Files */}
                  {selectedOrder.files && selectedOrder.files.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-700 mb-3">Client Uploaded Files</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {selectedOrder.files.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                              {file.mimetype?.startsWith('image/') ? (
                                <img
                                  src={file.path}
                                  alt={file.originalName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : file.mimetype?.startsWith('video/') ? (
                                <video
                                  src={file.path}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                >
                                  <source src={file.path} type={file.mimetype} />
                                </video>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="text-center">
                                    <span className="text-3xl">📄</span>
                                    <p className="text-xs mt-1 text-gray-500">{file.mimetype}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Default icon when file fails to load */}
                              <div className="w-full h-full flex items-center justify-center bg-gray-200" style={{display: 'none'}}>
                                <div className="text-center">
                                  <span className="text-3xl">❌</span>
                                  <p className="text-xs mt-1 text-gray-500">Load Failed</p>
                                  <p className="text-xs text-gray-400">{file.originalName}</p>
                                </div>
                              </div>

                              {/* Video play icon overlay */}
                              {file.mimetype?.startsWith('video/') && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black bg-opacity-50 rounded-full p-2">
                                    <span className="text-white text-lg">▶️</span>
                                  </div>
                                </div>
                              )}

                              {/* File size display */}
                              <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                                {(file.size / 1024 / 1024).toFixed(1)}MB
                              </div>
                            </div>
                            
                            {/* File name */}
                            <p className="text-xs text-gray-600 mt-1 truncate" title={file.originalName}>
                              {file.originalName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  {selectedOrder.adminContent && (
                    <div className="border-t-2 border-purple-200 pt-6">
                      <div className="flex items-center mb-4">
                        <div className="flex-grow h-px bg-purple-200"></div>
                        <span className="px-4 text-sm font-medium text-purple-600 bg-purple-50 rounded-full">
                          🎨 Admin Created Content
                        </span>
                        <div className="flex-grow h-px bg-purple-200"></div>
                      </div>
                    </div>
                  )}

                  {selectedOrder.adminContent && (
                    <div>
                      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                        <div className="flex justify-between items-start mb-3">
                          <p className="text-gray-600 flex-1">{selectedOrder.adminContent.description}</p>
                          <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                            Uploaded: {new Date(selectedOrder.adminContent.createdAt).toLocaleDateString('en-US')} {' '}
                            {new Date(selectedOrder.adminContent.createdAt).toLocaleTimeString('en-US')}
                          </span>
                        </div>
                        
                        {/* Admin uploaded files */}
                        {selectedOrder.adminContent.files && selectedOrder.adminContent.files.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedOrder.adminContent.files.map((file, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                  {file.mimetype?.startsWith('image/') ? (
                                    <img
                                      src={file.path}
                                      alt={file.originalName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : file.mimetype?.startsWith('video/') ? (
                                    <video
                                      src={file.path}
                                      className="w-full h-full object-cover"
                                      controls
                                      preload="metadata"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    >
                                      <source src={file.path} type={file.mimetype} />
                                    </video>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="text-center">
                                        <span className="text-3xl">🎨</span>
                                        <p className="text-xs mt-1 text-gray-500">Finished Work</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* When file fails to load */}
                                  <div className="w-full h-full flex items-center justify-center" style={{display: 'none'}}>
                                    <div className="text-center">
                                      <span className="text-3xl">🎨</span>
                                      <p className="text-xs mt-1 text-gray-500">Finished Work</p>
                                    </div>
                                  </div>

                                  {/* Download button */}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                      href={file.path}
                                      download={file.originalName}
                                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
                                      title="Download"
                                    >
                                      ⬇
                                    </a>
                                  </div>
                                </div>
                                
                                {/* File name */}
                                <p className="text-xs text-gray-600 mt-1 truncate" title={file.originalName}>
                                  {file.originalName}
                                </p>
                                {/* File upload time */}
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {new Date(selectedOrder.adminContent.createdAt).toLocaleDateString('en-US')} {' '}
                                  {new Date(selectedOrder.adminContent.createdAt).toLocaleTimeString('en-US', { 
                                    hour12: true, 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-200 h-40 rounded flex items-center justify-center">
                            <span className="text-gray-500">Content Preview</span>
                          </div>
                        )}
                      </div>
                      
                      {selectedOrder.status === 'REVIEW' && canUseService && (
                        <div className="mt-4">
                          <div className="flex space-x-4 mb-4">
                            <button
                              onClick={() => handleApprove(selectedOrder.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                              disabled={!canUseService}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                if (feedbackText.trim()) {
                                  handleRequestChanges(selectedOrder.id, feedbackText);
                                }
                              }}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
                              disabled={!canUseService}
                            >
                              Request Changes
                            </button>
                          </div>
                          <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Please enter your revision request details..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                            rows="3"
                            disabled={!canUseService}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {selectedOrder.feedbacks && selectedOrder.feedbacks.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700">Feedback History</h4>
                      <div className="space-y-2">
                        {selectedOrder.feedbacks.map((feedback, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded">
                            <div className="flex justify-between items-start">
                              <span className={`px-2 py-1 text-xs rounded ${
                                feedback.type === 'APPROVAL' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {feedback.type === 'APPROVAL' ? 'Approved' : 'Revision Requested'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(feedback.createdAt).toLocaleDateString('en-US')}
                              </span>
                            </div>
                            {feedback.message && (
                              <p className="text-gray-600 mt-2">{feedback.message}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}