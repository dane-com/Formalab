-- FormaLab: optional website reviews with owner approval.
-- Run once in the Supabase SQL Editor, using the default postgres role.
-- No account, password, model file, or email address is stored in this table.
-- Existing tables and data are not replaced. A repeated run rolls back.
BEGIN;

CREATE TABLE public.formalab_reviews (
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

CREATE INDEX formalab_reviews_public_recent
  ON public.formalab_reviews (created_at DESC, id)
  WHERE status = 'approved';

ALTER TABLE public.formalab_reviews ENABLE ROW LEVEL SECURITY;

-- Remove default browser permissions; then grant only what reviews need.
REVOKE ALL ON TABLE public.formalab_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.formalab_reviews TO anon, authenticated;
GRANT INSERT (reviewer_name, rating, comment)
  ON TABLE public.formalab_reviews TO anon, authenticated;

CREATE POLICY "Visitors can read approved reviews"
  ON public.formalab_reviews
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Visitors can submit pending reviews"
  ON public.formalab_reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

COMMENT ON TABLE public.formalab_reviews IS
  'Website feedback. Visitors submit pending reviews; the owner approves them in the Supabase dashboard.';

COMMIT;

-- Approval: open Table Editor > formalab_reviews, then change status to
-- approved or rejected. Only approved rows are publicly readable.
-- Public API inserts must contain reviewer_name, rating, and/or comment only.
-- Request return=minimal on insert; pending rows cannot be read by visitors.
