-- 1. Create tables

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  timezone text DEFAULT 'UTC',
  medication_tracking boolean DEFAULT false
);

CREATE TABLE public.food_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL,
  food_name text NOT NULL,
  gi_category text CHECK (gi_category IN ('low','medium','high','zero')),
  gl_value numeric,
  meal_type text CHECK (meal_type IN ('meal','snack','caffeine','water','supplement','alcohol')),
  eating_context text CHECK (eating_context IN ('planned','impulsive','stress','boredom','forgot','not_hungry','social')),
  hunger_level int CHECK (hunger_level BETWEEN 1 AND 5),
  post_meal_energy text,
  satisfaction text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  bedtime timestamptz NOT NULL,
  wake_time timestamptz NOT NULL,
  duration_hours numeric NOT NULL,
  quality int CHECK (quality BETWEEN 1 AND 5),
  sleep_type text,
  pre_sleep_context text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL,
  mood_score int CHECK (mood_score BETWEEN 1 AND 5),
  emotion_tags text[],
  stress_event boolean DEFAULT false,
  rsd_moment boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  duration_minutes numeric,
  task_label text,
  music_type text,
  energy_tag text CHECK (energy_tag IN ('deep','medium','low','autopilot')),
  completion_status text CHECK (completion_status IN ('completed','partial','abandoned')),
  contamination_score int,
  interruption_count int DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.distraction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL,
  category text CHECK (category IN ('social_media','news','stocks','youtube','email','productivity_procrastination','research_loop','comparison','notification','other')),
  domain text,
  duration_minutes int NOT NULL,
  trigger_tag text CHECK (trigger_tag IN ('boredom','avoidance','anxiety','habit','notification','glucose_crash','stress')),
  intentional boolean DEFAULT false,
  post_mood text,
  session_id uuid REFERENCES public.focus_sessions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  timestamp timestamptz NOT NULL,
  body text NOT NULL,
  tags text[],
  mood_at_writing int CHECK (mood_at_writing BETWEEN 1 AND 5),
  linked_session_id uuid REFERENCES public.focus_sessions(id) ON DELETE SET NULL,
  prompt_used text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  priority text CHECK (priority IN ('must_today','should_this_week','someday')),
  size text CHECK (size IN ('5min','30min','2h_plus')),
  energy_type text CHECK (energy_type IN ('deep','admin','creative','physical')),
  due_date date,
  completed boolean DEFAULT false,
  linked_session_id uuid REFERENCES public.focus_sessions(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  energy_type text,
  is_focus_block boolean DEFAULT false,
  glucose_prep_noted boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.insights_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  generated_at timestamptz DEFAULT now(),
  insight_type text NOT NULL,
  insight_body text NOT NULL,
  data_range_start date,
  data_range_end date,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distraction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_cache ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies

CREATE POLICY "Users can manage their own data" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own food logs" ON public.food_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sleep logs" ON public.sleep_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own mood logs" ON public.mood_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own focus sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own distraction logs" ON public.distraction_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own journal entries" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own calendar events" ON public.calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own insights cache" ON public.insights_cache FOR ALL USING (auth.uid() = user_id);

-- 4. Create trigger to insert new users automatically on auth.users sign up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
