
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateBulkQRCodes, exportBulkQRCodes, BulkQROptions } from '@/services/bulkQRService';

export const useBulkQRGeneration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: BulkQROptions) => {
      const results = await generateBulkQRCodes(options);
      const exportUrl = await exportBulkQRCodes(results, options.format);
      
      return {
        results,
        exportUrl,
        count: results.length
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
    }
  });
};
