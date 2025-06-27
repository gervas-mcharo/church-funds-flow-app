
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, AlertTriangle, DollarSign, Lock, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PledgeManagementActions } from "@/components/pledges/PledgeManagementActions";
import { usePledgePermissions } from "@/hooks/usePledgePermissions";
import { Pledge } from "@/hooks/usePledges";

interface SecurePledgeManagementActionsProps {
  pledge: Pledge;
}

export function SecurePledgeManagementActions({ pledge }: SecurePledgeManagementActionsProps) {
  const { canEditPledges, canManagePledgeStatus, canDeletePledges } = usePledgePermissions();

  const SecureButton = ({ 
    canAccess, 
    children, 
    tooltipText,
    ...props 
  }: { 
    canAccess: boolean; 
    children: React.ReactNode; 
    tooltipText: string;
  } & React.ComponentProps<typeof Button>) => {
    if (!canAccess) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button {...props} disabled variant="outline" className="opacity-50">
                <Lock className="h-4 w-4 mr-2" />
                {children}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <Button {...props}>{children}</Button>;
  };

  // If user has no permissions at all, show restricted message
  if (!canEditPledges() && !canManagePledgeStatus() && !canDeletePledges()) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Lock className="h-4 w-4" />
        <span>Limited access - view only</span>
      </div>
    );
  }

  // If user has some permissions, show the full component with restrictions
  return <PledgeManagementActions pledge={pledge} />;
}
