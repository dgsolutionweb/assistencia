import { BrowserMultiFormatReader, Result } from '@zxing/library'
import { HapticService } from './HapticService'

export class BarcodeService {
  private static reader: BrowserMultiFormatReader | null = null
  private static stream: MediaStream | null = null

  static async initialize(): Promise<BrowserMultiFormatReader> {
    if (!this.reader) {
      this.reader = new BrowserMultiFormatReader()
    }
    return this.reader
  }

  static async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'videoinput')
    } catch (error) {
      console.error('Error getting video devices:', error)
      return []
    }
  }

  static async startScanning(
    videoElement: HTMLVideoElement,
    onResult: (result: string) => void,
    onError?: (error: Error) => void,
    deviceId?: string
  ): Promise<void> {
    try {
      const reader = await this.initialize()
      
      // Get available video devices
      const videoDevices = await this.getVideoDevices()
      
      // Use back camera if available, otherwise use first available camera
      const selectedDeviceId = deviceId || 
        videoDevices.find(device => device.label.toLowerCase().includes('back'))?.deviceId ||
        videoDevices[0]?.deviceId

      if (!selectedDeviceId) {
        throw new Error('Nenhuma câmera disponível')
      }

      // Start scanning
      reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoElement,
        (result: Result | null, error?: Error) => {
          if (result) {
            HapticService.success()
            onResult(result.getText())
          }
          if (error && onError) {
            onError(error)
          }
        }
      )

      // Store video stream for cleanup
      this.stream = videoElement.srcObject as MediaStream

    } catch (error) {
      console.error('Error starting barcode scanner:', error)
      HapticService.error()
      if (onError) {
        onError(error as Error)
      }
    }
  }

  static async stopScanning(): Promise<void> {
    try {
      if (this.reader) {
        this.reader.reset()
      }

      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop())
        this.stream = null
      }
    } catch (error) {
      console.error('Error stopping barcode scanner:', error)
    }
  }

  static async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera
        } 
      })
      
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop())
      
      return true
    } catch (error) {
      console.error('Camera permission denied:', error)
      return false
    }
  }

  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaStream
    )
  }

  static async scanFromImage(imageFile: File): Promise<string | null> {
    try {
      const reader = await this.initialize()
      const result = await reader.decodeFromImageUrl(URL.createObjectURL(imageFile))
      
      if (result) {
        HapticService.success()
        return result.getText()
      }
      
      return null
    } catch (error) {
      console.error('Error scanning from image:', error)
      HapticService.error()
      return null
    }
  }
}