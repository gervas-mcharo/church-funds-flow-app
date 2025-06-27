
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SecurityAuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function useSecurityAuditLogs() {
  return useQuery({
    queryKey: ['security-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as SecurityAuditLog[];
    }
  });
}

export function useLogSecurityEvent() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({
      action,
      tableName,
      recordId,
      oldValues,
      newValues
    }: {
      action: string;
      tableName: string;
      recordId?: string;
      oldValues?: any;
      newValues?: any;
    }) => {
      const { error } = await supabase.rpc('log_security_event', {
        _action: action,
        _table_name: tableName,
        _record_id: recordId || null,
        _old_values: oldValues || null,
        _new_values: newValues || null
      });
      
      if (error) throw error;
    },
    onError: (error) => {
      console.error('Failed to log security event:', error);
      // Don't show toast for audit logging failures to avoid user confusion
    }
  });
}

// Client-side security monitoring
export const useSecurityMonitoring = () => {
  const logSecurityEvent = useLogSecurityEvent();
  
  const logSuspiciousActivity = (activity: string, details: any) => {
    console.warn('Suspicious activity detected:', activity, details);
    logSecurityEvent.mutate({
      action: 'SUSPICIOUS_ACTIVITY',
      tableName: 'client_monitoring',
      newValues: { activity, details, timestamp: new Date().toISOString() }
    });
  };
  
  const logFailedAuthentication = (email: string, reason: string) => {
    logSecurityEvent.mutate({
      action: 'FAILED_AUTH',
      tableName: 'authentication',
      newValues: { email, reason, timestamp: new Date().toISOString() }
    });
  };
  
  const logDataAccess = (tableName: string, operation: string, recordId?: string) => {
    logSecurityEvent.mutate({
      action: `DATA_${operation.toUpperCase()}`,
      tableName,
      recordId,
      newValues: { timestamp: new Date().toISOString() }
    });
  };
  
  return {
    logSuspiciousActivity,
    logFailedAuthentication,
    logDataAccess
  };
};
