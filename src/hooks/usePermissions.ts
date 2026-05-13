import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

type AppPermissionName = 'microphone' | 'camera' | 'notifications' | 'photos' | 'videos' | 'audio';

interface PermissionStatus {
  microphone: boolean;
  camera: boolean;
  notifications: boolean;
  photos: boolean;
  videos: boolean;
  audio: boolean;
}

const requestCapacitorCameraPermissions = async (): Promise<{ photos: boolean; videos: boolean; camera: boolean } | null> => {
  try {
    const mod = await import('@capacitor/camera');
    const result = await mod.Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    const photos = result.photos === 'granted' || result.photos === 'limited';
    const camera = result.camera === 'granted' || result.camera === 'limited';
    return { photos, videos: photos || camera, camera };
  } catch {
    return null;
  }
};

const unlockAudioPlayback = async (): Promise<boolean> => {
  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return true;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.03);
    if (context.state === 'suspended') await context.resume();
    setTimeout(() => context.close?.(), 120);
    return true;
  } catch {
    return false;
  }
};

export const usePermissions = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [permissions, setPermissions] = useState<PermissionStatus>({
    microphone: false,
    camera: false,
    notifications: false,
    photos: false,
    videos: false,
    audio: false,
  });
  const [isRequesting, setIsRequesting] = useState(false);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, microphone: true }));
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast({
        title: t('permissionDenied'),
        description: t('microphonePermissionNeeded'),
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, t]);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      const native = await requestCapacitorCameraPermissions();
      if (native) {
        setPermissions(prev => ({ ...prev, camera: native.camera, photos: native.photos, videos: native.videos }));
        return native.camera;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, camera: true, videos: true }));
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      toast({
        title: t('permissionDenied'),
        description: t('cameraPermissionNeeded'),
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, t]);

  const requestPhotosPermission = useCallback(async (): Promise<boolean> => {
    try {
      const native = await requestCapacitorCameraPermissions();
      if (native) {
        setPermissions(prev => ({ ...prev, photos: native.photos, videos: native.videos, camera: native.camera }));
        return native.photos;
      }
      setPermissions(prev => ({ ...prev, photos: true }));
      return true;
    } catch (error) {
      console.error('Photos permission denied:', error);
      toast({ title: t('permissionDenied'), description: 'يرجى السماح بالوصول للصور', variant: 'destructive' });
      return false;
    }
  }, [toast, t]);

  const requestVideosPermission = useCallback(async (): Promise<boolean> => {
    try {
      const native = await requestCapacitorCameraPermissions();
      if (native) {
        setPermissions(prev => ({ ...prev, videos: native.videos, photos: native.photos, camera: native.camera }));
        return native.videos;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, videos: true }));
      return true;
    } catch (error) {
      console.error('Videos permission denied:', error);
      toast({ title: t('permissionDenied'), description: 'يرجى السماح بالوصول للفيديو', variant: 'destructive' });
      return false;
    }
  }, [toast, t]);

  const requestAudioPermission = useCallback(async (): Promise<boolean> => {
    const granted = await unlockAudioPlayback();
    setPermissions(prev => ({ ...prev, audio: granted }));
    if (!granted) {
      toast({ title: t('permissionDenied'), description: 'يرجى السماح بتشغيل الصوت', variant: 'destructive' });
    }
    return granted;
  }, [toast, t]);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const push = await import('@/lib/pushNotifications');
      const pushResult = await push.requestPushNotificationPermission();
      if (pushResult.ok) {
        setPermissions(prev => ({ ...prev, notifications: true }));
        return true;
      }
    } catch {
      // Continue to browser fallback.
    }

    if (!('Notification' in window)) {
      toast({
        title: t('notSupported'),
        description: t('notificationsNotSupported'),
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setPermissions(prev => ({ ...prev, notifications: granted }));
      if (!granted) {
        toast({
          title: t('permissionDenied'),
          description: t('notificationPermissionNeeded'),
          variant: 'destructive',
        });
      }
      return granted;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }, [toast, t]);

  const requestPermission = useCallback(async (name: AppPermissionName): Promise<boolean> => {
    setIsRequesting(true);
    let result = false;
    
    try {
      switch (name) {
        case 'microphone':
          result = await requestMicrophonePermission();
          break;
        case 'camera':
          result = await requestCameraPermission();
          break;
        case 'notifications':
          result = await requestNotificationPermission();
          break;
        case 'photos':
          result = await requestPhotosPermission();
          break;
        case 'videos':
          result = await requestVideosPermission();
          break;
        case 'audio':
          result = await requestAudioPermission();
          break;
      }
    } finally {
      setIsRequesting(false);
    }
    
    return result;
  }, [requestMicrophonePermission, requestCameraPermission, requestNotificationPermission, requestPhotosPermission, requestVideosPermission, requestAudioPermission]);

  const requestAllPermissions = useCallback(async (): Promise<PermissionStatus> => {
    setIsRequesting(true);
    
    const [audio, notif, mic, cam, photos, videos] = await Promise.all([
      requestAudioPermission(),
      requestNotificationPermission(),
      requestMicrophonePermission(),
      requestCameraPermission(),
      requestPhotosPermission(),
      requestVideosPermission(),
    ]);
    
    const newPermissions = {
      microphone: mic,
      camera: cam,
      notifications: notif,
      photos,
      videos,
      audio,
    };
    
    setPermissions(newPermissions);
    setIsRequesting(false);
    
    return newPermissions;
  }, [requestMicrophonePermission, requestCameraPermission, requestNotificationPermission, requestPhotosPermission, requestVideosPermission, requestAudioPermission]);

  const checkPermission = useCallback(async (name: AppPermissionName): Promise<boolean> => {
    try {
      if (name === 'audio') return true;
      if (name === 'photos' || name === 'videos') return permissions[name];
      if ('permissions' in navigator) {
        const status = await navigator.permissions.query({ name: name as globalThis.PermissionName });
        return status.state === 'granted';
      }
      return false;
    } catch {
      return false;
    }
  }, [permissions]);

  return {
    permissions,
    isRequesting,
    requestPermission,
    requestAllPermissions,
    checkPermission,
    requestMicrophonePermission,
    requestCameraPermission,
    requestNotificationPermission,
    requestPhotosPermission,
    requestVideosPermission,
    requestAudioPermission,
  };
};
