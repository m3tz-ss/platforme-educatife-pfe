import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Typography, Breadcrumbs } from "@material-tailwind/react";
import Swal from "sweetalert2";
import api from "../../services/api";
import BaseLayout from "../../components/layout/BaseLayout";
import { StudentSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getStudentMenuItems } from "../../config/sidebarConfig";
import StudentNotificationBell from "../../components/student/StudentNotificationBell";
import ChatBox from "../../components/ChatBox";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

const getStorageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}/storage/${path.replace(/^\//, "")}`;
};

const TASK_COLUMNS = [
  {
    key: "todo", label: "À faire",
    headerGrad: "linear-gradient(135deg,#64748b,#475569)",
    accentColor: "#64748b",
  },
  {
    key: "in_progress", label: "En cours",
    headerGrad: "linear-gradient(135deg,#f59e0b,#ea580c)",
    accentColor: "#f59e0b",
  },
  {
    key: "done", label: "Terminé",
    headerGrad: "linear-gradient(135deg,#10b981,#0d9488)",
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
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition shadow-sm">
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
        rows={4}
        className="w-full px-4 py-3 text-sm text-slate-700 placeholder-slate-400 bg-transparent border-none outline-none resize-y"
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
      <div className="flex items-center gap-1 px-3 py-2 border-t border-slate-100 bg-slate-50/60">
        <button
          type="button"
          title="Formater le texte"
          onClick={() => setShowFormatBar(v => !v)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${showFormatBar ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
          </svg>
        </button>

        <button
          type="button"
          title="Joindre une image ou un fichier"
          onClick={() => fileInputRef.current?.click()}
          className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <button
          type="button"
          title="Joindre une image"
          onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); } }}
          className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <span className="text-xs text-slate-400 ml-2 hidden sm:inline">Ctrl+Entrée pour envoyer</span>

        <button
          type="button"
          onClick={handleSend}
          disabled={busy || !canSend}
          className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const rawAtts = comment.attachment || comment.attachments || [];
  const attachments = Array.isArray(rawAtts)
    ? rawAtts.map(a => {
      const path = typeof a === 'string' ? a : (a.url || a.path);
      return {
        url: getStorageUrl(path),
        name: typeof a === 'string' ? a.split('/').pop() : (a.name || "Fichier"),
        type: (typeof a === 'string' ? a : (a.type || "")).match(/\.(jpeg|jpg|gif|png)$/i) ? 'image/jpeg' : 'application/octet-stream'
      };
    })
    : [];

  const handleSaveEdit = () => {
    if (editVal.trim()) {
      onEdit(comment.id, editVal.trim());
      setEditing(false);
    }
  };

  return (
    <div className={`rounded-xl border px-4 py-3 ${bubbleClass} ${isTemp ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-8 h-8 rounded-full ${avatarClass} flex items-center justify-center text-white text-sm font-black flex-shrink-0`}>
          {name[0]?.toUpperCase()}
        </div>
        <span className={`text-sm font-bold ${nameClass}`}>{name}</span>
        {isEncadrant && (
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-bold">Encadrant</span>
        )}
        <span className="text-xs text-slate-400 ml-auto">{date}</span>

        {isCurrentUser && !isTemp && (
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => { setEditing(v => !v); setEditVal(comment.body || comment.content || ""); }}
              title="Modifier"
              className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-white hover:text-blue-500 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Supprimer"
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-white hover:text-red-500 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => onDelete(comment.id)}
                  className="text-xs px-2.5 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition font-bold">Supprimer</button>
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2.5 py-1 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition font-medium">Annuler</button>
              </div>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="ml-10.5 space-y-2 mt-1">
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
              className="px-3 py-1.5 text-xs bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition font-medium">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ml-10">
            {comment.body || comment.content}
          </p>
          {attachments.length > 0 && (
            <div className="ml-10 mt-3 flex flex-wrap gap-2.5">
              {attachments.map((att, i) => (
                att.type?.startsWith("image/") && att.url ? (
                  <a key={i} href={getStorageUrl(att.url)} target="_blank" rel="noreferrer">
                    <img src={getStorageUrl(att.url)} alt={att.name} className="h-24 w-auto rounded-lg border border-slate-200 object-cover hover:opacity-90 transition shadow-sm" />
                  </a>
                ) : (
                  <a key={i} href={getStorageUrl(att.url)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-blue-600 font-medium hover:bg-blue-50 transition shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default function StudentTaskDetail() {
  const { applicationId, taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [supervision, setSupervision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [applicationId, taskId]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/student/applications/${applicationId}/supervision`);
      const data = res.data;
      if (data?.tasks) {
        data.tasks = data.tasks.map(t => ({
          ...t,
          comments: t.taskComments || t.comments || t.task_comments || [],
        }));
      }
      setSupervision(data);

      const foundTask = data?.tasks?.find(t => t.id === parseInt(taskId));
      if (foundTask) {
        setTask(foundTask);
      } else {
        Swal.fire({ icon: "error", title: "Introuvable", text: "Cette tâche n'existe pas." });
        navigate("/student/tasks");
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible de charger la tâche." });
      navigate("/student/tasks");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setEditImageFile(f);
    setEditImagePreview(URL.createObjectURL(f));
    e.target.value = "";
  };

  const sendComment = async (attachments = []) => {
    const body = draft.trim();
    if (!body && attachments.length === 0) return;
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

    setTask(prev => ({ ...prev, comments: [...(prev.comments || []), tempComment] }));
    setDraft("");

    try {
      const formData = new FormData();
      if (body) formData.append("body", body);
      attachments.forEach(att => formData.append("attachments[]", att.file));

      await api.post(
        `/student/applications/${applicationId}/tasks/${taskId}/comments`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      loadData(true);
    } catch (e) {
      console.error(e);
      setTask(prev => ({ ...prev, comments: (prev.comments || []).filter(c => c.id !== tempComment.id) }));
      setDraft(body);
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible d'envoyer le commentaire." });
    } finally {
      setBusy(false);
    }
  };

  const deleteComment = async (commentId) => {
    setTask(prev => ({ ...prev, comments: (prev.comments || []).filter(c => c.id !== commentId) }));
    try {
      await api.delete(`/student/applications/${applicationId}/tasks/${taskId}/comments/${commentId}`);
    } catch (e) {
      console.error(e);
      loadData(true);
    }
  };

  const editComment = async (commentId, body) => {
    if (!body.trim()) return;
    setTask(prev => ({
      ...prev,
      comments: (prev.comments || []).map(c => c.id === commentId ? { ...c, body } : c)
    }));
    try {
      await api.put(`/student/applications/${applicationId}/tasks/${taskId}/comments/${commentId}`, { body });
    } catch (e) {
      console.error(e);
      loadData(true);
    }
  };

  const deleteTask = async () => {
    const res = await Swal.fire({
      title: "Supprimer la tâche ?",
      text: "Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b"
    });
    if (!res.isConfirmed) return;

    try {
      await api.delete(`/student/applications/${applicationId}/tasks/${taskId}`);
      Swal.fire({ icon: "success", title: "Tâche supprimée", timer: 1500, showConfirmButton: false });
      navigate("/student/tasks");
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible de supprimer la tâche." });
    }
  };

  const patchStatus = async (status) => {
    setTask(prev => ({ ...prev, status }));
    try {
      await api.patch(`/student/applications/${applicationId}/tasks/${taskId}/status`, { status });
      Swal.fire({
        toast: true, position: "top-end", icon: "success", title: "Statut mis à jour",
        showConfirmButton: false, timer: 1500
      });
    } catch (e) {
      console.error(e);
      loadData(true);
    }
  };

  if (loading || !task) {
    return (
      <BaseLayout
        sidebarHeader={<StudentSidebarHeader />}
        menuItems={getStudentMenuItems()}
        headerActions={
          <div className="flex items-center gap-4">
            <StudentNotificationBell />
          </div>
        }
      >
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      </BaseLayout>
    );
  }

  const col = TASK_COLUMNS.find(c => c.key === task.status) || TASK_COLUMNS[0];
  const isOverdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
  
  const encadrantId = supervision?.encadrant?.id;
  const currentUserId = supervision?.student?.id;

  const encComments = (task.comments || []).filter(c => encadrantId && c.user?.id === encadrantId);
  const myComments = (task.comments || []).filter(c => encadrantId ? c.user?.id !== encadrantId : true);

  return (
    <BaseLayout
      sidebarHeader={<StudentSidebarHeader />}
      menuItems={getStudentMenuItems()}
      headerActions={
        <div className="flex items-center gap-4">
          <StudentNotificationBell />
        </div>
      }
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        
        {/* En-tête : Breadcrumbs et Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <Breadcrumbs className="bg-transparent p-0 mb-1">
              <span onClick={() => navigate("/student/tasks")} className="cursor-pointer text-slate-500 hover:text-blue-600 transition font-medium">
                Mes Tâches
              </span>
              <span className="text-slate-800 font-bold max-w-xs truncate">{task.title}</span>
            </Breadcrumbs>
            <Typography variant="small" className="text-slate-500 font-medium">
              Candidature en cours • {supervision?.encadrant?.name ? `Encadré par ${supervision.encadrant.name}` : "Non assigné"}
            </Typography>
          </div>
          <button 
            onClick={() => navigate("/student/tasks")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au tableau
          </button>
        </div>

        {/* Corps principal : Grille */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Section Principale (Gauche) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Titre et détails de la tâche */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Ligne colorée pour le statut */}
              <div className="h-2 w-full" style={{ background: col.headerGrad }} />
              
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-black text-slate-900 leading-tight mb-3">
                      {task.title}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border"
                        style={{ background: col.accentColor + "15", color: col.accentColor, borderColor: col.accentColor + "40" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: col.accentColor }} />
                        {col.label}
                      </span>
                      {task.due_date && (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border
                          ${isOverdue ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          {isOverdue && <span className="text-rose-500">⚠ En retard</span>}
                          {!isOverdue && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          {!isOverdue && new Date(task.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions (Editer / Supprimer) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowEdit(v => !v);
                        setEditTitle(task.title || "");
                        setEditDescription(task.description || "");
                        setEditDueDate(task.due_date ? task.due_date.substring(0, 10) : "");
                        setEditImageFile(null);
                        setEditImagePreview(null);
                      }}
                      title="Modifier la tâche"
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition
                        ${showEdit ? "border-blue-400 bg-blue-50 text-blue-600 shadow-inner" : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
                    >
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={deleteTask}
                      title="Supprimer la tâche"
                      className="w-9 h-9 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center transition"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Mode Edition */}
                {showEdit ? (
                  <div className="border border-blue-200 rounded-xl bg-blue-50/40 p-5 mt-4 space-y-4">
                    <p className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Mode Édition
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Titre</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                        <textarea
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white resize-y"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Date d'échéance</label>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={e => setEditDueDate(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Pièce jointe</label>
                          <button type="button" onClick={() => imgRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white rounded-lg px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:border-blue-300 transition">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Joindre fichier
                          </button>
                          <input ref={imgRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleImageSelect} />
                        </div>
                      </div>

                      {editImagePreview && (
                        <div className="relative inline-block mt-2 border border-slate-200 rounded-lg overflow-hidden bg-white p-1">
                          <img src={editImagePreview} alt="Preview" className="h-20 w-auto object-cover rounded" />
                          <button type="button" onClick={() => { setEditImageFile(null); setEditImagePreview(null); }}
                            className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-500 shadow-md hover:bg-red-50">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          disabled={savingEdit || !editTitle.trim()}
                          onClick={async () => {
                            setSavingEdit(true);
                            try {
                              const fd = new FormData();
                              fd.append("_method", "PUT");
                              fd.append("title", editTitle.trim());
                              if (editDescription.trim()) fd.append("description", editDescription.trim());
                              if (editDueDate) fd.append("due_date", editDueDate);
                              if (editImageFile) fd.append("attachment", editImageFile);

                              await api.post(
                                `/student/applications/${applicationId}/tasks/${taskId}`,
                                fd,
                                { headers: { "Content-Type": "multipart/form-data" } }
                              );
                              await loadData(true);
                              setShowEdit(false);
                              Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Tâche modifiée', showConfirmButton: false, timer: 1500 });
                            } catch { } 
                            finally { setSavingEdit(false); }
                          }}
                          className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition flex items-center justify-center gap-2"
                        >
                          {savingEdit ? "Enregistrement…" : <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Enregistrer
                          </>}
                        </button>
                        <button onClick={() => setShowEdit(false)}
                          className="px-5 py-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-200 transition">
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    {task.description ? (
                      <div className="bg-slate-50/70 rounded-xl border border-slate-100 p-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                          Description
                        </h3>
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {task.description}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 italic">
                        Aucune description n'a été fournie pour cette tâche.
                      </div>
                    )}

                    {task.attachment && (
                      <div className="mt-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Pièce jointe
                        </h3>
                        {task.attachment.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                          <a href={getStorageUrl(task.attachment)} target="_blank" rel="noreferrer" className="inline-block">
                            <img src={getStorageUrl(task.attachment)} alt="Pièce jointe" className="max-w-full h-auto max-h-72 rounded-xl border border-slate-200 object-cover shadow-sm hover:shadow-md hover:opacity-95 transition" />
                          </a>
                        ) : (
                          <a href={getStorageUrl(task.attachment)} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition shadow-sm">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Consulter le document joint
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section Commentaires */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Discussion et Commentaires ({encComments.length + myComments.length})
              </h2>

              <div className="space-y-6 mb-8">
                {encComments.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      Feedback de l'encadrant
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{encComments.length}</span>
                    </p>
                    <div className="space-y-3">
                      {encComments.map((c, idx) => (
                        <CommentBubble
                          key={c.id ?? idx}
                          comment={c}
                          isEncadrant={true}
                          isCurrentUser={currentUserId && c.user?.id === currentUserId}
                          onDelete={deleteComment}
                          onEdit={editComment}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {myComments.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      Mes commentaires
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{myComments.length}</span>
                    </p>
                    <div className="space-y-3">
                      {myComments.map((c, idx) => (
                        <CommentBubble
                          key={c.id ?? idx}
                          comment={c}
                          isEncadrant={false}
                          isCurrentUser={true}
                          onDelete={deleteComment}
                          onEdit={editComment}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {encComments.length === 0 && myComments.length === 0 && (
                  <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 px-6 py-10 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Aucun commentaire pour le moment</p>
                    <p className="text-xs text-slate-400">Ajoutez une remarque ou une pièce jointe ci-dessous.</p>
                  </div>
                )}
              </div>

              {/* Champ d'ajout */}
              <div>
                <p className="text-sm font-bold text-slate-800 mb-3">Ajouter un nouveau commentaire</p>
                <RichCommentInput
                  value={draft}
                  onChange={setDraft}
                  onSend={sendComment}
                  busy={busy}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Latérale (Droite) : Statut */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Statut de la tâche
              </h3>
              
              <div className="space-y-3 relative">
                <div className="absolute top-0 bottom-0 left-4 w-px bg-slate-200 -z-10" />
                
                {TASK_COLUMNS.map(c => {
                  const isActive = task.status === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => !isActive && patchStatus(c.key)}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${isActive ? 'bg-slate-50 ring-1 ring-slate-200 shadow-sm' : 'hover:bg-slate-50'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-colors
                        ${isActive ? '' : 'border-slate-200'}`}
                        style={{ borderColor: isActive ? c.accentColor : undefined }}>
                        {isActive && <div className="w-3 h-3 rounded-full" style={{ background: c.accentColor }} />}
                      </div>
                      <span className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                        {c.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Encadrant Widget */}
              {supervision?.encadrant && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Assigné à l'encadrant</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                      {supervision.encadrant.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{supervision.encadrant.name}</p>
                      {supervision.encadrant.email && (
                        <a href={`mailto:${supervision.encadrant.email}`} className="text-xs text-blue-600 hover:underline">
                          {supervision.encadrant.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <ChatBox />
    </BaseLayout>
  );
}
