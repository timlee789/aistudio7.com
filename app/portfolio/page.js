'use client';

import { useAuth } from '../../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PortfolioPage() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState({ src: '', alt: '', label: '', currentIndex: 0, images: [] });
  const [galleryItems, setGalleryItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [carouselStates, setCarouselStates] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const itemsPerPage = 20;

  useEffect(() => {
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f4d03f'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #4f46e5', 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px', 
            animation: 'spin 2s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f4d03f',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Navigation */}
      <nav style={{ background: '#f4d03f', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', height: '4rem' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <a href="/" style={{ textDecoration: 'none' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5', margin: 0, fontFamily: 'Myriad Pro, Arial, sans-serif', cursor: 'pointer' }}>AiStudio7.com</h1>
              </a>
            </div>
            
            {/* Desktop Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <a 
                href="/" 
                style={{
                  fontWeight: pathname === '/' ? 'bold' : 'normal',
                  color: pathname === '/' ? '#4f46e5' : '#374151',
                  transition: 'color 0.3s ease',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Home
              </a>
              <a 
                href="/services"
                style={{
                  fontWeight: pathname === '/services' ? 'bold' : 'normal',
                  color: pathname === '/services' ? '#4f46e5' : '#374151',
                  transition: 'color 0.3s ease',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Services
              </a>
              <a 
                href="/portfolio"
                style={{
                  fontWeight: pathname.startsWith('/portfolio') ? 'bold' : 'normal',
                  color: pathname.startsWith('/portfolio') ? '#4f46e5' : '#374151',
                  transition: 'color 0.3s ease',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Portfolio
              </a>
              <a 
                href="/client-portal"
                style={{
                  fontWeight: pathname === '/client-portal' ? 'bold' : 'normal',
                  color: pathname === '/client-portal' ? '#4f46e5' : '#374151',
                  transition: 'color 0.3s ease',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                My Portal
              </a>
              <a 
                href="/service-request"
                style={{
                  fontWeight: pathname === '/service-request' ? 'bold' : 'normal',
                  color: pathname === '/service-request' ? '#4f46e5' : '#374151',
                  transition: 'color 0.3s ease',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Service Request
              </a>
              <a 
                href="/sns-settings"
                style={{
                  fontWeight: pathname === '/sns-settings' ? 'bold' : 'normal',
                  color: pathname === '/sns-settings' ? '#4f46e5' : '#374151',
                  transition: 'color 0.3s ease',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                SNS Settings
              </a>
              {user && user.role === 'ADMIN' && (
                <a 
                  href="/admin"
                  style={{
                    fontWeight: pathname === '/admin' ? 'bold' : 'normal',
                    color: pathname === '/admin' ? '#4f46e5' : '#374151',
                    transition: 'color 0.3s ease',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    textDecoration: 'none'
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
                <a href="/login" style={{
                  color: '#374151',
                  transition: 'color 0.3s ease',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}>Login</a>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                cursor: 'pointer',
                color: '#374151'
              }}
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

      {/* Main Content */}
      <main style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Page Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: '#333', 
              marginBottom: '10px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>
              Our Portfolio
            </h1>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#666',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}>
              Explore our creative work across different media formats
            </p>
          </div>

          {/* Filter Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginBottom: '40px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => window.location.href = '/portfolio/images'}
              style={{
                background: 'white',
                color: '#4f46e5',
                border: '2px solid #4f46e5',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#4f46e5';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#4f46e5';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              🖼️ Image Portfolio
            </button>
            
            <button
              onClick={() => window.location.href = '/portfolio/videos'}
              style={{
                background: 'white',
                color: '#9333ea',
                border: '2px solid #9333ea',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#9333ea';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(147, 51, 234, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#9333ea';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              🎬 Video Portfolio
            </button>
          </div>

          {/* Portfolio Stats */}
          <div style={{ textAlign: 'center', marginBottom: '40px', padding: '0 20px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', padding: '16px', display: 'inline-block', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
              <span style={{ color: '#666', fontSize: '1rem', fontWeight: '500' }}>
                Showing {startIndex + 1}-{Math.min(endIndex, galleryItems.length)} of {galleryItems.length} portfolio items
              </span>
              {totalPages > 1 && (
                <span style={{ color: '#666', fontSize: '1rem', fontWeight: '500', marginLeft: '16px' }}>
                  • Page {currentPage} of {totalPages}
                </span>
              )}
            </div>
          </div>

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
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Media Container */}
                <div style={{ 
                  position: 'relative',
                  aspectRatio: '16/9',
                  overflow: 'hidden'
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
                            transition: 'opacity 0.2s'
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
                            transition: 'opacity 0.2s'
                          }}
                        >
                          ›
                        </button>
                      </>
                    );
                  })()}
                </div>

                {/* Content */}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold', 
                    color: '#333', 
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    {item.title || 'Untitled'}
                  </h3>
                  {item.description && (
                    <p style={{ 
                      color: '#666', 
                      fontSize: '0.9rem',
                      lineHeight: '1.5'
                    }}>
                      {item.description}
                    </p>
                  )}
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
                  We're currently updating our portfolio. Please check back soon to see our latest work!
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px'
        }}>
          <a 
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: 'white',
              fontSize: '24px',
              textDecoration: 'none',
              fontWeight: pathname === '/' ? 'bold' : 'normal'
            }}
          >
            Home
          </a>
          <a 
            href="/services"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: 'white',
              fontSize: '24px',
              textDecoration: 'none',
              fontWeight: pathname === '/services' ? 'bold' : 'normal'
            }}
          >
            Services
          </a>
          <a 
            href="/portfolio"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: 'white',
              fontSize: '24px',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/portfolio') ? 'bold' : 'normal'
            }}
          >
            Portfolio
          </a>
          <a 
            href="/client-portal"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: 'white',
              fontSize: '24px',
              textDecoration: 'none',
              fontWeight: pathname === '/client-portal' ? 'bold' : 'normal'
            }}
          >
            Client Portal
          </a>
          
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '30px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}