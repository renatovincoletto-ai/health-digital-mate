
REVOKE ALL ON FUNCTION public.cleanup_audit_log() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_audit_log() TO service_role;

REVOKE ALL ON FUNCTION public.log_audit(text, text, text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit(text, text, text, jsonb, text) TO authenticated, service_role;
