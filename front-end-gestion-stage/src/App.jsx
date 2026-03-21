import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "@/layouts";
import LandingPage from "./pages/LandingPage";
import { SignIn, SignUp } from "./pages/auth";

// Lazy loading pour réduire le temps de chargement initial
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const EnterpriseDashboard = lazy(() => import("./pages/entreprise/EnterpriseDashboard"));
const OffersList = lazy(() => import("./pages/entreprise/OffersList"));
const OffersCatalog = lazy(() => import("./pages/student/OffersCatalog"));
const OfferDetails = lazy(() => import("./pages/student/OfferDetails"));
const PublishOffer = lazy(() => import("./pages/entreprise/PublishOffer"));
const MyApplications = lazy(() => import("./pages/student/MyApplications"));
const Offertable = lazy(() => import("./pages/entreprise/offerstable"));
const ReceivedApplications = lazy(() => import("./pages/entreprise/ReceivedApplications"));
const InterviewsHistoryPage = lazy(() => import("./pages/entreprise/InterviewsHistoryPage"));
const EspaceEntreprise = lazy(() => import("./pages/entreprise/EspaceEntreprise"));
const ManagerDashboard = lazy(() => import("./pages/entreprise/ManagerDashboard"));
const AdminDashboard = lazy(() => import("./pages/Admindashboard"));
const Manager = lazy(() => import("./pages/entreprise/CreateManager"));
const EncadrantDashboard = lazy(() => import("./pages/entreprise/Encadrantdashboard"));
const StudentProfile = lazy(() => import("./pages/student/Studentprofile"));
const EnterpriseProfile = lazy(() => import("./pages/entreprise/Enterpriseprofile"));
const EnterpriseLogin = lazy(() => import("./pages/entreprise/EnterpriseLogin"));




function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}

export default App;