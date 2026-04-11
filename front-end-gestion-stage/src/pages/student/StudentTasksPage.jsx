import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Typography, Select, Option } from "@material-tailwind/react";
import Swal from "sweetalert2";
import api from "../../services/api";
import BaseLayout from "../../components/layout/BaseLayout";
import { StudentSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getStudentMenuItems } from "../../config/sidebarConfig";
import StudentNotificationBell from "../../components/student/StudentNotificationBell";
import ChatBox from "../../components/ChatBox";

// ── Column definitions ────────────────────────────────────────────────────────
const TASK_COLUMNS = [
  {
    key: "todo", label: "À faire",
    headerGrad: "linear-gradient(135deg,#64748b,#475569)",
    border: "border-slate-200", bg: "bg-slate-50/60",
    dot: "bg-slate-400", dropRing: "ring-slate-400",
    emptyIcon: "📋", iconBg: "bg-slate-100", iconColor: "text-slate-600",
    accentColor: "#64748b",
  },
  {
    key: "in_progress", label: "En cours",
    headerGrad: "linear-gradient(135deg,#f59e0b,#ea580c)",
    border: "border-amber-200", bg: "bg-amber-50/30",
    dot: "bg-amber-400", dropRing: "ring-amber-400",
    emptyIcon: "⚡", iconBg: "bg-amber-100", iconColor: "text-amber-600",
    accentColor: "#f59e0b",
  },
  {
    key: "done", label: "Terminé",
    headerGrad: "linear-gradient(135deg,#10b981,#0d9488)",
    border: "border-emerald-200", bg: "bg-emerald-50/20",
    dot: "bg-emerald-500", dropRing: "ring-emerald-400",
    emptyIcon: "✅", iconBg: "bg-emerald-100", iconColor: "text-emerald-600",
    accentColor: "#10b981",
  },
];

