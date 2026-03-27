import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "@/layouts";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import AccessDenied from "./pages/AccessDenied";

// Lazy loading pour réduire le temps de chargement initial
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const EnterpriseDashboard = lazy(() => import("./pages/entreprise/EnterpriseDashboard"));
const OffersList = lazy(() => import("./pages/entreprise/OffersList"));
const OffersCatalog = lazy(() => import("./pages/student/OffersCatalog"));
const OfferDetails = lazy(() => import("./pages/student/OfferDetails"));
const PublishOffer = lazy(() => import("./pages/entreprise/PublishOffer"));
const MyApplications = lazy(() => import("./pages/student/MyApplications"));
const StudentTasksPage = lazy(() => import("./pages/student/StudentTasksPage"));
const Offertable = lazy(() => import("./pages/entreprise/offerstable"));
const ReceivedApplications = lazy(() => import("./pages/entreprise/ReceivedApplications"));
const InterviewsHistoryPage = lazy(() => import("./pages/entreprise/InterviewsHistoryPage"));
const EspaceEntreprise = lazy(() => import("./pages/entreprise/EspaceEntreprise"));
const ManagerDashboard = lazy(() => import("./pages/entreprise/ManagerDashboard"));
const AdminDashboard = lazy(() => import("./pages/Admindashboard"));
const Manager = lazy(() => import("./pages/entreprise/CreateManager"));
const EncadrantDashboard = lazy(() => import("./pages/entreprise/Encadrantdashboard"));
const EncadrantStudentDetail = lazy(() => import("./pages/entreprise/EncadrantStudentDetail"));
const StudentProfile = lazy(() => import("./pages/student/Studentprofile"));
const EnterpriseProfile = lazy(() => import("./pages/entreprise/Enterpriseprofile"));
const EnterpriseLogin = lazy(() => import("./pages/entreprise/EnterpriseLogin"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const SignIn = lazy(() => import("./pages/auth/sign-in"));
const SignUp = lazy(() => import("./pages/auth/sign-up"));





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
        {/* Landing Page - public */}
        <Route path="/" element={<LandingPage />} />

        {/* Accès refusé */}
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* Dashboard routes */}
        <Route path="/dashboard/*" element={<Dashboard />} />

        {/* Routes Étudiant - rôle student uniquement */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/offers" element={<ProtectedRoute allowedRoles={["student"]}><OffersCatalog /></ProtectedRoute>} />
        <Route path="/student/applications" element={<ProtectedRoute allowedRoles={["student"]}><MyApplications /></ProtectedRoute>} />
        <Route path="/student/tasks" element={<ProtectedRoute allowedRoles={["student"]}><StudentTasksPage /></ProtectedRoute>} />
        <Route path="/student/offersdetails" element={<ProtectedRoute allowedRoles={["student"]}><OfferDetails /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute allowedRoles={["student"]}><StudentProfile /></ProtectedRoute>} />

        {/* Connexion entreprise - public */}
        <Route path="/enterprise/login" element={<EspaceEntreprise />} />
        <Route path="/enterpris/login" element={<EnterpriseLogin />} />

        {/* Routes Entreprise - manager, rh, encadrant */}
        <Route path="/enterprise" element={<ProtectedRoute allowedRoles={["manager", "rh", "encadrant", "enterprise"]}><EnterpriseDashboard /></ProtectedRoute>} />
        <Route path="/enterprise/offers" element={<ProtectedRoute allowedRoles={["manager", "rh", "encadrant", "enterprise"]}><OffersList /></ProtectedRoute>} />
        <Route path="/enterprise/publish" element={<ProtectedRoute allowedRoles={["manager", "rh", "encadrant", "enterprise"]}><PublishOffer /></ProtectedRoute>} />
        <Route path="/enterprise/offersliste" element={<ProtectedRoute allowedRoles={["manager", "rh", "encadrant", "enterprise"]}><Offertable /></ProtectedRoute>} />
        <Route path="/enterprise/condidateurliste" element={<ProtectedRoute allowedRoles={["manager", "rh", "encadrant", "enterprise"]}><ReceivedApplications /></ProtectedRoute>} />
        <Route path="/enterprise/enterview" element={<ProtectedRoute allowedRoles={["manager", "rh", "encadrant", "enterprise"]}><InterviewsHistoryPage /></ProtectedRoute>} />
        <Route path="/enterprise/profile" element={<ProtectedRoute allowedRoles={["manager", "rh", "encadrant", "enterprise"]}><EnterpriseProfile /></ProtectedRoute>} />

        {/* Manager uniquement - gestion des utilisateurs internes */}
        <Route path="/enterprise/manager" element={<ProtectedRoute allowedRoles={["manager"]}><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/enterprise/addmanager" element={<ProtectedRoute allowedRoles={["manager"]}><Manager /></ProtectedRoute>} />

        {/* Encadrant uniquement */}
        <Route path="/enterprise/encadrant" element={<ProtectedRoute allowedRoles={["encadrant"]}><EncadrantDashboard /></ProtectedRoute>} />
        <Route path="/enterprise/encadrant/student/:applicationId" element={<ProtectedRoute allowedRoles={["encadrant"]}><EncadrantStudentDetail /></ProtectedRoute>} />

        {/* Admin uniquement */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />

        {/* Auth routes */}
        <Route path="/auth/sign-in" element={<SignIn />} />
        <Route path="/auth/sign-up" element={<SignUp />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;