import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Database, Edit, Trash2, Lock, Eye } from "lucide-react";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useDeleteFundType } from "@/hooks/useDeleteFundType";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { useUserRole } from "@/hooks/useUserRole";
import { EditFundTypeDialog } from "@/components/fund-types/EditFundTypeDialog";
import { CreateFundTypeDialog } from "@/components/fund-types/CreateFundTypeDialog";
import { useToast } from "@/hooks/use-toast";
import { FundAccessGuard } from "@/components/fund-types/FundAccessGuard";

const FundTypes = () => {
  const {
    data: fundTypes,
    isLoading
  } = useFundTypes();
  const deleteFundType = useDeleteFundType();
  const {
    formatAmount
  } = useCurrencySettings();
  const {
    canManageFunds,
    canCreateFunds,
    canDeleteFunds,
    canViewFunds,
    getFundAccessLevel,
    userRole,
    isLoading: roleLoading
  } = useUserRole();
  const { toast } = useToast();
  const [editingFundType, setEditingFundType] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEdit = (fundType: any) => {
    if (!canManageFunds()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit funds.",
        variant: "destructive"
      });
      return;
    }
    setEditingFundType(fundType);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!canDeleteFunds()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete funds.",
        variant: "destructive"
      });
      return;
    }
    deleteFundType.mutate(id);
  };

  const accessLevel = getFundAccessLevel();
  const showAccessDenied = !canViewFunds();

  if (roleLoading) {
    return <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Loading permissions...</div>
      </div>
    </DashboardLayout>;
  }

  const headerContent = (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          accessLevel === 'full' ? 'bg-green-100 text-green-800' :
          accessLevel === 'manage' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {accessLevel === 'full' && '✓ Full Access'}
          {accessLevel === 'manage' && '👁 Manage Access'}
          {accessLevel === 'view' && <><Eye className="h-3 w-3 inline mr-1" />View Only</>}
        </div>
        <span className="text-sm text-gray-500">
          Role: {userRole?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      </div>
      
      {canCreateFunds() ? (
        <CreateFundTypeDialog />
      ) : (
        <div className="flex items-center gap-2 text-gray-500">
          <Lock className="h-4 w-4" />
          <span className="text-sm">Create access restricted</span>
        </div>
      )}
    </div>
  );

  return (
    <FundAccessGuard>
      <DashboardLayout 
        title="Fund Management" 
        description="Manage different types of funds and offerings"
        headerContent={headerContent}
      >
        <div className="space-y-6">

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="text-center py-8">Loading fund types...</div> : <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Opening Balance</TableHead>
                      <TableHead>Current Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundTypes?.map(fundType => <TableRow key={fundType.id}>
                        <TableCell className="font-medium">{fundType.name}</TableCell>
                        <TableCell>{fundType.description}</TableCell>
                        <TableCell>{formatAmount(fundType.opening_balance || 0)}</TableCell>
                        <TableCell>{formatAmount(fundType.current_balance || 0)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${fundType.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {fundType.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {accessLevel === 'view' ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <Eye className="h-4 w-4" />
                              <span className="text-sm">View Only</span>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              {canManageFunds() ? (
                                <Button size="sm" variant="outline" onClick={() => handleEdit(fundType)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" disabled title="Edit access restricted">
                                  <Lock className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {canDeleteFunds() ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Fund Type</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{fundType.name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(fundType.id)} className="bg-red-600 hover:bg-red-700">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <Button size="sm" variant="outline" disabled title="Delete access restricted">
                                  <Lock className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>}
            </CardContent>
          </Card>

          {editingFundType && canManageFunds() && <EditFundTypeDialog fundType={editingFundType} open={editDialogOpen} onOpenChange={open => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingFundType(null);
          }
        }} />}
        </div>
      </DashboardLayout>
    </FundAccessGuard>
  );
};

export default FundTypes;
