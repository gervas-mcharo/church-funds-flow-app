
import { useState, useEffect, useRef } from 'react';
import { CameraDevice, CameraPermissionState } from '@/types/qr';

export const useCamera = () => {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<CameraDevice | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<CameraPermissionState>({
    granted: false,
    denied: false,
    prompt: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const checkPermissions = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setPermissionState({
        granted: permission.state === 'granted',
        denied: permission.state === 'denied',
        prompt: permission.state === 'prompt'
      });
    } catch (error) {
      console.warn('Permission API not supported');
    }
  };

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: 'videoinput' as const,
          facing: device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear') 
            ? 'environment' as const 
            : 'user' as const
        }));
      
      setDevices(videoDevices);
      
      // Auto-select back camera if available, otherwise first camera
      const backCamera = videoDevices.find(d => d.facing === 'environment');
      const defaultCamera = backCamera || videoDevices[0];
      if (defaultCamera && !currentDevice) {
        setCurrentDevice(defaultCamera);
      }
    } catch (error) {
      console.error('Error enumerating devices:', error);
    }
  };

  const startCamera = async (deviceId?: string) => {
    try {
      setIsLoading(true);
      setError('');

      // Stop current stream if exists
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      setPermissionState({
        granted: true,
        denied: false,
        prompt: false
      });

      // Enumerate devices after permission is granted
      await enumerateDevices();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      setError(errorMessage);
      setPermissionState({
        granted: false,
        denied: true,
        prompt: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const switchCamera = async (deviceId: string) => {
    const device = devices.find(d => d.deviceId === deviceId);
    if (device) {
      setCurrentDevice(device);
      await startCamera(deviceId);
    }
  };

  useEffect(() => {
    checkPermissions();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return {
    devices,
    currentDevice,
    stream,
    permissionState,
    isLoading,
    error,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    enumerateDevices
  };
};
