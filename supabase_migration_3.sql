-- Migration 3: Daily intentions for morning check-in

CREATE TABLE public.daily_intentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  intention text,                   -- "Today I want to..."
  top_priorities text[],            -- up to 3 task titles
  morning_energy int CHECK (morning_energy BETWEEN 1 AND 5),
  intention_met boolean,            -- filled in at review time
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_intentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own daily intentions"
  ON public.daily_intentions FOR ALL USING (auth.uid() = user_id);
