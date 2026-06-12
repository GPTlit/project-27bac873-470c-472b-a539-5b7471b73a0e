CREATE POLICY "Authenticated users can upload story media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = 'stories');

CREATE POLICY "Users can update their own story media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = 'stories' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Users can delete their own story media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = 'stories' AND (storage.foldername(name))[2] = auth.uid()::text);