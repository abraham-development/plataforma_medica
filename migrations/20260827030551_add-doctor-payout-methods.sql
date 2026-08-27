CREATE TYPE public.payout_method_type AS ENUM ('YAPE', 'BANK_ACCOUNT');
CREATE TYPE public.bank_account_type AS ENUM ('SAVINGS', 'CHECKING');

CREATE TABLE public.doctor_payout_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(user_id) ON DELETE CASCADE,
  method_type public.payout_method_type NOT NULL,
  holder_name TEXT NOT NULL CHECK (char_length(holder_name) BETWEEN 2 AND 160),
  yape_phone TEXT,
  bank_name TEXT,
  bank_account_type public.bank_account_type,
  bank_account_number TEXT,
  bank_cci TEXT,
  currency TEXT NOT NULL DEFAULT 'PEN' CHECK (currency = 'PEN'),
  is_preferred BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (method_type = 'YAPE'
      AND yape_phone ~ '^9[0-9]{8}$'
      AND bank_name IS NULL
      AND bank_account_type IS NULL
      AND bank_account_number IS NULL
      AND bank_cci IS NULL)
    OR
    (method_type = 'BANK_ACCOUNT'
      AND yape_phone IS NULL
      AND char_length(bank_name) BETWEEN 2 AND 100
      AND bank_account_type IS NOT NULL
      AND bank_account_number ~ '^[0-9]{6,30}$'
      AND (bank_cci IS NULL OR bank_cci ~ '^[0-9]{20}$'))
  )
);

CREATE INDEX doctor_payout_methods_doctor_idx
  ON public.doctor_payout_methods(doctor_id, created_at);
CREATE UNIQUE INDEX doctor_payout_methods_one_preferred_idx
  ON public.doctor_payout_methods(doctor_id)
  WHERE is_preferred;
CREATE UNIQUE INDEX doctor_payout_methods_unique_yape_idx
  ON public.doctor_payout_methods(doctor_id, yape_phone)
  WHERE method_type = 'YAPE';
CREATE UNIQUE INDEX doctor_payout_methods_unique_bank_idx
  ON public.doctor_payout_methods(doctor_id, lower(bank_name), bank_account_number)
  WHERE method_type = 'BANK_ACCOUNT';

CREATE TRIGGER doctor_payout_methods_updated_at
  BEFORE UPDATE ON public.doctor_payout_methods
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

ALTER TABLE public.doctor_payout_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY doctor_payout_methods_owner_select
ON public.doctor_payout_methods FOR SELECT TO authenticated
USING (doctor_id = (SELECT auth.uid()) AND public.has_role('DOCTOR'));

REVOKE ALL ON public.doctor_payout_methods FROM anon, authenticated;
GRANT SELECT ON public.doctor_payout_methods TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_doctor_payout_method(
  requested_method_type public.payout_method_type,
  target_id UUID DEFAULT NULL,
  requested_holder_name TEXT DEFAULT NULL,
  requested_yape_phone TEXT DEFAULT NULL,
  requested_bank_name TEXT DEFAULT NULL,
  requested_bank_account_type public.bank_account_type DEFAULT NULL,
  requested_bank_account_number TEXT DEFAULT NULL,
  requested_bank_cci TEXT DEFAULT NULL,
  requested_preferred BOOLEAN DEFAULT false
)
RETURNS public.doctor_payout_methods
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  current_doctor UUID := (SELECT auth.uid());
  normalized_holder TEXT := trim(COALESCE(requested_holder_name, ''));
  normalized_phone TEXT := regexp_replace(COALESCE(requested_yape_phone, ''), '[^0-9]', '', 'g');
  normalized_bank TEXT := trim(COALESCE(requested_bank_name, ''));
  normalized_account TEXT := regexp_replace(COALESCE(requested_bank_account_number, ''), '[^0-9]', '', 'g');
  normalized_cci TEXT := regexp_replace(COALESCE(requested_bank_cci, ''), '[^0-9]', '', 'g');
  keep_preferred BOOLEAN := false;
  should_prefer BOOLEAN;
  result public.doctor_payout_methods;
