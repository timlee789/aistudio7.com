'use client'
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [isScrolling, setIsScrolling] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState({ src: '', alt: '', label: '' });
  const [galleryItems, setGalleryItems] = useState([]);
  const [bannerData, setBannerData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const threshold = windowHeight * 0.1;
      
      setIsScrolling(scrollTop > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Load gallery items and banner from database
    const loadData = async () => {
      try {
        // Load gallery items
        const galleryResponse = await fetch('/api/gallery');
        const galleryData = await galleryResponse.json();
        
        if (galleryResponse.ok) {
          setGalleryItems(galleryData.items);
        } else {
          console.error('Failed to load gallery items:', galleryData.error);
          // Fallback to static items if API fails
          setGalleryItems(getStaticGalleryItems());
        }

        // Load banner data
        const bannerResponse = await fetch('/api/banner');
        const bannerData = await bannerResponse.json();
        
        if (bannerResponse.ok) {
          setBannerData(bannerData.banner);
        } else {
          console.error('Failed to load banner:', bannerData.error);
        }
      } catch (error) {
        console.error('Data loading error:', error);
        // Fallback to static items if API fails
        setGalleryItems(getStaticGalleryItems());
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
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
  }, [modalOpen]);

  const openModal = (src, alt, label) => {
    setModalImage({ src, alt, label });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalImage({ src: '', alt: '', label: '' });
  };

  const getStaticGalleryItems = () => [
    { id: 1, path: "data:image/svg+xml,%3Csvg width='400' height='250' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='250' fill='%23f8f9fa'/%3E%3Cg%3E%3Ccircle cx='150' cy='80' r='15' fill='%23e74c3c'/%3E%3Cpath d='M100 120 Q 200 100 300 120' stroke='%23c0392b' stroke-width='3' fill='none'/%3E%3Ccircle cx='120' cy='140' r='20' fill='%23fff'/%3E%3Ccircle cx='180' cy='130' r='20' fill='%23fff'/%3E%3Ccircle cx='250' cy='140' r='20' fill='%23fff'/%3E%3Ccircle cx='280' cy='80' r='15' fill='%23e74c3c'/%3E%3Cpath d='M150 60 Q 180 50 220 65' fill='%2327ae60'/%3E%3C/g%3E%3C/svg%3E", title: "Food ingredients" },
    { id: 2, path: "data:image/svg+xml,%3Csvg width='400' height='250' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='sky' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' style='stop-color:%2387ceeb'/%3E%3Cstop offset='100%25' style='stop-color:%23e0f6ff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='250' fill='url(%23sky)'/%3E%3Ctext x='200' y='130' font-family='Arial, sans-serif' font-size='48' font-weight='bold' text-anchor='middle' fill='%23fff' style='text-shadow: 2px 2px 4px rgba(0,0,0,0.3)'%3EWhisk%3C/text%3E%3C/svg%3E", title: "Whisk logo" },
    { id: 3, path: "data:image/svg+xml,%3Csvg width='400' height='250' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='250' fill='%238b4513'/%3E%3Ccircle cx='120' cy='80' r='25' fill='%23daa520'/%3E%3Ccircle cx='200' cy='120' r='30' fill='%23ffd700'/%3E%3Ccircle cx='280' cy='90' r='20' fill='%23ff6b6b'/%3E%3Ccircle cx='150' cy='180' r='15' fill='%234ecdc4'/%3E%3Ccircle cx='250' cy='160' r='18' fill='%23ff8c94'/%3E%3Crect x='80' y='60' width='80' height='100' rx='10' fill='%23d4a574'/%3E%3C/svg%3E", title: "Toys and objects" }
  ];

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


        .gallery-container {
          padding: 20px 40px 80px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 50px;
          perspective: 1000px;
        }

        .card {
          aspect-ratio: 16/10;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          transition: transform 0.6s ease-out, box-shadow 0.3s ease;
          transform-style: preserve-3d;
          position: relative;
          cursor: pointer;
        }

        .card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .card-label {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          text-transform: uppercase;
        }

        .gallery-grid .card {
          transform: rotate(20deg);
        }

        .straightened .card {
          transform: scale(1.05) rotate(0deg) !important;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4) !important;
        }

        .gallery-grid .card:hover {
          transform: scale(1.05) rotate(0deg);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
          z-index: 10;
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          transition: opacity 0.3s ease;
        }

        .modal-content {
          position: relative;
          max-width: 80vw;
          max-height: 80vh;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          transform: scale(0.8);
          transition: transform 0.3s ease;
          z-index: 10000;
        }

        .modal.active .modal-content {
          transform: scale(1);
        }

        .modal-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .modal-card-label {
          position: absolute;
          top: 15px;
          left: 15px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          text-transform: uppercase;
          z-index: 10002;
        }

        .modal-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.3s ease;
          z-index: 10003;
        }

        .modal-close:hover {
          background: rgba(0, 0, 0, 0.9);
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
          
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          
          .gallery-container {
            padding: 20px 20px 60px 20px;
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
          
          .gallery-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .gallery-container {
            padding: 15px 15px 50px 15px;
          }
          
          .nav-content {
            height: 3rem;
          }
          
          .logo-section h1 {
            font-size: 1.125rem !important;
          }
          
          .modal-content {
            max-width: 95vw;
            max-height: 85vh;
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

      <div className="page-title">
        <p className="subtitle">Empowering small businesses and local companies with AI-driven ad creation, SNS marketing, and strategic brand growth support</p>
      </div>
      
      {/* Our Works Section Title */}
      <div className="section-title">
        <h2>Our Works</h2>
      </div>
      
      <div className="gallery-container">
        <div className={`gallery-grid ${isScrolling ? 'straightened' : ''}`}>
          {galleryItems.map((item, index) => (
            <div 
              key={item.id || index}
              className="card" 
              onClick={() => openModal(item.path, item.title, item.title.toUpperCase())}
            >
              <div className="card-label">{item.title.toUpperCase()}</div>
              <img src={item.path} alt={item.title} />
            </div>
          ))}
        </div>
      </div>

      {/* Modal for popup */}
      {modalOpen && (
        <div className={`modal ${modalOpen ? 'active' : ''}`} onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <div className="modal-card-label">{modalImage.label}</div>
            <img className="modal-image" src={modalImage.src} alt={modalImage.alt} />
          </div>
        </div>
      )}
    </div>
  );
}
