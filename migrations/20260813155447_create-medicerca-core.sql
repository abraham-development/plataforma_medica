CREATE TYPE public.app_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
CREATE TYPE public.account_status AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE public.doctor_verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');
CREATE TYPE public.consultation_mode AS ENUM ('VIRTUAL', 'HOME_VISIT');
CREATE TYPE public.appointment_status AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
CREATE TYPE public.province_code AS ENUM ('LIMA', 'CALLAO');

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
  account_status public.account_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE public.patient_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.doctor_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  cmp TEXT UNIQUE,
  bio TEXT CHECK (bio IS NULL OR char_length(bio) <= 1200),
  avatar_url TEXT,
  avatar_key TEXT,
  verification_status public.doctor_verification_status NOT NULL DEFAULT 'PENDING',
  offers_virtual BOOLEAN NOT NULL DEFAULT false,
  offers_home_visit BOOLEAN NOT NULL DEFAULT false,
  virtual_meeting_url TEXT CHECK (virtual_meeting_url IS NULL OR virtual_meeting_url ~ '^https://'),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (NOT offers_virtual OR virtual_meeting_url IS NULL OR virtual_meeting_url ~ '^https://')
);

CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.doctor_specialties (
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(user_id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE RESTRICT,
  PRIMARY KEY (doctor_id, specialty_id)
);

CREATE TABLE public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  province public.province_code NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (name, province)
);

