
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { QRContributionDialog } from "@/components/contributions/QRContributionDialog";
import { CreateContributorDialog } from "@/components/contributors/CreateContributorDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function HeaderQuickActions() {
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsQRDialogOpen(true)}
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

      <QRContributionDialog
        isOpen={isQRDialogOpen}
        onClose={() => setIsQRDialogOpen(false)}
      />
    </>
  );
}
