
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, QrCode } from "lucide-react";

const contributors = [
  { id: 1, name: "John Smith", email: "john@email.com", phone: "(555) 123-4567", defaultFund: "Tithes", totalContributions: 12500, status: "Active" },
  { id: 2, name: "Mary Johnson", email: "mary@email.com", phone: "(555) 234-5678", defaultFund: "Building Fund", totalContributions: 8900, status: "Active" },
  { id: 3, name: "David Brown", email: "david@email.com", phone: "(555) 345-6789", defaultFund: "Missions", totalContributions: 5600, status: "Active" },
  { id: 4, name: "Sarah Wilson", email: "sarah@email.com", phone: "(555) 456-7890", defaultFund: "Youth Ministry", totalContributions: 3200, status: "Inactive" },
];

const Contributors = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contributors</h1>
            <p className="text-gray-600 mt-1">Manage church contributor information and history</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Contributor
          </Button>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Contributor Directory</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search contributors..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Default Fund</TableHead>
                  <TableHead>Total Contributions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributors.map((contributor) => (
                  <TableRow key={contributor.id}>
                    <TableCell className="font-medium">{contributor.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{contributor.email}</div>
                        <div className="text-gray-500">{contributor.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{contributor.defaultFund}</TableCell>
                    <TableCell>${contributor.totalContributions.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={contributor.status === 'Active' ? 'default' : 'secondary'}>
                        {contributor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Contributors;
