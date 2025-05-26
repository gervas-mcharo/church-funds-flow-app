
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReportFilters } from '@/pages/Reports';

export const useReportData = (filters: ReportFilters) => {
  return useQuery({
    queryKey: ['report-data', filters],
    queryFn: async () => {
      let query = supabase
        .from('contributions')
        .select(`
          *,
          contributors (id, name, email),
          fund_types (id, name)
        `);

      // Apply date filters
      if (filters.startDate) {
        query = query.gte('contribution_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('contribution_date', filters.endDate.toISOString());
      }

      // Apply specific filters based on report type
      if (filters.reportType === 'individual' && filters.contributorId) {
        query = query.eq('contributor_id', filters.contributorId);
      }
      if (filters.reportType === 'fund-type' && filters.fundTypeId) {
        query = query.eq('fund_type_id', filters.fundTypeId);
      }

      query = query.order('contribution_date', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!(filters.reportType === 'summary' || 
                (filters.reportType === 'individual' && filters.contributorId) ||
                (filters.reportType === 'fund-type' && filters.fundTypeId))
  });
};
