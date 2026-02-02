-- ============================================
-- INSPECT: Run this in Supabase SQL Editor to confirm PK columns
-- for public.profiles and public.posts (used by post_likes, post_comments)
-- ============================================
-- This is read-only. It does not change data.

SELECT
  'public.profiles' AS table_name,
  a.attname AS primary_key_column,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
JOIN pg_class c ON c.oid = i.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'profiles'
  AND i.indisprimary
  AND a.attnum > 0
  AND NOT a.attisdropped

UNION ALL

SELECT
  'public.posts' AS table_name,
  a.attname AS primary_key_column,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
JOIN pg_class c ON c.oid = i.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'posts'
  AND i.indisprimary
  AND a.attnum > 0
  AND NOT a.attisdropped;
