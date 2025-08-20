import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MoneyRequestReportData = {
  request_id: string;
  purpose: string;
  amount: number;
  status: string;
  department_name: string;
  fund_name: string;
  requester_name: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  approval_duration_days?: number;
};

export type MoneyRequestSummary = {
  total_requests: number;
  total_amount_requested: number;
  total_amount_approved: number;
  total_amount_rejected: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  draft_requests: number;
  average_approval_time_days?: number;
};

export type DepartmentRequestSummary = {
  department_id: string;
  department_name: string;
  total_requests: number;
  total_amount_requested: number;
  total_amount_approved: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
};

export function useMoneyRequestReports(filters: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  status?: string;
  fundTypeId?: string;
}) {
  const { user } = useAuth();

  const { data: reportData, isLoading: reportLoading, error: reportError } = useQuery({
    queryKey: ["money-request-reports", filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("money_requests")
        .select(`
          id,
          purpose,
          amount,
          status,
          created_at,
          approved_at,
          rejected_at,
          rejection_reason,
          requesting_department_id,
          fund_type_id,
          requester_id
        `);

      // Apply filters
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.departmentId) {
        query = query.eq('requesting_department_id', filters.departmentId);
      }
      if (filters.status && filters.status !== "") {
        query = query.eq('status', filters.status as any);
      }
      if (filters.fundTypeId) {
        query = query.eq('fund_type_id', filters.fundTypeId);
      }

      const { data: requests, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Get related data separately
      const [departmentsData, fundTypesData, profilesData] = await Promise.all([
        supabase.from('departments').select('id, name'),
        supabase.from('fund_types').select('id, name'),
        supabase.from('profiles').select('id, first_name, last_name, email')
      ]);

      if (departmentsData.error) throw departmentsData.error;
      if (fundTypesData.error) throw fundTypesData.error;
      if (profilesData.error) throw profilesData.error;

      // Create lookup maps
      const departmentMap = new Map(departmentsData.data?.map(d => [d.id, d.name]));
      const fundTypeMap = new Map(fundTypesData.data?.map(f => [f.id, f.name]));
      const profileMap = new Map(profilesData.data?.map(p => [p.id, p]));

      return requests?.map(request => {
        const profile = profileMap.get(request.requester_id);
        return {
          request_id: request.id,
          purpose: request.purpose,
          amount: request.amount,
          status: request.status,
          department_name: departmentMap.get(request.requesting_department_id) || 'Unknown',
          fund_name: fundTypeMap.get(request.fund_type_id) || 'Unknown',
          requester_name: profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.email || 'Unknown',
          created_at: request.created_at,
          approved_at: request.approved_at,
          rejected_at: request.rejected_at,
          rejection_reason: request.rejection_reason,
          approval_duration_days: request.approved_at
            ? Math.ceil((new Date(request.approved_at).getTime() - new Date(request.created_at).getTime()) / (1000 * 60 * 60 * 24))
            : undefined,
        };
      }) as MoneyRequestReportData[] || [];
    },
    enabled: !!user,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["money-request-summary", filters],
    queryFn: async () => {
      if (!reportData) return null;

      const totalRequests = reportData.length;
      const totalAmountRequested = reportData.reduce((sum, req) => sum + req.amount, 0);
      const approvedRequests = reportData.filter(req => req.status === 'approved');
      const rejectedRequests = reportData.filter(req => req.status === 'rejected');
      const pendingRequests = reportData.filter(req => 
        !['approved', 'rejected', 'draft'].includes(req.status)
      );
      const draftRequests = reportData.filter(req => req.status === 'draft');

      const totalAmountApproved = approvedRequests.reduce((sum, req) => sum + req.amount, 0);
      const totalAmountRejected = rejectedRequests.reduce((sum, req) => sum + req.amount, 0);

      const approvalTimes = approvedRequests
        .map(req => req.approval_duration_days)
        .filter(duration => duration !== undefined) as number[];
      
      const averageApprovalTime = approvalTimes.length > 0
        ? approvalTimes.reduce((sum, time) => sum + time, 0) / approvalTimes.length
        : undefined;

      return {
        total_requests: totalRequests,
        total_amount_requested: totalAmountRequested,
        total_amount_approved: totalAmountApproved,
        total_amount_rejected: totalAmountRejected,
        pending_requests: pendingRequests.length,
        approved_requests: approvedRequests.length,
        rejected_requests: rejectedRequests.length,
        draft_requests: draftRequests.length,
        average_approval_time_days: averageApprovalTime,
      } as MoneyRequestSummary;
    },
    enabled: !!reportData,
  });

  const { data: departmentSummary, isLoading: departmentLoading } = useQuery({
    queryKey: ["money-request-department-summary", filters],
    queryFn: async () => {
      if (!reportData) return [];

      const departmentMap = new Map<string, DepartmentRequestSummary>();

      reportData.forEach(request => {
        const deptName = request.department_name;
        if (!departmentMap.has(deptName)) {
          departmentMap.set(deptName, {
            department_id: '', // We don't have this in the current query
            department_name: deptName,
            total_requests: 0,
            total_amount_requested: 0,
            total_amount_approved: 0,
            pending_requests: 0,
            approved_requests: 0,
            rejected_requests: 0,
          });
        }

        const summary = departmentMap.get(deptName)!;
        summary.total_requests++;
        summary.total_amount_requested += request.amount;

        switch (request.status) {
          case 'approved':
            summary.approved_requests++;
            summary.total_amount_approved += request.amount;
            break;
          case 'rejected':
            summary.rejected_requests++;
            break;
          default:
            if (!['draft'].includes(request.status)) {
              summary.pending_requests++;
            }
            break;
        }
      });

      return Array.from(departmentMap.values());
    },
    enabled: !!reportData,
  });

  return {
    reportData: reportData || [],
    summary,
    departmentSummary: departmentSummary || [],
    isLoading: reportLoading || summaryLoading || departmentLoading,
    error: reportError,
  };
}