import { HapticService } from './HapticService'

export interface NotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

class NotificationService {
  private permission: NotificationPermission = 'default'
  private registration: ServiceWorkerRegistration | null = null

  constructor() {
    this.init()
  }

  private async init() {
    // Verificar suporte a notificações
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações')
      return
    }

    this.permission = Notification.permission

    // Registrar service worker para notificações push
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready
      } catch (error) {
        console.error('Erro ao registrar service worker:', error)
      }
    }
  }

  // Solicitar permissão para notificações
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    if (this.permission === 'granted') {
      return 'granted'
    }

    if (this.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission
    }

    return this.permission
  }

  // Verificar se as notificações estão habilitadas
  isEnabled(): boolean {
    return this.permission === 'granted'
  }

  // Mostrar notificação local
  async showNotification(data: NotificationData): Promise<void> {
    if (!this.isEnabled()) {
      console.warn('Notificações não estão habilitadas')
      return
    }

    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-96x96.png',
      tag: data.tag,
      data: data.data,
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
    }

    try {
      if (this.registration) {
        // Usar service worker para notificações persistentes
        await this.registration.showNotification(data.title, options)
      } else {
        // Fallback para notificação simples
        const notification = new Notification(data.title, options)
        
        // Auto-close após 5 segundos se não for requireInteraction
        if (!data.requireInteraction) {
          setTimeout(() => {
            notification.close()
          }, 5000)
        }
      }

      // Feedback háptico
      if (!data.silent) {
        HapticService.trigger('light')
      }
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error)
    }
  }

  // Notificações pré-definidas para o sistema
  async showServiceNotification(serviceName: string, type: 'created' | 'updated' | 'completed') {
    const messages = {
      created: `Novo serviço criado: ${serviceName}`,
      updated: `Serviço atualizado: ${serviceName}`,
      completed: `Serviço concluído: ${serviceName}`
    }

    const icons = {
      created: '/icons/service-new.png',
      updated: '/icons/service-update.png',
      completed: '/icons/service-complete.png'
    }

    await this.showNotification({
      title: 'Sistema Financeiro',
      body: messages[type],
      icon: icons[type],
      tag: `service-${type}`,
      data: { type: 'service', action: type, serviceName },
      actions: [
        {
          action: 'view',
          title: 'Ver Detalhes',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ]
    })
  }

  async showPartNotification(partName: string, type: 'added' | 'low_stock' | 'out_of_stock') {
    const messages = {
      added: `Nova peça adicionada: ${partName}`,
      low_stock: `Estoque baixo: ${partName}`,
      out_of_stock: `Peça em falta: ${partName}`
    }

    const colors = {
      added: 'success',
      low_stock: 'warning',
      out_of_stock: 'error'
    }

    await this.showNotification({
      title: 'Gestão de Peças',
      body: messages[type],
      icon: '/icons/part-notification.png',
      tag: `part-${type}`,
      data: { type: 'part', action: type, partName },
      requireInteraction: type === 'out_of_stock',
      actions: [
        {
          action: 'view',
          title: 'Ver Peça',
          icon: '/icons/action-view.png'
        },
        ...(type === 'out_of_stock' ? [{
          action: 'reorder',
          title: 'Reabastecer',
          icon: '/icons/action-reorder.png'
        }] : [])
      ]
    })
  }

  async showSyncNotification(status: 'success' | 'error', details?: string) {
    const messages = {
      success: 'Dados sincronizados com sucesso',
      error: `Erro na sincronização${details ? `: ${details}` : ''}`
    }

    await this.showNotification({
      title: 'Sincronização',
      body: messages[status],
      icon: status === 'success' ? '/icons/sync-success.png' : '/icons/sync-error.png',
      tag: 'sync-status',
      data: { type: 'sync', status, details },
      silent: status === 'success',
      requireInteraction: status === 'error'
    })
  }

  async showReminderNotification(title: string, message: string, data?: any) {
    await this.showNotification({
      title: `Lembrete: ${title}`,
      body: message,
      icon: '/icons/reminder.png',
      tag: 'reminder',
      data: { type: 'reminder', ...data },
      requireInteraction: true,
      actions: [
        {
          action: 'snooze',
          title: 'Lembrar depois',
          icon: '/icons/action-snooze.png'
        },
        {
          action: 'complete',
          title: 'Marcar como feito',
          icon: '/icons/action-complete.png'
        }
      ]
    })
  }

  // Agendar notificação para mais tarde
  async scheduleNotification(data: NotificationData, delay: number) {
    setTimeout(async () => {
      await this.showNotification(data)
    }, delay)
  }

  // Cancelar notificações por tag
  async cancelNotification(tag: string) {
    if (this.registration) {
      const notifications = await this.registration.getNotifications({ tag })
      notifications.forEach(notification => notification.close())
    }
  }

  // Cancelar todas as notificações
  async cancelAllNotifications() {
    if (this.registration) {
      const notifications = await this.registration.getNotifications()
      notifications.forEach(notification => notification.close())
    }
  }

  // Configurar handlers para ações de notificação
  setupNotificationHandlers() {
    if (!this.registration) return

    // Handler para cliques em notificações
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'notification-click') {
        const { action, data } = event.data
        this.handleNotificationAction(action, data)
      }
    })
  }

  private handleNotificationAction(action: string, data: any) {
    switch (action) {
      case 'view':
        // Navegar para a página relevante
        if (data.type === 'service') {
          window.location.href = '/servicos'
        } else if (data.type === 'part') {
          window.location.href = '/pecas'
        }
        break

      case 'snooze':
        // Reagendar notificação para 1 hora
        this.scheduleNotification({
          title: data.title,
          body: data.body,
          tag: 'reminder-snoozed'
        }, 60 * 60 * 1000) // 1 hora
        break

      case 'reorder':
        // Navegar para página de nova peça
        window.location.href = '/pecas/nova'
        break

      default:
        console.log('Ação de notificação não reconhecida:', action)
    }
  }

  // Obter estatísticas de notificações
  async getNotificationStats() {
    if (!this.registration) return null

    const notifications = await this.registration.getNotifications()
    return {
      total: notifications.length,
      byTag: notifications.reduce((acc, notification) => {
        const tag = notification.tag || 'untagged'
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }
}

export default new NotificationService()