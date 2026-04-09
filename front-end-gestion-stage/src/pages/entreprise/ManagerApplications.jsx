import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import ChatBox from "../../components/ChatBox";
import {
  Button,
  IconButton,
  Input,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import "./css/ManagerDashboard.css";

const AVATAR_COLORS = ["blue", "violet", "emerald", "orange", "rose", "cyan"];

export default function ManagerApplications() {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Evaluation state
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [evalForm, setEvalForm] = useState({ score: "", final_decision: "pending", notes: "" });
  const [evalLoading, setEvalLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, search]);

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

  const filterApplications = () => {
    let filtered = applications;
    if (search) {
      filtered = filtered.filter(
        (app) =>
          app.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
          app.offer?.title?.toLowerCase().includes(search.toLowerCase()) ||
          app.status?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredApplications(filtered);
  };

  // ✅ Manager Evaluation Methods
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    } catch { return dateStr; }
  };

  const getCvUrl = (cvPath) => {
    if (!cvPath) return null;
    if (cvPath.startsWith("http")) return cvPath;
    return `http://127.0.0.1:8000/storage/${cvPath}`;
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";
  const getAvatarColor = (idx) => AVATAR_COLORS[idx % AVATAR_COLORS.length];

  const getStatusBadge = (status) => {
    const statusConfig = {
      nouveau: { label: "Nouveau", cls: "role-badge" }, // default grey-blueish
      preselectionnee: { label: "Présélection", cls: "role-badge rh" },
      entretien: { label: "Entretien", cls: "role-badge encadrant" },
      acceptee: { label: "Acceptée", cls: "role-badge encadrant" }, // green-ish
      refusee: { label: "Refusée", cls: "role-badge" } // maybe red, you can add .rejected in css
    };
    const conf = statusConfig[status] || { label: status, cls: "role-badge" };
    
    // Add specific inline colors for known statuses since ManagerDashboard.css might not have them
    let colorStyle = {};
    if (status === 'acceptee') { colorStyle = { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }; }
    if (status === 'refusee') { colorStyle = { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }; }
    if (status === 'entretien') { colorStyle = { backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' }; }
    if (status === 'nouveau') { colorStyle = { backgroundColor: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd' }; }

    return <span className={conf.cls} style={colorStyle}>{conf.label}</span>;
  };

  const menuItems = [
    { icon: UserGroupIcon, label: "Gestion Utilisateurs", path: "/enterprise/manager", badge: null },
    { icon: MagnifyingGlassIcon, label: "Candidatures & Validations", path: "/enterprise/manager/applications", badge: null }
  ];

  return (
    <div className="dashboard-container flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col z-10 flex-shrink-0 border-r border-blue-gray-100">
        <div className="p-6 border-b border-blue-gray-100 flex flex-col items-start gap-1">
          <p className="font-bold text-blue-600 text-xl flex items-center gap-2">🏢 Espace Manager</p>
          <p className="text-xs text-blue-gray-500 font-medium">Administration</p>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = window.location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group cursor-pointer ${
                  active ? "bg-blue-50 text-blue-600 font-bold" : "text-blue-gray-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}>
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
        {/* ── Background blobs ── */}
        <div className="blob-top-right fixed pointer-events-none" />
        <div className="blob-bottom-left fixed pointer-events-none" />

        <div className="dashboard-wrapper min-h-screen relative z-10 w-full p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center w-full mb-4">
            <Link to="/enterprise/manager" className="back-link !mb-0">
                <ArrowLeftIcon className="back-link-icon" />
                Retour au Gestion des utilisateurs
            </Link>
        </div>

        {/* ── Main Card ── */}
        <div className="main-card">
          <div className="main-card-body">
            
            {/* ── Header ── */}
            <div className="dashboard-header flex-col items-start gap-2">
              <div>
                <p className="dashboard-title">📁 Candidatures & Validations</p>
                <p className="dashboard-subtitle">Gérez et validez les candidatures reçues par votre entreprise</p>
              </div>
            </div>

            {/* ── Table Card ── */}
            <div className="table-card mt-6">
              <div className="table-header">
                <div>
                  <p className="table-title">Candidatures Soumises</p>
                  <p className="table-count">
                    {filteredApplications.length} candidature{filteredApplications.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="search-wrapper">
                  <Input
                    placeholder="Rechercher par nom..."
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
                  <p className="loading-text">Chargement des candidatures...</p>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="empty-state">
                  <UserGroupIcon className="empty-icon" />
                  <p className="empty-text">Aucune candidature trouvée</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {["Candidat", "Offre", "Statut", "Date", "Actions"].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((app, idx) => (
                        <tr key={app.id}>
                          <td>
                            <div className="user-cell">
                              <div className={`avatar ${getAvatarColor(idx)}`}>
                                {getInitial(app.student?.name)}
                              </div>
                              <span className="user-name">{app.student?.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="user-email font-medium">{app.offer?.title}</span>
                          </td>
                          <td>
                            {getStatusBadge(app.status)}
                          </td>
                          <td>
                            <span className="user-email">{formatDate(app.created_at)}</span>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <IconButton variant="text" size="sm" color="blue" onClick={() => {
                                  setSelectedApplication(app);
                                  fetchEvaluation(app.id);
                                  setOpenModal(true);
                              }}>
                                <EyeIcon className="w-5 h-5" />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Détails & Evaluation ── */}
      <Dialog open={openModal} handler={() => setOpenModal(false)} size="lg" className="bg-white rounded-2xl">
        <DialogHeader className="border-b border-blue-gray-50 p-6">
          <div className="modal-header" style={{ width: "100%", margin: 0 }}>
            <div>
              <p className="modal-title font-black text-slate-900">{selectedApplication?.student?.name}</p>
              <p className="modal-subtitle text-slate-500">Détails de la candidature et validation {selectedApplication?.offer?.title ? `- ${selectedApplication.offer.title}` : ''}</p>
            </div>
            <IconButton variant="text" color="blue-gray" onClick={() => setOpenModal(false)}>
              <XMarkIcon className="w-5 h-5" />
            </IconButton>
          </div>
        </DialogHeader>

        <DialogBody className="p-6 max-h-[70vh] overflow-y-auto space-y-6 bg-slate-50/30">
          {selectedApplication && (
            <>
              {/* Infos */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <p className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2"><UserGroupIcon className="w-4 h-4 text-blue-500"/> Informations du Candidat</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nom complet</p>
                        <p className="text-sm font-medium text-slate-800">{selectedApplication.student?.name || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</p>
                        <p className="text-sm font-medium text-slate-800">{selectedApplication.student?.email || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date soumission</p>
                        <p className="text-sm font-medium text-slate-800">{formatDate(selectedApplication.created_at)}</p>
                    </div>
                    {getCvUrl(selectedApplication.cv_path || selectedApplication.cv) && (
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Curriculum Vitae</p>
                            <a href={getCvUrl(selectedApplication.cv_path || selectedApplication.cv)} target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition border border-blue-100">
                                <DocumentArrowDownIcon className="w-4 h-4"/> Voir le CV
                            </a>
                        </div>
                    )}
                </div>
              </div>

               {/* 📋 Validation du Stage (Manager) - Uniquement si accepté */}
               {selectedApplication.status === "acceptee" ? (
                <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
                  <p className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Validation du stage (Action Manager)
                  </p>
                  <p className="text-xs text-slate-500 mb-4 bg-blue-50/50 p-2 rounded-lg border border-blue-50/50">
                    Saisissez ici l'évaluation de fin de stage pour ce candidat.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Note finale /20</label>
                      <input type="number" min={0} max={20} step={0.5}
                        value={evalForm.score}
                        onChange={(e) => setEvalForm(f => ({ ...f, score: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Décision</label>
                      <select
                        value={evalForm.final_decision}
                        onChange={(e) => setEvalForm(f => ({ ...f, final_decision: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                        <option value="pending">En attente</option>
                        <option value="valide">✅ Validé</option>
                        <option value="a_ameliorer">⚠️ À améliorer</option>
                        <option value="non_conforme">❌ Non conforme</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Appréciation Managériale</label>
                    <textarea
                      value={evalForm.notes}
                      onChange={(e) => setEvalForm(f => ({ ...f, notes: e.target.value }))}
                      rows={3}
                      placeholder="Commentaires généraux sur le stage..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"/>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                      <Button onClick={() => saveEvaluation(selectedApplication.id)} disabled={evalLoading} color="blue" className="w-full sm:w-auto">
                        {evalLoading ? "Enregistrement..." : (evaluation ? "Mettre à jour l'évaluation" : "Délivrer la validation")}
                      </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-5 text-center">
                    <p className="text-sm font-semibold text-slate-500">Validation indisponible</p>
                    <p className="text-xs text-slate-400 mt-1">La validation s'active uniquement lorsque le statut de la candidature est "Acceptée".</p>
                </div>
              )}
            </>
          )}
        </DialogBody>
      </Dialog>
      <ChatBox />
      </div>{/* End flex-1 */}
    </div>
  );
}
