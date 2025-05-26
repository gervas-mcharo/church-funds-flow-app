
import { useState } from 'react';
import { parseQRData } from '@/services/qrCodeService';
import { useToast } from '@/hooks/use-toast';

export const useQRScanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const openScanner = () => setIsOpen(true);
  const closeScanner = () => setIsOpen(false);

  const handleScan = (data: string) => {
    console.log('Scanned QR code:', data);
    
    // Try to parse the QR data
    const parsedData = parseQRData(data);
    
    if (parsedData) {
      toast({
        title: "QR Code Scanned Successfully",
        description: `Contributor ID: ${parsedData.contributorId}`,
      });
    } else {
      toast({
        title: "QR Code Scanned",
        description: "Raw data: " + data.substring(0, 50) + (data.length > 50 ? '...' : ''),
      });
    }
    
    closeScanner();
  };

  return {
    isOpen,
    openScanner,
    closeScanner,
    handleScan
  };
};