CREATE TABLE public.doctor_service_districts (
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(user_id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE RESTRICT,
  PRIMARY KEY (doctor_id, district_id)
);

CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(user_id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  consultation_mode public.consultation_mode NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (start_time < end_time),
  CHECK (EXTRACT(MINUTE FROM start_time)::INT IN (0, 30)),
  CHECK (EXTRACT(MINUTE FROM end_time)::INT IN (0, 30)),
  UNIQUE (doctor_id, weekday, start_time, end_time, consultation_mode)
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(user_id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(user_id) ON DELETE RESTRICT,
  consultation_mode public.consultation_mode NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'CONFIRMED',
  district_id UUID REFERENCES public.districts(id) ON DELETE RESTRICT,
  address TEXT,
  address_reference TEXT,
  virtual_meeting_url TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at = starts_at + interval '30 minutes'),
  CHECK (
    (consultation_mode = 'VIRTUAL' AND district_id IS NULL AND address IS NULL AND address_reference IS NULL)
    OR
    (consultation_mode = 'HOME_VISIT' AND district_id IS NOT NULL AND char_length(address) BETWEEN 5 AND 250
      AND char_length(address_reference) BETWEEN 3 AND 250)
  )
);

CREATE UNIQUE INDEX appointments_doctor_active_slot
  ON public.appointments (doctor_id, starts_at)
  WHERE status = 'CONFIRMED';
CREATE UNIQUE INDEX appointments_patient_active_slot
  ON public.appointments (patient_id, starts_at)
  WHERE status = 'CONFIRMED';

CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX user_roles_role_idx ON public.user_roles(role);
CREATE INDEX doctor_profiles_status_idx ON public.doctor_profiles(verification_status);
CREATE INDEX doctor_specialties_specialty_idx ON public.doctor_specialties(specialty_id);
CREATE INDEX doctor_service_districts_district_idx ON public.doctor_service_districts(district_id);
CREATE INDEX doctor_availability_lookup_idx ON public.doctor_availability(doctor_id, weekday, consultation_mode);
CREATE INDEX appointments_patient_time_idx ON public.appointments(patient_id, starts_at DESC);
CREATE INDEX appointments_doctor_time_idx ON public.appointments(doctor_id, starts_at DESC);
CREATE INDEX admin_audit_created_idx ON public.admin_audit_logs(created_at DESC);

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER patient_profiles_updated_at BEFORE UPDATE ON public.patient_profiles
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER doctor_profiles_updated_at BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER specialties_updated_at BEFORE UPDATE ON public.specialties
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (NEW.id, COALESCE(NULLIF(trim(NEW.profile->>'name'), ''), 'Usuario'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

CREATE OR REPLACE FUNCTION public.has_role(requested_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = requested_role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_account_active()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid()) AND account_status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.complete_registration(initial_role public.app_role)
RETURNS public.app_role
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE existing_count INT;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF initial_role = 'ADMIN' THEN RAISE EXCEPTION 'ADMIN_PUBLIC_SIGNUP_FORBIDDEN'; END IF;

  SELECT count(*) INTO existing_count FROM public.user_roles WHERE user_id = (SELECT auth.uid());
  IF existing_count > 0 THEN
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = initial_role) THEN
      RETURN initial_role;
    END IF;
    RAISE EXCEPTION 'INITIAL_ROLE_ALREADY_ASSIGNED';
  END IF;

  INSERT INTO public.user_roles(user_id, role) VALUES ((SELECT auth.uid()), initial_role);
  IF initial_role = 'PATIENT' THEN
    INSERT INTO public.patient_profiles(user_id) VALUES ((SELECT auth.uid())) ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.doctor_profiles(user_id) VALUES ((SELECT auth.uid())) ON CONFLICT DO NOTHING;
  END IF;
  RETURN initial_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.book_appointment(
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

  local_weekday := EXTRACT(ISODOW FROM requested_start AT TIME ZONE 'America/Lima')::SMALLINT;
  local_time := (requested_start AT TIME ZONE 'America/Lima')::TIME;
  IF NOT EXISTS (
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

CREATE OR REPLACE FUNCTION public.cancel_appointment(target_id UUID, reason TEXT DEFAULT NULL)
RETURNS public.appointments
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE current_row public.appointments;
DECLARE result public.appointments;
BEGIN
  SELECT * INTO current_row FROM public.appointments WHERE id = target_id FOR UPDATE;
  IF current_row.id IS NULL THEN RAISE EXCEPTION 'APPOINTMENT_NOT_FOUND'; END IF;
  IF current_row.status <> 'CONFIRMED' THEN RAISE EXCEPTION 'APPOINTMENT_NOT_CANCELLABLE'; END IF;

  IF public.has_role('PATIENT') AND current_row.patient_id = (SELECT auth.uid()) THEN
    IF current_row.starts_at < now() + interval '2 hours' THEN RAISE EXCEPTION 'CANCELLATION_WINDOW_CLOSED'; END IF;
  ELSIF public.has_role('DOCTOR') AND current_row.doctor_id = (SELECT auth.uid()) THEN
    IF current_row.starts_at <= now() OR char_length(trim(COALESCE(reason, ''))) < 3 THEN
      RAISE EXCEPTION 'DOCTOR_CANCELLATION_REASON_REQUIRED';
    END IF;
  ELSIF public.has_role('ADMIN') THEN
    IF current_row.starts_at <= now() OR char_length(trim(COALESCE(reason, ''))) < 3 THEN
      RAISE EXCEPTION 'ADMIN_CANCELLATION_REASON_REQUIRED';
    END IF;
  ELSE RAISE EXCEPTION 'APPOINTMENT_ACCESS_DENIED';
  END IF;

  UPDATE public.appointments SET status = 'CANCELLED', cancellation_reason = NULLIF(trim(reason), ''),
    cancelled_at = now(), cancelled_by = (SELECT auth.uid())
  WHERE id = target_id RETURNING * INTO result;
  RETURN result;
END;
$$;

INSERT INTO public.specialties(name, slug) VALUES
('Medicina General','medicina-general'),('Pediatría','pediatria'),('Dermatología','dermatologia'),
('Cardiología','cardiologia'),('Ginecología','ginecologia'),('Traumatología','traumatologia'),
('Psicología','psicologia');

INSERT INTO public.districts(name, province) VALUES
('Ancón','LIMA'),('Ate','LIMA'),('Barranco','LIMA'),('Breña','LIMA'),('Carabayllo','LIMA'),
('Chaclacayo','LIMA'),('Chorrillos','LIMA'),('Cieneguilla','LIMA'),('Comas','LIMA'),('El Agustino','LIMA'),
('Independencia','LIMA'),('Jesús María','LIMA'),('La Molina','LIMA'),('La Victoria','LIMA'),('Lima','LIMA'),
('Lince','LIMA'),('Los Olivos','LIMA'),('Lurigancho','LIMA'),('Lurín','LIMA'),('Magdalena del Mar','LIMA'),
('Miraflores','LIMA'),('Pachacámac','LIMA'),('Pucusana','LIMA'),('Pueblo Libre','LIMA'),('Puente Piedra','LIMA'),
('Punta Hermosa','LIMA'),('Punta Negra','LIMA'),('Rímac','LIMA'),('San Bartolo','LIMA'),('San Borja','LIMA'),
('San Isidro','LIMA'),('San Juan de Lurigancho','LIMA'),('San Juan de Miraflores','LIMA'),
('San Luis','LIMA'),('San Martín de Porres','LIMA'),('San Miguel','LIMA'),('Santa Anita','LIMA'),
('Santa María del Mar','LIMA'),('Santa Rosa','LIMA'),('Santiago de Surco','LIMA'),
('Surquillo','LIMA'),('Villa El Salvador','LIMA'),('Villa María del Triunfo','LIMA'),
('Bellavista','CALLAO'),('Callao','CALLAO'),('Carmen de La Legua-Reynoso','CALLAO'),
('La Perla','CALLAO'),('La Punta','CALLAO'),('Mi Perú','CALLAO'),('Ventanilla','CALLAO');

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_service_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_select ON public.users FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR public.has_role('ADMIN'));
CREATE POLICY users_self_update ON public.users FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY roles_self_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));
CREATE POLICY patient_self_all ON public.patient_profiles FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.has_role('ADMIN'))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY doctors_public_select ON public.doctor_profiles FOR SELECT TO anon, authenticated
  USING (verification_status = 'VERIFIED' OR user_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));
