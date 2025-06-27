
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { QrCode } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { useQRScanner } from "@/hooks/useQRScanner";
import { CreateContributorDialog } from "@/components/contributors/CreateContributorDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function HeaderQuickActions() {
  const { isOpen, openScanner, closeScanner, handleScan } = useQRScanner();

  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={openScanner}
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
