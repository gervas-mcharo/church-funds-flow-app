
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileText, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { useCreateMoneyRequest } from "@/hooks/useMoneyRequests";
import { useCurrentUserDepartments } from "@/hooks/useDepartmentPersonnel";
import { useFundTypes } from "@/hooks/useFundTypes";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type MoneyRequestInsert = Database["public"]["Tables"]["money_requests"]["Insert"];

interface MoneyRequestFormData {
  requesting_department_id: string;
  amount: string;
  purpose: string;
  suggested_vendor?: string;
  associated_project?: string;
  fund_type_id: string;
}

export function MoneyRequestForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { data: userDepartments, isLoading: departmentsLoading } = useCurrentUserDepartments();
  const { data: fundTypes, isLoading: fundTypesLoading } = useFundTypes();
  const createRequestMutation = useCreateMoneyRequest();

  const form = useForm<MoneyRequestFormData>({
    defaultValues: {
      requesting_department_id: "",
      amount: "",
      purpose: "",
      suggested_vendor: "",
      associated_project: "",
      fund_type_id: ""
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (requestId: string) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error("User not authenticated");

    for (const file of selectedFiles) {
      const fileName = `${requestId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('request-attachments')
        .upload(`${user.data.user.id}/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('request_attachments')
        .insert({
          money_request_id: requestId,
          file_name: file.name,
          file_path: `${user.data.user.id}/${fileName}`,
          file_size: file.size,
          content_type: file.type,
          uploaded_by: user.data.user.id
        });

      if (dbError) throw dbError;
    }
  };

  const onSubmit = async (data: MoneyRequestFormData) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error("User not authenticated");
      }

      const requestData: MoneyRequestInsert = {
        requesting_department_id: data.requesting_department_id,
        requester_id: user.data.user.id,
        amount: parseFloat(data.amount),
        purpose: data.purpose,
        suggested_vendor: data.suggested_vendor || null,
        associated_project: data.associated_project || null,
        fund_type_id: data.fund_type_id
      };

      const request = await createRequestMutation.mutateAsync(requestData);
      
      if (selectedFiles.length > 0) {
        await uploadFiles(request.id);
      }

      form.reset();
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error submitting request:", error);
    }
  };

  if (departmentsLoading) {
    return <div>Loading your departments...</div>;
  }

  if (!userDepartments || userDepartments.length === 0) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submit Money Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">You are not assigned to any departments.</p>
            <p className="text-gray-500 text-sm mt-2">Please contact an administrator to be assigned to a department before submitting money requests.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submit Money Request
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="requesting_department_id"
              rules={{ required: "Department is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requesting Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userDepartments?.map((userDept) => (
                        <SelectItem key={userDept.department.id} value={userDept.department.id}>
                          {userDept.department.name}
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
              rules={{ required: "Fund type is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fund Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fund type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fundTypes?.map((fundType) => (
                        <SelectItem key={fundType.id} value={fundType.id}>
                          {fundType.name}
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
              name="amount"
              rules={{ 
                required: "Amount is required",
                pattern: {
                  value: /^\d+(\.\d{1,2})?$/,
                  message: "Please enter a valid amount"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              rules={{ required: "Purpose is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose/Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the purpose of this request..."
                      rows={3}
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
                    <Input
                      {...field}
                      placeholder="Vendor name..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="associated_project"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associated Project/Activity (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Project or activity name..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Supporting Documents (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload files or drag and drop
                  </span>
                </label>
                
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createRequestMutation.isPending || departmentsLoading || fundTypesLoading}
            >
              {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
