
import { useUserRole } from "@/hooks/useUserRole";
import { useDepartmentOwnership } from "@/hooks/useDepartmentOwnership";

export const useDepartmentFinancialPermissions = (departmentId?: string) => {
  const { userRole, isLoading } = useUserRole();
  const { canManageThisDepartment } = useDepartmentOwnership(departmentId);

  // Church-wide treasurer permissions (current treasurer role)
  const isChurchTreasurer = () => {
    return userRole === 'treasurer';
  };

  // Department-specific treasurer permissions (placeholder for future implementation)
  const isDepartmentTreasurer = (targetDepartmentId?: string) => {
    // This will be implemented when department_treasurer role is added to the database
    // For now, return false as this role doesn't exist yet
    return false;
  };

  // Financial access for department funds
  const canAccessDepartmentFinances = (targetDepartmentId?: string) => {
    // Church treasurers can access all department finances
    if (isChurchTreasurer()) return true;
    
    // Department treasurers can only access their own department's finances
    if (isDepartmentTreasurer(targetDepartmentId)) return true;
    
    // Other financial roles with church-wide access
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  // Fund management permissions
  const canManageDepartmentFunds = (targetDepartmentId?: string) => {
    if (isChurchTreasurer()) return true;
    if (isDepartmentTreasurer(targetDepartmentId)) return true;
    
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  // Contribution management for departments
  const canManageDepartmentContributions = (targetDepartmentId?: string) => {
    if (isChurchTreasurer()) return true;
    if (isDepartmentTreasurer(targetDepartmentId)) return true;
    
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  // Money request approvals at department level
  const canApproveDepartmentRequests = (targetDepartmentId?: string) => {
    if (isChurchTreasurer()) return true;
    if (isDepartmentTreasurer(targetDepartmentId)) return true;
    
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  return {
    userRole,
    isLoading,
    isChurchTreasurer,
    isDepartmentTreasurer,
    canAccessDepartmentFinances,
    canManageDepartmentFunds,
    canManageDepartmentContributions,
    canApproveDepartmentRequests,
  };
};
