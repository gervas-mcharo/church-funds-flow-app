
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AuditLogEntry {
  action: 'create' | 'update' | 'delete' | 'assign_personnel' | 'remove_personnel';
  department_id: string;
  department_name: string;
  details?: any;
  previous_values?: any;
  new_values?: any;
}

export function useDepartmentAudit() {
  const { user } = useAuth();

  const logAuditEntry = useMutation({
    mutationFn: async (entry: AuditLogEntry) => {
      if (!user) return;

      console.log('Department Audit Log:', {
        user_id: user.id,
        action: entry.action,
        department_id: entry.department_id,
        department_name: entry.department_name,
        details: entry.details,
        previous_values: entry.previous_values,
        new_values: entry.new_values,
        timestamp: new Date().toISOString()
      });

      // You could extend this to write to a dedicated audit_logs table if needed
      // For now, we're using console logging for audit trail
    }
  });

  const logDepartmentCreated = (departmentId: string, departmentName: string, departmentData: any) => {
    logAuditEntry.mutate({
      action: 'create',
      department_id: departmentId,
      department_name: departmentName,
      new_values: departmentData
    });
  };

  const logDepartmentUpdated = (departmentId: string, departmentName: string, previousData: any, newData: any) => {
    logAuditEntry.mutate({
      action: 'update',
      department_id: departmentId,
      department_name: departmentName,
      previous_values: previousData,
      new_values: newData
    });
  };

  const logDepartmentDeleted = (departmentId: string, departmentName: string, departmentData: any) => {
    logAuditEntry.mutate({
      action: 'delete',
      department_id: departmentId,
      department_name: departmentName,
      previous_values: departmentData
    });
  };

  const logPersonnelAssigned = (departmentId: string, departmentName: string, userId: string, role: string) => {
    logAuditEntry.mutate({
      action: 'assign_personnel',
      department_id: departmentId,
      department_name: departmentName,
      details: { assigned_user_id: userId, assigned_role: role }
    });
  };

  const logPersonnelRemoved = (departmentId: string, departmentName: string, userId: string, role: string) => {
    logAuditEntry.mutate({
      action: 'remove_personnel',
      department_id: departmentId,
      department_name: departmentName,
      details: { removed_user_id: userId, removed_role: role }
    });
  };

  return {
    logDepartmentCreated,
    logDepartmentUpdated,
    logDepartmentDeleted,
    logPersonnelAssigned,
    logPersonnelRemoved
  };
}
