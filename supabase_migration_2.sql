-- Migration 2: Calendar check-ins for ADHD accountability tracking
-- Tracks whether the user was on-task during calendar events

CREATE TABLE public.calendar_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('on_track', 'sidetracked')),
  sidetrack_reason text,  -- e.g. 'phone', 'email', 'rabbit_hole', 'snack', 'rest', 'other'
  created_at timestamptz DEFAULT now()
);

-- Add recurrence and color support to calendar_events
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS recurrence text;  -- 'daily', 'weekdays', 'weekly', null for none

-- RLS
ALTER TABLE public.calendar_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own calendar checkins"
  ON public.calendar_checkins FOR ALL USING (auth.uid() = user_id);

-- Index for fast "what's happening right now" queries
CREATE INDEX idx_calendar_events_user_time
  ON public.calendar_events(user_id, start_time, end_time);

CREATE INDEX idx_calendar_checkins_event
  ON public.calendar_checkins(event_id, timestamp);
