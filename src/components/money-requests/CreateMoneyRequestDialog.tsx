import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMoneyRequests } from "@/hooks/useMoneyRequests";
import { useMoneyRequestPermissions } from "@/hooks/useMoneyRequestPermissions";
import { useDepartments } from "@/hooks/useDepartments";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useDepartmentAccess } from "@/hooks/useDepartmentAccess";

const formSchema = z.object({
  requesting_department_id: z.string().min(1, "Department is required"),
  fund_type_id: z.string().min(1, "Fund type is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  purpose: z.string().min(1, "Purpose is required"),
  description: z.string().optional(),
  suggested_vendor: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateMoneyRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMoneyRequestDialog({
  open,
  onOpenChange,
}: CreateMoneyRequestDialogProps) {
  const [isDraft, setIsDraft] = useState(true);
  
  const { createRequest } = useMoneyRequests();
  const { canCreateRequestForDepartment, canCreateRequestsForAnyDepartment } = useMoneyRequestPermissions();
  const { departments } = useDepartments();
  const { fundTypes } = useFundTypes();
  const { userDepartments } = useDepartmentAccess();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requesting_department_id: "",
      fund_type_id: "",
      amount: 0,
      purpose: "",
      description: "",
      suggested_vendor: "",
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await createRequest.mutateAsync({
        requesting_department_id: data.requesting_department_id,
        fund_type_id: data.fund_type_id,
        amount: data.amount,
        purpose: data.purpose,
        description: data.description,
        suggested_vendor: data.suggested_vendor,
        status: isDraft ? "draft" : "submitted",
      });
      
      form.reset();
      onOpenChange(false);
      setIsDraft(true);
    } catch (error) {
      console.error("Error creating request:", error);
    }
  };

  const availableDepartments = departments?.filter(dept => {
    if (canCreateRequestsForAnyDepartment) return true;
    return canCreateRequestForDepartment(dept.id);
  }) || [];

  const activeFundTypes = fundTypes?.filter(fund => fund.is_active) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Money Request</DialogTitle>
          <DialogDescription>
            Submit a new funding request for departmental expenses
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requesting_department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fund_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fund Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fund" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeFundTypes.map((fund) => (
                          <SelectItem key={fund.id} value={fund.id}>
                            {fund.name} (${fund.current_balance?.toLocaleString() || '0'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suggested_vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suggested Vendor (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vendor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the expense" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the request..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={createRequest.isPending}
                onClick={() => setIsDraft(true)}
              >
                Save as Draft
              </Button>
              <Button
                type="submit"
                disabled={createRequest.isPending}
                onClick={() => setIsDraft(false)}
              >
                Submit for Approval
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}