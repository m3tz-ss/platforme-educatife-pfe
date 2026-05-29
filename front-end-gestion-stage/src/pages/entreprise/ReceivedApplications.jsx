import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import ChatBox from "../../components/ChatBox";
import {
  Button,
  Typography,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Chip,
  Input,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Select,
  Option,
  Progress,
} from "@material-tailwind/react";
import {
  HomeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  EnvelopeIcon,
  CheckCircleIcon as CheckIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  MapPinIcon,
  ClockIcon,
  SparklesIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";
import PlanInterviewModal from "../../components/interviews/PlanInterviewModal";
import InterviewHistoryModal from "../../components/interviews/InterviewHistoryModal";
import CandidateHistoryModal from "../../components/CandidateHistoryModal";
import NotificationBell from "../../components/layout/NotificationBell";
import BaseLayout from "../../components/layout/BaseLayout";
import { EnterpriseSidebarHeader } from "../../components/layout/SidebarHeaders";

export default function ReceivedApplications() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Toutes");
  const [selectedOffer, setSelectedOffer] = useState("Toutes");
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [planAppId, setPlanAppId] = useState(null);
  const [historyAppId, setHistoryAppId] = useState(null);
  const [encadrants, setEncadrants] = useState([]);
  const [userData, setUserData] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const enterpriseRole = localStorage.getItem("entrepriseRole") || user.type || "rh";

  // Manager evaluation state
  const [evaluation, setEvaluation] = useState(null);
  const [evalForm, setEvalForm] = useState({ score: "", final_decision: "pending", notes: "" });
  const [evalLoading, setEvalLoading] = useState(false);

  // Candidate history state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [candidateHistory, setCandidateHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Affectation encadrant - select & loading
  const [selectedEncadrantApp, setSelectedEncadrantApp] = useState(null);
  const [selectedEncadrantId, setSelectedEncadrantId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchEncadrants();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await api.get("/user/profile");
      setUserData(res.data);
    } catch {
      setUserData(user);
    }
  };

  useEffect(() => {
    filterApplications();
  }, [applications, selectedFilter, search, selectedOffer]);

  const uniqueOffers = [
    { id: "Toutes", title: "Toutes les offres" },
    ...Array.from(
      new Map(
        applications
          .filter((app) => app.offer?.id)
          .map((app) => [app.offer.id, { id: String(app.offer.id), title: app.offer.title || `Offre #${app.offer.id}` }])
      ).values()
    ),
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
      });
    } catch { return dateStr; }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/enterprise/applications");
      setApplications(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Erreur chargement candidatures:", err);
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible de charger les candidatures.", confirmButtonColor: "#ef4444" });
    } finally {
      setLoading(false);
    }
  };

  const fetchEncadrants = async () => {
    try {
      const res = await api.get("/encadrants");
      setEncadrants(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Erreur chargement encadrants:", err);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (selectedFilter !== "Toutes") {
      const statusMap = {
        "Nouveau": "nouveau", "Présélectionnée": "preselectionnee",
        "Entretien": "entretien", "Acceptée": "acceptee", "Refusée": "refusee",
        "Terminé": "termine",
      };
      filtered = filtered.filter((app) => app.status === statusMap[selectedFilter]);
    }

    if (selectedOffer !== "Toutes") {
      filtered = filtered.filter((app) => String(app.offer?.id) === selectedOffer);
    }

    if (search) {
      filtered = filtered.filter(
        (app) =>
          app.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
          app.offer?.title?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  };

  const handleStatusChange = async (appId, newStatus) => {
    const app = applications.find((a) => a.id === appId);

    if (newStatus === "acceptee" && app?.offer) {
      const offerId = app.offer.id;
      const availablePlaces = app.offer.available_places || 0;

      const currentlyAccepted = applications.filter(
        (a) => a.offer?.id === offerId && a.status === "acceptee"
      ).length;

      if (currentlyAccepted >= availablePlaces) {
        Swal.fire({
          icon: "warning",
          title: "Quota de places atteint",
          text: `Cette offre ne dispose que de ${availablePlaces} place(s). Vous avez déjà accepté ${currentlyAccepted} candidat(s).`,
          confirmButtonColor: "#f59e0b",
        });
        return;
      }
    }

    try {
      await api.patch(`/applications/${appId}`, { status: newStatus });
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );
      if (selectedApplication?.id === appId) {
        setSelectedApplication((prev) => ({ ...prev, status: newStatus }));
      }
      Swal.fire({
        icon: "success",
        title: "Statut mis à jour !",
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || "";
      const isUnavailable = errorMsg.includes("déjà en cours de stage") || errorMsg.includes("pas disponible");

      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: isUnavailable ? "Ce candidat est déjà en stage" : (errorMsg || "Erreur changement statut."),
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const assignEncadrant = async (applicationId) => {
    if (!selectedEncadrantId) {
      Swal.fire({ icon: "warning", title: "Encadrant requis", text: "Veuillez choisir un encadrant.", confirmButtonColor: "#f59e0b" });
      return;
    }
    try {
      setAssignLoading(true);
      const res = await api.post(`/assign-encadrant/${applicationId}`, { encadrant_id: selectedEncadrantId });
      const updatedApp = res.data.application;

      setSelectedEncadrantId("");
      setSelectedEncadrantApp(null);

      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? updatedApp : app))
      );

      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(updatedApp);
      }

      Swal.fire({ icon: "success", title: "Encadrant affecté !", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible d'affecter l'encadrant.", confirmButtonColor: "#ef4444" });
    } finally {
      setAssignLoading(false);
    }
  };

  const unassignEncadrant = async (applicationId) => {
    const result = await Swal.fire({
      title: "Supprimer l'affectation ?",
      text: "L'encadrant ne sera plus affecté à ce stagiaire.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler"
    });

    if (result.isConfirmed) {
      try {
        setAssignLoading(true);
        const res = await api.delete(`/unassign-encadrant/${applicationId}`);
        const updatedApp = res.data.application;

        setApplications((prev) =>
          prev.map((app) => (app.id === applicationId ? updatedApp : app))
        );

        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(updatedApp);
        }

        Swal.fire({ icon: "success", title: "Affectation supprimée !", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      } catch (err) {
        Swal.fire({ icon: "error", title: "Erreur", text: "Impossible de supprimer l'affectation.", confirmButtonColor: "#ef4444" });
      } finally {
        setAssignLoading(false);
      }
    }
  };

  const fetchEvaluation = async (appId) => {
    try {
      const res = await api.get(`/rh/applications/${appId}/evaluation`);
      const ev = res.data;
      setEvaluation(ev);
      if (ev) {
        setEvalForm({
          score: ev.score != null ? String(ev.score) : "",
          final_decision: ev.final_decision || "pending",
          notes: ev.notes || "",
        });
      } else {
        setEvalForm({ score: "", final_decision: "pending", notes: "" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveEvaluation = async (applicationId) => {
    try {
      setEvalLoading(true);
      const res = await api.put(`/rh/applications/${applicationId}/evaluation`, {
        score: evalForm.score === "" ? null : Number(evalForm.score),
        final_decision: evalForm.final_decision,
        notes: evalForm.notes || null,
      });
      setEvaluation(res.data);
      Swal.fire({ icon: "success", title: "Validation enregistrée", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible d'enregistrer la validation." });
    } finally {
      setEvalLoading(false);
    }
  };

  const handleViewHistory = async (student) => {
    if (!student?.id) return;
    setSelectedStudent(student);
    setOpenHistoryModal(true);
    setHistoryLoading(true);
    setCandidateHistory(null);
    try {
      const res = await api.get(`/rh/candidates/${student.id}/history`);
      setCandidateHistory(res.data);
    } catch (err) {
      console.error("Erreur historique candidat:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de charger l'historique du candidat.",
        confirmButtonColor: "#ef4444",
      });
      setOpenHistoryModal(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getCvUrl = (cvPath) => {
    if (!cvPath) return null;
    if (cvPath.startsWith("http")) return cvPath;
    return `http://127.0.0.1:8000/storage/${cvPath}`;
  };

  const statusConfig = {
    nouveau: { label: "Nouveau", color: "blue", bg: "bg-blue-100 text-blue-700" },
    preselectionnee: { label: "Présélectionnée", color: "amber", bg: "bg-amber-100 text-amber-700" },
    entretien: { label: "Entretien planifié", color: "purple", bg: "bg-purple-100 text-purple-700" },
    acceptee: { label: "Acceptée", color: "green", bg: "bg-green-100 text-green-700" },
    refusee: { label: "Refusée", color: "red", bg: "bg-red-100 text-red-700" },
    termine: { label: "Stage terminé", color: "indigo", bg: "bg-indigo-100 text-indigo-700" },
  };
  const getStatus = (status) => statusConfig[status] || { label: "N/A", color: "gray", bg: "bg-gray-100 text-gray-700" };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";
  const avatarColors = ["bg-blue-500", "bg-indigo-500", "bg-cyan-500", "bg-teal-500", "bg-purple-500", "bg-violet-500", "bg-green-500", "bg-orange-500"];
  const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  const totalCount = applications.length;
  const newCount = applications.filter((a) => a.status === "nouveau").length;
  const preCount = applications.filter((a) => a.status === "preselectionnee").length;
  const interviewCount = applications.filter((a) => a.status === "entretien").length;
  const acceptedCount = applications.filter((a) => a.status === "acceptee").length;
  const rejectedCount = applications.filter((a) => a.status === "refusee").length;

  const filters = [
    { label: "Toutes", count: totalCount },
    { label: "Nouveau", count: newCount },
    { label: "Présélectionnée", count: preCount },
    { label: "Entretien", count: interviewCount },
    { label: "Acceptée", count: acceptedCount },
    { label: "Refusée", count: rejectedCount },
    { label: "Terminé", count: applications.filter((a) => a.status === "termine").length },
  ];

  const menuItems = [
    { icon: HomeIcon, label: "Tableau de bord", path: "/enterprise/offers", badge: null },
    { icon: HomeIcon, label: "Publier une offre", path: "/enterprise/publish", badge: null },
    { icon: BriefcaseIcon, label: "Mes offres", path: "/enterprise/offersliste", badge: null },
    { icon: CheckCircleIcon, label: "Candidatures", path: "/enterprise/condidateurliste", badge: totalCount },
    { icon: ChatBubbleLeftIcon, label: "Entretiens", path: "/enterprise/enterview", badge: interviewCount || null },
    { icon: UserCircleIcon, label: "Mon profil", path: "/enterprise/profile", badge: null },
  ];

  const roleConfigs = {
    manager: { label: "Manager", color: "blue", icon: "🏢" },
    rh: { label: "RH", color: "green", icon: "👥" },
    encadrant: { label: "Encadrant", color: "purple", icon: "🎓" },
    enterprise: { label: "Entreprise", color: "blue", icon: "🏢" },
  };

  return (
    <>
      <BaseLayout
        title="Candidatures reçues"
        menuItems={menuItems}
        sidebarHeader={
          <EnterpriseSidebarHeader
            name={userData?.name}
            email={userData?.email}
            photoUrl={userData?.photo_url}
            enterpriseName={userData?.company_name}
            logoUrl={userData?.logo_url}
            logo={userData?.logo}
            roleConfig={roleConfigs[enterpriseRole]}
          />
        }
        sidebarExtra={
          <div className="bg-blue-50 rounded-lg p-4">
            <Typography variant="small" className="text-blue-gray-600 mb-1">En attente de traitement</Typography>
            <Progress value={totalCount > 0 ? (newCount / totalCount) * 100 : 0} color="blue" className="h-2" />
            <Typography variant="caption" className="text-blue-gray-500 mt-2">{newCount} nouvelle(s)</Typography>
          </div>
        }
        headerActions={
          <div className="flex items-center gap-2">
            <NotificationBell apiPrefix="rh" />
            <IconButton variant="text" color="blue-gray"><UserCircleIcon className="w-5 h-5" /></IconButton>
          </div>
        }
      >
        <div className="p-0">

          {/* Statistiques */}
          <div className="mb-8 grid gap-4 grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Total", value: totalCount, color: "text-blue-gray-900" },
              { label: "Nouveau", value: newCount, color: "text-blue-500" },
              { label: "Présélectionnée", value: preCount, color: "text-amber-500" },
              { label: "Entretien", value: interviewCount, color: "text-purple-500" },
              { label: "Acceptée", value: acceptedCount, color: "text-green-500" },
            ].map((stat) => (
              <Card key={stat.label} className="p-4 shadow-sm border border-blue-gray-100 hover:shadow-lg transition">
                <Typography className="text-blue-gray-500 text-sm">{stat.label}</Typography>
                <Typography className={`text-2xl font-bold ${stat.color}`}>{stat.value}</Typography>
              </Card>
            ))}
          </div>

          {/* Filtres par statut */}
          <div className="mb-4 flex gap-2 flex-wrap">
            {filters.map((filter) => (
              <Button
                key={filter.label}
                variant={selectedFilter === filter.label ? "filled" : "outlined"}
                color={selectedFilter === filter.label ? "blue" : "blue-gray"}
                size="sm"
                onClick={() => setSelectedFilter(filter.label)}
                className="text-xs"
              >
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>

          {/* Filtre par offre + Recherche */}
          <Card className="mb-6 shadow-sm border border-blue-gray-100">
            <CardBody className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FunnelIcon className="h-5 w-5 text-blue-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <select
                      value={selectedOffer}
                      onChange={(e) => setSelectedOffer(e.target.value)}
                      className="w-full border border-blue-gray-200 rounded-lg px-3 py-2 text-sm text-blue-gray-700 focus:outline-none focus:border-blue-500 bg-white"
                    >
                      {uniqueOffers.map((offer) => (
                        <option key={offer.id} value={offer.id}>
                          {offer.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="hidden sm:block w-px bg-blue-gray-100 self-stretch"></div>

                <div className="flex-1">
                  <Input
                    placeholder="Rechercher par nom de candidat ou offre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                    className="!border-blue-gray-200"
                  />
                </div>

                {(selectedOffer !== "Toutes" || search) && (
                  <Button
                    size="sm"
                    variant="text"
                    color="blue-gray"
                    onClick={() => { setSelectedOffer("Toutes"); setSearch(""); }}
                    className="text-xs whitespace-nowrap flex-shrink-0"
                  >
                    ✕ Réinitialiser
                  </Button>
                )}
              </div>

              {selectedOffer !== "Toutes" && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-blue-gray-500">Filtre actif :</span>
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                    <BriefcaseIcon className="w-3 h-3" />
                    {uniqueOffers.find((o) => o.id === selectedOffer)?.title || selectedOffer}
                    <button
                      onClick={() => setSelectedOffer("Toutes")}
                      className="ml-1 hover:text-blue-900 font-bold"
                    >×</button>
                  </span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Liste candidatures */}
          <Card className="shadow-sm border border-blue-gray-100">
            <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100">
              <Typography variant="h6" color="blue-gray" className="font-bold">
                {filteredApplications.length} candidature(s) trouvée(s)
                {selectedOffer !== "Toutes" && (
                  <span className="ml-2 text-sm font-normal text-blue-500">
                    — {uniqueOffers.find((o) => o.id === selectedOffer)?.title}
                  </span>
                )}
              </Typography>
              <Button size="sm" color="blue" variant="outlined" onClick={fetchApplications}>
                🔄 Actualiser
              </Button>
            </CardHeader>

            <CardBody className="p-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mb-3 mx-auto"></div>
                    <Typography className="text-blue-gray-500">Chargement...</Typography>
                  </div>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <UserGroupIcon className="w-16 h-16 mx-auto text-blue-gray-300 mb-4" />
                  <Typography className="text-blue-gray-500">Aucune candidature trouvée</Typography>
                  {(selectedOffer !== "Toutes" || search || selectedFilter !== "Toutes") && (
                    <Button
                      size="sm"
                      variant="text"
                      color="blue"
                      className="mt-3"
                      onClick={() => { setSelectedOffer("Toutes"); setSearch(""); setSelectedFilter("Toutes"); }}
                    >
                      Effacer tous les filtres
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-blue-gray-50">
                  {filteredApplications.map((app) => {
                    const initial = getInitial(app.student?.name);
                    const cvUrl = getCvUrl(app.cv_path || app.cv);
                    const status = getStatus(app.status);
                    const isEncadrantOpen = selectedEncadrantApp === app.id;

                    return (
                      <div key={app.id}>
                        {/* Ligne principale */}
                        <div className="flex items-center justify-between p-5 hover:bg-blue-gray-50 transition">
                          {/* Avatar + Infos */}
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-lg ${app.student?.photo_url ? '' : getAvatarColor(app.student?.name)}`}>
                              {app.student?.photo_url ? (
                                <img
                                  src={app.student.photo_url}
                                  alt={app.student?.name || "Photo"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                initial
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Typography variant="h6" className="font-bold text-blue-gray-900 mb-0.5 flex items-center gap-2">
                                {app.student?.name || "Candidat"}
                                {app.student?.is_in_internship && (
                                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                    Déjà en stage
                                  </span>
                                )}
                              </Typography>
                              <Typography variant="small" className="text-blue-500 font-medium mb-1">
                                {app.offer?.title || "Offre"}
                              </Typography>
                              <div className="flex flex-wrap gap-3 text-xs text-blue-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPinIcon className="w-3 h-3" />{app.offer?.location || "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="w-3 h-3" />{app.offer?.duration || "N/A"}
                                </span>
                                <span>🗓️ {formatDate(app.created_at)}</span>
                                {cvUrl ? (
                                  <a href={cvUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition">
                                    <DocumentArrowDownIcon className="w-3 h-3" /> CV joint
                                  </a>
                                ) : (
                                  <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Pas de CV</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Statut inline + Actions */}
                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            {/* Badge statut actuel */}
                            <span className={`${status.bg} text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap`}>
                              {status.label}
                            </span>

                            {/* Select pour changer le statut */}
                            <select
                              value={app.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusChange(app.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="border border-blue-gray-200 rounded-lg px-2 py-1.5 text-xs text-blue-gray-700 focus:outline-none focus:border-blue-500 bg-white cursor-pointer hover:border-blue-400 transition-colors"
                              title="Changer le statut"
                            >
                              <option value="nouveau">Nouveau</option>
                              <option value="preselectionnee">Présélectionnée</option>
                              <option value="entretien">Entretien</option>
                              <option value="acceptee">Acceptée</option>
                              <option value="refusee">Refusée</option>
                              <option value="termine">Terminé</option>
                            </select>

                            {/* Boutons d'action */}
                            <div className="flex gap-1">
                              <IconButton variant="text" size="sm" color="blue"
                                onClick={() => { setSelectedApplication(app); setSelectedEncadrantId(""); fetchEvaluation(app.id); setOpenModal(true); }}
                                title="Voir détails">
                                <EyeIcon className="w-4 h-4" />
                              </IconButton>
                              <IconButton variant="text" size="sm" color="violet"
                                onClick={() => handleViewHistory(app.student)}
                                title="Historique des stages">
                                <ClockIcon className="w-4 h-4" />
                              </IconButton>
                              <IconButton variant="text" size="sm" color="purple"
                                onClick={() => setPlanAppId(app.id)} title="Planifier entretien">
                                <CalendarIcon className="w-4 h-4" />
                              </IconButton>
                              {app.status === "entretien" && (
                                <IconButton variant="text" size="sm" color="amber"
                                  onClick={() => setHistoryAppId(app.id)} title="Historique entretiens">
                                  <span className="text-sm">📜</span>
                                </IconButton>
                              )}
                              {app.status === "acceptee" && (
                                <IconButton variant="text" size="sm" color="teal"
                                  onClick={() => setSelectedEncadrantApp(isEncadrantOpen ? null : app.id)}
                                  title="Affecter encadrant">
                                  <span className="text-sm">👨‍🏫</span>
                                </IconButton>
                              )}
                              <IconButton variant="text" size="sm" color="green"
                                onClick={() => handleStatusChange(app.id, "acceptee")} title="Accepter"
                                disabled={app.status === "acceptee"}>
                                <CheckIcon className="w-4 h-4" />
                              </IconButton>
                              <IconButton variant="text" size="sm" color="red"
                                onClick={() => handleStatusChange(app.id, "refusee")} title="Refuser"
                                disabled={app.status === "refusee"}>
                                <XCircleIcon className="w-4 h-4" />
                              </IconButton>
                            </div>
                          </div>
                        </div>

                        {/* Section affectation encadrant (inline) */}
                        {app.status === "acceptee" && isEncadrantOpen && (
                          <div className="bg-blue-50 border-t border-blue-gray-200 p-5 space-y-4">
                            <Typography variant="small" className="font-bold text-blue-gray-900">
                              👨‍🏫 Affectation de l'encadrant
                            </Typography>

                            {/* Encadrant actuel */}
                            {app.encadrant ? (
                              <div className="mb-4 p-4 bg-white border border-blue-100 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {getInitial(app.encadrant.name)}
                                  </div>
                                  <div>
                                    <Typography variant="small" className="font-bold text-blue-gray-900">
                                      {app.encadrant.name}
                                    </Typography>
                                    <Typography variant="small" className="text-blue-gray-500 text-xs">
                                      Affecté
                                    </Typography>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  color="red"
                                  variant="text"
                                  className="flex items-center gap-2"
                                  onClick={() => unassignEncadrant(app.id)}
                                  disabled={assignLoading}
                                >
                                  <XCircleIcon className="w-4 h-4" /> Supprimer
                                </Button>
                              </div>
                            ) : (
                              <Typography variant="small" className="text-gray-500 italic bg-white border border-dashed border-gray-300 rounded-lg p-3">
                                Aucun encadrant affecté
                              </Typography>
                            )}

                            {/* Select + Bouton */}
                            <div className="flex gap-3">
                              <Select
                                label={app.encadrant ? "Changer d'encadrant" : "Choisir un encadrant"}
                                value={selectedEncadrantId}
                                onChange={(v) => setSelectedEncadrantId(v)}
                              >
                                {encadrants.length === 0 ? (
                                  <Option disabled value="">Aucun encadrant</Option>
                                ) : (
                                  encadrants.map((enc) => (
                                    <Option key={enc.id} value={enc.id}>{enc.name}</Option>
                                  ))
                                )}
                              </Select>
                              <Button
                                color="blue"
                                onClick={() => assignEncadrant(app.id)}
                                disabled={assignLoading || !selectedEncadrantId}
                              >
                                {assignLoading ? "..." : "Affecter"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </BaseLayout>

      {/* Modal Détails */}
      <Dialog open={openModal} handler={() => setOpenModal(false)} size="lg">
        <DialogHeader className="flex justify-between items-center border-b border-blue-gray-100">
          <Typography variant="h5" className="font-bold text-blue-gray-900">
            {selectedApplication?.student?.name || "Détails de la candidature"}
          </Typography>
          <IconButton variant="text" color="blue-gray" onClick={() => setOpenModal(false)}>
            <XMarkIcon className="w-6 h-6" />
          </IconButton>
        </DialogHeader>

        <DialogBody divider className="max-h-[70vh] overflow-y-auto space-y-6 p-6">
          {selectedApplication && (
            <>
              {/* 👤 Candidat */}
              <div>
                <Typography variant="h6" className="font-bold text-blue-gray-900 mb-4">👤 Informations du candidat</Typography>
                {selectedApplication.student?.photo_url && (
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-100 shadow-md">
                      <img
                        src={selectedApplication.student.photo_url}
                        alt={selectedApplication.student?.name || "Photo"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Nom", value: selectedApplication.student?.name },
                    { label: "Email", value: selectedApplication.student?.email },
                    { label: "Téléphone", value: selectedApplication.student?.phone },
                    { label: "Date de candidature", value: formatDate(selectedApplication.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <Typography variant="small" className="font-bold text-blue-gray-900">{label} :</Typography>
                      <Typography variant="small" className="text-blue-gray-700">{value || "—"}</Typography>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    variant="text"
                    color="purple"
                    className="flex items-center gap-2"
                    onClick={() => handleViewHistory(selectedApplication.student)}
                  >
                    <ClockIcon className="w-4 h-4" />
                    Voir l'historique complet
                  </Button>
                </div>
              </div>

              <div className="border-t border-blue-gray-100"></div>

              {/* 📄 CV */}
              <div>
                <Typography variant="h6" className="font-bold text-blue-gray-900 mb-4">📄 Curriculum Vitae</Typography>
                {getCvUrl(selectedApplication.cv_path || selectedApplication.cv) ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 font-bold text-xs">PDF</span>
                      </div>
                      <div>
                        <Typography variant="small" className="font-bold text-blue-gray-900">
                          CV de {selectedApplication.student?.name}
                        </Typography>
                        <Typography variant="small" className="text-blue-gray-400 text-xs">
                          Soumis le {formatDate(selectedApplication.created_at)}
                        </Typography>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <a href={getCvUrl(selectedApplication.cv_path || selectedApplication.cv)} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" color="blue" variant="outlined" className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" /> Voir
                        </Button>
                      </a>
                      <a href={getCvUrl(selectedApplication.cv_path || selectedApplication.cv)}
                        download={`CV_${selectedApplication.student?.name}.pdf`}>
                        <Button size="sm" color="blue" className="flex items-center gap-1">
                          <DocumentArrowDownIcon className="w-4 h-4" /> Télécharger
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center">
                    <DocumentArrowDownIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <Typography variant="small" className="text-gray-400">Aucun CV soumis</Typography>
                  </div>
                )}
              </div>

              <div className="border-t border-blue-gray-100"></div>

              {/* 💼 Offre */}
              <div>
                <Typography variant="h6" className="font-bold text-blue-gray-900 mb-4">💼 Offre de stage</Typography>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Titre", value: selectedApplication.offer?.title },
                    { label: "Domaine", value: selectedApplication.offer?.domain },
                    { label: "Lieu", value: selectedApplication.offer?.location },
                    { label: "Durée", value: selectedApplication.offer?.duration },
                    { label: "Date début", value: formatDate(selectedApplication.offer?.start_date) },
                    { label: "Places", value: selectedApplication.offer?.available_places ? `${selectedApplication.offer.available_places} place(s)` : "N/A" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <Typography variant="small" className="font-bold text-blue-gray-900">{label} :</Typography>
                      <Typography variant="small" className="text-blue-gray-700">{value || "—"}</Typography>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-blue-gray-100"></div>

              {/* 📋 Statut */}
              <div>
                <Typography variant="h6" className="font-bold text-blue-gray-900 mb-4">📋 Mettre à jour le statut</Typography>
                <div className="flex items-center gap-4">
                  <span className={`${getStatus(selectedApplication.status).bg} text-xs font-medium px-3 py-1 rounded-full`}>
                    {getStatus(selectedApplication.status).label}
                  </span>
                  <select
                    value={selectedApplication.status}
                    onChange={(e) => handleStatusChange(selectedApplication.id, e.target.value)}
                    className="flex-1 border border-blue-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="nouveau">Nouveau</option>
                    <option value="preselectionnee">Présélectionnée</option>
                    <option value="entretien">Entretien planifié</option>
                    <option value="acceptee">Acceptée</option>
                    <option value="refusee">Refusée</option>
                    <option value="termine">Stage terminé</option>
                  </select>
                </div>
              </div>

              {/* Évaluation du stage — uniquement si accepté */}
              {selectedApplication.status === "acceptee" && (
                <>
                  <div className="border-t border-blue-gray-100"></div>
                  <div>
                    <Typography variant="h6" className="font-bold text-blue-gray-900 mb-4">
                      ✅ Évaluation du stage
                    </Typography>
                    <div className="bg-white rounded-2xl border border-blue-gray-100 p-5 shadow-sm space-y-4">
                      <p className="text-xs text-blue-gray-500 bg-blue-gray-50 border border-blue-gray-100 rounded-xl px-4 py-2.5">
                        Vous pouvez évaluer la fin du stage du candidat. Ces informations seront sauvegardées en tant qu'évaluation entreprise.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-blue-gray-600 mb-1.5 uppercase tracking-wide">Note /20</label>
                          <input type="number" min={0} max={20} step={0.5}
                            value={evalForm.score}
                            onChange={(e) => setEvalForm(f => ({ ...f, score: e.target.value }))}
                            className="w-full rounded-xl border border-blue-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-blue-gray-600 mb-1.5 uppercase tracking-wide">Décision Finale</label>
                          <select
                            value={evalForm.final_decision}
                            onChange={(e) => setEvalForm(f => ({ ...f, final_decision: e.target.value }))}
                            className="w-full rounded-xl border border-blue-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="pending">En attente</option>
                            <option value="valide">Validé</option>
                            <option value="a_ameliorer">À améliorer</option>
                            <option value="non_conforme">Non conforme</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-gray-600 mb-1.5 uppercase tracking-wide">Appréciation / Notes internes</label>
                        <textarea
                          value={evalForm.notes}
                          onChange={(e) => setEvalForm(f => ({ ...f, notes: e.target.value }))}
                          rows={3}
                          className="w-full rounded-xl border border-blue-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                      </div>
                      <Button onClick={() => saveEvaluation(selectedApplication.id)} disabled={evalLoading} color="green" className="w-full mt-2">
                        {evalLoading ? "Enregistrement..." : (evaluation ? "Mettre à jour l'évaluation" : "Valider le stage")}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter className="border-t border-blue-gray-100 gap-3 flex-wrap">
          <Button variant="outlined" color="blue-gray" onClick={() => setOpenModal(false)}>Fermer</Button>
          <Button color="purple" variant="outlined"
            onClick={() => { setPlanAppId(selectedApplication?.id); setOpenModal(false); }}>
            📅 Planifier entretien
          </Button>
          {selectedApplication?.status !== "acceptee" && (
            <Button color="green"
              onClick={() => { handleStatusChange(selectedApplication.id, "acceptee"); setOpenModal(false); }}>
              ✅ Accepter
            </Button>
          )}
          {selectedApplication?.status !== "refusee" && (
            <Button color="red" variant="outlined"
              onClick={() => { handleStatusChange(selectedApplication.id, "refusee"); setOpenModal(false); }}>
              ❌ Refuser
            </Button>
          )}
        </DialogFooter>
      </Dialog>

      <PlanInterviewModal
        open={!!planAppId}
        applicationId={planAppId}
        onClose={() => setPlanAppId(null)}
        onSuccess={fetchApplications}
      />
      <InterviewHistoryModal
        open={!!historyAppId}
        applicationId={historyAppId}
        onClose={() => setHistoryAppId(null)}
      />
      <CandidateHistoryModal
        open={openHistoryModal}
        student={selectedStudent}
        history={candidateHistory}
        loading={historyLoading}
        onClose={() => { setOpenHistoryModal(false); setSelectedStudent(null); setCandidateHistory(null); }}
      />
      <ChatBox />
    </>
  );
}