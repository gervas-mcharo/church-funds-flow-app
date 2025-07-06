import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Trash2, Save, QrCode } from 'lucide-react';
import { useContributors } from '@/hooks/useContributors';
import { useFundTypes } from '@/hooks/useFundTypes';
import { useCreateBatchContributions } from '@/hooks/useContributions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface QRScanData {
  contributorId: string;
  fundTypeId: string;
  contributorName?: string;
  fundTypeName?: string;
  timestamp: string;
}

interface BatchContributionItem {
  id: string;
  qrData: QRScanData;
  amount: string;
  notes?: string;
}

interface BatchContributionFormProps {
  onClose: () => void;
  onStartScan: () => void;
  scanHistory: Array<{ data: string; timestamp: Date }>;
  onClearHistory: () => void;
}

export const BatchContributionForm = ({ 
  onClose, 
  onStartScan, 
  scanHistory, 
  onClearHistory 
}: BatchContributionFormProps) => {
  const [contributions, setContributions] = useState<BatchContributionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: contributors } = useContributors();
  const { data: fundTypes } = useFundTypes();
  const createBatchContributions = useCreateBatchContributions();

  // Process scan history into contribution items
  const processScannedQR = (qrDataString: string) => {
    try {
      const qrData = JSON.parse(qrDataString);
      if (qrData.contributorId && qrData.fundTypeId) {
        const contributor = contributors?.find(c => c.id === qrData.contributorId);
        const fundType = fundTypes?.find(f => f.id === qrData.fundTypeId);
        
        const newItem: BatchContributionItem = {
          id: Date.now().toString(),
          qrData: {
            ...qrData,
            contributorName: contributor?.name,
            fundTypeName: fundType?.name,
          },
          amount: '',
          notes: '',
        };
        
        setContributions(prev => [...prev, newItem]);
        return true;
      }
    } catch (error) {
      console.error('Failed to parse QR data:', error);
    }
    return false;
  };

  // Process new scans from history
  const handleProcessScans = () => {
    let processed = 0;
    scanHistory.forEach(scan => {
      if (processScannedQR(scan.data)) {
        processed++;
      }
    });
    
    if (processed > 0) {
      toast({
        title: 'QR Codes Processed',
        description: `Added ${processed} items to batch`,
      });
      onClearHistory();
    }
  };

  const updateContribution = (id: string, field: 'amount' | 'notes', value: string) => {
    setContributions(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeContribution = (id: string) => {
    setContributions(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    const validContributions = contributions.filter(item => 
      item.amount && parseFloat(item.amount) > 0
    );

    if (validContributions.length === 0) {
      toast({
        title: 'No Contributions',
        description: 'Please add amounts to at least one contribution',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const contributionData = validContributions.map(item => ({
        contributor_id: item.qrData.contributorId,
        fund_type_id: item.qrData.fundTypeId,
        amount: parseFloat(item.amount),
        notes: item.notes || null,
        contribution_date: new Date().toISOString(),
      }));

      await createBatchContributions.mutateAsync(contributionData);

      toast({
        title: 'Batch Submitted',
        description: `Successfully recorded ${validContributions.length} contributions`,
      });

      setContributions([]);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit batch contributions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = contributions
    .filter(item => item.amount)
    .reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Batch Contribution Entry
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, MMM dd, yyyy')}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onStartScan}>
              <QrCode className="h-4 w-4 mr-2" />
              Scan More QR Codes
            </Button>
            {scanHistory.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleProcessScans}>
                <Plus className="h-4 w-4 mr-2" />
                Process Scans ({scanHistory.length})
              </Button>
            )}
          </div>
        </div>

        {contributions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No contributions added yet.</p>
            <p className="text-sm">Scan QR codes to add contributions to this batch.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contributions.map((item, index) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">
                        {item.qrData.contributorName || 'Unknown Contributor'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.qrData.fundTypeName || 'Unknown Fund'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeContribution(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Amount</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={item.amount}
                      onChange={(e) => updateContribution(item.id, 'amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Input
                      placeholder="Optional notes"
                      value={item.notes}
                      onChange={(e) => updateContribution(item.id, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {contributions.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">
                Total: ${totalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || contributions.length === 0}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : `Submit Batch (${contributions.length})`}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};