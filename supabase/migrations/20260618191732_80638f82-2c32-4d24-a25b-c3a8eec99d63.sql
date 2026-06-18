
REVOKE EXECUTE ON FUNCTION public.enqueue_appointment_automations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_appointment_automations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_appointment_automations_for(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_appointment_automations_inner(public.appointments) FROM PUBLIC, anon, authenticated;
