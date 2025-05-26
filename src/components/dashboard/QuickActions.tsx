
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { QrCode, Plus, FileText, Users } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { useQRScanner } from "@/hooks/useQRScanner";

const actions = [
  { label: "Add Contributor", icon: Users, variant: "outline" as const },
  { label: "Generate Report", icon: FileText, variant: "outline" as const },
  { label: "Create Fund", icon: Plus, variant: "outline" as const },
];

export function QuickActions() {
  const { isOpen, openScanner, closeScanner, handleScan } = useQRScanner();

  return (
    <>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="default"
            className="w-full justify-start gap-3 h-12"
            onClick={openScanner}
          >
            <QrCode className="h-5 w-5" />
            Scan QR Code
          </Button>
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

      <Sheet open={isOpen} onOpenChange={closeScanner}>
        <SheetContent side="bottom" className="h-[80vh]">
          <QRScanner onScan={handleScan} onClose={closeScanner} />
        </SheetContent>
      </Sheet>
    </>
  );
}
