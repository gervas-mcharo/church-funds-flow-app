
import { useUserRole } from "@/hooks/useUserRole";
import { useDepartmentOwnership } from "@/hooks/useDepartmentOwnership";
import { useUserTreasurerDepartments } from "@/hooks/useDepartmentTreasurers";

export const useDepartmentFinancialPermissions = (departmentId?: string) => {
  const { userRole, isLoading } = useUserRole();
  const { canManageThisDepartment } = useDepartmentOwnership(departmentId);
  const { data: treasurerDepartments } = useUserTreasurerDepartments();

  // Church-wide treasurer permissions (current treasurer role)
  const isChurchTreasurer = () => {
    return userRole === 'treasurer';
  };

  // Department-specific treasurer permissions
  const isDepartmentTreasurer = (targetDepartmentId?: string) => {
    if (!targetDepartmentId || !treasurerDepartments) return false;
    return treasurerDepartments.some(dept => dept.department_id === targetDepartmentId);
  };

  // Check if user is treasurer for the current department
  const isCurrentDepartmentTreasurer = () => {
    return departmentId ? isDepartmentTreasurer(departmentId) : false;
  };

  // Financial access for department funds
  const canAccessDepartmentFinances = (targetDepartmentId?: string) => {
    // Church treasurers can access all department finances
    if (isChurchTreasurer()) return true;
    
    // Department treasurers can only access their own department's finances
    if (isDepartmentTreasurer(targetDepartmentId)) return true;
    
    // Other financial roles with church-wide access
    return userRole === 'administrator' || 
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
    
    return userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  // Contribution management for departments
  const canManageDepartmentContributions = (targetDepartmentId?: string) => {
    if (isChurchTreasurer()) return true;
    if (isDepartmentTreasurer(targetDepartmentId)) return true;
    
    return userRole === 'administrator' || 
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
    
    return userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  // Fund assignment permissions (only church-wide roles)
  const canAssignFundsToDepartments = () => {
    return userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'treasurer' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  // Department treasurer assignment permissions
  const canAssignDepartmentTreasurers = () => {
    return userRole === 'administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  return {
    userRole,
    isLoading,
    treasurerDepartments: treasurerDepartments || [],
    isChurchTreasurer,
    isDepartmentTreasurer,
    isCurrentDepartmentTreasurer,
    canAccessDepartmentFinances,
    canManageDepartmentFunds,
    canManageDepartmentContributions,
    canApproveDepartmentRequests,
    canAssignFundsToDepartments,
    canAssignDepartmentTreasurers,
  };
};
