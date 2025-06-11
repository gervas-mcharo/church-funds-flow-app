
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: userRole, isLoading } = useQuery({
    queryKey: ['current-user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data?.role || null;
    },
    enabled: !!user?.id,
  });

  const canManageUsers = () => {
    return userRole === 'super_administrator' || userRole === 'administrator';
  };

  const isSuperAdmin = () => {
    return userRole === 'super_administrator';
  };

  const isAdmin = () => {
    return userRole === 'administrator';
  };

  const canManageDepartments = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canManagePersonnel = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  return {
    userRole,
    isLoading,
    canManageUsers,
    isSuperAdmin,
    isAdmin,
    canManageDepartments,
    canManagePersonnel,
  };
};