// ── RichCommentInput ──────────────────────────────────────────────────────────
function RichCommentInput({ value, onChange, onSend, busy, placeholder = "Votre commentaire…" }) {
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [showFormatBar, setShowFormatBar] = useState(false);
  const textareaRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(f => ({
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[idx].preview) URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  const handleSend = () => {
    onSend(attachments);
    setAttachments([]);
    setShowFormatBar(false);
  };

  const insertFormat = (prefix, suffix = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const newVal = value.substring(0, start) + prefix + selected + suffix + value.substring(end);
    onChange(newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("sheet") || type.includes("excel")) return "📊";
    if (type.includes("zip") || type.includes("rar")) return "🗜️";
    return "📎";
  };

  const canSend = (value || "").trim() || attachments.length > 0;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition">
      {/* Format toolbar */}
      {showFormatBar && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-100 bg-slate-50">
          {[
            { label: "B", title: "Gras", action: () => insertFormat("**", "**"), cls: "font-black" },
            { label: "I", title: "Italique", action: () => insertFormat("_", "_"), cls: "italic" },
            { label: "S", title: "Barré", action: () => insertFormat("~~", "~~"), cls: "line-through" },
            { label: "< >", title: "Code", action: () => insertFormat("`", "`"), cls: "font-mono text-xs" },
            { label: "—", title: "Séparateur", action: () => insertFormat("\n---\n"), cls: "" },
          ].map(btn => (
            <button
              key={btn.label}
              type="button"
              title={btn.title}
              onClick={btn.action}
              className={`w-7 h-7 text-xs text-slate-600 hover:bg-slate-200 rounded flex items-center justify-center transition ${btn.cls}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSend(); }}
        onFocus={() => setShowFormatBar(true)}
        rows={3}
        className="w-full px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-300 bg-transparent border-none outline-none resize-none"
      />

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative group flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 max-w-[180px]">
              {att.preview ? (
                <img src={att.preview} alt={att.name} className="w-8 h-8 object-cover rounded" />
              ) : (
                <span className="text-base">{getFileIcon(att.type)}</span>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{att.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(att.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-slate-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-500 transition opacity-0 group-hover:opacity-100"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-slate-100 bg-slate-50/60">
        <button
          type="button"
          title="Formater le texte"
          onClick={() => setShowFormatBar(v => !v)}
          className={`w-7 h-7 rounded flex items-center justify-center transition ${showFormatBar ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
          </svg>
        </button>

        <button
          type="button"
          title="Joindre une image ou un fichier"
          onClick={() => fileInputRef.current?.click()}
          className="w-7 h-7 rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <button
          type="button"
          title="Joindre une image"
          onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); } }}
          className="w-7 h-7 rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <span className="text-xs text-slate-300 ml-1 hidden sm:inline">Ctrl+Entrée pour envoyer</span>

        <button
          type="button"
          onClick={handleSend}
          disabled={busy || !canSend}
          className="ml-auto px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 flex items-center gap-1.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Envoyer
        </button>
      </div>
    </div>
  );
}

// ── CommentBubble ─────────────────────────────────────────────────────────────
function CommentBubble({ comment, isEncadrant, isCurrentUser, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(comment.body || comment.content || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const name = comment.user?.name || (isEncadrant ? "Encadrant" : "Moi");
  const date = comment.created_at
    ? new Date(comment.created_at).toLocaleString("fr-FR", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    })
    : "";

  const isTemp = String(comment.id).startsWith("temp-");

  const bubbleClass = isEncadrant
    ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100"
    : "bg-blue-50 border-blue-100";
  const avatarClass = isEncadrant
    ? "bg-indigo-600"
    : "bg-blue-600";
  const nameClass = isEncadrant ? "text-indigo-900" : "text-blue-900";

  // Render attachments
  const rawAtts = comment.attachment || comment.attachments || [];
  const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");
  const attachments = Array.isArray(rawAtts)
    ? rawAtts.map(a => typeof a === 'string' ? {
      url: a.startsWith('http') ? a : `${API_ORIGIN}/storage/${a}`,
      name: a.split('/').pop(),
      type: a.match(/\.(jpeg|jpg|gif|png)$/i) ? 'image/jpeg' : 'application/octet-stream'
    } : a)
    : [];

  const handleSaveEdit = () => {
    if (editVal.trim()) {
      onEdit(comment.id, editVal.trim());
      setEditing(false);
    }
  };

  return (
    <div className={`rounded-xl border px-3.5 py-3 ${bubbleClass} ${isTemp ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-7 h-7 rounded-full ${avatarClass} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
          {name[0]?.toUpperCase()}
        </div>
        <span className={`text-xs font-black ${nameClass}`}>{name}</span>
        {isEncadrant && (
          <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full border border-indigo-200 font-bold">Encadrant</span>
        )}
        <span className="text-xs text-slate-400 ml-auto">{date}</span>

        {/* Actions : edit + delete pour l'utilisateur courant */}
        {isCurrentUser && !isTemp && (
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={() => { setEditing(v => !v); setEditVal(comment.body || comment.content || ""); }}
              title="Modifier"
              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-white hover:text-blue-500 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Supprimer"
                className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-white hover:text-red-500 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => onDelete(comment.id)}
                  className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition font-bold">Supprimer</button>
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition">Annuler</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit mode */}
      {editing ? (
        <div className="ml-9 space-y-2">
          <textarea
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveEdit}
              className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Enregistrer
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-xs bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ml-9">
            {comment.body || comment.content}
          </p>
          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="ml-9 mt-2 flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                att.type?.startsWith("image/") && att.url ? (
                  <a key={i} href={att.url} target="_blank" rel="noreferrer">
                    <img src={att.url} alt={att.name} className="h-20 w-auto rounded-lg border border-slate-200 object-cover hover:opacity-90 transition" />
                  </a>
                ) : (
                  <a key={i} href={att.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-blue-600 hover:bg-slate-50 transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {att.name || "Fichier joint"}
                  </a>
                )
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── TaskModal ─────────────────────────────────────────────────────────────────
function TaskModal({
  task, col, encadrantId, currentUserId, applicationId,
  onClose, commentDrafts, setCommentDrafts,
  sendComment, deleteComment, editComment, onUpdateTask, busy,
}) {
  const overlayRef = useRef(null);
  const [showEditDesc, setShowEditDesc] = useState(false);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [savingDesc, setSavingDesc] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!task || !col) return null;

  const taskComments = task.comments || task.taskComments || [];
  const encComments = taskComments.filter(c => encadrantId && c.user?.id === encadrantId);
  const myComments = taskComments.filter(c => (encadrantId ? c.user?.id !== encadrantId : true));
  const isOverdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();

  const handleSend = (attachments) => {
    sendComment(task.id, attachments);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col"
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
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border"
                style={{ background: col.accentColor + "18", color: col.accentColor, borderColor: col.accentColor + "44" }}>
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
          {/* Bouton éditer description */}
          {applicationId && onUpdateTask && (
            <button
              onClick={() => { setShowEditDesc(v => !v); setEditDescription(task.description || ""); }}
              title="Modifier la description"
              className={`w-8 h-8 flex-shrink-0 rounded-xl border flex items-center justify-center transition
                ${showEditDesc ? "border-blue-400 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button onClick={onClose}
            className="w-8 h-8 flex-shrink-0 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5 flex-1">

          {/* Edit description form */}
          {showEditDesc && applicationId && (
            <div className="border border-blue-200 rounded-xl bg-blue-50/40 p-4 space-y-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Modifier la description</p>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={4}
                placeholder="Description de la tâche..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white resize-none text-slate-700"
              />
              <div className="flex gap-2">
                <button
                  disabled={savingDesc}
                  onClick={async () => {
                    setSavingDesc(true);
                    try {
                      const r = await api.put(
                        `/student/applications/${applicationId}/tasks/${task.id}`,
                        { description: editDescription.trim() || null }
                      );
                      onUpdateTask?.(r.data);
                      setShowEditDesc(false);
                    } catch { }
                    finally { setSavingDesc(false); }
                  }}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition">
                  {savingDesc ? "Enregistrement…" : "✓ Enregistrer"}
                </button>
                <button onClick={() => setShowEditDesc(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition">Annuler</button>
              </div>
            </div>
          )}

          {/* Description (read-only when not editing) */}
          {!showEditDesc && (task.description ? (
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
          ))}

          {/* Feedback encadrant */}
          {encComments.length > 0 && (
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Feedback de l&apos;encadrant
              </p>
              <div className="space-y-2">
                {encComments.map((c, idx) => (
                  <CommentBubble
                    key={c.id ?? idx}
                    comment={c}
                    isEncadrant={true}
                    isCurrentUser={currentUserId && c.user?.id === currentUserId}
                    onDelete={(cid) => deleteComment(task.id, cid)}
                    onEdit={(cid, body) => editComment(task.id, cid, body)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mes commentaires */}
          {myComments.length > 0 && (
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Mes commentaires</p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {myComments.map((c, idx) => (
                  <CommentBubble
                    key={c.id ?? idx}
                    comment={c}
                    isEncadrant={false}
                    isCurrentUser={true}
                    onDelete={(cid) => deleteComment(task.id, cid)}
                    onEdit={(cid, body) => editComment(task.id, cid, body)}
                  />
                ))}
              </div>
            </div>
          )}

          {encComments.length === 0 && myComments.length === 0 && (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400 italic text-center">
              Aucun commentaire pour l&apos;instant.
            </div>
          )}

          {/* Ajouter un commentaire (rich) */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ajouter un commentaire</p>
            <RichCommentInput
              value={commentDrafts[task.id] || ""}
              onChange={(v) => setCommentDrafts(d => ({ ...d, [task.id]: v }))}
              onSend={handleSend}
              busy={busy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StudentTaskCard ───────────────────────────────────────────────────────────
function StudentTaskCard({ task, col, encadrantId, onDragStart, onDragEnd, onOpenModal }) {
  const [isDragging, setIsDragging] = useState(false);
  const isOverdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
  const taskComments = task.comments || task.taskComments || [];
  const encComments = taskComments.filter(c => encadrantId && c.user?.id === encadrantId);
  const totalCount = taskComments.length;

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(task.id); setIsDragging(true); }}
      onDragEnd={() => { onDragEnd(); setIsDragging(false); }}
      onClick={() => onOpenModal(task)}
      className={`group bg-white rounded-xl border ${col.border} shadow-sm
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
          <p className="flex-1 font-semibold text-sm text-slate-900 leading-snug">{task.title}</p>
          {encComments.length > 0 && (
            <span className="flex-shrink-0 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-200" title="Feedback de l'encadrant">
              💬 {encComments.length}
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
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border
            ${totalCount > 0 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {totalCount}
          </span>
          <span className="ml-auto text-xs text-slate-300 group-hover:text-slate-400 transition hidden sm:inline">
            Détails →
          </span>
        </div>
      </div>
    </div>
  );
}

// ── KanbanBoard ───────────────────────────────────────────────────────────────
function StudentKanbanBoard({ tasks, encadrantId, currentUserId, busy, applicationId,
  commentDrafts, setCommentDrafts, sendComment, deleteComment, editComment, onPatchStatus, onUpdateTask }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [modalTask, setModalTask] = useState(null);

  const grouped = TASK_COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return acc;
  }, {});

  const handleDrop = async (e, toStatus) => {
    e.preventDefault();
    if (!draggingId) return;
    const task = tasks.find(t => t.id === draggingId);
    if (task && task.status !== toStatus) await onPatchStatus(task.id, toStatus);
    setDraggingId(null);
    setDragOverCol(null);
  };

  const modalCol = modalTask ? TASK_COLUMNS.find(c => c.key === modalTask.status) : null;
  const syncedModalTask = modalTask ? tasks.find(t => t.id === modalTask.id) || modalTask : null;

  return (
    <>
      {syncedModalTask && (
        <TaskModal
          task={syncedModalTask}
          col={modalCol}
          encadrantId={encadrantId}
          currentUserId={currentUserId}
          applicationId={applicationId}
          onClose={() => setModalTask(null)}
          commentDrafts={commentDrafts}
          setCommentDrafts={setCommentDrafts}
          sendComment={sendComment}
          deleteComment={deleteComment}
          editComment={editComment}
          onUpdateTask={(updated) => {
            setModalTask(prev => prev ? { ...prev, ...updated } : null);
            onUpdateTask?.(updated);
          }}
          busy={busy}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TASK_COLUMNS.map(col => {
          const colTasks = grouped[col.key] || [];
          const isOver = dragOverCol === col.key;

          return (
            <div key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null); }}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`rounded-2xl border transition-all duration-200 ${col.border} ${col.bg}
                ${isOver ? `ring-2 ${col.dropRing} ring-offset-2 shadow-lg` : "shadow-sm"}`}
            >
              <div className="rounded-t-2xl px-4 py-3 flex items-center justify-between" style={{ background: col.headerGrad }}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-white font-bold text-sm tracking-wide">{col.label}</span>
                </div>
                <span className="bg-white/25 text-white text-xs font-black px-2.5 py-0.5 rounded-full">{colTasks.length}</span>
              </div>

              {isOver && (
                <div className="mx-3 mt-3 h-1.5 rounded-full opacity-60 animate-pulse" style={{ background: col.headerGrad }} />
              )}

              <div className="p-3 space-y-2.5 min-h-[180px]">
                {colTasks.length === 0 && !isOver && (
                  <div className="flex flex-col items-center justify-center h-20 text-xs text-slate-400 italic gap-1.5">
                    <span className="text-xl">{col.emptyIcon}</span>
                    <span>Aucune tâche</span>
                  </div>
                )}
                {colTasks.map(task => (
                  <StudentTaskCard
                    key={task.id}
                    task={task}
                    col={col}
                    encadrantId={encadrantId}
                    onDragStart={(id) => setDraggingId(id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                    onOpenModal={setModalTask}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── RichTaskForm ──────────────────────────────────────────────────────────────
function RichTaskForm({ newTask, setNewTask, onCreate, onCancel, creating }) {
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const items = files.map(f => ({
      file: f, name: f.name, size: f.size, type: f.type,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    setAttachments(prev => [...prev, ...items]);
    e.target.value = "";
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[idx].preview) URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  const formatBytes = (b) => b < 1024 ? b + " B" : b < 1024 * 1024 ? (b / 1024).toFixed(1) + " KB" : (b / (1024 * 1024)).toFixed(1) + " MB";

  const getFileIcon = (type) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("sheet") || type.includes("excel")) return "📊";
    return "📎";
  };

  const handleCreate = () => {
    onCreate(attachments);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h4 className="font-bold text-blue-900 text-sm">Nouvelle tâche</h4>
      </div>

      <div className="space-y-3">
        {/* Titre */}
        <div>
          <label className="block text-xs font-semibold text-blue-800 mb-1">
            Titre <span className="text-rose-500">*</span>
          </label>
          <input type="text" placeholder="Ex : Rédiger le rapport hebdomadaire"
            value={newTask.title}
            onChange={(e) => setNewTask(t => ({ ...t, title: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="w-full px-3.5 py-2.5 border border-blue-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition placeholder-slate-400"
          />
        </div>

        {/* Description avec formatage */}
        <div>
          <label className="block text-xs font-semibold text-blue-800 mb-1">
            Description <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <div className="border border-blue-300 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-500 transition">
            {/* Mini format bar */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-blue-100 bg-blue-50/50">
              {[
                { label: "B", title: "Gras", cls: "font-black" },
                { label: "I", title: "Italique", cls: "italic" },
                { label: "< >", title: "Code inline", cls: "font-mono text-xs" },
              ].map(btn => (
                <button key={btn.label} type="button" title={btn.title}
                  className={`w-6 h-6 text-xs text-slate-500 hover:bg-blue-200 rounded flex items-center justify-center transition ${btn.cls}`}>
                  {btn.label}
                </button>
              ))}
              <span className="text-xs text-blue-300 ml-1">Markdown supporté</span>
            </div>
            <textarea
              placeholder="Décrivez la tâche en détail…"
              value={newTask.description}
              onChange={(e) => setNewTask(t => ({ ...t, description: e.target.value }))}
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-transparent border-none outline-none resize-none placeholder-slate-400"
            />
          </div>
        </div>

        {/* Date limite */}
        <div>
          <label className="block text-xs font-semibold text-blue-800 mb-1">
            Date limite <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <input type="date" value={newTask.due_date}
            onChange={(e) => setNewTask(t => ({ ...t, due_date: e.target.value }))}
            className="w-full px-3.5 py-2.5 border border-blue-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
          />
        </div>

        {/* Pièces jointes */}
        <div>
          <label className="block text-xs font-semibold text-blue-800 mb-1">
            Pièces jointes <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-xl px-4 py-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
          >
            <div className="flex flex-col items-center gap-1.5">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xs text-blue-600 font-semibold">Cliquez pour ajouter des fichiers</p>
              <p className="text-xs text-blue-400">Images, PDF, documents…</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" multiple accept="*/*" onChange={handleFileChange} className="hidden" />

          {attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative group flex items-center gap-1.5 bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 max-w-[200px]">
                  {att.preview ? (
                    <img src={att.preview} alt={att.name} className="w-8 h-8 object-cover rounded" />
                  ) : (
                    <span className="text-base">{getFileIcon(att.type)}</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{att.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(att.size)}</p>
                  </div>
                  <button type="button" onClick={() => removeAttachment(idx)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-slate-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-500 transition opacity-0 group-hover:opacity-100">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2.5 pt-1">
        <button onClick={handleCreate} disabled={creating || !newTask.title.trim()}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95">
          {creating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Création…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Créer la tâche
            </>
          )}
        </button>
        <button onClick={onCancel}
          className="flex-1 bg-white border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition active:scale-95">
          Annuler
        </button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function StudentTasksPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [supervision, setSupervision] = useState(null);
  const [loadingSup, setLoadingSup] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", due_date: "" });
  const [creating, setCreating] = useState(false);

  // Load candidatures
  useEffect(() => {
    api.get("/my-applications")
      .then(res => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setApplications(raw);
      })
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const withEnc = applications.filter(a => a.encadrant_id || a.encadrant);
    if (withEnc.length && selectedId == null) setSelectedId(withEnc[0].id);
  }, [applications, selectedId]);

  const loadSupervision = useCallback(() => {
    if (!selectedId) return;
    setLoadingSup(true);
    api.get(`/student/applications/${selectedId}/supervision`)
      .then(res => {
        const data = res.data;
        if (data?.tasks) {
          data.tasks = data.tasks.map(t => ({
            ...t,
            comments: t.taskComments || t.comments || t.task_comments || [],
          }));
        }
        setSupervision(data);
      })
      .catch(() => setSupervision(null))
      .finally(() => setLoadingSup(false));
  }, [selectedId]);

  useEffect(() => { loadSupervision(); }, [loadSupervision]);

  // ── Create task ─────────────────────────────────────────────────────────────
  const createTask = async (attachments = []) => {
    if (!newTask.title.trim()) {
      Swal.fire({ icon: "warning", title: "Titre requis" });
      return;
    }
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("title", newTask.title);
      formData.append("description", newTask.description || "");
      formData.append("due_date", newTask.due_date || "");
      attachments.forEach(att => formData.append("attachments[]", att.file));

      await api.post(`/student/applications/${selectedId}/tasks`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire({ icon: "success", title: "Tâche créée !", timer: 2000, showConfirmButton: false });
      setNewTask({ title: "", description: "", due_date: "" });
      setShowCreateTask(false);
      loadSupervision();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: err.response?.data?.message || "Impossible de créer la tâche" });
    } finally {
      setCreating(false);
    }
  };

  // ── Patch status (optimistic) ──────────────────────────────────────────────
  const patchStatus = async (taskId, status) => {
    if (!selectedId) return;
    setSupervision(prev => {
      if (!prev) return prev;
      return { ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status } : t) };
    });
    try {
      await api.patch(`/student/applications/${selectedId}/tasks/${taskId}/status`, { status });
    } catch (e) {
      console.error(e);
      loadSupervision();
    }
  };

  // ── Send comment with attachments (optimistic) ─────────────────────────────
  const sendComment = async (taskId, attachments = []) => {
    const body = (commentDrafts[taskId] || "").trim();
    if (!body && attachments.length === 0) return;
    if (!selectedId) return;
    setBusy(true);

    const tempComment = {
      id: `temp-${Date.now()}`,
      body,
      created_at: new Date().toISOString(),
      user: supervision?.student || { name: "Moi" },
      attachments: attachments.map(a => ({
        name: a.name, type: a.type,
        url: a.preview || null,
      })),
    };

    setSupervision(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === taskId
            ? { ...t, comments: [...(t.comments || []), tempComment] }
            : t
        ),
      };
    });
    setCommentDrafts(d => ({ ...d, [taskId]: "" }));

    try {
      const formData = new FormData();
      if (body) formData.append("body", body);
      attachments.forEach(att => formData.append("attachments[]", att.file));

      await api.post(
        `/student/applications/${selectedId}/tasks/${taskId}/comments`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      loadSupervision();
    } catch (e) {
      console.error(e);
      setSupervision(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map(t =>
            t.id === taskId
              ? { ...t, comments: (t.comments || []).filter(c => c.id !== tempComment.id) }
              : t
          ),
        };
      });
      setCommentDrafts(d => ({ ...d, [taskId]: body }));
    } finally {
      setBusy(false);
    }
  };

  // ── Delete comment ─────────────────────────────────────────────────────────
  const deleteComment = async (taskId, commentId) => {
    if (!selectedId) return;

    // Optimistic remove
    setSupervision(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === taskId
            ? { ...t, comments: (t.comments || []).filter(c => c.id !== commentId) }
            : t
        ),
      };
    });

    try {
      await api.delete(`/student/applications/${selectedId}/tasks/${taskId}/comments/${commentId}`);
    } catch (e) {
      console.error(e);
      loadSupervision(); // rollback
    }
  };

  // ── Edit comment ──────────────────────────────────────────────────────────
  const editComment = async (taskId, commentId, body) => {
    if (!selectedId || !body.trim()) return;

    // Optimistic update
    setSupervision(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === taskId
            ? {
              ...t,
              comments: (t.comments || []).map(c =>
                c.id === commentId ? { ...c, body } : c
              ),
            }
            : t
        ),
      };
    });

    try {
      await api.put(`/student/applications/${selectedId}/tasks/${taskId}/comments/${commentId}`, { body });
    } catch (e) {
      console.error(e);
      loadSupervision(); // rollback
    }
  };

  const appsWithEncadrant = useMemo(
    () => applications.filter(a => a.encadrant_id || a.encadrant),
    [applications]
  );

  const tasks = supervision?.tasks || [];
  const encadrantId = supervision?.encadrant?.id ?? null;
  const currentUserId = supervision?.student?.id ?? null;

  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
  }), [tasks]);

  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const encName = supervision?.encadrant?.name || "—";
  const encEmail = supervision?.encadrant?.email || null;

  const sidebarExtra = (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
      <Typography variant="small" className="font-bold text-blue-800 mb-1">🎯 Espace étudiant</Typography>
      <Typography variant="small" className="text-blue-600 text-xs leading-relaxed">
        Cliquez sur une carte pour voir ses détails. Glissez-la pour changer son statut.
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
      <div className="p-6 max-w-6xl mx-auto space-y-7">

        {loading ? (
          <div className="flex items-center gap-3 text-slate-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Chargement…
          </div>
        ) : appsWithEncadrant.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-semibold text-slate-700 mb-1">Aucune candidature avec encadrant</p>
            <p className="text-sm text-slate-500">Vos tâches apparaîtront ici une fois qu&apos;un encadrant vous sera assigné.</p>
          </div>
        ) : (
          <>
            {/* Encadrant header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between
              bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                  {encName[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Votre encadrant</p>
                  <p className="font-black text-slate-900">{encName}</p>
                  {encEmail && <p className="text-xs text-slate-500">{encEmail}</p>}
                </div>
              </div>
              <div className="w-full sm:w-72">
                <Select label="Offre de stage" value={selectedId ? String(selectedId) : ""}
                  onChange={(v) => setSelectedId(Number(v))}>
                  {appsWithEncadrant.map(a => (
                    <Option key={a.id} value={String(a.id)}>
                      {a.offer?.title || `Candidature #${a.id}`}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Stats */}
            {!loadingSup && supervision && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total", value: stats.total, cls: "bg-white border-slate-200 text-slate-700" },
                  { label: "À faire", value: stats.todo, cls: "bg-slate-50 border-slate-200 text-slate-600" },
                  { label: "En cours", value: stats.in_progress, cls: "bg-amber-50 border-amber-200 text-amber-700" },
                  { label: "Terminé", value: stats.done, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl border px-4 py-3 shadow-sm ${s.cls}`}>
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-xs font-semibold opacity-70 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            {!loadingSup && supervision && stats.total > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#0d9488)" }} />
                </div>
                <span className="text-sm font-black text-slate-700 min-w-[3rem] text-right">{pct}%</span>
                <span className="text-xs text-slate-500 font-semibold">complété</span>
              </div>
            )}

            {/* Loading */}
            {loadingSup ? (
              <div className="flex items-center gap-3 text-slate-500 py-8 justify-center">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Chargement des tâches…
              </div>
            ) : supervision ? (
              <>
                {/* Bouton créer */}
                {!showCreateTask && (
                  <button onClick={() => setShowCreateTask(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 active:scale-95 transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Créer une nouvelle tâche
                  </button>
                )}

                {/* Formulaire création enrichi */}
                {showCreateTask && (
                  <RichTaskForm
                    newTask={newTask}
                    setNewTask={setNewTask}
                    onCreate={createTask}
                    onCancel={() => { setShowCreateTask(false); setNewTask({ title: "", description: "", due_date: "" }); }}
                    creating={creating}
                  />
                )}

                {/* Hint */}
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <span>
                    <strong>Cliquez</strong> sur une carte pour voir ses détails et commentaires.{" "}
                    <strong>Glissez-la</strong> vers une autre colonne pour changer son statut.
                  </span>
                </div>

                {/* Kanban */}
                {tasks.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="font-medium text-slate-500">Aucune tâche assignée pour l&apos;instant.</p>
                    <p className="text-xs mt-1">Votre encadrant vous assignera des tâches prochainement.</p>
                  </div>
                ) : (
                  <StudentKanbanBoard
                    tasks={tasks}
                    encadrantId={encadrantId}
                    currentUserId={currentUserId}
                    busy={busy}
                    applicationId={selectedId}
                    commentDrafts={commentDrafts}
                    setCommentDrafts={setCommentDrafts}
                    sendComment={sendComment}
                    deleteComment={deleteComment}
                    editComment={editComment}
                    onPatchStatus={patchStatus}
                    onUpdateTask={(updated) => {
                      setSupervision(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          tasks: prev.tasks.map(t => t.id === updated.id ? { ...t, ...updated } : t),
                        };
                      });
                    }}
                  />
                )}

                <div className="text-center text-xs text-slate-400 pb-2">
                  {tasks.length} tâche{tasks.length !== 1 ? "s" : ""} au total
                </div>

                {/* Feedback général */}
                {(supervision.comments || []).length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-amber-200"
                      style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}>
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-amber-900 text-sm">Feedback général de votre encadrant</p>
                        <p className="text-xs text-amber-700">
                          {(supervision.comments || []).length} message{(supervision.comments || []).length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {(supervision.comments || []).map((c, idx) => {
                        const name = c.encadrant?.name || c.user?.name || "Encadrant";
                        const date = c.created_at
                          ? new Date(c.created_at).toLocaleString("fr-FR", {
                            day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
                          })
                          : "";
                        return (
                          <div key={c.id ?? idx} className="rounded-xl bg-white border border-amber-100 px-4 py-3.5 shadow-sm">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm flex-shrink-0">
                                {name[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{name}</p>
                                <p className="text-xs text-slate-400">{date}</p>
                              </div>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ml-10">
                              {c.body || c.content || ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Évaluation finale */}
                {supervision.evaluation && (() => {
                  const ev = supervision.evaluation;
                  const score = ev.score ?? ev.note ?? null;
                  const decision = ev.final_decision || "pending";
                  const decisionMap = {
                    pending: { label: "En attente", cls: "bg-slate-100 text-slate-600 border-slate-300" },
                    valide: { label: "Validé ✓", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
                    a_ameliorer: { label: "À améliorer", cls: "bg-amber-100 text-amber-700 border-amber-300" },
                    non_conforme: { label: "Non conforme", cls: "bg-rose-100 text-rose-700 border-rose-300" },
                  };
                  const dec = decisionMap[decision] || decisionMap.pending;
                  const pctScore = score != null ? Math.min((score / 20) * 100, 100) : 0;
                  const scoreColor = score >= 16 ? "#10b981" : score >= 12 ? "#f59e0b" : score >= 8 ? "#f97316" : "#ef4444";

                  return (
                    <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-100"
                        style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)" }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shadow-sm">
                            <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-emerald-900 text-sm">Évaluation finale de stage</p>
                            <p className="text-xs text-emerald-700">Résultat de votre encadrant</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${dec.cls}`}>{dec.label}</span>
                      </div>
                      <div className="px-5 py-5 space-y-4">
                        {score != null && (
                          <div className="flex items-center gap-5">
                            <div className="relative w-20 h-20 flex-shrink-0">
                              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="2.5"
                                  strokeDasharray={`${pctScore} 100`} strokeLinecap="round"
                                  style={{ transition: "stroke-dasharray 1s ease" }} />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-base font-black text-slate-800">{score}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-3xl font-black text-slate-900">{score}<span className="text-base font-semibold text-slate-400">/20</span></p>
                              <p className="text-xs text-slate-500 font-semibold mt-0.5">Note finale</p>
                              <div className="mt-2 w-40 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000"
                                  style={{ width: `${pctScore}%`, background: scoreColor }} />
                              </div>
                            </div>
                          </div>
                        )}
                        {ev.notes && (
                          <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3.5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Appréciation de l&apos;encadrant</p>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ev.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : null}
          </>
        )}
        <ChatBox />
      </div>
    </BaseLayout>
  );
}