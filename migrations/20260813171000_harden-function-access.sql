-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Remove that
-- implicit access and grant only the RPCs required by authenticated users.
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.slugify(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_account_active() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_registration(public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.book_appointment(UUID, TIMESTAMPTZ, public.consultation_mode, UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_appointment(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_appointment_outcome(UUID, public.appointment_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_dashboard() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_doctor_status(UUID, public.doctor_verification_status, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_account_status(UUID, public.account_status, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_upsert_specialty(UUID, TEXT, BOOLEAN) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_registration(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment(UUID, TIMESTAMPTZ, public.consultation_mode, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_appointment_outcome(UUID, public.appointment_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_doctor_status(UUID, public.doctor_verification_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(UUID, public.account_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_specialty(UUID, TEXT, BOOLEAN) TO authenticated;

-- Public catalog policies must not call has_role as the anonymous role. Keep
-- the public and administrative branches as separate permissive policies.
DROP POLICY specialties_public_select ON public.specialties;
CREATE POLICY specialties_active_select ON public.specialties FOR SELECT TO anon, authenticated
  USING (active);
CREATE POLICY specialties_admin_select ON public.specialties FOR SELECT TO authenticated
  USING (public.has_role('ADMIN'));

DROP POLICY districts_public_select ON public.districts;
CREATE POLICY districts_active_select ON public.districts FOR SELECT TO anon, authenticated
  USING (active);
CREATE POLICY districts_admin_select ON public.districts FOR SELECT TO authenticated
  USING (public.has_role('ADMIN'));

DROP POLICY doctor_specialties_public_select ON public.doctor_specialties;
CREATE POLICY doctor_specialties_anon_select ON public.doctor_specialties FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.doctor_profiles d
    WHERE d.user_id = doctor_id AND d.verification_status = 'VERIFIED'
  ));
CREATE POLICY doctor_specialties_owner_admin_select ON public.doctor_specialties FOR SELECT TO authenticated
  USING (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));

DROP POLICY service_districts_public_select ON public.doctor_service_districts;
CREATE POLICY service_districts_anon_select ON public.doctor_service_districts FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.doctor_profiles d
    WHERE d.user_id = doctor_id AND d.verification_status = 'VERIFIED'
  ));
CREATE POLICY service_districts_owner_admin_select ON public.doctor_service_districts FOR SELECT TO authenticated
  USING (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));

DROP POLICY availability_public_select ON public.doctor_availability;
CREATE POLICY availability_anon_select ON public.doctor_availability FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.doctor_profiles d
    WHERE d.user_id = doctor_id AND d.verification_status = 'VERIFIED'
  ));
CREATE POLICY availability_owner_admin_select ON public.doctor_availability FOR SELECT TO authenticated
  USING (doctor_id = (SELECT auth.uid()) OR public.has_role('ADMIN'));

CREATE INDEX specialties_active_idx ON public.specialties(active);
CREATE INDEX districts_active_idx ON public.districts(active);
CREATE INDEX admin_audit_admin_idx ON public.admin_audit_logs(admin_user_id);
CREATE INDEX appointments_cancelled_by_idx ON public.appointments(cancelled_by);
CREATE INDEX appointments_district_idx ON public.appointments(district_id);
