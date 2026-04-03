import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import ChatBox from "@/components/ChatBox";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");
function storageUrl(path) { return path ? `${API_ORIGIN}/storage/${path}` : null; }

const APP_STATUSES = [
  { value: "nouveau",         label: "Nouveau",      color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "preselectionnee", label: "Présélection",  color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "entretien",       label: "Entretien",    color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "acceptee",        label: "Accepté",      color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "refusee",         label: "Refusé",       color: "bg-rose-50 text-rose-700 border-rose-200" },
];

const TASK_COLUMNS = [
  {
    key: "todo", label: "À faire",
    headerGrad: "linear-gradient(135deg,#64748b,#475569)",
    border: "border-slate-200", bg: "bg-slate-50/60",
    dot: "bg-slate-400", dropRing: "ring-slate-400",
    emptyIcon: "📋", accentColor: "#64748b",
  },
  {
    key: "in_progress", label: "En cours",
    headerGrad: "linear-gradient(135deg,#f59e0b,#ea580c)",
    border: "border-amber-200", bg: "bg-amber-50/30",
    dot: "bg-amber-400", dropRing: "ring-amber-400",
    emptyIcon: "⚡", accentColor: "#f59e0b",
  },
  {
    key: "done", label: "Terminé",
    headerGrad: "linear-gradient(135deg,#10b981,#0d9488)",
    border: "border-emerald-200", bg: "bg-emerald-50/20",
    dot: "bg-emerald-500", dropRing: "ring-emerald-400",
    emptyIcon: "✅", accentColor: "#10b981",
  },
];

const TASK_STATUS_OPTS = [
  { value: "todo",        label: "À faire"  },
  { value: "in_progress", label: "En cours" },
  { value: "done",        label: "Terminé"  },
];

