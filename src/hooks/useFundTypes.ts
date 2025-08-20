
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFundTypes = () => {
  const query = useQuery({
    queryKey: ['fund-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fund_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  return {
    // New interface
    fundTypes: query.data,
    isLoading: query.isLoading,
    error: query.error,
    // Backward compatibility
    data: query.data,
    ...query
  };
};
