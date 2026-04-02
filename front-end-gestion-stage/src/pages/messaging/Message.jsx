import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

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
  return `linear-gradient(135deg, ${p.from}, ${p.to})`;
}

function Avatar({ name, id, size = 38 }) {
  return (
    <div
      style={{
        width: size, height: size, minWidth: size,
        background: avatarGrad(id),
        borderRadius: size * 0.3,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 800,
        fontSize: size * 0.35,
        letterSpacing: "0.02em",
        boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function TimeLabel({ ts }) {
  if (!ts) return null;
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = isToday ? time : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " " + time;
  return <span style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{date}</span>;
}

export default function Message() {
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts]           = useState([]);
  const [messages, setMessages]           = useState([]);
  const [receiverId, setReceiverId]       = useState(null);
  const [receiverName, setReceiverName]   = useState("");
  const [newMessage, setNewMessage]       = useState("");
  const [activeConvId, setActiveConvId]   = useState(null);
  const [tab, setTab]                     = useState("convs"); // "convs" | "contacts"
  const [sending, setSending]             = useState(false);
  const messagesEndRef                    = useRef(null);
  const inputRef                          = useRef(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const fetchConversations = async () => {
    try {
      const res  = await api.get("/messages/conversations");
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setConversations(data);
    } catch { /* silent */ }
  };

  const fetchContacts = async () => {
    try {
      const res  = await api.get("/messages/contacts");
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setContacts(data);
    } catch { /* silent */ }
  };

  const fetchMessages = async (conversationId, otherUserId, otherName) => {
    setActiveConvId(conversationId);
    setReceiverId(otherUserId);
    setReceiverName(otherName || "");
    try {
      const res  = await api.get(`/messages/conversations/${conversationId}`);
      const raw  = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      const clean = raw.map((m, i) => ({
        ...m,
        _key: `${m.id ?? "m"}-${i}`,
        body: typeof m.body === "string" ? m.body : JSON.stringify(m.body),
      }));
      setMessages(clean);
    } catch { /* silent */ }
  };

  const startWithContact = (c) => {
    setReceiverId(c.id);
    setReceiverName(c.name);
    setMessages([]);
    setActiveConvId(null);
    setTab("convs");
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !receiverId || sending) return;
    const text    = newMessage.trim();
    const tempKey = `temp-${Date.now()}`;
    const temp    = {
      _key: tempKey, id: tempKey,
      body: text, is_mine: true,
      created_at: new Date().toISOString(),
      sending: true,
    };
    setMessages((prev) => [...prev, temp]);
    setNewMessage("");
    setSending(true);
    try {
      const res = await api.post("/messages/send", { receiver_id: receiverId, body: text });
      setMessages((prev) =>
        prev.map((m) =>
          m._key === tempKey ? { ...res.data.message, _key: tempKey, is_mine: true } : m
        )
      );
      fetchConversations();
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m._key === tempKey ? { ...m, error: true, sending: false } : m
        )
      );
    } finally { setSending(false); }
  };

  useEffect(() => { fetchConversations(); fetchContacts(); }, []);
  useEffect(() => { scrollToBottom(); }, [messages]);

  const hasConversation = receiverId || activeConvId;

  // ─── Styles ────────────────────────────────────────────────────────────────
  const s = {
    root: {
      display: "flex", height: "100vh", overflow: "hidden",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "#f4f6fb",
      color: "#1e1e2e",
    },

    // ── Left sidebar ──
    sidebar: {
      width: 290, minWidth: 290,
      background: "#ffffff",
      borderRight: "1.5px solid #edf0f7",
      display: "flex", flexDirection: "column",
    },
    sidebarHeader: {
      padding: "20px 18px 12px",
      borderBottom: "1.5px solid #edf0f7",
    },
    sidebarTitle: {
      fontSize: 18, fontWeight: 800, color: "#1e1e2e", margin: 0,
      letterSpacing: "-0.4px",
    },
    tabs: {
      display: "flex", gap: 4,
      background: "#f4f6fb",
      borderRadius: 10, padding: 3,
      marginTop: 12,
    },
    tab: (active) => ({
      flex: 1, padding: "6px 0", border: "none", cursor: "pointer",
      borderRadius: 8, fontSize: 12, fontWeight: 600,
      transition: "all .15s",
      background: active ? "#fff" : "transparent",
      color: active ? "#6366f1" : "#94a3b8",
      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
    }),
    listScroll: { flex: 1, overflowY: "auto", padding: "8px 0" },

    convItem: (active) => ({
      display: "flex", alignItems: "center", gap: 11,
      padding: "10px 16px", cursor: "pointer",
      background: active ? "#eef2ff" : "transparent",
      borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
      transition: "all .12s",
    }),
    convMeta: { flex: 1, minWidth: 0 },
    convName: { fontSize: 13, fontWeight: 700, color: "#1e1e2e", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    convSnippet: { fontSize: 12, color: "#94a3b8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

    unreadBadge: {
      background: "#6366f1", color: "#fff",
      fontSize: 10, fontWeight: 800,
      minWidth: 18, height: 18,
      borderRadius: 9, display: "flex",
      alignItems: "center", justifyContent: "center",
      padding: "0 5px",
    },

    contactItem: {
      display: "flex", alignItems: "center", gap: 11,
      padding: "9px 16px", cursor: "pointer",
      transition: "background .12s",
    },
    contactName: { fontSize: 13, fontWeight: 600, color: "#1e1e2e", margin: 0 },
    contactRole: { fontSize: 11, color: "#94a3b8", margin: 0 },

    // ── Main chat ──
    main: {
      flex: 1, display: "flex", flexDirection: "column",
      background: "#f4f6fb",
      minWidth: 0,
    },
    chatHeader: {
      display: "flex", alignItems: "center", gap: 12,
      padding: "16px 24px",
      background: "#fff",
      borderBottom: "1.5px solid #edf0f7",
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
    },
    chatHeaderName: { fontSize: 15, fontWeight: 800, color: "#1e1e2e", margin: 0 },
    chatHeaderSub: { fontSize: 12, color: "#94a3b8", margin: 0 },

    messagesArea: {
      flex: 1, overflowY: "auto",
      padding: "24px 28px",
      display: "flex", flexDirection: "column", gap: 6,
    },

    bubble: (mine) => ({
      maxWidth: "62%",
      alignSelf: mine ? "flex-end" : "flex-start",
      display: "flex", flexDirection: "column",
      alignItems: mine ? "flex-end" : "flex-start",
    }),
    bubbleInner: (mine, err) => ({
      padding: "10px 14px",
      borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      background: err
        ? "#fee2e2"
        : mine
        ? "linear-gradient(135deg,#6366f1,#818cf8)"
        : "#ffffff",
      color: mine && !err ? "#fff" : "#1e1e2e",
      fontSize: 13.5,
      lineHeight: 1.5,
      boxShadow: mine
        ? "0 4px 14px rgba(99,102,241,0.22)"
        : "0 2px 8px rgba(0,0,0,0.07)",
      border: !mine ? "1.5px solid #edf0f7" : "none",
      wordBreak: "break-word",
      whiteSpace: "pre-wrap",
      opacity: err ? 0.8 : 1,
    }),

    inputRow: {
      display: "flex", alignItems: "center", gap: 10,
      padding: "14px 20px",
      background: "#fff",
      borderTop: "1.5px solid #edf0f7",
    },
    input: {
      flex: 1, border: "1.5px solid #e5e9f2",
      borderRadius: 14, padding: "11px 16px",
      fontSize: 13.5, outline: "none",
      background: "#f8faff", color: "#1e1e2e",
      transition: "border-color .15s, box-shadow .15s",
    },
    sendBtn: (disabled) => ({
      width: 44, height: 44, borderRadius: 14,
      background: disabled ? "#e0e3ef" : "linear-gradient(135deg,#6366f1,#818cf8)",
      border: "none", cursor: disabled ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: disabled ? "none" : "0 4px 14px rgba(99,102,241,0.3)",
      transition: "all .15s",
      flexShrink: 0,
    }),

    emptyState: {
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 12, color: "#94a3b8",
    },
    emptyIcon: {
      width: 64, height: 64, borderRadius: 20,
      background: "linear-gradient(135deg,#eef2ff,#e0e7ff)",
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    sectionLabel: {
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      color: "#cbd5e1", textTransform: "uppercase",
      padding: "10px 18px 4px",
    },
  };

  return (
    <div style={s.root}>

      {/* ── Sidebar ── */}
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <p style={s.sidebarTitle}>Messages</p>
          <div style={s.tabs}>
            {[["convs","Conversations"],["contacts","Contacts"]].map(([key, label]) => (
              <button key={key} style={s.tab(tab === key)} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.listScroll}>
          {tab === "convs" && (
            conversations.length === 0 ? (
              <p style={{ textAlign:"center", color:"#cbd5e1", fontSize:13, marginTop:32 }}>
                Aucune conversation
              </p>
            ) : conversations.map((conv, idx) => {
              const other   = conv.other_user ?? conv.user ?? { id: null, name: "Utilisateur" };
              const lastMsg = conv.last_message?.body ?? "Aucun message";
              const active  = activeConvId === conv.id;
              return (
                <div
                  key={`conv-${conv.id ?? idx}-${idx}`}
                  style={s.convItem(active)}
                  onClick={() => fetchMessages(conv.id, other.id, other.name)}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f8faff"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <Avatar name={other.name || "U"} id={other.id} />
                  <div style={s.convMeta}>
                    <p style={s.convName}>{other.name || "Utilisateur"}</p>
                    <p style={s.convSnippet}>{lastMsg}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span style={s.unreadBadge}>{conv.unread_count > 9 ? "9+" : conv.unread_count}</span>
                  )}
                </div>
              );
            })
          )}

          {tab === "contacts" && (
            contacts.length === 0 ? (
              <p style={{ textAlign:"center", color:"#cbd5e1", fontSize:13, marginTop:32 }}>
                Aucun contact
              </p>
            ) : (
              <>
                <p style={s.sectionLabel}>Disponibles</p>
                {contacts.map((c, idx) => (
                  <div
                    key={`contact-${c.id ?? idx}-${idx}`}
                    style={s.contactItem}
                    onClick={() => startWithContact(c)}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Avatar name={c.name || "U"} id={c.id} size={34} />
                    <div>
                      <p style={s.contactName}>{c.name}</p>
                      <p style={s.contactRole}>{c.role || c.type || ""}</p>
                    </div>
                  </div>
                ))}
              </>
            )
          )}
        </div>
      </div>

      {/* ── Main ── */}
      <div style={s.main}>
        {!hasConversation ? (
          /* Empty state */
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>
              <svg width="30" height="30" fill="none" stroke="#a5b4fc" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
              </svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#64748b", margin: 0 }}>
              Choisissez une conversation
            </p>
            <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0 }}>
              ou sélectionnez un contact pour démarrer
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={s.chatHeader}>
              <Avatar name={receiverName || "U"} id={receiverId} size={40} />
              <div>
                <p style={s.chatHeaderName}>{receiverName || "Conversation"}</p>
                <p style={s.chatHeaderSub}>Message privé</p>
              </div>
            </div>

            {/* Messages */}
            <div style={s.messagesArea}>
              {messages.length === 0 && (
                <p style={{ textAlign:"center", color:"#cbd5e1", fontSize:13, marginTop:40 }}>
                  Commencez la conversation !
                </p>
              )}
              {messages.map((m) => (
                <div key={m._key ?? m.id} style={s.bubble(m.is_mine)}>
                  <div style={s.bubbleInner(m.is_mine, m.error)}>
                    {m.body}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
                    {m.sending && (
                      <span style={{ fontSize:10, color:"#94a3b8" }}>Envoi…</span>
                    )}
                    {m.error && (
                      <span style={{ fontSize:10, color:"#ef4444" }}>Échec ✕</span>
                    )}
                    {!m.sending && !m.error && (
                      <TimeLabel ts={m.created_at} />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={s.inputRow}>
              <input
                ref={inputRef}
                style={s.input}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                onFocus={e => { e.target.style.borderColor = "#818cf8"; e.target.style.boxShadow = "0 0 0 3px rgba(129,140,248,0.15)"; }}
                onBlur={e  => { e.target.style.borderColor = "#e5e9f2"; e.target.style.boxShadow = "none"; }}
                placeholder="Écrire un message…"
              />
              <button
                style={s.sendBtn(!newMessage.trim() || sending)}
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                onMouseEnter={e => { if (newMessage.trim()) e.currentTarget.style.transform = "scale(1.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}