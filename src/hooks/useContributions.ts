import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreateContributionData {
  contributor_id: string;
  fund_type_id: string;
  amount: number;
  notes?: string | null;
  contribution_date: string;
  department_id?: string | null;
  qr_code_id?: string | null;
}

export const useContributions = () => {
  return useQuery({
    queryKey: ['contributions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          contributors (name),
          fund_types (name),
          qr_codes (qr_data)
        `)
        .order('contribution_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCreateContribution = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contributionData: CreateContributionData) => {
      const { data, error } = await supabase
        .from('contributions')
        .insert(contributionData)
        .select(`
          *,
          contributors (name),
          fund_types (name)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['fund-balances'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['contribution-trends'] });
    }
  });
};

export const useCreateBatchContributions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contributions: CreateContributionData[]) => {
      const { data, error } = await supabase
        .from('contributions')
        .insert(contributions)
        .select(`
          *,
          contributors (name),
          fund_types (name)
        `);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['fund-balances'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['contribution-trends'] });
    }
  });
};