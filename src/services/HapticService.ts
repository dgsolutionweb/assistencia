export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification'

export class HapticService {
  private static isSupported(): boolean {
    return 'vibrate' in navigator
  }

  static async trigger(type: HapticFeedbackType = 'light'): Promise<void> {
    if (!this.isSupported()) {
      return
    }

    try {
      // Padrões de vibração para diferentes tipos de feedback
      const patterns: Record<HapticFeedbackType, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 50,
        selection: [5],
        impact: [10, 10, 10],
        notification: [50, 50, 50]
      }

      const pattern = patterns[type]
      
      if (Array.isArray(pattern)) {
        navigator.vibrate(pattern)
      } else {
        navigator.vibrate(pattern)
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error)
    }
  }

  static async success(): Promise<void> {
    return this.trigger('notification')
  }

  static async error(): Promise<void> {
    return this.trigger('heavy')
  }

  static async warning(): Promise<void> {
    return this.trigger('medium')
  }

  static async selection(): Promise<void> {
    return this.trigger('selection')
  }

  static async impact(): Promise<void> {
    return this.trigger('impact')
  }
}