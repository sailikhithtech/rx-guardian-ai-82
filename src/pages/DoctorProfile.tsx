import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, MapPin, Star, Clock, GraduationCap, Award, Globe, Phone, Heart, Calendar, Video, BadgeCheck } from 'lucide-react';
import { doctors } from '@/data/doctors';

const doctorExtras: Record<string, {
  waitTime: string;
  videoAvailable: boolean;
  specializations: string[];
  workingHours: { days: string; hours: string }[];
  contact: string;
  address: string;
}> = {
  '1': {
    waitTime: '~15 mins', videoAvailable: true,
    specializations: ['Pregnancy Care', 'PCOS', 'Infertility', 'High Risk Pregnancy', 'Laparoscopic Surgery'],
    workingHours: [{ days: 'Mon-Sat', hours: '9:00 AM - 6:00 PM' }, { days: 'Sunday', hours: '10:00 AM - 2:00 PM' }],
    contact: '+91 98765 43210', address: 'Apollo Hospital, Jubilee Hills, Hyderabad - 500033',
  },
  '2': {
    waitTime: '~20 mins', videoAvailable: true,
    specializations: ['Heart Disease', 'Angioplasty', 'Hypertension', 'Heart Failure', 'ECG', 'Preventive Cardiology'],
    workingHours: [{ days: 'Mon-Sat', hours: '10:00 AM - 5:00 PM' }, { days: 'Sunday', hours: 'Closed' }],
    contact: '+91 98765 43211', address: 'KIMS Hospital, Secunderabad, Hyderabad - 500003',
  },
  '3': {
    waitTime: '~10 mins', videoAvailable: true,
    specializations: ['Acne Treatment', 'Hair Loss', 'Skin Allergy', 'Cosmetic Dermatology', 'Vitiligo', 'Laser Treatment'],
    workingHours: [{ days: 'Mon-Fri', hours: '10:00 AM - 7:00 PM' }, { days: 'Saturday', hours: '10:00 AM - 3:00 PM' }],
    contact: '+91 98765 43212', address: 'Yashoda Hospital, Somajiguda, Hyderabad - 500082',
  },
  '4': {
    waitTime: '~10 mins', videoAvailable: true,
    specializations: ['Fever', 'Diabetes', 'Thyroid', 'General Wellness', 'Preventive Healthcare', 'Infections'],
    workingHours: [{ days: 'Mon-Sat', hours: '8:00 AM - 8:00 PM' }, { days: 'Sunday', hours: '9:00 AM - 1:00 PM' }],
    contact: '+91 98765 43213', address: 'Care Hospital, Banjara Hills, Hyderabad - 500034',
  },
  '5': {
    waitTime: '~15 mins', videoAvailable: true,
    specializations: ['Child Health', 'Vaccination', 'Growth Monitoring', 'Newborn Care', 'Childhood Infections'],
    workingHours: [{ days: 'Mon-Sat', hours: '9:00 AM - 6:00 PM' }, { days: 'Sunday', hours: '10:00 AM - 1:00 PM' }],
    contact: '+91 98765 43214', address: 'Rainbow Hospital, Banjara Hills, Hyderabad - 500034',
  },
  '6': {
    waitTime: '~25 mins', videoAvailable: false,
    specializations: ['Joint Replacement', 'Arthroscopy', 'Sports Injuries', 'Fracture Treatment', 'Spine Surgery'],
    workingHours: [{ days: 'Mon-Fri', hours: '10:00 AM - 5:00 PM' }, { days: 'Saturday', hours: '10:00 AM - 2:00 PM' }],
    contact: '+91 98765 43215', address: 'Continental Hospital, Gachibowli, Hyderabad - 500032',
  },
  '7': {
    waitTime: '~20 mins', videoAvailable: true,
    specializations: ['Anxiety', 'Depression', 'Bipolar Disorder', 'OCD', 'Stress Management', 'Counseling'],
    workingHours: [{ days: 'Mon-Sat', hours: '11:00 AM - 7:00 PM' }, { days: 'Sunday', hours: 'By Appointment' }],
    contact: '+91 98765 43216', address: 'Aster Hospital, AS Rao Nagar, Hyderabad - 500062',
  },
  '8': {
    waitTime: '~20 mins', videoAvailable: true,
    specializations: ['Stroke', 'Epilepsy', "Parkinson's Disease", 'Migraine', 'Nerve Disorders', 'Brain Tumors'],
    workingHours: [{ days: 'Mon-Fri', hours: '9:00 AM - 5:00 PM' }, { days: 'Saturday', hours: '9:00 AM - 1:00 PM' }],
    contact: '+91 98765 43217', address: 'Sunshine Hospital, PG Road, Hyderabad - 500003',
  },
};

function getAvailabilitySlots() {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const slots = i === 0 ? Math.floor(Math.random() * 6) + 3 : i === 6 ? 0 : Math.floor(Math.random() * 10) + 1;
    days.push({
      date: d,
      label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      slots,
    });
  }
  return days;
}

