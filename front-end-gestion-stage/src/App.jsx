import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "@/layouts";
import LandingPage from "./pages/LandingPage";
import { SignIn, SignUp } from "./pages/auth";
import StudentDashboard from "./pages/student/StudentDashboard";
import EnterpriseDashboard from "./pages/entreprise/EnterpriseDashboard";
import OffersList from "./pages/entreprise/OffersList";
import OffersCatalog from "./pages/student/OffersCatalog";
import OfferDetails from "./pages/student/OfferDetails";
import PublishOffer from "./pages/entreprise/PublishOffer";
import MyApplications from "./pages/student/MyApplications";
import Offertable from "./pages/entreprise/offerstable";
import ReceivedApplications from "./pages/entreprise/ReceivedApplications";
import InterviewsHistoryPage from "./pages/entreprise/InterviewsHistoryPage";
import EspaceEntreprise from "./pages/entreprise/EspaceEntreprise";
import ManagerDashboard from "./pages/entreprise/ManagerDashboard";
import AdminDashboard from "./pages/Admindashboard";
import Manager from "./pages/entreprise/CreateManager";
import EncadrantDashboard from "./pages/entreprise/Encadrantdashboard";
import StudentProfile from "./pages/student/Studentprofile";
import EnterpriseProfile from "./pages/entreprise/Enterpriseprofile";
import EnterpriseLogin from "./pages/entreprise/EnterpriseLogin";




function App() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Dashboard routes */}
      <Route path="/dashboard/*" element={<Dashboard />} />
       <Route path="/student" element={<StudentDashboard />} />
      <Route path="/enterprise" element={<EnterpriseDashboard />} />
      <Route path="/enterprise/offers" element={<OffersList />} />
      <Route path="/enterprise/publish" element={<PublishOffer />} />
      <Route path="/enterprise/offersliste" element={<Offertable/>} />
      <Route path="/enterprise/condidateurliste" element={<ReceivedApplications/>} />
      <Route path="/enterprise/enterview" element={<InterviewsHistoryPage/>} />
      <Route path="/enterprise/login" element={<EspaceEntreprise/>} />
      <Route path="/enterprise/manager" element={<ManagerDashboard/>} />
      <Route path="/enterprise/addmanager" element={<Manager/>} />
      <Route path="/enterprise/encadrant" element={<EncadrantDashboard/>} />
      <Route path="/enterprise/profile" element={<EnterpriseProfile/>} />
      <Route path="/enterpris/login" element={<EnterpriseLogin/>} />

      
      

       <Route path="/student/offers" element={<OffersCatalog />} />
       <Route path="/student/applications" element={<MyApplications />} />
       <Route path="/student/offersdetails" element={<OfferDetails />} /> 
        <Route path="/student/profile" element={<StudentProfile />} /> 


      {/* Auth routes */}
      <Route path="/auth/*" element={<Auth />} />
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard/home" replace />} />

      <Route path="/admin" element={<AdminDashboard/>} />
    </Routes>

    
  );
}

export default App;