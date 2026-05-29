import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import ChatBox from "../../components/ChatBox";
import {
  Button,
  IconButton,
  Input,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import api from "../../services/api";
import { InternalSidebarHeader } from "../../components/layout/SidebarHeaders";
import NotificationBell from "../../components/layout/NotificationBell";
import CandidateHistoryModal from "../../components/CandidateHistoryModal";
import "./css/ManagerDashboard.css";

/* ── Constants ── */
const AVATAR_COLORS = ["blue", "violet", "emerald", "orange", "rose", "cyan"];

const DECISION_OPTIONS = [
  { value: "pending",       label: "En attente",    icon: "⏳", cls: "bg-gray-100 text-gray-600" },
  { value: "valide",        label: "Validé",         icon: "✅", cls: "bg-emerald-100 text-emerald-700" },
  { value: "a_ameliorer",   label: "À améliorer",    icon: "⚠️", cls: "bg-amber-100 text-amber-700" },
  { value: "non_conforme",  label: "Non conforme",   icon: "❌", cls: "bg-red-100 text-red-700" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all",       label: "Toutes" },
  { value: "acceptee",  label: "Acceptées" },
  { value: "termine",   label: "Stage terminé" },
];

const MENU_ITEMS = [
  { icon: UserGroupIcon,              label: "Gestion Utilisateurs",       path: "/enterprise/manager" },
  { icon: MagnifyingGlassIcon,        label: "Candidatures & Validations", path: "/enterprise/manager/applications" },
  { icon: BriefcaseIcon,              label: "Toutes les Offres",          path: "/enterprise/manager/offers" },
  { icon: ChartBarIcon,               label: "Suivi & Supervision",        path: "/enterprise/manager/supervision" },
  { icon: ClipboardDocumentCheckIcon, label: "Évaluations Encadrants",     path: "/enterprise/manager/evaluations" },
];

/* ── Helpers ── */
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
}

function getCvUrl(cvPath) {
  if (!cvPath) return null;
  if (cvPath.startsWith("http")) return cvPath;
  return `http://127.0.0.1:8000/storage/${cvPath}`;
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : "?";
}

function getAvatarColor(idx) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

/* ── Sidebar ── */
function Sidebar({ user }) {
  return (
    <aside className="w-64 bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col z-10 flex-shrink-0 border-r border-blue-gray-100">
      <div className="p-6 border-b border-blue-gray-100">
        <InternalSidebarHeader
          name={user?.name}
          email={user?.email}
          role={user?.role || "manager"}
          photoUrl={user?.photo_url}
        />
      </div>
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {MENU_ITEMS.map((item) => {
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
          <Button fullWidth color="red" variant="text" size="sm" className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </Button>
        </Link>
      </div>
    </aside>
  );
}

/* ── Decision Badge ── */
function DecisionBadge({ decision }) {
  const opt = DECISION_OPTIONS.find((d) => d.value === decision) || DECISION_OPTIONS[0];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${opt.cls}`}>
      {opt.icon} {opt.label}
    </span>
  );
}

/* ── Score Ring ── */
function ScoreRing({ score }) {
  if (score == null || score === "") return <span className="text-gray-400 text-sm">—</span>;
  const s = Number(score);
  const color = s >= 14 ? "text-emerald-600" : s >= 10 ? "text-amber-600" : "text-red-500";
  return (
    <span className={`text-lg font-extrabold ${color}`}>{s}<span className="text-xs font-medium text-gray-400">/20</span></span>
  );
}

/* ── Inline Evaluation Panel ── */
function EvaluationPanel({ app, evaluation, evalForm, evalLoading, onEvalFormChange, onSaveEvaluation }) {
  const isEligible = app.status === "acceptee" || app.status === "termine";

  if (!isEligible) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
        <ExclamationTriangleIcon className="w-6 h-6 mx-auto text-gray-300 mb-1" />
        <p className="text-xs text-gray-400 font-medium">Disponible uniquement pour les candidatures acceptées</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
          <CheckCircleSolid className="w-3.5 h-3.5" /> Évaluation de stage
        </p>
        {evaluation && (
          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">
            Déjà évalué
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Note /20</label>
          <input
            type="number" min={0} max={20} step={0.5}
            value={evalForm.score}
            onChange={(e) => onEvalFormChange("score", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            placeholder="Ex: 15"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Décision</label>
          <select
            value={evalForm.final_decision}
            onChange={(e) => onEvalFormChange("final_decision", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition bg-white"
          >
            {DECISION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Appréciation</label>
        <textarea
          value={evalForm.notes}
          onChange={(e) => onEvalFormChange("notes", e.target.value)}
          rows={2}
          placeholder="Commentaires sur le stage..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition resize-none"
        />
      </div>

      <Button
        onClick={() => onSaveEvaluation(app.id)}
        disabled={evalLoading}
        color="green"
        size="sm"
        className="w-full"
      >
        {evalLoading ? "Enregistrement..." : evaluation ? "Mettre à jour" : "✅ Valider le stage"}
      </Button>
    </div>
  );
}

/* ── Application Card ── */
function ApplicationCard({ app, index, evaluation, evalForm, evalLoading, onEvalFormChange, onSaveEvaluation, onViewHistory, expanded, onToggle }) {
  const cvUrl = getCvUrl(app.cv_path || app.cv);
  const statusLabel = {
    acceptee: { label: "Acceptée", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
    termine:  { label: "Stage terminé", cls: "bg-indigo-100 text-indigo-700 border border-indigo-200" },
  }[app.status] || { label: app.status, cls: "bg-gray-100 text-gray-600" };

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
      expanded ? "border-emerald-300 shadow-lg" : "border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200"
    }`}>
      {/* ── Card Header ── */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer"
        onClick={onToggle}
      >
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 avatar ${getAvatarColor(index)}`}>
          {getInitial(app.student?.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 text-sm">{app.student?.name || "Candidat"}</p>
            {app.student?.is_in_internship && (
              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Déjà en stage</span>
            )}
          </div>
          <p className="text-xs text-blue-600 font-medium truncate">{app.offer?.title || "Offre"}</p>
          <p className="text-xs text-gray-400 mt-0.5">🗓️ {formatDate(app.created_at)}</p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Score si déjà évalué */}
          {evaluation && <ScoreRing score={evaluation.score} />}

          {/* Decision badge si déjà évalué */}
          {evaluation?.final_decision && evaluation.final_decision !== "pending" && (
            <DecisionBadge decision={evaluation.final_decision} />
          )}

          {/* Statut candidature */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusLabel.cls}`}>
            {statusLabel.label}
          </span>

          {/* Actions */}
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {cvUrl && (
              <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                <IconButton variant="text" size="sm" color="blue" title="Voir CV">
                  <DocumentArrowDownIcon className="w-4 h-4" />
                </IconButton>
              </a>
            )}
            <IconButton
              variant="text" size="sm" color="purple"
              title="Historique des stages"
              onClick={() => onViewHistory(app.student)}
            >
              <ClockIcon className="w-4 h-4" />
            </IconButton>
          </div>

          {/* Chevron */}
          <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* ── Expanded Evaluation Panel ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 bg-gray-50/50">
          {/* Infos candidat complémentaires */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Email", value: app.student?.email },
              { label: "Téléphone", value: app.student?.phone },
              { label: "Offre", value: app.offer?.title },
              { label: "Durée", value: app.offer?.duration },
            ].map(({ label, value }) => value ? (
              <div key={label} className="bg-white rounded-lg border border-gray-100 p-2.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-xs font-medium text-gray-700 truncate mt-0.5">{value}</p>
              </div>
            ) : null)}
          </div>

          <EvaluationPanel
            app={app}
            evaluation={evaluation}
            evalForm={evalForm}
            evalLoading={evalLoading}
            onEvalFormChange={onEvalFormChange}
            onSaveEvaluation={onSaveEvaluation}
          />
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function ManagerValidations() {
  const [applications, setApplications]               = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [search, setSearch]                           = useState("");
  const [statusFilter, setStatusFilter]               = useState("all");
  const [loading, setLoading]                         = useState(true);
  const [error, setError]                             = useState(null);
  const [user, setUser]                               = useState(null);
  const [expandedId, setExpandedId]                   = useState(null);

  // Per-card evaluation state: { [appId]: { evaluation, evalForm, evalLoading } }
  const [evalStates, setEvalStates] = useState({});

  // Candidate history
  const [selectedStudent,  setSelectedStudent]  = useState(null);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [candidateHistory, setCandidateHistory] = useState(null);
  const [historyLoading,   setHistoryLoading]   = useState(false);

  /* ── Fetch ── */
  const fetchUser = async () => {
    try { const r = await api.get("/user/profile"); setUser(r.data); }
    catch { /* ignore */ }
  };

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get("/enterprise/applications");
      const all = Array.isArray(res.data) ? res.data : res.data.data || [];
      // Only acceptee + termine
      const eligible = all.filter((a) => a.status === "acceptee" || a.status === "termine");
      setApplications(eligible);
    } catch (err) {
      const msg = err.response?.data?.message || "Impossible de charger les candidatures.";
      setError(msg);
    } finally { setLoading(false); }
  }, []);

  const fetchEvaluationForApp = useCallback(async (appId) => {
    try {
      const res = await api.get(`/rh/applications/${appId}/evaluation`);
      const ev = res.data;
      setEvalStates((prev) => ({
        ...prev,
        [appId]: {
          evaluation: ev,
          evalForm: ev ? {
            score: ev.score != null ? String(ev.score) : "",
            final_decision: ev.final_decision || "pending",
            notes: ev.notes || "",
          } : { score: "", final_decision: "pending", notes: "" },
          evalLoading: false,
        },
      }));
    } catch {
      setEvalStates((prev) => ({
        ...prev,
        [appId]: {
          evaluation: null,
          evalForm: { score: "", final_decision: "pending", notes: "" },
          evalLoading: false,
        },
      }));
    }
  }, []);

  /* ── Filter ── */
  useEffect(() => {
    let filtered = applications;
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.student?.name?.toLowerCase().includes(q) ||
          a.offer?.title?.toLowerCase().includes(q)
      );
    }
    setFilteredApplications(filtered);
  }, [applications, search, statusFilter]);

  /* ── Toggle card: fetch evaluation lazily ── */
  const handleToggle = useCallback((appId) => {
    setExpandedId((prev) => {
      const next = prev === appId ? null : appId;
      if (next && !evalStates[next]) {
        fetchEvaluationForApp(next);
      }
      return next;
    });
  }, [evalStates, fetchEvaluationForApp]);

  /* ── Eval form change ── */
  const handleEvalFormChange = useCallback((appId, field, value) => {
    setEvalStates((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        evalForm: { ...(prev[appId]?.evalForm || {}), [field]: value },
      },
    }));
  }, []);

  /* ── Save Evaluation ── */
  const saveEvaluation = useCallback(async (appId) => {
    const state = evalStates[appId];
    if (!state) return;
    const { evalForm } = state;
    setEvalStates((prev) => ({ ...prev, [appId]: { ...prev[appId], evalLoading: true } }));
    try {
      const res = await api.put(`/rh/applications/${appId}/evaluation`, {
        score: evalForm.score === "" ? null : Number(evalForm.score),
        final_decision: evalForm.final_decision,
        notes: evalForm.notes || null,
      });
      setEvalStates((prev) => ({
        ...prev,
        [appId]: { ...prev[appId], evaluation: res.data, evalLoading: false },
      }));
      Swal.fire({ icon: "success", title: "Validation enregistrée", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: err.response?.data?.message || "Impossible d'enregistrer." });
      setEvalStates((prev) => ({ ...prev, [appId]: { ...prev[appId], evalLoading: false } }));
    }
  }, [evalStates]);

  /* ── Candidate history ── */
  const handleViewHistory = useCallback(async (student) => {
    if (!student?.id) return;
    setSelectedStudent(student);
    setOpenHistoryModal(true);
    setHistoryLoading(true);
    setCandidateHistory(null);
    try {
      const res = await api.get(`/rh/candidates/${student.id}/history`);
      setCandidateHistory(res.data);
    } catch {
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible de charger l'historique.", confirmButtonColor: "#ef4444" });
      setOpenHistoryModal(false);
    } finally { setHistoryLoading(false); }
  }, []);

  /* ── Init ── */
  useEffect(() => { fetchApplications(); fetchUser(); }, [fetchApplications]);

  /* ── Stats ── */
  const totalEligible  = applications.length;
  const totalEvaluated = Object.values(evalStates).filter((s) => s?.evaluation).length;
  const totalPending   = totalEligible - totalEvaluated;
  const totalAccepted  = applications.filter((a) => a.status === "acceptee").length;
  const totalTermine   = applications.filter((a) => a.status === "termine").length;

  // ══════════════════════════════════════════════════════════════
  return (
    <div className="dashboard-container flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 relative overflow-y-auto w-full">
        <div className="blob-top-right fixed pointer-events-none" />
        <div className="blob-bottom-left fixed pointer-events-none" />

        <div className="dashboard-wrapper min-h-screen relative z-10 w-full p-4 sm:p-6 lg:p-8">

          {/* ── Back ── */}
          <div className="flex justify-between items-center w-full mb-6">
            <Link to="/enterprise/manager/applications" className="back-link !mb-0">
              <ArrowLeftIcon className="back-link-icon" />
              Retour aux candidatures
            </Link>
            <div className="flex items-center gap-3">
              <NotificationBell apiPrefix="rh" />
              <button
                onClick={fetchApplications}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm hover:shadow transition"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" /> Actualiser
              </button>
            </div>
          </div>

          {/* ── Hero Header ── */}
          <div className="relative rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg mb-8 overflow-hidden">
            <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute bottom-0 left-32 w-24 h-24 bg-white/5 rounded-full" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardDocumentCheckIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight">Validation des Stages</h1>
                  <p className="text-emerald-100 text-sm">Évaluation finale des stagiaires acceptés</p>
                </div>
              </div>
              <div className="sm:ml-auto flex items-center gap-2 text-xs font-semibold bg-white/15 px-4 py-2 rounded-xl">
                <CheckCircleSolid className="w-4 h-4 text-emerald-200" />
                {totalEvaluated} / {totalEligible} évalués
              </div>
            </div>
          </div>

          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Éligibles",   value: totalEligible,  icon: "👥", color: "text-gray-800",     bg: "bg-white" },
              { label: "Acceptées",   value: totalAccepted,  icon: "✅", color: "text-emerald-700",  bg: "bg-emerald-50" },
              { label: "Stage terminé", value: totalTermine, icon: "🎓", color: "text-indigo-700",   bg: "bg-indigo-50" },
              { label: "À évaluer",   value: totalPending,   icon: "⏳", color: "text-amber-700",    bg: "bg-amber-50" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl border border-gray-100 shadow-sm p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{s.icon}</span>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par candidat ou offre…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex gap-2 flex-wrap">
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatusFilter(opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        statusFilter === opt.value
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
              <XCircleIcon className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── List ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
              <p className="text-gray-400 text-sm animate-pulse">Chargement des candidatures…</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-dashed border-gray-200">
              <ClipboardDocumentCheckIcon className="w-14 h-14 text-gray-300" />
              <p className="text-gray-500 font-medium">Aucune candidature éligible trouvée</p>
              <p className="text-gray-400 text-xs max-w-xs text-center">
                Seules les candidatures au statut "Acceptée" ou "Stage terminé" apparaissent ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {filteredApplications.length} candidature{filteredApplications.length > 1 ? "s" : ""} — cliquez pour évaluer
              </p>
              {filteredApplications.map((app, idx) => {
                const state = evalStates[app.id] || {};
                return (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    index={idx}
                    evaluation={state.evaluation || null}
                    evalForm={state.evalForm || { score: "", final_decision: "pending", notes: "" }}
                    evalLoading={state.evalLoading || false}
                    onEvalFormChange={(field, value) => handleEvalFormChange(app.id, field, value)}
                    onSaveEvaluation={saveEvaluation}
                    onViewHistory={handleViewHistory}
                    expanded={expandedId === app.id}
                    onToggle={() => handleToggle(app.id)}
                  />
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ── CandidateHistoryModal ── */}
      <CandidateHistoryModal
        open={openHistoryModal}
        student={selectedStudent}
        history={candidateHistory}
        loading={historyLoading}
        onClose={() => { setOpenHistoryModal(false); setSelectedStudent(null); setCandidateHistory(null); }}
      />

      <ChatBox />
    </div>
  );
}