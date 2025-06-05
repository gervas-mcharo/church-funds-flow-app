
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUpdateFundType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string; is_active?: boolean }) => {
      const { data: result, error } = await supabase
        .from('fund_types')
        .update({
          name: data.name,
          description: data.description,
          is_active: data.is_active,
        })
        .eq('id', data.id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-types'] });
      toast({
        title: "Success",
        description: "Fund type updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update fund type",
        variant: "destructive",
      });
      console.error('Error updating fund type:', error);
    },
  });
};
