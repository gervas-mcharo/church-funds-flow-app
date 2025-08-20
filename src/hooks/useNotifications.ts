import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notification_queue"]["Row"];
type NotificationPreferences = Database["public"]["Tables"]["user_notification_preferences"]["Row"];

export function useNotifications(status?: string) {
  return useQuery({
    queryKey: ['notifications', status],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      let query = supabase
        .from('notification_queue')
        .select('*')
        .eq('recipient_id', user.user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Notification[];
    }
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_queue')
        .select('id')
        .eq('recipient_id', user.user.id)
        .eq('status', 'pending')
        .eq('type', 'in_app');

      if (error) throw error;
      return data?.length || 0;
    }
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notification_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    }
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notification_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('recipient_id', user.user.id)
        .eq('status', 'pending')
        .eq('type', 'in_app');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    }
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Return default preferences if none exist
      return data || {
        user_id: user.user.id,
        email_enabled: true,
        in_app_enabled: true,
        sms_enabled: false,
        approval_requests: true,
        status_updates: true,
        deadline_reminders: true,
        daily_digest: false
      };
    }
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating preferences",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Real-time notifications hook
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['realtime-notifications'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      // Set up real-time subscription
      const channel = supabase
        .channel('notification_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notification_queue',
            filter: `recipient_id=eq.${user.user.id}`
          },
          () => {
            // Invalidate queries when new notifications arrive
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
          }
        )
        .subscribe();

      return channel;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });
}