-- ============================================
-- Increase post-attachments size limit for delivery
-- Safe to run multiple times
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    UPDATE storage.buckets
      SET file_size_limit = 2147483648
      WHERE id = 'post-attachments';
  END IF;
END $$;

-- ============================================
-- DONE
-- ============================================
