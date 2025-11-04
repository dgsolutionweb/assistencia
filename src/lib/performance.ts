/**
 * Serviço de monitoramento de performance para aplicações mobile
 * Monitora FPS, tempos de carregamento e interações do usuário
 */

interface PerformanceMetrics {
  fps: number;
  loadTime: number;
  interactionTime: number;
  memoryUsage?: number;
}

interface PageMetrics {
  pageName: string;
  loadStartTime: number;
  loadEndTime?: number;
  interactionCount: number;
  lastInteraction: number;
}

class PerformanceMonitor {
  private static metrics: Map<string, PageMetrics> = new Map();
  private static fpsCounter = 0;
  private static lastFpsTime = 0;
  private static currentFps = 0;

  /**
   * Inicia o monitoramento de FPS
   */
  static startFPSMonitoring(): void {
    const measureFPS = () => {
      this.fpsCounter++;
      const now = performance.now();
      
      if (now - this.lastFpsTime >= 1000) {
        this.currentFps = Math.round((this.fpsCounter * 1000) / (now - this.lastFpsTime));
        this.fpsCounter = 0;
        this.lastFpsTime = now;
        
        // Log warning se FPS estiver baixo
        if (this.currentFps < 30) {
          console.warn(`⚠️ Low FPS detected: ${this.currentFps}fps`);
        }
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * Obtém o FPS atual
   */
  static getCurrentFPS(): number {
    return this.currentFps;
  }

  /**
   * Inicia o monitoramento de uma página
   */
  static startPageLoad(pageName: string): void {
    this.metrics.set(pageName, {
      pageName,
      loadStartTime: performance.now(),
      interactionCount: 0,
      lastInteraction: 0
    });
  }

  /**
   * Finaliza o monitoramento de carregamento de uma página
   */
  static endPageLoad(pageName: string): void {
    const metric = this.metrics.get(pageName);
    if (metric) {
      metric.loadEndTime = performance.now();
      const loadTime = metric.loadEndTime - metric.loadStartTime;
      
      console.log(`📊 Page Load: ${pageName} - ${loadTime.toFixed(2)}ms`);
      
      // Log warning se carregamento estiver lento
      if (loadTime > 1000) {
        console.warn(`⚠️ Slow page load: ${pageName} took ${loadTime.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Registra uma interação do usuário
   */
  static trackInteraction(pageName: string, action: string): void {
    const startTime = performance.now();
    const metric = this.metrics.get(pageName);
    
    if (metric) {
      metric.interactionCount++;
      metric.lastInteraction = startTime;
    }

    // Medir tempo de resposta da interação
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const interactionTime = endTime - startTime;
      
      console.log(`🎯 Interaction: ${action} - ${interactionTime.toFixed(2)}ms`);
      
      // Log warning se interação estiver lenta
      if (interactionTime > 100) {
        console.warn(`⚠️ Slow interaction: ${action} took ${interactionTime.toFixed(2)}ms`);
      }
    });
  }

  /**
   * Obtém métricas de uma página
   */
  static getPageMetrics(pageName: string): PageMetrics | undefined {
    return this.metrics.get(pageName);
  }

  /**
   * Obtém todas as métricas
   */
  static getAllMetrics(): PerformanceMetrics {
    const pages = Array.from(this.metrics.values());
    const totalLoadTime = pages.reduce((sum, page) => {
      if (page.loadEndTime) {
        return sum + (page.loadEndTime - page.loadStartTime);
      }
      return sum;
    }, 0);

    return {
      fps: this.currentFps,
      loadTime: totalLoadTime / pages.length || 0,
      interactionTime: 0, // Será calculado dinamicamente
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Obtém uso de memória (se disponível)
   */
  private static getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
    return undefined;
  }

  /**
   * Mede o tempo de uma operação assíncrona
   */
  static async measureAsync<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️ Async Operation: ${operationName} - ${duration.toFixed(2)}ms`);
      
      if (duration > 500) {
        console.warn(`⚠️ Slow async operation: ${operationName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`❌ Failed Operation: ${operationName} - ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  /**
   * Limpa métricas antigas
   */
  static clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Gera relatório de performance
   */
  static generateReport(): string {
    const metrics = this.getAllMetrics();
    const pages = Array.from(this.metrics.values());
    
    return `
📊 Performance Report
====================
Current FPS: ${metrics.fps}
Average Load Time: ${metrics.loadTime.toFixed(2)}ms
Memory Usage: ${metrics.memoryUsage ? (metrics.memoryUsage * 100).toFixed(1) + '%' : 'N/A'}

Pages Monitored: ${pages.length}
${pages.map(page => `
  - ${page.pageName}:
    Load Time: ${page.loadEndTime ? (page.loadEndTime - page.loadStartTime).toFixed(2) + 'ms' : 'Loading...'}
    Interactions: ${page.interactionCount}
`).join('')}
    `;
  }
}

export default PerformanceMonitor;