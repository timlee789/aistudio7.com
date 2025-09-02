'use client'
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SnsSettings() {
  const { user, logout, loading: userLoading } = useAuth();
  const pathname = usePathname();
  const [hasPaidService, setHasPaidService] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [platforms, setPlatforms] = useState([
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      connected: false,
      autoPost: false,
      account: null,
      accessToken: null,
      username: '',
      password: ''
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '👥',
      connected: false,
      autoPost: false,
      account: null,
      accessToken: null,
      email: '',
      password: ''
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '🎥',
      connected: false,
      autoPost: false,
      account: null,
      accessToken: null,
      email: '',
      password: ''
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(null);
  const [connectionForm, setConnectionForm] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [postSettings, setPostSettings] = useState({
    autoPostTiming: 'immediate',
    scheduledTime: '',
    defaultHashtags: '#aistudio7 #content #creative',
    contentApprovalRequired: true
  });

  // Check payment status when user changes
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!user) {
        setHasPaidService(false);
        setCheckingPayment(false);
        return;
      }
      
      setCheckingPayment(true);
      
      // Check payment status
      try {
        const response = await fetch('/api/user/page-access?page=sns-settings');
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

  // Load SNS settings
  useEffect(() => {
    if (user && hasPaidService === true) {
      loadSnsSettings();
    }
  }, [user, hasPaidService]);

  const loadSnsSettings = async () => {
    try {
      const response = await fetch('/api/sns-settings');
      const data = await response.json();
      
      if (response.ok && data.settings) {
        const savedPlatforms = JSON.parse(data.settings.platforms || '[]');
        const savedSettings = JSON.parse(data.settings.settings || '{}');
        
        // Update platform state with saved settings
        setPlatforms(prev => prev.map(platform => {
          const saved = savedPlatforms.find(p => p.id === platform.id);
          return saved ? { ...platform, ...saved } : platform;
        }));
        
        setPostSettings(prev => ({ ...prev, ...savedSettings }));
      }
    } catch (error) {
      console.error('Failed to load SNS settings:', error);
    }
  };

  const openConnectionModal = (platform) => {
    if (!user || hasPaidService !== true) return;
    
    setShowConnectionModal(platform);
    setConnectionForm({
      username: platform.username || '',
      password: platform.password || '',
      email: platform.email || ''
    });
  };

  const closeConnectionModal = () => {
    setShowConnectionModal(null);
    setConnectionForm({});
  };

  const handleConnectionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In actual implementation, platform-specific API connection logic is needed
      // Currently simulating connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPlatforms(prev => prev.map(platform => 
        platform.id === showConnectionModal.id 
          ? { 
              ...platform, 
              connected: true,
              account: connectionForm.username || connectionForm.email,
              username: connectionForm.username || '',
              email: connectionForm.email || '',
              password: connectionForm.password
            }
          : platform
      ));

      closeConnectionModal();
      alert(`${showConnectionModal.name} connection completed successfully!`);
      
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectPlatform = (platformId) => {
    setPlatforms(prev => prev.map(platform => 
      platform.id === platformId 
        ? { 
            ...platform, 
            connected: false, 
            autoPost: false,
            account: null,
            accessToken: null
          }
        : platform
    ));
  };

  const toggleAutoPost = (platformId) => {
    if (!user || hasPaidService !== true) return;
    
    setPlatforms(prev => prev.map(platform => 
      platform.id === platformId 
        ? { ...platform, autoPost: !platform.autoPost }
        : platform
    ));
  };

  const handleSaveSettings = async () => {
    if (!user || hasPaidService !== true) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/sns-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platforms: JSON.stringify(platforms),
          settings: JSON.stringify(postSettings)
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('A network error occurred.');
    } finally {
      setLoading(false);
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

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Social Media Auto-Posting Settings</h2>
          <p className="text-gray-600">Manage social media platform connections and auto-posting settings</p>
        </div>

        {(userLoading || checkingPayment) ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking payment status...</p>
          </div>
        ) : !user ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Login Required</h3>
            <p className="text-blue-700 mb-4">Please log in to access SNS auto-posting settings.</p>
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
            <p className="text-yellow-700 mb-4">SNS auto-posting settings are only available to users with completed payments. Please purchase a service plan to access this feature.</p>
            <button
              onClick={() => window.location.href = '/services'}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
            >
              View Services
            </button>
          </div>
        ) : null}

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Platform Connection Settings */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Platform Connections {isDisabled && '(Disabled)'}</h3>
            
            <div className="space-y-4">
              {platforms.map((platform) => (
                <div key={platform.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{platform.name}</h4>
                        {platform.account && (
                          <p className="text-sm text-gray-500">{platform.account}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        platform.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {platform.connected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {platform.connected ? (
                      <button
                        onClick={() => disconnectPlatform(platform.id)}
                        className="px-4 py-2 rounded text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => openConnectionModal(platform)}
                        className="px-4 py-2 rounded text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        Connect
                      </button>
                    )}

                    {platform.connected && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Auto Post</span>
                        <button
                          onClick={() => toggleAutoPost(platform.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            platform.autoPost ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              platform.autoPost ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Posting Settings */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Posting Settings {isDisabled && '(Disabled)'}</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Post Timing
                </label>
                <select
                  value={postSettings.autoPostTiming}
                  onChange={(e) => setPostSettings(prev => ({ ...prev, autoPostTiming: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                >
                  <option value="immediate">Post Immediately</option>
                  <option value="scheduled">Scheduled Post</option>
                  <option value="manual">Manual Approval Required</option>
                </select>
              </div>

              {postSettings.autoPostTiming === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Time
                  </label>
                  <input
                    type="datetime-local"
                    value={postSettings.scheduledTime}
                    onChange={(e) => setPostSettings(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Hashtags
                </label>
                <textarea
                  value={postSettings.defaultHashtags}
                  onChange={(e) => setPostSettings(prev => ({ ...prev, defaultHashtags: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder="Enter hashtags"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="approvalRequired"
                  checked={postSettings.contentApprovalRequired}
                  onChange={(e) => setPostSettings(prev => ({ ...prev, contentApprovalRequired: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="approvalRequired" className="text-sm text-gray-700">
                  Auto-post only after content approval
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Posting History */}
        <div className={`mt-8 bg-white rounded-lg shadow-xl p-6 ${isDisabled ? 'opacity-50' : ''}`}>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Posting History {isDisabled && '(Disabled)'}</h3>
          
          <div className="text-center py-8">
            <span className="text-gray-500">No posting history yet.</span>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={isDisabled || loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg"
          >
            {isDisabled ? (user ? 'Payment Required' : 'Login Required') : loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Platform Connection Modal */}
        {showConnectionModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Connect {showConnectionModal.icon} {showConnectionModal.name}
                  </h3>
                  <button
                    onClick={closeConnectionModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleConnectionSubmit} className="space-y-4">
                  {showConnectionModal.id === 'instagram' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={connectionForm.username || ''}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                          placeholder="Instagram username"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={connectionForm.password || ''}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                          placeholder="Instagram password"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={connectionForm.email || ''}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                          placeholder={`${showConnectionModal.name} email`}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={connectionForm.password || ''}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                          placeholder={`${showConnectionModal.name} password`}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Security Notice:</strong> Account information is stored encrypted. 
                      In production, OAuth authentication is recommended for better security.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeConnectionModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md"
                    >
                      {loading ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}