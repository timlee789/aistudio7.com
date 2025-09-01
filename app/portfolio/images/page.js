'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ImagePortfolioPage() {
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
          // Filter for images only
          const imageItems = galleryData.items.filter(item => {
            // Check if it's an image based on mimetype or file extension
            const isImage = item.mimetype?.startsWith('image/') || 
                           item.path?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i);
            
            // Also check images array for any image files
            if (item.images && Array.isArray(item.images)) {
              const hasImages = item.images.some(img => 
                img.mimetype?.startsWith('image/') || 
                img.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
              );
              return isImage || hasImages;
            }
            
            return isImage;
          });
          
          setGalleryItems(imageItems);
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
      ? item.images.filter(img => 
          img.mimetype?.startsWith('image/') || 
          img.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
        )
      : [{ url: item.path, alt: item.title, mimetype: item.mimetype }].filter(img => 
          img.mimetype?.startsWith('image/') || 
          img.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
        );
    
    const safeImageIndex = Math.max(0, Math.min(imageIndex, images.length - 1));
    const currentImage = images[safeImageIndex];
    
    setModalImage({ 
      src: currentImage?.url || currentImage?.src || item.path, 
      alt: currentImage?.alt || item.title, 
      label: item.title ? item.title.toUpperCase() : 'IMAGE PORTFOLIO',
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
      const images = item?.images && Array.isArray(item.images) ? 
        item.images.filter(img => 
          img.mimetype?.startsWith('image/') || 
          img.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
        ) : [];
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
      const images = item?.images && Array.isArray(item.images) ? 
        item.images.filter(img => 
          img.mimetype?.startsWith('image/') || 
          img.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
        ) : [];
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
            borderTop: '4px solid #667eea', 
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
            <div style={{ marginBottom: '20px' }}>
              <a 
                href="/portfolio"
                style={{
                  color: '#666',
                  textDecoration: 'none',
                  fontSize: '16px',
                  transition: 'color 0.2s'
                }}
              >
                ← Back to Portfolio
              </a>
            </div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: '#333', 
              marginBottom: '10px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>
              Image Portfolio
            </h1>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#666',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}>
              Discover our stunning visual creations and graphic design work
            </p>
          </div>

          {/* Portfolio Stats */}
          <div style={{ textAlign: 'center', marginBottom: '40px', padding: '0 20px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', padding: '16px', display: 'inline-block', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
              <span style={{ color: '#666', fontSize: '1rem', fontWeight: '500' }}>
                Showing {startIndex + 1}-{Math.min(endIndex, galleryItems.length)} of {galleryItems.length} image items
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
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Image Container */}
                <div style={{ 
                  position: 'relative',
                  aspectRatio: '16/9',
                  overflow: 'hidden'
                }} onClick={() => openModal(item)}>
                  {(() => {
                    const images = item.images && Array.isArray(item.images) && item.images.length > 0 
                      ? item.images.filter(img => 
                          img.mimetype?.startsWith('image/') || 
                          img.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
                        )
                      : [{ url: item.path, alt: item.title, mimetype: item.mimetype }];
                    const currentIndex = carouselStates[item.id] || 0;
                    const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
                    const currentImage = images[safeIndex];
                    
                    return (
                      <img 
                        src={currentImage?.url || currentImage?.src || item.path || ''} 
                        alt={currentImage?.alt || item.title || 'Image Portfolio Item'} 
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
                  
                  {/* Image Counter */}
                  {(() => {
                    const images = item.images && Array.isArray(item.images) && item.images.length > 0 
                      ? item.images.filter(img => 
                          img.mimetype?.startsWith('image/') || 
                          img.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
                        )
                      : [];
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
                  
                  {/* Carousel Navigation */}
                  {(() => {
                    const images = item.images && Array.isArray(item.images) && item.images.length > 0 
                      ? item.images.filter(img => 
                          img.mimetype?.startsWith('image/') || 
                          img.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
                        )
                      : [];
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
                          onMouseOver={(e) => e.target.parentElement.parentElement.addEventListener('mouseenter', () => e.target.style.opacity = '1')}
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
                          onMouseOver={(e) => e.target.parentElement.parentElement.addEventListener('mouseenter', () => e.target.style.opacity = '1')}
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
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
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
                        background: currentPage === pageNum 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
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
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
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
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>No Image Portfolio Items</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  We're currently updating our image portfolio. Please check back soon to see our latest visual work!
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
    </div>
  );
}