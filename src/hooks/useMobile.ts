import { useState, useEffect, useMemo, useCallback } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  orientation: 'portrait' | 'landscape';
  viewportHeight: number;
  viewportWidth: number;
  devicePixelRatio: number;
  hasNotch: boolean;
}

export function useMobile(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        isIOS: false,
        isAndroid: false,
        screenSize: 'lg',
        orientation: 'landscape',
        viewportHeight: 0,
        viewportWidth: 0,
        devicePixelRatio: 1,
        hasNotch: false
      };
    }

    return getDeviceInfo();
  });

  // Memoize the update function to prevent unnecessary re-renders
  const updateDeviceInfo = useCallback(() => {
    const newDeviceInfo = getDeviceInfo();
    setDeviceInfo(prevInfo => {
      // Only update if there are actual changes to prevent unnecessary re-renders
      if (JSON.stringify(prevInfo) !== JSON.stringify(newDeviceInfo)) {
        return newDeviceInfo;
      }
      return prevInfo;
    });
  }, []);

  useEffect(() => {
    // Listeners para mudanças
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, [updateDeviceInfo]);

  // Memoize the return value to ensure stable reference
  return useMemo(() => deviceInfo, [deviceInfo]);
}

function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Detecção de dispositivo
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || width < 768;
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent) || (width >= 768 && width < 1024);
  const isDesktop = !isMobile && !isTablet;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Detecção de OS
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);
  
  // Tamanho da tela
  let screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  if (width < 480) {
    screenSize = 'xs';
  } else if (width < 768) {
    screenSize = 'sm';
  } else if (width < 1024) {
    screenSize = 'md';
  } else if (width < 1280) {
    screenSize = 'lg';
  } else {
    screenSize = 'xl';
  }
  
  // Orientação
  const orientation = height > width ? 'portrait' : 'landscape';
  
  // Detecção de notch (aproximada)
  const hasNotch = isIOS && (
    // iPhone X, XS, XR, 11, 12, 13, 14 series
    (width === 375 && height === 812) || // iPhone X, XS, 11 Pro
    (width === 414 && height === 896) || // iPhone XR, 11
    (width === 390 && height === 844) || // iPhone 12, 13 Pro
    (width === 428 && height === 926) || // iPhone 12, 13 Pro Max
    (width === 393 && height === 852) || // iPhone 14 Pro
    (width === 430 && height === 932)    // iPhone 14 Pro Max
  );

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isIOS,
    isAndroid,
    screenSize,
    orientation,
    viewportHeight: height,
    viewportWidth: width,
    devicePixelRatio: window.devicePixelRatio || 1,
    hasNotch
  };
}

// Otimizações adicionais

// Hook para orientação
export const useOrientation = () => {
  const [orientation, setOrientation] = useState(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');

  useEffect(() => {
    const handleOrientationChange = () => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      setOrientation(newOrientation);
    };

    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
};

// Hook para Safe Area (iOS)
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  useEffect(() => {
    const computeSafeArea = () => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top').replace('px', '')) || 0,
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom').replace('px', '')) || 0,
        left: parseInt(style.getPropertyValue('--safe-area-inset-left').replace('px', '')) || 0,
        right: parseInt(style.getPropertyValue('--safe-area-inset-right').replace('px', '')) || 0,
      });
    };

    computeSafeArea();
    window.addEventListener('resize', computeSafeArea);

    return () => window.removeEventListener('resize', computeSafeArea);
  }, []);

  return safeArea;
};

export default useMobile;