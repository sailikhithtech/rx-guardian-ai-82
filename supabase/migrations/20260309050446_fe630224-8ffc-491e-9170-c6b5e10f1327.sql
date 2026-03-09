
-- Prescriptions table
CREATE TABLE public.doctor_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  diagnosis text,
  medicines jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  follow_up_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can manage own prescriptions"
ON public.doctor_prescriptions FOR ALL TO authenticated
USING (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Patients can view own prescriptions"
ON public.doctor_prescriptions FOR SELECT TO authenticated
USING (patient_id = auth.uid());

-- Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
ON public.messages FOR SELECT TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE TO authenticated
USING (receiver_id = auth.uid());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
