import { useEffect, useRef, useState } from "react";
import api from "../services/api";

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const PALETTE = [
  { from: "#6366f1", to: "#8b5cf6" },
  { from: "#0ea5e9", to: "#38bdf8" },
  { from: "#10b981", to: "#059669" },
  { from: "#f59e0b", to: "#ef4444" },
  { from: "#ec4899", to: "#a855f7" },
];

function avatarGrad(id) {
  const p = PALETTE[(id || 0) % PALETTE.length];
  return `linear-gradient(135deg,${p.from},${p.to})`;
}

function Avatar({ name, id, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, minWidth: size,
      background: avatarGrad(id),
      borderRadius: size * 0.28,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 800, fontSize: size * 0.36,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  );
}

function TimeLabel({ ts }) {
  if (!ts) return null;
  const d = new Date(ts);
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const label = isToday
    ? time
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " " + time;
  return <span style={{ fontSize: 10, opacity: 0.5, userSelect: "none" }}>{label}</span>;
}

export default function ChatBox() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("convs");
  const [conversations, setConvs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const [receiverName, setReceiverName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [searchMsg, setSearchMsg] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [unreadTotal, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const [view, setView] = useState("list"); // "list" | "chat"

  // Edit Message state
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [editSending, setEditSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => { fetchConversations(); fetchContacts(); }, []);
  useEffect(() => { if (open) fetchConversations(); }, [open]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling: check for new messages every 3s
  useEffect(() => {
    const poll = async () => {
      const convId = activeConvIdRef.current;
      if (!convId) return;
      try {
        const res = await api.get(`/messages/conversations/${convId}`);
        const raw = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        const clean = raw.map((m, i) => ({
          ...m,
          _key: `${m.id ?? "m"}-${i}`,
          body: typeof m.body === "string" ? m.body : JSON.stringify(m.body),
        }));
        setMessages(prev => {
          const localReal = prev.filter(m => !String(m.id).startsWith("temp-")).length;
          // Also update if any message changed state (read_at, edited, deleted)
          const hasChanges = clean.some(c => {
            const p = prev.find(x => x.id === c.id);
            if (!p) return true;
            return p.read_at !== c.read_at || p.is_edited !== c.is_edited || p.is_deleted !== c.is_deleted || p.body !== c.body;
          });

          if (clean.length > localReal || hasChanges) return clean;
          return prev;
        });
      } catch { /* silent */ }
    };
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/messages/conversations");
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setConvs(data);
      setUnread(data.reduce((acc, c) => acc + (c.unread_count || 0), 0));
    } catch { /* silent */ }
  };

  const fetchContacts = async () => {
    try {
      const res = await api.get("/messages/contacts");
      setContacts(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch { /* silent */ }
  };

  // Refs for polling (avoid stale closure issues)
  const activeConvIdRef = useRef(null);

  const openConversation = async (convId, userId, name) => {
    setActiveConvId(convId);
    activeConvIdRef.current = convId;
    setReceiverId(userId);
    setReceiverName(name || "");
    setView("chat");
    setEditingMsgId(null);
    setAttachment(null);
    try {
      const res = await api.get(`/messages/conversations/${convId}`);
      const raw = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      const clean = raw.map((m, i) => ({
        ...m,
        _key: `${m.id ?? "m"}-${i}`,
        body: typeof m.body === "string" ? m.body : JSON.stringify(m.body),
      }));
      setMessages(clean);
      setConvs((prev) =>
        prev.map((c) => c.id === convId ? { ...c, unread_count: 0 } : c)
      );
      setUnread((n) =>
        Math.max(0, n - (conversations.find((c) => c.id === convId)?.unread_count ?? 0))
      );
    } catch { /* silent */ }
  };

  const openContact = (c) => {
    setView("chat");
    setEditingMsgId(null);
    setAttachment(null);
    // Look for an existing conversation with this contact in the current list
    setConvs((prev) => {
      const existing = prev.find((conv) => {
        const other = conv.other_user ?? conv.user;
        return other?.id === c.id;
      });
      if (existing) {
        // Load existing conversation history
        openConversation(existing.id, c.id, c.name);
      } else {
        // New conversation — blank chat
        setReceiverId(c.id);
        setReceiverName(c.name);
        setMessages([]);
        setActiveConvId(null);
        activeConvIdRef.current = null;
        setTimeout(() => inputRef.current?.focus(), 60);
      }
      return prev;
    });
  };


  const goBack = () => {
    setView("list");
    setMessages([]);
    setReceiverId(null);
    setReceiverName("");
    setActiveConvId(null);
    setAttachment(null);
    setEditingMsgId(null);
    setSearchMsg("");
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachment) || !receiverId || sending) return;
    const text = newMessage.trim();
    const tempKey = `temp-${Date.now()}`;
    const temp = {
      _key: tempKey, id: tempKey, body: text || "Fichier joint",
      attachment: attachment ? URL.createObjectURL(attachment) : null,
      attachment_name: attachment?.name,
      is_mine: true, created_at: new Date().toISOString(), sending: true,
    };
    setMessages((prev) => [...prev, temp]);
    setNewMessage("");
    setSending(true);

    try {
      const formData = new FormData();
      formData.append("receiver_id", receiverId);
      if (text) formData.append("body", text);
      else formData.append("body", "Fichier joint"); // fallback

      if (activeConvIdRef.current) {
        formData.append("conversation_id", activeConvIdRef.current);
      }
      if (attachment) {
        formData.append("attachment", attachment);
      }

      const res = await api.post("/messages/send", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const savedMsg = res.data?.message ?? res.data;

      setMessages((prev) =>
        prev.map((m) =>
          m._key === tempKey ? { ...savedMsg, _key: tempKey, is_mine: true } : m
        )
      );
      setAttachment(null);

      // Refresh conversations in background
      api.get("/messages/conversations").then((convRes) => {
        const convData = Array.isArray(convRes.data) ? convRes.data : convRes.data?.data ?? [];
        setConvs(convData);
        setUnread(convData.reduce((acc, c) => acc + (c.unread_count || 0), 0));

        if (!activeConvIdRef.current && receiverId) {
          const newConv = convData.find(conv => {
            const other = conv.other_user ?? conv.user;
            return other?.id === receiverId;
          });
          if (newConv) {
            setActiveConvId(newConv.id);
            activeConvIdRef.current = newConv.id;
          }
        }
      }).catch(console.error);

    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m._key === tempKey ? { ...m, error: true, sending: false } : m
        )
      );
    } finally { setSending(false); }
  };

  const handleEdit = async () => {
    if (!editBody.trim() || editSending || !editingMsgId) return;
    setEditSending(true);
    try {
      const res = await api.put(`/messages/${editingMsgId}`, { body: editBody.trim() });
      setMessages(prev => prev.map(m => m.id === editingMsgId ? { ...m, body: res.data.body, is_edited: true } : m));
      setEditingMsgId(null);
      setEditBody("");
    } catch {
      alert("Erreur lors de la modification.");
    } finally {
      setEditSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/messages/${id}`);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_deleted: true, body: "Ce message a été supprimé.", attachment: null } : m));
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  // ─── Inline styles ──────────────────────────────────────────────────────────
  const css = {
    wrap: {
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14,
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    },

    panel: {
      width: 358, height: 500,
      background: "#fff",
      borderRadius: 22,
      border: "1.5px solid #e8ecf6",
      boxShadow: "0 24px 64px rgba(0,0,0,0.13), 0 6px 20px rgba(99,102,241,0.10)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    },

    // ── Header ──
    header: {
      display: "flex", alignItems: "center", gap: 10,
      padding: "13px 14px 11px",
      borderBottom: "1.5px solid #f0f3fb",
      background: "#fafbff",
      flexShrink: 0,
    },
    headerTitle: { fontSize: 14, fontWeight: 800, color: "#1e1e2e", margin: 0, letterSpacing: "-0.3px" },
    headerSub: { fontSize: 11, color: "#94a3b8", margin: 0 },

    iconBtn: (hover) => ({
      width: 30, height: 30, borderRadius: 9, border: "none",
      background: hover ? "#f0f3fb" : "transparent",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#94a3b8", transition: "background .12s", flexShrink: 0,
    }),

    // ── Tabs ──
    tabs: {
      display: "flex", gap: 3, background: "#f0f3fb",
      borderRadius: 11, padding: 3, margin: "10px 14px 8px", flexShrink: 0,
    },
    tab: (a) => ({
      flex: 1, padding: "5px 0", border: "none", cursor: "pointer",
      borderRadius: 8, fontSize: 12, fontWeight: 600, transition: "all .15s",
      background: a ? "#fff" : "transparent",
      color: a ? "#6366f1" : "#94a3b8",
      boxShadow: a ? "0 1px 4px rgba(0,0,0,0.09)" : "none",
    }),

    // ── List ──
    list: { flex: 1, overflowY: "auto", padding: "2px 0" },

    convRow: (a) => ({
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 14px", cursor: "pointer",
      background: a ? "#eef2ff" : "transparent",
      borderLeft: `3px solid ${a ? "#6366f1" : "transparent"}`,
      transition: "background .1s",
    }),
    convName: { fontSize: 13, fontWeight: 700, color: "#1e1e2e", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    convSnip: { fontSize: 11.5, color: "#94a3b8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    unread: {
      background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 800,
      minWidth: 18, height: 18, borderRadius: 9,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 5px", flexShrink: 0,
    },

    contactRow: {
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 14px", cursor: "pointer", transition: "background .1s",
    },
    sectionLbl: {
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      color: "#cbd5e1", textTransform: "uppercase", padding: "8px 16px 2px", margin: 0,
    },

    // ── Chat ──
    chatHeader: {
      display: "flex", alignItems: "center", gap: 10,
      padding: "11px 14px",
      borderBottom: "1.5px solid #f0f3fb",
      background: "#fafbff", flexShrink: 0,
    },
    chatName: { fontSize: 13, fontWeight: 800, color: "#1e1e2e", margin: 0 },
    chatSub: { fontSize: 11, color: "#94a3b8", margin: 0 },

    msgsArea: {
      flex: 1, overflowY: "auto",
      padding: "14px 12px 6px",
      display: "flex", flexDirection: "column", gap: 5,
    },
    bubbleWrap: (mine) => ({
      maxWidth: "80%", alignSelf: mine ? "flex-end" : "flex-start",
      display: "flex", flexDirection: "column",
      alignItems: mine ? "flex-end" : "flex-start", gap: 2,
    }),
    bubbleInner: (mine, err, isDeleted) => ({
      padding: "9px 13px",
      borderRadius: mine ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
      background: err ? "#fee2e2"
        : mine ? "linear-gradient(135deg,#6366f1,#818cf8)"
          : "#f1f4fb",
      color: mine && !err ? "#fff" : "#1e1e2e",
      fontSize: 13, lineHeight: 1.55,
      boxShadow: mine ? "0 3px 12px rgba(99,102,241,0.22)" : "0 1px 4px rgba(0,0,0,0.06)",
      border: !mine ? "1.5px solid #e8ecf6" : "none",
      wordBreak: "break-word", whiteSpace: "pre-wrap",
      fontStyle: isDeleted ? "italic" : "normal",
      opacity: isDeleted ? 0.7 : 1,
    }),

    inputRow: {
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 12px",
      borderTop: "1.5px solid #f0f3fb", flexShrink: 0,
      background: "#fff",
      flexWrap: "wrap"
    },
    input: {
      flex: 1, border: "1.5px solid #e0e5f2",
      borderRadius: 13, padding: "9px 14px",
      fontSize: 13, outline: "none",
      background: "#f8faff", color: "#1e1e2e",
      fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s",
      minWidth: 0,
    },
    sendBtn: (dis) => ({
      width: 38, height: 38, borderRadius: 11, border: "none",
      background: dis ? "#e0e5f2" : "linear-gradient(135deg,#6366f1,#818cf8)",
      cursor: dis ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: dis ? "none" : "0 3px 10px rgba(99,102,241,0.3)",
      transition: "all .15s", flexShrink: 0,
    }),

    // ── Empty ──
    empty: {
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 8, padding: 24,
    },
    emptyIcon: {
      width: 54, height: 54, borderRadius: 18,
      background: "linear-gradient(135deg,#eef2ff,#e0e7ff)",
      display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4,
    },

    // ── FAB ──
    fab: {
      width: 52, height: 52, borderRadius: "50%", border: "none",
      background: "linear-gradient(135deg,#6366f1,#818cf8)",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 6px 20px rgba(99,102,241,0.45)",
      transition: "transform .15s, box-shadow .15s",
      position: "relative",
    },
    fabBadge: {
      position: "absolute", top: -4, right: -4,
      minWidth: 18, height: 18, borderRadius: 9,
      background: "#ef4444", color: "#fff",
      fontSize: 10, fontWeight: 800,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 5px", boxShadow: "0 2px 6px rgba(239,68,68,0.5)",
    },
  };

  // Hover helpers via state
  const [hovConv, setHovConv] = useState(null);
  const [hovContact, setHovContact] = useState(null);
  const [hovClose, setHovClose] = useState(false);
  const [hovBack, setHovBack] = useState(false);
  const [hovFab, setHovFab] = useState(false);
  const [hovMsgMenu, setHovMsgMenu] = useState(null);

  return (
    <>
      <style>{`
        @keyframes cb-in {
          from { opacity:0; transform:scale(.93) translateY(10px); }
          to   { opacity:1; transform:scale(1)   translateY(0);    }
        }
        .cb-scroll::-webkit-scrollbar { width: 4px; }
        .cb-scroll::-webkit-scrollbar-track { background: transparent; }
        .cb-scroll::-webkit-scrollbar-thumb { background: #e0e5f2; border-radius: 4px; }
      `}</style>

      <div style={css.wrap} ref={panelRef}>

        {/* ── Panel ── */}
        {open && (
          <div style={{ ...css.panel, animation: "cb-in .2s cubic-bezier(.22,1,.36,1)" }}>

            {/* LIST VIEW */}
            {view === "list" && (
              <>
                {/* Header */}
                <div style={css.header}>
                  <div style={{ flex: 1 }}>
                    <p style={css.headerTitle}>Messages</p>
                  </div>
                  <button
                    style={css.iconBtn(hovClose)}
                    onMouseEnter={() => setHovClose(true)}
                    onMouseLeave={() => setHovClose(false)}
                    onClick={() => setOpen(false)}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tabs */}
                <div style={css.tabs}>
                  {[["convs", "Conversations"], ["contacts", "Contacts"]].map(([k, lbl]) => (
                    <button key={k} style={css.tab(tab === k)} onClick={() => setTab(k)}>{lbl}</button>
                  ))}
                </div>

                {/* List content */}
                <div className="cb-scroll" style={css.list}>
                  {tab === "convs" && (
                    conversations.length === 0
                      ? (
                        <div style={css.empty}>
                          <div style={css.emptyIcon}>
                            <svg width="26" height="26" fill="none" stroke="#a5b4fc" strokeWidth={1.8} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#64748b", margin: 0 }}>Aucune conversation</p>
                          <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>Démarrez depuis Contacts</p>
                        </div>
                      )
                      : conversations.map((conv, idx) => {
                        const other = conv.other_user ?? conv.user ?? { id: null, name: "Utilisateur" };
                        const lastMsg = conv.last_message?.body ?? "Aucun message";
                        const active = activeConvId === conv.id;
                        const hov = hovConv === conv.id;
                        return (
                          <div
                            key={`conv-${conv.id ?? idx}-${idx}`}
                            style={{ ...css.convRow(active), background: active ? "#eef2ff" : hov ? "#f8faff" : "transparent" }}
                            onClick={() => openConversation(conv.id, other.id, other.name)}
                            onMouseEnter={() => setHovConv(conv.id)}
                            onMouseLeave={() => setHovConv(null)}
                          >
                            <Avatar name={other.name || "U"} id={other.id} size={38} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={css.convName}>{other.name || "Utilisateur"}</p>
                              <p style={css.convSnip}>{lastMsg}</p>
                            </div>
                            {conv.unread_count > 0 && (
                              <span style={css.unread}>{conv.unread_count > 9 ? "9+" : conv.unread_count}</span>
                            )}
                          </div>
                        );
                      })
                  )}

                  {tab === "contacts" && (
                    contacts.length === 0
                      ? (
                        <div style={css.empty}>
                          <div style={css.emptyIcon}>
                            <svg width="26" height="26" fill="none" stroke="#a5b4fc" strokeWidth={1.8} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#64748b", margin: 0 }}>Aucun contact</p>
                        </div>
                      )
                      : (
                        <>
                          <p style={css.sectionLbl}>Disponibles</p>
                          {contacts.map((c, idx) => (
                            <div
                              key={`contact-${c.id ?? idx}-${idx}`}
                              style={{ ...css.contactRow, background: hovContact === c.id ? "#f8faff" : "transparent" }}
                              onClick={() => openContact(c)}
                              onMouseEnter={() => setHovContact(c.id)}
                              onMouseLeave={() => setHovContact(null)}
                            >
                              <Avatar name={c.name || "U"} id={c.id} size={34} />
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: "#1e1e2e", margin: 0 }}>{c.name}</p>
                                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{c.role || c.type || ""}</p>
                              </div>
                            </div>
                          ))}
                        </>
                      )
                  )}
                </div>
              </>
            )}

            {/* CHAT VIEW */}
            {view === "chat" && (
              <>
                {/* Chat header */}
                <div style={css.chatHeader}>
                  <button
                    style={css.iconBtn(hovBack)}
                    onMouseEnter={() => setHovBack(true)}
                    onMouseLeave={() => setHovBack(false)}
                    onClick={goBack}
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <Avatar name={receiverName || "U"} id={receiverId} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={css.chatName}>{receiverName || "Conversation"}</p>
                    <p style={css.chatSub}>Message privé</p>
                  </div>
                  <button
                    style={css.iconBtn(hovClose)}
                    onMouseEnter={() => setHovClose(true)}
                    onMouseLeave={() => setHovClose(false)}
                    onClick={() => setOpen(false)}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Message Search Bar */}
                <div style={{ padding: "8px 14px", background: "#f8faff", borderBottom: "1px solid #f0f3fb", flexShrink: 0 }}>
                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8" }} fill="none" stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Chercher dans la conversation..."
                      value={searchMsg}
                      onChange={(e) => setSearchMsg(e.target.value)}
                      style={{ ...css.input, width: "100%", paddingLeft: 32, paddingRight: 10, py: 6, fontSize: 12, borderRadius: 8, minHeight: 32 }}
                    />
                  </div>
                </div>

                {/* Messages */}
                <div className="cb-scroll" style={css.msgsArea}>
                  {messages.length === 0 && (
                    <p style={{ textAlign: "center", color: "#cbd5e1", fontSize: 12, marginTop: 36 }}>
                      Commencez la conversation !
                    </p>
                  )}
                  {messages
                    .filter((m) => !searchMsg.trim() || m.body.toLowerCase().includes(searchMsg.toLowerCase()))
                    .map((m) => {
                      const isImg = m.attachment && String(m.attachment).match(/\.(jpeg|jpg|gif|png|webp)$/i);
                      return (
                        <div key={m._key ?? m.id} style={css.bubbleWrap(m.is_mine)} onMouseEnter={() => setHovMsgMenu(m.id)} onMouseLeave={() => setHovMsgMenu(null)}>
                          {editingMsgId === m.id ? (
                            // Edit Mode
                            <div style={{ display: "flex", gap: 4, background: "#f8faff", padding: 8, borderRadius: 12, border: "1px solid #e0e5f2", width: "100%" }}>
                              <input
                                value={editBody}
                                onChange={e => setEditBody(e.target.value)}
                                style={{ ...css.input, padding: "6px 10px", flex: 1 }}
                                autoFocus
                                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleEdit()}
                              />
                              <button disabled={editSending} onClick={handleEdit} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "0 10px", fontSize: 12, cursor: "pointer" }}>OK</button>
                              <button onClick={() => setEditingMsgId(null)} style={{ background: "#e0e5f2", color: "#475569", border: "none", borderRadius: 8, padding: "0 10px", fontSize: 12, cursor: "pointer" }}>✕</button>
                            </div>
                          ) : (
                            // Normal Bubble
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: m.is_mine ? "row-reverse" : "row" }}>
                              <div style={css.bubbleInner(m.is_mine, m.error, m.is_deleted)}>
                                {m.body}
                                {/* Attachment */}
                                {m.attachment && !m.is_deleted && (
                                  <div style={{ marginTop: 6 }}>
                                    {isImg ? (
                                      <a href={m.attachment} target="_blank" rel="noreferrer">
                                        <img src={m.attachment} alt="attachment" style={{ maxWidth: "100%", maxHeight: 150, borderRadius: 6, display: "block" }} />
                                      </a>
                                    ) : (
                                      <a href={m.attachment} target="_blank" rel="noreferrer" style={{ color: m.is_mine ? "#fff" : "#6366f1", textDecoration: "underline", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        {m.attachment_name || "Pièce jointe"}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Actions menu for mine */}
                              {m.is_mine && !m.is_deleted && !m.sending && !m.error && hovMsgMenu === m.id && (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button onClick={() => { setEditingMsgId(m.id); setEditBody(m.body); }} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: 2 }} title="Modifier">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  </button>
                                  <button onClick={() => handleDelete(m.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 2 }} title="Supprimer">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {m.sending && <span style={{ fontSize: 10, color: "#94a3b8" }}>Envoi…</span>}
                            {m.error && <span style={{ fontSize: 10, color: "#ef4444" }}>Échec ✕</span>}
                            {!m.sending && !m.error && <TimeLabel ts={m.created_at} />}
                            {m.is_edited && !m.is_deleted && <span style={{ fontSize: 9, fontStyle: "italic", color: "#cbd5e1" }}>Modifié</span>}

                            {/* Read tick */}
                            {m.is_mine && !m.error && !m.sending && (
                              <span style={{ fontSize: 10, color: m.read_at ? "#3b82f6" : "#cbd5e1", marginLeft: 2, fontWeight: 800 }}>
                                {m.read_at ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Attachment preview above input */}
                {attachment && (
                  <div style={{ padding: "8px 12px", background: "#f8faff", borderTop: "1px solid #e0e5f2", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, fontSize: 12, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      📎 {attachment.name}
                    </div>
                    <button onClick={() => setAttachment(null)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                )}

                {/* Input */}
                <div style={css.inputRow}>
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Joindre un fichier"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <input type="file" ref={fileRef} style={{ display: "none" }} onChange={(e) => setAttachment(e.target.files[0] || null)} />

                  <input
                    ref={inputRef}
                    style={css.input}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    onFocus={(e) => { e.target.style.borderColor = "#818cf8"; e.target.style.boxShadow = "0 0 0 3px rgba(129,140,248,0.15)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e0e5f2"; e.target.style.boxShadow = "none"; }}
                    placeholder="Écrire un message…"
                  />
                  <button
                    style={css.sendBtn((!newMessage.trim() && !attachment) || sending)}
                    onClick={handleSend}
                    disabled={(!newMessage.trim() && !attachment) || sending}
                    onMouseEnter={(e) => { if (newMessage.trim() || attachment) e.currentTarget.style.transform = "scale(1.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  >
                    <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth={2.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── FAB bubble button ── */}
        <button
          style={{
            ...css.fab,
            transform: hovFab ? "scale(1.08)" : "scale(1)",
            boxShadow: hovFab
              ? "0 8px 28px rgba(99,102,241,0.55)"
              : "0 6px 20px rgba(99,102,241,0.40)",
          }}
          onClick={() => setOpen((o) => !o)}
          onMouseEnter={() => setHovFab(true)}
          onMouseLeave={() => setHovFab(false)}
          aria-label="Messages"
        >
          <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth={1.7} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          {unreadTotal > 0 && (
            <span style={css.fabBadge}>{unreadTotal > 9 ? "9+" : unreadTotal}</span>
          )}
        </button>
      </div>
    </>
  );
}