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
          description: 'Can view contributors only'
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
  return;
};