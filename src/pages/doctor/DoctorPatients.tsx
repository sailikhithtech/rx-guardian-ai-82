import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, Search, ArrowLeft, Calendar, Activity, FileText, Pill, Heart } from 'lucide-react';
import { format } from 'date-fns';

interface PatientSummary {
  user_id: string;
  totalVisits: number;
  lastVisit: string;
  appointments: any[];
}

export default function DoctorPatients() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState('appointments');

  const { data: profile } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('doctor_profiles').select('*').eq('user_id', user?.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Get all appointments for this doctor to derive patient list
  const { data: appointments = [] } = useQuery({
    queryKey: ['doctor-patient-appointments', profile?.id],
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

  // Derive unique patients from appointments
  const patients: PatientSummary[] = (() => {
    const map = new Map<string, PatientSummary>();
    appointments.forEach((apt: any) => {
      if (!map.has(apt.user_id)) {
        map.set(apt.user_id, { user_id: apt.user_id, totalVisits: 0, lastVisit: apt.appointment_date, appointments: [] });
      }
      const p = map.get(apt.user_id)!;
      p.totalVisits++;
      p.appointments.push(apt);
      if (apt.appointment_date > p.lastVisit) p.lastVisit = apt.appointment_date;
    });
    return Array.from(map.values());
  })();

  // Get vitals for selected patient
  const { data: patientVitals = [] } = useQuery({
    queryKey: ['doctor-patient-vitals', selectedPatient],
    queryFn: async () => {
      const { data } = await supabase
        .from('health_vitals')
        .select('*')
        .eq('user_id', selectedPatient!)
        .order('recorded_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!selectedPatient,
  });

  // Get documents for selected patient
  const { data: patientDocs = [] } = useQuery({
    queryKey: ['doctor-patient-docs', selectedPatient],
    queryFn: async () => {
      const { data } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('user_id', selectedPatient!)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!selectedPatient,
  });

  // Get consultations for selected patient
  const { data: patientConsultations = [] } = useQuery({
    queryKey: ['doctor-patient-consultations', selectedPatient],
    queryFn: async () => {
      const { data } = await supabase
        .from('consultations')
        .select('*')
        .eq('user_id', selectedPatient!)
        .order('consultation_date', { ascending: false });
      return data || [];
    },
    enabled: !!selectedPatient,
  });

  const selectedPatientData = patients.find(p => p.user_id === selectedPatient);
  const selectedAppts = selectedPatientData?.appointments || [];

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'MMM dd, yyyy'); } catch { return d; }
  };

  // Patient detail view
  if (selectedPatient && selectedPatientData) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Button variant="ghost" className="gap-2 mb-2" onClick={() => setSelectedPatient(null)}>
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </Button>

        {/* Patient header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">P</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Patient</h2>
                <p className="text-sm text-muted-foreground">ID: {selectedPatient.slice(0, 8)}...</p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{selectedPatientData.totalVisits}</p>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{formatDate(selectedPatientData.lastVisit)}</p>
                  <p className="text-xs text-muted-foreground">Last Visit</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={detailTab} onValueChange={setDetailTab}>
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="appointments" className="gap-1"><Calendar className="w-3.5 h-3.5" /> Visits</TabsTrigger>
            <TabsTrigger value="vitals" className="gap-1"><Activity className="w-3.5 h-3.5" /> Vitals</TabsTrigger>
            <TabsTrigger value="documents" className="gap-1"><FileText className="w-3.5 h-3.5" /> Docs</TabsTrigger>
            <TabsTrigger value="consultations" className="gap-1"><Pill className="w-3.5 h-3.5" /> History</TabsTrigger>
          </TabsList>

          {/* Appointments tab */}
          <TabsContent value="appointments" className="mt-6 space-y-3">
            {selectedAppts.length === 0 ? (
              <Card className="text-center py-8"><CardContent><p className="text-muted-foreground">No visits found</p></CardContent></Card>
            ) : selectedAppts.map((apt: any) => (
              <Card key={apt.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{formatDate(apt.appointment_date)}</p>
                        <Badge variant="secondary" className="text-xs">{apt.appointment_time}</Badge>
                        <Badge variant={apt.status === 'completed' ? 'default' : 'outline'} className="text-xs">{apt.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{apt.reason || 'General consultation'}</p>
                      {apt.notes && <p className="text-xs text-muted-foreground mt-1 italic">Notes: {apt.notes}</p>}
                    </div>
                    <Badge variant="outline" className="gap-1">
                      {apt.appointment_type === 'video' ? 'Video' : 'In-Person'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Vitals tab */}
          <TabsContent value="vitals" className="mt-6">
            {patientVitals.length === 0 ? (
              <Card className="text-center py-8"><CardContent>
                <Heart className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground">No vitals recorded</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {patientVitals.map((v: any) => (
                  <Card key={v.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">{v.vital_type.replace(/_/g, ' ')}</p>
                          <p className="text-2xl font-bold text-primary">
                            {v.value}{v.secondary_value ? `/${v.secondary_value}` : ''} <span className="text-sm font-normal text-muted-foreground">{v.unit}</span>
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(v.recorded_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents tab */}
          <TabsContent value="documents" className="mt-6">
            {patientDocs.length === 0 ? (
              <Card className="text-center py-8"><CardContent>
                <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground">No documents uploaded</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {patientDocs.map((doc: any) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs capitalize">{doc.category}</Badge>
                          {doc.document_date && <span className="text-xs text-muted-foreground">{formatDate(doc.document_date)}</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">View</a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Consultations tab */}
          <TabsContent value="consultations" className="mt-6">
            {patientConsultations.length === 0 ? (
              <Card className="text-center py-8"><CardContent>
                <Pill className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground">No consultation history</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {patientConsultations.map((c: any) => (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{formatDate(c.consultation_date)}</p>
                        <Badge variant="secondary">{c.specialization}</Badge>
                      </div>
                      {c.diagnosis && <p className="text-sm"><span className="font-medium">Diagnosis:</span> {c.diagnosis}</p>}
                      {c.reason && <p className="text-sm text-muted-foreground mt-1">Reason: {c.reason}</p>}
                      {c.prescribed_medicines?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.prescribed_medicines.map((m: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                          ))}
                        </div>
                      )}
                      {c.notes && <p className="text-xs text-muted-foreground mt-2 italic">{c.notes}</p>}
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

  // Patient list view
  const filteredPatients = searchQuery.trim()
    ? patients.filter(p => p.user_id.toLowerCase().includes(searchQuery.toLowerCase()))
    : patients;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">My Patients</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search patients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No patients yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Patient records will appear here after consultations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <Card key={patient.user_id} className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelectedPatient(patient.user_id); setDetailTab('appointments'); }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-11 h-11">
                    <AvatarFallback className="bg-primary/10 text-primary">P</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">Patient</p>
                    <p className="text-xs text-muted-foreground truncate">ID: {patient.user_id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{patient.totalVisits} visit{patient.totalVisits !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Last: {formatDate(patient.lastVisit)}</span>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-3">View Full Profile</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
