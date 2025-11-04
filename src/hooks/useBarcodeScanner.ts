import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { HapticService } from '@/services/HapticService'

interface ScanResult {
  type: 'barcode' | 'qr' | 'text' | 'product'
  data: string
  confidence?: number
  productInfo?: {
    name?: string
    brand?: string
    category?: string
    description?: string
    price?: string
  }
}

interface UseBarcodeScanner {
  isOpen: boolean
  isScanning: boolean
  lastResult: ScanResult | null
  openScanner: () => void
  closeScanner: () => void
  handleScanResult: (result: ScanResult) => void
  clearResult: () => void
}

export function useBarcodeScanner(): UseBarcodeScanner {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)

  const openScanner = useCallback(() => {
    setIsOpen(true)
    setIsScanning(true)
    HapticService.trigger('light')
  }, [])

  const closeScanner = useCallback(() => {
    setIsOpen(false)
    setIsScanning(false)
    HapticService.trigger('light')
  }, [])

  const handleScanResult = useCallback((result: ScanResult) => {
    setLastResult(result)
    setIsScanning(false)
    
    // Feedback haptic baseado no tipo de resultado
    if (result.confidence && result.confidence > 0.8) {
      HapticService.success()
    } else {
      HapticService.trigger('medium')
    }

    // Toast com informações do resultado
    if (result.type === 'product' && result.productInfo?.name) {
      toast.success(`Produto detectado: ${result.productInfo.name}`)
    } else if (result.type === 'barcode') {
      toast.success(`Código de barras: ${result.data}`)
    } else if (result.type === 'qr') {
      toast.success(`QR Code detectado`)
    } else {
      toast.success(`Texto detectado: ${result.data.substring(0, 50)}...`)
    }
  }, [])

  const clearResult = useCallback(() => {
    setLastResult(null)
  }, [])

  return {
    isOpen,
    isScanning,
    lastResult,
    openScanner,
    closeScanner,
    handleScanResult,
    clearResult
  }
}

// Hook para integração com produtos/peças
export function useProductScanner() {
  const scanner = useBarcodeScanner()

  const scanForProduct = useCallback(async (onProductFound?: (productData: any) => void) => {
    scanner.openScanner()
    
    // Aguardar resultado
    return new Promise((resolve) => {
      const checkResult = () => {
        if (scanner.lastResult) {
          const result = scanner.lastResult
          
          if (result.type === 'product' || result.type === 'barcode') {
            const productData = {
              barcode: result.data,
              name: result.productInfo?.name || '',
              brand: result.productInfo?.brand || '',
              category: result.productInfo?.category || '',
              description: result.productInfo?.description || '',
              estimatedPrice: result.productInfo?.price || ''
            }
            
            onProductFound?.(productData)
            resolve(productData)
          } else {
            // Se não for produto, ainda assim retornar os dados básicos
            const basicData = {
              barcode: result.data,
              name: '',
              brand: '',
              category: '',
              description: result.data,
              estimatedPrice: ''
            }
            
            onProductFound?.(basicData)
            resolve(basicData)
          }
          
          scanner.clearResult()
        } else {
          setTimeout(checkResult, 100)
        }
      }
      
      checkResult()
    })
  }, [scanner])

  return {
    ...scanner,
    scanForProduct
  }
}

export default useBarcodeScanner