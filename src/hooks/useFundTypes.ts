
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFundTypes = () => {
  return useQuery({
    queryKey: ['fund-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fund_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });
};
