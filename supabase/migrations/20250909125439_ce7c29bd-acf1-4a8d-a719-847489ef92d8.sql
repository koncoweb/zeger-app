-- Remove the trigger that automatically manages shifts based on attendance
-- This ensures attendance is completely separate from shift management
DROP TRIGGER IF EXISTS update_shift_on_attendance_trigger ON public.attendance;

-- Also remove the function if it exists
DROP FUNCTION IF EXISTS public.update_shift_on_attendance();