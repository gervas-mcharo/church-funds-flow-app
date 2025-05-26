
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useContributors = () => {
  return useQuery({
    queryKey: ['contributors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contributors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCreateContributor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contributor: { name: string; email?: string; phone?: string }) => {
      const { data, error } = await supabase
        .from('contributors')
        .insert(contributor)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] });
    }
  });
};
