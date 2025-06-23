
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, AlertTriangle } from "lucide-react";
import { useDepartmentPermissions } from "@/hooks/useDepartmentPermissions";

interface DepartmentAccessGuardProps {
  children: ReactNode;
  requirePermission: 'view' | 'manage' | 'full';
  departmentId?: string;
  fallbackMessage?: string;
  showLoading?: boolean;
}

export function DepartmentAccessGuard({ 
  children, 
  requirePermission,
  departmentId,
  fallbackMessage,
  showLoading = true
}: DepartmentAccessGuardProps) {
  const { 
    getDepartmentAccessLevel,
    getPersonnelAccessLevel,
    isLoading 
  } = useDepartmentPermissions(departmentId);

  if (isLoading && showLoading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading permissions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const departmentAccess = getDepartmentAccessLevel();
  const personnelAccess = getPersonnelAccessLevel(departmentId);
  
  // Determine which access level to check based on context
  const currentAccess = departmentId ? personnelAccess : departmentAccess;

  const hasAccess = () => {
    switch (requirePermission) {
      case 'view':
        return ['view', 'manage', 'full'].includes(currentAccess);
      case 'manage':
        return ['manage', 'full'].includes(currentAccess);
      case 'full':
        return currentAccess === 'full';
      default:
        return false;
    }
  };

  if (!hasAccess()) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {currentAccess === 'none' ? (
                <Lock className="h-12 w-12 text-red-500" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-yellow-500" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentAccess === 'none' ? 'Access Denied' : 'Insufficient Permissions'}
            </h3>
            <p className="text-gray-600">
              {fallbackMessage || 
               `You need ${requirePermission} access to view this content. Your current access level is: ${currentAccess}`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
