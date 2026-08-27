CREATE OR REPLACE FUNCTION public.admin_list_doctor_payout_summaries()
RETURNS TABLE (
  doctor_id UUID,
  doctor_name TEXT,
  verification_status public.doctor_verification_status,
  method_count BIGINT,
  preferred_type public.payout_method_type,
  preferred_masked_destination TEXT,
  methods_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF NOT public.has_role('ADMIN') OR NOT public.current_account_active() THEN
    RAISE EXCEPTION 'ADMIN_ACCESS_REQUIRED';
  END IF;

  RETURN QUERY
  SELECT
    profile.user_id,
    COALESCE(NULLIF(trim(concat_ws(' ', profile.first_name, profile.last_name)), ''), account.display_name),
    profile.verification_status,
    count(method.id),
    (array_agg(method.method_type ORDER BY method.is_preferred DESC, method.created_at)
      FILTER (WHERE method.id IS NOT NULL))[1],
    (array_agg(
      CASE
        WHEN method.method_type = 'YAPE' THEN 'Yape ••• ' || right(method.yape_phone, 3)
        WHEN method.method_type = 'BANK_ACCOUNT' THEN method.bank_name || ' •••• ' || right(method.bank_account_number, 4)
        ELSE NULL
      END
      ORDER BY method.is_preferred DESC, method.created_at
    ) FILTER (WHERE method.id IS NOT NULL))[1],
    max(method.updated_at)
  FROM public.doctor_profiles profile
  JOIN public.users account ON account.id = profile.user_id
  LEFT JOIN public.doctor_payout_methods method ON method.doctor_id = profile.user_id
  GROUP BY profile.user_id, account.display_name, profile.verification_status
  ORDER BY max(method.updated_at) DESC NULLS LAST, doctor_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reveal_doctor_payout_methods(target_doctor UUID)
RETURNS SETOF public.doctor_payout_methods
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  revealed_count INTEGER;
BEGIN
  IF NOT public.has_role('ADMIN') OR NOT public.current_account_active() THEN
    RAISE EXCEPTION 'ADMIN_ACCESS_REQUIRED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.doctor_profiles WHERE user_id = target_doctor) THEN
    RAISE EXCEPTION 'DOCTOR_NOT_FOUND';
  END IF;

  SELECT count(*) INTO revealed_count
  FROM public.doctor_payout_methods WHERE doctor_id = target_doctor;

  INSERT INTO public.admin_audit_logs(admin_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    (SELECT auth.uid()),
    'ADMIN_VIEW_DOCTOR_PAYOUT_METHODS',
    'DOCTOR',
    target_doctor::TEXT,
    jsonb_build_object('methodCount', revealed_count)
  );

  RETURN QUERY
  SELECT method.* FROM public.doctor_payout_methods method
  WHERE method.doctor_id = target_doctor
  ORDER BY method.is_preferred DESC, method.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_doctor_payout_summaries() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reveal_doctor_payout_methods(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_list_doctor_payout_summaries() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reveal_doctor_payout_methods(UUID) TO authenticated;
