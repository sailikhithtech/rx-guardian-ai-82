
-- Allow doctors to view appointments where they are the doctor
CREATE POLICY "Doctors can view their appointments"
ON public.appointments FOR SELECT TO authenticated
USING (
  doctor_id IN (
    SELECT id::text FROM public.doctor_profiles WHERE user_id = auth.uid()
  )
);

-- Allow doctors to update appointments (accept/decline/complete)
CREATE POLICY "Doctors can update their appointments"
ON public.appointments FOR UPDATE TO authenticated
USING (
  doctor_id IN (
    SELECT id::text FROM public.doctor_profiles WHERE user_id = auth.uid()
  )
);

-- Allow doctors to view consultations for their patients
CREATE POLICY "Doctors can view patient consultations"
ON public.consultations FOR SELECT TO authenticated
USING (
  doctor_id IN (
    SELECT id::text FROM public.doctor_profiles WHERE user_id = auth.uid()
  )
);

-- Allow doctors to insert consultations
CREATE POLICY "Doctors can insert consultations"
ON public.consultations FOR INSERT TO authenticated
WITH CHECK (
  doctor_id IN (
    SELECT id::text FROM public.doctor_profiles WHERE user_id = auth.uid()
  )
);

-- Allow doctors to view health vitals for patients they've seen
CREATE POLICY "Doctors can view patient vitals"
ON public.health_vitals FOR SELECT TO authenticated
USING (
  user_id IN (
    SELECT DISTINCT a.user_id FROM public.appointments a
    WHERE a.doctor_id IN (
      SELECT id::text FROM public.doctor_profiles WHERE user_id = auth.uid()
    )
  )
);

-- Allow doctors to view medical documents for their patients
CREATE POLICY "Doctors can view patient documents"
ON public.medical_documents FOR SELECT TO authenticated
USING (
  user_id IN (
    SELECT DISTINCT a.user_id FROM public.appointments a
    WHERE a.doctor_id IN (
      SELECT id::text FROM public.doctor_profiles WHERE user_id = auth.uid()
    )
  )
);
