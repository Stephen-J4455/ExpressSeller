-- Create the storage bucket for seller status images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('seller-statuses', 'seller-statuses', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated sellers to upload status images
CREATE POLICY "Sellers can upload status images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seller-statuses' AND
  (auth.jwt()->>'role' = 'authenticated')
);

-- Allow public read access to status images
CREATE POLICY "Anyone can view status images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'seller-statuses');

-- Allow sellers to update their own status images
CREATE POLICY "Sellers can update status images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'seller-statuses');

-- Allow sellers to delete their own status images
CREATE POLICY "Sellers can delete status images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'seller-statuses');