const DECISIONS = [
  { value: "pending",      label: "En attente"   },
  { value: "valide",       label: "Validé"       },
  { value: "a_ameliorer",  label: "À améliorer"  },
  { value: "non_conforme", label: "Non conforme" },
];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ error, success }) {
  if (!error && !success) return null;
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-xl backdrop-blur-sm transition-all
      ${error ? "border-rose-200 bg-rose-50/95 text-rose-800" : "border-emerald-200 bg-emerald-50/95 text-emerald-800"}`}>
      <span className="text-base">{error ? "❌" : "✅"}</span>
      {error || success}
    </div>
  );
}

// ── TaskModal ─────────────────────────────────────────────────────────────────
function TaskModal({ task, col, onClose, onDelete, onUpdateStatus, busy, onCommentsUpdated }) {
  const overlayRef  = useRef(null);
  const inputRef    = useRef(null);
  const [comments, setComments]   = useState(null);
  const [loading,  setLoading]    = useState(false);
  const [draft,    setDraft]      = useState("");
  const [sending,  setSending]    = useState(false);

  // Fermeture Escape
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Chargement des commentaires à l'ouverture
  useEffect(() => {
    if (!task) return;
    setLoading(true);
    api.get(`/encadrant/tasks/${task.id}/comments`)
      .then(r => {
        const raw = r.data?.data ?? r.data ?? [];
        setComments(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [task]);

  if (!task || !col) return null;

  const isOverdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
  const displayComments = comments ?? (task.taskComments || []);

  const reloadComments = async () => {
    try {
      const r = await api.get(`/encadrant/tasks/${task.id}/comments`);
      const raw = r.data?.data ?? r.data ?? [];
      setComments(Array.isArray(raw) ? raw : []);
      onCommentsUpdated?.();
    } catch {}
  };

  const sendComment = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/encadrant/tasks/${task.id}/comments`, { body: draft.trim() });
      setDraft("");
      reloadComments();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const deleteComment = async (cId) => {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    try {
      await api.delete(`/encadrant/tasks/${task.id}/comments/${cId}`);
      setComments(prev => prev.filter(c => c.id !== cId));
      onCommentsUpdated?.();
    } catch {}
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto border border-slate-200 flex flex-col"
        style={{ animation: "modalIn .18s ease" }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity:0; transform:scale(.96) translateY(8px); }
            to   { opacity:1; transform:none; }
          }
        `}</style>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-100 px-5 py-4 flex items-start gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: col.accentColor }} />
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 text-base leading-snug">{task.title}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border"
                style={{ background: col.accentColor + "18", color: col.accentColor, borderColor: col.accentColor + "44" }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: col.accentColor }} />
                {col.label}
              </span>
              {task.due_date && (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border
                  ${isOverdue ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                  {isOverdue && <span>⚠</span>}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {new Date(task.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex-shrink-0 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5 flex-1">

          {/* Description */}
          {task.description ? (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
              <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400 italic">
              Aucune description pour cette tâche.
            </div>
          )}

          {/* Changer le statut */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Changer le statut</p>
            <div className="flex gap-2 flex-wrap">
              {TASK_STATUS_OPTS.map(o => {
                const c = TASK_COLUMNS.find(c => c.key === o.value);
                const active = task.status === o.value;
                return (
                  <button
                    key={o.value}
                    disabled={busy || active}
                    onClick={() => { onUpdateStatus(task.id, o.value); onClose(); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                      ${active
                        ? "text-white border-transparent shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                    style={active ? { background: c?.accentColor, borderColor: c?.accentColor } : {}}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Commentaires */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Commentaires {loading ? "…" : `(${displayComments.length})`}
            </p>

            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Chargement…
              </div>
            ) : displayComments.length === 0 ? (
              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400 italic text-center">
                Aucun commentaire. Ajoutez le premier !
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                {displayComments.map((c, idx) => {
                  const name = c.user?.name || "Utilisateur";
                  const body = c.body || c.content || "";
                  const date = c.created_at
                    ? new Date(c.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                    : "";
                  return (
                    <div key={c.id ?? idx} className="rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {name[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-black text-indigo-900 flex-1">{name}</span>
                        <span className="text-xs text-slate-400">{date}</span>
                        <button onClick={() => deleteComment(c.id)}
                          className="text-rose-300 hover:text-rose-600 transition-colors ml-1 flex-shrink-0">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{body}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ajouter commentaire */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ajouter un commentaire</p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Écrire un commentaire sur cette tâche…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendComment()}
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition placeholder-slate-300"
              />
              <button
                onClick={sendComment}
                disabled={sending || !draft.trim()}
                className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0 active:scale-95"
              >
                {sending ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : "Envoyer"}
              </button>
            </div>
          </div>

          {/* Supprimer la tâche */}
          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={() => { onDelete(task.id); onClose(); }}
              disabled={busy}
              className="inline-flex items-center gap-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 transition disabled:opacity-40"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Supprimer cette tâche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
function TaskCard({ task, col, busy, onDragStart, onDragEnd, onOpenModal }) {
  const [isDragging, setIsDragging] = useState(false);

  const isOverdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
  const commentCount = (task.taskComments || []).length;

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(task.id); setIsDragging(true); }}
      onDragEnd={() => { onDragEnd(); setIsDragging(false); }}
      onClick={() => onOpenModal(task)}
      className={`group relative bg-white rounded-xl border ${col.border} shadow-sm
        hover:shadow-lg hover:border-slate-300 transition-all duration-200 select-none
        ${isDragging ? "opacity-40 scale-95 rotate-1 shadow-none" : "cursor-pointer active:scale-[.98]"}`}
    >
      <div className="h-0.5 rounded-t-xl" style={{ background: col.headerGrad }} />

      <div className="p-3.5 space-y-2">
        {/* Title row */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 text-slate-300 mt-0.5">
            <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="2.5" cy="2.5"  r="1.5"/> <circle cx="7.5" cy="2.5"  r="1.5"/>
              <circle cx="2.5" cy="8"    r="1.5"/> <circle cx="7.5" cy="8"    r="1.5"/>
              <circle cx="2.5" cy="13.5" r="1.5"/> <circle cx="7.5" cy="13.5" r="1.5"/>
            </svg>
          </div>
          <p className="flex-1 font-semibold text-sm text-slate-900 leading-snug break-words">{task.title}</p>
          {commentCount > 0 && (
            <span className="flex-shrink-0 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              💬 {commentCount}
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-1.5">
          {task.due_date && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border
              ${isOverdue ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
              {isOverdue && <span>⚠</span>}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {new Date(task.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
            </span>
          )}
          <span className="ml-auto text-xs text-slate-300 group-hover:text-slate-400 transition hidden sm:inline">
            Détails →
          </span>
        </div>
      </div>
    </div>
  );
}

// ── AddTaskInline ─────────────────────────────────────────────────────────────
function AddTaskInline({ onAdd, busy }) {
  const [open,  setOpen]  = useState(false);
  const [title, setTitle] = useState("");
  const [desc,  setDesc]  = useState("");
  const [due,   setDue]   = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), description: desc.trim() || null, due_date: due || null, status: "todo" });
    setTitle(""); setDesc(""); setDue(""); setOpen(false);
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="w-full mt-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs text-slate-400 hover:text-indigo-600 transition-all"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
      </svg>
      Ajouter une tâche
    </button>
  );

  return (
    <form onSubmit={submit} className="mt-1 rounded-xl border-2 border-indigo-300 bg-white p-3 space-y-2 shadow-md">
      <input autoFocus placeholder="Titre *" value={title} onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
      <input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition text-slate-600"/>
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !title.trim()}
          className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 transition">
          ✚ Ajouter
        </button>
        <button type="button"
          onClick={() => { setOpen(false); setTitle(""); setDesc(""); setDue(""); }}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition">
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── KanbanBoard ───────────────────────────────────────────────────────────────
function KanbanBoard({ tasks, busy, onUpdateStatus, onDelete, onAdd }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [modalTask, setModalTask]   = useState(null);

  const grouped = TASK_COLUMNS.reduce((acc, col) => {
    acc[col.key] = (tasks || [])
      .filter(t => t.status === col.key)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return acc;
  }, {});

  const stats = {
    total: tasks.length,
    todo: grouped.todo?.length ?? 0,
    in_progress: grouped.in_progress?.length ?? 0,
    done: grouped.done?.length ?? 0,
  };
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const handleDrop = async (e, toStatus) => {
    e.preventDefault();
    if (!draggingId) return;
    const task = tasks.find(t => t.id === draggingId);
    if (task && task.status !== toStatus) {
      await onUpdateStatus(draggingId, toStatus);
    }
    setDraggingId(null);
    setDragOverCol(null);
  };

  // Colonne de la tâche modale (suivre les changements optimistes)
  const syncedModalTask = modalTask ? tasks.find(t => t.id === modalTask.id) || modalTask : null;
  const modalCol = syncedModalTask ? TASK_COLUMNS.find(c => c.key === syncedModalTask.status) : null;

  return (
    <section className="space-y-5">
      {/* Modal */}
      {syncedModalTask && (
        <TaskModal
          task={syncedModalTask}
          col={modalCol}
          busy={busy}
          onClose={() => setModalTask(null)}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          onCommentsUpdated={() => {}}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
            </svg>
          </div>
          Tableau de tâches
          <span className="text-xs font-normal text-slate-400 normal-case">
            (cliquez pour détails · glissez pour changer le statut)
          </span>
        </h2>
        {stats.total > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-36 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#0d9488)" }}/>
            </div>
            <span className="text-sm font-black text-slate-600">{pct}%</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { label: "Total",    value: stats.total,       cls: "bg-white border-slate-200 text-slate-700" },
          { label: "À faire",  value: stats.todo,        cls: "bg-slate-50 border-slate-200 text-slate-600" },
          { label: "En cours", value: stats.in_progress, cls: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Terminé",  value: stats.done,        cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border px-4 py-3 ${s.cls} shadow-sm`}>
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-xs font-semibold opacity-70 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Colonnes Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TASK_COLUMNS.map(col => {
          const colTasks = grouped[col.key] || [];
          const isOver   = dragOverCol === col.key;

          return (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null); }}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`rounded-2xl border transition-all duration-200 ${col.border} ${col.bg}
                ${isOver ? `ring-2 ${col.dropRing} ring-offset-2 shadow-lg` : "shadow-sm"}`}
            >
              <div className="rounded-t-2xl px-4 py-3 flex items-center justify-between"
                style={{ background: col.headerGrad }}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-white font-bold text-sm tracking-wide">{col.label}</span>
                </div>
                <span className="bg-white/25 backdrop-blur text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {isOver && (
                <div className="mx-3 mt-3 h-1.5 rounded-full opacity-60 animate-pulse"
                  style={{ background: col.headerGrad }} />
              )}

              <div className="p-3 space-y-2.5 min-h-[200px]">
                {colTasks.length === 0 && !isOver && (
                  <div className="flex flex-col items-center justify-center h-24 text-xs text-slate-400 italic gap-1">
                    <span className="text-xl">{col.emptyIcon}</span>
                    <span>Aucune tâche</span>
                  </div>
                )}
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    col={col}
                    busy={busy}
                    onDragStart={(taskId) => setDraggingId(taskId)}
                    onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                    onOpenModal={setModalTask}
                  />
                ))}
                {col.key === "todo" && <AddTaskInline onAdd={onAdd} busy={busy} />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function EncadrantStudentDetail() {
  const { applicationId } = useParams();
  const id = Number(applicationId);

  const [detail,      setDetail]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tasks,       setTasks]       = useState([]);
  const [commentsRes, setCommentsRes] = useState({ data: [] });
  const [evaluation,  setEvaluation]  = useState(null);
  const [commentBody, setCommentBody] = useState("");
  const [busy,        setBusy]        = useState(false);
  const [evalForm,    setEvalForm]    = useState({ score: "", final_decision: "pending", notes: "" });
  const [formError,   setFormError]   = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const flash = (type, msg) => {
    if (type === "error") {
      setFormError(msg); setFormSuccess("");
      setTimeout(() => setFormError(""), 6000);
    } else {
      setFormSuccess(msg); setFormError("");
      setTimeout(() => setFormSuccess(""), 4000);
    }
  };

  const loadDetail = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/encadrant/supervision/applications/${id}`)
      .then(r => setDetail(r.data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Charge UNIQUEMENT les tâches (pas toute la page) ──────────────────────
  const loadTasks = useCallback(() => {
    if (!id) return;
    api.get(`/encadrant/applications/${id}/tasks?per_page=50`)
      .then(r => {
        const raw = r.data?.data ?? r.data ?? [];
        setTasks(Array.isArray(raw) ? raw : []);
      });
  }, [id]);

  const loadComments = useCallback(() => {
    if (id) api.get(`/encadrant/applications/${id}/comments`).then(r => setCommentsRes(r.data));
  }, [id]);

  const loadEvaluation = useCallback(() => {
    if (!id) return;
    api.get(`/encadrant/applications/${id}/evaluation`).then(r => {
      const ev = r.data;
      setEvaluation(ev);
      if (ev) setEvalForm({
        score: ev.score != null ? String(ev.score) : "",
        final_decision: ev.final_decision || "pending",
        notes: ev.notes || "",
      });
    });
  }, [id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);
  useEffect(() => {
    if (detail) { loadTasks(); loadComments(); loadEvaluation(); }
  }, [detail]);

  const patchAppStatus = (status) => {
    setBusy(true);
    api.patch(`/encadrant/supervision/applications/${id}/status`, { status })
      .then(r => setDetail(d => ({ ...d, status: r.data.status })))
      .finally(() => setBusy(false));
  };

  const handleAddTask = (data) => {
    setBusy(true);
    api.post(`/encadrant/applications/${id}/tasks`, data)
      .then(() => loadTasks())           // ← recharge seulement les tâches
      .finally(() => setBusy(false));
  };

  // ── Mise à jour optimiste du statut d'une tâche ───────────────────────────
  const handleUpdateTaskStatus = (taskId, status) => {
    // 1. Mise à jour immédiate dans le state (zéro flash)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    // 2. Appel API en arrière-plan, resync si erreur
    api.put(`/encadrant/tasks/${taskId}`, { status })
      .catch(() => loadTasks());         // rollback silencieux si l'API échoue
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    setBusy(true);
    api.delete(`/encadrant/tasks/${taskId}`)
      .then(() => loadTasks())           // ← recharge seulement les tâches
      .finally(() => setBusy(false));
  };

  const addComment = (e) => {
    e.preventDefault();
    if (!commentBody.trim()) { flash("error", "Saisissez un commentaire avant d'enregistrer."); return; }
    setBusy(true);
    api.post(`/encadrant/applications/${id}/comments`, { body: commentBody.trim() })
      .then(() => { setCommentBody(""); loadComments(); flash("success", "Commentaire enregistré."); })
      .catch(err => flash("error", err.response?.data?.message || "Impossible d'enregistrer le commentaire."))
      .finally(() => setBusy(false));
  };

  const deleteComment = (commentId) => {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    setBusy(true);
    api.delete(`/encadrant/comments/${commentId}`)
      .then(() => loadComments())
      .finally(() => setBusy(false));
  };

  const saveEvaluation = (e) => {
    e.preventDefault();
    setBusy(true);
    api.put(`/encadrant/applications/${id}/evaluation`, {
      score: evalForm.score === "" ? null : Number(evalForm.score),
      final_decision: evalForm.final_decision,
      notes: evalForm.notes || null,
    })
      .then(r => { setEvaluation(r.data); flash("success", "Évaluation enregistrée."); })
      .catch(err => flash("error", err.response?.data?.message || "Impossible d'enregistrer l'évaluation."))
      .finally(() => setBusy(false));
  };

  if (!id) return <p className="p-8 text-center text-rose-600">Identifiant invalide</p>;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Chargement…</p>
      </div>
    </div>
  );

  if (!detail) return (
    <div className="max-w-3xl mx-auto p-8 text-center">
      <p className="text-slate-700">Candidature introuvable ou accès refusé.</p>
      <Link to="/enterprise/encadrant" className="mt-4 inline-block text-indigo-600 font-medium">← Retour</Link>
    </div>
  );

  const s          = detail.student;
  const offer      = detail.offer;
  const interviews = detail.interviews || [];
  const cv         = storageUrl(s?.cv_path || detail.cv);
  const comments   = commentsRes.data || [];
  const currentStatus = APP_STATUSES.find(a => a.value === detail.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      <Toast error={formError} success={formSuccess} />

      {/* ── Sticky Header ── */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <Link to="/enterprise/encadrant"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 mb-3 group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Retour au tableau de bord
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                {s?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">{s?.name}</h1>
                <p className="text-sm text-slate-500">{s?.email}{s?.school && ` · ${s.school}`}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {currentStatus && (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
              )}
              <select
                value={detail.status}
                disabled={busy}
                onChange={(e) => patchAppStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-sm"
              >
                {APP_STATUSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {cv && (
                <a href={cv} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition border border-indigo-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  CV
                </a>
              )}
            </div>
          </div>

          {offer && (
            <div className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl px-4 py-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span className="font-bold text-sm text-indigo-900">{offer.title}</span>
              {(offer.domain || offer.location) && (
                <span className="text-xs text-indigo-500">
                  · {[offer.domain, offer.location].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-14">

        {/* ── KANBAN ── */}
        <KanbanBoard
          tasks={tasks}
          busy={busy}
          onUpdateStatus={handleUpdateTaskStatus}
          onDelete={handleDeleteTask}
          onAdd={handleAddTask}
        />

        {/* ── GENERAL COMMENTS ── */}
        <section className="space-y-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            Feedback général du stagiaire
          </h2>

          <form onSubmit={addComment} className="rounded-2xl border-2 border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <textarea
              placeholder="Votre feedback général pour le suivi du stagiaire…"
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition resize-none"
            />
            <button type="submit" disabled={busy}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm">
              Enregistrer le feedback
            </button>
          </form>

          <div className="space-y-2.5">
            {comments.length === 0 && <p className="text-sm text-slate-400 italic">Aucun feedback général.</p>}
            {comments.map(c => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                      {(c.encadrant?.name || "E")[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-700">{c.encadrant?.name || "Encadrant"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{c.created_at ? new Date(c.created_at).toLocaleString("fr-FR") : ""}</span>
                    <button onClick={() => deleteComment(c.id)} disabled={busy}
                      className="text-rose-300 hover:text-rose-600 transition-colors disabled:opacity-40">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── EVALUATION ── */}
        <section className="space-y-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </div>
            Évaluation de fin de stage
          </h2>

          <form onSubmit={saveEvaluation}
            className="rounded-2xl border-2 border-slate-200 bg-white p-6 space-y-4 max-w-xl shadow-sm">
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
              La note, la décision et l'appréciation sont enregistrées ensemble.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Note /20</label>
                <input type="number" min={0} max={20} step={0.5}
                  value={evalForm.score}
                  onChange={(e) => setEvalForm(f => ({ ...f, score: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Décision</label>
                <select
                  value={evalForm.final_decision}
                  onChange={(e) => setEvalForm(f => ({ ...f, final_decision: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  {DECISIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Appréciation</label>
              <textarea
                value={evalForm.notes}
                onChange={(e) => setEvalForm(f => ({ ...f, notes: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"/>
            </div>
            <button type="submit" disabled={busy}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition shadow-md">
              {evaluation ? "Mettre à jour" : "Enregistrer l'évaluation"}
            </button>
          </form>
        </section>

        {/* ── INTERVIEWS ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            Historique des entretiens
          </h2>
          {interviews.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun entretien enregistré.</p>
          ) : (
            <ol className="relative border-l border-slate-200 ml-3 space-y-5 pl-6">
              {interviews.map(it => (
                <li key={it.id} className="relative">
                  <span className="absolute -left-[1.36rem] top-2 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white"/>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="font-bold text-slate-900">{it.date} · {it.time}</p>
                    {(it.location || it.meeting_link) && <p className="text-sm text-slate-600 mt-1">{it.location || it.meeting_link}</p>}
                    {it.result && <p className="text-sm mt-2">Résultat : <span className="font-bold text-indigo-700">{it.result}</span></p>}
                    {it.comment && <p className="text-sm text-slate-600 mt-1">{it.comment}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

      </div>
      <ChatBox />
    </div>
  );
}