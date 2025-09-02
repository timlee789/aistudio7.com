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

export default function Home() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [bannerData, setBannerData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState({ src: '', alt: '', label: '', currentIndex: 0, images: [] });
  const [galleryItems, setGalleryItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [carouselStates, setCarouselStates] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const itemsPerPage = 20;


  useEffect(() => {
    // Load banner data from database
    const loadBannerData = async () => {
      try {
        const bannerResponse = await fetch('/api/banner');
        const bannerData = await bannerResponse.json();
        
        if (bannerResponse.ok) {
          setBannerData(bannerData.banner);
        } else {
          console.error('Failed to load banner:', bannerData.error);
        }
      } catch (error) {
        console.error('Banner loading error:', error);
      }
    };

    loadBannerData();

    // Load gallery data
    const loadGalleryData = async () => {
      try {
        const galleryResponse = await fetch('/api/gallery');
        const galleryData = await galleryResponse.json();
        
        if (galleryResponse.ok) {
          setGalleryItems(galleryData.items);
        } else {
          console.error('Failed to load gallery items:', galleryData.error);
          setGalleryItems([]);
        }
      } catch (error) {
        console.error('Gallery loading error:', error);
        setGalleryItems([]);
      }
    };

    loadGalleryData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        prevModalImage();
      } else if (e.key === 'ArrowRight') {
        nextModalImage();
      }
    };

    if (modalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [modalOpen, modalImage]);

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

  const openModal = (item, imageIndex = 0) => {
    const images = item.images && Array.isArray(item.images) && item.images.length > 0 
      ? item.images 
      : [{ url: item.path, alt: item.title, mimetype: item.mimetype }];
    
    const safeImageIndex = Math.max(0, Math.min(imageIndex, images.length - 1));
    const currentImage = images[safeImageIndex];
    
    setModalImage({ 
      src: currentImage?.url || currentImage?.src || item.path, 
      alt: currentImage?.alt || item.title, 
      label: item.title ? item.title.toUpperCase() : 'PORTFOLIO ITEM',
      currentIndex: safeImageIndex,
      images: images,
      mimetype: currentImage?.mimetype || item.mimetype
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalImage({ src: '', alt: '', label: '', currentIndex: 0, images: [] });
  };

  const nextModalImage = () => {
    if (modalImage.images && modalImage.images.length > 1) {
      const nextIndex = modalImage.currentIndex < modalImage.images.length - 1 
        ? modalImage.currentIndex + 1 
        : 0;
      const nextImage = modalImage.images[nextIndex];
      if (nextImage) {
        setModalImage(prev => ({
          ...prev,
          src: nextImage.url || nextImage.src || prev.src,
          alt: nextImage.alt || prev.alt,
          currentIndex: nextIndex,
          mimetype: nextImage.mimetype || prev.mimetype
        }));
      }
    }
  };

  const prevModalImage = () => {
    if (modalImage.images && modalImage.images.length > 1) {
      const prevIndex = modalImage.currentIndex > 0 
        ? modalImage.currentIndex - 1 
        : modalImage.images.length - 1;
      const prevImage = modalImage.images[prevIndex];
      if (prevImage) {
        setModalImage(prev => ({
          ...prev,
          src: prevImage.url || prevImage.src || prev.src,
          alt: prevImage.alt || prev.alt,
          currentIndex: prevIndex,
          mimetype: prevImage.mimetype || prev.mimetype
        }));
      }
    }
  };

  const handleCarouselNext = (itemId, e) => {
    e.stopPropagation();
    setCarouselStates(prev => {
      const currentIndex = prev[itemId] || 0;
      const item = galleryItems.find(item => item.id === itemId);
      const images = item?.images && Array.isArray(item.images) ? item.images : [];
      const maxIndex = Math.max(0, images.length - 1);
      return {
        ...prev,
        [itemId]: currentIndex < maxIndex ? currentIndex + 1 : 0
      };
    });
  };

  const handleCarouselPrev = (itemId, e) => {
    e.stopPropagation();
    setCarouselStates(prev => {
      const currentIndex = prev[itemId] || 0;
      const item = galleryItems.find(item => item.id === itemId);
      const images = item?.images && Array.isArray(item.images) ? item.images : [];
      const maxIndex = Math.max(0, images.length - 1);
      return {
        ...prev,
        [itemId]: currentIndex > 0 ? currentIndex - 1 : maxIndex
      };
    });
  };

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && modalImage.images && modalImage.images.length > 1) {
      nextModalImage();
    }
    if (isRightSwipe && modalImage.images && modalImage.images.length > 1) {
      prevModalImage();
    }
  };

  const totalPages = Math.ceil(galleryItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = galleryItems.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          padding: 10px 20px 60px 20px;
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

        .main-banner {
          width: 100%;
          max-width: 1200px;
          height: 450px;
          margin: 40px auto 10px auto;
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .main-banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .main-banner-placeholder {
          width: 100%;
          height: 100%;
          background: #e0e0e0;
          border: 2px dashed #999;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .main-banner-placeholder::after {
          content: 'Main Banner Area (450px height)';
          color: #999;
          font-size: 1.2rem;
          font-weight: 500;
          position: absolute;
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
          .main-banner {
            height: 300px;
            margin: 20px auto 10px auto;
          }
          
          .page-title {
            padding: 10px 20px 40px 20px;
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
          .main-banner {
            height: 250px;
            margin: 15px auto 10px auto;
          }
          
          .page-title {
            padding: 10px 15px 30px 15px;
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
      
      {/* Main Banner */}
      <div className="main-banner">
        {bannerData ? (
          <img
            src={bannerData.path}
            alt={bannerData.title || 'Main Banner'}
            className="main-banner-image"
          />
        ) : (
          <div className="main-banner-placeholder">
            {/* Blank banner placeholder */}
          </div>
        )}
      </div>

      {/* Main Content */}
      <main style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Portfolio Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '30px',
            marginBottom: '60px'
          }}>
            {currentItems.map((item, index) => (
              <div 
                key={item.id || index}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.15)';
                  // Show carousel arrows on hover
                  const arrows = e.currentTarget.querySelectorAll('button');
                  arrows.forEach(arrow => arrow.style.opacity = '1');
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  // Hide carousel arrows when not hovering
                  const arrows = e.currentTarget.querySelectorAll('button');
                  arrows.forEach(arrow => arrow.style.opacity = '0');
                }}
              >
                {/* Media Container */}
                <div style={{ 
                  position: 'relative',
                  aspectRatio: '1/1',
                  overflow: 'hidden',
                  height: '100%',
                  width: '100%'
                }} onClick={() => openModal(item)}>
                  {(() => {
                    const images = item.images && Array.isArray(item.images) && item.images.length > 0 
                      ? item.images 
                      : [{ url: item.path, alt: item.title, mimetype: item.mimetype }];
                    const currentIndex = carouselStates[item.id] || 0;
                    const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
                    const currentImage = images[safeIndex];
                    
                    const isVideo = currentImage?.mimetype?.startsWith('video/') || 
                                   item.mimetype?.startsWith('video/') ||
                                   (currentImage?.url || currentImage?.src || item.path)?.match(/\.(mp4|webm|ogg|mov|avi)$/i);
                    
                    return isVideo ? (
                      <>
                        <video 
                          src={currentImage?.url || currentImage?.src || item.path || ''} 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          muted
                          preload="metadata"
                          onError={(e) => {
                            e.target.src = item.path || '';
                          }}
                        />
                        {/* Play Icon Overlay */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(0, 0, 0, 0.7)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '24px',
                          opacity: 0.8,
                          transition: 'opacity 0.2s'
                        }}>
                          ▶
                        </div>
                      </>
                    ) : (
                      <img 
                        src={currentImage?.url || currentImage?.src || item.path || ''} 
                        alt={currentImage?.alt || item.title || 'Portfolio Item'} 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.src = item.path || '';
                        }}
                      />
                    );
                  })()}
                  
                  {/* Media Counter */}
                  {(() => {
                    const images = item.images && Array.isArray(item.images) && item.images.length > 0 
                      ? item.images : [];
                    return images.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {(carouselStates[item.id] || 0) + 1} / {images.length}
                      </div>
                    );
                  })()}
                  
                  {/* Media Type Badge */}
                  {(() => {
                    const currentImage = item.images && Array.isArray(item.images) && item.images.length > 0 
                      ? item.images[carouselStates[item.id] || 0]
                      : { mimetype: item.mimetype };
                    const isVideo = currentImage?.mimetype?.startsWith('video/') || 
                                   item.mimetype?.startsWith('video/') ||
                                   (currentImage?.url || currentImage?.src || item.path)?.match(/\.(mp4|webm|ogg|mov|avi)$/i);
                    
                    return (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: isVideo ? '#9333ea' : '#4f46e5',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {isVideo ? '🎬 Video' : '🖼️ Image'}
                      </div>
                    );
                  })()}
                  
                  {/* Carousel Navigation */}
                  {(() => {
                    const images = item.images && Array.isArray(item.images) && item.images.length > 0 
                      ? item.images : [];
                    return images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => handleCarouselPrev(item.id, e)}
                          style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            zIndex: 10
                          }}
                        >
                          ‹
                        </button>
                        
                        <button 
                          onClick={(e) => handleCarouselNext(item.id, e)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            zIndex: 10
                          }}
                        >
                          ›
                        </button>
                      </>
                    );
                  })()}
                </div>

              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <div style={{ display: 'inline-flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Previous Button */}
                {currentPage > 1 && (
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    style={{
                      background: 'white',
                      color: '#333',
                      border: '1px solid #e5e7eb',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    Previous
                  </button>
                )}

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      style={{
                        background: currentPage === pageNum ? '#4f46e5' : 'white',
                        color: currentPage === pageNum ? 'white' : '#333',
                        border: '1px solid #e5e7eb',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Button */}
                {currentPage < totalPages && (
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    style={{
                      background: 'white',
                      color: '#333',
                      border: '1px solid #e5e7eb',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {galleryItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', padding: '40px', maxWidth: '500px', margin: '0 auto', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>No Portfolio Items</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  We&apos;re currently updating our portfolio. Please check back soon to see our latest work!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal for popup */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={closeModal}>
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <button 
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '30px',
                cursor: 'pointer',
                zIndex: 10010
              }}
            >
              ×
            </button>
            <div style={{
              position: 'absolute',
              top: '-40px',
              left: '0',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {modalImage.label}
            </div>
            
            {modalImage.images && modalImage.images.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {(modalImage.currentIndex || 0) + 1} / {modalImage.images.length || 1}
              </div>
            )}
            
            {(() => {
              const currentImage = modalImage.images && modalImage.images.length > 0 
                ? modalImage.images[modalImage.currentIndex] 
                : { src: modalImage.src, mimetype: modalImage.mimetype };
              
              const isVideo = currentImage?.mimetype?.startsWith('video/') || 
                             modalImage.mimetype?.startsWith('video/') ||
                             modalImage.src?.match(/\.(mp4|webm|ogg|mov|avi)$/i);
              
              return isVideo ? (
                <video 
                  src={modalImage.src}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    borderRadius: '8px'
                  }}
                  controls
                  autoPlay={false}
                />
              ) : (
                <img 
                  src={modalImage.src} 
                  alt={modalImage.alt}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                  draggable="false"
                />
              );
            })()}
            
            {modalImage.images && modalImage.images.length > 1 && (
              <>
                <button 
                  onClick={prevModalImage}
                  style={{
                    position: 'absolute',
                    left: '-50px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10005
                  }}
                >
                  ‹
                </button>
                
                <button 
                  onClick={nextModalImage}
                  style={{
                    position: 'absolute',
                    right: '-50px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10005
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}


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
