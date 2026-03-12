-- Add notes field to urge_surf_logs table

ALTER TABLE public.urge_surf_logs
ADD COLUMN notes text;
