import React from 'react';

// Componente para lazy loading de imagens
export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IiNhYWEiPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  onLoad,
  onError
}: LazyImageProps) {
  return (
    <img
      data-src={src}
      src={placeholder}
      alt={alt}
      className={`lazy ${className}`}
      onLoad={onLoad}
      onError={onError}
      loading="lazy"
    />
  );
}