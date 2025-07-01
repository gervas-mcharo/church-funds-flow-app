
import { useState, useRef, useEffect } from 'react';
import { QRScanResult, QRScannerConfig } from '@/types/qr';
import { QRDetectionService } from '@/services/qrDetectionService';
import { useToast } from '@/hooks/use-toast';

const defaultConfig: QRScannerConfig = {
  preferredCamera: 'environment',
  scanRate: 250, // ms
  enableHistory: true,
  maxHistorySize: 10
};

export const useQRScanner = (config: Partial<QRScannerConfig> = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<QRScanResult[]>([]);
  const [lastScan, setLastScan] = useState<QRScanResult | null>(null);
  
  const finalConfig = { ...defaultConfig, ...config };
  const detectionService = useRef<QRDetectionService>();
  const scanIntervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    detectionService.current = new QRDetectionService();
    
    return () => {
      if (detectionService.current) {
        detectionService.current.destroy();
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const openScanner = () => setIsOpen(true);
  const closeScanner = () => {
    setIsOpen(false);
    stopScanning();
  };

  const startScanning = (videoElement: HTMLVideoElement) => {
    if (isScanning || !detectionService.current) return;

    setIsScanning(true);
    
    const scanLoop = async () => {
      if (!videoElement || !detectionService.current || !isScanning) return;

      try {
        const result = await detectionService.current.scanFromVideo(videoElement);
        
        if (result) {
          const scanResult: QRScanResult = {
            data: result.getText(),
            timestamp: new Date(),
            format: result.getBarcodeFormat()?.toString(),
            confidence: 1 // ZXing doesn't provide confidence score
          };

          handleScanResult(scanResult);
        }
      } catch (error) {
        console.error('Scan error:', error);
      }
    };

    scanIntervalRef.current = setInterval(scanLoop, finalConfig.scanRate);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = undefined;
    }
    if (detectionService.current) {
      detectionService.current.reset();
    }
  };

  const handleScanResult = (result: QRScanResult) => {
    // Avoid duplicate scans
    if (lastScan && lastScan.data === result.data && 
        Date.now() - lastScan.timestamp.getTime() < 2000) {
      return;
    }

    setLastScan(result);
    onScan(result.data);
    
    if (finalConfig.enableHistory) {
      setScanHistory(prev => {
        const newHistory = [result, ...prev];
        return newHistory.slice(0, finalConfig.maxHistorySize);
      });
    }

    // Auto-close scanner after successful scan
    closeScanner();
  };

  const onScan = (data: string) => {
    console.log('QR Code scanned:', data);
    
    // Try to parse as JSON for contributor data
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.contributorId) {
        toast({
          title: "QR Code Scanned Successfully",
          description: `Contributor ID: ${parsedData.contributorId}`,
        });
      } else {
        toast({
          title: "QR Code Scanned",
          description: "Data: " + data.substring(0, 50) + (data.length > 50 ? '...' : ''),
        });
      }
    } catch {
      toast({
        title: "QR Code Scanned",
        description: "Data: " + data.substring(0, 50) + (data.length > 50 ? '...' : ''),
      });
    }
  };

  const clearHistory = () => setScanHistory([]);

  return {
    isOpen,
    isScanning,
    scanHistory,
    lastScan,
    openScanner,
    closeScanner,
    startScanning,
    stopScanning,
    clearHistory,
    onScan
  };
};
