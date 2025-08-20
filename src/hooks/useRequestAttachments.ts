import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type RequestAttachment = {
  id: string;
  request_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
};

export function useRequestAttachments(requestId?: string) {
  const { user } = useAuth();

  const { data: attachments, isLoading, error } = useQuery({
    queryKey: ["request-attachments", requestId],
    queryFn: async () => {
      if (!user || !requestId) return [];

      const { data, error } = await supabase
        .from("request_attachments")
        .select("*")
        .eq("request_id", requestId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data as RequestAttachment[];
    },
    enabled: !!user && !!requestId,
  });

  return {
    attachments: attachments || [],
    isLoading,
    error,
  };
}