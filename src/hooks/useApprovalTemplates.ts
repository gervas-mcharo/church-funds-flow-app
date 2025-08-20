import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ApprovalTemplate = Database["public"]["Tables"]["approval_templates"]["Row"];

export interface ApprovalStep {
  role: string;
  required: boolean;
  step_order: number;
  timeout_hours: number;
}

export interface CreateApprovalTemplateData {
  name: string;
  description?: string;
  department_id?: string;
  min_amount?: number;
  max_amount?: number;
  approval_steps: ApprovalStep[];
  is_default?: boolean;
}

export function useApprovalTemplates() {
  return useQuery({
    queryKey: ['approval-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approval_templates')
        .select(`
          *,
          department:departments(id, name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
}

export function useApprovalTemplateForRequest(departmentId?: string, amount?: number) {
  return useQuery({
    queryKey: ['approval-template-for-request', departmentId, amount],
    queryFn: async () => {
      if (!departmentId || amount === undefined) return null;

      // Find the most specific template
      const { data, error } = await supabase
        .from('approval_templates')
        .select('*')
        .eq('is_active', true)
        .or(`department_id.is.null,department_id.eq.${departmentId}`)
        .or(`min_amount.is.null,min_amount.lte.${amount}`)
        .or(`max_amount.is.null,max_amount.gte.${amount}`)
        .order('department_id', { ascending: false, nullsFirst: false })
        .order('min_amount', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // If no specific template found, get the default
      if (!data) {
        const { data: defaultTemplate, error: defaultError } = await supabase
          .from('approval_templates')
          .select('*')
          .eq('is_default', true)
          .eq('is_active', true)
          .maybeSingle();

        if (defaultError) throw defaultError;
        return defaultTemplate;
      }

      return data;
    },
    enabled: !!departmentId && amount !== undefined
  });
}

export function useCreateApprovalTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (templateData: CreateApprovalTemplateData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('approval_templates')
        .insert({
          ...templateData,
          approval_steps: templateData.approval_steps as any,
          created_by: user.user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
      toast({
        title: "Approval template created",
        description: "The new approval template has been created successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateApprovalTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<CreateApprovalTemplateData> 
    }) => {
      const { error } = await supabase
        .from('approval_templates')
        .update({
          ...updates,
          approval_steps: updates.approval_steps as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
      toast({
        title: "Template updated",
        description: "The approval template has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useDeleteApprovalTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('approval_templates')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
      toast({
        title: "Template deleted",
        description: "The approval template has been deactivated."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useSetDefaultTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // First, remove default flag from all templates
      await supabase
        .from('approval_templates')
        .update({ is_default: false })
        .eq('is_default', true);

      // Then set the new default
      const { error } = await supabase
        .from('approval_templates')
        .update({ 
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
      toast({
        title: "Default template set",
        description: "This template is now the default for new requests."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error setting default",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}