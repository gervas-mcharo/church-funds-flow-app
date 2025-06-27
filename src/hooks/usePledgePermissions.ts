
import { useUserRole } from "@/hooks/useUserRole";

export const usePledgePermissions = () => {
  const { userRole, isLoading } = useUserRole();

  const canAccessPledges = () => {
    // Only finance, leadership, administrative, and contributor roles can access pledges
    // Explicitly exclude departmental roles
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
      'treasurer'
    ].includes(userRole);
  };

  const canCreatePledges = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'data_entry_clerk' ||
           userRole === 'general_secretary' ||
           userRole === 'pastor';
  };

  const canBulkImportPledges = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canEditPledges = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
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
           userRole === 'treasurer';
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
