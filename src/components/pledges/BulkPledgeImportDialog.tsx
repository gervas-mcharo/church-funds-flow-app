
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useContributors } from "@/hooks/useContributors";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useCreatePledge } from "@/hooks/usePledges";
import { useToast } from "@/hooks/use-toast";
import { parsePledgeCSVFile, downloadPledgeTemplateCSV, PledgeCSVRow } from "@/services/pledgeCSVService";

export function BulkPledgeImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<PledgeCSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [importComplete, setImportComplete] = useState(false);

  const { data: contributors = [] } = useContributors();
  const { data: fundTypes = [] } = useFundTypes();
  const createPledge = useCreatePledge();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setCsvData([]);
    setImportComplete(false);

    try {
      const data = await parsePledgeCSVFile(selectedFile);
      setCsvData(data);
      toast({
        title: "File parsed successfully",
        description: `Found ${data.length} pledge records`
      });
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to parse CSV file']);
    }
  };

  const validatePledgeData = (pledgeData: PledgeCSVRow[]) => {
    const validationErrors: string[] = [];
    
    pledgeData.forEach((pledge, index) => {
      // Check if contributor exists
      const contributor = contributors.find(c => 
        c.name.toLowerCase().trim() === pledge.contributor_name.toLowerCase().trim()
      );
      if (!contributor) {
        validationErrors.push(`Row ${index + 1}: Contributor "${pledge.contributor_name}" not found`);
      }

      // Check if fund type exists
      const fundType = fundTypes.find(f => 
        f.name.toLowerCase().trim() === pledge.fund_type_name.toLowerCase().trim()
      );
      if (!fundType) {
        validationErrors.push(`Row ${index + 1}: Fund type "${pledge.fund_type_name}" not found`);
      }

      // Validate installment data
      if (pledge.frequency !== 'one_time') {
        if (pledge.installment_amount && pledge.installment_amount > pledge.pledge_amount) {
          validationErrors.push(`Row ${index + 1}: Installment amount cannot exceed total pledge amount`);
        }
      }
    });

    return validationErrors;
  };

  const handleImport = async () => {
    if (csvData.length === 0) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setErrors([]);

    // Validate data
    const validationErrors = validatePledgeData(csvData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setIsProcessing(false);
      return;
    }

    const importErrors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < csvData.length; i++) {
      const pledge = csvData[i];
      
      try {
        // Find contributor and fund type
        const contributor = contributors.find(c => 
          c.name.toLowerCase().trim() === pledge.contributor_name.toLowerCase().trim()
        );
        const fundType = fundTypes.find(f => 
          f.name.toLowerCase().trim() === pledge.fund_type_name.toLowerCase().trim()
        );

        if (!contributor || !fundType) {
          throw new Error('Contributor or fund type not found');
        }

        const pledgeData = {
          contributor_id: contributor.id,
          fund_type_id: fundType.id,
          pledge_amount: pledge.pledge_amount,
          frequency: pledge.frequency,
          installment_amount: pledge.installment_amount,
          number_of_installments: pledge.number_of_installments,
          start_date: pledge.start_date,
          end_date: pledge.end_date,
          purpose: pledge.purpose,
          notes: pledge.notes
        };

        await createPledge.mutateAsync(pledgeData);
        successCount++;
      } catch (error) {
        importErrors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Failed to create pledge'}`);
      }

      setProcessedCount(i + 1);
    }

    setErrors(importErrors);
    setIsProcessing(false);
    setImportComplete(true);

    toast({
      title: "Import completed",
      description: `Successfully imported ${successCount} pledges. ${importErrors.length} errors occurred.`,
      variant: importErrors.length > 0 ? "destructive" : "default"
    });
  };

  const resetDialog = () => {
    setFile(null);
    setCsvData([]);
    setErrors([]);
    setProcessedCount(0);
    setImportComplete(false);
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import Pledges
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Pledges</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Download Template</p>
                <p className="text-sm text-gray-600">Get the CSV template with sample data</p>
              </div>
            </div>
            <Button variant="outline" onClick={downloadPledgeTemplateCSV}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </div>

          {/* File Info */}
          {file && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <strong>File:</strong> {file.name} ({csvData.length} records)
              </p>
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing pledges...</span>
                <span>{processedCount}/{csvData.length}</span>
              </div>
              <Progress value={(processedCount / csvData.length) * 100} />
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Import Errors:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {errors.length > 5 && (
                      <li>... and {errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {importComplete && errors.length === 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                All pledges imported successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {importComplete ? 'Close' : 'Cancel'}
            </Button>
            {csvData.length > 0 && !importComplete && (
              <Button 
                onClick={handleImport} 
                disabled={isProcessing || errors.length > 0}
              >
                {isProcessing ? 'Importing...' : `Import ${csvData.length} Pledges`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
