import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import ChatBox from "@/components/ChatBox";
import BaseLayout from "../../components/layout/BaseLayout";
import { EnterpriseSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getEnterpriseMenuItems } from "../../config/sidebarConfig";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");
function storageUrl(path) { return path ? `${API_ORIGIN}/storage/${path}` : null; }

const APP_STATUSES = [
  { value: "nouveau", label: "Nouveau", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "preselectionnee", label: "Présélection", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "entretien", label: "Entretien", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "acceptee", label: "Accepté", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "refusee", label: "Refusé", color: "bg-rose-50 text-rose-700 border-rose-200" },
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
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
];

const DECISIONS = [
  { value: "pending", label: "En attente" },
  { value: "valide", label: "Validé" },
  { value: "a_ameliorer", label: "À améliorer" },
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

// ── CommentInlineEdit ─────────────────────────────────────────────────────────
function CommentInlineEdit({ commentId, body, taskId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(body);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!val.trim() || saving) return;
    setSaving(true);
    try {
      await api.put(`/encadrant/tasks/${taskId}/comments/${commentId}`, { body: val.trim() });
      onUpdated(val.trim());
      setEditing(false);
    } catch { }
    finally { setSaving(false); }
  };

  if (editing) return (
    <div className="flex-1 flex items-center gap-1.5">
      <input
        autoFocus
        className="flex-1 text-xs border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
      />
      <button onClick={save} disabled={saving}
        className="text-xs px-2 py-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-40">
        {saving ? "…" : "OK"}
      </button>
      <button onClick={() => setEditing(false)}
        className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition">✕</button>
    </div>
  );

  return (
    <button onClick={() => { setVal(body); setEditing(true); }}
      title="Modifier ce commentaire"
      className="text-indigo-300 hover:text-indigo-600 transition flex-shrink-0">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
}

// ── EditTaskForm ──────────────────────────────────────────────────────────────
function EditTaskForm({ task, onUpdated, onCancel }) {
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.substring(0, 10) : "");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef(null);

  const handleImageSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    e.target.value = "";
  };

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("_method", "PUT");
      fd.append("title", title.trim());
      if (description.trim()) fd.append("description", description.trim());
      if (dueDate) fd.append("due_date", dueDate);
      if (imageFile) fd.append("attachment", imageFile);

      const r = await api.post(`/encadrant/tasks/${task.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpdated(r.data);
    } catch { }
    finally { setSaving(false); }
  };


  return (
    <div className="border border-indigo-200 rounded-xl bg-indigo-50/40 p-4 space-y-3">
      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Modifier la tâche</p>
      <input
        placeholder="Titre *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
      />
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="flex items-center gap-1 px-2 py-1 border-b border-slate-100 bg-slate-50/70">
          <button type="button" title="Ajouter une image"
            onClick={() => imgRef.current?.click()}
            className="p-1.5 rounded text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <span className="text-xs text-slate-400 ml-1">Image dans description</span>
        </div>
        {imagePreview && (
          <div className="px-3 pt-2 flex items-center gap-2">
            <img src={imagePreview} alt="preview" className="h-12 w-auto rounded border border-slate-200 object-cover" />
            <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="text-xs text-rose-400 hover:text-rose-600">✕ Supprimer</button>
          </div>
        )}
        <textarea
          placeholder="Description (optionnel)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none resize-none placeholder-slate-300 text-slate-800"
        />
      </div>
      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white text-slate-600" />
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !title.trim()}
          className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 transition">
          {saving ? "Enregistrement…" : "✓ Enregistrer"}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition">Annuler</button>
      </div>
    </div>
  );
}

// ── TaskModal ─────────────────────────────────────────────────────────────────
function TaskModal({ task, col, onClose, onDelete, onUpdateStatus, onUpdateTask, busy, onCommentsUpdated, currentUser }) {
  const overlayRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [comments, setComments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachment, setAttachments] = useState([]);
  const [showEditTask, setShowEditTask] = useState(false);

  // Fermeture Escape
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Fermeture emoji picker au clic extérieur
  useEffect(() => {
    if (!showEmoji) return;
    const h = (e) => {
      if (!e.target.closest("[data-emoji-picker]")) setShowEmoji(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showEmoji]);

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
    } catch { }
  };

  // ── Helpers éditeur ──────────────────────────────────────────────────────
  const insertAtCursor = (text) => {
    const el = inputRef.current;
    if (!el) { setDraft(p => p + text); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = draft.substring(0, start) + text + draft.substring(end);
    setDraft(newVal);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + text.length;
      el.focus();
    }, 0);
  };

  const wrapSelection = (before, after) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = draft.substring(start, end) || "texte";
    const newVal = draft.substring(0, start) + before + sel + after + draft.substring(end);
    setDraft(newVal);
    setTimeout(() => {
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + sel.length;
      el.focus();
    }, 0);
  };

  const handleFileAttach = (file, type) => {
    setAttachments(p => [...p, { name: file.name, file, type }]);
  };

  // ── Envoi ────────────────────────────────────────────────────────────────
  const sendComment = async () => {
    if ((!draft.trim() && attachment.length === 0) || sending) return;
    setSending(true);
    try {
      if (attachment.length > 0) {
        const formData = new FormData();

        formData.append("body", draft.trim() || " ");

        attachment.forEach(att => {
          formData.append("attachment[]", att.file);
        });

        await api.post(`/encadrant/tasks/${task.id}/comments`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(`/encadrant/tasks/${task.id}/comments`, { body: draft.trim() });
      }
      setDraft("");
      setAttachments([]);
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
    } catch { }
  };

  const TOOLBAR_BTNS = [
    {
      title: "Gras",
      action: () => wrapSelection("**", "**"),
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 010 8H6zm0 8h9a4 4 0 010 8H6z" />
        </svg>
      ),
    },
    {
      title: "Italique",
      action: () => wrapSelection("_", "_"),
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 4h-9M14 20H5M15 4L9 20" />
        </svg>
      ),
    },
    {
      title: "Code",
      action: () => wrapSelection("`", "`"),
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
  ];

  const EMOJIS = [
    "😀", "😂", "😍", "🤔", "👍", "👏", "🙏", "🔥",
    "✅", "❌", "⚠️", "💡", "📌", "🎯", "🚀", "💬",
    "😎", "🤝", "💪", "🎉", "📎", "🗂️", "📋", "⏰",
  ];

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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(task.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
                </span>
              )}
            </div>
          </div>
          {/* Bouton modifier tâche */}
          <button
            onClick={() => setShowEditTask(v => !v)}
            title="Modifier la tâche"
            className={`w-8 h-8 flex-shrink-0 rounded-xl border flex items-center justify-center transition
              ${showEditTask ? "border-indigo-400 bg-indigo-50 text-indigo-600" : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={onClose}
            className="w-8 h-8 flex-shrink-0 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5 flex-1">

          {/* Edit Task Form */}
          {showEditTask && (
            <EditTaskForm
              task={task}
              onUpdated={(updated) => { onUpdateTask?.(updated); setShowEditTask(false); }}
              onCancel={() => setShowEditTask(false)}
            />
          )}

          {/* Description */}
          {!showEditTask && ((task.description || task.attachment) ? (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
              <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {task.description || <span className="italic text-slate-400">Aucune description texte.</span>}
              </div>
              {task.attachment && (
                <div className="mt-3">
                  {task.attachment.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                    <a href={storageUrl(task.attachment)} target="_blank" rel="noreferrer">
                      <img src={storageUrl(task.attachment)} alt="Pièce jointe" className="max-w-full h-auto max-h-56 rounded-lg border border-slate-200 object-cover hover:opacity-90 transition shadow-sm" />
                    </a>
                  ) : (
                    <a href={storageUrl(task.attachment)} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition shadow-sm">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Consulter la pièce jointe
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400 italic">
              Aucune description ni pièce jointe pour cette tâche.
            </div>
          ))}

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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
                        {(currentUser?.id && (c.user?.id === currentUser.id || c.user_id === currentUser.id)) && (
                          <>
                            <CommentInlineEdit
                              commentId={c.id}
                              body={body}
                              taskId={task.id}
                              onUpdated={(newBody) =>
                                setComments(prev => prev.map(x => x.id === c.id ? { ...x, body: newBody } : x))
                              }
                            />
                            <button onClick={() => deleteComment(c.id)}
                              className="text-rose-300 hover:text-rose-600 transition-colors ml-1 flex-shrink-0">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{body}</p>
                      {/* Pièces jointes du commentaire */}
                      {c.attachment?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(Array.isArray(c.attachment) ? c.attachment : [c.attachment]).map((att, i) => {
                            if (!att) return null;
                            const isImage = typeof att === 'string' && att.match(/\.(jpeg|jpg|gif|png)$/i);
                            return isImage ? (
                              <a key={i} href={storageUrl(att)} target="_blank" rel="noreferrer">
                                <img src={storageUrl(att)} alt="attachment" className="h-16 w-auto rounded border object-cover hover:opacity-90" />
                              </a>
                            ) : (
                              <a key={i} href={storageUrl(att)} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded border">
                                📎 fichier
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Ajouter commentaire — barre enrichie ── */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ajouter un commentaire</p>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-400 transition">

              {/* Toolbar */}
              <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50/70 flex-wrap">

                {/* Gras / Italique / Code */}
                {TOOLBAR_BTNS.map(btn => (
                  <button key={btn.title} type="button" title={btn.title}
                    onClick={btn.action}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition">
                    {btn.icon}
                  </button>
                ))}

                <div className="w-px h-4 bg-slate-200 mx-1" />

                {/* Lien */}
                <button type="button" title="Insérer un lien"
                  onClick={() => {
                    const url = window.prompt("URL du lien :");
                    if (!url) return;
                    const el = inputRef.current;
                    const sel = el ? draft.substring(el.selectionStart, el.selectionEnd) || "texte" : "texte";
                    insertAtCursor(`[${sel}](${url})`);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>

                {/* Image */}
                <button type="button" title="Insérer une image"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileAttach(f, "image"); e.target.value = ""; }}
                />

                {/* Fichier */}
                <button type="button" title="Joindre un fichier"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileAttach(f, "file"); e.target.value = ""; }}
                />

                <div className="w-px h-4 bg-slate-200 mx-1" />

                {/* Emoji picker */}
                <div className="relative" data-emoji-picker>
                  <button type="button" title="Emoji"
                    onClick={() => setShowEmoji(p => !p)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {showEmoji && (
                    <div className="absolute left-0 top-8 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-2 grid grid-cols-8 gap-0.5 w-56">
                      {EMOJIS.map(em => (
                        <button key={em} type="button"
                          onClick={() => { insertAtCursor(em); setShowEmoji(false); }}
                          className="p-1 rounded hover:bg-slate-100 text-base leading-none transition">
                          {em}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mention */}
                <button type="button" title="Mentionner quelqu'un"
                  onClick={() => insertAtCursor("@")}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition text-xs font-bold">
                  @
                </button>
              </div>

              {/* Pièces jointes en attente */}
              {attachment.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-3 pt-2">
                  {attachment.map((att, i) => (
                    <div key={i}
                      className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 text-xs text-indigo-700 font-medium">
                      {att.type === "image" ? (
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                      <span className="max-w-[120px] truncate">{att.name}</span>
                      <button type="button"
                        onClick={() => setAttachments(p => p.filter((_, j) => j !== i))}
                        className="text-indigo-400 hover:text-indigo-700 transition ml-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Zone de texte */}
              <textarea
                ref={inputRef}
                placeholder="Écrire un commentaire… (Entrée pour envoyer, Shift+Entrée pour aller à la ligne)"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); }
                }}
                rows={3}
                className="w-full text-sm px-3.5 py-2.5 bg-transparent focus:outline-none resize-none placeholder-slate-300 text-slate-800"
              />

              {/* Footer toolbar */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-300 hidden sm:inline">Shift+Entrée pour aller à la ligne</span>
                <button
                  type="button"
                  onClick={sendComment}
                  disabled={sending || (!draft.trim() && attachment.length === 0)}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 flex items-center gap-1.5 ml-auto"
                >
                  {sending ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                  Envoyer
                </button>
              </div>
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
function TaskCard({ task, col, busy, onDragStart, onDragEnd, applicationId }) {
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const isOverdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
  const commentCount = (task.taskComments || []).length;

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(task.id); setIsDragging(true); }}
      onDragEnd={() => { onDragEnd(); setIsDragging(false); }}
      onClick={() => navigate(`/enterprise/encadrant/student/${applicationId}/task/${task.id}`)}
      className={`group relative bg-white rounded-xl border ${col.border} shadow-sm
        hover:shadow-lg hover:border-slate-300 transition-all duration-200 select-none
        ${isDragging ? "opacity-40 scale-95 rotate-1 shadow-none" : "cursor-pointer active:scale-[.98]"}`}
    >
      <div className="h-0.5 rounded-t-xl" style={{ background: col.headerGrad }} />

      <div className="p-3.5 space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 text-slate-300 mt-0.5">
            <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="2.5" cy="2.5" r="1.5" /> <circle cx="7.5" cy="2.5" r="1.5" />
              <circle cx="2.5" cy="8" r="1.5" /> <circle cx="7.5" cy="8" r="1.5" />
              <circle cx="2.5" cy="13.5" r="1.5" /> <circle cx="7.5" cy="13.5" r="1.5" />
            </svg>
          </div>
          <p className="flex-1 font-semibold text-sm text-slate-900 leading-snug break-words">{task.title}</p>
          {commentCount > 0 && (
            <span className="flex-shrink-0 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              💬 {commentCount}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {task.due_date && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border
              ${isOverdue ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
              {isOverdue && <span>⚠</span>}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [due, setDue] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imgInputRef = useRef(null);

  const reset = () => {
    setTitle(""); setDesc(""); setDue("");
    setImageFile(null); setImagePreview(null);
    setOpen(false);
  };

  const handleImageSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    e.target.value = "";
  };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = { title: title.trim(), description: desc.trim() || null, due_date: due || null, status: "todo" };
    if (imageFile) payload._imageFile = imageFile;
    onAdd(payload);
    reset();
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="w-full mt-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs text-slate-400 hover:text-indigo-600 transition-all"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Ajouter une tâche
    </button>
  );

  return (
    <form onSubmit={submit} className="mt-1 rounded-xl border-2 border-indigo-300 bg-white p-3 space-y-2 shadow-md">
      <input autoFocus placeholder="Titre *" value={title} onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />

      {/* Description avec support image */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-1 focus-within:ring-indigo-200">
        <div className="flex items-center gap-1 px-2 py-1 border-b border-slate-100 bg-slate-50/60">
          <button type="button" title="Joindre une image à la description"
            onClick={() => imgInputRef.current?.click()}
            className="p-1 rounded text-slate-400 hover:bg-slate-200 hover:text-indigo-600 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <span className="text-xs text-slate-400">Ajouter une image (optionnel)</span>
        </div>
        {imagePreview && (
          <div className="px-3 pt-2 flex items-center gap-2">
            <img src={imagePreview} alt="preview" className="h-10 w-auto rounded border border-slate-200 object-cover" />
            <span className="text-xs text-slate-500 truncate flex-1">{imageFile?.name}</span>
            <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="text-rose-400 hover:text-rose-600 text-xs">✕</button>
          </div>
        )}
        <textarea placeholder="Description (optionnel)" value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none resize-none placeholder-slate-300 text-slate-800" />
      </div>

      <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition text-slate-600" />
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !title.trim()}
          className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 transition">
          ✚ Ajouter
        </button>
        <button type="button" onClick={reset}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition">
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── KanbanBoard ───────────────────────────────────────────────────────────────
function KanbanBoard({ tasks, evaluation, busy, onUpdateStatus, onDelete, onAdd, onUpdateTask, currentUser, applicationId }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

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
    evaluation: evaluation || null
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

  return (
    <section className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
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
                style={{ width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#0d9488)" }} />
            </div>
            <span className="text-sm font-black text-slate-600">{pct}%</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { label: "Total", value: stats.total, cls: "bg-white border-slate-200 text-slate-700" },
          { label: "À faire", value: stats.todo, cls: "bg-slate-50 border-slate-200 text-slate-600" },
          { label: "En cours", value: stats.in_progress, cls: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Terminé", value: stats.done, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          ...(stats.evaluation ? [{
            label: "Note Finale",
            value: `${stats.evaluation.score ?? "?"}/20`,
            cls: "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
          }] : [])
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
          const isOver = dragOverCol === col.key;

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
                    applicationId={applicationId}
                    onDragStart={(taskId) => setDraggingId(taskId)}
                    onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
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

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [commentsRes, setCommentsRes] = useState({ data: [] });
  const [evaluation, setEvaluation] = useState(null);
  const [commentBody, setCommentBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [evalForm, setEvalForm] = useState({ score: "", final_decision: "pending", notes: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks"); // tasks, feedback, evaluation, interviews

  const fetchUserData = async () => {
    try {
      const res = await api.get("/user/profile");
      setUserData(res.data);
    } catch (err) {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      setUserData(stored);
    }
  };

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

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

  useEffect(() => {
    if (!id) return;
    // ✅ Tous les 4 appels en PARALLÈLE — plus de séquence bloquante
    setLoading(true);
    Promise.allSettled([
      api.get(`/encadrant/supervision/applications/${id}`)
        .then(r => setDetail(r.data))
        .catch(() => setDetail(null)),
      api.get(`/encadrant/applications/${id}/tasks?per_page=50`)
        .then(r => { const raw = r.data?.data ?? r.data ?? []; setTasks(Array.isArray(raw) ? raw : []); })
        .catch(() => { }),
      api.get(`/encadrant/applications/${id}/comments`)
        .then(r => setCommentsRes(r.data))
        .catch(() => { }),
      api.get(`/encadrant/applications/${id}/evaluation`)
        .then(r => {
          const ev = r.data;
          setEvaluation(ev);
          if (ev) setEvalForm({
            score: ev.score != null ? String(ev.score) : "",
            final_decision: ev.final_decision || "pending",
            notes: ev.notes || "",
          });
        })
        .catch(() => { }),
    ]).finally(() => setLoading(false));
    fetchUserData();
  }, [id]);

  const patchAppStatus = (status) => {
    setBusy(true);
    api.patch(`/encadrant/supervision/applications/${id}/status`, { status })
      .then(r => setDetail(d => ({ ...d, status: r.data.status })))
      .finally(() => setBusy(false));
  };

  const handleAddTask = (data) => {
    if (!data) return; // called with null from onUpdateTask signal, ignore
    setBusy(true);
    // Support image file in description
    const { _imageFile, ...rest } = data;
    if (_imageFile) {
      const fd = new FormData();
      Object.entries(rest).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v); });
      fd.append("attachment", _imageFile);
      api.post(`/encadrant/applications/${id}/tasks`, fd, { headers: { "Content-Type": "multipart/form-data" } })
        .then(r => setTasks(prev => [...prev, r.data]))
        .catch(() => loadTasks())
        .finally(() => setBusy(false));
    } else {
      api.post(`/encadrant/applications/${id}/tasks`, rest)
        .then(r => setTasks(prev => [...prev, r.data]))
        .catch(() => loadTasks())
        .finally(() => setBusy(false));
    }
  };

  const handleUpdateTaskStatus = (taskId, status) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    api.put(`/encadrant/tasks/${taskId}`, { status })
      .catch(() => loadTasks());
  };

  const handleUpdateTask = (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    // Optimistic removal
    setTasks(prev => prev.filter(t => t.id !== taskId));
    api.delete(`/encadrant/tasks/${taskId}`)
      .catch(() => loadTasks());
  };

  const addComment = (e) => {
    e.preventDefault();
    if (!commentBody.trim()) { flash("error", "Saisissez un commentaire avant d'enregistrer."); return; }
    setBusy(true);
    api.post(`/encadrant/applications/${id}/comments`, { body: commentBody.trim() })
      .then(r => {
        const newComment = r.data;
        setCommentBody("");
        // Optimistic insert — add to list directly
        setCommentsRes(prev => ({ ...prev, data: [...(prev.data || []), newComment] }));
        flash("success", "Commentaire enregistré.");
      })
      .catch(err => flash("error", err.response?.data?.message || "Impossible d'enregistrer le commentaire."))
      .finally(() => setBusy(false));
  };

  const deleteComment = (commentId) => {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    // Optimistic removal
    setCommentsRes(prev => ({ ...prev, data: (prev.data || []).filter(c => c.id !== commentId) }));
    api.delete(`/encadrant/comments/${commentId}`)
      .catch(() => loadComments());
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

  const s = detail.student;
  const offer = detail.offer;
  const interviews = detail.interviews || [];
  const cv = storageUrl(s?.cv_path || detail.cv);
  const comments = commentsRes.data || [];
  const currentStatus = APP_STATUSES.find(a => a.value === detail.status);

  const roleConfig = { label: "Encadrant", color: "purple", icon: "🎓" };
  const menuItems = getEnterpriseMenuItems({}, "encadrant");

  return (
    <BaseLayout
      variant="encadrant"
      title={s?.name || "Détails Étudiant"}
      headerSubtitle={s?.email || "Chargement..."}
      menuItems={menuItems}
      sidebarHeader={
        <EnterpriseSidebarHeader
          enterpriseName={userData?.company_name}
          logoUrl={userData?.logo_url}
          logo={userData?.logo}
          roleConfig={roleConfig}
          name={userData?.name}
          email={userData?.email}
        />
      }
      headerActions={
        <div className="flex items-center gap-2">
          {currentStatus && (
            <span className={`hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          )}
          <select
            value={detail.status}
            disabled={busy}
            onChange={(e) => patchAppStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-sm"
          >
            {APP_STATUSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {cv && (
            <a href={cv} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition border border-indigo-200">
              CV
            </a>
          )}
        </div>
      }
    >
      <div className="p-0 space-y-8">
        <Toast error={formError} success={formSuccess} />

        {/* ── Sub Header Infos ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg">
              {s?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">{s?.name}</h2>
              <p className="text-xs text-slate-500">{s?.school || "Étudiant"}</p>
            </div>
          </div>
          {offer && (
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5">
              <span className="font-bold text-xs text-indigo-900">{offer.title}</span>
            </div>
          )}
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="flex items-center gap-1 border-b border-slate-200">
          {[
            { id: "tasks", label: "Tâches", icon: "📋" },
            { id: "feedback", label: "Feedback", icon: "💬" },
            { id: "evaluation", label: "Évaluation", icon: "🎓" },
            { id: "interviews", label: "Entretiens", icon: "📅" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 -mb-[2px] ${activeTab === tab.id
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="mt-6">
          {activeTab === "tasks" && (
            <KanbanBoard
              tasks={tasks}
              evaluation={evaluation}
              busy={busy}
              onUpdateStatus={handleUpdateTaskStatus}
              onDelete={handleDeleteTask}
              onAdd={handleAddTask}
              onUpdateTask={handleUpdateTask}
              currentUser={currentUser}
              applicationId={applicationId}
            />
          )}

          {activeTab === "feedback" && (
            <section className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="p-2 bg-amber-100 rounded-lg text-amber-600 text-lg">💬</span>
                  Feedback général
                </h2>
              </div>

              <form onSubmit={addComment} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm focus-within:border-indigo-300 transition-colors">
                <textarea
                  placeholder="Votre feedback général pour le suivi du stagiaire…"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition resize-none"
                />
                <div className="flex justify-end">
                  <button type="submit" disabled={busy}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-md active:scale-95">
                    Enregistrer le feedback
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm">Aucun feedback enregistré pour le moment.</p>
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">
                            {(c.encadrant?.name || "E")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{c.encadrant?.name || "Encadrant"}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{c.created_at ? new Date(c.created_at).toLocaleString("fr-FR") : ""}</p>
                          </div>
                        </div>
                        <button onClick={() => deleteComment(c.id)} disabled={busy}
                          className="p-2 rounded-lg text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">{c.body}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {activeTab === "evaluation" && (
            <section className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="p-2 bg-emerald-100 rounded-lg text-emerald-600 text-lg">🎓</span>
                Évaluation finale
              </h2>

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mb-6">
                <p className="text-sm text-indigo-700 leading-relaxed">
                  Cette section permet d'attribuer une note finale, une décision officielle et une appréciation globale qui sera visible par l'étudiant et l'administration.
                </p>
              </div>

              <form onSubmit={saveEvaluation}
                className="rounded-2xl border border-slate-200 bg-white p-8 space-y-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-indigo-500" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Note sur 20</label>
                    <div className="relative">
                      <input type="number" min={0} max={20} step={0.5}
                        value={evalForm.score}
                        onChange={(e) => setEvalForm(f => ({ ...f, score: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-black text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-400 transition-all" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">/ 20</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Décision Finale</label>
                    <select
                      value={evalForm.final_decision}
                      onChange={(e) => setEvalForm(f => ({ ...f, final_decision: e.target.value }))}
                      className="w-full h-[52px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-400 transition-all appearance-none">
                      {DECISIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Appréciation détaillée</label>
                  <textarea
                    value={evalForm.notes}
                    onChange={(e) => setEvalForm(f => ({ ...f, notes: e.target.value }))}
                    rows={6}
                    placeholder="Décrivez les points forts, les axes d'amélioration et le comportement général du stagiaire durant sa mission..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-400 transition-all resize-none" />
                </div>

                <button type="submit" disabled={busy}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-black hover:from-indigo-700 hover:to-indigo-800 transition shadow-lg active:scale-[0.98] disabled:opacity-50">
                  {evaluation ? "Mettre à jour l'évaluation" : "Confirmer l'évaluation"}
                </button>
              </form>
            </section>
          )}

          {activeTab === "interviews" && (
            <section className="space-y-6 max-w-4xl">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="p-2 bg-blue-100 rounded-lg text-blue-600 text-lg">📅</span>
                Historique des entretiens
              </h2>

              {interviews.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">Aucun entretien enregistré.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {interviews.map(it => (
                    <div key={it.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase">
                          {it.date}
                        </div>
                        <span className="text-xs font-bold text-slate-400">{it.time}</span>
                      </div>
                      <h3 className="font-black text-slate-800 mb-2">Entretien de suivi</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {it.location || it.meeting_link || "Lieu non précisé"}
                      </p>
                      {it.result && (
                        <div className="mt-4 pt-4 border-t border-slate-50">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                            RÉSULTAT : {it.result.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
      <ChatBox />
    </BaseLayout>
  );
}