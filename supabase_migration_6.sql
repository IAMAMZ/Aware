-- Create medication_logs table for daily medication tracking

CREATE TABLE public.medication_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  taken boolean NOT NULL DEFAULT false,
  dose text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, date)
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own medication logs"
  ON public.medication_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
