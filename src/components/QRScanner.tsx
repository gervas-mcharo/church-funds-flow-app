import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, Upload, Copy, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface ScanResult {
  data: string;
  confidence: number;
  timestamp: number;
}

// Constants for better maintainability
const SCAN_INTERVAL = 150; // ms - throttling interval for CPU optimization
const VIDEO_READY_TIMEOUT = 3000; // ms - fallback timeout
const VIDEO_CONSTRAINTS = {
  facingMode: 'environment',
  width: { ideal: 1280 },
  height: { ideal: 720 }
};

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [scanError, setScanError] = useState<string>('');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('none');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const lastScanTime = useRef(0);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout>();

  // Get available cameras
  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`
        }));
      
      setCameras(videoDevices);
      
      // Auto-select back camera if available
      const backCamera = videoDevices.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('environment')
      );
      if (backCamera) {
        setSelectedCamera(backCamera.deviceId);
      } else if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error enumerating cameras:', error);
    }
  };

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      getCameras();
    }
  }, []);

  const getSpecificErrorMessage = (error: any): string => {
    console.error('Camera access error:', error);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Camera access denied. Please allow camera permissions in your browser settings and try again.';
    }
    
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No camera found. Please ensure your device has a camera connected.';
    }
    
    if (error.name === 'NotSupportedError' || error.name === 'ConstraintNotSatisfiedError') {
      return 'Camera constraints not supported. Your camera may not support the required settings.';
    }
    
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Camera is being used by another application. Please close other apps using the camera and try again.';
    }
    
    if (error.name === 'OverconstrainedError') {
      return 'Camera settings are too restrictive. Trying with default settings...';
    }
    
    return 'Unable to access camera. Please check your camera permissions and try again.';
  };

  const handleVideoReady = () => {
    console.log('Video is ready, starting scan');
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = undefined;
    }
    setIsScanning(true);
    setIsRequestingCamera(false);
    scanForQRCode();
  };

  const startScanning = async () => {
    try {
      console.log('Starting camera access request...');
      setIsRequestingCamera(true);
      setScanError('');
      
      const constraints = {
        video: selectedCamera && selectedCamera !== 'none'
          ? { ...VIDEO_CONSTRAINTS, deviceId: { exact: selectedCamera } }
          : VIDEO_CONSTRAINTS
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera access granted, stream received:', stream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Clean up any existing listeners and timeouts
        video.removeEventListener('canplay', handleVideoReady);
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
        }
        
        // Set up single primary event listener
        video.addEventListener('canplay', handleVideoReady, { once: true });
        
        // Set fallback timeout
        fallbackTimeoutRef.current = setTimeout(() => {
          if (video.readyState >= 2 && !isScanning) {
            console.log('Fallback: Video ready via timeout');
            handleVideoReady();
          }
        }, VIDEO_READY_TIMEOUT);
        
        // Set video source
        video.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      const specificErrorMessage = getSpecificErrorMessage(error);
      setIsRequestingCamera(false);
      setScanError(specificErrorMessage);
      
      // If it's an overconstrained error, try with basic constraints
      if (error.name === 'OverconstrainedError') {
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            streamRef.current = basicStream;
            setScanError('');
            setIsRequestingCamera(true);
          }
        } catch (basicError) {
          setScanError(getSpecificErrorMessage(basicError));
        }
      }
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

    // Throttling for CPU optimization
    const now = Date.now();
    if (now - lastScanTime.current < SCAN_INTERVAL) {
      animationRef.current = requestAnimationFrame(scanForQRCode);
      return;
    }
    lastScanTime.current = now;

    // Optimize canvas sizing
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data and scan for QR code
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

    if (qrCode) {
      console.log('QR Code detected:', qrCode.data);
      const confidence = calculateConfidence(qrCode);
      
      setLastScanResult({
        data: qrCode.data,
        confidence,
        timestamp: Date.now()
      });
      
      stopScanning();
      onScan(qrCode.data);
      
      // Add haptic feedback if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } else {
      // Continue scanning
      animationRef.current = requestAnimationFrame(scanForQRCode);
    }
  };

  const calculateConfidence = (qrCode: any): number => {
    // Simple confidence calculation based on QR code properties
    let confidence = 0.5;
    
    if (qrCode.location) {
      // Check if corners are well-defined
      const corners = qrCode.location;
      if (corners && corners.topLeftCorner && corners.topRightCorner && 
          corners.bottomLeftCorner && corners.bottomRightCorner) {
        confidence += 0.3;
      }
    }
    
    if (qrCode.data && qrCode.data.length > 0) {
      confidence += 0.2;
    }
    
    return Math.min(1, confidence);
  };

  const stopScanning = () => {
    console.log('Stopping camera access');
    
    // Clean up video event listeners
    if (videoRef.current) {
      videoRef.current.removeEventListener('canplay', handleVideoReady);
    }
    
    // Clean up timeouts
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = undefined;
    }
    
    // Clean up media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clean up animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setIsScanning(false);
    setIsRequestingCamera(false);
    setScanError('');
    lastScanTime.current = 0;
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  // File handling functions
  const handleFileSelect = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setScanError('Please select a valid image file');
      return;
    }

    setIsProcessingFile(true);
    setScanError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        scanImageFile(img);
      };
      img.onerror = () => {
        setIsProcessingFile(false);
        setScanError('Failed to load image file');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessingFile(false);
      setScanError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const scanImageFile = (img: HTMLImageElement) => {
    if (!canvasRef.current) {
      setIsProcessingFile(false);
      setScanError('Canvas not available');
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setIsProcessingFile(false);
      setScanError('Canvas context not available');
      return;
    }

    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

    setIsProcessingFile(false);

    if (qrCode) {
      const confidence = calculateConfidence(qrCode);
      setLastScanResult({
        data: qrCode.data,
        confidence,
        timestamp: Date.now()
      });
      onScan(qrCode.data);
    } else {
      setScanError('No QR code found in the uploaded image');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const copyToClipboard = async () => {
    if (!lastScanResult) return;
    
    try {
      await navigator.clipboard.writeText(lastScanResult.data);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
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
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            {isProcessingFile ? 'Processing image...' : 'Click or drag to upload QR code image'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>

        {/* Camera Selection */}
        {cameras.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Camera:</label>
            <Select value={selectedCamera} onValueChange={setSelectedCamera}>
              <SelectTrigger>
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>Select camera...</SelectItem>
                {cameras.map((camera) => (
                  <SelectItem key={camera.deviceId} value={camera.deviceId}>
                    {camera.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isScanning && !isRequestingCamera ? (
          <div className="text-center space-y-4">
            <div className="w-48 h-48 bg-gray-100 mx-auto rounded-lg flex items-center justify-center">
              <Camera className="h-16 w-16 text-gray-400" />
            </div>
            {scanError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">{scanError}</p>
                {scanError.includes('permissions') && (
                  <p className="text-xs text-red-500 mt-1 text-center">
                    Check your browser's address bar for camera permission requests.
                  </p>
                )}
              </div>
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
              {/* Scan performance indicator */}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                Optimized Scanning
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

        {/* Scan Result Display */}
        {lastScanResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                QR Code Detected (Confidence: {(lastScanResult.confidence * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="bg-white p-2 rounded text-sm font-mono break-all">
              {lastScanResult.data}
            </div>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="mt-2 w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
