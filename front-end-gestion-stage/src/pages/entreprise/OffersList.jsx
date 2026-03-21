import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Progress,
  Chip,
} from "@material-tailwind/react";
import {
  HomeIcon,
  BriefcaseIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  UsersIcon,
  EyeIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";

export default function EnterpriseDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Infos user depuis localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.type || user.role || "rh";

  // ✅ Nom et email de l'entreprise
  const enterpriseName  = user.company_name || user.company_name || user.name || "Mon Entreprise";
  const enterpriseEmail = user.email || "N/A";

  const roleConfig = {
    manager:   { label: "Manager",   color: "blue",   icon: "🏢", greeting: "Bienvenue sur votre tableau de bord" },
    rh:        { label: "RH",        color: "green",  icon: "👥", greeting: "Gérez vos offres et candidatures" },
    encadrant: { label: "Encadrant", color: "purple", icon: "🎓", greeting: "Suivez vos stagiaires" },
  };
  const currentRole = roleConfig[role] || roleConfig.rh;

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [offersRes, appsRes] = await Promise.allSettled([
        api.get("/offers"),
        api.get("/enterprise/applications"),
      ]);
      if (offersRes.status === "fulfilled") {
        setOffers(Array.isArray(offersRes.value.data) ? offersRes.value.data : offersRes.value.data.data || []);
      }
      if (appsRes.status === "fulfilled") {
        setApplications(Array.isArray(appsRes.value.data) ? appsRes.value.data : appsRes.value.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
      });
    } catch { return dateStr; }
  };

  const statusMap = { nouveau: "pending", preselectionnee: "reviewing", entretien: "interview", acceptee: "accepted", refusee: "rejected" };
  const normalizeStatus = (s) => statusMap[s] || s;
  const statusColor = (s) => ({ accepted: "green", rejected: "red", interview: "purple", reviewing: "amber" }[normalizeStatus(s)] || "orange");
  const statusLabel = (s) => ({ accepted: "✅ Acceptée", rejected: "❌ Refusée", interview: "📞 Entretien", reviewing: "👀 Présélectionnée" }[normalizeStatus(s)] || "⏳ En attente");

  const pendingApps   = applications.filter((a) => normalizeStatus(a.status) === "pending").length;
  const reviewingApps = applications.filter((a) => normalizeStatus(a.status) === "reviewing").length;
  const interviewApps = applications.filter((a) => normalizeStatus(a.status) === "interview").length;
  const acceptedApps  = applications.filter((a) => normalizeStatus(a.status) === "accepted").length;

  const menuItems = [
    { icon: HomeIcon,           label: "Tableau de bord",  path: "/enterprise/offers",           badge: null },
    { icon: PlusIcon,           label: "Publier une offre", path: "/enterprise/publish",          badge: null },
    { icon: BriefcaseIcon,      label: "Mes offres",        path: "/enterprise/offersliste",      badge: offers.length },
    { icon: CheckCircleIcon,    label: "Candidatures",      path: "/enterprise/condidateurliste", badge: applications.length },
    { icon: ChatBubbleLeftIcon, label: "Entretiens",        path: "/enterprise/enterview",        badge: interviewApps || null },
    { icon: UserCircleIcon,     label: "Mon profil",        path: "/enterprise/profile",          badge: null },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}>

        {/* ✅ Logo + Nom entreprise + Email */}
        <div className="p-6 border-b border-blue-gray-100">
          <Typography variant="h5" className="font-bold text-blue-500">🏢 MyStage</Typography>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <BuildingOfficeIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <Typography variant="small" className="font-bold text-blue-gray-900 truncate">
                {enterpriseName}
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="w-3 h-3 text-blue-gray-400 flex-shrink-0" />
              <Typography variant="small" className="text-blue-gray-500 text-xs truncate">
                {enterpriseEmail}
              </Typography>
            </div>
            <div className="mt-2">
              <Chip
                value={`${currentRole.icon} ${currentRole.label}`}
                color={currentRole.color}
                size="sm"
                className="text-xs"
              />
            </div>
          </div>
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
            <Typography variant="small" className="text-blue-gray-600 mb-1">Activité globale</Typography>
            <Progress
              value={applications.length > 0 ? Math.min((acceptedApps / applications.length) * 100, 100) : 0}
              color="blue" className="h-2"
            />
            <Typography variant="caption" className="text-blue-gray-500 mt-2">
              {acceptedApps} stagiaire(s) accepté(s)
            </Typography>
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

        {/* ✅ Header avec nom + email entreprise */}
        <header className="bg-white shadow-sm border-b border-blue-gray-100">
          <div className="px-6 py-4 flex justify-between items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-blue-gray-50 rounded-lg transition-colors">
              {sidebarOpen ? <XMarkIcon className="w-6 h-6 text-blue-gray-600" /> : <Bars3Icon className="w-6 h-6 text-blue-gray-600" />}
            </button>
            <div className="text-center">
              <Typography variant="h5" className="font-bold text-blue-gray-900">Tableau de Bord</Typography>
              <Typography variant="small" className="text-blue-gray-400 text-xs">
                {enterpriseName} • {enterpriseEmail}
              </Typography>
            </div>
            <div className="flex gap-3">
              <IconButton variant="text" color="blue-gray"><ChatBubbleLeftIcon className="w-5 h-5" /></IconButton>
              <IconButton variant="text" color="blue-gray"><UserCircleIcon className="w-5 h-5" /></IconButton>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8">

            {/* ✅ Greeting avec nom, entreprise et email */}
            <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
              <div>
                <Typography variant="h4" className="font-bold text-blue-gray-900">
                  {currentRole.icon} Bonjour, {user.name} 👋
                </Typography>
                <Typography variant="small" className="text-blue-gray-500 mt-1">
                  {currentRole.greeting}
                </Typography>
                {/* ✅ Nom et email entreprise sous le greeting */}
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-blue-500 font-medium">
                    <BuildingOfficeIcon className="w-3 h-3" />
                    {enterpriseName}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-blue-gray-400">
                    <EnvelopeIcon className="w-3 h-3" />
                    {enterpriseEmail}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Chip value={`${currentRole.icon} ${currentRole.label}`} color={currentRole.color} size="sm" />
                <Button color="blue" size="sm" onClick={() => navigate("/enterprise/publish")} className="flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" /> Nouvelle offre
                </Button>
              </div>
            </div>

            {/* Statistiques */}
            <div className="mb-8 grid gap-4 grid-cols-2 xl:grid-cols-5">
              {[
                { label: "Offres publiées",  value: offers.length,             color: "text-blue-gray-900", sub: "Total",      subColor: "text-blue-500",   icon: BriefcaseIcon },
                { label: "Candidatures",     value: applications.length,       color: "text-blue-500",      sub: "Reçues",     subColor: "text-blue-500",   icon: DocumentTextIcon },
                { label: "En attente",       value: pendingApps + reviewingApps, color: "text-orange-500",  sub: "À traiter",  subColor: "text-orange-500", icon: ClockIcon },
                { label: "Entretiens",       value: interviewApps,             color: "text-purple-500",    sub: "Planifiés",  subColor: "text-purple-500", icon: CalendarIcon },
                { label: "Acceptés",         value: acceptedApps,              color: "text-green-500",     sub: "Stagiaires", subColor: "text-green-500",  icon: CheckBadgeIcon },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="p-4 shadow-sm border border-blue-gray-100 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-2">
                      <Typography className="text-blue-gray-500 text-sm">{stat.label}</Typography>
                      <Icon className="w-5 h-5 text-blue-gray-300" />
                    </div>
                    <Typography className={`text-2xl font-bold ${stat.color}`}>{stat.value}</Typography>
                    <Typography className={`text-xs font-medium ${stat.subColor}`}>{stat.sub}</Typography>
                  </Card>
                );
              })}
            </div>

            {/* Grille principale */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

              {/* Offres récentes */}
              <Card className="border border-blue-gray-100 shadow-sm">
                <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100">
                  <Typography variant="h6" color="blue-gray" className="font-bold">📋 Offres récentes</Typography>
                  <Link to="/enterprise/offersliste">
                    <Typography variant="small" className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer">Voir tout</Typography>
                  </Link>
                </CardHeader>
                <CardBody className="p-6 space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin"></div>
                    </div>
                  ) : offers.slice(0, 4).length === 0 ? (
                    <div className="text-center py-6">
                      <Typography className="text-blue-gray-500 mb-3">Aucune offre publiée</Typography>
                      <Button color="blue" size="sm" onClick={() => navigate("/enterprise/publish")} className="flex items-center gap-2 mx-auto">
                        <PlusIcon className="w-4 h-4" /> Publier une offre
                      </Button>
                    </div>
                  ) : (
                    offers.slice(0, 4).map((offer) => (
                      <div key={offer.id} className="pb-4 border-b border-blue-gray-50 last:border-b-0 last:pb-0">
                        <Typography variant="h6" className="text-blue-gray-900 font-bold mb-1">{offer.title}</Typography>
                        {offer.domain && <Chip value={offer.domain} variant="ghost" size="sm" color="blue" className="text-xs mb-2" />}
                        <div className="flex flex-wrap gap-3 text-xs text-blue-gray-600 mb-2">
                          <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" />{offer.location || "N/A"}</span>
                          <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" />{offer.duration || "N/A"}</span>
                          <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />Début : {formatDate(offer.start_date)}</span>
                          <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" />{offer.available_places ? `${offer.available_places} place(s)` : "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Typography variant="small" className="text-blue-gray-400">Publiée le {formatDate(offer.created_at)}</Typography>
                          <Button size="sm" color="blue" variant="outlined" className="text-xs flex items-center gap-1"
                            onClick={() => navigate("/enterprise/condidateurliste")}>
                            <EyeIcon className="w-3 h-3" /> Candidatures
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>

              {/* Candidatures récentes */}
              <Card className="border border-blue-gray-100 shadow-sm">
                <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100">
                  <Typography variant="h6" color="blue-gray" className="font-bold">👤 Candidatures récentes</Typography>
                  <Link to="/enterprise/condidateurliste">
                    <Typography variant="small" className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer">Voir tout</Typography>
                  </Link>
                </CardHeader>
                <CardBody className="p-6 space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin"></div>
                    </div>
                  ) : applications.slice(0, 4).length === 0 ? (
                    <div className="text-center py-6">
                      <Typography className="text-blue-gray-500">Aucune candidature reçue</Typography>
                    </div>
                  ) : (
                    applications.slice(0, 4).map((app) => (
                      <div key={app.id} className="pb-4 border-b border-blue-gray-50 last:border-b-0 last:pb-0">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <Typography variant="h6" className="font-bold text-blue-gray-900 mb-1">
                              {app.student?.name || app.user?.name || "Candidat"}
                            </Typography>
                            <Typography variant="small" className="text-blue-500 font-medium">
                              {app.offer?.title || "Offre"}
                            </Typography>
                          </div>
                          <Chip value={statusLabel(app.status)} color={statusColor(app.status)} size="sm" className="ml-2 flex-shrink-0" />
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-blue-gray-500 mt-2">
                          <span>📍 {app.offer?.location || "N/A"}</span>
                          <span>🗓️ {formatDate(app.created_at)}</span>
                          {app.cv_path && <span className="text-blue-500">📎 CV joint</span>}
                        </div>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Actions rapides */}
            <Card className="border border-blue-gray-100 shadow-sm">
              <CardBody className="p-6">
                <Typography variant="h6" className="font-bold text-blue-gray-900 mb-4">⚡ Actions rapides</Typography>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Publier une offre", icon: PlusIcon,         color: "blue",   path: "/enterprise/publish" },
                    { label: "Voir les offres",    icon: BriefcaseIcon,   color: "purple", path: "/enterprise/offersliste" },
                    { label: "Candidatures",       icon: DocumentTextIcon,color: "green",  path: "/enterprise/condidateurliste" },
                    { label: "Mon profil",         icon: UserCircleIcon,  color: "orange", path: "/enterprise/profile" },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button key={action.label} color={action.color} variant="outlined" fullWidth
                        onClick={() => navigate(action.path)} className="flex flex-col items-center gap-2 py-4 h-auto">
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{action.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}