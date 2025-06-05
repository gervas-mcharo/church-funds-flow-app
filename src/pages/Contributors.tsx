
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, QrCode } from "lucide-react";
import { useContributors } from "@/hooks/useContributors";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateContributorDialog } from "@/components/contributors/CreateContributorDialog";
import { EditContributorDialog } from "@/components/contributors/EditContributorDialog";

const Contributors = () => {
  const { data: contributors, isLoading } = useContributors();
  const [editingContributor, setEditingContributor] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Fetch contribution totals for each contributor
  const { data: contributionTotals } = useQuery({
    queryKey: ['contribution-totals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          contributor_id,
          amount
        `);
      
      if (error) throw error;
      
      // Calculate totals by contributor
      const totals = data.reduce((acc, contribution) => {
        acc[contribution.contributor_id] = (acc[contribution.contributor_id] || 0) + Number(contribution.amount);
        return acc;
      }, {} as Record<string, number>);
      
      return totals;
    }
  });

  const handleEditContributor = (contributor: any) => {
    setEditingContributor(contributor);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading contributors...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contributors</h1>
            <p className="text-gray-600 mt-1">Manage church contributor information and history</p>
          </div>
          <CreateContributorDialog />
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
                  <TableHead>Total Contributions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributors?.map((contributor) => (
                  <TableRow key={contributor.id}>
                    <TableCell className="font-medium">{contributor.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{contributor.email || 'No email'}</div>
                        <div className="text-gray-500">{contributor.phone || 'No phone'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      ${(contributionTotals?.[contributor.id] || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditContributor(contributor)}
                        >
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

        {editingContributor && (
          <EditContributorDialog
            contributor={editingContributor}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) {
                setEditingContributor(null);
              }
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Contributors;
