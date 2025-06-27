
import { useUserRole } from "@/hooks/useUserRole";

export const usePledgePermissions = () => {
  const { userRole, isLoading } = useUserRole();

  const canAccessPledges = () => {
    // Include department_treasurer in pledge access
    return userRole && ![
      'head_of_department',
      'department_member', 
      'secretary'
    ].includes(userRole) && [
      'super_administrator',
      'administrator', 
      'finance_administrator',
      'finance_manager',
      'finance_elder',
      'data_entry_clerk',
      'general_secretary',
      'pastor',
      'treasurer',
      'department_treasurer' // Added department treasurer
    ].includes(userRole);
  };

  const canCreatePledges = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'data_entry_clerk' ||
           userRole === 'treasurer' ||
           userRole === 'department_treasurer' || // Added department treasurer
           userRole === 'general_secretary' ||
           userRole === 'pastor';
  };

  const canBulkImportPledges = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'treasurer' ||
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canEditPledges = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'treasurer' ||
           userRole === 'department_treasurer' || // Added department treasurer
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canDeletePledges = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator';
  };

  const canManagePledgeStatus = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canApplyContributions = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'treasurer' ||
           userRole === 'department_treasurer'; // Added department treasurer
  };

  const getPledgeAccessLevel = () => {
    if (canDeletePledges()) return 'full';
    if (canEditPledges()) return 'manage';
    if (canCreatePledges()) return 'create';
    if (canAccessPledges()) return 'view';
    return 'none';
  };

  return {
    userRole,
    isLoading,
    canAccessPledges,
    canCreatePledges,
    canBulkImportPledges,
    canEditPledges,
    canDeletePledges,
    canManagePledgeStatus,
    canApplyContributions,
    getPledgeAccessLevel,
  };
};
