
-- =========================================================
-- ONDA G: Engine real de lembretes/jornadas
-- =========================================================

-- 1) Função que enfileira automações para um appointment
CREATE OR REPLACE FUNCTION public.enqueue_appointment_automations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel TEXT;
  v_recipient TEXT;
  v_settings RECORD;
  v_when_24 TIMESTAMPTZ;
  v_when_1 TIMESTAMPTZ;
  v_when_post TIMESTAMPTZ;
  v_pretty_date TEXT;
BEGIN
  -- Status que disparam automações
  IF NEW.status NOT IN ('pending','confirmed') THEN
    RETURN NEW;
  END IF;

  -- Apenas para futuro
  IF NEW.starts_at <= now() THEN
    RETURN NEW;
  END IF;

  -- Carrega settings (canais habilitados)
  SELECT * INTO v_settings FROM public.automation_settings WHERE tenant_id = NEW.tenant_id;

  -- Escolhe canal: email se houver e habilitado; senão whatsapp; senão sms
  IF NEW.patient_email IS NOT NULL AND NEW.patient_email <> ''
     AND COALESCE(v_settings.email_enabled, true) THEN
    v_channel := 'email';
    v_recipient := NEW.patient_email;
  ELSIF NEW.patient_phone IS NOT NULL AND NEW.patient_phone <> ''
     AND COALESCE(v_settings.whatsapp_enabled, false) THEN
    v_channel := 'whatsapp';
    v_recipient := NEW.patient_phone;
  ELSIF NEW.patient_phone IS NOT NULL AND NEW.patient_phone <> ''
     AND COALESCE(v_settings.sms_enabled, false) THEN
    v_channel := 'sms';
    v_recipient := NEW.patient_phone;
  ELSE
    RETURN NEW; -- sem canal disponível
  END IF;

  v_when_24   := NEW.starts_at - INTERVAL '24 hours';
  v_when_1    := NEW.starts_at - INTERVAL '1 hour';
  v_when_post := NEW.starts_at + INTERVAL '2 hours';
  v_pretty_date := to_char(NEW.starts_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI');

  -- Lembrete 24h antes
  IF v_when_24 > now() THEN
    INSERT INTO public.automation_jobs(
      tenant_id, kind, channel, recipient, recipient_name, subject, body,
      scheduled_for, patient_id, appointment_id
    ) VALUES (
      NEW.tenant_id, 'reminder', v_channel, v_recipient, NEW.patient_name,
      'Lembrete: sua consulta amanhã',
      format('Olá %s! Lembrando da sua consulta em %s. Responda para confirmar ou remarcar.', NEW.patient_name, v_pretty_date),
      v_when_24, NEW.patient_id, NEW.id
    );
  END IF;

  -- Lembrete 1h antes
  IF v_when_1 > now() THEN
    INSERT INTO public.automation_jobs(
      tenant_id, kind, channel, recipient, recipient_name, subject, body,
      scheduled_for, patient_id, appointment_id
    ) VALUES (
      NEW.tenant_id, 'reminder', v_channel, v_recipient, NEW.patient_name,
      'Sua consulta começa em 1 hora',
      format('Olá %s! Sua consulta é hoje às %s. Até já!', NEW.patient_name, to_char(NEW.starts_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI')),
      v_when_1, NEW.patient_id, NEW.id
    );
  END IF;

  -- Pós-consulta (agradecimento + NPS)
  INSERT INTO public.automation_jobs(
    tenant_id, kind, channel, recipient, recipient_name, subject, body,
    scheduled_for, patient_id, appointment_id
  ) VALUES (
    NEW.tenant_id, 'journey', v_channel, v_recipient, NEW.patient_name,
    'Como foi seu atendimento?',
    format('Obrigado por escolher nossa clínica, %s! De 0 a 10, quanto você nos recomendaria? Sua opinião é importante.', NEW.patient_name),
    v_when_post, NEW.patient_id, NEW.id
  );

  RETURN NEW;
END;
$$;

-- 2) Função para limpar jobs pendentes quando o appointment muda/cancela
CREATE OR REPLACE FUNCTION public.cleanup_appointment_automations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove pendentes se status virou cancelled/no_show ou se starts_at mudou
  IF (TG_OP = 'UPDATE' AND (NEW.status IN ('cancelled','no_show') OR NEW.starts_at IS DISTINCT FROM OLD.starts_at))
     OR TG_OP = 'DELETE' THEN
    DELETE FROM public.automation_jobs
     WHERE appointment_id = COALESCE(NEW.id, OLD.id) AND status = 'pending';
  END IF;

  -- Se mudou data e ainda ativo, re-enfileira
  IF TG_OP = 'UPDATE'
     AND NEW.status IN ('pending','confirmed')
     AND NEW.starts_at IS DISTINCT FROM OLD.starts_at THEN
    PERFORM public.enqueue_appointment_automations_for(NEW.id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- helper para re-uso
CREATE OR REPLACE FUNCTION public.enqueue_appointment_automations_for(_appointment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.appointments%ROWTYPE;
  v_dummy public.appointments%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.appointments WHERE id = _appointment_id;
  IF NOT FOUND THEN RETURN; END IF;
  -- chama trigger function manualmente
  PERFORM public.enqueue_appointment_automations_inner(r);
END;
$$;

-- versão "inner" reutilizável que aceita um registro
CREATE OR REPLACE FUNCTION public.enqueue_appointment_automations_inner(r public.appointments)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel TEXT;
  v_recipient TEXT;
  v_settings RECORD;
  v_when_24 TIMESTAMPTZ;
  v_when_1 TIMESTAMPTZ;
  v_when_post TIMESTAMPTZ;
  v_pretty_date TEXT;
BEGIN
  IF r.status NOT IN ('pending','confirmed') OR r.starts_at <= now() THEN RETURN; END IF;
  SELECT * INTO v_settings FROM public.automation_settings WHERE tenant_id = r.tenant_id;
  IF r.patient_email IS NOT NULL AND r.patient_email <> '' AND COALESCE(v_settings.email_enabled,true) THEN
    v_channel := 'email'; v_recipient := r.patient_email;
  ELSIF r.patient_phone IS NOT NULL AND r.patient_phone <> '' AND COALESCE(v_settings.whatsapp_enabled,false) THEN
    v_channel := 'whatsapp'; v_recipient := r.patient_phone;
  ELSIF r.patient_phone IS NOT NULL AND r.patient_phone <> '' AND COALESCE(v_settings.sms_enabled,false) THEN
    v_channel := 'sms'; v_recipient := r.patient_phone;
  ELSE RETURN; END IF;

  v_when_24 := r.starts_at - INTERVAL '24 hours';
  v_when_1  := r.starts_at - INTERVAL '1 hour';
  v_when_post := r.starts_at + INTERVAL '2 hours';
  v_pretty_date := to_char(r.starts_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI');

  IF v_when_24 > now() THEN
    INSERT INTO public.automation_jobs(tenant_id, kind, channel, recipient, recipient_name, subject, body, scheduled_for, patient_id, appointment_id)
    VALUES (r.tenant_id,'reminder',v_channel,v_recipient,r.patient_name,'Lembrete: sua consulta amanhã',
      format('Olá %s! Lembrando da sua consulta em %s. Responda para confirmar ou remarcar.', r.patient_name, v_pretty_date),
      v_when_24, r.patient_id, r.id);
  END IF;
  IF v_when_1 > now() THEN
    INSERT INTO public.automation_jobs(tenant_id, kind, channel, recipient, recipient_name, subject, body, scheduled_for, patient_id, appointment_id)
    VALUES (r.tenant_id,'reminder',v_channel,v_recipient,r.patient_name,'Sua consulta começa em 1 hora',
      format('Olá %s! Sua consulta é hoje às %s. Até já!', r.patient_name, to_char(r.starts_at AT TIME ZONE 'America/Sao_Paulo','HH24:MI')),
      v_when_1, r.patient_id, r.id);
  END IF;
  INSERT INTO public.automation_jobs(tenant_id, kind, channel, recipient, recipient_name, subject, body, scheduled_for, patient_id, appointment_id)
  VALUES (r.tenant_id,'journey',v_channel,v_recipient,r.patient_name,'Como foi seu atendimento?',
    format('Obrigado por escolher nossa clínica, %s! De 0 a 10, quanto você nos recomendaria?', r.patient_name),
    v_when_post, r.patient_id, r.id);
END;
$$;

-- 3) Triggers
DROP TRIGGER IF EXISTS appointments_enqueue_automations ON public.appointments;
CREATE TRIGGER appointments_enqueue_automations
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_appointment_automations();

DROP TRIGGER IF EXISTS appointments_cleanup_automations ON public.appointments;
CREATE TRIGGER appointments_cleanup_automations
  AFTER UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_appointment_automations();

-- 4) Habilita extensões
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 5) Agenda execução a cada 5 minutos
DO $$
BEGIN
  PERFORM cron.unschedule('run-automations-every-5min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'run-automations-every-5min',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url:='https://project--d941da18-eccc-4965-8443-c2ce52a707dd.lovable.app/api/public/hooks/run-automations',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $cron$
);
