import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  fallback?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  fallback,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setIsError(true)
    onError?.()
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      <motion.div
        className="absolute inset-0 bg-gray-200 dark:bg-gray-700"
        animate={{ opacity: isLoaded ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {placeholder ? (
          <img
            src={placeholder}
            alt=""
            className="w-full h-full object-cover blur-sm"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </motion.div>

      {/* Main Image */}
      {isInView && !isError && (
        <motion.img
          ref={imgRef}
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Error Fallback */}
      {isError && fallback && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {fallback}
        </motion.div>
      )}
    </div>
  )
}