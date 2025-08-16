import { Badge } from "@/components/ui/badge";
import { Lock, Shield, Eye } from "lucide-react";

interface PermissionStatusBadgeProps {
  accessLevel: 'full' | 'manage' | 'view' | 'none';
  userRole?: string;
}

export const PermissionStatusBadge = ({
  accessLevel,
  userRole
}: PermissionStatusBadgeProps) => {
  const getPermissionConfig = () => {
    switch (accessLevel) {
      case 'full':
        return {
          icon: Shield,
          text: 'Full Access',
          variant: 'default' as const,
          description: 'Can create, edit, and delete contributors'
        };
      case 'manage':
        return {
          icon: Shield,
          text: 'Manage Access',
          variant: 'secondary' as const,
          description: 'Can edit contributors'
        };
      case 'view':
        return {
          icon: Eye,
          text: 'View Only',
          variant: 'outline' as const,
          description: 'Cannot access contributors'
        };
      case 'none':
      default:
        return {
          icon: Lock,
          text: 'No Access',
          variant: 'destructive' as const,
          description: 'Cannot access contributors'
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
      {userRole && (
        <span className="text-xs text-muted-foreground">
          ({userRole.replace('_', ' ')})
        </span>
      )}
    </div>
  );
};