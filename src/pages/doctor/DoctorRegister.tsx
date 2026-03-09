import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Stethoscope, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

const specializations = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Gynecologist',
  'Neurologist', 'Orthopedic', 'Pediatrician', 'Psychiatrist',
  'Diabetologist', 'ENT Specialist', 'Ophthalmologist', 'Dentist',
];

export default function DoctorRegister() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    registrationNumber: '',
    specialization: '',
    hospital: '',
    experience: '',
    phone: '',
  });

  const updateForm = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.specialization) {
      toast.error('Please select a specialization');
      return;
    }
    setSubmitting(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName, role: 'doctor' } },
      });
      if (authError) throw authError;

      if (authData.user) {
        // 2. Add doctor role
        const { error: roleError } = await supabase.from('user_roles').insert([{
          user_id: authData.user.id,
          role: 'doctor' as const,
        }]);
        // Ignore if already exists (trigger creates patient role)

        // 3. Create doctor profile
        const { error: profileError } = await supabase.from('doctor_profiles').insert([{
          user_id: authData.user.id,
          full_name: form.fullName,
          email: form.email,
          specialization: form.specialization,
          hospital_name: form.hospital,
          experience_years: parseInt(form.experience) || 0,
          registration_number: form.registrationNumber,
          phone: form.phone,
          consultation_fee: 500,
        }]);
        if (profileError) throw profileError;
      }

      toast.success('Registration successful! Please verify your email.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/login')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
        </Button>

        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Register as Doctor</h1>
            <p className="text-sm text-muted-foreground mt-1">Create your doctor profile on RxVision</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input className="mt-1" required value={form.fullName} onChange={e => updateForm('fullName', e.target.value)} placeholder="Dr. Full Name" />
              </div>
              <div>
                <Label>MCI Registration Number *</Label>
                <Input className="mt-1" required value={form.registrationNumber} onChange={e => updateForm('registrationNumber', e.target.value)} placeholder="MCI-XXXXX" />
              </div>
            </div>

            <div>
              <Label>Specialization *</Label>
              <Select value={form.specialization} onValueChange={v => updateForm('specialization', v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  {specializations.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Hospital/Clinic *</Label>
                <Input className="mt-1" required value={form.hospital} onChange={e => updateForm('hospital', e.target.value)} placeholder="Hospital name" />
              </div>
              <div>
                <Label>Years of Experience *</Label>
                <Input type="number" className="mt-1" required value={form.experience} onChange={e => updateForm('experience', e.target.value)} placeholder="e.g. 10" />
              </div>
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input className="mt-1" value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>

            <div>
              <Label>Email *</Label>
              <Input type="email" className="mt-1" required value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="doctor@email.com" />
            </div>

            <div>
              <Label>Password *</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Stethoscope className="w-4 h-4 mr-2" />}
              Register as Doctor
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
