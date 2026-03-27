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
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";
import StudentNotificationBell from "../../components/student/StudentNotificationBell";

// ─── Constantes statuts tâches ────────────────────────────────────────────────
const TASK_STATUS_OPTS = [
  { value: "todo",        label: "À faire"  },
  { value: "in_progress", label: "En cours" },
  { value: "done",        label: "Terminé"  },
];

const TASK_STATUS_STYLES = {
  todo:        { chip: "bg-slate-100 text-slate-600 border-slate-200",  dot: "bg-slate-400",             row: "" },
  in_progress: { chip: "bg-amber-50  text-amber-700  border-amber-200", dot: "bg-amber-400",             row: "bg-amber-50/30" },
  done:        { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500",       row: "bg-emerald-50/20" },
};

// ─── Badge statut tâche ───────────────────────────────────────────────────────
function TaskStatusBadge({ status }) {
  const s = TASK_STATUS_STYLES[status] || TASK_STATUS_STYLES.todo;
  const label = TASK_STATUS_OPTS.find((o) => o.value === status)?.label || status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

// ─── Panel commentaires par tâche ─────────────────────────────────────────────
function TaskCommentPanel({ task }) {
  const [open, setOpen] = useState(false);
  const comments =
    task.comments ||
    task.task_comments ||
    task.taskComments ||
    task.feedback ||
    task.feedbacks ||
    [];
  const count = Array.isArray(comments) ? comments.length : 0;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {count} commentaire{count !== 1 ? "s" : ""}
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 bg-slate-50 rounded-xl border border-slate-100 p-3 space-y-2">
          {count === 0 ? (
            <p className="text-xs text-slate-400 italic">Aucun commentaire pour l'instant.</p>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {comments.map((c, idx) => {
                const authorName = c.user?.name || c.author?.name || c.author_name || c.userName || "Utilisateur";
                const body       = c.body || c.content || c.message || c.text || "";
                const createdAt  = c.created_at || c.createdAt || c.date || null;
                return (
                  <div key={c.id ?? idx} className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                        {authorName[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{authorName}</span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {createdAt ? new Date(createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap leading-relaxed">{body}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tableau des tâches (vue lecture seule pour étudiant dans la modale) ──────
function SupervisionTaskTable({ tasks = [] }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy]             = useState("due_date");

  const normalized = tasks.map((t) => ({
    ...t,
    comments:
      t.comments || t.task_comments || t.taskComments || t.feedback || t.feedbacks || [],
  }));

  const filtered = normalized
    .filter((t) => filterStatus === "all" || t.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "due_date") return (a.due_date || "").localeCompare(b.due_date || "");
      if (sortBy === "title")    return a.title.localeCompare(b.title);
      if (sortBy === "status")   return a.status.localeCompare(b.status);
      return 0;
    });

  const stats = {
    total:       tasks.length,
    todo:        tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done:        tasks.filter((t) => t.status === "done").length,
  };
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total",    value: stats.total,       color: "text-slate-700",   bg: "bg-slate-50  border-slate-200"   },
          { label: "À faire",  value: stats.todo,        color: "text-slate-600",   bg: "bg-slate-50  border-slate-200"   },
          { label: "En cours", value: stats.in_progress, color: "text-amber-700",   bg: "bg-amber-50  border-amber-200"   },
          { label: "Terminé",  value: stats.done,        color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-3 py-2 ${s.bg}`}>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres + tri */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Filtre :</span>
          {[{ value: "all", label: "Tous" }, ...TASK_STATUS_OPTS].map((o) => (
            <button
              key={o.value}
              onClick={() => setFilterStatus(o.value)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                filterStatus === o.value
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Trier :</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-200 text-slate-700"
          >
            <option value="due_date">Échéance</option>
            <option value="title">Titre</option>
            <option value="status">Statut</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">Aucune tâche{filterStatus !== "all" ? " pour ce filtre" : ""}.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          {/* En-tête colonnes */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] bg-slate-50 border-b border-slate-200 px-3 py-2 gap-3">
            {["Tâche", "Échéance", "Statut", "Commentaires"].map((h) => (
              <span key={h} className="text-xs font-bold text-slate-400 uppercase tracking-wide">{h}</span>
            ))}
          </div>

          {/* Lignes */}
          <div className="divide-y divide-slate-100">
            {filtered.map((task) => {
              const rowStyle  = TASK_STATUS_STYLES[task.status]?.row || "";
              const isOverdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
              return (
                <div
                  key={task.id}
                  className={`grid grid-cols-[2fr_1fr_1fr_1.5fr] px-3 py-3 gap-3 items-start hover:bg-slate-50/80 transition-colors ${rowStyle}`}
                >
                  {/* Titre + description */}
                  <div>
                    <p className="font-semibold text-sm text-slate-900 leading-snug">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                    )}
                  </div>

                  {/* Échéance */}
                  <div className="pt-0.5">
                    {task.due_date ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${isOverdue ? "text-red-600" : "text-slate-600"}`}>
                        {isOverdue && (
                          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {new Date(task.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>

                  {/* Badge statut */}
                  <div className="pt-0.5">
                    <TaskStatusBadge status={task.status} />
                  </div>

                  {/* Commentaires */}
                  <div>
                    <TaskCommentPanel task={task} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer barre de progression */}
          <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {filtered.length} tâche{filtered.length !== 1 ? "s" : ""}
              {filterStatus !== "all" ? " (filtrées)" : ""}
            </p>
            {stats.total > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium">{pct}% complété</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section commentaires globaux de l'encadrant ─────────────────────────────
function EncadrantComments({ comments = [] }) {
  if (comments.length === 0) {
    return <p className="text-sm text-slate-400 italic">Aucun commentaire général pour l'instant.</p>;
  }
  return (
    <div className="space-y-2">
      {comments.map((c, idx) => (
        <div key={c.id ?? idx} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
              {(c.encadrant?.name || c.user?.name || "E")[0].toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {c.encadrant?.name || c.user?.name || "Encadrant"}
            </span>
            <span className="text-xs text-slate-400 ml-auto">
              {c.created_at ? new Date(c.created_at).toLocaleString("fr-FR") : ""}
            </span>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {c.body || c.content || c.message || ""}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Section évaluation ───────────────────────────────────────────────────────
function EvaluationSection({ evaluation }) {
  const encDecisionLabel = (d) =>
    ({ pending: "En attente", valide: "Validé", a_ameliorer: "À améliorer", non_conforme: "Non conforme" }[d] || d || "—");

  const decisionStyle = (d) => {
    if (d === "valide")        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (d === "a_ameliorer")   return "bg-amber-50 text-amber-700 border-amber-200";
    if (d === "non_conforme")  return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  if (!evaluation) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center">
        <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <p className="text-sm text-slate-500 font-medium">Aucune évaluation publiée</p>
        <p className="text-xs text-slate-400 mt-1">L'évaluation finale sera disponible à la fin du stage.</p>
      </div>
    );
  }

  const score = evaluation.score ?? evaluation.note ?? null;

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
      {/* Header évaluation */}
      <div className="bg-gradient-to-r from-emerald-50 to-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <span className="font-bold text-slate-800 text-sm">Évaluation de fin de stage</span>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${decisionStyle(evaluation.final_decision)}`}>
          {encDecisionLabel(evaluation.final_decision)}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Note */}
        {score != null && (
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray={`${(score / 20) * 100} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-slate-800">{score}</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{score}<span className="text-base font-medium text-slate-400">/20</span></p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Note finale</p>
            </div>
          </div>
        )}

        {/* Appréciation */}
        {evaluation.notes && (
          <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Appréciation</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{evaluation.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function MyApplications() {
  const [applications,        setApplications]        = useState([]);
  const [sidebarOpen,         setSidebarOpen]         = useState(true);
  const [loading,             setLoading]             = useState(true);
  const [selectedApp,         setSelectedApp]         = useState(null);
  const [openModal,           setOpenModal]           = useState(false);
  const [interviews,          setInterviews]          = useState([]);
  const [loadingInterviews,   setLoadingInterviews]   = useState(false);
  const [activeTab,           setActiveTab]           = useState("info");
  const [supervision,         setSupervision]         = useState(null);
  const [loadingSupervision,  setLoadingSupervision]  = useState(false);

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    } catch { return dateStr; }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/my-applications");
      setApplications(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Erreur chargement candidatures", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async (applicationId) => {
    try {
      setLoadingInterviews(true);
      const res = await api.get(`/student/applications/${applicationId}/interviews`);
      setInterviews(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch { setInterviews([]); }
    finally { setLoadingInterviews(false); }
  };

  const fetchSupervision = async (applicationId) => {
    try {
      setLoadingSupervision(true);
      const res = await api.get(`/student/applications/${applicationId}/supervision`);
      // Normaliser les tâches : forcer clé "comments" unifiée
      const data = res.data;
      if (data?.tasks) {
        data.tasks = data.tasks.map((t) => ({
          ...t,
          comments: t.comments || t.task_comments || t.taskComments || t.feedback || t.feedbacks || [],
        }));
      }
      setSupervision(data);
    } catch { setSupervision(null); }
    finally { setLoadingSupervision(false); }
  };

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
      Swal.fire({ icon: "success", title: "Candidature retirée", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: err.response?.data?.message || "Erreur lors du retrait", confirmButtonColor: "#ef4444" });
    }
  };

  const handleContactEnterprise = async (appId) => {
    try {
      await api.post(`/applications/${appId}/contact`, {});
      Swal.fire({ icon: "success", title: "Message envoyé", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: err.response?.data?.message || "Erreur envoi message", confirmButtonColor: "#ef4444" });
    }
  };

  const statusMap = {
    nouveau: "pending", preselectionnee: "reviewing",
    entretien: "interview", acceptee: "accepted", refusee: "rejected",
  };
  const normalizeStatus = (s) => statusMap[s] || s;

  const statusColor = (s) => {
    switch (normalizeStatus(s)) {
      case "accepted":  return "green";
      case "rejected":  return "red";
      case "interview": return "purple";
      case "reviewing": return "amber";
      default:          return "orange";
    }
  };

  const statusLabel = (s) => {
    switch (normalizeStatus(s)) {
      case "accepted":  return "✅ Accepté";
      case "rejected":  return "❌ Rejeté";
      case "interview": return "📞 Entretien planifié";
      case "reviewing": return "👀 Présélectionnée";
      default:          return "⏳ En attente";
    }
  };

  const getStatusMessage = (status) => {
    switch (normalizeStatus(status)) {
      case "accepted":  return { icon: "🎉", title: "Félicitations!", message: "Votre candidature a été acceptée. L'entreprise vous contactera bientôt.", bgColor: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700" };
      case "rejected":  return { icon: "😔", title: "Candidature refusée", message: "Malheureusement, votre candidature n'a pas été retenue. Ne baissez pas les bras!", bgColor: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-700" };
      case "interview": return { icon: "📞", title: "Entretien planifié", message: "L'entreprise souhaite vous rencontrer. Vérifiez vos messages pour plus de détails.", bgColor: "bg-purple-50", borderColor: "border-purple-200", textColor: "text-purple-700" };
      case "reviewing": return { icon: "👀", title: "Présélectionnée", message: "Votre candidature a plu à l'entreprise! Vous êtes en cours d'examen.", bgColor: "bg-amber-50", borderColor: "border-amber-200", textColor: "text-amber-700" };
      default:          return { icon: "⏳", title: "En cours d'examen", message: "Votre candidature est en cours d'examen par l'entreprise.", bgColor: "bg-orange-50", borderColor: "border-orange-200", textColor: "text-orange-700" };
    }
  };

  const acceptedCount  = applications.filter((a) => normalizeStatus(a.status) === "accepted").length;
  const rejectedCount  = applications.filter((a) => normalizeStatus(a.status) === "rejected").length;
  const interviewCount = applications.filter((a) => normalizeStatus(a.status) === "interview").length;
  const reviewingCount = applications.filter((a) => normalizeStatus(a.status) === "reviewing").length;
  const pendingCount   = applications.filter((a) => normalizeStatus(a.status) === "pending").length;

  const menuItems = [
    { icon: HomeIcon,                  label: "Tableau de bord",    path: "/student",              badge: null },
    { icon: BriefcaseIcon,             label: "Offres de stage",    path: "/student/offers",       badge: null },
    { icon: CheckCircleIcon,           label: "Mes candidatures",   path: "/student/applications", badge: applications.length },
    { icon: ClipboardDocumentListIcon, label: "Mes tâches",         path: "/student/tasks",        badge: null },
    { icon: BookmarkIcon,              label: "Offres sauvegardées",path: "/student/saved",        badge: null },
    { icon: ChatBubbleLeftIcon,        label: "Messages",           path: "/student/messages",     badge: null },
    { icon: UserCircleIcon,            label: "Mon profil",         path: "/student/profile",      badge: null },
  ];

  // ─── Onglet encadrement ────────────────────────────────────────────────────
  const renderEncadrementTab = () => {
    if (loadingSupervision) {
      return (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Chargement de l'encadrement…
        </div>
      );
    }

    if (!supervision) {
      return (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-slate-600">Impossible de charger les données d'encadrement.</p>
        </div>
      );
    }

    const tasks     = supervision.tasks    || [];
    const comments  = supervision.comments || [];
    const evaluation= supervision.evaluation || null;

    return (
      <div className="space-y-8 p-6">

        {/* ── Encadrant ── */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-500 rounded-full" />
            Votre encadrant
          </h3>
          {supervision.encadrant ? (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {supervision.encadrant.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{supervision.encadrant.name}</p>
                {supervision.encadrant.email && (
                  <p className="text-xs text-slate-500">{supervision.encadrant.email}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              Aucun encadrant assigné pour l'instant.
            </p>
          )}
        </div>

        {/* ── Tableau des tâches ── */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-indigo-500 rounded-full" />
            Tâches de stage
            <span className="ml-auto text-xs font-normal text-slate-400 normal-case tracking-normal">
              {tasks.length} tâche{tasks.length !== 1 ? "s" : ""}
            </span>
          </h3>
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucune tâche définie pour l'instant.</p>
          ) : (
            <SupervisionTaskTable tasks={tasks} />
          )}
        </div>

        {/* ── Commentaires globaux de l'encadrant ── */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-amber-400 rounded-full" />
            Feedback général de l'encadrant
            <span className="ml-auto text-xs font-normal text-slate-400 normal-case tracking-normal">
              {comments.length} commentaire{comments.length !== 1 ? "s" : ""}
            </span>
          </h3>
          <EncadrantComments comments={comments} />
        </div>

        {/* ── Évaluation finale ── */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
            Évaluation finale
          </h3>
          <EvaluationSection evaluation={evaluation} />
        </div>

      </div>
    );
  };

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
        <div className="mx-6 border-t border-blue-gray-100" />
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

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-blue-gray-100">
          <div className="px-6 py-4 flex justify-between items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-blue-gray-50 rounded-lg transition-colors">
              {sidebarOpen ? <XMarkIcon className="w-6 h-6 text-blue-gray-600" /> : <Bars3Icon className="w-6 h-6 text-blue-gray-600" />}
            </button>
            <Typography variant="h5" className="font-bold text-blue-gray-900">Mes Candidatures</Typography>
            <div className="flex gap-3 items-center">
              <StudentNotificationBell />
              <IconButton variant="text" color="blue-gray"><ChatBubbleLeftIcon className="w-5 h-5" /></IconButton>
              <IconButton variant="text" color="blue-gray"><UserCircleIcon className="w-5 h-5" /></IconButton>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Statistiques */}
            <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {[
                { label: "Total",      value: applications.length,          color: "text-blue-gray-900", sub: "Soumises",   subColor: "text-blue-500"   },
                { label: "Acceptées",  value: acceptedCount,                color: "text-green-500",     sub: "✅ Succès",   subColor: "text-green-500"  },
                { label: "Entretiens", value: interviewCount,               color: "text-purple-500",    sub: "📞 Planifiés",subColor: "text-purple-500" },
                { label: "En cours",   value: pendingCount + reviewingCount,color: "text-orange-500",    sub: "⏳ En cours", subColor: "text-orange-500" },
                { label: "Rejetées",   value: rejectedCount,                color: "text-red-500",       sub: "❌ Refusées", subColor: "text-red-500"    },
              ].map((stat) => (
                <Card key={stat.label} className="p-4 shadow-sm border border-blue-gray-100 hover:shadow-lg transition">
                  <Typography className="text-blue-gray-500 text-sm">{stat.label}</Typography>
                  <Typography className={`text-2xl font-bold ${stat.color}`}>{stat.value}</Typography>
                  <Typography className={`text-xs font-medium ${stat.subColor}`}>{stat.sub}</Typography>
                </Card>
              ))}
            </div>

            {/* Liste candidatures */}
            <Card className="shadow-sm border border-blue-gray-100">
              <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100">
                <div>
                  <Typography variant="h6" color="blue-gray" className="mb-1">Mes candidatures</Typography>
                  <Typography variant="small" className="text-blue-gray-600"><strong>{applications.length} candidature(s)</strong></Typography>
                </div>
                <Menu placement="left-start">
                  <MenuHandler>
                    <IconButton size="sm" variant="text" color="blue-gray"><EllipsisVerticalIcon strokeWidth={3} className="h-6 w-6" /></IconButton>
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
                      <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mb-3 mx-auto" />
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
                    <Link to="/student/offers"><Button color="blue" size="sm">🔍 Découvrir les offres</Button></Link>
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
                            setSupervision(null);
                            fetchInterviews(app.id);
                          }}
                        >
                          <div className={`h-1 rounded-t-xl bg-gradient-to-r ${
                            statusColor(app.status) === "green"  ? "from-green-500 to-green-600"  :
                            statusColor(app.status) === "red"    ? "from-red-500 to-red-600"      :
                            statusColor(app.status) === "purple" ? "from-purple-500 to-purple-600":
                            statusColor(app.status) === "amber"  ? "from-amber-500 to-amber-600"  :
                                                                   "from-orange-500 to-orange-600"
                          }`} />
                          <CardHeader floated={false} shadow={false} className="p-4 border-b border-blue-gray-100">
                            <Typography variant="h6" className="font-bold mb-1">{app.offer?.title || "Offre inconnue"}</Typography>
                            <Typography variant="small" className="text-blue-500 font-medium">{app.offer?.enterprise?.name || "Entreprise"}</Typography>
                          </CardHeader>
                          <CardBody className="space-y-3 p-4">
                            <div className="flex flex-wrap gap-3 text-sm text-blue-gray-600">
                              <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4 text-blue-400" />{app.offer?.location || "N/A"}</span>
                              <span className="flex items-center gap-1"><ClockOutline className="w-4 h-4 text-blue-400" />{app.offer?.duration || "N/A"}</span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-blue-gray-600">
                              <span>📅 Début : {formatDate(app.offer?.start_date)}</span>
                              <span>👥 {app.offer?.available_places ? `${app.offer.available_places} place(s)` : "Places N/A"}</span>
                            </div>
                            <div className="border-t border-blue-gray-100" />
                            <div className="flex justify-between items-center">
                              <Chip value={statusLabel(app.status)} color={statusColor(app.status)} size="sm" className="font-semibold" />
                              <Typography variant="small" className="text-blue-gray-500">{formatDate(app.created_at)}</Typography>
                            </div>
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

      {/* ─── MODAL ─────────────────────────────────────────────────────────── */}
      <Dialog open={openModal} handler={() => setOpenModal(false)} size="xl">
        <DialogHeader className="flex justify-between items-center border-b border-blue-gray-100">
          <Typography variant="h5" className="font-bold">
            {selectedApp?.offer?.title || "Détails de la candidature"}
          </Typography>
          <IconButton variant="text" color="blue-gray" onClick={() => setOpenModal(false)}>
            <XMarkIcon className="w-6 h-6" />
          </IconButton>
        </DialogHeader>

        <DialogBody divider className="p-0 max-h-[75vh] overflow-y-auto">
          {selectedApp && (
            <Tabs value={activeTab} className="w-full">
              <TabsHeader>
                <Tab value="info" onClick={() => setActiveTab("info")}>💼 Informations</Tab>
                <Tab
                  value="encadrement"
                  onClick={() => {
                    setActiveTab("encadrement");
                    if (selectedApp?.id) fetchSupervision(selectedApp.id);
                  }}
                >
                  👨‍🏫 Encadrement & Tâches
                </Tab>
                <Tab value="interviews" onClick={() => setActiveTab("interviews")}>
                  📅 Entretiens {interviews.length > 0 && `(${interviews.length})`}
                </Tab>
              </TabsHeader>

              {/* ── Tab Informations ── */}
              {activeTab === "info" && (
                <div className="p-6 space-y-6">
                  <div>
                    <Typography variant="h6" className="font-bold text-blue-gray-900 mb-4">💼 Offre de stage</Typography>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Titre",         value: selectedApp.offer?.title },
                        { label: "Entreprise",    value: selectedApp.offer?.enterprise?.name },
                        { label: "Localisation",  value: selectedApp.offer?.location },
                        { label: "Durée",         value: selectedApp.offer?.duration },
                        { label: "Date de début", value: formatDate(selectedApp.offer?.start_date) },
                        { label: "Places dispo",  value: selectedApp.offer?.available_places ? `${selectedApp.offer.available_places} place(s)` : "N/A" },
                        { label: "Domaine",       value: selectedApp.offer?.domain },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <Typography variant="small" className="font-bold text-blue-gray-900">{label} :</Typography>
                          <Typography variant="small" className="text-blue-gray-700">{value || "—"}</Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-blue-gray-100" />
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
                      {selectedApp.encadrant && (
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 mt-2">
                          <Typography variant="small" className="font-bold text-indigo-900">Encadrant</Typography>
                          <Typography variant="small" className="text-indigo-900 font-medium">{selectedApp.encadrant.name}</Typography>
                          {selectedApp.encadrant.email && (
                            <Typography variant="small" className="text-indigo-700 mt-1">{selectedApp.encadrant.email}</Typography>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-blue-gray-100" />
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

              {/* ── Tab Encadrement & Tâches ── */}
              {activeTab === "encadrement" && renderEncadrementTab()}

              {/* ── Tab Entretiens ── */}
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
                                <Typography variant="h6" className="font-bold text-blue-gray-900 mb-1">📅 {formatDate(interview.date)}</Typography>
                                <Typography variant="small" className="text-blue-gray-600">⏰ {interview.time || "N/A"}</Typography>
                              </div>
                              <Chip
                                value={interview.result || "En attente"}
                                color={interview.result === "passed" ? "green" : interview.result === "failed" ? "red" : "amber"}
                                size="sm"
                              />
                            </div>
                            <div className="border-t border-blue-gray-100 pt-3 space-y-2">
                              {interview.location && (
                                <Typography variant="small" className="text-blue-gray-600">📍 <strong>Lieu :</strong> {interview.location}</Typography>
                              )}
                              {interview.meeting_link && (
                                <Typography variant="small" className="text-blue-gray-600">
                                  🔗 <strong>Lien :</strong>{" "}
                                  <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{interview.meeting_link}</a>
                                </Typography>
                              )}
                              {interview.notes && (
                                <Typography variant="small" className="text-blue-gray-600">📝 <strong>Notes :</strong> {interview.notes}</Typography>
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
          <Button variant="outlined" color="blue-gray" onClick={() => setOpenModal(false)}>Fermer</Button>
          <Button color="blue" variant="outlined" onClick={() => handleContactEnterprise(selectedApp?.id)}>
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            Contacter
          </Button>
          {normalizeStatus(selectedApp?.status) !== "accepted" && normalizeStatus(selectedApp?.status) !== "rejected" && (
            <Button color="red" variant="outlined" onClick={() => handleWithdrawApplication(selectedApp?.id)}>
              Retirer candidature
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}