
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [scanError, setScanError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  const handleVideoReady = () => {
    console.log('Video is ready, setting isScanning to true');
    setIsScanning(true);
    setIsRequestingCamera(false);
    scanForQRCode();
  };

  const startScanning = async () => {
    try {
      console.log('Starting camera access request...');
      setIsRequestingCamera(true);
      setScanError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('Camera access granted, stream received:', stream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set up event listeners BEFORE setting srcObject
        const setupEventListeners = () => {
          // Remove any existing listeners first
          video.removeEventListener('loadedmetadata', handleVideoReady);
          video.removeEventListener('canplay', handleVideoReady);
          video.removeEventListener('playing', handleVideoReady);
          
          // Add new listeners
          video.addEventListener('loadedmetadata', handleVideoReady, { once: true });
          video.addEventListener('canplay', handleVideoReady, { once: true });
          video.addEventListener('playing', handleVideoReady, { once: true });
        };

        setupEventListeners();
        
        // Now set the source
        video.srcObject = stream;
        streamRef.current = stream;
        
        // Fallback timeout in case events don't fire
        const timeoutId = setTimeout(() => {
          if (video.readyState >= 2 && !isScanning) {
            console.log('Fallback: Video ready via timeout check');
            handleVideoReady();
          }
        }, 2000);
        
        // Clear timeout if video loads properly
        const clearTimeoutOnReady = () => {
          clearTimeout(timeoutId);
        };
        video.addEventListener('loadedmetadata', clearTimeoutOnReady, { once: true });
        video.addEventListener('canplay', clearTimeoutOnReady, { once: true });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsRequestingCamera(false);
      setScanError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanForQRCode);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data and scan for QR code
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

    if (qrCode) {
      console.log('QR Code detected:', qrCode.data);
      stopScanning();
      onScan(qrCode.data);
    } else {
      // Continue scanning
      animationRef.current = requestAnimationFrame(scanForQRCode);
    }
  };

  const stopScanning = () => {
    console.log('Stopping camera access');
    
    // Clean up video event listeners
    if (videoRef.current) {
      const video = videoRef.current;
      video.removeEventListener('loadedmetadata', handleVideoReady);
      video.removeEventListener('canplay', handleVideoReady);
      video.removeEventListener('playing', handleVideoReady);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsScanning(false);
    setIsRequestingCamera(false);
    setScanError('');
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Code Scanner
          {isRequestingCamera && (
            <div className="flex items-center gap-2 ml-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-orange-500 font-normal">Requesting Camera...</span>
            </div>
          )}
          {isScanning && (
            <div className="flex items-center gap-2 ml-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-500 font-normal">Camera Active</span>
            </div>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning && !isRequestingCamera ? (
          <div className="text-center space-y-4">
            <div className="w-48 h-48 bg-gray-100 mx-auto rounded-lg flex items-center justify-center">
              <Camera className="h-16 w-16 text-gray-400" />
            </div>
            {scanError && (
              <p className="text-sm text-red-500 text-center">{scanError}</p>
            )}
            <Button onClick={startScanning} className="w-full">
              Start Camera
            </Button>
          </div>
        ) : isRequestingCamera ? (
          <div className="text-center space-y-4">
            <div className="w-48 h-48 bg-gray-100 mx-auto rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-16 w-16 text-orange-500 animate-pulse" />
                <span className="text-sm text-orange-500">Requesting camera access...</span>
              </div>
            </div>
            <Button onClick={stopScanning} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-48 bg-black rounded-lg"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-blue-500"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-blue-500"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-blue-500"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-blue-500"></div>
              </div>
              {/* Camera access indicator overlay */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={stopScanning} variant="outline" className="flex-1">
                Stop Camera
              </Button>
              <Button 
                onClick={() => onScan('sample-qr-data')} 
                variant="outline"
                className="flex-1"
              >
                Test Mode
              </Button>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Point your camera at a QR code to scan it automatically
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
