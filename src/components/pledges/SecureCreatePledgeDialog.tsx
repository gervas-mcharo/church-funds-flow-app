
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CreatePledgeDialog } from "@/components/pledges/CreatePledgeDialog";
import { usePledgePermissions } from "@/hooks/usePledgePermissions";

export function SecureCreatePledgeDialog() {
  const { canCreatePledges } = usePledgePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!canCreatePledges()) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button disabled variant="outline" className="opacity-50">
              <Lock className="h-4 w-4 mr-2" />
              Create Pledge
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>You don't have permission to create pledges</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create Pledge
      </Button>
      {dialogOpen && (
        <CreatePledgeDialog onClose={() => setDialogOpen(false)} />
      )}
    </>
  );
}
