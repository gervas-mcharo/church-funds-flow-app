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
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          firstName,
          lastName,
          email,
          password,
          role
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.warning) {
        toast({
          title: "User created with warning",
          description: data.warning,
          variant: "default"
        });
      }

      return data;
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
      console.error('Create user error:', error);
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
                    {role === 'treasurer' && (
                      <span className="ml-2 text-xs text-blue-600">(Church-wide)</span>
                    )}
                    {role === 'department_treasurer' && (
                      <span className="ml-2 text-xs text-green-600">(Department-specific)</span>
                    )}
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
          {selectedRole === 'treasurer' && (
            <p className="text-xs text-blue-600 mt-1">
              This role provides church-wide financial access to all funds and contributions.
            </p>
          )}
          {selectedRole === 'department_treasurer' && (
            <p className="text-xs text-green-600 mt-1">
              This role provides financial access only to assigned department funds. 
              Department assignment must be done separately after user creation.
            </p>
          )}
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
