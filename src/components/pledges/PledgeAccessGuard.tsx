
import { ReactNode } from "react";
import { usePledgePermissions } from "@/hooks/usePledgePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";

interface PledgeAccessGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function PledgeAccessGuard({ children, fallback }: PledgeAccessGuardProps) {
  const { canAccessPledges, isLoading, userRole } = usePledgePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!canAccessPledges()) {
    return fallback || (
      <div className="flex items-center justify-center min-h-64">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You don't have permission to access Pledge Management. This feature is restricted to authorized personnel only.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Lock className="h-4 w-4" />
              <span>Current role: {userRole || 'No role assigned'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
