/**
 * Serviço de Haptic Feedback para dispositivos móveis
 * Fornece feedback tátil nativo para melhorar a experiência do usuário
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

class HapticService {
  private static isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * Feedback haptic leve - para toques simples
   */
  static light(): void {
    if (this.isSupported()) {
      navigator.vibrate(10);
    }
  }

  /**
   * Feedback haptic médio - para seleções
   */
  static medium(): void {
    if (this.isSupported()) {
      navigator.vibrate(20);
    }
  }

  /**
   * Feedback haptic forte - para ações importantes
   */
  static heavy(): void {
    if (this.isSupported()) {
      navigator.vibrate([30, 10, 30]);
    }
  }

  /**
   * Feedback de sucesso - padrão duplo
   */
  static success(): void {
    if (this.isSupported()) {
      navigator.vibrate([50, 50, 50]);
    }
  }

  /**
   * Feedback de aviso - padrão triplo curto
   */
  static warning(): void {
    if (this.isSupported()) {
      navigator.vibrate([30, 30, 30, 30, 30]);
    }
  }

  /**
   * Feedback de erro - padrão longo
   */
  static error(): void {
    if (this.isSupported()) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  /**
   * Feedback genérico baseado no tipo
   */
  static trigger(type: HapticType): void {
    switch (type) {
      case 'light':
        this.light();
        break;
      case 'medium':
        this.medium();
        break;
      case 'heavy':
        this.heavy();
        break;
      case 'success':
        this.success();
        break;
      case 'warning':
        this.warning();
        break;
      case 'error':
        this.error();
        break;
    }
  }

  /**
   * Padrão customizado de vibração
   */
  static custom(pattern: number[]): void {
    if (this.isSupported()) {
      navigator.vibrate(pattern);
    }
  }
}

export default HapticService;