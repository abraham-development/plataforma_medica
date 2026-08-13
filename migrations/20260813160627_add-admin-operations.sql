DROP POLICY doctors_public_select ON public.doctor_profiles;
CREATE POLICY doctors_anon_verified_select ON public.doctor_profiles FOR SELECT TO anon
  USING (verification_status = 'VERIFIED');
CREATE POLICY doctors_authenticated_private_select ON public.doctor_profiles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));
REVOKE SELECT ON public.doctor_profiles FROM anon;
GRANT SELECT (user_id, first_name, last_name, cmp, bio, avatar_url, verification_status,
  offers_virtual, offers_home_visit, created_at, updated_at) ON public.doctor_profiles TO anon;

CREATE OR REPLACE FUNCTION public.admin_dashboard()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT CASE WHEN public.has_role('ADMIN') THEN jsonb_build_object(
    'pendingDoctors', (SELECT count(*) FROM public.doctor_profiles WHERE verification_status = 'PENDING'),
    'verifiedDoctors', (SELECT count(*) FROM public.doctor_profiles WHERE verification_status = 'VERIFIED'),
    'suspendedDoctors', (SELECT count(*) FROM public.doctor_profiles WHERE verification_status = 'SUSPENDED'),
    'patients', (SELECT count(*) FROM public.user_roles WHERE role = 'PATIENT'),
    'todayAppointments', (SELECT count(*) FROM public.appointments WHERE starts_at >= date_trunc('day', now() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima' AND starts_at < (date_trunc('day', now() AT TIME ZONE 'America/Lima') + interval '1 day') AT TIME ZONE 'America/Lima'),
    'futureAppointments', (SELECT count(*) FROM public.appointments WHERE starts_at > now() AND status = 'CONFIRMED'),
    'cancelledAppointments', (SELECT count(*) FROM public.appointments WHERE status = 'CANCELLED')
  ) ELSE NULL END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_doctor_status(
  target_doctor UUID,
  target_status public.doctor_verification_status,
  reason TEXT DEFAULT NULL
)
RETURNS public.doctor_profiles LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE result public.doctor_profiles;
BEGIN
  IF NOT public.has_role('ADMIN') THEN RAISE EXCEPTION 'ADMIN_ACCESS_REQUIRED'; END IF;
  IF target_status IN ('REJECTED','SUSPENDED') AND char_length(trim(COALESCE(reason,''))) < 3 THEN
    RAISE EXCEPTION 'ADMIN_REASON_REQUIRED';
  END IF;
  IF target_status = 'VERIFIED' AND NOT EXISTS (
    SELECT 1 FROM public.doctor_profiles d
    WHERE d.user_id = target_doctor AND d.first_name IS NOT NULL AND d.last_name IS NOT NULL
      AND d.cmp IS NOT NULL AND d.bio IS NOT NULL AND (d.offers_virtual OR d.offers_home_visit)
      AND EXISTS (SELECT 1 FROM public.doctor_specialties ds WHERE ds.doctor_id = d.user_id)
  ) THEN RAISE EXCEPTION 'DOCTOR_PROFILE_INCOMPLETE'; END IF;
  UPDATE public.doctor_profiles SET verification_status = target_status WHERE user_id = target_doctor RETURNING * INTO result;
  IF result.user_id IS NULL THEN RAISE EXCEPTION 'DOCTOR_NOT_FOUND'; END IF;
  INSERT INTO public.admin_audit_logs(admin_user_id, action, entity_type, entity_id, metadata)
  VALUES ((SELECT auth.uid()), 'ADMIN_' || target_status::TEXT || '_DOCTOR', 'DOCTOR', target_doctor::TEXT,
    jsonb_build_object('reason', NULLIF(trim(reason), '')));
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_account_status(
  target_user UUID,
  target_status public.account_status,
  reason TEXT
)
RETURNS public.users LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE result public.users;
BEGIN
  IF NOT public.has_role('ADMIN') THEN RAISE EXCEPTION 'ADMIN_ACCESS_REQUIRED'; END IF;
  IF target_user = (SELECT auth.uid()) THEN RAISE EXCEPTION 'ADMIN_CANNOT_SUSPEND_SELF'; END IF;
  IF char_length(trim(COALESCE(reason,''))) < 3 THEN RAISE EXCEPTION 'ADMIN_REASON_REQUIRED'; END IF;
  UPDATE public.users SET account_status = target_status WHERE id = target_user RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'USER_NOT_FOUND'; END IF;
  INSERT INTO public.admin_audit_logs(admin_user_id, action, entity_type, entity_id, metadata)
  VALUES ((SELECT auth.uid()), 'ADMIN_SET_USER_' || target_status::TEXT, 'USER', target_user::TEXT,
    jsonb_build_object('reason', trim(reason)));
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE
AS $$ SELECT trim(both '-' FROM regexp_replace(lower(translate(value, 'áéíóúñüÁÉÍÓÚÑÜ', 'aeiounuAEIOUNU')), '[^a-z0-9]+', '-', 'g')); $$;

CREATE OR REPLACE FUNCTION public.admin_upsert_specialty(
  specialty_id UUID,
  specialty_name TEXT,
  specialty_active BOOLEAN DEFAULT true
)
RETURNS public.specialties LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE result public.specialties;
BEGIN
  IF NOT public.has_role('ADMIN') THEN RAISE EXCEPTION 'ADMIN_ACCESS_REQUIRED'; END IF;
  IF char_length(trim(specialty_name)) < 3 THEN RAISE EXCEPTION 'SPECIALTY_NAME_INVALID'; END IF;
  IF specialty_id IS NULL THEN
    INSERT INTO public.specialties(name, slug, active)
    VALUES (trim(specialty_name), public.slugify(specialty_name), specialty_active) RETURNING * INTO result;
    INSERT INTO public.admin_audit_logs(admin_user_id, action, entity_type, entity_id)
    VALUES ((SELECT auth.uid()), 'SPECIALTY_CREATE', 'SPECIALTY', result.id::TEXT);
  ELSE
    UPDATE public.specialties SET name = trim(specialty_name), slug = public.slugify(specialty_name), active = specialty_active
    WHERE id = specialty_id RETURNING * INTO result;
    IF result.id IS NULL THEN RAISE EXCEPTION 'SPECIALTY_NOT_FOUND'; END IF;
    INSERT INTO public.admin_audit_logs(admin_user_id, action, entity_type, entity_id)
    VALUES ((SELECT auth.uid()), 'SPECIALTY_UPDATE', 'SPECIALTY', result.id::TEXT);
  END IF;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_doctor_status(UUID, public.doctor_verification_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(UUID, public.account_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_specialty(UUID, TEXT, BOOLEAN) TO authenticated;
