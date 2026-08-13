CREATE TABLE public.doctor_availability_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(user_id) ON DELETE CASCADE,
  availability_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  consultation_mode public.consultation_mode NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (start_time < end_time),
  CHECK (end_time = start_time + interval '30 minutes'),
  CHECK (EXTRACT(MINUTE FROM start_time)::INT IN (0, 30)),
  CHECK (EXTRACT(MINUTE FROM end_time)::INT IN (0, 30)),
  UNIQUE (doctor_id, availability_date, start_time, consultation_mode)
);

CREATE INDEX doctor_availability_dates_lookup_idx
  ON public.doctor_availability_dates(doctor_id, availability_date, consultation_mode, start_time)
  WHERE active;

ALTER TABLE public.doctor_availability_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY dated_availability_anon_select ON public.doctor_availability_dates
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.doctor_profiles d
    WHERE d.user_id = doctor_id AND d.verification_status = 'VERIFIED'
  ));

CREATE POLICY dated_availability_owner_admin_select ON public.doctor_availability_dates
  FOR SELECT TO authenticated
  USING (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));

CREATE POLICY dated_availability_owner_write ON public.doctor_availability_dates
  FOR ALL TO authenticated
  USING (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'))
  WITH CHECK (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));

REVOKE ALL ON public.doctor_availability_dates FROM anon, authenticated;
GRANT SELECT ON public.doctor_availability_dates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.doctor_availability_dates TO authenticated;

CREATE OR REPLACE FUNCTION public.replace_doctor_availability_dates(availability_items JSONB)
RETURNS SETOF public.doctor_availability_dates
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  current_doctor UUID := (SELECT auth.uid());
  lima_today DATE := (now() AT TIME ZONE 'America/Lima')::DATE;
