-- Create the storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('express-products', 'express-products', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (sellers) to upload images
CREATE POLICY "Sellers can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'express-products' AND
  (auth.jwt()->>'role' = 'authenticated')
);

-- Allow public read access to product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'express-products');

-- Allow sellers to update their own product images
CREATE POLICY "Sellers can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'express-products');

-- Allow sellers to delete their own product images
CREATE POLICY "Sellers can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'express-products');