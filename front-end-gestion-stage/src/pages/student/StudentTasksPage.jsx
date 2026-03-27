import { useEffect, useState, useMemo } from "react";
import { Typography, Card, CardBody, Select, Option } from "@material-tailwind/react";
import api from "../../services/api";
import BaseLayout from "../../components/layout/BaseLayout";
import { StudentSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getStudentMenuItems } from "../../config/sidebarConfig";
import StudentNotificationBell from "../../components/student/StudentNotificationBell";

const STATUS_OPTS = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
];

const STATUS_STYLES = {
  todo: {
    chip: "bg-slate-100 text-slate-600 border border-slate-200",
    dot: "bg-slate-400",
    row: "",
  },
  in_progress: {
    chip: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-400 animate-pulse",
    row: "bg-amber-50/30",
  },
  done: {
    chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    row: "bg-emerald-50/20",
  },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.todo;
  const label = STATUS_OPTS.find((o) => o.value === status)?.label || status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function CommentPanel({ task, commentDrafts, setCommentDrafts, sendComment, busy }) {
  const [open, setOpen] = useState(false);

  // ✅ FIX : essayer toutes les variantes de clés possibles renvoyées par l'API
  const tc =
    task.comments ||
    task.task_comments ||
    task.taskComments ||
    task.feedback ||
    task.feedbacks ||
    [];

  const count = Array.isArray(tc) ? tc.length : 0;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {count} commentaire{count !== 1 ? "s" : ""}
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 bg-slate-50 rounded-xl border border-slate-100 p-3 space-y-3">
          {/* Liste des commentaires */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {count === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun commentaire pour l'instant.</p>
            ) : (
              tc.map((c, idx) => {
                // ✅ FIX : supporter différentes structures de commentaire
                const authorName =
                  c.user?.name ||
                  c.author?.name ||
                  c.author_name ||
                  c.userName ||
                  "Utilisateur";
                const body = c.body || c.content || c.message || c.text || "";
                const createdAt = c.created_at || c.createdAt || c.date || null;
                const commentId = c.id ?? idx;

                return (
                  <div key={commentId} className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                        {(authorName)[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{authorName}</span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {createdAt
                          ? new Date(createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap leading-relaxed">
                      {body}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Formulaire d'ajout de commentaire */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ajouter un commentaire…"
              value={commentDrafts[task.id] || ""}
              onChange={(e) =>
                setCommentDrafts((d) => ({ ...d, [task.id]: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && sendComment(task.id)}
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
            />
            <button
              disabled={busy || !(commentDrafts[task.id] || "").trim()}
              onClick={() => sendComment(task.id)}
              className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentTasksPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [supervision, setSupervision] = useState(null);
  const [loadingSup, setLoadingSup] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("due_date");

  // Chargement des candidatures
  useEffect(() => {
    api
      .get("/my-applications")
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setApplications(raw);
      })
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  // Sélection automatique de la première candidature avec encadrant
  useEffect(() => {
    const withEnc = applications.filter((a) => a.encadrant_id || a.encadrant);
    if (withEnc.length && selectedId == null) setSelectedId(withEnc[0].id);
  }, [applications, selectedId]);

  // Chargement de la supervision à chaque changement de candidature sélectionnée
  useEffect(() => {
    if (!selectedId) return;
    setLoadingSup(true);
    api
      .get(`/student/applications/${selectedId}/supervision`)
      .then((res) => setSupervision(res.data))
      .catch(() => setSupervision(null))
      .finally(() => setLoadingSup(false));
  }, [selectedId]);

  const appsWithEncadrant = useMemo(
    () => applications.filter((a) => a.encadrant_id || a.encadrant),
    [applications]
  );

  const loadSupervision = () => {
    if (!selectedId) return;
    setLoadingSup(true);
    api
      .get(`/student/applications/${selectedId}/supervision`)
      .then((res) => setSupervision(res.data))
      .catch(() => setSupervision(null))
      .finally(() => setLoadingSup(false));
  };

  const patchStatus = async (taskId, status) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await api.patch(
        `/student/applications/${selectedId}/tasks/${taskId}/status`,
        { status }
      );
      loadSupervision();
    } catch (e) {
      console.error("Erreur mise à jour statut :", e);
    } finally {
      setBusy(false);
    }
  };

  const sendComment = async (taskId) => {
    const body = (commentDrafts[taskId] || "").trim();
    if (!body || !selectedId) return;
    setBusy(true);
    try {
      await api.post(
        `/student/applications/${selectedId}/tasks/${taskId}/comments`,
        { body }
      );
      setCommentDrafts((d) => ({ ...d, [taskId]: "" }));
      loadSupervision();
    } catch (e) {
      console.error("Erreur envoi commentaire :", e);
    } finally {
      setBusy(false);
    }
  };

  // ✅ FIX : normaliser les tâches pour toujours avoir une clé "comments"
  const rawTasks = supervision?.tasks || [];
  const tasks = useMemo(
    () =>
      rawTasks.map((task) => ({
        ...task,
        // Normalisation : on force une seule clé "comments"
        comments:
          task.comments ||
          task.task_comments ||
          task.taskComments ||
          task.feedback ||
          task.feedbacks ||
          [],
      })),
    [rawTasks]
  );

  const filteredTasks = useMemo(() => {
    let t = filterStatus === "all" ? tasks : tasks.filter((tk) => tk.status === filterStatus);
    if (sortBy === "due_date")
      t = [...t].sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
    if (sortBy === "title")
      t = [...t].sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "status")
      t = [...t].sort((a, b) => a.status.localeCompare(b.status));
    return t;
  }, [tasks, filterStatus, sortBy]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    }),
    [tasks]
  );

  const encName = supervision?.encadrant?.name || "—";
  const encEmail = supervision?.encadrant?.email;

  const sidebarExtra = (
    <div className="bg-blue-50 rounded-lg p-4">
      <Typography variant="small" className="text-blue-gray-600 mb-1">
        Espace étudiant
      </Typography>
      <Typography variant="small" className="text-blue-gray-700">
        Mettez à jour vos tâches et échangez avec votre encadrant.
      </Typography>
    </div>
  );

  return (
    <BaseLayout
      title="Mes tâches"
      headerSubtitle="Suivi avec votre encadrant"
      menuItems={getStudentMenuItems({ applications: applications.length })}
      sidebarHeader={<StudentSidebarHeader />}
      sidebarExtra={sidebarExtra}
      headerActions={<StudentNotificationBell />}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* État chargement initial */}
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Chargement…
          </div>
        ) : appsWithEncadrant.length === 0 ? (
          /* Aucune candidature avec encadrant */
          <Card className="border border-blue-gray-100">
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <Typography className="text-blue-gray-700">
                  Aucune candidature avec un encadrant assigné pour l'instant.
                </Typography>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* En-tête : encadrant + sélecteur de candidature */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow">
                  {encName[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Encadrant</p>
                  <p className="font-bold text-slate-900 leading-tight">{encName}</p>
                  {encEmail && <p className="text-xs text-slate-500">{encEmail}</p>}
                </div>
              </div>
              <div className="w-full sm:w-72">
                <Select
                  label="Candidature / offre"
                  value={selectedId ? String(selectedId) : ""}
                  onChange={(v) => setSelectedId(Number(v))}
                >
                  {appsWithEncadrant.map((a) => (
                    <Option key={a.id} value={String(a.id)}>
                      {a.offer?.title || `Candidature #${a.id}`}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Statistiques */}
            {!loadingSup && supervision && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total", value: stats.total, color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
                  { label: "À faire", value: stats.todo, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
                  { label: "En cours", value: stats.in_progress, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
                  { label: "Terminé", value: stats.done, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Chargement supervision */}
            {loadingSup ? (
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Chargement des tâches…
              </div>
            ) : supervision ? (
              <>
                {/* Filtres + tri */}
                <div className="flex flex-wrap gap-3 items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">
                      Statut :
                    </span>
                    {[{ value: "all", label: "Tous" }, ...STATUS_OPTS].map((o) => (
                      <button
                        key={o.value}
                        onClick={() => setFilterStatus(o.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
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
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Trier :
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700"
                    >
                      <option value="due_date">Échéance</option>
                      <option value="title">Titre</option>
                      <option value="status">Statut</option>
                    </select>
                  </div>
                </div>

                {/* Tableau des tâches */}
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 opacity-30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="text-sm font-medium">Aucune tâche trouvée</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                    {/* En-tête du tableau */}
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide gap-4">
                      <span>Tâche</span>
                      <span>Échéance</span>
                      <span>Statut</span>
                      <span>Commentaires</span>
                      <span>Changer le statut</span>
                    </div>

                    {/* Lignes du tableau */}
                    <div className="divide-y divide-slate-100">
                      {filteredTasks.map((task) => {
                        const rowStyle = STATUS_STYLES[task.status]?.row || "";
                        const isOverdue =
                          task.due_date &&
                          task.status !== "done" &&
                          new Date(task.due_date) < new Date();

                        return (
                          <div
                            key={task.id}
                            className={`grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] px-4 py-4 gap-4 items-start hover:bg-slate-50/80 transition-colors ${rowStyle}`}
                          >
                            {/* Titre + description */}
                            <div>
                              <p className="font-semibold text-sm text-slate-900 leading-snug">
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Échéance */}
                            <div className="pt-0.5">
                              {task.due_date ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                                    isOverdue ? "text-red-600" : "text-slate-600"
                                  }`}
                                >
                                  {isOverdue && (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                  {new Date(task.due_date).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </div>

                            {/* Badge de statut */}
                            <div className="pt-0.5">
                              <StatusBadge status={task.status} />
                            </div>

                            {/* Commentaires */}
                            <div>
                              <CommentPanel
                                task={task}
                                commentDrafts={commentDrafts}
                                setCommentDrafts={setCommentDrafts}
                                sendComment={sendComment}
                                busy={busy}
                              />
                            </div>

                            {/* Sélecteur de statut */}
                            <div>
                              <select
                                value={task.status}
                                disabled={busy}
                                onChange={(e) => patchStatus(task.id, e.target.value)}
                                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-slate-700 font-medium disabled:opacity-50 cursor-pointer transition"
                              >
                                {STATUS_OPTS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pied du tableau : compteur + barre de progression */}
                    <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        {filteredTasks.length} tâche{filteredTasks.length !== 1 ? "s" : ""}
                        {filterStatus !== "all" ? " (filtrées)" : ""}
                      </p>
                      {stats.total > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{
                                width: `${Math.round((stats.done / stats.total) * 100)}%`,
                              }}
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
              </>
            ) : null}
          </>
        )}
      </div>
    </BaseLayout>
  );
}