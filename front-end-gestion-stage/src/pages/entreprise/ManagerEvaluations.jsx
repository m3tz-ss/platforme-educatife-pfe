import { useState, useEffect } from "react";
import {
  Button,
  Input,
  IconButton,
  Tooltip,
} from "@material-tailwind/react";
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChartBarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  StarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { InternalSidebarHeader } from "../../components/layout/SidebarHeaders";
import NotificationBell from "../../components/layout/NotificationBell";
import "./css/ManagerDashboard.css";

const AVATAR_COLORS = ["blue", "violet", "emerald", "orange", "rose", "cyan"];

const DECISION_CONFIG = {
  valide: { label: "✅ Validé", bg: "bg-green-50", text: "text-green-700" },
  a_ameliorer: { label: "⚠️ À améliorer", bg: "bg-orange-50", text: "text-orange-700" },
  non_conforme: { label: "❌ Non conforme", bg: "bg-red-50", text: "text-red-700" },
  pending: { label: "⌛ En attente", bg: "bg-gray-50", text: "text-gray-700" },
};

export default function ManagerEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
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

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/manager/evaluations");
      setEvaluations(res.data);
    } catch (err) {
      console.error("Erreur chargement évaluations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
    fetchUser();
  }, []);

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";
  const getAvatarColor = (idx) => AVATAR_COLORS[idx % AVATAR_COLORS.length];

  const filteredEvals = evaluations.filter((ev) =>
    ev.application?.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    ev.encadrant?.name?.toLowerCase().includes(search.toLowerCase()) ||
    ev.application?.offer?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const menuItems = [
    { icon: UserGroupIcon, label: "Gestion Utilisateurs", path: "/enterprise/manager" },
    { icon: MagnifyingGlassIcon, label: "Candidatures & Validations", path: "/enterprise/manager/applications" },
    { icon: BriefcaseIcon, label: "Toutes les Offres", path: "/enterprise/manager/offers" },
    { icon: SparklesIcon, label: "Recommandations IA", path: "/enterprise/ai-recommendations" },
    { icon: ChartBarIcon, label: "Suivi & Supervision", path: "/enterprise/manager/supervision" },
    { icon: ClipboardDocumentCheckIcon, label: "Évaluations Encadrants", path: "/enterprise/manager/evaluations" }
  ];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
                  <p className="dashboard-title"> </p>
                  <p className="dashboard-subtitle"></p>
                </div>
                <div className="flex items-center gap-3">
                    <NotificationBell apiPrefix="rh" />
                    <Button color="blue" variant="outlined" className="bg-white flex items-center gap-2" onClick={fetchEvaluations}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Actualiser
                    </Button>
                </div>
              </div>

              {/* ── Table ── */}
              <div className="table-card mt-6">
                <div className="table-header">
                  <p className="table-title">Évaluations déposées</p>
                  <div className="search-wrapper">
                    <Input
                      placeholder="Rechercher un étudiant..."
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
                    <p className="loading-text">Chargement des évaluations...</p>
                  </div>
                ) : filteredEvals.length === 0 ? (
                  <div className="empty-state">
                    <ClipboardDocumentCheckIcon className="empty-icon" />
                    <p className="empty-text">Aucune évaluation trouvée</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          {["Étudiant", "Offre", "Encadrant", "Note /20", "Décision", "Date"].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEvals.map((ev, idx) => {
                          const decision = DECISION_CONFIG[ev.final_decision] || DECISION_CONFIG.pending;
                          return (
                            <tr key={ev.id}>
                              <td>
                                <div className="user-cell">
                                  <div className={`avatar ${getAvatarColor(idx)}`}>
                                    {getInitial(ev.application?.student?.name)}
                                  </div>
                                  <div>
                                    <p className="user-name">{ev.application?.student?.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="max-w-[200px]">
                                    <p className="text-sm font-medium text-slate-800 truncate">
                                        {ev.application?.offer?.title}
                                    </p>
                                </div>
                              </td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-sm text-slate-800 font-bold">
                                        {ev.encadrant?.name}
                                      </span>
                                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                                        ev.encadrant?.role === 'manager' ? 'bg-blue-100 text-blue-700' : 
                                        ev.encadrant?.role === 'rh' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                      }`}>
                                        {ev.encadrant?.role === 'manager' ? 'Manager' : ev.encadrant?.role === 'rh' ? 'RH' : 'Encadrant'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              <td>
                                <div className="flex items-center gap-2">
                                    <StarIcon className={`w-4 h-4 ${ev.score >= 10 ? 'text-yellow-500' : 'text-red-400'}`} />
                                    <span className={`text-sm font-bold ${ev.score >= 10 ? 'text-slate-900' : 'text-red-600'}`}>
                                        {ev.score}
                                    </span>
                                </div>
                              </td>
                              <td>
                                <span className={`role-badge ${decision.bg} ${decision.text} border border-current`}>
                                  {decision.label}
                                </span>
                              </td>
                              <td>
                                <div className="flex items-center gap-2 text-slate-400">
                                  <CalendarDaysIcon className="w-4 h-4" />
                                  <span className="text-xs font-medium">
                                    {formatDate(ev.updated_at)}
                                  </span>
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
