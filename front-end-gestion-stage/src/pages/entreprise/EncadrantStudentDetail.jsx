import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");
function storageUrl(path) { return path ? `${API_ORIGIN}/storage/${path}` : null; }

const APP_STATUSES = [
  { value: "nouveau", label: "Nouveau", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "preselectionnee", label: "Présélection", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "entretien", label: "Entretien", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "acceptee", label: "Accepté", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "refusee", label: "Refusé", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

const TASK_STATUSES = [
  { value: "todo", label: "À faire", dot: "bg-slate-400", row: "", badge: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "in_progress", label: "En cours", dot: "bg-amber-400 animate-pulse", row: "bg-amber-50/40", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "done", label: "Terminé", dot: "bg-emerald-500", row: "bg-emerald-50/30", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

const DECISIONS = [
  { value: "pending", label: "En attente" },
  { value: "valide", label: "Validé" },
  { value: "a_ameliorer", label: "À améliorer" },
  { value: "non_conforme", label: "Non conforme" },
];

function StatusBadge({ status, map }) {
  const s = map.find((o) => o.value === status);
  if (!s) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.badge || s.color}`}>
      {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
      {s.label}
    </span>
  );
}

function Toast({ error, success }) {
  if (!error && !success) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 rounded-xl border px-5 py-3 text-sm font-medium shadow-lg transition-all
      ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
      {error || success}
    </div>
  );
}

// ─── TASK TABLE ────────────────────────────────────────────────────────────────
function TaskTable({ tasks, busy, onUpdateStatus, onDelete, onAdd }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("due_date");
  const [expandedTask, setExpandedTask] = useState(null);

  const filtered = tasks
    .filter((t) => filterStatus === "all" || t.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "due_date") return (a.due_date || "").localeCompare(b.due_date || "");
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), description: desc.trim() || null, due_date: dueDate || null, status: "todo" });
    setTitle(""); setDesc(""); setDueDate("");
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Gestion des tâches
        </h2>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-slate-700", bg: "bg-white border-slate-200" },
          { label: "À faire", value: stats.todo, color: "text-slate-600", bg: "bg-white border-slate-200" },
          { label: "En cours", value: stats.in_progress, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
          { label: "Terminé", value: stats.done, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add task form */}
      <form onSubmit={handleAdd} className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
        <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Nouvelle tâche</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            placeholder="Titre de la tâche *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition text-slate-600"
          />
        </div>
        <div className="flex gap-3">
          <input
            placeholder="Description (optionnel)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
          />
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            + Ajouter
          </button>
        </div>
      </form>

      {/* Filters & Sort */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Filtrer :</span>
          {[{ value: "all", label: "Tous" }, ...TASK_STATUSES].map((o) => (
            <button
              key={o.value}
              onClick={() => setFilterStatus(o.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterStatus === o.value
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Trier :</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 text-slate-700"
          >
            <option value="due_date">Échéance</option>
            <option value="title">Titre</option>
            <option value="status">Statut</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
          <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium">Aucune tâche{filterStatus !== "all" ? " pour ce filtre" : ""}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          {/* Table Header */}
          <div className="grid grid-cols-[2.5fr_1fr_1fr_1.2fr_auto] bg-slate-50 border-b border-slate-200 px-4 py-3 gap-4">
            {["Tâche", "Échéance", "Statut", "Changer statut", ""].map((h) => (
              <span key={h} className="text-xs font-bold text-slate-400 uppercase tracking-wide">{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => {
              const ts = TASK_STATUSES.find((s) => s.value === t.status) || TASK_STATUSES[0];
              const isOverdue = t.due_date && t.status !== "done" && new Date(t.due_date) < new Date();
              const isExpanded = expandedTask === t.id;
              return (
                <div key={t.id} className={`${ts.row} transition-colors`}>
                  <div className="grid grid-cols-[2.5fr_1fr_1fr_1.2fr_auto] px-4 py-3.5 gap-4 items-center hover:bg-slate-50/70 transition-colors">
                    {/* Title */}
                    <div>
                      <button
                        onClick={() => setExpandedTask(isExpanded ? null : t.id)}
                        className="text-left group"
                      >
                        <p className="font-semibold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center gap-1.5">
                          {t.title}
                          {t.description && (
                            <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </p>
                      </button>
                    </div>

                    {/* Due date */}
                    <div>
                      {t.due_date ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${isOverdue ? "text-rose-600" : "text-slate-600"}`}>
                          {isOverdue && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                          {new Date(t.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ts.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ts.dot}`} />
                        {ts.label}
                      </span>
                    </div>

                    {/* Status select */}
                    <div>
                      <select
                        value={t.status}
                        disabled={busy}
                        onChange={(e) => onUpdateStatus(t.id, e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-slate-700 font-medium disabled:opacity-50 cursor-pointer transition"
                      >
                        {TASK_STATUSES.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Delete */}
                    <div>
                      <button
                        onClick={() => onDelete(t.id)}
                        disabled={busy}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded description */}
                  {isExpanded && t.description && (
                    <div className="px-4 pb-3 -mt-1">
                      <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer with progress */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {filtered.length} tâche{filtered.length !== 1 ? "s" : ""}
              {filterStatus !== "all" ? " (filtrées)" : ""}
            </p>
            {stats.total > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((stats.done / stats.total) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {Math.round((stats.done / stats.total) * 100)}% complété
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function EncadrantStudentDetail() {
  const { applicationId } = useParams();
  const id = Number(applicationId);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasksRes, setTasksRes] = useState({ data: [] });
  const [commentsRes, setCommentsRes] = useState({ data: [] });
  const [evaluation, setEvaluation] = useState(null);
  const [commentBody, setCommentBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [evalForm, setEvalForm] = useState({ score: "", final_decision: "pending", notes: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const flash = (type, msg) => {
    if (type === "error") { setFormError(msg); setFormSuccess(""); setTimeout(() => setFormError(""), 6000); }
    else { setFormSuccess(msg); setFormError(""); setTimeout(() => setFormSuccess(""), 4000); }
  };

  const loadDetail = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/encadrant/supervision/applications/${id}`).then((r) => setDetail(r.data)).catch(() => setDetail(null)).finally(() => setLoading(false));
  }, [id]);
  const loadTasks = useCallback(() => { if (id) api.get(`/encadrant/applications/${id}/tasks`).then((r) => setTasksRes(r.data)); }, [id]);
  const loadComments = useCallback(() => { if (id) api.get(`/encadrant/applications/${id}/comments`).then((r) => setCommentsRes(r.data)); }, [id]);
  const loadEvaluation = useCallback(() => {
    if (!id) return;
    api.get(`/encadrant/applications/${id}/evaluation`).then((r) => {
      const ev = r.data;
      setEvaluation(ev);
      if (ev) setEvalForm({ score: ev.score != null ? String(ev.score) : "", final_decision: ev.final_decision || "pending", notes: ev.notes || "" });
    });
  }, [id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);
  useEffect(() => { if (detail) { loadTasks(); loadComments(); loadEvaluation(); } }, [detail]);

  const patchStatus = (status) => {
    setBusy(true);
    api.patch(`/encadrant/supervision/applications/${id}/status`, { status })
      .then((r) => setDetail((d) => ({ ...d, status: r.data.status })))
      .finally(() => setBusy(false));
  };

  const handleAddTask = (data) => {
    setBusy(true);
    api.post(`/encadrant/applications/${id}/tasks`, data).then(() => { loadTasks(); loadDetail(); }).finally(() => setBusy(false));
  };

  const handleUpdateTaskStatus = (taskId, status) => {
    setBusy(true);
    api.put(`/encadrant/tasks/${taskId}`, { status }).then(() => { loadTasks(); loadDetail(); }).finally(() => setBusy(false));
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    setBusy(true);
    api.delete(`/encadrant/tasks/${taskId}`).then(() => { loadTasks(); loadDetail(); }).finally(() => setBusy(false));
  };

  const addComment = (e) => {
    e.preventDefault();
    if (!commentBody.trim()) { flash("error", "Saisissez un commentaire avant d'enregistrer."); return; }
    setBusy(true);
    api.post(`/encadrant/applications/${id}/comments`, { body: commentBody.trim() })
      .then(() => { setCommentBody(""); loadComments(); flash("success", "Commentaire enregistré."); })
      .catch((err) => flash("error", err.response?.data?.message || "Impossible d'enregistrer le commentaire."))
      .finally(() => setBusy(false));
  };

  const deleteComment = (commentId) => {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    setBusy(true);
    api.delete(`/encadrant/comments/${commentId}`).then(() => loadComments()).finally(() => setBusy(false));
  };

  const saveEvaluation = (e) => {
    e.preventDefault();
    setBusy(true);
    api.put(`/encadrant/applications/${id}/evaluation`, { score: evalForm.score === "" ? null : Number(evalForm.score), final_decision: evalForm.final_decision, notes: evalForm.notes || null })
      .then((r) => { setEvaluation(r.data); flash("success", "Évaluation enregistrée."); })
      .catch((err) => flash("error", err.response?.data?.message || "Impossible d'enregistrer l'évaluation."))
      .finally(() => setBusy(false));
  };

  if (!id) return <p className="p-8 text-center text-rose-600">Identifiant invalide</p>;
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );
  if (!detail) return (
    <div className="max-w-3xl mx-auto p-8 text-center">
      <p className="text-slate-700">Candidature introuvable ou accès refusé.</p>
      <Link to="/enterprise/encadrant" className="mt-4 inline-block text-indigo-600 font-medium">← Retour</Link>
    </div>
  );

  const s = detail.student;
  const offer = detail.offer;
  const interviews = detail.interviews || [];
  const cv = storageUrl(s?.cv_path || detail.cv);
  const tasks = tasksRes.data || [];
  const comments = commentsRes.data || [];
  const currentStatus = APP_STATUSES.find((a) => a.value === detail.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Toast error={formError} success={formSuccess} />

      {/* Header */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <Link to="/enterprise/encadrant" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 mb-4">
            ← Retour au tableau de bord
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {s?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{s?.name}</h1>
                <p className="text-sm text-slate-500">{s?.email} · {s?.school}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentStatus && (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
              )}
              <select
                value={detail.status}
                disabled={busy}
                onChange={(e) => patchStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {APP_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {cv && (
                <a href={cv} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CV
                </a>
              )}
            </div>
          </div>
          {/* Offer pill */}
          <div className="mt-4 inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold text-sm text-slate-800">{offer?.title}</span>
            {(offer?.domain || offer?.location) && (
              <span className="text-xs text-slate-500">· {[offer?.domain, offer?.location].filter(Boolean).join(" · ")}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* TASK TABLE SECTION */}
        <TaskTable
          tasks={tasks}
          busy={busy}
          onUpdateStatus={handleUpdateTaskStatus}
          onDelete={handleDeleteTask}
          onAdd={handleAddTask}
        />

        {/* COMMENTS */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Commentaires & feedback
          </h2>
          <form onSubmit={addComment} className="rounded-2xl border-2 border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <textarea
              placeholder="Votre commentaire ou retour pour le suivi du stagiaire…"
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition resize-none"
            />
            <button type="submit" disabled={busy}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm">
              Enregistrer le commentaire
            </button>
          </form>
          <div className="space-y-2">
            {comments.length === 0 && <p className="text-sm text-slate-400 italic">Aucun commentaire.</p>}
            {comments.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                      {(c.encadrant?.name || "E")[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700">{c.encadrant?.name || "Encadrant"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{c.created_at ? new Date(c.created_at).toLocaleString("fr-FR") : ""}</span>
                    <button onClick={() => deleteComment(c.id)} disabled={busy}
                      className="text-rose-400 hover:text-rose-600 transition-colors disabled:opacity-40">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EVALUATION */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Évaluation de fin de stage
          </h2>
          <form onSubmit={saveEvaluation} className="rounded-2xl border-2 border-slate-200 bg-white p-6 space-y-4 max-w-xl shadow-sm">
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              La note, la décision et les notes textuelles sont enregistrées ensemble.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Note /20</label>
                <input
                  type="number" min={0} max={20} step={0.5}
                  value={evalForm.score}
                  onChange={(e) => setEvalForm((f) => ({ ...f, score: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Décision finale</label>
                <select
                  value={evalForm.final_decision}
                  onChange={(e) => setEvalForm((f) => ({ ...f, final_decision: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {DECISIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Appréciation & axes d'amélioration</label>
              <textarea
                value={evalForm.notes}
                onChange={(e) => setEvalForm((f) => ({ ...f, notes: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
              />
            </div>
            <button type="submit" disabled={busy}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-md border-2 border-emerald-700">
              {evaluation ? "Mettre à jour l'évaluation" : "Enregistrer l'évaluation"}
            </button>
          </form>
        </section>

        {/* INTERVIEWS */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Historique des entretiens
          </h2>
          {interviews.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun entretien enregistré.</p>
          ) : (
            <ol className="relative border-l border-slate-200 ml-3 space-y-5 pl-6">
              {interviews.map((it) => (
                <li key={it.id} className="relative">
                  <span className="absolute -left-[1.36rem] top-2 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white" />
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-900">{it.date} · {it.time}</p>
                    {(it.location || it.meeting_link) && <p className="text-sm text-slate-600 mt-1">{it.location || it.meeting_link}</p>}
                    {it.result && <p className="text-sm mt-2">Résultat : <span className="font-medium">{it.result}</span></p>}
                    {it.comment && <p className="text-sm text-slate-600 mt-1">{it.comment}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}