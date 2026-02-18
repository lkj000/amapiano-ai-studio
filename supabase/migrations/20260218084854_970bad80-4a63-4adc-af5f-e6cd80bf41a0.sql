-- Fix 1: Recreate model_performance_analytics view with security_invoker=on
-- This ensures RLS of the querying user is enforced, not the view creator
DROP VIEW IF EXISTS public.model_performance_analytics;

CREATE VIEW public.model_performance_analytics
WITH (security_invoker=on) AS
SELECT 
    model_version,
    output_type,
    count(*) AS total_feedback,
    avg(cultural_authenticity_rating) AS avg_cultural_rating,
    avg(rhythmic_swing_rating) AS avg_swing_rating,
    avg(overall_rating) AS avg_overall_rating,
    count(*) FILTER (WHERE cultural_authenticity_rating >= 4) AS high_quality_count,
    count(*) FILTER (WHERE is_favorite = true) AS favorite_count,
    avg(generation_time_ms) AS avg_generation_time,
    avg(confidence_score) AS avg_confidence,
    date_trunc('day'::text, created_at) AS feedback_date
FROM community_feedback
GROUP BY model_version, output_type, date_trunc('day'::text, created_at);

-- Fix 2: Create a secure public view for voice_license_requests that excludes PII
-- This view can be used for non-admin queries that don't need contact details
CREATE VIEW public.voice_license_requests_safe
WITH (security_invoker=on) AS
SELECT 
    id,
    requester_id,
    artist_name,
    status,
    created_at,
    updated_at
FROM voice_license_requests;
-- Note: email, phone, and other PII fields are excluded from this view
-- The base table RLS is already correctly configured (users see own rows, admins see all)