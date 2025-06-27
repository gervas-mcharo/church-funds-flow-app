
import { useUserRole } from "@/hooks/useUserRole";

export const usePledgePermissions = () => {
  const { userRole, isLoading } = useUserRole();

  const canAccessPledges = () => {
    // All authenticated users can access pledges (at least view level)
    return !!userRole;
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
