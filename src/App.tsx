import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
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
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const LayoutRoute = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<LayoutRoute><Dashboard /></LayoutRoute>} />
          <Route path="/analyze" element={<LayoutRoute><PrescriptionAnalyzer /></LayoutRoute>} />
          <Route path="/interactions" element={<LayoutRoute><DrugInteractions /></LayoutRoute>} />
          <Route path="/alternatives" element={<LayoutRoute><Alternatives /></LayoutRoute>} />
          <Route path="/rxbot" element={<LayoutRoute><RxBot /></LayoutRoute>} />
          <Route path="/reminders" element={<LayoutRoute><Reminders /></LayoutRoute>} />
          <Route path="/pill-id" element={<LayoutRoute><PillIdentifier /></LayoutRoute>} />
          <Route path="/history" element={<LayoutRoute><PrescriptionHistory /></LayoutRoute>} />
          <Route path="/profile" element={<LayoutRoute><PatientProfile /></LayoutRoute>} />
          <Route path="/analytics" element={<LayoutRoute><AdherenceAnalytics /></LayoutRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
