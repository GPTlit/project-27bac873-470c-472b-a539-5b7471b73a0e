-- Make the chat-media bucket private
UPDATE storage.buckets SET public = false WHERE id = 'chat-media';

-- Drop existing permissive storage policies for chat-media
DROP POLICY IF EXISTS "Anyone can view chat media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat media" ON storage.objects;

-- Create policy for group members to view chat media
-- The file path format is: {group_id}/{user_id}/{filename}
CREATE POLICY "Group members can view chat media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-media' AND
  public.is_group_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Create policy for group members to upload chat media
CREATE POLICY "Group members can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' AND
  auth.uid() IS NOT NULL AND
  public.is_group_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Create policy for users to delete their own chat media
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-media' AND
  auth.uid()::text = (storage.foldername(name))[2]
);