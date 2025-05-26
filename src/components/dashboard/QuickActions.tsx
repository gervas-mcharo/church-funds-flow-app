
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Plus, FileText, Users } from "lucide-react";

const actions = [
  { label: "Scan QR Code", icon: QrCode, variant: "default" as const },
  { label: "Add Contributor", icon: Users, variant: "outline" as const },
  { label: "Generate Report", icon: FileText, variant: "outline" as const },
  { label: "Create Fund", icon: Plus, variant: "outline" as const },
];

export function QuickActions() {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            className="w-full justify-start gap-3 h-12"
          >
            <action.icon className="h-5 w-5" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
