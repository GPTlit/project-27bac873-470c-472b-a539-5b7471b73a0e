import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

type PermissionName = 'microphone' | 'camera' | 'notifications';

interface PermissionStatus {
  microphone: boolean;
  camera: boolean;
  notifications: boolean;
}

export const usePermissions = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [permissions, setPermissions] = useState<PermissionStatus>({
    microphone: false,
    camera: false,
    notifications: false,
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, camera: true }));
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

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
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

  const requestPermission = useCallback(async (name: PermissionName): Promise<boolean> => {
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
      }
    } finally {
      setIsRequesting(false);
    }
    
    return result;
  }, [requestMicrophonePermission, requestCameraPermission, requestNotificationPermission]);

  const requestAllPermissions = useCallback(async (): Promise<PermissionStatus> => {
    setIsRequesting(true);
    
    const [mic, cam, notif] = await Promise.all([
      requestMicrophonePermission(),
      requestCameraPermission(),
      requestNotificationPermission(),
    ]);
    
    const newPermissions = {
      microphone: mic,
      camera: cam,
      notifications: notif,
    };
    
    setPermissions(newPermissions);
    setIsRequesting(false);
    
    return newPermissions;
  }, [requestMicrophonePermission, requestCameraPermission, requestNotificationPermission]);

  const checkPermission = useCallback(async (name: PermissionName): Promise<boolean> => {
    try {
      // Check browser permissions API if available
      if ('permissions' in navigator) {
        const permName = name === 'microphone' ? 'microphone' : 
                        name === 'camera' ? 'camera' : 
                        'notifications';
        
        const status = await navigator.permissions.query({ name: permName as PermissionName });
        return status.state === 'granted';
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return {
    permissions,
    isRequesting,
    requestPermission,
    requestAllPermissions,
    checkPermission,
    requestMicrophonePermission,
    requestCameraPermission,
    requestNotificationPermission,
  };
};
