import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Plus, Trash2, Download, ArrowLeft, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const emptyMedicine = (): Medicine => ({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([emptyMedicine()]);

  const { data: profile } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('doctor_profiles').select('*').eq('user_id', user?.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Get patients from appointments
  const { data: patients = [] } = useQuery({
    queryKey: ['doctor-rx-patients', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('user_id')
        .eq('doctor_id', profile!.id);
      const unique = [...new Set((data || []).map((a: any) => a.user_id))];
      return unique.map(id => ({ user_id: id, label: `Patient ${(id as string).slice(0, 8)}...` }));
    },
    enabled: !!profile,
  });

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['doctor-prescriptions', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('doctor_prescriptions')
        .select('*')
        .eq('doctor_id', profile!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile,
  });

  const createPrescription = useMutation({
    mutationFn: async () => {
      const validMeds = medicines.filter(m => m.name.trim());
      if (!selectedPatient || validMeds.length === 0) throw new Error('Select a patient and add at least one medicine');
      const { error } = await supabase.from('doctor_prescriptions').insert({
        doctor_id: profile!.id,
        patient_id: selectedPatient,
        diagnosis,
        medicines: validMeds as any,
        notes,
        follow_up_date: followUp || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions'] });
      toast.success('Prescription issued successfully');
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setDiagnosis('');
    setNotes('');
    setFollowUp('');
    setSelectedPatient('');
    setMedicines([emptyMedicine()]);
  };

  const updateMedicine = (idx: number, field: keyof Medicine, value: string) => {
    setMedicines(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const generatePDF = (rx: any) => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, w, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('RxVision', 15, 18);
    doc.setFontSize(10);
    doc.text('Digital Prescription', 15, 26);

    // Doctor info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Dr. ${profile?.full_name || 'Doctor'}`, 15, 48);
    doc.setFontSize(9);
    doc.text(`${profile?.specialization || ''} | Reg: ${profile?.registration_number || ''}`, 15, 55);
    doc.text(`${profile?.hospital_name || ''}`, 15, 61);

    // Date and patient
    doc.setFontSize(9);
    doc.text(`Date: ${format(new Date(rx.created_at), 'dd MMM yyyy')}`, w - 60, 48);
    doc.text(`Patient ID: ${(rx.patient_id as string).slice(0, 8)}...`, w - 60, 55);

    doc.setDrawColor(200, 200, 200);
    doc.line(15, 68, w - 15, 68);

    // Diagnosis
    let y = 78;
    if (rx.diagnosis) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnosis:', 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(rx.diagnosis, 50, y);
      y += 12;
    }

    // Medicines
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Rx', 15, y);
    y += 8;
    doc.setFont('helvetica', 'normal');

    const meds = (rx.medicines || []) as Medicine[];
    meds.forEach((m, i) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${m.name}`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      y += 6;
      const details = [m.dosage, m.frequency, m.duration].filter(Boolean).join(' | ');
      if (details) { doc.text(details, 25, y); y += 5; }
      if (m.instructions) { doc.text(`Instructions: ${m.instructions}`, 25, y); y += 5; }
      y += 4;
    });

    // Notes & follow-up
    if (rx.notes) {
      y += 4;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(rx.notes, 35, y);
      y += 8;
    }

    if (rx.follow_up_date) {
      doc.setFontSize(9);
      doc.text(`Follow-up: ${format(new Date(rx.follow_up_date), 'dd MMM yyyy')}`, 15, y);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Generated by RxVision – Digital Healthcare Platform', 15, 285);

    doc.save(`prescription-${rx.id.slice(0, 8)}.pdf`);
  };

  // Form view
  if (showForm) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" className="gap-2" onClick={resetForm}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">New Prescription</h1>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <Label>Patient</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select patient..." /></SelectTrigger>
                <SelectContent>
                  {patients.map((p: any) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Diagnosis</Label>
              <Input className="mt-1" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g. Viral fever, Upper respiratory infection" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Medicines</Label>
                <Button size="sm" variant="outline" onClick={() => setMedicines(prev => [...prev, emptyMedicine()])}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Medicine
                </Button>
              </div>

              {medicines.map((med, idx) => (
                <Card key={idx} className="border-dashed">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Medicine {idx + 1}</Badge>
                      {medicines.length > 1 && (
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => setMedicines(prev => prev.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Medicine Name</Label>
                        <Input className="mt-1" value={med.name} onChange={e => updateMedicine(idx, 'name', e.target.value)} placeholder="e.g. Paracetamol 500mg" />
                      </div>
                      <div>
                        <Label className="text-xs">Dosage</Label>
                        <Input className="mt-1" value={med.dosage} onChange={e => updateMedicine(idx, 'dosage', e.target.value)} placeholder="e.g. 1 tablet" />
                      </div>
                      <div>
                        <Label className="text-xs">Frequency</Label>
                        <Input className="mt-1" value={med.frequency} onChange={e => updateMedicine(idx, 'frequency', e.target.value)} placeholder="e.g. 3 times a day" />
                      </div>
                      <div>
                        <Label className="text-xs">Duration</Label>
                        <Input className="mt-1" value={med.duration} onChange={e => updateMedicine(idx, 'duration', e.target.value)} placeholder="e.g. 5 days" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Special Instructions</Label>
                      <Input className="mt-1" value={med.instructions} onChange={e => updateMedicine(idx, 'instructions', e.target.value)} placeholder="e.g. After meals" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Label>Additional Notes</Label>
              <Textarea className="mt-1" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes for the patient..." />
            </div>

            <div>
              <Label>Follow-up Date</Label>
              <Input type="date" className="mt-1 max-w-xs" value={followUp} onChange={e => setFollowUp(e.target.value)} />
            </div>

            <Button className="w-full md:w-auto" onClick={() => createPrescription.mutate()} disabled={createPrescription.isPending}>
              <ClipboardList className="w-4 h-4 mr-1" /> Issue Prescription
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Prescriptions</h1>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> New Prescription</Button>
      </div>

      {isLoading ? (
        <Card className="text-center py-12"><CardContent><p className="text-muted-foreground">Loading...</p></CardContent></Card>
      ) : prescriptions.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No prescriptions issued yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Write your first digital prescription</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Create Prescription</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx: any) => {
            const meds = (rx.medicines || []) as Medicine[];
            return (
              <Card key={rx.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">Patient {(rx.patient_id as string).slice(0, 8)}...</p>
                        <Badge variant="secondary" className="text-xs">
                          {format(new Date(rx.created_at), 'dd MMM yyyy')}
                        </Badge>
                      </div>
                      {rx.diagnosis && <p className="text-sm text-muted-foreground">Diagnosis: {rx.diagnosis}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {meds.map((m, i) => (
                          <Badge key={i} variant="outline" className="text-xs gap-1">
                            <Pill className="w-3 h-3" /> {m.name}
                          </Badge>
                        ))}
                      </div>
                      {rx.follow_up_date && (
                        <p className="text-xs text-muted-foreground mt-2">Follow-up: {format(new Date(rx.follow_up_date), 'dd MMM yyyy')}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => generatePDF(rx)}>
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
