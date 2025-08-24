-- Add shift_id to daily_reports and allow multiple reports per day
ALTER TABLE public.daily_reports
ADD COLUMN IF NOT EXISTS shift_id uuid;

-- Drop old unique constraint by (rider_id, report_date)
ALTER TABLE public.daily_reports
DROP CONSTRAINT IF EXISTS daily_reports_rider_id_report_date_key;

-- Create a new unique constraint per shift
ALTER TABLE public.daily_reports
ADD CONSTRAINT daily_reports_rider_id_shift_id_key UNIQUE (rider_id, shift_id);

-- Optional FK to shift_management
ALTER TABLE public.daily_reports
ADD CONSTRAINT daily_reports_shift_id_fkey
FOREIGN KEY (shift_id) REFERENCES public.shift_management(id)
ON DELETE SET NULL;