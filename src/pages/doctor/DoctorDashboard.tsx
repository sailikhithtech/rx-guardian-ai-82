import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, Users, Star, Settings, ClipboardList, BarChart3, Video, User, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['doctor-today-appointments', user?.id],
    queryFn: async () => {
      if (!profile) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', profile.id)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const stats = [
    { icon: Calendar, label: "Today's Appointments", value: todayAppointments.length, color: 'text-primary' },
    { icon: Clock, label: 'Pending Requests', value: todayAppointments.filter((a: any) => a.status === 'pending').length, color: 'text-amber-500' },
    { icon: Users, label: 'Total Patients', value: 0, color: 'text-blue-500' },
    { icon: Star, label: 'Average Rating', value: profile?.rating || '—', color: 'text-amber-500' },
  ];

  const quickActions = [
    { icon: Settings, label: 'Set Availability', path: '/doctor/settings' },
    { icon: Calendar, label: 'View All Appointments', path: '/doctor/appointments' },
    { icon: Users, label: 'Patient Records', path: '/doctor/patients' },
    { icon: BarChart3, label: 'Earnings Report', path: '/doctor/analytics' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-emerald-500/10 text-emerald-600 border-0">Confirmed</Badge>;
      case 'pending': return <Badge className="bg-amber-500/10 text-amber-600 border-0">Pending</Badge>;
      case 'completed': return <Badge className="bg-blue-500/10 text-blue-600 border-0">Completed</Badge>;
      case 'in_progress': return <Badge className="bg-primary/10 text-primary border-0">In Progress</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {greeting()}, Dr. {profile?.full_name?.split(' ')[0] || 'Doctor'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Today's Schedule</h2>
          {todayAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No appointments scheduled for today</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt: any) => (
                <Card key={apt.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-1 bg-primary" />
                      <div className="flex-1 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-sm font-bold text-primary">{apt.appointment_time}</p>
                          </div>
                          <div>
                            <p className="font-medium">{apt.doctor_name || 'Patient'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {apt.appointment_type === 'video' ? (
                                <Badge variant="secondary" className="text-xs gap-1"><Video className="w-3 h-3" /> Video</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs gap-1"><User className="w-3 h-3" /> In-Person</Badge>
                              )}
                              {getStatusBadge(apt.status)}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(action => (
              <Card key={action.label} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(action.path)}>
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium">{action.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