export default function DoctorProfile() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [saved, setSaved] = useState(false);

  const doctor = doctors.find(d => d.id === doctorId);
  if (!doctor) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Doctor not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/appointments')}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Doctors
        </Button>
      </div>
    );
  }

  const extras = doctorExtras[doctor.id] || doctorExtras['1'];
  const availabilityDays = getAvailabilitySlots();

  const starBreakdown = [
    { stars: 5, pct: 85 },
    { stars: 4, pct: 10 },
    { stars: 3, pct: 3 },
    { stars: 2, pct: 1 },
    { stars: 1, pct: 1 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6"
    >
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Doctors
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="w-24 h-24 rounded-2xl">
              <AvatarImage src={doctor.image} alt={doctor.name} className="object-cover rounded-2xl" />
              <AvatarFallback className="rounded-2xl text-2xl">{doctor.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dr. {doctor.name}</h1>
              <p className="text-primary font-semibold">{doctor.specialization}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" /> {doctor.hospital}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg text-sm">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="font-semibold">{doctor.rating}</span>
                  <span className="text-xs">({doctor.reviewsCount} reviews)</span>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" /> {doctor.experience} Years Exp.
                </Badge>
              </div>
            </div>
            <div className="flex flex-row md:flex-col gap-2 md:items-end">
              <Button onClick={() => navigate(`/appointments?book=${doctor.id}`)}>
                <Calendar className="w-4 h-4 mr-1" /> Book Appointment
              </Button>
              <Button
                variant="outline"
                onClick={() => setSaved(!saved)}
                className={saved ? 'text-red-500 border-red-200' : ''}
              >
                <Heart className={`w-4 h-4 mr-1 ${saved ? 'fill-red-500' : ''}`} />
                {saved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '💰', label: 'Consultation Fee', value: `₹${doctor.fee}` },
          { icon: '⏱️', label: 'Wait Time', value: extras.waitTime },
          { icon: '🎓', label: 'Experience', value: `${doctor.experience} Years` },
          { icon: '📹', label: 'Video Available', value: extras.videoAvailable ? 'Yes' : 'No' },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="font-bold text-sm mt-0.5">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">About</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{doctor.about}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" /> Education & Qualifications
                </h3>
                <ul className="space-y-1">
                  {doctor.education.map((edu, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span> {edu}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {extras.specializations.map(s => (
                    <Badge key={s} className="bg-primary/10 text-primary hover:bg-primary/20 border-0">{s}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" /> Languages Spoken
                </h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.languages.map(l => (
                    <Badge key={l} variant="secondary">{l}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Hospital Details
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>📍 {extras.address}</p>
                  {extras.workingHours.map((wh, i) => (
                    <p key={i}>🕐 {wh.days}: {wh.hours}</p>
                  ))}
                  <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {extras.contact}</p>
                </div>
              </div>

              {doctor.awards.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" /> Awards & Recognition
                  </h3>
                  <ul className="space-y-1">
                    {doctor.awards.map((a, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-amber-500">🏆</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews" className="space-y-6 mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="text-center md:text-left">
                  <div className="text-5xl font-bold text-foreground">{doctor.rating}</div>
                  <div className="flex items-center justify-center md:justify-start gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(doctor.rating) ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{doctor.reviewsCount} reviews</p>
                </div>
                <div className="flex-1 space-y-2">
                  {starBreakdown.map(row => (
                    <div key={row.stars} className="flex items-center gap-2 text-sm">
                      <span className="w-6 text-right">{row.stars}★</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className="w-10 text-muted-foreground text-xs">{row.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {doctor.reviews.map(review => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{review.name}</span>
                      <Badge variant="outline" className="text-xs gap-1 py-0">
                        <BadgeCheck className="w-3 h-3 text-primary" /> Verified
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">{review.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Availability */}
        <TabsContent value="availability" className="space-y-6 mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Working Hours</h3>
              <div className="space-y-2">
                {extras.workingHours.map((wh, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="font-medium">{wh.days}</span>
                    <span className={`${wh.hours === 'Closed' ? 'text-destructive' : 'text-muted-foreground'}`}>{wh.hours}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Next 7 Days</h3>
              <div className="space-y-2">
                {availabilityDays.map((day, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${day.slots === 0 ? 'bg-muted/50 border-border' : 'border-primary/20 bg-primary/5'}`}>
                    <div>
                      <span className="font-medium text-sm">{day.dayName}, {day.label}</span>
                    </div>
                    <span className={`text-sm font-medium ${day.slots === 0 ? 'text-destructive' : 'text-primary'}`}>
                      {day.slots === 0 ? 'Full' : `${day.slots} slots available`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={() => navigate(`/appointments?book=${doctor.id}`)}>
            <Calendar className="w-4 h-4 mr-2" /> Book Appointment
          </Button>
        </TabsContent>
      </Tabs>

      {/* Mobile sticky button */}
      <div className="fixed bottom-20 left-4 right-4 md:hidden z-40">
        <Button className="w-full shadow-lg" size="lg" onClick={() => navigate(`/appointments?book=${doctor.id}`)}>
          <Calendar className="w-4 h-4 mr-2" /> Book Appointment
        </Button>
      </div>
    </motion.div>
  );
}