BEGIN
  IF current_doctor IS NULL OR NOT public.has_role('DOCTOR') OR NOT public.current_account_active() THEN
    RAISE EXCEPTION 'DOCTOR_ACCESS_REQUIRED';
  END IF;
  IF jsonb_typeof(availability_items) IS DISTINCT FROM 'array'
     OR jsonb_array_length(availability_items) > 600 THEN
    RAISE EXCEPTION 'INVALID_AVAILABILITY_ITEMS';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(availability_items) AS item(
      availability_date DATE,
      start_time TIME,
      end_time TIME,
      consultation_mode TEXT
    )
    WHERE item.availability_date < lima_today
      OR item.availability_date > lima_today + 60
      OR item.start_time >= item.end_time
      OR item.end_time <> item.start_time + interval '30 minutes'
      OR EXTRACT(MINUTE FROM item.start_time)::INT NOT IN (0, 30)
      OR EXTRACT(MINUTE FROM item.end_time)::INT NOT IN (0, 30)
      OR item.consultation_mode NOT IN ('VIRTUAL', 'HOME_VISIT')
  ) THEN
    RAISE EXCEPTION 'INVALID_AVAILABILITY_SLOT';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(availability_items) AS item(consultation_mode TEXT)
    CROSS JOIN public.doctor_profiles profile
    WHERE profile.user_id = current_doctor
      AND ((item.consultation_mode = 'VIRTUAL' AND NOT profile.offers_virtual)
        OR (item.consultation_mode = 'HOME_VISIT' AND NOT profile.offers_home_visit))
  ) THEN
    RAISE EXCEPTION 'CONSULTATION_MODE_NOT_OFFERED';
  END IF;

  DELETE FROM public.doctor_availability_dates WHERE doctor_id = current_doctor;
  DELETE FROM public.doctor_availability WHERE doctor_id = current_doctor;

  INSERT INTO public.doctor_availability_dates (
    doctor_id, availability_date, start_time, end_time, consultation_mode
  )
  SELECT current_doctor, item.availability_date, item.start_time, item.end_time,
    item.consultation_mode::public.consultation_mode
  FROM jsonb_to_recordset(availability_items) AS item(
    availability_date DATE,
    start_time TIME,
    end_time TIME,
    consultation_mode TEXT
  );

  RETURN QUERY
    SELECT availability.*
    FROM public.doctor_availability_dates availability
    WHERE availability.doctor_id = current_doctor
    ORDER BY availability.availability_date, availability.start_time;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_doctor_available_slots(
  requested_doctor UUID,
  range_start DATE,
  range_end DATE,
  requested_mode public.consultation_mode
)
RETURNS TABLE(starts_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  WITH limits AS (
    SELECT
      GREATEST(range_start, (now() AT TIME ZONE 'America/Lima')::DATE) AS first_day,
      LEAST(range_end, (now() AT TIME ZONE 'America/Lima')::DATE + 60) AS last_day
    WHERE range_start <= range_end
  ), eligible_doctor AS (
    SELECT profile.user_id
    FROM public.doctor_profiles profile
    JOIN public.users account ON account.id = profile.user_id
    WHERE profile.user_id = requested_doctor
      AND profile.verification_status = 'VERIFIED'
      AND account.account_status = 'ACTIVE'
      AND ((requested_mode = 'VIRTUAL' AND profile.offers_virtual)
        OR (requested_mode = 'HOME_VISIT' AND profile.offers_home_visit))
  ), dated_slots AS (
    SELECT slot_local AT TIME ZONE 'America/Lima' AS slot_start
    FROM limits
    JOIN public.doctor_availability_dates availability
      ON availability.availability_date BETWEEN limits.first_day AND limits.last_day
    JOIN eligible_doctor doctor ON doctor.user_id = availability.doctor_id
    CROSS JOIN LATERAL generate_series(
      availability.availability_date + availability.start_time,
      availability.availability_date + availability.end_time - interval '30 minutes',
      interval '30 minutes'
    ) AS slot_local
    WHERE availability.consultation_mode = requested_mode AND availability.active
  ), recurring_slots AS (
    SELECT slot_local AT TIME ZONE 'America/Lima' AS slot_start
    FROM limits
    CROSS JOIN LATERAL generate_series(
      limits.first_day::TIMESTAMP,
      limits.last_day::TIMESTAMP,
      interval '1 day'
    ) AS calendar_day
    JOIN public.doctor_availability availability
      ON availability.weekday = EXTRACT(ISODOW FROM calendar_day)::SMALLINT
    JOIN eligible_doctor doctor ON doctor.user_id = availability.doctor_id
    CROSS JOIN LATERAL generate_series(
      calendar_day::DATE + availability.start_time,
      calendar_day::DATE + availability.end_time - interval '30 minutes',
      interval '30 minutes'
    ) AS slot_local
    WHERE availability.consultation_mode = requested_mode AND availability.active
  ), candidates AS (
    SELECT slot_start FROM dated_slots
    UNION
    SELECT slot_start FROM recurring_slots
  )
  SELECT candidate.slot_start AS starts_at
  FROM candidates candidate
  WHERE candidate.slot_start >= now() + interval '30 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments appointment
      WHERE appointment.doctor_id = requested_doctor
        AND appointment.starts_at = candidate.slot_start
        AND appointment.status IN ('PENDING', 'CONFIRMED')
    )
  ORDER BY candidate.slot_start;
$$;

