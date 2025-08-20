
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDepartments() {
  const query = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  return {
    departments: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
