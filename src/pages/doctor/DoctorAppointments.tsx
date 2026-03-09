import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Video, User } from 'lucide-react';

export default function DoctorAppointments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');

  const { data: profile } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('doctor_profiles').select('*').eq('user_id', user?.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['doctor-all-appointments', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('appointments').select('*').order('appointment_date', { ascending: false });
      return data || [];
    },
    enabled: !!profile,
  });

  const filtered = appointments.filter((a: any) => {
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'confirmed') return a.status === 'confirmed';
    if (activeTab === 'completed') return a.status === 'completed';
    if (activeTab === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Appointments</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filtered.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No {activeTab} appointments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((apt: any) => (
                <Card key={apt.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">Patient Appointment</p>
                        <p className="text-sm text-muted-foreground">{apt.reason || 'General consultation'}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Badge variant="secondary" className="gap-1">
                            <Calendar className="w-3 h-3" /> {apt.appointment_date}
                          </Badge>
                          <Badge variant="secondary">{apt.appointment_time}</Badge>
                          <Badge variant="outline" className="gap-1">
                            {apt.appointment_type === 'video' ? <Video className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            {apt.appointment_type === 'video' ? 'Video' : 'In-Person'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {activeTab === 'pending' && (
                          <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Accept</Button>
                            <Button size="sm" variant="destructive">Decline</Button>
                          </>
                        )}
                        {activeTab === 'confirmed' && (
                          <>
                            <Button size="sm" variant="outline">View Details</Button>
                            {apt.appointment_type === 'video' && (
                              <Button size="sm">Start Video Call</Button>
                            )}
                            <Button size="sm" variant="secondary">Complete</Button>
                          </>
                        )}
                        {activeTab === 'completed' && (
                          <Button size="sm" variant="outline">View Summary</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
