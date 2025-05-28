
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface CreateUserFormProps {
  roleLabels: Record<AppRole, string>;
  roleCategories: {
    leadership: string[];
    financial: string[];
    departmental: string[];
    operational: string[];
  };
}

export function CreateUserForm({ roleLabels, roleCategories }: CreateUserFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async ({ firstName, lastName, email, password, role }: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      role: AppRole;
    }) => {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
        email_confirm: true, // Auto-confirm email
      });

      if (authError) throw authError;

      // Assign the role
      if (authData.user && role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role });
        
        if (roleError) throw roleError;
      }

      return authData;
    },
    onSuccess: () => {
      toast({ title: "User created successfully" });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setSelectedRole("");
    },
    onError: (error) => {
      toast({ 
        title: "Error creating user", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleCreateUser = () => {
    if (firstName && lastName && email && password && selectedRole) {
      createUserMutation.mutate({
        firstName,
        lastName,
        email,
        password,
        role: selectedRole as AppRole
      });
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create New User
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@example.com"
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>
        
        <div>
          <Label htmlFor="role">Initial Role</Label>
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a role..." />
            </SelectTrigger>
            <SelectContent>
              <div className="space-y-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Leadership</div>
                {roleCategories.leadership.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role as AppRole]}
                  </SelectItem>
                ))}
                
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Financial</div>
                {roleCategories.financial.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role as AppRole]}
                  </SelectItem>
                ))}
                
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Departmental</div>
                {roleCategories.departmental.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role as AppRole]}
                  </SelectItem>
                ))}
                
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Operational</div>
                {roleCategories.operational.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role as AppRole]}
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          className="w-full" 
          onClick={handleCreateUser}
          disabled={!firstName || !lastName || !email || !password || !selectedRole || createUserMutation.isPending}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {createUserMutation.isPending ? "Creating..." : "Create User"}
        </Button>
      </CardContent>
    </Card>
  );
}
