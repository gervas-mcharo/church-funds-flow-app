
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, Plus, Download } from "lucide-react";
import { useContributors } from "@/hooks/useContributors";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useQRCodes, useGenerateQRCode } from "@/hooks/useQRCodes";
import { useToast } from "@/hooks/use-toast";
import { generateQRCodeImage } from "@/services/qrCodeService";

const QRManagement = () => {
  const [selectedContributor, setSelectedContributor] = useState<string>("");
  const [selectedFundType, setSelectedFundType] = useState<string>("");
  const [bulkType, setBulkType] = useState<string>("");
  const [printFormat, setPrintFormat] = useState<string>("");
  
  const { toast } = useToast();
  const { data: contributors, isLoading: contributorsLoading } = useContributors();
  const { data: fundTypes, isLoading: fundTypesLoading } = useFundTypes();
  const { data: qrCodes, isLoading: qrCodesLoading } = useQRCodes();
  const generateQRCode = useGenerateQRCode();

  const handleGenerateIndividualQR = async () => {
    if (!selectedContributor || !selectedFundType) {
      toast({
        title: "Missing Information",
        description: "Please select both a contributor and fund type.",
        variant: "destructive"
      });
      return;
    }

    try {
      await generateQRCode.mutateAsync({
        contributorId: selectedContributor,
        fundTypeId: selectedFundType
      });
      
      toast({
        title: "QR Code Generated",
        description: "QR code has been successfully generated and saved.",
      });
      
      // Reset form
      setSelectedContributor("");
      setSelectedFundType("");
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadQR = async (qrData: string, contributorName: string) => {
    try {
      const qrCodeImage = await generateQRCodeImage(qrData);
      
      // Create download link
      const link = document.createElement('a');
      link.href = qrCodeImage;
      link.download = `qr-code-${contributorName.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `QR code for ${contributorName} is being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Management</h1>
          <p className="text-gray-600 mt-1">Generate and manage QR codes for contributors and fund types</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Generate Individual QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contributor">Contributor</Label>
                <Select value={selectedContributor} onValueChange={setSelectedContributor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contributor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contributorsLoading ? (
                      <SelectItem value="loading" disabled>Loading contributors...</SelectItem>
                    ) : (
                      contributors?.map((contributor) => (
                        <SelectItem key={contributor.id} value={contributor.id}>
                          {contributor.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fund-type">Default Fund Type</Label>
                <Select value={selectedFundType} onValueChange={setSelectedFundType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fund type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundTypesLoading ? (
                      <SelectItem value="loading" disabled>Loading fund types...</SelectItem>
                    ) : (
                      fundTypes?.map((fundType) => (
                        <SelectItem key={fundType.id} value={fundType.id}>
                          {fundType.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full" 
                onClick={handleGenerateIndividualQR}
                disabled={generateQRCode.isPending || !selectedContributor || !selectedFundType}
              >
                <Plus className="h-4 w-4 mr-2" />
                {generateQRCode.isPending ? "Generating..." : "Generate QR Code"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Bulk QR Code Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bulk-type">Generation Type</Label>
                <Select value={bulkType} onValueChange={setBulkType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-contributors">All Contributors</SelectItem>
                    <SelectItem value="fund-type">By Fund Type</SelectItem>
                    <SelectItem value="department">By Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="format">Print Format</Label>
                <Select value={printFormat} onValueChange={setPrintFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="envelope">Offering Envelopes</SelectItem>
                    <SelectItem value="cards">QR Cards</SelectItem>
                    <SelectItem value="labels">Adhesive Labels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Generate Bulk QR Codes (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Generated QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {qrCodesLoading ? (
              <div className="text-center py-8">Loading QR codes...</div>
            ) : qrCodes && qrCodes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {qrCodes.map((qrCode) => (
                  <div key={qrCode.id} className="border border-gray-200 rounded-lg p-4 text-center">
                    <div className="w-24 h-24 bg-gray-100 mx-auto mb-3 rounded-lg flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-900">
                      {qrCode.contributors?.name || 'Unknown Contributor'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {qrCode.fund_types?.name || 'Unknown Fund Type'}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => handleDownloadQR(qrCode.qr_data, qrCode.contributors?.name || 'Unknown')}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No QR codes generated yet. Create your first QR code above.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QRManagement;
