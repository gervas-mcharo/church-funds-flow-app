
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCreateFundType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      description?: string; 
      opening_balance?: number;
      current_balance?: number;
    }) => {
      const { data: result, error } = await supabase
        .from('fund_types')
        .insert([{ 
          name: data.name, 
          description: data.description,
          opening_balance: data.opening_balance || 0,
          current_balance: data.current_balance || data.opening_balance || 0,
          is_active: true 
        }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-types'] });
      toast({
        title: "Success",
        description: "Fund type created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create fund type",
        variant: "destructive",
      });
      console.error('Error creating fund type:', error);
    },
  });
};
