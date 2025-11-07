-- Create papers table for storing generated research papers
CREATE TABLE IF NOT EXISTS public.papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT,
  content TEXT NOT NULL,
  latex_source TEXT,
  keywords TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'rejected', 'submitted')),
  arxiv_id TEXT,
  submission_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reviewers table for committee members
CREATE TABLE IF NOT EXISTS public.reviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  institution TEXT,
  role TEXT DEFAULT 'reviewer' CHECK (role IN ('reviewer', 'supervisor', 'committee_member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reviews table for paper reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.reviewers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(paper_id, reviewer_id)
);

-- Create review_comments table for detailed feedback
CREATE TABLE IF NOT EXISTS public.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.reviewers(id) ON DELETE CASCADE,
  section TEXT,
  line_number INTEGER,
  comment TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general' CHECK (comment_type IN ('general', 'technical', 'editorial', 'suggestion')),
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create regression_history table for tracking metric changes over time
CREATE TABLE IF NOT EXISTS public.regression_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  category TEXT NOT NULL,
  value NUMERIC NOT NULL,
  baseline NUMERIC,
  change_percent NUMERIC,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  test_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regression_history ENABLE ROW LEVEL SECURITY;

-- Policies for papers table
CREATE POLICY "Users can view their own papers"
  ON public.papers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own papers"
  ON public.papers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own papers"
  ON public.papers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own papers"
  ON public.papers FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for reviewers table
CREATE POLICY "Users can view all reviewers"
  ON public.reviewers FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviewers"
  ON public.reviewers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reviewer profile"
  ON public.reviewers FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for reviews table
CREATE POLICY "Users can view reviews of their papers"
  ON public.reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.papers
      WHERE papers.id = reviews.paper_id
      AND papers.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.reviewers
      WHERE reviewers.id = reviews.reviewer_id
      AND reviewers.user_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviewers
      WHERE reviewers.id = reviewer_id
      AND reviewers.user_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reviewers
      WHERE reviewers.id = reviews.reviewer_id
      AND reviewers.user_id = auth.uid()
    )
  );

-- Policies for review_comments table
CREATE POLICY "Users can view comments on their papers"
  ON public.review_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      JOIN public.papers ON papers.id = reviews.paper_id
      WHERE reviews.id = review_comments.review_id
      AND papers.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.reviewers
      WHERE reviewers.id = review_comments.reviewer_id
      AND reviewers.user_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can create comments"
  ON public.review_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviewers
      WHERE reviewers.id = reviewer_id
      AND reviewers.user_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can update their own comments"
  ON public.review_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reviewers
      WHERE reviewers.id = review_comments.reviewer_id
      AND reviewers.user_id = auth.uid()
    )
  );

-- Policies for regression_history table
CREATE POLICY "Users can view their own regression history"
  ON public.regression_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own regression history"
  ON public.regression_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_papers_updated_at
  BEFORE UPDATE ON public.papers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_papers_user_id ON public.papers(user_id);
CREATE INDEX IF NOT EXISTS idx_papers_status ON public.papers(status);
CREATE INDEX IF NOT EXISTS idx_reviewers_email ON public.reviewers(email);
CREATE INDEX IF NOT EXISTS idx_reviews_paper_id ON public.reviews(paper_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON public.review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_regression_history_user_id ON public.regression_history(user_id);
CREATE INDEX IF NOT EXISTS idx_regression_history_created_at ON public.regression_history(created_at);