import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Stethoscope, Calendar, Clock, MapPin, Star, Plus, Trash2, Download, Upload, FileText, 
  Activity, Heart, Thermometer, Droplets, Wind, Scale, TrendingUp, TrendingDown, Share2,
  QrCode, Mail, MessageCircle, UserPlus, ChevronRight, Eye, X
} from 'lucide-react';
import { doctors } from '@/data/doctors';

// Vitals config
const vitalTypes = [
  { key: 'blood_pressure', label: 'Blood Pressure', icon: Activity, unit: 'mmHg', hasSecondary: true, normalRange: '90-120 / 60-80' },
  { key: 'blood_sugar', label: 'Blood Sugar', icon: Droplets, unit: 'mg/dL', hasSecondary: true, normalRange: 'Fasting: 70-100' },
  { key: 'weight', label: 'Weight', icon: Scale, unit: 'kg', hasSecondary: false, normalRange: 'BMI 18.5-24.9' },
  { key: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°F', hasSecondary: false, normalRange: '97.8-99.1°F' },
  { key: 'oxygen', label: 'Oxygen (SpO2)', icon: Wind, unit: '%', hasSecondary: false, normalRange: '95-100%' },
  { key: 'heart_rate', label: 'Heart Rate', icon: Heart, unit: 'bpm', hasSecondary: false, normalRange: '60-100 bpm' },
];

export default function MyDoctor() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('doctors');
  const [docCategory, setDocCategory] = useState('all');
  const [addVitalOpen, setAddVitalOpen] = useState(false);
  const [selectedVitalType, setSelectedVitalType] = useState('');
  const [vitalValue, setVitalValue] = useState('');
  const [vitalSecondary, setVitalSecondary] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  // Fetch saved doctors
  const { data: savedDoctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['saved-doctors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('saved_doctors').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch upcoming appointments
  const { data: upcomingAppointments = [] } = useQuery({
    queryKey: ['upcoming-appointments'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', today)
        .eq('status', 'confirmed')
        .order('appointment_date', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch consultations
  const { data: consultations = [] } = useQuery({
    queryKey: ['consultations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('consultations').select('*').order('consultation_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ['medical-documents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('medical_documents').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch vitals
  const { data: vitals = [] } = useQuery({
    queryKey: ['health-vitals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('health_vitals').select('*').order('recorded_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Remove saved doctor
  const removeSavedDoctor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_doctors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-doctors'] });
      toast.success('Doctor removed');
    },
  });

  // Add vital
  const addVital = useMutation({
    mutationFn: async (data: { vital_type: string; value: number; secondary_value?: number; unit: string }) => {
      const { error } = await supabase.from('health_vitals').insert([{ ...data, user_id: user?.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-vitals'] });
      toast.success('Vital recorded');
      setAddVitalOpen(false);
      setVitalValue('');
      setVitalSecondary('');
    },
  });

  const handleAddVital = () => {
    if (!selectedVitalType || !vitalValue) return;
    const config = vitalTypes.find(v => v.key === selectedVitalType);
    addVital.mutate({
      vital_type: selectedVitalType,
      value: parseFloat(vitalValue),
      secondary_value: vitalSecondary ? parseFloat(vitalSecondary) : undefined,
      unit: config?.unit || '',
    });
  };

  // Get latest vital for each type
  const getLatestVital = (type: string) => {
    return vitals.find((v: any) => v.vital_type === type);
  };

  // Get vitals trend (last 7)
  const getVitalsTrend = (type: string) => {
    return vitals.filter((v: any) => v.vital_type === type).slice(0, 7).reverse();
  };

  // Generate health summary PDF
  const generateHealthSummary = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(13, 148, 136);
    doc.text('Health Summary Report', 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 28);

    let y = 45;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Current Vitals', 20, y);
    y += 10;
    doc.setFontSize(10);

    vitalTypes.forEach(vt => {
      const latest = getLatestVital(vt.key);
      if (latest) {
        const value = vt.hasSecondary && (latest as any).secondary_value
          ? `${(latest as any).value}/${(latest as any).secondary_value} ${vt.unit}`
          : `${(latest as any).value} ${vt.unit}`;
        doc.text(`${vt.label}: ${value}`, 25, y);
        y += 7;
      }
    });

    y += 10;
    doc.setFontSize(14);
    doc.text('Recent Consultations', 20, y);
    y += 10;
    doc.setFontSize(10);

    consultations.slice(0, 5).forEach((c: any) => {
      doc.text(`• ${c.consultation_date} - Dr. ${c.doctor_name} (${c.specialization})`, 25, y);
      y += 6;
      if (c.diagnosis) {
        doc.text(`  Diagnosis: ${c.diagnosis}`, 30, y);
        y += 6;
      }
    });

    doc.save('health-summary.pdf');
    toast.success('Health summary downloaded');
  };

  const filteredDocs = docCategory === 'all' ? documents : documents.filter((d: any) => d.category === docCategory);
  const nextAppointment = upcomingAppointments[0];

  const getDaysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">My Doctor</h1>
          <p className="text-muted-foreground mt-1">Manage your doctors, consultations, and health records</p>
        </div>
        <Button onClick={generateHealthSummary} variant="outline" className="gap-2">
          <Share2 className="w-4 h-4" /> Share Health Summary
        </Button>
      </div>

      {/* Upcoming Appointment Banner */}
      {nextAppointment && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 md:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Appointment</p>
                <p className="font-semibold text-lg">Dr. {nextAppointment.doctor_name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{nextAppointment.appointment_date} at {nextAppointment.appointment_time}</span>
                  <Badge variant="secondary" className="ml-2">{getDaysUntil(nextAppointment.appointment_date)}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/appointments')}>View Details</Button>
              <Button size="sm" onClick={() => navigate('/appointments')}>Reschedule</Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 max-w-3xl">
          <TabsTrigger value="doctors" className="text-xs md:text-sm">My Doctors</TabsTrigger>
          <TabsTrigger value="history" className="text-xs md:text-sm">History</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs md:text-sm">Documents</TabsTrigger>
          <TabsTrigger value="vitals" className="text-xs md:text-sm">Vitals</TabsTrigger>
          <TabsTrigger value="summary" className="text-xs md:text-sm">Summary</TabsTrigger>
          <TabsTrigger value="second-opinion" className="text-xs md:text-sm">2nd Opinion</TabsTrigger>
        </TabsList>

        {/* My Doctors Tab */}
        <TabsContent value="doctors" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Saved Doctors</h2>
            <Button size="sm" onClick={() => navigate('/appointments')}>
              <Plus className="w-4 h-4 mr-1" /> Add Doctor
            </Button>
          </div>

          {savedDoctors.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No saved doctors yet</p>
                <Button className="mt-4" onClick={() => navigate('/appointments')}>Find Doctors</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedDoctors.map((doc: any) => (
                <Card key={doc.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={doc.image} />
                        <AvatarFallback>{doc.doctor_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">Dr. {doc.doctor_name}</h3>
                        <p className="text-sm text-primary">{doc.specialization}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.hospital}</p>
                        {doc.last_visited && (
                          <p className="text-xs text-muted-foreground mt-1">Last visit: {doc.last_visited}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="flex-1" onClick={() => navigate(`/appointments?book=${doc.doctor_id}`)}>
                        Book Again
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeSavedDoctor.mutate(doc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Consultation History Tab */}
        <TabsContent value="history" className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Consultation History</h2>
          
          {consultations.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No consultation history yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {consultations.map((c: any, index: number) => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        {index < consultations.length - 1 && <div className="w-0.5 h-full bg-border mt-1" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">Dr. {c.doctor_name}</h3>
                            <p className="text-sm text-primary">{c.specialization}</p>
                          </div>
                          <Badge variant="outline">{c.consultation_date}</Badge>
                        </div>
                        {c.reason && <p className="text-sm text-muted-foreground mt-2">Reason: {c.reason}</p>}
                        {c.diagnosis && <p className="text-sm mt-1"><span className="font-medium">Diagnosis:</span> {c.diagnosis}</p>}
                        {c.prescribed_medicines?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {c.prescribed_medicines.map((med: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{med}</Badge>
                            ))}
                          </div>
                        )}
                        <Button size="sm" variant="ghost" className="mt-2 -ml-2 text-xs">
                          <Download className="w-3 h-3 mr-1" /> Download Summary
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Medical Documents Vault</h2>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Upload className="w-4 h-4 mr-1" /> Upload Document</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Medical Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>File</Label>
                    <Input type="file" className="mt-1" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select defaultValue="others">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lab_reports">Lab Reports</SelectItem>
                        <SelectItem value="prescriptions">Prescriptions</SelectItem>
                        <SelectItem value="scans">Scans</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Doctor Name (Optional)</Label>
                    <Input className="mt-1" placeholder="Dr. Name" />
                  </div>
                  <div>
                    <Label>Description (Optional)</Label>
                    <Textarea className="mt-1" placeholder="Brief description" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={() => { setUploadOpen(false); toast.success('Document uploaded'); }}>Upload</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'lab_reports', 'prescriptions', 'scans', 'others'].map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={docCategory === cat ? 'default' : 'outline'}
                onClick={() => setDocCategory(cat)}
                className="whitespace-nowrap"
              >
                {cat === 'all' ? 'All' : cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            ))}
          </div>

          {filteredDocs.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No documents yet</p>
                <Button className="mt-4" onClick={() => setUploadOpen(true)}>
                  <Upload className="w-4 h-4 mr-1" /> Upload Your First Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc: any) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{doc.file_name}</h4>
                        <p className="text-xs text-muted-foreground">{doc.document_date || doc.created_at?.split('T')[0]}</p>
                        {doc.doctor_name && <p className="text-xs text-primary">Dr. {doc.doctor_name}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-3 h-3 mr-1" /> Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Vitals Tab */}
        <TabsContent value="vitals" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Health Vitals Tracker</h2>
            <Dialog open={addVitalOpen} onOpenChange={setAddVitalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Reading</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Vital Reading</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Vital Type</Label>
                    <Select value={selectedVitalType} onValueChange={setSelectedVitalType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select vital type" />
                      </SelectTrigger>
                      <SelectContent>
                        {vitalTypes.map(vt => (
                          <SelectItem key={vt.key} value={vt.key}>{vt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{vitalTypes.find(v => v.key === selectedVitalType)?.hasSecondary ? 'Systolic / Fasting' : 'Value'}</Label>
                      <Input
                        type="number"
                        className="mt-1"
                        value={vitalValue}
                        onChange={(e) => setVitalValue(e.target.value)}
                        placeholder="Enter value"
                      />
                    </div>
                    {vitalTypes.find(v => v.key === selectedVitalType)?.hasSecondary && (
                      <div>
                        <Label>Diastolic / Post-meal</Label>
                        <Input
                          type="number"
                          className="mt-1"
                          value={vitalSecondary}
                          onChange={(e) => setVitalSecondary(e.target.value)}
                          placeholder="Enter value"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleAddVital} disabled={!selectedVitalType || !vitalValue}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vitalTypes.map(vt => {
              const latest = getLatestVital(vt.key) as any;
              const trend = getVitalsTrend(vt.key);
              const Icon = vt.icon;

              return (
                <Card key={vt.key}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{vt.label}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => { setSelectedVitalType(vt.key); setAddVitalOpen(true); }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {latest ? (
                      <>
                        <div className="text-2xl font-bold">
                          {vt.hasSecondary && latest.secondary_value
                            ? `${latest.value}/${latest.secondary_value}`
                            : latest.value}
                          <span className="text-sm font-normal text-muted-foreground ml-1">{vt.unit}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last updated: {new Date(latest.recorded_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-primary mt-1">Normal: {vt.normalRange}</p>

                        {/* Mini trend chart */}
                        {trend.length > 1 && (
                          <div className="flex items-end gap-1 h-8 mt-3">
                            {trend.map((v: any, i: number) => (
                              <div
                                key={v.id}
                                className="flex-1 bg-primary/20 rounded-t"
                                style={{ height: `${Math.min(100, (v.value / (trend[0]?.value || 1)) * 100)}%` }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No readings yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button variant="outline" className="w-full" onClick={generateHealthSummary}>
            <Share2 className="w-4 h-4 mr-2" /> Share Vitals with Doctor
          </Button>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Share Health Summary</h2>
          
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Generate Complete Health Report</h3>
                <p className="text-muted-foreground mt-1">
                  Includes vitals, consultations, medications, and more
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-auto py-4 flex-col gap-2" onClick={generateHealthSummary}>
                  <Download className="w-6 h-6" />
                  <span>Download PDF</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <MessageCircle className="w-6 h-6" />
                  <span>Share via WhatsApp</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Mail className="w-6 h-6" />
                  <span>Send via Email</span>
                </Button>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4 text-center">Or share via QR Code</h4>
                <div className="w-40 h-40 mx-auto bg-muted rounded-xl flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-muted-foreground" />
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Doctor can scan to view your health summary
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Second Opinion Tab */}
        <TabsContent value="second-opinion" className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Get a Second Opinion</h2>

          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Consult Another Specialist</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Upload your current prescription and get an expert second opinion
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Select Specialization</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose specialist type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiologist">Cardiologist</SelectItem>
                      <SelectItem value="neurologist">Neurologist</SelectItem>
                      <SelectItem value="oncologist">Oncologist</SelectItem>
                      <SelectItem value="orthopedic">Orthopedic</SelectItem>
                      <SelectItem value="gastro">Gastroenterologist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Upload Current Prescription</Label>
                  <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
                  </div>
                </div>

                <div>
                  <Label>Describe Your Concern</Label>
                  <Textarea
                    className="mt-1"
                    placeholder="Briefly describe why you're seeking a second opinion..."
                    rows={4}
                  />
                </div>

                <Button className="w-full" onClick={() => navigate('/appointments')}>
                  Find Specialist for Second Opinion
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
