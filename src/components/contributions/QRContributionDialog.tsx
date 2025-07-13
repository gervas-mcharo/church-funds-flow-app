import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Camera, QrCode, User, DollarSign, Check, Plus, Layers, Clock } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useContributors } from '@/hooks/useContributors';
import { useFundTypes } from '@/hooks/useFundTypes';
import { useCreateContribution, useCreateBatchContributions } from '@/hooks/useContributions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const contributionSchema = z.object({
  contributorId: z.string().min(1, 'Contributor is required'),
  fundTypeId: z.string().min(1, 'Fund type is required'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface QRContributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScannedContribution {
  id: string;
  contributorId: string;
  fundTypeId: string;
  contributorName: string;
  fundTypeName: string;
  amount: string;
  timestamp: Date;
}

export const QRContributionDialog = ({ isOpen, onClose }: QRContributionDialogProps) => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [batchContributions, setBatchContributions] = useState<ScannedContribution[]>([]);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout>();
  
  const { toast } = useToast();
  const { data: contributors } = useContributors();
  const { data: fundTypes } = useFundTypes();
  const createContribution = useCreateContribution();
  const createBatchContributions = useCreateBatchContributions();
  
  const {
    stream,
    permissionState,
    isLoading,
    error,
    startCamera,
    stopCamera
  } = useCamera();

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      contributorId: '',
      fundTypeId: '',
      amount: '',
    },
  });

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (scannedData) {
      form.setValue('contributorId', scannedData.contributorId);
      form.setValue('fundTypeId', scannedData.fundTypeId);
    }
  }, [scannedData, form]);

  // Auto-start camera when dialog opens
  useEffect(() => {
    if (isOpen && !stream && !isLoading) {
      startCamera();
    }
  }, [isOpen]);

  const detectQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Using a simple approach - in real implementation, you'd use a QR detection library
      // For now, we'll simulate QR detection
      
      // This is a placeholder - you'd integrate with jsQR or similar library here
      if (Math.random() < 0.1) { // Simulate occasional detection
        handleQRDetected('{"contributorId":"test-id","fundTypeId":"test-fund"}');
      }
    } catch (error) {
      console.error('QR detection error:', error);
    }
  };

  const handleQRDetected = (qrData: string) => {
    const now = Date.now();
    if (now - lastScanTime < 2000) return; // Prevent duplicate scans
    
    try {
      const parsedData = JSON.parse(qrData);
      if (!parsedData.contributorId || !parsedData.fundTypeId) return;
      
      const contributor = contributors?.find(c => c.id === parsedData.contributorId);
      const fundType = fundTypes?.find(f => f.id === parsedData.fundTypeId);
      
      if (!contributor || !fundType) {
        toast({
          title: 'Invalid QR Code',
          description: 'Contributor or fund type not found',
          variant: 'destructive',
        });
        return;
      }
      
      setLastScanTime(now);
      
      if (mode === 'single') {
        setScannedData({
          ...parsedData,
          contributorName: contributor.name,
          fundTypeName: fundType.name,
        });
        setIsScanning(false);
        
        toast({
          title: 'QR Code Scanned',
          description: `${contributor.name} - ${fundType.name}`,
        });
      } else {
        // Batch mode
        const newContribution: ScannedContribution = {
          id: Date.now().toString(),
          contributorId: parsedData.contributorId,
          fundTypeId: parsedData.fundTypeId,
          contributorName: contributor.name,
          fundTypeName: fundType.name,
          amount: '',
          timestamp: new Date(),
        };
        
        setBatchContributions(prev => [...prev, newContribution]);
        
        toast({
          title: 'Added to Batch',
          description: `${contributor.name} - ${fundType.name}`,
        });
      }
    } catch (error) {
      console.error('Error parsing QR data:', error);
    }
  };

  const startScanning = async () => {
    await startCamera();
    setIsScanning(true);
    
    scanIntervalRef.current = setInterval(detectQRCode, 300);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  const handleSubmit = async (data: ContributionFormData) => {
    try {
      await createContribution.mutateAsync({
        contributor_id: data.contributorId,
        fund_type_id: data.fundTypeId,
        amount: parseFloat(data.amount),
        contribution_date: new Date().toISOString(),
      });

      toast({
        title: 'Contribution Recorded',
        description: `Successfully recorded $${data.amount}`,
      });

      // Reset form
      form.reset();
      setScannedData(null);
      
      // Ask if they want to continue
      if (confirm('Continue scanning more contributions?')) {
        startScanning();
      } else {
        handleClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record contribution',
        variant: 'destructive',
      });
    }
  };

  const handleBatchSubmit = async () => {
    const validContributions = batchContributions.filter(c => c.amount && parseFloat(c.amount) > 0);
    
    if (validContributions.length === 0) {
      toast({
        title: 'No Valid Contributions',
        description: 'Please add amounts to at least one contribution',
        variant: 'destructive',
      });
      return;
    }

    try {
      const contributionData = validContributions.map(c => ({
        contributor_id: c.contributorId,
        fund_type_id: c.fundTypeId,
        amount: parseFloat(c.amount),
        contribution_date: new Date().toISOString(),
      }));

      await createBatchContributions.mutateAsync(contributionData);

      toast({
        title: 'Batch Submitted',
        description: `Recorded ${validContributions.length} contributions`,
      });

      setBatchContributions([]);
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit batch',
        variant: 'destructive',
      });
    }
  };

  const updateBatchAmount = (id: string, amount: string) => {
    setBatchContributions(prev =>
      prev.map(c => c.id === id ? { ...c, amount } : c)
    );
  };

  const removeBatchContribution = (id: string) => {
    setBatchContributions(prev => prev.filter(c => c.id !== id));
  };

  const handleClose = () => {
    stopScanning();
    stopCamera();
    setScannedData(null);
    setBatchContributions([]);
    form.reset();
    onClose();
  };

  const selectedContributor = contributors?.find(c => c.id === form.watch('contributorId'));
  const selectedFundType = fundTypes?.find(f => f.id === form.watch('fundTypeId'));
  const batchTotal = batchContributions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Contribution Entry
            <div className="ml-auto flex gap-2">
              <Button
                variant={mode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('single')}
              >
                Single
              </Button>
              <Button
                variant={mode === 'batch' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('batch')}
              >
                <Layers className="h-4 w-4 mr-1" />
                Batch
                {batchContributions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {batchContributions.length}
                  </Badge>
                )}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date/Time Display */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {format(new Date(), 'EEEE, MMM dd, yyyy')} at {format(new Date(), 'h:mm a')}
          </div>

          {/* Camera Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="relative">
                  {stream ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-48 bg-black rounded object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      
                      {/* Scanning overlay */}
                      {isScanning && (
                        <div className="absolute inset-0 border-2 border-primary rounded pointer-events-none">
                          <div className="absolute inset-4 border-2 border-primary/60 rounded animate-pulse">
                            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary"></div>
                          </div>
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                            SCANNING
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-48 bg-muted rounded flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {error ? error : 'Camera not available'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={isScanning ? stopScanning : startScanning}
                    disabled={!stream || isLoading}
                    className="flex-1"
                    variant={isScanning ? "destructive" : "default"}
                  >
                    {isScanning ? 'Stop Scanning' : 'Start Scanning'}
                  </Button>
                  
                  {/* Test button for development */}
                  <Button
                    variant="outline"
                    onClick={() => handleQRDetected('{"contributorId":"test-id","fundTypeId":"test-fund"}')}
                  >
                    Test Scan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Single Mode Form */}
          {mode === 'single' && (
            <Card>
              <CardContent className="p-4">
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  {scannedData && (
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Check className="h-4 w-4" />
                        QR Code Scanned
                      </div>
                      <p className="text-sm mt-1">
                        {scannedData.contributorName} → {scannedData.fundTypeName}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Contributor</Label>
                      <Select
                        value={form.watch('contributorId')}
                        onValueChange={(value) => form.setValue('contributorId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select contributor" />
                        </SelectTrigger>
                        <SelectContent>
                          {contributors?.map((contributor) => (
                            <SelectItem key={contributor.id} value={contributor.id}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {contributor.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Fund Type</Label>
                      <Select
                        value={form.watch('fundTypeId')}
                        onValueChange={(value) => form.setValue('fundTypeId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fund" />
                        </SelectTrigger>
                        <SelectContent>
                          {fundTypes?.map((fundType) => (
                            <SelectItem key={fundType.id} value={fundType.id}>
                              {fundType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-10 text-lg"
                        {...form.register('amount')}
                      />
                    </div>
                    {form.formState.errors.amount && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.amount.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createContribution.isPending}
                  >
                    {createContribution.isPending ? 'Recording...' : 'Record Contribution'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Batch Mode */}
          {mode === 'batch' && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Batch Contributions</h3>
                    {batchContributions.length > 0 && (
                      <Badge variant="outline">
                        Total: ${batchTotal.toFixed(2)}
                      </Badge>
                    )}
                  </div>

                  {batchContributions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Scan QR codes to add contributions</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {batchContributions.map((contribution, index) => (
                        <div key={contribution.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <span className="font-medium">{contribution.contributorName}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBatchContribution(contribution.id)}
                            >
                              ×
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {contribution.fundTypeName}
                          </p>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Amount"
                            value={contribution.amount}
                            onChange={(e) => updateBatchAmount(contribution.id, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {batchContributions.length > 0 && (
                    <>
                      <Separator />
                      <Button 
                        onClick={handleBatchSubmit}
                        className="w-full"
                        disabled={createBatchContributions.isPending}
                      >
                        {createBatchContributions.isPending 
                          ? 'Submitting...' 
                          : `Submit Batch (${batchContributions.length})`
                        }
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};