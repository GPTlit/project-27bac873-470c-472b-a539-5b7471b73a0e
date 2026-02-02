-- Make the payment-receipts bucket public so receipts can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-receipts';