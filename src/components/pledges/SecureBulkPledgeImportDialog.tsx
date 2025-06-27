
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BulkPledgeImportDialog } from "@/components/pledges/BulkPledgeImportDialog";
import { usePledgePermissions } from "@/hooks/usePledgePermissions";

export function SecureBulkPledgeImportDialog() {
  const { canBulkImportPledges } = usePledgePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!canBulkImportPledges()) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button disabled variant="outline" className="opacity-50">
              <Lock className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>You don't have permission to bulk import pledges</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
        <Upload className="h-4 w-4" />
        Bulk Import
      </Button>
      {dialogOpen && (
        <BulkPledgeImportDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
        />
      )}
    </>
  );
}
