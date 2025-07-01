
export interface QRScanResult {
  data: string;
  timestamp: Date;
  format?: string;
  confidence?: number;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
  facing?: 'user' | 'environment';
}

export interface QRScannerConfig {
  preferredCamera?: 'user' | 'environment';
  scanRate?: number;
  resolution?: {
    width: number;
    height: number;
  };
  enableHistory?: boolean;
  maxHistorySize?: number;
}

export interface CameraPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}
