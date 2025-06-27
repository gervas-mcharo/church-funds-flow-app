
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Users, Building2 } from "lucide-react";

export function TreasurerRoleInfo() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Info className="h-5 w-5" />
          Treasurer Role Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-blue-100 text-blue-800">Current: Treasurer</Badge>
                <span className="text-sm font-medium">Church-Wide Financial Access</span>
              </div>
              <p className="text-sm text-gray-600">
                Full access to all funds, contributions, pledges, and QR management across the entire church.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-amber-100 text-amber-800">Future: Department Treasurer</Badge>
                <span className="text-sm font-medium">Department-Specific Access</span>
              </div>
              <p className="text-sm text-gray-600">
                Limited access to financial data only for their assigned department.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> The current "Treasurer" role provides church-wide financial access. 
            Future updates will introduce department-specific treasurer roles for enhanced financial segregation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
