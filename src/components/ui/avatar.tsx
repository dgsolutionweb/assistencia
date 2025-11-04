import React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  className?: string
  children?: React.ReactNode
}

interface AvatarImageProps {
  src?: string
  alt?: string
  className?: string
}

interface AvatarFallbackProps {
  className?: string
  children?: React.ReactNode
}

export function Avatar({ className, children }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
    >
      {children}
    </div>
  )
}

export function AvatarImage({ src, alt, className }: AvatarImageProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  if (!src || imageError) {
    return null
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("aspect-square h-full w-full", className)}
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageError(true)}
      style={{ display: imageLoaded ? 'block' : 'none' }}
    />
  )
}

export function AvatarFallback({ className, children }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium",
        className
      )}
    >
      {children}
    </div>
  )
}