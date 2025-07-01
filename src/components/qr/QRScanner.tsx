
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, AlertCircle } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { CameraControls } from './CameraControls';
import { ScanHistory } from './ScanHistory';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isScanning: boolean;
  onStartScanning: (video: HTMLVideoElement) => void;
  onStopScanning: () => void;
  scanHistory: any[];
  onClearHistory: () => void;
}

export const QRScanner = ({
  onScan,
  onClose,
  isScanning,
  onStartScanning,
  onStopScanning,
  scanHistory,
  onClearHistory
}: QRScannerProps) => {
  const {
    devices,
    currentDevice,
    stream,
    permissionState,
    isLoading,
    error,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera
  } = useCamera();

  useEffect(() => {
    return () => {
      stopCamera();
      onStopScanning();
    };
  }, []);

  const handleStartCamera = async () => {
    await startCamera(currentDevice?.deviceId);
  };

  const handleStartScanning = () => {
    if (videoRef.current && stream) {
      onStartScanning(videoRef.current);
    }
  };

  const handleStopScanning = () => {
    onStopScanning();
  };

  const handleClose = () => {
    stopCamera();
    onStopScanning();
    onClose();
  };

  const renderCameraView = () => {
    if (error) {
      return (
        <div className="text-center space-y-4">
          <div className="w-48 h-48 bg-red-50 mx-auto rounded-lg flex items-center justify-center">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button onClick={handleStartCamera} variant="outline">
              Retry Camera Access
            </Button>
          </div>
        </div>
      );
    }

    if (!stream) {
      return (
        <div className="text-center space-y-4">
          <div className="w-48 h-48 bg-gray-100 mx-auto rounded-lg flex items-center justify-center">
            <Camera className="h-16 w-16 text-gray-400" />
          </div>
          <div>
            {isLoading ? (
              <p className="text-sm text-gray-500 mb-2">Requesting camera access...</p>
            ) : (
              <p className="text-sm text-gray-500 mb-2">Camera access required to scan QR codes</p>
            )}
            <Button onClick={handleStartCamera} disabled={isLoading}>
              {isLoading ? "Starting Camera..." : "Start Camera"}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 bg-black rounded-lg object-cover"
          />
          
          {/* Scanning overlay */}
          <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
            <div className="absolute inset-4 border-2 border-blue-400 rounded-lg animate-pulse">
              <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-500"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-500"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-500"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-500"></div>
            </div>
          </div>

          {/* Status indicator */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
            <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span>{isScanning ? 'SCANNING' : 'READY'}</span>
          </div>

          {/* Camera controls overlay */}
          <div className="absolute bottom-2 left-2 right-2">
            <CameraControls
              devices={devices}
              currentDevice={currentDevice}
              onDeviceChange={switchCamera}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={isScanning ? handleStopScanning : handleStartScanning}
            className="flex-1"
            variant={isScanning ? "destructive" : "default"}
          >
            {isScanning ? "Stop Scanning" : "Start Scanning"}
          </Button>
          <Button
            onClick={() => onScan('demo-qr-data-' + Date.now())}
            variant="outline"
            className="flex-1"
          >
            Test Scan
          </Button>
        </div>

        <p className="text-sm text-gray-500 text-center">
          {isScanning 
            ? "Point your camera at a QR code to scan it" 
            : "Click 'Start Scanning' to begin looking for QR codes"
          }
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {renderCameraView()}
        </CardContent>
      </Card>

      {scanHistory.length > 0 && (
        <div className="w-full max-w-md mx-auto">
          <ScanHistory
            history={scanHistory}
            onClear={onClearHistory}
          />
        </div>
      )}
    </div>
  );
};
