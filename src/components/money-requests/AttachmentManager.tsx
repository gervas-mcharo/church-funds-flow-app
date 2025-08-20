import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { X, Upload, File, Image, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

interface AttachmentManagerProps {
  requestId: string;
  attachments: Attachment[];
  canUpload?: boolean;
  canDelete?: boolean;
}

export function AttachmentManager({
  requestId,
  attachments,
  canUpload = false,
  canDelete = false,
}: AttachmentManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("User not authenticated");

      setUploading(true);
      setUploadProgress(0);

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${requestId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('request-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (storageError) throw storageError;

      // Save metadata to database
      const { data, error } = await supabase
        .from('request_attachments')
        .insert({
          request_id: requestId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) {
        // Clean up storage if database insert fails
        await supabase.storage
          .from('request-attachments')
          .remove([fileName]);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request-attachments", requestId] });
      toast.success("File uploaded successfully");
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      setUploading(false);
      setUploadProgress(0);
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: async (attachment: Attachment) => {
      // Delete from database first
      const { error: dbError } = await supabase
        .from('request_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('request-attachments')
        .remove([attachment.file_path]);

      if (storageError) {
        console.warn("Failed to delete from storage:", storageError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request-attachments", requestId] });
      toast.success("File deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    },
  });

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('request-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/*',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      toast.error("File type not supported. Please upload images, PDFs, or document files.");
      return;
    }

    uploadAttachment.mutate(file);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Attachments</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,text/plain,.doc,.docx,.xls,.xlsx"
          />

          {uploading && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {!canUpload && <h4 className="font-medium">Attachments</h4>}
          {attachments.map((attachment) => (
            <Card key={attachment.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getFileIcon(attachment.mime_type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {attachment.file_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(attachment.file_size)}</span>
                        <Badge variant="outline" className="text-xs">
                          {attachment.mime_type.split('/')[0]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadAttachment(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAttachment.mutate(attachment)}
                        disabled={deleteAttachment.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {attachments.length === 0 && !canUpload && (
        <p className="text-sm text-muted-foreground">No attachments</p>
      )}
    </div>
  );
}