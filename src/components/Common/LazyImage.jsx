import React, { useState, useEffect } from 'react';

const LazyImage = ({ src, alt, className, fallbackIcon: FallbackIcon, fallbackClassName }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    // Reset states when src changes
    setLoaded(false);
    setError(false);
    
    if (!src) {
      setError(true);
      return;
    }

    // Create new image object to preload
    const img = new Image();
    img.src = src;
    setImageSrc(src);
    
    img.onload = () => {
      setLoaded(true);
    };
    
    img.onerror = () => {
      setError(true);
    };
    
    return () => {
      // Clean up
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (error || !src) {
    return FallbackIcon ? (
      <div className={`flex items-center justify-center bg-gray-100 ${fallbackClassName || className}`}>
        <FallbackIcon className="text-gray-400 text-5xl" />
      </div>
    ) : (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
          <div className="animate-pulse w-full h-full bg-gray-200"></div>
        </div>
      )}
      <img 
        src={imageSrc} 
        alt={alt || "Image"} 
        className={`${className} ${loaded ? 'block' : 'hidden'}`} 
        loading="lazy"
      />
    </>
  );
};

export default LazyImage;
