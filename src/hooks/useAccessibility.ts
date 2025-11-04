import React, { useEffect, useState, useCallback, useRef } from 'react'

interface AccessibilityPreferences {
  prefersReducedMotion: boolean
  prefersHighContrast: boolean
  prefersLargeText: boolean
  screenReaderActive: boolean
  keyboardNavigation: boolean
}

export const useAccessibility = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersLargeText: false,
    screenReaderActive: false,
    keyboardNavigation: false
  })

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateReducedMotion = () => {
      setPreferences(prev => ({
        ...prev,
        prefersReducedMotion: reducedMotionQuery.matches
      }))
    }
    updateReducedMotion()
    reducedMotionQuery.addEventListener('change', updateReducedMotion)

    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
    const updateHighContrast = () => {
      setPreferences(prev => ({
        ...prev,
        prefersHighContrast: highContrastQuery.matches
      }))
    }
    updateHighContrast()
    highContrastQuery.addEventListener('change', updateHighContrast)

    // Check for large text preference
    const largeTextQuery = window.matchMedia('(prefers-reduced-data: reduce)')
    const updateLargeText = () => {
      setPreferences(prev => ({
        ...prev,
        prefersLargeText: largeTextQuery.matches
      }))
    }
    updateLargeText()
    largeTextQuery.addEventListener('change', updateLargeText)

    // Detect screen reader
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasAriaLive = document.querySelector('[aria-live]')
      const hasScreenReaderText = document.querySelector('.sr-only, .screen-reader-text')
      const userAgent = navigator.userAgent.toLowerCase()
      const hasScreenReaderUA = /jaws|nvda|voiceover|talkback/.test(userAgent)
      
      setPreferences(prev => ({
        ...prev,
        screenReaderActive: !!(hasAriaLive || hasScreenReaderText || hasScreenReaderUA)
      }))
    }
    detectScreenReader()

    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setPreferences(prev => ({
          ...prev,
          keyboardNavigation: true
        }))
      }
    }

    const handleMouseDown = () => {
      setPreferences(prev => ({
        ...prev,
        keyboardNavigation: false
      }))
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      reducedMotionQuery.removeEventListener('change', updateReducedMotion)
      highContrastQuery.removeEventListener('change', updateHighContrast)
      largeTextQuery.removeEventListener('change', updateLargeText)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return preferences
}

export const useKeyboardNavigation = () => {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const itemsRef = useRef<HTMLElement[]>([])

  const registerItem = useCallback((element: HTMLElement | null, index: number) => {
    if (element) {
      itemsRef.current[index] = element
    }
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const items = itemsRef.current.filter(Boolean)
    if (items.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = prev < items.length - 1 ? prev + 1 : 0
          items[next]?.focus()
          return next
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = prev > 0 ? prev - 1 : items.length - 1
          items[next]?.focus()
          return next
        })
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        items[0]?.focus()
        break
      case 'End':
        e.preventDefault()
        const lastIndex = items.length - 1
        setFocusedIndex(lastIndex)
        items[lastIndex]?.focus()
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && items[focusedIndex]) {
          items[focusedIndex].click()
        }
        break
    }
  }, [focusedIndex])

  return {
    focusedIndex,
    registerItem,
    handleKeyDown
  }
}

export const useScreenReader = () => {
  const announceRef = useRef<HTMLDivElement>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority)
      announceRef.current.textContent = message
      
      // Clear after announcement
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  return {
    announce,
    announceRef
  }
}

export const useFocusManagement = () => {
  const focusRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [])

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return {
    saveFocus,
    restoreFocus,
    trapFocus,
    focusRef
  }
}

export const useAriaLiveRegion = () => {
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite')

  const announce = useCallback((text: string, level: 'polite' | 'assertive' = 'polite') => {
    setMessage(text)
    setPriority(level)
    
    // Clear message after announcement
    setTimeout(() => setMessage(''), 1000)
  }, [])

  return {
    announce,
    message
  }
}