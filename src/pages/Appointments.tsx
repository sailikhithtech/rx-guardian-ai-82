import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, MapPin, Video, User, Star, Clock, Filter, CheckCircle, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { doctors, Doctor } from '@/data/doctors';

export default function Appointments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingData, setBookingData] = useState<any>({});

  // Handle ?book=doctorId from profile page
  useEffect(() => {
    const bookId = searchParams.get('book');
    if (bookId) {
      const doc = doctors.find(d => d.id === bookId);
      if (doc) {
        setSelectedDoctor(doc);
        setBookingData({ doctor: doc });
        setBookingStep(1);
        setActiveTab('book');
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: myAppointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createAppointment = useMutation({
    mutationFn: async (appointmentData: any) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          user_id: user?.id,
          doctor_id: appointmentData.doctor.id,
          doctor_name: appointmentData.doctor.name,
          specialization: appointmentData.doctor.specialization,
          hospital: appointmentData.doctor.hospital,
          appointment_type: appointmentData.type,
          payment_method: appointmentData.paymentMethod,
          appointment_date: appointmentData.date,
          appointment_time: appointmentData.time,
          status: 'confirmed',
          reason: appointmentData.reason,
          notes: appointmentData.notes,
          fee: appointmentData.doctor.fee
        }]);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setBookingStep(5);
    },
    onError: (error) => {
      toast.error('Failed to book appointment: ' + error.message);
    }
  });

  const specializations = ['all', ...Array.from(new Set(doctors.map(d => d.specialization)))];

  const filteredDoctors = doctors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = selectedSpecialization === 'all' || d.specialization === selectedSpecialization;
    return matchesSearch && matchesSpec;
  });

  const handleBookNow = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setBookingData({ doctor });
    setBookingStep(1);
    setActiveTab('book');
  };

  const cancelBooking = () => {
    setBookingStep(0);
    setSelectedDoctor(null);
    setBookingData({});
    setActiveTab('find');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">{t('appointments.status.confirmed')}</Badge>;
      case 'pending': return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">{t('appointments.status.pending')}</Badge>;
      case 'cancelled': return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">{t('appointments.status.cancelled')}</Badge>;
      case 'completed': return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">{t('appointments.status.completed')}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {t('appointments.title')}
          </h1>
          <p className="text-muted-foreground mt-1">Book and manage your doctor consultations</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="find">{t('appointments.findDoctors')}</TabsTrigger>
          <TabsTrigger value="book" disabled={bookingStep === 0}>{t('appointments.booking.confirmPay')}</TabsTrigger>
          <TabsTrigger value="my">{t('appointments.myAppointments')}</TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-6 mt-6">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('appointments.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="py-2 px-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              >
                {specializations.map(spec => (
                  <option key={spec} value={spec}>
                    {spec === 'all' ? t('appointments.filters.all') : spec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctor Cards Grid */}
          {filteredDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map(doctor => (
                <Card key={doctor.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-5 flex gap-4">
                      <img src={doctor.image} alt={doctor.name} className="w-20 h-20 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">Dr. {doctor.name}</h3>
                        <p className="text-primary text-sm font-medium">{doctor.specialization}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{doctor.hospital}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span className="font-medium">{doctor.rating}</span>
                            <span>({doctor.reviewsCount})</span>
                          </div>
                          <div className="text-muted-foreground">{t('appointments.doctorCard.experience', { years: doctor.experience })}</div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-border bg-muted/20 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{t('appointments.doctorCard.fee', { amount: doctor.fee })}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 font-medium">
                            {doctor.availability === 'today' ? t('appointments.doctorCard.availableToday') : t('appointments.doctorCard.nextAvailable', { day: doctor.availability === 'tomorrow' ? 'Tomorrow' : 'Day After' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleBookNow(doctor)}>{t('appointments.doctorCard.viewProfile')}</Button>
                        <Button size="sm" onClick={() => handleBookNow(doctor)}>{t('appointments.doctorCard.bookNow')}</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {t('appointments.empty.noDoctors')}
            </div>
          )}
        </TabsContent>

        <TabsContent value="book" className="mt-6">
          {bookingStep > 0 && selectedDoctor && (
            <div className="max-w-2xl mx-auto">
              <Button variant="ghost" size="sm" className="mb-4" onClick={cancelBooking}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('common.back')}
              </Button>
              
              <Card>
                <CardContent className="p-6">
                  {/* Step 1: Type */}
                  {bookingStep === 1 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">{t('appointments.booking.selectType')}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-colors text-center flex flex-col items-center gap-2 ${bookingData.type === 'in-person' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                          onClick={() => setBookingData({ ...bookingData, type: 'in-person' })}
                        >
                          <User className={`w-8 h-8 ${bookingData.type === 'in-person' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="font-medium">{t('appointments.booking.inPersonVisit')}</div>
                        </div>
                        <div 
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-colors text-center flex flex-col items-center gap-2 ${bookingData.type === 'video' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                          onClick={() => setBookingData({ ...bookingData, type: 'video' })}
                        >
                          <Video className={`w-8 h-8 ${bookingData.type === 'video' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="font-medium">{t('appointments.booking.videoConsultation')}</div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button disabled={!bookingData.type} onClick={() => setBookingStep(2)}>
                          {t('common.next')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Date & Time */}
                  {bookingStep === 2 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">{t('appointments.booking.selectDate')} & Time</h3>
                      <div className="space-y-4">
                        <input type="date" 
                          className="w-full py-2 px-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingData.date || ''}
                          onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                        />
                        
                        {bookingData.date && (
                          <div className="space-y-2 pt-4">
                            <h4 className="text-sm font-medium">{t('appointments.booking.selectTime')}</h4>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                              {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map(time => (
                                <div 
                                  key={time}
                                  className={`border rounded-lg p-2 text-center text-sm cursor-pointer transition-colors ${bookingData.time === time ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}
                                  onClick={() => setBookingData({ ...bookingData, time })}
                                >
                                  {time}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setBookingStep(1)}>{t('common.back')}</Button>
                        <Button disabled={!bookingData.date || !bookingData.time} onClick={() => setBookingStep(3)}>
                          {t('common.next')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Details */}
                  {bookingStep === 3 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">{t('appointments.booking.patientDetails')}</h3>
                      <div>
                        <label className="text-sm font-medium">{t('appointments.booking.reasonForVisit')}</label>
                        <textarea 
                          className="w-full mt-1 py-2 px-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24"
                          value={bookingData.reason || ''}
                          onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t('appointments.booking.allergies')}</label>
                        <textarea 
                          className="w-full mt-1 py-2 px-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-16"
                          value={bookingData.notes || ''}
                          onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-between mt-6">
                        <Button variant="outline" onClick={() => setBookingStep(2)}>{t('common.back')}</Button>
                        <Button onClick={() => setBookingStep(4)}>
                          {t('common.next')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Confirm */}
                  {bookingStep === 4 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">{t('appointments.booking.appointmentSummary')}</h3>
                      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between font-medium">
                          <span>Doctor</span>
                          <span>Dr. {selectedDoctor.name} ({selectedDoctor.specialization})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type</span>
                          <span>{bookingData.type === 'video' ? 'Video Consultation' : 'In-Person Visit'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date & Time</span>
                          <span>{bookingData.date} at {bookingData.time}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 font-semibold">
                          <span>Fee</span>
                          <span>₹{selectedDoctor.fee}</span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <h4 className="text-sm font-medium">{t('appointments.booking.paymentOptions')}</h4>
                        <div 
                          className={`border rounded-xl p-3 cursor-pointer flex items-center gap-3 ${bookingData.paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border'}`}
                          onClick={() => setBookingData({ ...bookingData, paymentMethod: 'online' })}
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${bookingData.paymentMethod === 'online' ? 'border-primary' : 'border-muted-foreground'}`}>
                            {bookingData.paymentMethod === 'online' && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <span>{t('appointments.booking.payOnline')}</span>
                        </div>
                        <div 
                          className={`border rounded-xl p-3 cursor-pointer flex items-center gap-3 ${bookingData.paymentMethod === 'clinic' ? 'border-primary bg-primary/5' : 'border-border'}`}
                          onClick={() => setBookingData({ ...bookingData, paymentMethod: 'clinic' })}
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${bookingData.paymentMethod === 'clinic' ? 'border-primary' : 'border-muted-foreground'}`}>
                            {bookingData.paymentMethod === 'clinic' && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <span>{t('appointments.booking.payAtClinic')}</span>
                        </div>
                      </div>

                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setBookingStep(3)}>{t('common.back')}</Button>
                        <Button 
                          disabled={!bookingData.paymentMethod || createAppointment.isPending}
                          onClick={() => createAppointment.mutate(bookingData)}
                        >
                          {createAppointment.isPending ? t('common.loading') : t('appointments.booking.confirmAppointment')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Success */}
                  {bookingStep === 5 && (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold">{t('appointments.confirmation.title')}</h3>
                      <p className="text-muted-foreground pb-4">
                        Your appointment with Dr. {selectedDoctor.name} is confirmed for {bookingData.date} at {bookingData.time}.
                      </p>
                      <div className="flex justify-center gap-4">
                        <Button onClick={() => { setActiveTab('my'); cancelBooking(); }}>
                          {t('appointments.confirmation.viewMyAppointments')}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-6 space-y-4">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="w-full max-w-[400px]">
              <TabsTrigger value="upcoming" className="flex-1">{t('appointments.tabs.upcoming')}</TabsTrigger>
              <TabsTrigger value="past" className="flex-1">{t('appointments.tabs.past')}</TabsTrigger>
              <TabsTrigger value="cancelled" className="flex-1">{t('appointments.tabs.cancelled')}</TabsTrigger>
            </TabsList>

            {['upcoming', 'past', 'cancelled'].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-6 space-y-4">
                {isLoadingAppointments ? (
                  <div className="text-center py-10 text-muted-foreground">{t('common.loading')}</div>
                ) : myAppointments.length > 0 ? (
                  // Simple filtering simulation for dummy purposes
                  myAppointments
                    .filter((app: any) => tab === 'cancelled' ? app.status === 'cancelled' : (tab === 'upcoming' ? app.status !== 'cancelled' : false))
                    .map((appointment: any) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                              {appointment.appointment_type === 'video' ? <Video className="w-6 h-6" /> : <User className="w-6 h-6" />}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">Dr. {appointment.doctor_name}</h4>
                              <p className="text-sm text-muted-foreground">{appointment.specialization}</p>
                            </div>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-3 rounded-lg mb-4">
                          <div>
                            <span className="text-muted-foreground block mb-1">Date & Time</span>
                            <span className="font-medium">{appointment.appointment_date} at {appointment.appointment_time}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">Type</span>
                            <span className="font-medium flex items-center gap-1">
                              {appointment.appointment_type === 'video' ? 'Video Call' : 'In-Person'}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          {tab === 'upcoming' && (
                            <>
                              <Button variant="outline" size="sm">{t('appointments.actions.cancel')}</Button>
                              <Button variant="outline" size="sm">{t('appointments.actions.reschedule')}</Button>
                              {appointment.appointment_type === 'video' && (
                                <Button size="sm">{t('appointments.actions.joinVideo')}</Button>
                              )}
                            </>
                          )}
                          {tab === 'past' && (
                            <>
                              <Button variant="outline" size="sm">{t('appointments.actions.writeReview')}</Button>
                              <Button size="sm">{t('appointments.actions.bookAgain')}</Button>
                            </>
                          )}
                          {tab === 'cancelled' && (
                            <Button size="sm">{t('appointments.actions.rebook')}</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    {t('appointments.empty.noAppointments')}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}