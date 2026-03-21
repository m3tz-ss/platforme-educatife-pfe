import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Typography,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Input,
  Progress,
  IconButton,
} from "@material-tailwind/react";
import {
  HomeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  LinkIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";

export default function InterviewsHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Toutes");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  useEffect(() => {
    filterInterviews();
  }, [interviews, selectedFilter, search]);

  // ✅ Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
      });
    } catch { return dateStr; }
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get("/enterprise/applications");
      const apps = Array.isArray(res.data) ? res.data : res.data.data || [];

      const allInterviews = await Promise.all(
        apps.map(async (app) => {
          try {
            const resInt = await api.get(`/enterprise/applications/${app.id}/interviews`);
            const intData = Array.isArray(resInt.data) ? resInt.data : resInt.data.data || [];
            return intData.map((i) => ({
              ...i,
              candidate: app.student,
              offer: app.offer,
            }));
          } catch {
            return [];
          }
        })
      );

      setInterviews(allInterviews.flat());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterInterviews = () => {
    let filtered = interviews;
    if (selectedFilter !== "Toutes") {
      const mapStatus = { "Accepté": "accepted", "Refusé": "rejected", "En attente": "pending" };
      filtered = filtered.filter((i) => (i.result || "pending") === mapStatus[selectedFilter]);
    }
    if (search) {
      filtered = filtered.filter(
        (i) =>
          i.candidate?.name?.toLowerCase().includes(search.toLowerCase()) ||
          i.offer?.title?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredInterviews(filtered);
  };

  const resultConfig = {
    accepted: { label: "Accepté",    color: "green",  bg: "bg-green-100 text-green-700" },
    rejected: { label: "Refusé",     color: "red",    bg: "bg-red-100 text-red-700" },
    pending:  { label: "En attente", color: "purple", bg: "bg-purple-100 text-purple-700" },
  };
  const getResult = (result) => resultConfig[result] || resultConfig.pending;

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";
  const avatarColors = ["bg-blue-500","bg-indigo-500","bg-cyan-500","bg-teal-500","bg-purple-500","bg-violet-500"];
  const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  // Compteurs
  const totalCount    = interviews.length;
  const pendingCount  = interviews.filter((i) => !i.result || i.result === "pending").length;
  const acceptedCount = interviews.filter((i) => i.result === "accepted").length;
  const rejectedCount = interviews.filter((i) => i.result === "rejected").length;

  const filters = [
    { label: "Toutes",     count: totalCount },
    { label: "En attente", count: pendingCount },
    { label: "Accepté",    count: acceptedCount },
    { label: "Refusé",     count: rejectedCount },
  ];

  const menuItems = [
    { icon: HomeIcon,           label: "Tableau de bord",  path: "/enterprise/offers",           badge: null },
    { icon: HomeIcon,           label: "Publier une offre", path: "/enterprise/publish",          badge: null },
    { icon: BriefcaseIcon,      label: "Mes offres",        path: "/enterprise/offersliste",      badge: null },
    { icon: CheckCircleIcon,    label: "Candidatures",      path: "/enterprise/condidateurliste", badge: null },
    { icon: ChatBubbleLeftIcon, label: "Entretiens",        path: "/enterprise/enterview",        badge: totalCount || null },
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
            <Typography variant="small" className="text-blue-gray-600 mb-1">Entretiens en attente</Typography>
            <Progress value={totalCount > 0 ? (pendingCount / totalCount) * 100 : 0} color="blue" className="h-2" />
            <Typography variant="caption" className="text-blue-gray-500 mt-2">{pendingCount} en attente</Typography>
          </div>
          <Button fullWidth color="blue" variant="gradient" size="sm">✉️ Support</Button>
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
            <Typography variant="h5" className="font-bold text-blue-gray-900">Historique des Entretiens</Typography>
            <IconButton variant="text" color="blue-gray"><UserCircleIcon className="w-5 h-5" /></IconButton>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8">

            {/* ✅ Statistiques */}
            <div className="mb-8 grid gap-4 grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total entretiens", value: totalCount,    color: "text-blue-gray-900", subColor: "text-blue-500",   sub: "Total" },
                { label: "En attente",       value: pendingCount,  color: "text-purple-500",    subColor: "text-purple-500", sub: "⏳ À traiter" },
                { label: "Acceptés",         value: acceptedCount, color: "text-green-500",     subColor: "text-green-500",  sub: "✅ Succès" },
                { label: "Refusés",          value: rejectedCount, color: "text-red-500",       subColor: "text-red-500",    sub: "❌ Refusés" },
              ].map((stat) => (
                <Card key={stat.label} className="p-4 shadow-sm border border-blue-gray-100 hover:shadow-lg transition">
                  <Typography className="text-blue-gray-500 text-sm">{stat.label}</Typography>
                  <Typography className={`text-2xl font-bold ${stat.color}`}>{stat.value}</Typography>
                  <Typography className={`text-xs font-medium ${stat.subColor}`}>{stat.sub}</Typography>
                </Card>
              ))}
            </div>

            {/* Filtres */}
            <div className="mb-6 flex gap-2 flex-wrap">
              {filters.map((f) => (
                <Button
                  key={f.label}
                  variant={selectedFilter === f.label ? "filled" : "outlined"}
                  color={selectedFilter === f.label ? "blue" : "blue-gray"}
                  size="sm"
                  onClick={() => setSelectedFilter(f.label)}
                  className="text-xs"
                >
                  {f.label} ({f.count})
                </Button>
              ))}
            </div>

            {/* Recherche */}
            <Card className="mb-6 shadow-sm border border-blue-gray-100">
              <CardBody className="p-4">
                <Input
                  placeholder="Rechercher par candidat ou offre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  className="!border-blue-gray-200"
                />
              </CardBody>
            </Card>

            {/* ✅ Liste entretiens */}
            <Card className="shadow-sm border border-blue-gray-100">
              <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100">
                <Typography variant="h6" color="blue-gray" className="font-bold">
                  {filteredInterviews.length} entretien(s) trouvé(s)
                </Typography>
                <Button size="sm" color="blue" variant="outlined" onClick={fetchInterviews}>🔄 Actualiser</Button>
              </CardHeader>

              <CardBody className="p-0">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mb-3 mx-auto"></div>
                      <Typography className="text-blue-gray-500">Chargement des entretiens...</Typography>
                    </div>
                  </div>
                ) : filteredInterviews.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <CalendarIcon className="w-16 h-16 mx-auto text-blue-gray-300 mb-4" />
                    <Typography className="text-blue-gray-500">Aucun entretien trouvé</Typography>
                  </div>
                ) : (
                  <div className="divide-y divide-blue-gray-50">
                    {filteredInterviews.map((i) => {
                      const result = getResult(i.result);
                      const initial = getInitial(i.candidate?.name);
                      return (
                        <div key={i.id} className="flex items-start gap-4 p-5 hover:bg-blue-gray-50 transition">
                          {/* Avatar */}
                          <div className={`w-12 h-12 rounded-full ${getAvatarColor(i.candidate?.name)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                            {initial}
                          </div>

                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <Typography variant="h6" className="font-bold text-blue-gray-900">
                                  {i.candidate?.name || "Candidat"}
                                </Typography>
                                <Typography variant="small" className="text-blue-500 font-medium">
                                  {i.offer?.title || "Offre"}
                                </Typography>
                              </div>
                              <span className={`${result.bg} text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ml-3`}>
                                {result.label}
                              </span>
                            </div>

                            {/* ✅ Détails entretien */}
                            <div className="flex flex-wrap gap-3 text-xs text-blue-gray-600">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3 text-blue-400" />
                                {formatDate(i.date)}
                              </span>
                              {i.time && (
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="w-3 h-3 text-blue-400" />
                                  {i.time}
                                </span>
                              )}
                              {i.location && (
                                <span className="flex items-center gap-1">
                                  <MapPinIcon className="w-3 h-3 text-blue-400" />
                                  {i.location}
                                </span>
                              )}
                              {i.meeting_link && (
                                <a
                                  href={i.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium"
                                >
                                  <LinkIcon className="w-3 h-3" />
                                  Lien visio
                                </a>
                              )}
                            </div>

                            {/* Offre détails */}
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-blue-gray-500">
                              {i.offer?.location && <span>📍 {i.offer.location}</span>}
                              {i.offer?.duration && <span>⏱️ {i.offer.duration}</span>}
                              {i.offer?.start_date && <span>📅 Début : {formatDate(i.offer.start_date)}</span>}
                            </div>

                            {/* Commentaire */}
                            {i.comment && (
                              <div className="mt-2 flex items-start gap-1 text-xs text-blue-gray-600 bg-blue-gray-50 rounded-lg px-3 py-2">
                                <ChatBubbleBottomCenterTextIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{i.comment}</span>
                              </div>
                            )}
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
    </div>
  );
}