-- Role enum
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'admin');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Auto-assign patient role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Doctors profile table
CREATE TABLE public.doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialization TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  registration_number TEXT NOT NULL,
  profile_photo_url TEXT,
  consultation_fee INTEGER NOT NULL DEFAULT 500,
  video_fee INTEGER,
  about TEXT,
  education TEXT[],
  languages TEXT[],
  phone TEXT,
  address TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Doctors can see and update own profile
CREATE POLICY "Doctors can view own profile" ON public.doctor_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Doctors can update own profile" ON public.doctor_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Doctors can insert own profile" ON public.doctor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Patients can view verified doctor profiles
CREATE POLICY "Anyone can view verified doctors" ON public.doctor_profiles
  FOR SELECT USING (is_verified = true);

-- Doctor availability table
CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  slot_duration INTEGER NOT NULL DEFAULT 30,
  is_available BOOLEAN NOT NULL DEFAULT true,
  max_patients INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, day_of_week)
);
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can manage own availability" ON public.doctor_availability
  FOR ALL USING (
    doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Anyone can view availability" ON public.doctor_availability
  FOR SELECT USING (true);

-- Doctor blocked dates
CREATE TABLE public.doctor_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, blocked_date)
);
ALTER TABLE public.doctor_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can manage own blocked dates" ON public.doctor_blocked_dates
  FOR ALL USING (
    doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
  );