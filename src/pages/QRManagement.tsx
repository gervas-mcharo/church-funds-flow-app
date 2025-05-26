
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { qr-code, plus, export } from "lucide-react";

const QRManagement = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Management</h1>
          <p className="text-gray-600 mt-1">Generate and manage QR codes for contributors and fund types</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <qr-code className="h-5 w-5" />
                Generate Individual QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contributor">Contributor</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contributor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-smith">John Smith</SelectItem>
                    <SelectItem value="mary-johnson">Mary Johnson</SelectItem>
                    <SelectItem value="david-brown">David Brown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fund-type">Default Fund Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fund type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tithes">Tithes & Offerings</SelectItem>
                    <SelectItem value="building">Building Fund</SelectItem>
                    <SelectItem value="missions">Missions</SelectItem>
                    <SelectItem value="youth">Youth Ministry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">
                <plus className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <export className="h-5 w-5" />
                Bulk QR Code Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bulk-type">Generation Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-contributors">All Contributors</SelectItem>
                    <SelectItem value="fund-type">By Fund Type</SelectItem>
                    <SelectItem value="department">By Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="format">Print Format</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="envelope">Offering Envelopes</SelectItem>
                    <SelectItem value="cards">QR Cards</SelectItem>
                    <SelectItem value="labels">Adhesive Labels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" variant="outline">
                <export className="h-4 w-4 mr-2" />
                Generate Bulk QR Codes
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Generated QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 text-center">
                  <div className="w-24 h-24 bg-gray-100 mx-auto mb-3 rounded-lg flex items-center justify-center">
                    <qr-code className="h-12 w-12 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-gray-900">Contributor {i}</h4>
                  <p className="text-sm text-gray-500">Tithes & Offerings</p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QRManagement;
