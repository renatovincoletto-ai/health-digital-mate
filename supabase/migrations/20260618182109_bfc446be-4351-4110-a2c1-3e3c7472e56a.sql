
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS blood_type text,
  ADD COLUMN IF NOT EXISTS height_cm numeric(5,2),
  ADD COLUMN IF NOT EXISTS weight_kg numeric(5,2),
  ADD COLUMN IF NOT EXISTS bmi numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN height_cm > 0 AND weight_kg > 0
    THEN ROUND((weight_kg / ((height_cm/100.0) * (height_cm/100.0)))::numeric, 2)
    ELSE NULL END
  ) STORED,
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS emergency_contact jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_preference text,
  ADD COLUMN IF NOT EXISTS allergies_summary text,
  ADD COLUMN IF NOT EXISTS last_visit_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm ON public.patients USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON public.patients (cpf);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients (phone);
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients (email);
CREATE INDEX IF NOT EXISTS idx_patients_last_visit ON public.patients (tenant_id, last_visit_at);

ALTER TABLE public.consultation_notes
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_consultation_notes_patient ON public.consultation_notes (patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_professional ON public.consultation_notes (professional_id);

CREATE OR REPLACE FUNCTION public.bump_patient_last_visit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.patient_id IS NOT NULL THEN
    UPDATE public.patients SET last_visit_at = COALESCE(NEW.created_at, now())
    WHERE id = NEW.patient_id AND (last_visit_at IS NULL OR last_visit_at < COALESCE(NEW.created_at, now()));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_consultation_notes_last_visit ON public.consultation_notes;
CREATE TRIGGER trg_consultation_notes_last_visit
AFTER INSERT ON public.consultation_notes
FOR EACH ROW EXECUTE FUNCTION public.bump_patient_last_visit();

CREATE TABLE IF NOT EXISTS public.patient_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_note_id uuid REFERENCES public.consultation_notes(id) ON DELETE SET NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'photo',
  storage_path text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes bigint,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_attachments TO authenticated;
GRANT ALL ON public.patient_attachments TO service_role;

ALTER TABLE public.patient_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant manages patient attachments" ON public.patient_attachments;
CREATE POLICY "tenant manages patient attachments"
ON public.patient_attachments FOR ALL TO authenticated
USING (tenant_id = user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = user_tenant_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_patient_attachments_patient ON public.patient_attachments (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_attachments_tenant ON public.patient_attachments (tenant_id);

DROP POLICY IF EXISTS "tenant reads patient photos" ON storage.objects;
CREATE POLICY "tenant reads patient photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('patient-photos','patient-attachments')
  AND (storage.foldername(name))[1] = user_tenant_id(auth.uid())::text
);

DROP POLICY IF EXISTS "tenant uploads patient photos" ON storage.objects;
CREATE POLICY "tenant uploads patient photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('patient-photos','patient-attachments')
  AND (storage.foldername(name))[1] = user_tenant_id(auth.uid())::text
);

DROP POLICY IF EXISTS "tenant updates patient photos" ON storage.objects;
CREATE POLICY "tenant updates patient photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('patient-photos','patient-attachments')
  AND (storage.foldername(name))[1] = user_tenant_id(auth.uid())::text
);

DROP POLICY IF EXISTS "tenant deletes patient photos" ON storage.objects;
CREATE POLICY "tenant deletes patient photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('patient-photos','patient-attachments')
  AND (storage.foldername(name))[1] = user_tenant_id(auth.uid())::text
);
