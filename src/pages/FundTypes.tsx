
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Database, Edit, Trash2 } from "lucide-react";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useDeleteFundType } from "@/hooks/useDeleteFundType";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { EditFundTypeDialog } from "@/components/fund-types/EditFundTypeDialog";
import { CreateFundTypeDialog } from "@/components/fund-types/CreateFundTypeDialog";

const FundTypes = () => {
  const { data: fundTypes, isLoading } = useFundTypes();
  const deleteFundType = useDeleteFundType();
  const { formatAmount } = useCurrencySettings();

  const [editingFundType, setEditingFundType] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEdit = (fundType: any) => {
    setEditingFundType(fundType);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteFundType.mutate(id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Funds Management</h1>
            <p className="text-gray-600 mt-1">Manage different types of funds and offerings</p>
          </div>
          <CreateFundTypeDialog />
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading fund types...</div>
            ) : (
              <Table>
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
                  {fundTypes?.map((fundType) => (
                    <TableRow key={fundType.id}>
                      <TableCell className="font-medium">{fundType.name}</TableCell>
                      <TableCell>{fundType.description}</TableCell>
                      <TableCell>{formatAmount(fundType.opening_balance || 0)}</TableCell>
                      <TableCell>{formatAmount(fundType.current_balance || 0)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          fundType.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {fundType.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(fundType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                                <AlertDialogAction 
                                  onClick={() => handleDelete(fundType.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {editingFundType && (
          <EditFundTypeDialog
            fundType={editingFundType}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) {
                setEditingFundType(null);
              }
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default FundTypes;
