import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Video, User, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DoctorAppointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [declineDialog, setDeclineDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [declineReason, setDeclineReason] = useState('');
  const [notesDialog, setNotesDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [notes, setNotes] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('doctor_profiles').select('*').eq('user_id', user?.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctor-all-appointments', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', profile!.id)
        .order('appointment_date', { ascending: false });
      return data || [];
    },
    enabled: !!profile,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notesText }: { id: string; status: string; notesText?: string }) => {
      const update: any = { status };
      if (notesText) update.notes = notesText;
      const { error } = await supabase.from('appointments').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-all-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-today-appointments'] });
      const msgs: Record<string, string> = {
        confirmed: 'Appointment accepted',
        cancelled: 'Appointment declined',
        completed: 'Appointment completed',
      };
      toast.success(msgs[vars.status] || 'Updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleAccept = (id: string) => updateStatus.mutate({ id, status: 'confirmed' });
  const handleDecline = () => {
    if (declineDialog.id) {
      updateStatus.mutate({ id: declineDialog.id, status: 'cancelled', notesText: declineReason || 'Declined by doctor' });
      setDeclineDialog({ open: false, id: null });
      setDeclineReason('');
    }
  };
  const handleComplete = () => {
    if (notesDialog.id) {
      updateStatus.mutate({ id: notesDialog.id, status: 'completed', notesText: notes });
      setNotesDialog({ open: false, id: null });
      setNotes('');
    }
  };

  const filtered = appointments.filter((a: any) => {
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'confirmed') return a.status === 'confirmed';
    if (activeTab === 'completed') return a.status === 'completed';
    if (activeTab === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'MMM dd, yyyy'); } catch { return d; }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Appointments</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="pending" className="gap-1">
            Pending
            {appointments.filter((a: any) => a.status === 'pending').length > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 justify-center bg-amber-500 text-white text-[10px]">
                {appointments.filter((a: any) => a.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <Card className="text-center py-12"><CardContent><p className="text-muted-foreground">Loading...</p></CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No {activeTab} appointments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((apt: any) => (
                <Card key={apt.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className={`w-1.5 ${
                        apt.status === 'pending' ? 'bg-amber-500' :
                        apt.status === 'confirmed' ? 'bg-emerald-500' :
                        apt.status === 'completed' ? 'bg-blue-500' : 'bg-destructive'
                      }`} />
                      <div className="flex-1 p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10 mt-0.5">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">P</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">Patient Appointment</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{apt.reason || 'General consultation'}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="secondary" className="gap-1 text-xs">
                                  <Calendar className="w-3 h-3" /> {formatDate(apt.appointment_date)}
                                </Badge>
                                <Badge variant="secondary" className="gap-1 text-xs">
                                  <Clock className="w-3 h-3" /> {apt.appointment_time}
                                </Badge>
                                <Badge variant="outline" className="gap-1 text-xs">
                                  {apt.appointment_type === 'video' ? <Video className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                  {apt.appointment_type === 'video' ? 'Video' : 'In-Person'}
                                </Badge>
                                {apt.fee > 0 && (
                                  <Badge variant="secondary" className="text-xs">₹{apt.fee}</Badge>
                                )}
                              </div>
                              {apt.notes && (
                                <p className="text-xs text-muted-foreground mt-2 italic">Notes: {apt.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                            {activeTab === 'pending' && (
                              <>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                                  onClick={() => handleAccept(apt.id)} disabled={updateStatus.isPending}>
                                  <CheckCircle className="w-3.5 h-3.5" /> Accept
                                </Button>
                                <Button size="sm" variant="destructive" className="gap-1"
                                  onClick={() => setDeclineDialog({ open: true, id: apt.id })}>
                                  <XCircle className="w-3.5 h-3.5" /> Decline
                                </Button>
                              </>
                            )}
                            {activeTab === 'confirmed' && (
                              <>
                                {apt.appointment_type === 'video' && (
                                  <Button size="sm" className="gap-1">
                                    <Video className="w-3.5 h-3.5" /> Start Call
                                  </Button>
                                )}
                                <Button size="sm" variant="secondary" className="gap-1"
                                  onClick={() => { setNotesDialog({ open: true, id: apt.id }); setNotes(apt.notes || ''); }}>
                                  <CheckCircle className="w-3.5 h-3.5" /> Complete
                                </Button>
                              </>
                            )}
                            {activeTab === 'completed' && (
                              <Button size="sm" variant="outline" className="gap-1">
                                <MessageSquare className="w-3.5 h-3.5" /> View Summary
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Decline Dialog */}
      <Dialog open={declineDialog.open} onOpenChange={(o) => setDeclineDialog({ open: o, id: o ? declineDialog.id : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Appointment</DialogTitle>
            <DialogDescription>Provide a reason for declining this appointment. The patient will be notified.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for declining (optional)..." value={declineReason} onChange={e => setDeclineReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialog({ open: false, id: null })}>Cancel</Button>
            <Button variant="destructive" onClick={handleDecline} disabled={updateStatus.isPending}>Decline Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={notesDialog.open} onOpenChange={(o) => setNotesDialog({ open: o, id: o ? notesDialog.id : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
            <DialogDescription>Add consultation notes before marking as completed.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Diagnosis, prescribed medicines, follow-up notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={5} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialog({ open: false, id: null })}>Cancel</Button>
            <Button onClick={handleComplete} disabled={updateStatus.isPending} className="bg-emerald-600 hover:bg-emerald-700">Mark Completed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
