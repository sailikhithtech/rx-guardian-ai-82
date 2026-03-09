-- Saved/Favourite Doctors
CREATE TABLE public.saved_doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  hospital TEXT NOT NULL,
  image TEXT,
  last_visited DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, doctor_id)
);

ALTER TABLE public.saved_doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved doctors" ON public.saved_doctors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved doctors" ON public.saved_doctors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved doctors" ON public.saved_doctors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved doctors" ON public.saved_doctors FOR DELETE USING (auth.uid() = user_id);

-- Consultation History
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  consultation_date DATE NOT NULL,
  diagnosis TEXT,
  reason TEXT,
  prescribed_medicines TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consultations" ON public.consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consultations" ON public.consultations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own consultations" ON public.consultations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own consultations" ON public.consultations FOR DELETE USING (auth.uid() = user_id);

-- Medical Documents
CREATE TABLE public.medical_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'others',
  doctor_name TEXT,
  description TEXT,
  document_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.medical_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.medical_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.medical_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.medical_documents FOR DELETE USING (auth.uid() = user_id);

-- Health Vitals
CREATE TABLE public.health_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vital_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  secondary_value NUMERIC,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.health_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vitals" ON public.health_vitals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vitals" ON public.health_vitals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vitals" ON public.health_vitals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vitals" ON public.health_vitals FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-documents', 'medical-documents', false);

-- Storage RLS policies
CREATE POLICY "Users can upload own documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);