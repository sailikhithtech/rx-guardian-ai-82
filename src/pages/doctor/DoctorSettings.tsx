import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('profile');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('doctor_profiles').select('*').eq('user_id', user?.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState<any>({});

  const updateForm = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('doctor_profiles')
        .update({
          full_name: form.full_name || profile?.full_name,
          specialization: form.specialization || profile?.specialization,
          hospital_name: form.hospital_name || profile?.hospital_name,
          about: form.about || profile?.about,
          consultation_fee: form.consultation_fee || profile?.consultation_fee,
          video_fee: form.video_fee || profile?.video_fee,
          phone: form.phone || profile?.phone,
          address: form.address || profile?.address,
        })
        .eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
      toast.success('Profile updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input className="mt-1" defaultValue={profile?.full_name} onChange={e => updateForm('full_name', e.target.value)} />
                </div>
                <div>
                  <Label>Specialization</Label>
                  <Input className="mt-1" defaultValue={profile?.specialization} onChange={e => updateForm('specialization', e.target.value)} />
                </div>
                <div>
                  <Label>Hospital/Clinic</Label>
                  <Input className="mt-1" defaultValue={profile?.hospital_name} onChange={e => updateForm('hospital_name', e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1" defaultValue={profile?.phone || ''} onChange={e => updateForm('phone', e.target.value)} />
                </div>
                <div>
                  <Label>In-Person Fee (₹)</Label>
                  <Input type="number" className="mt-1" defaultValue={profile?.consultation_fee} onChange={e => updateForm('consultation_fee', parseInt(e.target.value))} />
                </div>
                <div>
                  <Label>Video Fee (₹)</Label>
                  <Input type="number" className="mt-1" defaultValue={profile?.video_fee || ''} onChange={e => updateForm('video_fee', parseInt(e.target.value))} />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input className="mt-1" defaultValue={profile?.address || ''} onChange={e => updateForm('address', e.target.value)} />
              </div>
              <div>
                <Label>About</Label>
                <Textarea className="mt-1" rows={4} defaultValue={profile?.about || ''} onChange={e => updateForm('about', e.target.value)} />
              </div>
              <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
                <Save className="w-4 h-4 mr-1" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS.map((day, i) => (
                <div key={day} className="flex flex-col md:flex-row md:items-center gap-4 p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <Switch defaultChecked={i !== 0} />
                    <span className="font-medium text-sm">{day}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Input type="time" defaultValue="09:00" className="w-32" />
                    <span className="text-muted-foreground">to</span>
                    <Input type="time" defaultValue="18:00" className="w-32" />
                  </div>
                </div>
              ))}
              <Button><Save className="w-4 h-4 mr-1" /> Save Schedule</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
