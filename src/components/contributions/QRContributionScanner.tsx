import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, User, Receipt, Layers } from 'lucide-react';
import { QRScanner } from '@/components/qr/QRScanner';
import { ContributionForm } from './ContributionForm';
import { BatchContributionForm } from './BatchContributionForm';
import { useQRScanner } from '@/hooks/useQRScanner';
import { useContributors } from '@/hooks/useContributors';
import { useFundTypes } from '@/hooks/useFundTypes';
import { parseQRData } from '@/services/qrCodeService';

interface QRContributionScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'scanner' | 'contribution-form' | 'batch-form';

export const QRContributionScanner = ({ isOpen, onClose }: QRContributionScannerProps) => {
  const [mode, setMode] = useState<Mode>('scanner');
  const [contributionData, setContributionData] = useState<any>(null);
  const { data: contributors } = useContributors();
  const { data: fundTypes } = useFundTypes();

  const handleContributionScan = (qrData: any) => {
    const contributor = contributors?.find(c => c.id === qrData.contributorId);
    const fundType = fundTypes?.find(f => f.id === qrData.fundTypeId);
    
    setContributionData({
      ...qrData,
      contributorName: contributor?.name,
      fundTypeName: fundType?.name,
    });
    setMode('contribution-form');
  };

  const {
    isScanning,
    scanHistory,
    startScanning,
    stopScanning,
    clearHistory,
    onScan
  } = useQRScanner({}, handleContributionScan);

  const handleScan = (data: string) => {
    const parsedData = parseQRData(data);
    if (parsedData && parsedData.contributorId && parsedData.fundTypeId) {
      onScan(data, { openContributionForm: true });
    } else {
      onScan(data);
    }
  };

  const handleClose = () => {
    setMode('scanner');
    setContributionData(null);
    clearHistory();
    onClose();
  };

  const handleContributionSuccess = () => {
    setMode('scanner');
    setContributionData(null);
  };

  const handleStartBatchMode = () => {
    setMode('batch-form');
  };

  const handleBackToScanner = () => {
    setMode('scanner');
    setContributionData(null);
  };

  const renderModeSelector = () => (
    <div className="flex gap-2 mb-4">
      <Button
        variant={mode === 'scanner' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setMode('scanner')}
        className="flex-1"
      >
        <QrCode className="h-4 w-4 mr-2" />
        Single Scan
      </Button>
      <Button
        variant={mode === 'batch-form' ? 'default' : 'outline'}
        size="sm"
        onClick={handleStartBatchMode}
        className="flex-1"
      >
        <Layers className="h-4 w-4 mr-2" />
        Batch Mode
        {scanHistory.length > 0 && (
          <Badge variant="secondary" className="ml-2">
            {scanHistory.length}
          </Badge>
        )}
      </Button>
    </div>
  );

  const renderContent = () => {
    switch (mode) {
      case 'contribution-form':
        return (
          <ContributionForm
            onClose={handleBackToScanner}
            initialData={contributionData}
            onSuccess={handleContributionSuccess}
          />
        );
      
      case 'batch-form':
        return (
          <BatchContributionForm
            onClose={handleClose}
            onStartScan={handleBackToScanner}
            scanHistory={scanHistory}
            onClearHistory={clearHistory}
          />
        );
      
      default:
        return (
          <>
            {renderModeSelector()}
            <QRScanner
              onScan={handleScan}
              onClose={handleClose}
              isScanning={isScanning}
              onStartScanning={startScanning}
              onStopScanning={stopScanning}
              scanHistory={scanHistory}
              onClearHistory={clearHistory}
            />
          </>
        );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Contribution Entry
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
};