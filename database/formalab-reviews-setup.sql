-- FormaLab: website reviews with owner approval.
-- Run in the Supabase SQL Editor (postgres role). Safe to re-run without losing existing reviews.
BEGIN;

CREATE TABLE IF NOT EXISTS public.formalab_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_name text NOT NULL DEFAULT 'Anonymous',
  rating smallint,
  comment text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT formalab_review_name_valid CHECK (
    char_length(reviewer_name) BETWEEN 1 AND 100
    AND reviewer_name ~ '[^[:space:]]'
  ),
  CONSTRAINT formalab_review_rating_valid CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT formalab_review_comment_length CHECK (char_length(comment) <= 1000),
  CONSTRAINT formalab_review_has_feedback CHECK (
    rating IS NOT NULL OR comment ~ '[^[:space:]]'
  ),
  CONSTRAINT formalab_review_status_valid CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS formalab_reviews_public_recent
  ON public.formalab_reviews (created_at DESC, id)
  WHERE status = 'approved';

ALTER TABLE public.formalab_reviews ENABLE ROW LEVEL SECURITY;

-- Grant schema usage and minimal table permissions for public review submission/reading.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
REVOKE ALL ON TABLE public.formalab_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.formalab_reviews TO anon, authenticated;
GRANT INSERT (reviewer_name, rating, comment)
  ON TABLE public.formalab_reviews TO anon, authenticated;

DROP POLICY IF EXISTS "Visitors can read approved reviews" ON public.formalab_reviews;
CREATE POLICY "Visitors can read approved reviews"
  ON public.formalab_reviews
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS "Visitors can submit pending reviews" ON public.formalab_reviews;
CREATE POLICY "Visitors can submit pending reviews"
  ON public.formalab_reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

COMMENT ON TABLE public.formalab_reviews IS
  'Website feedback. Visitors submit pending reviews; the owner approves them in the Supabase dashboard.';

COMMIT;

-- Approval: open Table Editor > formalab_reviews, then change status to
-- approved or rejected. Only approved rows are publicly readable.
--
-- Optional: if you want submitted reviews to appear on the site immediately
-- without manual approval, run the block below in the SQL Editor:
--
-- ALTER TABLE public.formalab_reviews ALTER COLUMN status SET DEFAULT 'approved';
-- DROP POLICY IF EXISTS "Visitors can submit pending reviews" ON public.formalab_reviews;
-- CREATE POLICY "Visitors can submit approved reviews"
--   ON public.formalab_reviews FOR INSERT TO anon, authenticated
--   WITH CHECK (status = 'approved');
