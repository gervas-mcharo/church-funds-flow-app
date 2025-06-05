
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

export const useUpdateContributor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contributor: { id: string; name: string; email?: string; phone?: string }) => {
      const { id, ...updateData } = contributor;
      const { data, error } = await supabase
        .from('contributors')
        .update(updateData)
        .eq('id', id)
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
