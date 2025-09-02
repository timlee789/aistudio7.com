'use client'
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';

export default function ServiceRequest() {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasPaidService, setHasPaidService] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // AI Generation states
  const [enableAIGeneration, setEnableAIGeneration] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiNegativePrompt, setAiNegativePrompt] = useState('low quality, blurry, artifacts');
  const [selectedWorkflow, setSelectedWorkflow] = useState('auto'); // 'auto', 'default', 'highres', 'logo'
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [generationProgress, setGenerationProgress] = useState(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading: userLoading } = useAuth();
  const { createOrder } = useOrder();

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFilePreview = (file) => {
    // Handle generated images
    if (file.isGenerated) {
      return file.preview || file.url;
    }
    
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    } else if (file.type.startsWith('video/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const isImageFile = (file) => file.type.startsWith('image/');
  const isVideoFile = (file) => file.type.startsWith('video/');

  // AI Generation functions
  const generateAIContent = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter an AI prompt');
      return;
    }

    if (!user) {
      alert('Please login to use AI generation');
      return;
    }

    setAiGenerating(true);
    setGenerationProgress({ status: 'starting', message: 'Initializing AI generation...' });

    try {
      setGenerationProgress({ status: 'generating', message: 'Sending request to AI server...' });

      // Send AI generation request without orderId - API will create a temporary one
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          negativePrompt: aiNegativePrompt,
          options: {
            template: selectedWorkflow === 'auto' ? undefined : selectedWorkflow,
            width: selectedWorkflow === 'highres' ? 1024 : 512,
            height: selectedWorkflow === 'highres' ? 1024 : 512,
            steps: selectedWorkflow === 'logo' ? 30 : 20,
            cfg: selectedWorkflow === 'logo' ? 9 : 7.5
          }
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setGenerationProgress({ status: 'processing', message: 'AI is generating your image...' });

      // Poll for results
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/ai/generate?id=${result.generationId}`);
          const statusData = await statusResponse.json();

          if (statusData.success) {
            if (statusData.status === 'completed') {
              clearInterval(pollInterval);
              setGeneratedImages(statusData.images || []);
              setGenerationProgress({ status: 'completed', message: 'AI generation completed!' });
              setAiGenerating(false);
            } else if (statusData.status === 'processing') {
              setGenerationProgress({ status: 'processing', message: 'AI is still generating...' });
            } else if (statusData.status === 'failed') {
              clearInterval(pollInterval);
              throw new Error('AI generation failed');
            }
          }
        } catch (pollError) {
          clearInterval(pollInterval);
          console.error('Polling error:', pollError);
          setGenerationProgress({ status: 'error', message: 'Error checking generation status' });
          setAiGenerating(false);
        }
      }, 3000); // Check every 3 seconds

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (aiGenerating) {
          setGenerationProgress({ status: 'timeout', message: 'Generation timed out' });
          setAiGenerating(false);
        }
      }, 300000);

    } catch (error) {
      console.error('AI generation error:', error);
      setGenerationProgress({ status: 'error', message: error.message });
      setAiGenerating(false);
    }
  };

  // Add generated image to files
  const addGeneratedImageToFiles = (imageUrl, filename) => {
    // Create a pseudo-file object for generated images
    const generatedFile = {
      name: filename,
      type: 'image/png',
      size: 0, // We don't know the actual size
      isGenerated: true,
      url: imageUrl,
      preview: imageUrl
    };
    
    setFiles(prev => [...prev, generatedFile]);
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
        const response = await fetch('/api/user/page-access?page=service-request');
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

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file instanceof File) {
          const url = URL.createObjectURL(file);
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (hasPaidService !== true) {
      setError('This service requires a completed payment. Please purchase a service plan to access this feature.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    const orderData = {
      title,
      description,
      priority,
      dueDate: dueDate || null,
      files
    };

    const result = await createOrder(orderData);
    
    if (result.success) {
      alert('Service request has been successfully submitted!');
      router.push('/client-portal');
    } else {
      setError(result.error);
    }
    
    setIsSubmitting(false);
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
                href="/services" 
                className="mobile-menu-item block px-3 py-2 rounded-md text-base font-medium hover:text-indigo-600"
                style={{
                  fontWeight: pathname === '/services' ? 'bold' : 'normal',
                  color: pathname === '/services' ? '#4f46e5' : '#374151',
                  textDecoration: 'none'
                }}
              >
                Services
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

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Service Request</h2>
          
          {(userLoading || checkingPayment) ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Checking payment status...</p>
            </div>
          ) : !user ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Login Required</h3>
              <p className="text-blue-700 mb-4">Please log in to access the service request feature.</p>
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Go to Login
              </button>
            </div>
          ) : hasPaidService === false ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Payment Required</h3>
              <p className="text-yellow-700 mb-4">This feature is only available to users with completed payments. Please purchase a service plan to access service requests.</p>
              <button
                onClick={() => router.push('/services')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
              >
                View Services
              </button>
            </div>
          ) : null}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {/* Title input */}
            <div>
              <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-4">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder={canUseService ? "Enter a title" : !user ? "Please login to access service request" : "Payment required to access service request"}
                required
                disabled={isDisabled}
              />
            </div>
            {/* File upload section */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-4">
                Image/Video Upload
              </label>
              <div className={`border-2 border-dashed border-gray-300 rounded-lg p-8 ${isDisabled ? 'opacity-50' : ''}`}>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isDisabled}
                />
                <label
                  htmlFor="file-upload"
                  className={`${canUseService ? 'cursor-pointer' : 'cursor-not-allowed'} flex flex-col items-center`}
                >
                  <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">📁</span>
                  </div>
                  <span className="text-lg text-gray-600">
                    {canUseService ? 'Select files or drag and drop' : !user ? 'Please login to upload files' : 'Payment required to upload files'}
                  </span>
                  <span className="text-sm text-gray-500 mt-2">
                    {canUseService ? 'Image and video files supported' : !user ? 'Login required' : 'Payment required'}
                  </span>
                </label>
              </div>

              {/* Uploaded file thumbnails */}
              {files.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-4">Uploaded Files</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${file.isGenerated ? 'border-purple-300' : 'border-gray-200'}`}>
                          {file.isGenerated && (
                            <div className="absolute top-1 left-1 bg-purple-600 text-white text-xs px-2 py-1 rounded z-10">
                              🤖 AI
                            </div>
                          )}
                          {isImageFile(file) ? (
                            <img
                              src={getFilePreview(file)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : isVideoFile(file) ? (
                            <video
                              src={getFilePreview(file)}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            >
                              <source src={getFilePreview(file)} type={file.type} />
                            </video>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <span className="text-4xl">📄</span>
                                <p className="text-xs mt-2 text-gray-500">{file.type}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Video play icon overlay */}
                          {isVideoFile(file) && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-black bg-opacity-50 rounded-full p-3">
                                <span className="text-white text-2xl">▶️</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                        
                        {/* File information */}
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Service description text */}
            <div>
              <label htmlFor="description" className="block text-lg font-medium text-gray-700 mb-4">
                Service Request Details
              </label>
              <textarea
                id="description"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder={canUseService ? "Please describe in detail the content creation you would like..." : !user ? "Please login to access service request" : "Payment required to access service request"}
                required
                disabled={isDisabled}
              />
            </div>

            {/* AI Content Generation Section */}
            <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border-2 border-purple-200 ${isDisabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="ai-generation"
                  checked={enableAIGeneration}
                  onChange={(e) => setEnableAIGeneration(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  disabled={isDisabled}
                />
                <label htmlFor="ai-generation" className="ml-3 block text-lg font-medium text-gray-900">
                  🤖 Enable AI Content Generation {!user ? '(Login required)' : hasPaidService === false ? '(Payment required)' : ''}
                </label>
              </div>
              
              {enableAIGeneration && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                      AI Image Prompt
                    </label>
                    <textarea
                      id="ai-prompt"
                      rows={3}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                      placeholder="Describe the image you want AI to generate (e.g., 'modern minimalist logo for coffee shop, clean design, warm colors')"
                    />
                  </div>

                  <div>
                    <label htmlFor="workflow-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Workflow Template
                    </label>
                    <select
                      id="workflow-select"
                      value={selectedWorkflow}
                      onChange={(e) => setSelectedWorkflow(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black bg-white"
                    >
                      <option value="auto">🤖 Auto-select based on prompt</option>
                      <option value="default">🎨 Default - General purpose (512x512)</option>
                      <option value="highres">📸 High Resolution - Quality focused (1024x1024)</option>
                      <option value="logo">🏢 Logo Design - Clean & minimalist (512x512)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-600">
                      Auto-select will choose the best workflow based on keywords in your prompt
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="ai-negative-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                      Negative Prompt (Optional)
                    </label>
                    <input
                      type="text"
                      id="ai-negative-prompt"
                      value={aiNegativePrompt}
                      onChange={(e) => setAiNegativePrompt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                      placeholder="What to avoid in the image"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={generateAIContent}
                      disabled={aiGenerating || !aiPrompt.trim()}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
                    >
                      {aiGenerating ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                          Generating...
                        </>
                      ) : (
                        '🎨 Generate AI Image'
                      )}
                    </button>
                  </div>

                  {/* Generation Progress */}
                  {generationProgress && (
                    <div className="mt-4 p-3 bg-white rounded-md border">
                      <div className="flex items-center">
                        {generationProgress.status === 'processing' && (
                          <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full mr-3"></div>
                        )}
                        {generationProgress.status === 'completed' && (
                          <div className="h-4 w-4 bg-green-500 rounded-full mr-3"></div>
                        )}
                        {generationProgress.status === 'error' && (
                          <div className="h-4 w-4 bg-red-500 rounded-full mr-3"></div>
                        )}
                        <span className="text-sm text-gray-700">{generationProgress.message}</span>
                      </div>
                    </div>
                  )}

                  {/* Generated Images */}
                  {generatedImages.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-3">Generated Images</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {generatedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-purple-200">
                              <img
                                src={image.url}
                                alt={`Generated ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => addGeneratedImageToFiles(image.url, image.filename)}
                              className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Add to Files
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isDisabled}
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Very Urgent">Very Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Completion Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isDisabled}
                />
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDisabled || isSubmitting || files.length === 0 || !title.trim() || !description.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!user ? 'Login Required' : hasPaidService === false ? 'Payment Required' : isSubmitting ? 'Submitting...' : 'Submit Service Request'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}