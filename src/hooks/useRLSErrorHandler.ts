
import { useToast } from "@/hooks/use-toast";

export function useRLSErrorHandler() {
  const { toast } = useToast();

  const handleRLSError = (error: any, operation: string) => {
    console.error(`RLS Error during ${operation}:`, error);
    
    // Check for common RLS error patterns
    if (error?.message?.includes('row-level security policy') || 
        error?.code === '42501' || 
        error?.message?.includes('permission denied')) {
      
      toast({
        title: "Access Denied",
        description: `You don't have permission to ${operation}. Please contact your administrator if you believe this is an error.`,
        variant: "destructive"
      });
      return;
    }
    
    // Check for policy violation errors
    if (error?.message?.includes('violates row-level security policy')) {
      toast({
        title: "Security Policy Violation",
        description: `This ${operation} operation violates security policies. Please ensure you have the correct permissions.`,
        variant: "destructive"
      });
      return;
    }
    
    // Generic database error
    if (error?.code && error.code.startsWith('P')) {
      toast({
        title: "Database Error",
        description: `Unable to ${operation} due to a database constraint. Please try again or contact support.`,
        variant: "destructive"
      });
      return;
    }
    
    // Fallback for unknown errors
    toast({
      title: `Error during ${operation}`,
      description: error?.message || "An unexpected error occurred. Please try again.",
      variant: "destructive"
    });
  };

  return { handleRLSError };
}
