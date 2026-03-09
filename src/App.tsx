import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DoctorProtectedRoute from "@/components/DoctorProtectedRoute";
import AppLayout from "@/components/AppLayout";
import DoctorLayout from "@/components/DoctorLayout";
import Dashboard from "@/pages/Dashboard";
import PrescriptionAnalyzer from "@/pages/PrescriptionAnalyzer";
import DrugInteractions from "@/pages/DrugInteractions";
import Alternatives from "@/pages/Alternatives";
import RxBot from "@/pages/RxBot";
import Reminders from "@/pages/Reminders";
import PillIdentifier from "@/pages/PillIdentifier";
import PrescriptionHistory from "@/pages/PrescriptionHistory";
import PatientProfile from "@/pages/PatientProfile";
import AdherenceAnalytics from "@/pages/AdherenceAnalytics";
import Appointments from "@/pages/Appointments";
import DoctorProfile from "@/pages/DoctorProfile";
import MyDoctor from "@/pages/MyDoctor";
import Login from "@/pages/Login";
import NearbyPharmacies from "@/pages/NearbyPharmacies";
import NotFound from "@/pages/NotFound";
// Doctor Portal
import DoctorRegister from "@/pages/doctor/DoctorRegister";
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorAppointments from "@/pages/doctor/DoctorAppointments";
import DoctorPatients from "@/pages/doctor/DoctorPatients";
import DoctorPrescriptions from "@/pages/doctor/DoctorPrescriptions";
import DoctorAnalytics from "@/pages/doctor/DoctorAnalytics";
import DoctorSettings from "@/pages/doctor/DoctorSettings";

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const DoctorProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <DoctorProtectedRoute>
    <DoctorLayout>{children}</DoctorLayout>
  </DoctorProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/doctor/register" element={<DoctorRegister />} />

            {/* Patient Portal */}
            <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/analyze" element={<ProtectedLayout><PrescriptionAnalyzer /></ProtectedLayout>} />
            <Route path="/interactions" element={<ProtectedLayout><DrugInteractions /></ProtectedLayout>} />
            <Route path="/alternatives" element={<ProtectedLayout><Alternatives /></ProtectedLayout>} />
            <Route path="/rxbot" element={<ProtectedLayout><RxBot /></ProtectedLayout>} />
            <Route path="/reminders" element={<ProtectedLayout><Reminders /></ProtectedLayout>} />
            <Route path="/appointments" element={<ProtectedLayout><Appointments /></ProtectedLayout>} />
            <Route path="/appointments/doctor/:doctorId" element={<ProtectedLayout><DoctorProfile /></ProtectedLayout>} />
            <Route path="/my-doctor" element={<ProtectedLayout><MyDoctor /></ProtectedLayout>} />
            <Route path="/pill-id" element={<ProtectedLayout><PillIdentifier /></ProtectedLayout>} />
            <Route path="/pharmacies" element={<ProtectedLayout><NearbyPharmacies /></ProtectedLayout>} />
            <Route path="/history" element={<ProtectedLayout><PrescriptionHistory /></ProtectedLayout>} />
            <Route path="/profile" element={<ProtectedLayout><PatientProfile /></ProtectedLayout>} />
            <Route path="/analytics" element={<ProtectedLayout><AdherenceAnalytics /></ProtectedLayout>} />

            {/* Doctor Portal */}
            <Route path="/doctor/dashboard" element={<DoctorProtectedLayout><DoctorDashboard /></DoctorProtectedLayout>} />
            <Route path="/doctor/appointments" element={<DoctorProtectedLayout><DoctorAppointments /></DoctorProtectedLayout>} />
            <Route path="/doctor/patients" element={<DoctorProtectedLayout><DoctorPatients /></DoctorProtectedLayout>} />
            <Route path="/doctor/prescriptions" element={<DoctorProtectedLayout><DoctorPrescriptions /></DoctorProtectedLayout>} />
            <Route path="/doctor/analytics" element={<DoctorProtectedLayout><DoctorAnalytics /></DoctorProtectedLayout>} />
            <Route path="/doctor/settings" element={<DoctorProtectedLayout><DoctorSettings /></DoctorProtectedLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