BEGIN
  IF current_doctor IS NULL OR NOT public.has_role('DOCTOR') OR NOT public.current_account_active() THEN
    RAISE EXCEPTION 'DOCTOR_ACCESS_REQUIRED';
  END IF;

  PERFORM 1 FROM public.doctor_profiles WHERE user_id = current_doctor FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'DOCTOR_PROFILE_REQUIRED'; END IF;

  IF char_length(normalized_holder) NOT BETWEEN 2 AND 160 THEN
    RAISE EXCEPTION 'PAYOUT_HOLDER_INVALID';
  END IF;

  IF left(normalized_phone, 2) = '51' AND char_length(normalized_phone) = 11 THEN
    normalized_phone := right(normalized_phone, 9);
  END IF;

  IF requested_method_type = 'YAPE' THEN
    IF normalized_phone !~ '^9[0-9]{8}$' THEN RAISE EXCEPTION 'YAPE_PHONE_INVALID'; END IF;
    normalized_bank := '';
    normalized_account := '';
    normalized_cci := '';
    requested_bank_account_type := NULL;
  ELSE
    IF char_length(normalized_bank) NOT BETWEEN 2 AND 100 THEN
      RAISE EXCEPTION 'BANK_NAME_INVALID';
    END IF;
    IF requested_bank_account_type IS NULL THEN RAISE EXCEPTION 'BANK_ACCOUNT_TYPE_REQUIRED'; END IF;
    IF normalized_account !~ '^[0-9]{6,30}$' THEN RAISE EXCEPTION 'BANK_ACCOUNT_INVALID'; END IF;
    IF normalized_cci <> '' AND normalized_cci !~ '^[0-9]{20}$' THEN
      RAISE EXCEPTION 'BANK_CCI_INVALID';
    END IF;
    normalized_phone := '';
  END IF;

  IF target_id IS NOT NULL THEN
    SELECT method.is_preferred INTO keep_preferred
    FROM public.doctor_payout_methods method
    WHERE method.id = target_id AND method.doctor_id = current_doctor;
    IF NOT FOUND THEN RAISE EXCEPTION 'PAYOUT_METHOD_NOT_FOUND'; END IF;
  END IF;

  should_prefer := requested_preferred OR keep_preferred OR NOT EXISTS (
    SELECT 1 FROM public.doctor_payout_methods WHERE doctor_id = current_doctor
  );

  IF should_prefer THEN
    UPDATE public.doctor_payout_methods
    SET is_preferred = false
    WHERE doctor_id = current_doctor AND is_preferred;
  END IF;

  IF target_id IS NULL THEN
    INSERT INTO public.doctor_payout_methods (
      doctor_id, method_type, holder_name, yape_phone, bank_name, bank_account_type,
      bank_account_number, bank_cci, currency, is_preferred
    ) VALUES (
      current_doctor,
      requested_method_type,
      normalized_holder,
      NULLIF(normalized_phone, ''),
      NULLIF(normalized_bank, ''),
      requested_bank_account_type,
      NULLIF(normalized_account, ''),
      NULLIF(normalized_cci, ''),
      'PEN',
      should_prefer
    ) RETURNING * INTO result;
  ELSE
    UPDATE public.doctor_payout_methods
    SET method_type = requested_method_type,
        holder_name = normalized_holder,
        yape_phone = NULLIF(normalized_phone, ''),
        bank_name = NULLIF(normalized_bank, ''),
        bank_account_type = requested_bank_account_type,
        bank_account_number = NULLIF(normalized_account, ''),
        bank_cci = NULLIF(normalized_cci, ''),
        currency = 'PEN',
        is_preferred = should_prefer
    WHERE id = target_id AND doctor_id = current_doctor
    RETURNING * INTO result;
  END IF;

  RETURN result;
EXCEPTION
  WHEN unique_violation THEN RAISE EXCEPTION 'PAYOUT_METHOD_DUPLICATE';
END;
$$;

CREATE OR REPLACE FUNCTION public.set_preferred_doctor_payout_method(target_id UUID)
RETURNS public.doctor_payout_methods
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  current_doctor UUID := (SELECT auth.uid());
  result public.doctor_payout_methods;
BEGIN
  IF current_doctor IS NULL OR NOT public.has_role('DOCTOR') OR NOT public.current_account_active() THEN
    RAISE EXCEPTION 'DOCTOR_ACCESS_REQUIRED';
  END IF;
  PERFORM 1 FROM public.doctor_profiles WHERE user_id = current_doctor FOR UPDATE;
  IF NOT EXISTS (
    SELECT 1 FROM public.doctor_payout_methods
    WHERE id = target_id AND doctor_id = current_doctor
  ) THEN RAISE EXCEPTION 'PAYOUT_METHOD_NOT_FOUND'; END IF;

  UPDATE public.doctor_payout_methods SET is_preferred = false
  WHERE doctor_id = current_doctor AND is_preferred;
  UPDATE public.doctor_payout_methods SET is_preferred = true
  WHERE id = target_id AND doctor_id = current_doctor
  RETURNING * INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_doctor_payout_method(target_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  current_doctor UUID := (SELECT auth.uid());
  was_preferred BOOLEAN;
BEGIN
  IF current_doctor IS NULL OR NOT public.has_role('DOCTOR') OR NOT public.current_account_active() THEN
    RAISE EXCEPTION 'DOCTOR_ACCESS_REQUIRED';
  END IF;
  PERFORM 1 FROM public.doctor_profiles WHERE user_id = current_doctor FOR UPDATE;
  DELETE FROM public.doctor_payout_methods
  WHERE id = target_id AND doctor_id = current_doctor
  RETURNING is_preferred INTO was_preferred;
  IF NOT FOUND THEN RAISE EXCEPTION 'PAYOUT_METHOD_NOT_FOUND'; END IF;

  IF was_preferred THEN
    UPDATE public.doctor_payout_methods SET is_preferred = true
    WHERE id = (
      SELECT id FROM public.doctor_payout_methods
      WHERE doctor_id = current_doctor
      ORDER BY created_at, id
      LIMIT 1
    );
  END IF;
  RETURN true;
END;
$$;

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
  IF NOT public.has_role('ADMIN') THEN RAISE EXCEPTION 'ADMIN_ACCESS_REQUIRED'; END IF;

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
  IF NOT public.has_role('ADMIN') THEN RAISE EXCEPTION 'ADMIN_ACCESS_REQUIRED'; END IF;
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

REVOKE ALL ON FUNCTION public.upsert_doctor_payout_method(
  public.payout_method_type, UUID, TEXT, TEXT, TEXT, public.bank_account_type, TEXT, TEXT, BOOLEAN
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_preferred_doctor_payout_method(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_doctor_payout_method(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_doctor_payout_summaries() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reveal_doctor_payout_methods(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.upsert_doctor_payout_method(
  public.payout_method_type, UUID, TEXT, TEXT, TEXT, public.bank_account_type, TEXT, TEXT, BOOLEAN
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_preferred_doctor_payout_method(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_doctor_payout_method(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_doctor_payout_summaries() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reveal_doctor_payout_methods(UUID) TO authenticated;
