
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReportFilters } from '@/pages/Reports';

interface SearchFilters {
  searchTerm: string;
  amountMin?: number;
  amountMax?: number;
  fundTypeFilter?: string;
  contributorFilter?: string;
}

export const useReportData = (filters: ReportFilters, searchFilters?: SearchFilters) => {
  return useQuery({
    queryKey: ['report-data', filters, searchFilters],
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

      // Apply search filters if provided
      if (searchFilters) {
        if (searchFilters.contributorFilter) {
          query = query.eq('contributor_id', searchFilters.contributorFilter);
        }
        if (searchFilters.fundTypeFilter) {
          query = query.eq('fund_type_id', searchFilters.fundTypeFilter);
        }
        if (searchFilters.amountMin !== undefined) {
          query = query.gte('amount', searchFilters.amountMin);
        }
        if (searchFilters.amountMax !== undefined) {
          query = query.lte('amount', searchFilters.amountMax);
        }
      }

      query = query.order('contribution_date', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;

      // Apply search term filter on the client side for more flexible searching
      if (searchFilters?.searchTerm) {
        const searchTerm = searchFilters.searchTerm.toLowerCase();
        return data?.filter(contribution => 
          contribution.contributors?.name?.toLowerCase().includes(searchTerm) ||
          contribution.contributors?.email?.toLowerCase().includes(searchTerm) ||
          contribution.fund_types?.name?.toLowerCase().includes(searchTerm) ||
          contribution.notes?.toLowerCase().includes(searchTerm) ||
          contribution.amount.toString().includes(searchTerm)
        ) || [];
      }

      return data;
    },
    enabled: !!(filters.reportType === 'summary' || 
                (filters.reportType === 'individual' && filters.contributorId) ||
                (filters.reportType === 'fund-type' && filters.fundTypeId))
  });
};
