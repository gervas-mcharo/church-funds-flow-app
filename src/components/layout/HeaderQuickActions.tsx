
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { QRContributionScanner } from "@/components/contributions/QRContributionScanner";
import { CreateContributorDialog } from "@/components/contributors/CreateContributorDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function HeaderQuickActions() {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsQRScannerOpen(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <QrCode className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Scan QR Code</p>
            </TooltipContent>
          </Tooltip>

          <CreateContributorDialog variant="header" />
        </div>
      </TooltipProvider>

      <QRContributionScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </>
  );
}
