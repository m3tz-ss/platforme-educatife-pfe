import { useState, useEffect } from "react";
import {
  Button,
  Input,
  IconButton,
  Progress,
  Tooltip,
} from "@material-tailwind/react";
import {
  ChartBarIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  BriefcaseIcon,
  UserCircleIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { InternalSidebarHeader } from "../../components/layout/SidebarHeaders";
import NotificationBell from "../../components/layout/NotificationBell";
import "./css/ManagerDashboard.css";

const AVATAR_COLORS = ["blue", "violet", "emerald", "orange", "rose", "cyan"];

const STATUS_CONFIG = {
  nouveau: { label: "Nouveau", color: "blue", bg: "bg-blue-50", text: "text-blue-700" },
  preselectionnee: { label: "Présélection", color: "indigo", bg: "bg-indigo-50", text: "text-indigo-700" },
  entretien: { label: "Entretien", color: "purple", bg: "bg-purple-50", text: "text-purple-700" },
  acceptee: { label: "Accepté", color: "green", bg: "bg-green-50", text: "text-green-700" },
  refusee: { label: "Refusé", color: "red", bg: "bg-red-50", text: "text-red-700" },
  termine: { label: "Stage Terminé", color: "teal", bg: "bg-teal-50", text: "text-teal-700" },
};

export default function ManagerSupervision() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await api.get("/user/profile");
      setUser(res.data);
    } catch (err) {
      console.error("Erreur profil:", err);
    }
  };

  const fetchSupervision = async () => {
    setLoading(true);
    try {
      const res = await api.get("/manager/supervision-overview");
      setData(res.data);
    } catch (err) {
      console.error("Erreur chargement supervision:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervision();
    fetchUser();
  }, []);

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";
  const getAvatarColor = (idx) => AVATAR_COLORS[idx % AVATAR_COLORS.length];

  const filteredData = data.filter((item) =>
    item.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.offer?.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.encadrant?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.offer?.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Candidats suivis", value: data.length, icon: UserGroupIcon, color: "blue" },
    { label: "Stages en cours", value: data.filter(d => d.status === 'acceptee').length, icon: BriefcaseIcon, color: "emerald" },
    { label: "En attente", value: data.filter(d => d.status !== 'acceptee' && d.status !== 'refusee' && d.status !== 'termine').length, icon: ChartBarIcon, color: "orange" },
  ];

  const menuItems = [
    { icon: UserGroupIcon, label: "Gestion Utilisateurs", path: "/enterprise/manager" },
    { icon: MagnifyingGlassIcon, label: "Candidatures & Validations", path: "/enterprise/manager/applications" },
    { icon: BriefcaseIcon, label: "Toutes les Offres", path: "/enterprise/manager/offers" },
    { icon: SparklesIcon, label: "Recommandations IA", path: "/enterprise/ai-recommendations" },
    { icon: ChartBarIcon, label: "Suivi & Supervision", path: "/enterprise/manager/supervision" },
    { icon: ClipboardDocumentCheckIcon, label: "Évaluations Encadrants", path: "/enterprise/manager/evaluations" }
  ];

  return (
    <div className="dashboard-container flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col z-10 flex-shrink-0 border-r border-blue-gray-100">
        <div className="p-6 border-b border-blue-gray-100">
          <InternalSidebarHeader
            name={user?.name}
            email={user?.email}
            role={user?.role || 'manager'}
            photoUrl={user?.photo_url}
            enterpriseName={user?.company_name}
          />
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = window.location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group cursor-pointer ${active ? "bg-blue-50 text-blue-600 font-bold" : "text-blue-gray-600 hover:bg-slate-50 hover:text-slate-900 font-medium"}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? "text-blue-600" : "text-blue-gray-400 group-hover:text-blue-gray-600"}`} />
                  <span className="text-sm truncate">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-blue-gray-100">
          <Link to="/auth/sign-in">
            <Button fullWidth color="red" variant="text" size="sm" className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 active:bg-red-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Déconnexion
            </Button>
          </Link>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 relative overflow-y-auto w-full">
        <div className="blob-top-right fixed pointer-events-none" />
        <div className="blob-bottom-left fixed pointer-events-none" />

        <div className="dashboard-wrapper min-h-screen relative z-10 w-full p-4 sm:p-6 lg:p-8">
          <div className="main-card">
            <div className="main-card-body">
              {/* ── Header ── */}
              <div className="dashboard-header">
                <div>
                  <p className="dashboard-title"></p>
                  <p className="dashboard-subtitle"></p>
                </div>
                <div className="flex items-center gap-3">
                    <NotificationBell apiPrefix="rh" />
                    <Button color="blue" variant="outlined" className="bg-white flex items-center gap-2" onClick={fetchSupervision}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Actualiser
                    </Button>
                </div>
              </div>

              {/* ── Stats ── */}
              <div className="stats-grid">
                {stats.map((stat) => (
                  <div key={stat.label} className="stat-card">
                    <div className={`stat-card-bar ${stat.color}`} />
                    <div className="stat-card-content">
                      <div className={`stat-icon-wrapper ${stat.color}`}>
                        <stat.icon className={`stat-icon ${stat.color}`} />
                      </div>
                      <div>
                        <p className="stat-value">{stat.value}</p>
                        <p className="stat-label">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Table ── */}
              <div className="table-card mt-6">
                <div className="table-header">
                  <p className="table-title">Liste des Candidats</p>
                  <div className="search-wrapper">
                    <Input
                      placeholder="Étudiant, RH, Encadrant..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                      className="!border-blue-gray-200"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="loading-state">
                    <div className="spinner" />
                    <p className="loading-text">Analyse des données...</p>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="empty-state">
                    <UserCircleIcon className="empty-icon" />
                    <p className="empty-text">Aucune donnée trouvée</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          {["Étudiant", "Offre", "Recruteur (RH)", "Encadrant", "Statut", "Avancement"].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((item, idx) => {
                          const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.nouveau;
                          return (
                            <tr key={item.id}>
                              <td>
                                <div className="user-cell">
                                  <div className={`avatar ${getAvatarColor(idx)}`}>
                                    {getInitial(item.student?.name)}
                                  </div>
                                  <div>
                                    <p className="user-name">{item.student?.name}</p>
                                    <p className="text-[10px] text-gray-400">{item.student?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="max-w-[200px]">
                                    <p className="text-sm font-medium text-slate-800 truncate" title={item.offer?.title}>
                                        {item.offer?.title}
                                    </p>
                                </div>
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <UserCircleIcon className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm text-slate-600 font-medium">
                                    {item.offer?.user?.name || "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <AcademicCapIcon className="w-4 h-4 text-blue-400" />
                                  <span className="text-sm text-slate-600 font-medium">
                                    {item.encadrant?.name || <span className="text-gray-300 italic">Non assigné</span>}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className={`role-badge ${status.bg} ${status.text} border border-current opacity-80`}>
                                  {status.label}
                                </span>
                              </td>
                              <td>
                                <div className="w-full min-w-[120px]">
                                    {item.status === 'acceptee' || item.status === 'termine' ? (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                                <span>{item.progress}%</span>
                                                <span>{item.stats?.completed_tasks}/{item.stats?.total_tasks} tâches</span>
                                            </div>
                                            <Progress value={item.progress} size="sm" color={item.progress === 100 ? "green" : "blue"} />
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-300 italic">En attente d'acceptation</span>
                                    )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