CREATE FUNCTION public.book_appointment_v2(
  requested_doctor UUID,
  requested_start TIMESTAMPTZ,
  requested_mode public.consultation_mode,
  requested_district UUID DEFAULT NULL,
  requested_address TEXT DEFAULT NULL,
  requested_reference TEXT DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE result public.appointments;
DECLARE local_date DATE;
DECLARE local_weekday SMALLINT;
DECLARE local_time TIME;
BEGIN
  IF NOT public.has_role('PATIENT') OR NOT public.current_account_active() THEN
    RAISE EXCEPTION 'PATIENT_ACCESS_REQUIRED';
  END IF;
  IF requested_start <= now() THEN RAISE EXCEPTION 'APPOINTMENT_IN_PAST'; END IF;
  IF requested_start > now() + interval '60 days' THEN RAISE EXCEPTION 'APPOINTMENT_OUTSIDE_HORIZON'; END IF;
  IF EXTRACT(MINUTE FROM requested_start AT TIME ZONE 'America/Lima')::INT NOT IN (0, 30) THEN
    RAISE EXCEPTION 'INVALID_SLOT_ALIGNMENT';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.doctor_profiles d JOIN public.users u ON u.id = d.user_id
    WHERE d.user_id = requested_doctor AND d.verification_status = 'VERIFIED'
      AND u.account_status = 'ACTIVE'
      AND ((requested_mode = 'VIRTUAL' AND d.offers_virtual)
        OR (requested_mode = 'HOME_VISIT' AND d.offers_home_visit))
  ) THEN RAISE EXCEPTION 'DOCTOR_UNAVAILABLE'; END IF;

  IF requested_mode = 'HOME_VISIT' THEN
    IF requested_district IS NULL OR char_length(trim(COALESCE(requested_address, ''))) < 5
       OR char_length(trim(COALESCE(requested_reference, ''))) < 3 THEN
      RAISE EXCEPTION 'HOME_VISIT_ADDRESS_REQUIRED';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.doctor_service_districts
      WHERE doctor_id = requested_doctor AND district_id = requested_district
    ) THEN RAISE EXCEPTION 'DISTRICT_NOT_COVERED'; END IF;
  ELSE
    requested_district := NULL; requested_address := NULL; requested_reference := NULL;
  END IF;

  local_date := (requested_start AT TIME ZONE 'America/Lima')::DATE;
  local_weekday := EXTRACT(ISODOW FROM requested_start AT TIME ZONE 'America/Lima')::SMALLINT;
  local_time := (requested_start AT TIME ZONE 'America/Lima')::TIME;
  IF NOT EXISTS (
    SELECT 1 FROM public.doctor_availability_dates
    WHERE doctor_id = requested_doctor AND availability_date = local_date
      AND consultation_mode = requested_mode AND active
      AND local_time >= start_time AND local_time + interval '30 minutes' <= end_time
    UNION ALL
    SELECT 1 FROM public.doctor_availability
    WHERE doctor_id = requested_doctor AND weekday = local_weekday
      AND consultation_mode = requested_mode AND active
      AND local_time >= start_time AND local_time + interval '30 minutes' <= end_time
  ) THEN RAISE EXCEPTION 'APPOINTMENT_SLOT_UNAVAILABLE'; END IF;

  INSERT INTO public.appointments (
    patient_id, doctor_id, consultation_mode, starts_at, ends_at,
    district_id, address, address_reference, virtual_meeting_url
  )
  SELECT (SELECT auth.uid()), requested_doctor, requested_mode, requested_start,
    requested_start + interval '30 minutes', requested_district,
    NULLIF(trim(requested_address), ''), NULLIF(trim(requested_reference), ''),
    CASE WHEN requested_mode = 'VIRTUAL' THEN d.virtual_meeting_url ELSE NULL END
  FROM public.doctor_profiles d WHERE d.user_id = requested_doctor
  RETURNING * INTO result;
  RETURN result;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'APPOINTMENT_SLOT_UNAVAILABLE';
END;
$$;

REVOKE ALL ON FUNCTION public.replace_doctor_availability_dates(JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_doctor_available_slots(UUID, DATE, DATE, public.consultation_mode) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_appointment_v2(UUID, TIMESTAMPTZ, public.consultation_mode, UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_doctor_availability_dates(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_available_slots(UUID, DATE, DATE, public.consultation_mode) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment_v2(UUID, TIMESTAMPTZ, public.consultation_mode, UUID, TEXT, TEXT) TO authenticated;
