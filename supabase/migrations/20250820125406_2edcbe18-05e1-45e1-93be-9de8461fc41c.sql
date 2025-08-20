-- Remove storage bucket for request attachments
DELETE FROM storage.buckets WHERE id = 'request-attachments';