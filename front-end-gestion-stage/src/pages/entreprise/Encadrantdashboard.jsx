import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import ChatBox from "../../components/ChatBox";
import BaseLayout from "../../components/layout/BaseLayout";
import { EnterpriseSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getEnterpriseMenuItems } from "../../config/sidebarConfig";
import NotificationBell from "../../components/layout/NotificationBell";
import CandidateHistoryModal from "../../components/CandidateHistoryModal";
import Swal from "sweetalert2";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(
  /\/api\/?$/,
  ""
);

function storageUrl(cv) {
  return cv ? `${API_ORIGIN}/storage/${cv}` : null;
}

const STATUS_STYLES = {
  nouveau: "bg-slate-100 text-slate-700 ring-slate-200",
  preselectionnee: "bg-amber-50 text-amber-800 ring-amber-200",
  entretien: "bg-violet-50 text-violet-800 ring-violet-200",
  acceptee: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  refusee: "bg-rose-50 text-rose-800 ring-rose-200",
};

function statusClass(status) {
  return STATUS_STYLES[status] || "bg-slate-50 text-slate-600 ring-slate-200";
}

function statusLabel(status) {
  const map = {
    nouveau: "Nouveau",
    preselectionnee: "Présélection",
    entretien: "Entretien",
    acceptee: "Accepté",
    refusee: "Refusé",
  };
  return map[status] || status;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function EncadrantDashboard() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ data: [], last_page: 1, current_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState({ data: [] });
  const [unread, setUnread] = useState(0);
  const [notifError, setNotifError] = useState(null);
  const notifRef = useRef(null);

  // ── CANDIDATE HISTORY STATE ──────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [candidateHistory, setCandidateHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  // ─────────────────────────────────────────────────────────────────

  // ── MESSAGING STATE ──────────────────────────────────────────────
  const [msgOpen, setMsgOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null); // { id, name, initials }
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [userData, setUserData] = useState(null);
  const msgRef = useRef(null);
  const messagesEndRef = useRef(null);
  // ─────────────────────────────────────────────────────────────────

  const fetchUserData = async () => {
    try {
      const res = await api.get("/user/profile");
      setUserData(res.data);
    } catch (err) {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      setUserData(stored);
    }
  };

  const notifMessage = (n) => {
    let d = n?.data;
    if (typeof d === "string") {
      try { d = JSON.parse(d); } catch { d = {}; }
    }
    if (d && typeof d === "object" && d.message) return d.message;
    if (n?.type && typeof n.type === "string") {
      const short = n.type.split("\\").pop() || "";
      return short.replace(/([A-Z])/g, " $1").trim() || "Notification";
    }
    return "Notification";
  };

  const loadSupervision = (p = 1) => {
    setLoading(true);
    api
      .get("/encadrant/supervision", { params: { page: p, per_page: 12 } })
      .then((res) => setMeta(res.data))
      .catch((err) => console.error("Supervision", err))
      .finally(() => setLoading(false));
  };

  const handleViewHistory = async (student) => {
    if (!student?.id) return;
    setSelectedStudent(student);
    setOpenHistoryModal(true);
    setHistoryLoading(true);
    setCandidateHistory(null);
    try {
      const res = await api.get(`/rh/candidates/${student.id}/history`);
      setCandidateHistory(res.data);
    } catch (err) {
      console.error("Erreur historique candidat:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de charger l'historique du candidat.",
        confirmButtonColor: "#ef4444",
      });
      setOpenHistoryModal(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { loadSupervision(page); }, [page]);

  useEffect(() => {
    api.get("/encadrant/notifications/unread-count").then((res) => setUnread(res.data.count)).catch(() => setUnread(0));
    api.get("/encadrant/notifications", { params: { per_page: 15 } })
      .then((res) => { setNotifList(res.data); setNotifError(null); })
      .catch((err) => setNotifError(err.response?.data?.message || "Impossible de charger les notifications."));

    api.get("/encadrant/conversations")
      .then((res) => {
        setConversations(res.data.data || res.data || []);
        const total = (res.data.data || res.data || []).reduce((acc, c) => acc + (c.unread_count || 0), 0);
        setUnreadMsg(total);
      })
      .catch(() => { });

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    api.get("/encadrant/notifications", { params: { per_page: 15 } })
      .then((res) => { setNotifList(res.data); setNotifError(null); })
      .catch((err) => setNotifError(err.response?.data?.message || "Erreur réseau"));
  }, [notifOpen]);

  // Load messages when a conversation is opened
  useEffect(() => {
    if (!activeConv) return;
    setMsgLoading(true);
    api.get(`/encadrant/conversations/${activeConv.id}/messages`)
      .then((res) => {
        setMessages(res.data.data || res.data || []);
        // Mark as read
        setConversations((prev) =>
          prev.map((c) => c.id === activeConv.id ? { ...c, unread_count: 0 } : c)
        );
        setUnreadMsg((prev) => Math.max(0, prev - (activeConv.unread_count || 0)));
      })
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false));
  }, [activeConv]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Close panels on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (msgRef.current && !msgRef.current.contains(e.target)) {
        setMsgOpen(false);
        setActiveConv(null);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("entrepriseRole");
    navigate("/auth/sign-in");
  };

  const markRead = (id) => {
    api.post(`/encadrant/notifications/${id}/read`).then(() => {
      setNotifList((prev) => ({
        ...prev,
        data: prev.data.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      }));
      setUnread((c) => Math.max(0, c - 1));
    });
  };

  const markAll = () => {
    api.post("/encadrant/notifications/read-all").then(() => {
      setNotifList((prev) => ({
        ...prev,
        data: prev.data.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })),
      }));
      setUnread(0);
    });
  };

  const sendMessage = () => {
    if (!msgInput.trim() || !activeConv) return;
    const text = msgInput.trim();
    setMsgInput("");
    // Optimistic update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      body: text,
      sender: "me",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    api.post(`/encadrant/conversations/${activeConv.id}/messages`, { body: text })
      .then((res) => {
        setMessages((prev) =>
          prev.map((m) => m.id === tempMsg.id ? (res.data || tempMsg) : m)
        );
      })
      .catch(() => {
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      });
  };

  const apps = meta.data || [];

  if (loading && apps.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-slate-600 text-sm">Chargement du tableau de bord…</p>
      </div>
    );
  }

  const roleConfig = { label: "Encadrant", color: "purple", icon: "🎓" };
  const menuItems = getEnterpriseMenuItems({ applications: meta.total }, "encadrant");

  return (
    <BaseLayout
      variant="encadrant"
      title="Tableau de bord Encadrant"
      headerSubtitle="Gérez vos stagiaires et communiquez avec eux"
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
          {/* ── MESSAGING BUBBLE ───────────────────────────────── */}
          <div className="relative" ref={msgRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMsgOpen((o) => !o);
                if (!msgOpen) setActiveConv(null);
              }}
              className="relative p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="Messages"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                />
              </svg>
              {unreadMsg > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-4.5 px-1 rounded-full bg-indigo-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadMsg > 9 ? "9+" : unreadMsg}
                </span>
              )}
            </button>

            {msgOpen && (
              <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 z-[200] overflow-hidden flex flex-col"
                style={{ height: "480px" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
                  {activeConv ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveConv(null)}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
                        aria-label="Retour"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold">
                        {activeConv.initials}
                      </div>
                      <span className="text-sm font-semibold text-slate-800 truncate">{activeConv.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-slate-800">Messages</span>
                  )}
                  <button
                    type="button"
                    onClick={() => { setMsgOpen(false); setActiveConv(null); }}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-400"
                    aria-label="Fermer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Conversation list */}
                {!activeConv && (
                  <ul className="flex-1 overflow-y-auto divide-y divide-slate-50">
                    {conversations.length === 0 ? (
                      <li className="px-4 py-10 text-center text-sm text-slate-500">
                        Aucune conversation pour l'instant.
                      </li>
                    ) : (
                      conversations.map((conv) => {
                        const name = conv.student_name || conv.name || "Stagiaire";
                        const initials = getInitials(name);
                        return (
                          <li key={conv.id}>
                            <button
                              type="button"
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                              onClick={() => setActiveConv({ id: conv.id, name, initials, unread_count: conv.unread_count || 0 })}
                            >
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                                {conv.last_message && (
                                  <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                                )}
                              </div>
                              {conv.unread_count > 0 && (
                                <span className="shrink-0 min-w-[1.25rem] h-5 px-1 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center">
                                  {conv.unread_count}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}

                {/* Message thread */}
                {activeConv && (
                  <>
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                      {msgLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="h-6 w-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                        </div>
                      ) : messages.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-8">Aucun message.</p>
                      ) : (
                        messages.map((m) => {
                          const isMe = m.sender === "me" || m.sender_role === "encadrant";
                          return (
                            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe
                                  ? "bg-indigo-600 text-white rounded-br-sm"
                                  : "bg-slate-100 text-slate-800 rounded-bl-sm"
                                  }`}
                              >
                                {m.body || m.content || m.message}
                                <p className={`text-[10px] mt-1 ${isMe ? "text-indigo-200" : "text-slate-400"}`}>
                                  {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="shrink-0 border-t border-slate-100 px-3 py-2.5 flex items-center gap-2 bg-white">
                      <input
                        type="text"
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        placeholder="Écrire un message…"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={sendMessage}
                        disabled={!msgInput.trim()}
                        className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                        aria-label="Envoyer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          {/* ─────────────────────────────────────────────────── */}

          <NotificationBell apiPrefix="encadrant" />
        </div>
      }
    >
      <div className="p-0">
        <p className="text-slate-600 mb-6">
          <span className="font-semibold text-slate-900">{meta.total ?? apps.length}</span> candidature
          {(meta.total ?? apps.length) !== 1 ? "s" : ""} sous votre supervision
        </p>

        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-center">
            <p className="text-slate-700 font-medium">Aucun étudiant assigné pour le moment</p>
            <p className="text-slate-500 text-sm mt-2">Les affectations apparaîtront ici dès qu'un RH vous assignera une candidature.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {apps.map((app) => {
              const s = app.student;
              const cv = storageUrl(s?.cv_path || app.cv);
              return (
                <article key={app.id} className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200/60 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {getInitials(s?.name)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-semibold text-slate-900 truncate">{s?.name || "Étudiant"}</h2>
                        {s?.email && <p className="text-xs text-slate-500 truncate">{s.email}</p>}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-600 line-clamp-2">
                    <span className="font-medium text-slate-800">{app.offer?.title || "Offre"}</span>
                    {app.offer?.domain ? ` · ${app.offer.domain}` : ""}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {typeof app.encadrant_tasks_count === "number" && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5">{app.encadrant_tasks_count} tâches</span>
                    )}
                    {typeof app.encadrant_comments_count === "number" && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5">{app.encadrant_comments_count} commentaires</span>
                    )}
                    {app.encadrant_evaluation && (
                      <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5">Évaluation</span>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      to={`/enterprise/encadrant/student/${app.id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                      Ouvrir le dossier
                    </Link>
                    {cv && (
                      <a href={cv} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        CV
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleViewHistory(s)}
                      className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                    >
                      Historique
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {meta.last_page > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40">
              Précédent
            </button>
            <span className="px-4 py-2 text-sm text-slate-600">Page {meta.current_page} / {meta.last_page}</span>
            <button type="button" disabled={page >= meta.last_page || loading} onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40">
              Suivant
            </button>

          </div>
        )}
      </div>
      <ChatBox />

      <CandidateHistoryModal
        open={openHistoryModal}
        student={selectedStudent}
        history={candidateHistory}
        loading={historyLoading}
        onClose={() => setOpenHistoryModal(false)}
      />
    </BaseLayout>
  );
}