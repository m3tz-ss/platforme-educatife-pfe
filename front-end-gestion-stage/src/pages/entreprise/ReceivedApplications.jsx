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
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";
import PlanInterviewModal from "../../components/interviews/PlanInterviewModal";
import InterviewHistoryModal from "../../components/interviews/InterviewHistoryModal";

export default function ReceivedApplications() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Toutes");
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [planAppId, setPlanAppId] = useState(null);
  const [historyAppId, setHistoryAppId] = useState(null);
  const [encadrants, setEncadrants] = useState([]);
  const [selectedEncadrant, setSelectedEncadrant] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchEncadrants();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, selectedFilter, search]);

  // ✅ Format date
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
      };
      filtered = filtered.filter((app) => app.status === statusMap[selectedFilter]);
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
    try {
      await api.patch(`/applications/${appId}`, { status: newStatus });
      setApplications((prev) => prev.map((app) => app.id === appId ? { ...app, status: newStatus } : app));
      if (selectedApplication?.id === appId) {
        setSelectedApplication((prev) => ({ ...prev, status: newStatus }));
      }
      Swal.fire({ icon: "success", title: "Statut mis à jour !", timer: 1500, timerProgressBar: true, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: err.response?.data?.message || "Erreur changement statut.", confirmButtonColor: "#ef4444" });
    }
  };

  const assignEncadrant = async (applicationId) => {
    if (!selectedEncadrant) {
      Swal.fire({ icon: "warning", title: "Encadrant requis", text: "Veuillez choisir un encadrant.", confirmButtonColor: "#f59e0b" });
      return;
    }
    try {
      setAssignLoading(true);
      await api.post(`/assign-encadrant/${applicationId}`, { encadrant_id: selectedEncadrant });
      setSelectedEncadrant("");
      Swal.fire({ icon: "success", title: "Encadrant affecté !", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchApplications();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible d'affecter l'encadrant.", confirmButtonColor: "#ef4444" });
    } finally {
      setAssignLoading(false);
    }
  };

  // ✅ CV URL
  const getCvUrl = (cvPath) => {
    if (!cvPath) return null;
    if (cvPath.startsWith("http")) return cvPath;
    return `http://127.0.0.1:8000/storage/${cvPath}`;
  };

  // ✅ Statut helpers
  const statusConfig = {
    nouveau:        { label: "Nouveau",           color: "blue",   bg: "bg-blue-100 text-blue-700" },
    preselectionnee:{ label: "Présélectionnée",   color: "amber",  bg: "bg-amber-100 text-amber-700" },
    entretien:      { label: "Entretien planifié", color: "purple", bg: "bg-purple-100 text-purple-700" },
    acceptee:       { label: "Acceptée",           color: "green",  bg: "bg-green-100 text-green-700" },
    refusee:        { label: "Refusée",            color: "red",    bg: "bg-red-100 text-red-700" },
  };
  const getStatus = (status) => statusConfig[status] || { label: "N/A", color: "gray", bg: "bg-gray-100 text-gray-700" };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";
  const avatarColors = ["bg-blue-500", "bg-indigo-500", "bg-cyan-500", "bg-teal-500", "bg-purple-500", "bg-violet-500", "bg-green-500", "bg-orange-500"];
  const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  // Compteurs
  const totalCount     = applications.length;
  const newCount       = applications.filter((a) => a.status === "nouveau").length;
  const preCount       = applications.filter((a) => a.status === "preselectionnee").length;
  const interviewCount = applications.filter((a) => a.status === "entretien").length;
  const acceptedCount  = applications.filter((a) => a.status === "acceptee").length;
  const rejectedCount  = applications.filter((a) => a.status === "refusee").length;

  const filters = [
    { label: "Toutes",         count: totalCount },
    { label: "Nouveau",        count: newCount },
    { label: "Présélectionnée",count: preCount },
    { label: "Entretien",      count: interviewCount },
    { label: "Acceptée",       count: acceptedCount },
    { label: "Refusée",        count: rejectedCount },
  ];

  const menuItems = [
    { icon: HomeIcon,           label: "Tableau de bord",  path: "/enterprise/offers",           badge: null },
    { icon: HomeIcon,           label: "Publier une offre", path: "/enterprise/publish",          badge: null },
    { icon: BriefcaseIcon,      label: "Mes offres",        path: "/enterprise/offersliste",      badge: null },
    { icon: CheckCircleIcon,    label: "Candidatures",      path: "/enterprise/condidateurliste", badge: totalCount },
    { icon: ChatBubbleLeftIcon, label: "Entretiens",        path: "/enterprise/enterview",        badge: interviewCount || null },
    { icon: UserCircleIcon,     label: "Mon profil",        path: "/enterprise/profile",          badge: null },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-6 border-b border-blue-gray-100">
          <Typography variant="h5" className="font-bold text-blue-500">🏢 MyStage</Typography>
          <Typography variant="small" className="text-blue-gray-500">Espace Entreprise</Typography>
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
            <Typography variant="small" className="text-blue-gray-600 mb-1">En attente de traitement</Typography>
            <Progress value={totalCount > 0 ? (newCount / totalCount) * 100 : 0} color="blue" className="h-2" />
            <Typography variant="caption" className="text-blue-gray-500 mt-2">{newCount} nouvelle(s)</Typography>
          </div>
          <Button fullWidth color="blue" variant="gradient" size="sm">✉️ Contacter support</Button>
        </div>

        <div className="p-6 border-t border-blue-gray-100">
          <Link to="/auth/sign-in">
            <Button fullWidth color="red" variant="outlined" size="sm" className="flex items-center justify-center gap-2">
              <ArrowRightOnRectangleIcon className="w-4 h-4" /> Déconnexion
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
            <Typography variant="h5" className="font-bold text-blue-gray-900">Candidatures reçues</Typography>
            <IconButton variant="text" color="blue-gray"><UserCircleIcon className="w-5 h-5" /></IconButton>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8">

            {/* ✅ Statistiques */}
            <div className="mb-8 grid gap-4 grid-cols-2 xl:grid-cols-5">
              {[
                { label: "Total",          value: totalCount,     color: "text-blue-gray-900", subColor: "text-blue-500" },
                { label: "Nouveau",        value: newCount,       color: "text-blue-500",      subColor: "text-blue-500" },
                { label: "Présélectionnée",value: preCount,       color: "text-amber-500",     subColor: "text-amber-500" },
                { label: "Entretien",      value: interviewCount, color: "text-purple-500",    subColor: "text-purple-500" },
                { label: "Acceptée",       value: acceptedCount,  color: "text-green-500",     subColor: "text-green-500" },
              ].map((stat) => (
                <Card key={stat.label} className="p-4 shadow-sm border border-blue-gray-100 hover:shadow-lg transition">
                  <Typography className="text-blue-gray-500 text-sm">{stat.label}</Typography>
                  <Typography className={`text-2xl font-bold ${stat.color}`}>{stat.value}</Typography>
                </Card>
              ))}
            </div>

            {/* Filtres */}
            <div className="mb-6 flex gap-2 flex-wrap">
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

            {/* Recherche */}
            <Card className="mb-6 shadow-sm border border-blue-gray-100">
              <CardBody className="p-4">
                <Input
                  placeholder="Rechercher par nom de candidat ou offre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  className="!border-blue-gray-200"
                />
              </CardBody>
            </Card>

            {/* ✅ Liste candidatures */}
            <Card className="shadow-sm border border-blue-gray-100">
              <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100">
                <Typography variant="h6" color="blue-gray" className="font-bold">
                  {filteredApplications.length} candidature(s) trouvée(s)
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
                  </div>
                ) : (
                  <div className="divide-y divide-blue-gray-50">
                    {filteredApplications.map((app) => {
                      const initial = getInitial(app.student?.name);
                      const cvUrl = getCvUrl(app.cv_path || app.cv);
                      const status = getStatus(app.status);

                      return (
                        <div key={app.id} className="flex items-center justify-between p-5 hover:bg-blue-gray-50 transition">
                          {/* Avatar + Infos */}
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-full ${getAvatarColor(app.student?.name)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                              {initial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Typography variant="h6" className="font-bold text-blue-gray-900 mb-0.5">
                                {app.student?.name || "Candidat"}
                              </Typography>
                              <Typography variant="small" className="text-blue-500 font-medium mb-1">
                                {app.offer?.title || "Offre"}
                              </Typography>
                              {/* ✅ snake_case */}
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

                          {/* Statut + Actions */}
                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            <span className={`${status.bg} text-xs font-medium px-3 py-1 rounded-full`}>
                              {status.label}
                            </span>
                            <div className="flex gap-1">
                              <IconButton variant="text" size="sm" color="blue"
                                onClick={() => { setSelectedApplication(app); setSelectedEncadrant(""); setOpenModal(true); }}
                                title="Voir détails">
                                <EyeIcon className="w-4 h-4" />
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
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </main>
      </div>

      {/* ✅ Modal Détails */}
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
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Nom",       value: selectedApplication.student?.name },
                    { label: "Email",     value: selectedApplication.student?.email },
                    { label: "Téléphone", value: selectedApplication.student?.phone },
                    { label: "Date de candidature", value: formatDate(selectedApplication.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <Typography variant="small" className="font-bold text-blue-gray-900">{label} :</Typography>
                      <Typography variant="small" className="text-blue-gray-700">{value || "—"}</Typography>
                    </div>
                  ))}
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
                    { label: "Titre",      value: selectedApplication.offer?.title },
                    { label: "Domaine",    value: selectedApplication.offer?.domain },
                    { label: "Lieu",       value: selectedApplication.offer?.location },
                    { label: "Durée",      value: selectedApplication.offer?.duration },
                    { label: "Date début", value: formatDate(selectedApplication.offer?.start_date) },
                    { label: "Places",     value: selectedApplication.offer?.available_places ? `${selectedApplication.offer.available_places} place(s)` : "N/A" },
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
                  </select>
                </div>
              </div>

              <div className="border-t border-blue-gray-100"></div>

              {/* 👨‍🏫 Affecter encadrant */}
              <div>
                <Typography variant="h6" className="font-bold text-blue-gray-900 mb-4">👨‍🏫 Affecter un encadrant</Typography>
                {selectedApplication.encadrant && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Typography variant="small" className="text-green-700 font-medium">
                      ✅ Encadrant actuel : <strong>{selectedApplication.encadrant?.name}</strong>
                    </Typography>
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Select label="Choisir un encadrant" value={selectedEncadrant} onChange={(v) => setSelectedEncadrant(v)}>
                      {encadrants.length === 0 ? (
                        <Option disabled value="">Aucun encadrant disponible</Option>
                      ) : (
                        encadrants.map((enc) => (
                          <Option key={enc.id} value={enc.id}>{enc.name}</Option>
                        ))
                      )}
                    </Select>
                  </div>
                  <Button color="blue" onClick={() => assignEncadrant(selectedApplication.id)} disabled={assignLoading}>
                    {assignLoading ? "Affectation..." : "Affecter"}
                  </Button>
                </div>
              </div>
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

      {/* Modals externes */}
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
      <ChatBox />
    </div>
  );
}