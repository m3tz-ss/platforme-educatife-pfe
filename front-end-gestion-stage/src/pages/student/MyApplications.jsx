import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Button,
  Progress,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Tabs,
  TabsHeader,
  Tab,
} from "@material-tailwind/react";
import {
  HomeIcon,
  BriefcaseIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon as ClockOutline,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // ✅ Fetch candidatures
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/my-applications");
      // Handle both array and paginated { data: [] }
      setApplications(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Erreur chargement candidatures", err);
      setErrorMessage("Erreur lors du chargement des candidatures");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch entretiens
  const fetchInterviews = async (applicationId) => {
    try {
      setLoadingInterviews(true);
      const res = await api.get(`/student/applications/${applicationId}/interviews`);
      setInterviews(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Erreur chargement entretiens:", err);
      setInterviews([]);
    } finally {
      setLoadingInterviews(false);
    }
  };

  // ✅ Retirer candidature
  const handleWithdrawApplication = async (appId) => {
    const result = await Swal.fire({
      title: "Retirer la candidature ?",
      text: "Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, retirer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/applications/${appId}`);
      setApplications(applications.filter((app) => app.id !== appId));
      setOpenModal(false);
      Swal.fire({
        icon: "success",
        title: "Candidature retirée",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: err.response?.data?.message || "Erreur lors du retrait",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  // ✅ Contacter entreprise
  const handleContactEnterprise = async (appId) => {
    try {
      await api.post(`/applications/${appId}/contact`, {});
      Swal.fire({
        icon: "success",
        title: "Message envoyé",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: err.response?.data?.message || "Erreur envoi message",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  // ✅ Statut mapping (FR → EN)
  const statusMap = {
    nouveau: "pending",
    preselectionnee: "reviewing",
    entretien: "interview",
    acceptee: "accepted",
    refusee: "rejected",
  };

  const normalizeStatus = (status) => statusMap[status] || status;

  const statusColor = (status) => {
    switch (normalizeStatus(status)) {
      case "accepted":  return "green";
      case "rejected":  return "red";
      case "interview": return "purple";
      case "reviewing": return "amber";
      default:          return "orange";
    }
  };

  const statusLabel = (status) => {
    switch (normalizeStatus(status)) {
      case "accepted":  return "✅ Accepté";
      case "rejected":  return "❌ Rejeté";
      case "interview": return "📞 Entretien planifié";
      case "reviewing": return "👀 Présélectionnée";
      default:          return "⏳ En attente";
    }
  };

  const getStatusMessage = (status) => {
    switch (normalizeStatus(status)) {
      case "accepted":
        return {
          icon: "🎉", title: "Félicitations!",
          message: "Votre candidature a été acceptée. L'entreprise vous contactera bientôt.",
          bgColor: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700",
        };
      case "rejected":
        return {
          icon: "😔", title: "Candidature refusée",
          message: "Malheureusement, votre candidature n'a pas été retenue. Ne baissez pas les bras!",
          bgColor: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-700",
        };
      case "interview":
        return {
          icon: "📞", title: "Entretien planifié",
          message: "L'entreprise souhaite vous rencontrer. Vérifiez vos messages pour plus de détails.",
          bgColor: "bg-purple-50", borderColor: "border-purple-200", textColor: "text-purple-700",
        };
      case "reviewing":
        return {
          icon: "👀", title: "Présélectionnée",
          message: "Votre candidature a plu à l'entreprise! Vous êtes en cours d'examen.",
          bgColor: "bg-amber-50", borderColor: "border-amber-200", textColor: "text-amber-700",
        };
      default:
        return {
          icon: "⏳", title: "En cours d'examen",
          message: "Votre candidature est en cours d'examen par l'entreprise.",
          bgColor: "bg-orange-50", borderColor: "border-orange-200", textColor: "text-orange-700",
        };
    }
  };

  // ✅ Compteurs
  const acceptedCount  = applications.filter((a) => normalizeStatus(a.status) === "accepted").length;
  const rejectedCount  = applications.filter((a) => normalizeStatus(a.status) === "rejected").length;
  const interviewCount = applications.filter((a) => normalizeStatus(a.status) === "interview").length;
  const reviewingCount = applications.filter((a) => normalizeStatus(a.status) === "reviewing").length;
  const pendingCount   = applications.filter((a) => normalizeStatus(a.status) === "pending").length;

  const menuItems = [
    { icon: HomeIcon,         label: "Tableau de bord",   path: "/student",              badge: null },
    { icon: BriefcaseIcon,    label: "Offres de stage",   path: "/student/offers",       badge: null },
    { icon: CheckCircleIcon,  label: "Mes candidatures",  path: "/student/applications", badge: applications.length },
    { icon: BookmarkIcon,     label: "Offres sauvegardées", path: "/student/saved",      badge: null },
    { icon: ChatBubbleLeftIcon, label: "Messages",        path: "/student/messages",     badge: null },
    { icon: UserCircleIcon,   label: "Mon profil",        path: "/student/profile",      badge: null },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-6 border-b border-blue-gray-100">
          <Typography variant="h5" className="font-bold text-blue-500">🎓 MyStage</Typography>
          <Typography variant="small" className="text-blue-gray-500">Plateforme de stages</Typography>
        </div>

        <nav className="p-6 space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer">
                  <Icon className="w-5 h-5 text-blue-gray-600 group-hover:text-blue-500" />
                  <span className="text-sm font-medium text-blue-gray-700 group-hover:text-blue-600">{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{item.badge}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mx-6 border-t border-blue-gray-100"></div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <Typography variant="small" className="text-blue-gray-600 mb-1">Votre progression</Typography>
            <Progress value={65} color="blue" className="h-2" />
            <Typography variant="caption" className="text-blue-gray-500 mt-2">65% de profil complet</Typography>
          </div>
          <Button fullWidth color="blue" variant="gradient" size="sm">✉️ Contacter support</Button>
        </div>

        <div className="p-6 border-t border-blue-gray-100">
          <Link to="/auth/sign-in">
            <Button fullWidth color="red" variant="outlined" size="sm" className="flex items-center justify-center gap-2">
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Déconnexion
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-blue-gray-100">
          <div className="px-6 py-4 flex justify-between items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-blue-gray-50 rounded-lg transition-colors">
              {sidebarOpen ? <XMarkIcon className="w-6 h-6 text-blue-gray-600" /> : <Bars3Icon className="w-6 h-6 text-blue-gray-600" />}
            </button>
            <Typography variant="h5" className="font-bold text-blue-gray-900">Mes Candidatures</Typography>
            <div className="flex gap-3">
              <IconButton variant="text" color="blue-gray"><ChatBubbleLeftIcon className="w-5 h-5" /></IconButton>
              <IconButton variant="text" color="blue-gray"><UserCircleIcon className="w-5 h-5" /></IconButton>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">

            {/* ✅ Statistiques */}
            <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {[
                { label: "Total", value: applications.length, color: "text-blue-gray-900", sub: "Soumises", subColor: "text-blue-500" },
                { label: "Acceptées", value: acceptedCount, color: "text-green-500", sub: "✅ Succès", subColor: "text-green-500" },
                { label: "Entretiens", value: interviewCount, color: "text-purple-500", sub: "📞 Planifiés", subColor: "text-purple-500" },
                { label: "En cours", value: pendingCount + reviewingCount, color: "text-orange-500", sub: "⏳ En cours", subColor: "text-orange-500" },
                { label: "Rejetées", value: rejectedCount, color: "text-red-500", sub: "❌ Refusées", subColor: "text-red-500" },
              ].map((stat) => (
                <Card key={stat.label} className="p-4 shadow-sm border border-blue-gray-100 hover:shadow-lg transition">
                  <Typography className="text-blue-gray-500 text-sm">{stat.label}</Typography>
                  <Typography className={`text-2xl font-bold ${stat.color}`}>{stat.value}</Typography>
                  <Typography className={`text-xs font-medium ${stat.subColor}`}>{stat.sub}</Typography>
                </Card>
              ))}
            </div>

            {/* ✅ Liste des candidatures */}
            <Card className="shadow-sm border border-blue-gray-100">
              <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100">
                <div>
                  <Typography variant="h6" color="blue-gray" className="mb-1">Mes candidatures</Typography>
                  <Typography variant="small" className="text-blue-gray-600">
                    <strong>{applications.length} candidature(s)</strong>
                  </Typography>
                </div>
                <Menu placement="left-start">
                  <MenuHandler>
                    <IconButton size="sm" variant="text" color="blue-gray">
                      <EllipsisVerticalIcon strokeWidth={3} className="h-6 w-6" />
                    </IconButton>
                  </MenuHandler>
                  <MenuList>
                    <MenuItem onClick={fetchApplications}>🔄 Actualiser</MenuItem>
                    <MenuItem>Trier par date</MenuItem>
                    <MenuItem>Trier par statut</MenuItem>
                  </MenuList>
                </Menu>
              </CardHeader>

              <CardBody className="p-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mb-3 mx-auto"></div>
                      <Typography className="text-blue-gray-500">Chargement des candidatures...</Typography>
                    </div>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <BriefcaseIcon className="w-16 h-16 mx-auto text-blue-gray-300 mb-4" />
                    <Typography color="blue-gray" className="mb-2">Aucune candidature trouvée</Typography>
                    <Typography variant="small" className="text-blue-gray-500 mb-6">
                      Explorez nos offres et postulez à des stages qui vous intéressent
                    </Typography>
                    <Link to="/student/offers">
                      <Button color="blue" size="sm">🔍 Découvrir les offres</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {applications.map((app) => {
                      const statusMsg = getStatusMessage(app.status);
                      return (
                        <Card
                          key={app.id}
                          className="border border-blue-gray-100 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => {
                            setSelectedApp(app);
                            setOpenModal(true);
                            setActiveTab("info");
                            fetchInterviews(app.id);
                          }}
                        >
                          {/* Barre colorée en haut */}
                          <div className={`h-1 rounded-t-xl bg-gradient-to-r ${
                            statusColor(app.status) === "green"   ? "from-green-500 to-green-600" :
                            statusColor(app.status) === "red"     ? "from-red-500 to-red-600" :
                            statusColor(app.status) === "purple"  ? "from-purple-500 to-purple-600" :
                            statusColor(app.status) === "amber"   ? "from-amber-500 to-amber-600" :
                                                                    "from-orange-500 to-orange-600"
                          }`} />

                          <CardHeader floated={false} shadow={false} className="p-4 border-b border-blue-gray-100">
                            <Typography variant="h6" className="font-bold mb-1">
                              {app.offer?.title || "Offre inconnue"}
                            </Typography>
                            <Typography variant="small" className="text-blue-500 font-medium">
                              {app.offer?.enterprise?.name || "Entreprise"}
                            </Typography>
                          </CardHeader>

                          <CardBody className="space-y-3 p-4">
                            {/* ✅ Infos offre en snake_case */}
                            <div className="flex flex-wrap gap-3 text-sm text-blue-gray-600">
                              <span className="flex items-center gap-1">
                                <MapPinIcon className="w-4 h-4 text-blue-400" />
                                {app.offer?.location || "N/A"}
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockOutline className="w-4 h-4 text-blue-400" />
                                {app.offer?.duration || "N/A"}
                              </span>
                            </div>

                            {/* ✅ Date début et places */}
                            <div className="flex flex-wrap gap-3 text-sm text-blue-gray-600">
                              <span className="flex items-center gap-1">
                                📅 Début : {formatDate(app.offer?.start_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                👥 {app.offer?.available_places
                                  ? `${app.offer.available_places} place(s)`
                                  : "Places N/A"}
                              </span>
                            </div>

                            <div className="border-t border-blue-gray-100"></div>

                            {/* Statut et date candidature */}
                            <div className="flex justify-between items-center">
                              <Chip
                                value={statusLabel(app.status)}
                                color={statusColor(app.status)}
                                size="sm"
                                className="font-semibold"
                              />
                              <Typography variant="small" className="text-blue-gray-500">
                                {formatDate(app.created_at)}
                              </Typography>
                            </div>

                            {/* Message statut */}
                            <div className={`${statusMsg.bgColor} border ${statusMsg.borderColor} rounded-lg p-3`}>
                              <Typography variant="small" className={`${statusMsg.textColor} font-medium`}>
                                {statusMsg.icon} {statusMsg.message}
                              </Typography>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </main>
      </div>

      {/* Modal Détails */}
      <Dialog open={openModal} handler={() => setOpenModal(false)} size="lg">
        <DialogHeader className="flex justify-between items-center border-b border-blue-gray-100">
          <Typography variant="h5" className="font-bold">
            {selectedApp?.offer?.title || "Détails de la candidature"}
          </Typography>
          <IconButton variant="text" color="blue-gray" onClick={() => setOpenModal(false)}>
            <XMarkIcon className="w-6 h-6" />
          </IconButton>
        </DialogHeader>

        <DialogBody divider className="p-0 max-h-[70vh] overflow-y-auto">
          {selectedApp && (
            <Tabs value={activeTab} className="w-full">
              <TabsHeader>
                <Tab value="info" onClick={() => setActiveTab("info")}>💼 Informations</Tab>
                <Tab value="interviews" onClick={() => setActiveTab("interviews")}>
                  📅 Entretiens {interviews.length > 0 && `(${interviews.length})`}
                </Tab>
              </TabsHeader>

              {/* Tab Informations */}
              {activeTab === "info" && (
                <div className="p-6 space-y-6">
                  <div>
                    <Typography variant="h6" className="font-bold text-blue-gray-900 mb-4">💼 Offre de stage</Typography>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Titre",        value: selectedApp.offer?.title },
                        { label: "Entreprise",   value: selectedApp.offer?.enterprise?.name },
                        { label: "Localisation", value: selectedApp.offer?.location },
                        { label: "Durée",        value: selectedApp.offer?.duration },
                        { label: "Date de début", value: formatDate(selectedApp.offer?.start_date) },  // ✅
                        { label: "Places dispo", value: selectedApp.offer?.available_places           // ✅
                            ? `${selectedApp.offer.available_places} place(s)`
                            : "N/A" },
                        { label: "Domaine",      value: selectedApp.offer?.domain },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <Typography variant="small" className="font-bold text-blue-gray-900">{label} :</Typography>
                          <Typography variant="small" className="text-blue-gray-700">{value || "—"}</Typography>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-blue-gray-100"></div>

                  <div>
                    <Typography variant="h6" className="font-bold text-blue-gray-900 mb-4">📋 Statut</Typography>
                    <div className="space-y-3">
                      <div>
                        <Typography variant="small" className="font-bold text-blue-gray-900 mb-2">Statut actuel :</Typography>
                        <Chip value={statusLabel(selectedApp.status)} color={statusColor(selectedApp.status)} size="sm" className="font-semibold" />
                      </div>
                      <div>
                        <Typography variant="small" className="font-bold text-blue-gray-900">Date de candidature :</Typography>
                        <Typography variant="small" className="text-blue-gray-700">{formatDate(selectedApp.created_at)}</Typography>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-blue-gray-100"></div>

                  {/* Message statut */}
                  <div className={`${getStatusMessage(selectedApp.status).bgColor} border ${getStatusMessage(selectedApp.status).borderColor} rounded-lg p-4`}>
                    <Typography variant="small" className={`${getStatusMessage(selectedApp.status).textColor} font-medium`}>
                      {getStatusMessage(selectedApp.status).icon}{" "}
                      <strong>{getStatusMessage(selectedApp.status).title}</strong>
                      <br />
                      {getStatusMessage(selectedApp.status).message}
                    </Typography>
                  </div>
                </div>
              )}

              {/* Tab Entretiens */}
              {activeTab === "interviews" && (
                <div className="p-6">
                  {loadingInterviews ? (
                    <div className="text-center py-8">
                      <ClockIcon className="w-8 h-8 mx-auto text-blue-gray-300 mb-2 animate-spin" />
                      <Typography className="text-blue-gray-500">Chargement des entretiens...</Typography>
                    </div>
                  ) : interviews.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 mx-auto text-blue-gray-300 mb-3" />
                      <Typography className="text-blue-gray-500 mb-2">Aucun entretien planifié</Typography>
                      <Typography variant="small" className="text-blue-gray-400">
                        L'entreprise vous contactera pour fixer un rendez-vous
                      </Typography>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {interviews.map((interview) => (
                        <Card key={interview.id} className="border border-blue-gray-100">
                          <CardBody>
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <Typography variant="h6" className="font-bold text-blue-gray-900 mb-1">
                                  📅 {formatDate(interview.date)}
                                </Typography>
                                <Typography variant="small" className="text-blue-gray-600">
                                  ⏰ {interview.time || "N/A"}
                                </Typography>
                              </div>
                              <Chip
                                value={interview.result || "En attente"}
                                color={
                                  interview.result === "passed" ? "green" :
                                  interview.result === "failed" ? "red" : "amber"
                                }
                                size="sm"
                              />
                            </div>

                            <div className="border-t border-blue-gray-100 pt-3 space-y-2">
                              {interview.location && (
                                <Typography variant="small" className="text-blue-gray-600">
                                  📍 <strong>Lieu :</strong> {interview.location}
                                </Typography>
                              )}
                              {interview.meeting_link && (
                                <Typography variant="small" className="text-blue-gray-600">
                                  🔗 <strong>Lien :</strong>{" "}
                                  <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    {interview.meeting_link}
                                  </a>
                                </Typography>
                              )}
                              {interview.notes && (
                                <Typography variant="small" className="text-blue-gray-600">
                                  📝 <strong>Notes :</strong> {interview.notes}
                                </Typography>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Tabs>
          )}
        </DialogBody>

        <DialogFooter className="space-x-3 border-t border-blue-gray-100">
          <Button variant="outlined" color="blue-gray" onClick={() => setOpenModal(false)}>
            Fermer
          </Button>
          <Button color="blue" variant="outlined" onClick={() => handleContactEnterprise(selectedApp?.id)}>
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            Contacter
          </Button>
          {normalizeStatus(selectedApp?.status) !== "accepted" &&
           normalizeStatus(selectedApp?.status) !== "rejected" && (
            <Button color="red" variant="outlined" onClick={() => handleWithdrawApplication(selectedApp?.id)}>
              Retirer candidature
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}