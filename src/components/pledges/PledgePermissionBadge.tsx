
import { Badge } from "@/components/ui/badge";
import { Shield, Edit, Plus, Trash2, Eye } from "lucide-react";
import { usePledgePermissions } from "@/hooks/usePledgePermissions";

export function PledgePermissionBadge() {
  const { getPledgeAccessLevel, userRole } = usePledgePermissions();
  
  const accessLevel = getPledgeAccessLevel();
  
  const getPermissionConfig = () => {
    switch (accessLevel) {
      case 'full':
        return {
          icon: Shield,
          text: 'Full Access',
          variant: 'default' as const,
          description: 'Can create, edit, and delete pledges'
        };
      case 'manage':
        return {
          icon: Edit,
          text: 'Manage Access',
          variant: 'secondary' as const,
          description: 'Can create and edit pledges'
        };
      case 'create':
        return {
          icon: Plus,
          text: 'Create Access',
          variant: 'outline' as const,
          description: 'Can create new pledges'
        };
      case 'view':
        return {
          icon: Eye,
          text: 'View Only',
          variant: 'outline' as const,
          description: 'Can view pledges only'
        };
      default:
        return {
          icon: Trash2,
          text: 'No Access',
          variant: 'destructive' as const,
          description: 'Cannot access pledges'
        };
    }
  };

  const config = getPermissionConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
      <span className="text-xs text-gray-500">
        {userRole && `(${userRole.replace('_', ' ')})`}
      </span>
    </div>
  );
}
