import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, FileText } from "lucide-react";
import { useCreateContributor } from "@/hooks/useContributors";
import { useToast } from "@/hooks/use-toast";
import { downloadContributorsAsCSV, parseCSVFile, ContributorCSVRow } from "@/services/csvService";

interface ContributorCSVDialogProps {
  contributors: any[];
}

export function ContributorCSVDialog({ contributors }: ContributorCSVDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ContributorCSVRow[]>([]);
  const [activeTab, setActiveTab] = useState("export");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: createContributor } = useCreateContributor();
  const { toast } = useToast();

  const handleDownload = () => {
    try {
      downloadContributorsAsCSV(contributors);
      toast({
        title: "Success",
        description: "Contributors exported to CSV successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export contributors",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const data = await parseCSVFile(file);
      setParsedData(data);
      
      toast({
        title: "Success",
        description: `Parsed ${data.length} contributors from CSV`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse CSV file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "Error",
        description: "No data to import",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const contributor of parsedData) {
      try {
        await new Promise((resolve, reject) => {
          createContributor(contributor, {
            onSuccess: resolve,
            onError: reject,
          });
        });
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to import contributor ${contributor.name}:`, error);
      }
    }

    setUploading(false);
    setParsedData([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast({
      title: "Import Complete",
      description: `Successfully imported ${successCount} contributors. ${errorCount > 0 ? `Failed to import ${errorCount} contributors.` : ''}`,
      variant: errorCount > 0 ? "destructive" : "default",
    });

    if (successCount > 0) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          CSV Import/Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>CSV Import/Export</DialogTitle>
          <DialogDescription>
            Download current contributors or upload a CSV file to add new contributors.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4">
            <div className="text-sm text-gray-600">
              Download all current contributors as a CSV file.
            </div>
            <Button onClick={handleDownload} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Contributors CSV
            </Button>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <div className="text-sm text-gray-600">
              Upload a CSV file with columns: Name, Email, Phone. Name is required.
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="csv-file">Choose CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={uploading}
              />
            </div>

            {parsedData.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Preview ({parsedData.length} contributors found):
                </div>
                <div className="max-h-32 overflow-y-auto border rounded p-2 text-sm">
                  {parsedData.slice(0, 5).map((contributor, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{contributor.name}</span>
                      <span className="text-gray-500">{contributor.email || 'No email'}</span>
                    </div>
                  ))}
                  {parsedData.length > 5 && (
                    <div className="text-gray-500">...and {parsedData.length - 5} more</div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {activeTab === "import" && parsedData.length > 0 && (
            <Button onClick={handleImport} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Importing..." : `Import ${parsedData.length} Contributors`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
