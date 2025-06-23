
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, QrCode, Trash2, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useContributors } from "@/hooks/useContributors";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateContributorDialog } from "@/components/contributors/CreateContributorDialog";
import { EditContributorDialog } from "@/components/contributors/EditContributorDialog";
import { DeleteContributorDialog } from "@/components/contributors/DeleteContributorDialog";
import { ContributorCSVDialog } from "@/components/contributors/ContributorCSVDialog";
import { PermissionStatusBadge } from "@/components/contributors/PermissionStatusBadge";
import { useToast } from "@/hooks/use-toast";

const Contributors = () => {
  const { data: contributors, isLoading } = useContributors();
  const { 
    canCreateContributors, 
    canEditContributors, 
    canDeleteContributors, 
    canViewContributors,
    getContributorAccessLevel,
    userRole,
    isLoading: roleLoading 
  } = useUserRole();
  const { toast } = useToast();
  
  const [editingContributor, setEditingContributor] = useState<any>(null);
  const [deletingContributor, setDeletingContributor] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const accessLevel = getContributorAccessLevel();

  const handleEditContributor = (contributor: any) => {
    if (!canEditContributors()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit contributors",
        variant: "destructive",
      });
      return;
    }
    setEditingContributor(contributor);
    setEditDialogOpen(true);
  };

  const handleDeleteContributor = (contributor: any) => {
    if (!canDeleteContributors()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete contributors",
        variant: "destructive",
      });
      return;
    }
    setDeletingContributor(contributor);
    setDeleteDialogOpen(true);
  };

  const handleCreateContributor = () => {
    if (!canCreateContributors()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create contributors",
        variant: "destructive",
      });
      return;
    }
  };

  if (roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading permissions...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canViewContributors()) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Lock className="h-16 w-16 text-gray-400" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Access Restricted</h2>
            <p className="text-gray-600 mt-1">
              You don't have permission to view contributors. Please contact your administrator.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
            <div className="mt-3">
              <PermissionStatusBadge accessLevel={accessLevel} userRole={userRole} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canCreateContributors() ? (
              <>
                <ContributorCSVDialog contributors={contributors || []} />
                <CreateContributorDialog />
              </>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        variant="outline" 
                        disabled 
                        className="w-full justify-start gap-3 h-12 opacity-50"
                      >
                        <Lock className="h-4 w-4" />
                        Access Restricted
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You need additional permissions to create contributors</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
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
                  {(canEditContributors() || canDeleteContributors()) && <TableHead>Actions</TableHead>}
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
                    {(canEditContributors() || canDeleteContributors()) && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {canEditContributors() ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditContributor(contributor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" disabled>
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit access restricted</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          <Button size="sm" variant="outline">
                            <QrCode className="h-4 w-4" />
                          </Button>
                          
                          {canDeleteContributors() ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteContributor(contributor)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" disabled>
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete access restricted</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {accessLevel === 'view' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">View Only Access</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  You have read-only access to contributors. Contact your administrator for additional permissions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {editingContributor && canEditContributors() && (
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

        {deletingContributor && canDeleteContributors() && (
          <DeleteContributorDialog
            contributor={deletingContributor}
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) {
                setDeletingContributor(null);
              }
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Contributors;
