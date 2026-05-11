// Local notifications helper. Uses @capacitor/local-notifications on Android/iOS,
// falls back to Web Notifications API in browser. Does not modify existing code.

async function loadCapacitorLN(): Promise<any | null> {
  try {
    // @ts-ignore - optional dependency, only present in Capacitor builds
    const mod: any = await import(/* @vite-ignore */ ('@capacitor/' + 'local-notifications'));
    return mod;
  } catch {
    return null;
  }
}

export interface LocalNotifOptions {
  title?: string;
  body?: string;
  id?: number;
}

export async function sendLocalNotification(
  opts: LocalNotifOptions = {}
): Promise<{ ok: boolean; error?: string; via?: 'capacitor' | 'web' }> {
  const title = opts.title ?? 'مكتبة موريتانيا';
  const body = opts.body ?? 'You have a new update or saved file';
  const id = opts.id ?? Math.floor(Date.now() % 2147483647);

  const mod = await loadCapacitorLN();
  if (mod?.LocalNotifications) {
    try {
      const perm = await mod.LocalNotifications.checkPermissions();
      if (perm?.display !== 'granted') {
        const req = await mod.LocalNotifications.requestPermissions();
        if (req?.display !== 'granted') {
          return { ok: false, error: 'Notification permission denied', via: 'capacitor' };
        }
      }
      await mod.LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: { at: new Date(Date.now() + 100) },
            smallIcon: 'ic_stat_icon_config_sample',
            channelId: 'default',
          },
        ],
      });
      return { ok: true, via: 'capacitor' };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Capacitor notification failed', via: 'capacitor' };
    }
  }

  // Web fallback
  try {
    if (!('Notification' in window)) {
      return { ok: false, error: 'Notifications not supported', via: 'web' };
    }
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, error: 'Permission denied', via: 'web' };
    new Notification(title, { body });
    return { ok: true, via: 'web' };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Web notification failed', via: 'web' };
  }
}