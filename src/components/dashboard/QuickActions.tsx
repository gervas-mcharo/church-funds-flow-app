
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { QrCode, Plus, FileText, Users } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { useQRScanner } from "@/hooks/useQRScanner";
import { CreateContributorDialog } from "@/components/contributors/CreateContributorDialog";
import { CreateFundTypeDialog } from "@/components/fund-types/CreateFundTypeDialog";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const { isOpen, openScanner, closeScanner, handleScan } = useQRScanner();
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
            onClick={openScanner}
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

      <Sheet open={isOpen} onOpenChange={closeScanner}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>QR Code Scanner</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <QRScanner onScan={handleScan} onClose={closeScanner} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
