-- Urge Surf logs — tracks craving interventions during focus sessions

CREATE TABLE public.urge_surf_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL,
  trigger_source text CHECK (trigger_source IN
    ('dashboard_button','focus_nudge','snack_sidetrack','productivity_button')),
  pre_intensity int CHECK (pre_intensity BETWEEN 1 AND 10),
  post_intensity int CHECK (post_intensity BETWEEN 1 AND 10),
  outcome text CHECK (outcome IN ('redirected','ate_anyway','dismissed')),
  redirect_activity text,
  breathing_completed boolean DEFAULT false,
  focus_session_id uuid REFERENCES public.focus_sessions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);


ALTER TABLE public.urge_surf_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own urge surf logs"
  ON public.urge_surf_logs FOR ALL USING (auth.uid() = user_id);
