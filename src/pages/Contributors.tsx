import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Upload, Download, Edit, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge";
import { DeleteContributorDialog } from "@/components/contributors/DeleteContributorDialog";
import { PermissionStatusBadge } from "@/components/contributors/PermissionStatusBadge";
import { useUserRole } from "@/hooks/useUserRole";
import { useContributors, useCreateContributor, useUpdateContributor } from "@/hooks/useContributors";
import { ContributorAccessGuard } from "@/components/contributors/ContributorAccessGuard";

interface Contributor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

const Contributors = () => {
  const [newContributor, setNewContributor] = useState({ name: "", email: "", phone: "" });
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [contributorToDelete, setContributorToDelete] = useState<Contributor | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getContributorAccessLevel, userRole } = useUserRole();

  const { data: contributors, isLoading } = useContributors();
  const createContributorMutation = useCreateContributor();
  const updateContributorMutation = useUpdateContributor();

  const handleCreateContributor = () => {
    if (newContributor.name.trim()) {
      createContributorMutation.mutate(newContributor, {
        onSuccess: () => {
          setNewContributor({ name: "", email: "", phone: "" });
          setShowCreateDialog(false);
          toast({ title: "Contributor created successfully" });
        },
        onError: (error) => {
          toast({ 
            title: "Error creating contributor", 
            description: error.message, 
            variant: "destructive" 
          });
        }
      });
    }
  };

  const handleUpdateContributor = () => {
    if (editingContributor) {
      updateContributorMutation.mutate(editingContributor, {
        onSuccess: () => {
          setEditingContributor(null);
          setShowEditDialog(false);
          toast({ title: "Contributor updated successfully" });
        },
        onError: (error) => {
          toast({ 
            title: "Error updating contributor", 
            description: error.message, 
            variant: "destructive" 
          });
        }
      });
    }
  };

  const handleDeleteContributor = (contributor: Contributor) => {
    setContributorToDelete(contributor);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div>Loading contributors...</div>
      </DashboardLayout>
    );
  }

  const headerContent = (
    <div className="flex items-center gap-4">
      <PermissionStatusBadge 
        accessLevel={getContributorAccessLevel()} 
        userRole={userRole || undefined}
      />
      <Button onClick={() => setShowCreateDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Contributor
      </Button>
    </div>
  );

  return (
    <ContributorAccessGuard>
      <DashboardLayout 
        title="Contributors" 
        description="Manage list of contributors"
        headerContent={headerContent}
      >
        <div className="container mx-auto py-10">

          <Card>
            <CardHeader>
              <CardTitle>Contributors List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>A list of your contributors.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributors?.map((contributor) => (
                    <TableRow key={contributor.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${contributor.email}.png`} />
                          <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>{contributor.name}</TableCell>
                      <TableCell>{contributor.email}</TableCell>
                      <TableCell>{contributor.phone}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                                setEditingContributor(contributor);
                                setShowEditDialog(true);
                              }}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteContributor(contributor)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              {/* <Button>Open Dialog</Button> */}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Contributor</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input 
                    id="name" 
                    value={newContributor.name}
                    onChange={(e) => setNewContributor(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input 
                    type="email" 
                    id="email" 
                    value={newContributor.email}
                    onChange={(e) => setNewContributor(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input 
                    type="tel" 
                    id="phone" 
                    value={newContributor.phone}
                    onChange={(e) => setNewContributor(prev => ({ ...prev, phone: e.target.value }))}
                    className="col-span-3" 
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" onClick={handleCreateContributor} disabled={createContributorMutation.isPending}>
                  {createContributorMutation.isPending ? "Creating..." : "Create Contributor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              {/* <Button>Open Dialog</Button> */}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Contributor</DialogTitle>
              </DialogHeader>
              {editingContributor && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input 
                      id="name" 
                      value={editingContributor.name}
                      onChange={(e) => setEditingContributor(prev => 
                        prev ? { ...prev, name: e.target.value } : null
                      )}
                      className="col-span-3" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input 
                      type="email" 
                      id="email" 
                      value={editingContributor.email || ""}
                      onChange={(e) => setEditingContributor(prev => 
                        prev && prev ? { ...prev, email: e.target.value } : null
                      )}
                      className="col-span-3" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input 
                      type="tel" 
                      id="phone" 
                      value={editingContributor.phone || ""}
                      onChange={(e) => setEditingContributor(prev => 
                        prev ? { ...prev, phone: e.target.value } : null
                      )}
                      className="col-span-3" 
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button type="submit" onClick={handleUpdateContributor} disabled={updateContributorMutation.isPending}>
                  {updateContributorMutation.isPending ? "Updating..." : "Update Contributor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <DeleteContributorDialog
            contributor={contributorToDelete}
            open={!!contributorToDelete}
            onOpenChange={(open) => !open && setContributorToDelete(null)}
          />
        </div>
      </DashboardLayout>
    </ContributorAccessGuard>
  );
};

export default Contributors;
