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

  // Fund management permissions - updated to include treasurer
  const canManageFunds = () => {
    return userRole && ![
      'head_of_department',
      'department_member', 
      'secretary',
      'department_treasurer' // Department treasurers have limited fund access
    ].includes(userRole) && [
      'super_administrator',
      'administrator', 
      'finance_administrator',
      'finance_manager',
      'finance_elder',
      'treasurer', // Church treasurer has full access
      'general_secretary',
      'pastor'
    ].includes(userRole);
  };

  const canCreateFunds = () => {
    return userRole && ![
      'head_of_department',
      'department_member', 
      'secretary',
      'department_treasurer' // Department treasurers cannot create new funds
    ].includes(userRole) && [
      'super_administrator',
      'administrator', 
      'finance_administrator',
      'treasurer',
      'general_secretary',
      'pastor'
    ].includes(userRole);
  };

  const canDeleteFunds = () => {
    return userRole && ![
      'head_of_department',
      'department_member', 
      'secretary',
      'department_treasurer' // Department treasurers cannot delete funds
    ].includes(userRole) && [
      'super_administrator',
      'administrator', 
      'finance_administrator',
      'general_secretary',
      'pastor'
    ].includes(userRole);
  };

  const canViewFunds = () => {
    // Include department treasurers in fund viewing (they'll see filtered results)
    return userRole && ![
      'head_of_department',
      'department_member', 
      'secretary'
    ].includes(userRole);
  };

  const getFundAccessLevel = () => {
    if (canCreateFunds()) return 'full';
    if (canManageFunds()) return 'manage';
    if (canViewFunds()) return 'view';
    return 'none';
  };

  // Contributor management permissions - updated to include treasurer
  const canCreateContributors = () => {
    return userRole && ![
      'head_of_department',
      'department_member', 
      'secretary',
      'department_treasurer' // Department treasurers cannot create contributors
    ].includes(userRole) && [
      'super_administrator',
      'administrator', 
      'finance_administrator',
      'treasurer',
      'general_secretary',
      'pastor'
    ].includes(userRole);
  };

  const canEditContributors = () => {
    return userRole && ![
      'head_of_department',
      'department_member', 
      'secretary',
      'department_treasurer' // Department treasurers cannot edit contributors
    ].includes(userRole) && [
      'super_administrator',
      'administrator', 
      'finance_administrator',
      'finance_manager',
      'finance_elder',
      'treasurer',
      'general_secretary',
      'pastor'
    ].includes(userRole);
  };

  const canDeleteContributors = () => {
    return userRole && ![
      'head_of_department',
      'department_member', 
      'secretary',
      'department_treasurer' // Department treasurers cannot delete contributors
    ].includes(userRole) && [
      'super_administrator',
      'administrator', 
      'finance_administrator',
      'general_secretary',
      'pastor'
    ].includes(userRole);
  };

  const canViewContributors = () => {
    // Department treasurers can view contributors for their department contributions
    return userRole && ![
      'head_of_department',
      'department_member', 
      'secretary'
    ].includes(userRole);
  };

  const getContributorAccessLevel = () => {
    if (canCreateContributors()) return 'full';
    if (canEditContributors()) return 'manage';
    if (canViewContributors()) return 'view';
    return 'none';
  };

  // QR Management permissions - updated to include treasurer but not department_treasurer
  const canAccessQRManagement = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'treasurer' || 
           userRole === 'data_entry_clerk' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canGenerateQRCodes = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'treasurer' || 
           userRole === 'data_entry_clerk' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canBulkGenerateQRCodes = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'treasurer' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canDownloadQRCodes = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'treasurer' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canDeleteQRCodes = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator';
  };

  const getQRAccessLevel = () => {
    if (canBulkGenerateQRCodes()) return 'full';
    if (canGenerateQRCodes()) return 'create';
    if (canAccessQRManagement()) return 'view';
    return 'none';
  };

  return {
    userRole,
    isLoading,
    canManageUsers,
    isSuperAdmin,
    isAdmin,
    canManageDepartments,
    canManagePersonnel,
    canManageFunds,
    canCreateFunds,
    canDeleteFunds,
    canViewFunds,
    getFundAccessLevel,
    canCreateContributors,
    canEditContributors,
    canDeleteContributors,
    canViewContributors,
    getContributorAccessLevel,
    canAccessQRManagement,
    canGenerateQRCodes,
    canBulkGenerateQRCodes,
    canDownloadQRCodes,
    canDeleteQRCodes,
    getQRAccessLevel,
  };
};
