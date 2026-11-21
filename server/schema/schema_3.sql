-- Post images. Run in the Supabase SQL editor (after schema.sql and schema_2.sql).

alter table posts add column if not exists image_url text;

-- Public bucket: anyone can view an image by URL. Uploads only happen through the server
-- (service role key), so no storage policies are needed for writing.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;
