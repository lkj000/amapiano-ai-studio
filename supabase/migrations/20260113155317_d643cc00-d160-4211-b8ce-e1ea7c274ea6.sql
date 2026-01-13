
-- Create security definer function to check if user is a room participant
CREATE OR REPLACE FUNCTION public.is_room_participant(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_participants
    WHERE user_id = _user_id
      AND room_id = _room_id
  )
$$;

-- Create security definer function to check if user is a collaboration session participant
CREATE OR REPLACE FUNCTION public.is_session_participant(_user_id uuid, _session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collaboration_participants
    WHERE user_id = _user_id
      AND session_id = _session_id
  )
$$;

-- Create function to check room access
CREATE OR REPLACE FUNCTION public.has_room_access(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collaboration_rooms cr
    WHERE cr.id = _room_id
      AND (
        cr.host_user_id = _user_id
        OR (cr.settings->>'isPublic')::boolean = true
        OR public.is_room_participant(_user_id, _room_id)
      )
  )
$$;

-- Create function to check session access
CREATE OR REPLACE FUNCTION public.has_session_access(_user_id uuid, _session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collaboration_sessions cs
    WHERE cs.id = _session_id
      AND (
        cs.host_user_id = _user_id
        OR public.is_session_participant(_user_id, _session_id)
      )
  )
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view participants in rooms they have access to" ON public.room_participants;
DROP POLICY IF EXISTS "Users can view participants in sessions they're part of" ON public.collaboration_participants;

-- Create fixed policies using security definer functions
CREATE POLICY "Users can view room participants"
ON public.room_participants
FOR SELECT
USING (public.has_room_access(auth.uid(), room_id));

CREATE POLICY "Users can view session participants"
ON public.collaboration_participants
FOR SELECT
USING (public.has_session_access(auth.uid(), session_id));
