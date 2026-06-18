ALTER TABLE public.consultation_notes
  ADD COLUMN IF NOT EXISTS patient_summary text,
  ADD COLUMN IF NOT EXISTS patient_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at timestamptz;