CREATE POLICY doctors_self_update ON public.doctor_profiles FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY specialties_public_select ON public.specialties FOR SELECT TO anon, authenticated USING (active OR public.has_role('ADMIN'));
CREATE POLICY districts_public_select ON public.districts FOR SELECT TO anon, authenticated USING (active OR public.has_role('ADMIN'));
CREATE POLICY doctor_specialties_public_select ON public.doctor_specialties FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.doctor_profiles d WHERE d.user_id = doctor_id AND d.verification_status = 'VERIFIED')
    OR doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));
CREATE POLICY doctor_specialties_owner_write ON public.doctor_specialties FOR ALL TO authenticated
  USING (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'))
  WITH CHECK (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));
CREATE POLICY service_districts_public_select ON public.doctor_service_districts FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.doctor_profiles d WHERE d.user_id = doctor_id AND d.verification_status = 'VERIFIED')
    OR doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));
CREATE POLICY service_districts_owner_write ON public.doctor_service_districts FOR ALL TO authenticated
  USING (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'))
  WITH CHECK (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));
CREATE POLICY availability_public_select ON public.doctor_availability FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.doctor_profiles d WHERE d.user_id = doctor_id AND d.verification_status = 'VERIFIED')
    OR doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));
CREATE POLICY availability_owner_write ON public.doctor_availability FOR ALL TO authenticated
  USING (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'))
  WITH CHECK (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));
CREATE POLICY appointments_parties_select ON public.appointments FOR SELECT TO authenticated
  USING (patient_id = (SELECT auth.uid()) OR doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));
CREATE POLICY audit_admin_select ON public.admin_audit_logs FOR SELECT TO authenticated USING (public.has_role('ADMIN'));

REVOKE ALL ON public.users, public.user_roles, public.patient_profiles, public.doctor_profiles,
  public.specialties, public.doctor_specialties, public.districts, public.doctor_service_districts,
  public.doctor_availability, public.appointments, public.admin_audit_logs FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.specialties, public.districts, public.doctor_profiles,
  public.doctor_specialties, public.doctor_service_districts, public.doctor_availability TO anon, authenticated;
GRANT SELECT ON public.users, public.user_roles, public.patient_profiles, public.appointments,
  public.admin_audit_logs TO authenticated;
GRANT UPDATE (display_name) ON public.users TO authenticated;
GRANT UPDATE (first_name, last_name) ON public.patient_profiles TO authenticated;
GRANT UPDATE (first_name, last_name, cmp, bio, avatar_url, avatar_key, offers_virtual,
  offers_home_visit, virtual_meeting_url, submitted_at) ON public.doctor_profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.doctor_specialties, public.doctor_service_districts,
  public.doctor_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_registration(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment(UUID, TIMESTAMPTZ, public.consultation_mode, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment(UUID, TEXT) TO authenticated;
