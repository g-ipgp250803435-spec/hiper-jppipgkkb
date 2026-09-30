-- HiPER media upload hardening
-- Keep browser-side validation and Supabase Storage MIME restrictions aligned.
BEGIN;

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
WHERE id = 'public-media';

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE id = 'application-files';

COMMIT;
