
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Database, Plus, Edit, Trash2 } from "lucide-react";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useCreateFundType } from "@/hooks/useCreateFundType";
import { useDeleteFundType } from "@/hooks/useDeleteFundType";
import { EditFundTypeDialog } from "@/components/fund-types/EditFundTypeDialog";

const FundTypes = () => {
  const { data: fundTypes, isLoading } = useFundTypes();
  const createFundType = useCreateFundType();
  const deleteFundType = useDeleteFundType();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingFundType, setEditingFundType] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createFundType.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    }, {
      onSuccess: () => {
        setName("");
        setDescription("");
      }
    });
  };

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fund Types Management</h1>
          <p className="text-gray-600 mt-1">Manage different types of funds and offerings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Fund Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Fund Type Name</Label>
                  <Input 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Building Fund"
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this fund type..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createFundType.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  {createFundType.isPending ? "Adding..." : "Add Fund Type"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Existing Fund Types
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
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundTypes?.map((fundType) => (
                        <TableRow key={fundType.id}>
                          <TableCell className="font-medium">{fundType.name}</TableCell>
                          <TableCell>{fundType.description}</TableCell>
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
          </div>
        </div>

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
