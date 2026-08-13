CREATE OR REPLACE FUNCTION public.set_appointment_outcome(
  target_id UUID,
  outcome public.appointment_status
)
RETURNS public.appointments
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE current_row public.appointments;
DECLARE result public.appointments;
BEGIN
  IF outcome NOT IN ('COMPLETED', 'NO_SHOW') THEN
    RAISE EXCEPTION 'INVALID_APPOINTMENT_OUTCOME';
  END IF;

  SELECT * INTO current_row FROM public.appointments WHERE id = target_id FOR UPDATE;
  IF current_row.id IS NULL THEN RAISE EXCEPTION 'APPOINTMENT_NOT_FOUND'; END IF;
  IF current_row.status <> 'CONFIRMED' THEN RAISE EXCEPTION 'APPOINTMENT_ALREADY_CLOSED'; END IF;
  IF current_row.ends_at > now() THEN RAISE EXCEPTION 'APPOINTMENT_NOT_FINISHED'; END IF;

  IF NOT (
    (public.has_role('DOCTOR') AND current_row.doctor_id = (SELECT auth.uid()))
    OR public.has_role('ADMIN')
  ) THEN
    RAISE EXCEPTION 'APPOINTMENT_ACCESS_DENIED';
  END IF;

  UPDATE public.appointments SET status = outcome
  WHERE id = target_id RETURNING * INTO result;

  IF public.has_role('ADMIN') THEN
    INSERT INTO public.admin_audit_logs(admin_user_id, action, entity_type, entity_id, metadata)
    VALUES ((SELECT auth.uid()), 'ADMIN_SET_APPOINTMENT_OUTCOME', 'APPOINTMENT', target_id,
      jsonb_build_object('status', outcome));
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_appointment_outcome(UUID, public.appointment_status) TO authenticated;
