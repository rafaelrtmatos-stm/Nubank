// Utilities for Native Background & System Notifications (Barra de Notificação dos Apps)

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export const isNativeNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNativeNotificationPermission = (): NotificationPermissionState => {
  if (!isNativeNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
};

export const requestNativeNotificationPermission = async (): Promise<NotificationPermissionState> => {
  if (!isNativeNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return Notification.permission as NotificationPermissionState;
  }
};

export const registerServiceWorkerForNotifications = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (err) {
      console.warn('Service worker registration error:', err);
    }
  }
};

export const showNativeSystemNotification = async (payload: {
  senderName: string;
  amount: number;
  bankName?: string;
  message?: string;
}): Promise<boolean> => {
  const formattedAmount = payload.amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const title = `Nu Empresas • Transferência Pix`;
  const body = `Você recebeu ${formattedAmount} de ${payload.senderName}.${
    payload.message ? ` "${payload.message}"` : ''
  }`;

  // 1. Mobile device haptic feedback
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (e) {
      // ignore
    }
  }

  // 2. Native System Notification (shows in device notification bar / status bar)
  if (isNativeNotificationSupported() && Notification.permission === 'granted') {
    try {
      // Prioritize Service Worker registration for background delivery on Android / Mobile
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon: '/nu-logo.png',
            badge: '/nu-logo.png',
            tag: 'nu-pix-received',
            vibrate: [200, 100, 200],
            requireInteraction: false,
            data: { url: window.location.href },
          } as NotificationOptions);
          return true;
        }
      }

      // Standard desktop/browser Notification
      const notif = new Notification(title, {
        body,
        icon: '/nu-logo.png',
        badge: '/nu-logo.png',
        tag: 'nu-pix-received',
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn('Failed to display native system notification:', err);
    }
  }

  return false;
};
