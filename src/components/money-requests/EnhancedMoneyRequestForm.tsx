import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileIcon, AlertCircle, DollarSign, Calendar, Building, User } from "lucide-react";
import { useCreateEnhancedMoneyRequest } from "@/hooks/useEnhancedMoneyRequests";
import { useDepartments } from "@/hooks/useDepartments";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useApprovalTemplateForRequest } from "@/hooks/useApprovalTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  requesting_department_id: z.string().min(1, "Department is required"),
  fund_type_id: z.string().min(1, "Fund type is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  suggested_vendor: z.string().optional(),
  associated_project: z.string().optional(),
  fund_code: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimated_completion_date: z.string().optional(),
  total_amount_with_tax: z.number().optional()
});

type FormData = z.infer<typeof formSchema>;

interface EnhancedMoneyRequestFormProps {
  onSuccess?: () => void;
}

export function EnhancedMoneyRequestForm({ onSuccess }: EnhancedMoneyRequestFormProps) {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priority: 'medium',
      amount: 0,
      total_amount_with_tax: 0
    }
  });

  const createRequest = useCreateEnhancedMoneyRequest();
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const { data: fundTypes, isLoading: loadingFundTypes } = useFundTypes();

  const watchedDepartment = form.watch("requesting_department_id");
  const watchedAmount = form.watch("amount");

  const { data: approvalTemplate } = useApprovalTemplateForRequest(
    watchedDepartment,
    watchedAmount
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    await createRequest.mutateAsync({
      ...data,
      requester_id: user.id,
      files: selectedFiles
    } as any);

    form.reset();
    setSelectedFiles([]);
    onSuccess?.();
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-green-100 text-green-800 border-green-200',
    high: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    urgent: 'bg-red-100 text-red-800 border-red-200'
  };

  if (loadingDepartments || loadingFundTypes) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading form data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Create Money Request
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requesting_department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Department
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map((dept) => (
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
                          <SelectValue placeholder="Select fund type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fundTypes?.map((fund) => (
                          <SelectItem key={fund.id} value={fund.id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{fund.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                Balance: ${fund.current_balance?.toLocaleString() || 0}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Amount and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_amount_with_tax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total with Tax ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(priorityColors).map(([priority, className]) => (
                          <SelectItem key={priority} value={priority}>
                            <Badge className={className} variant="outline">
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="suggested_vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suggested Vendor (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Vendor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fund_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fund/Budget Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Budget code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="associated_project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associated Project (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Project name or description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_completion_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Estimated Completion
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose/Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of this request in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-4">
              <FormLabel>Supporting Documents</FormLabel>
              
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files here, or click to select
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Select Files
                </Button>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approval Preview */}
            {approvalTemplate && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Approval Workflow Preview:</p>
                    <div className="flex flex-wrap gap-2">
                      {(approvalTemplate.approval_steps as any[])?.map((step, index) => (
                        <Badge key={index} variant="outline">
                          {index + 1}. {step.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Template: {approvalTemplate.name}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}