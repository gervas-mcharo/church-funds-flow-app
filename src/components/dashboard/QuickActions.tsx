
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, FileText } from "lucide-react";
import { QRContributionScanner } from "@/components/contributions/QRContributionScanner";
import { CreateContributorDialog } from "@/components/contributors/CreateContributorDialog";
import { CreateFundTypeDialog } from "@/components/fund-types/CreateFundTypeDialog";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const navigate = useNavigate();

  const handleGenerateReport = () => {
    navigate('/reports');
  };

  return (
    <>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="default"
            className="w-full justify-start gap-3 h-12"
            onClick={() => setIsQRScannerOpen(true)}
          >
            <QrCode className="h-5 w-5" />
            Scan QR Code
          </Button>
          
          <div className="w-full">
            <CreateContributorDialog />
          </div>
          
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={handleGenerateReport}
          >
            <FileText className="h-5 w-5" />
            Generate Report
          </Button>
          
          <div className="w-full">
            <CreateFundTypeDialog />
          </div>
        </CardContent>
      </Card>

      <QRContributionScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </>
  );
}
