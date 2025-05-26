
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateQRData, generateQRCodeImage, saveQRCode } from '@/services/qrCodeService';

export const useQRCodes = () => {
  return useQuery({
    queryKey: ['qr-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          contributors (name),
          fund_types (name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useGenerateQRCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ contributorId, fundTypeId }: { contributorId: string; fundTypeId: string }) => {
      const qrData = generateQRData(contributorId, fundTypeId);
      const qrCodeImage = await generateQRCodeImage(qrData);
      const savedQRCode = await saveQRCode(contributorId, fundTypeId, qrData);
      
      return {
        ...savedQRCode,
        qrCodeImage
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
    }
  });
};
