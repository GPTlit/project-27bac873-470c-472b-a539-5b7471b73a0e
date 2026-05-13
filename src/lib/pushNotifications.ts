import { supabase } from '@/integrations/supabase/client';

export interface PushRegistrationResult {
  ok: boolean;
  token?: string;
  error?: string;
  via?: 'capacitor' | 'web';
}

async function loadCapacitorPush(): Promise<any | null> {
  try {
    const mod = await import('@capacitor/push-notifications');
    return mod;
  } catch {
    return null;
  }
}

async function getPlatform(): Promise<string> {
  try {
    const mod = await import('@capacitor/core');
    return mod.Capacitor.getPlatform();
  } catch {
    return 'web';
  }
}

export async function requestPushNotificationPermission(): Promise<PushRegistrationResult> {
  const mod = await loadCapacitorPush();
  if (!mod?.PushNotifications) {
    if ('Notification' in window) {
      const perm = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
      return perm === 'granted'
        ? { ok: true, via: 'web' }
        : { ok: false, error: 'Notification permission denied', via: 'web' };
    }
    return { ok: false, error: 'Push notifications are not available in this environment', via: 'web' };
  }

  try {
    let status = await mod.PushNotifications.checkPermissions();
    if (status.receive !== 'granted') {
      status = await mod.PushNotifications.requestPermissions();
    }
    if (status.receive !== 'granted') {
      return { ok: false, error: 'Push notification permission denied', via: 'capacitor' };
    }
    return { ok: true, via: 'capacitor' };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Push permission failed', via: 'capacitor' };
  }
}

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  const permission = await requestPushNotificationPermission();
  if (!permission.ok) return permission;

  const mod = await loadCapacitorPush();
  if (!mod?.PushNotifications) return permission;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: PushRegistrationResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    mod.PushNotifications.addListener('registration', async (token: { value: string }) => {
      try {
        const platform = await getPlatform();
        const { error } = await supabase.rpc('register_push_subscription' as any, {
          _token: token.value,
          _platform: platform,
          _device_info: {
            userAgent: navigator.userAgent,
            language: navigator.language,
          },
        });
        if (error) throw error;
        finish({ ok: true, token: token.value, via: 'capacitor' });
      } catch (e: any) {
        finish({ ok: false, error: e?.message || 'Could not save push token', via: 'capacitor' });
      }
    });

    mod.PushNotifications.addListener('registrationError', (error: any) => {
      finish({ ok: false, error: error?.error || error?.message || 'Push registration failed', via: 'capacitor' });
    });

    mod.PushNotifications.register().catch((e: any) => {
      finish({ ok: false, error: e?.message || 'Push registration failed', via: 'capacitor' });
    });

    setTimeout(() => finish({ ok: false, error: 'Push registration timed out', via: 'capacitor' }), 15000);
  });
}

export async function showForegroundNotification(title: string, body: string): Promise<void> {
  try {
    const { sendLocalNotification } = await import('@/lib/localNotifications');
    await sendLocalNotification({ title, body });
  } catch {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }
}
