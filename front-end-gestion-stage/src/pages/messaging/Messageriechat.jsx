import { useState, useEffect, useRef, useCallback } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders() {
  const token = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || "";
  return {
    "X-XSRF-TOKEN": decodeURIComponent(token),
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function timeAgo(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function fullTime(iso) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, role, online, size = 40 }) {
  const colors = {
    encadrant: { bg: "#E1F5EE", text: "#0F6E56", border: "#5DCAA5" },
    etudiant:  { bg: "#E6F1FB", text: "#185FA5", border: "#85B7EB" },
    rh:        { bg: "#FAEEDA", text: "#854F0B", border: "#EF9F27" },
  };
  const c = colors[role] || colors.etudiant;

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: c.bg,
          border: `1.5px solid ${c.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.36,
          fontWeight: 500,
          color: c.text,
          letterSpacing: -0.5,
        }}
      >
        {getInitials(name)}
      </div>
      {online !== undefined && (
        <span
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: size * 0.27,
            height: size * 0.27,
            borderRadius: "50%",
            background: online ? "#1D9E75" : "#B4B2A9",
            border: "2px solid var(--color-background-primary)",
          }}
        />
      )}
    </div>
  );
}

// ─── RoleBadge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const map = {
    encadrant: { label: "Encadrant", bg: "#E1F5EE", color: "#0F6E56" },
    etudiant:  { label: "Étudiant",  bg: "#E6F1FB", color: "#185FA5" },
    rh:        { label: "RH",        bg: "#FAEEDA", color: "#854F0B" },
  };
  const r = map[role] || { label: role, bg: "#F1EFE8", color: "#5F5E5A" };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 6,
        background: r.bg,
        color: r.color,
      }}
    >
      {r.label}
    </span>
  );
}

// ─── Composant principal : MessagerieChat ──────────────────────────────────────
// Props :
//   currentUser : { id, name, role }         — utilisateur connecté
//   otherUser   : { id, name, role } | null  — interlocuteur pré-sélectionné (optionnel)

export default function MessagerieChat({ currentUser, otherUser: initialOther }) {
  // ── State ──────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]       = useState(null);
  const [otherUser, setOtherUser]         = useState(initialOther || null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [sending, setSending]             = useState(false);
  const [loading, setLoading]             = useState(false);
  const [canReply, setCanReply]           = useState(true);
  const [search, setSearch]               = useState("");
  const [showSidebar, setShowSidebar]     = useState(true);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const pollingRef  = useRef(null);

  // ── Charger la liste des conversations ────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res  = await fetch("/api/conversations", { headers: authHeaders() });
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur chargement conversations", e);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const iv = setInterval(loadConversations, 10_000);
    return () => clearInterval(iv);
  }, [loadConversations]);

  // ── Ouvrir une conversation ────────────────────────────────────
  const openConversation = useCallback(async (conv) => {
    setActiveConv(conv);
    setMessages([]);
    setLoading(true);

    // Identifier l'interlocuteur
    const other = conv.other_user || null;
    setOtherUser(other);

    try {
      const res  = await fetch(`/api/conversations/${conv.id}/messages`, { headers: authHeaders() });
      const data = await res.json();
      setMessages(data.data || []);
      setCanReply(data.can_reply ?? true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    inputRef.current?.focus();
  }, []);

  // ── Polling des messages de la conversation active ─────────────
  useEffect(() => {
    if (!activeConv) return;
    clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/conversations/${activeConv.id}/messages`, { headers: authHeaders() });
        const data = await res.json();
        setMessages(data.data || []);
      } catch (e) {}
    }, 5_000);
    return () => clearInterval(pollingRef.current);
  }, [activeConv]);

  // ── Scroll automatique vers le bas ────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Envoyer un message ─────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${activeConv.id}/messages`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ body: input.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setInput("");
        loadConversations();
      }
    } catch (e) {
      console.error(e);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Démarrer une conversation directement (si otherUser passé en prop) ──
  useEffect(() => {
    if (!initialOther || conversations.length === 0) return;
    const existing = conversations.find(
      (c) => c.other_user?.id === initialOther.id
    );
    if (existing) openConversation(existing);
  }, [initialOther, conversations, openConversation]);

  // ── Filtrer les conversations ──────────────────────────────────
  const filtered = conversations.filter((c) =>
    (c.title || c.other_user?.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div style={S.root}>

      {/* ══ Sidebar ══════════════════════════════════════════════ */}
      <aside style={{ ...S.sidebar, display: showSidebar ? "flex" : "none" }}>

        {/* En-tête sidebar */}
        <div style={S.sidebarTop}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={currentUser?.name} role={currentUser?.role} size={36} online />
            <div>
              <div style={S.myName}>{currentUser?.name}</div>
              <RoleBadge role={currentUser?.role} />
            </div>
          </div>
          {totalUnread > 0 && (
            <span style={S.totalBadge}>{totalUnread}</span>
          )}
        </div>

        {/* Recherche */}
        <div style={S.searchRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={S.searchInput}
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Liste des conversations */}
        <div style={S.convList}>
          {filtered.length === 0 && (
            <p style={S.emptyNote}>Aucune conversation</p>
          )}
          {filtered.map((conv) => (
            <ConvRow
              key={conv.id}
              conv={conv}
              active={activeConv?.id === conv.id}
              onClick={() => {
                openConversation(conv);
                if (window.innerWidth < 640) setShowSidebar(false);
              }}
            />
          ))}
        </div>
      </aside>

      {/* ══ Zone principale ══════════════════════════════════════ */}
      <main style={S.main}>
        {!activeConv ? (
          <EmptyChat onToggle={() => setShowSidebar(true)} />
        ) : (
          <>
            {/* Header conversation */}
            <header style={S.chatHeader}>
              <button style={S.backBtn} onClick={() => setShowSidebar(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>

              {otherUser && (
                <Avatar
                  name={otherUser.name}
                  role={otherUser.role}
                  online={otherUser.online}
                  size={42}
                />
              )}

              <div style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
                <div style={S.chatName}>
                  {activeConv.title || otherUser?.name || "Conversation"}
                </div>
                <div style={S.chatSub}>
                  {otherUser?.online
                    ? "En ligne maintenant"
                    : otherUser?.last_activity_at
                      ? `Vu ${timeAgo(otherUser.last_activity_at)}`
                      : "Hors ligne"}
                  <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
                  <RoleBadge role={otherUser?.role} />
                </div>
              </div>
            </header>

            {/* Zone messages */}
            <section style={S.msgZone}>
              {loading ? (
                <div style={S.center}>Chargement…</div>
              ) : messages.length === 0 ? (
                <div style={S.center}>
                  <div style={S.startIcon}>✉</div>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                    Démarrez la conversation
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const prev   = messages[i - 1];
                    const isMine = msg.is_mine || msg.sender_id === currentUser?.id;
                    const showDate =
                      !prev ||
                      new Date(msg.created_at).toDateString() !==
                        new Date(prev.created_at).toDateString();
                    const showName =
                      !isMine &&
                      (!prev || prev.sender_id !== msg.sender_id);

                    return (
                      <MessageGroup
                        key={msg.id}
                        msg={msg}
                        isMine={isMine}
                        showDate={showDate}
                        showName={showName}
                      />
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </section>

            {/* Zone de saisie */}
            <footer style={S.inputZone}>
              {!canReply ? (
                <div style={S.readOnly}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Conversation en lecture seule
                </div>
              ) : (
                <div style={S.inputRow}>
                  <textarea
                    ref={inputRef}
                    style={S.textarea}
                    placeholder="Écrire un message… (Entrée pour envoyer)"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={onKeyDown}
                    rows={1}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    style={{
                      ...S.sendBtn,
                      opacity: !input.trim() || sending ? 0.4 : 1,
                      cursor: !input.trim() || sending ? "not-allowed" : "pointer",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              )}
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

// ─── ConvRow ──────────────────────────────────────────────────────────────────

function ConvRow({ conv, active, onClick }) {
  const name    = conv.title || conv.other_user?.name || "Conversation";
  const preview = conv.last_message?.body;
  const time    = conv.last_message_at;

  return (
    <div
      onClick={onClick}
      style={{
        ...S.convRow,
        background: active ? "var(--color-background-info)" : "transparent",
        borderLeft: active ? "3px solid #378ADD" : "3px solid transparent",
      }}
    >
      <Avatar
        name={name}
        role={conv.other_user?.role}
        online={conv.other_user?.online}
        size={44}
      />
      <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
        <div style={S.convRowTop}>
          <span style={{ ...S.convName, color: active ? "#0C447C" : "var(--color-text-primary)" }}>
            {name}
          </span>
          {time && (
            <span style={S.convTime}>{timeAgo(time)}</span>
          )}
        </div>
        <div style={S.convRowBot}>
          <span style={S.convPreview}>
            {preview ? preview.slice(0, 45) + (preview.length > 45 ? "…" : "") : "Démarrer…"}
          </span>
          {conv.unread_count > 0 && (
            <span style={S.unread}>{conv.unread_count}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MessageGroup ─────────────────────────────────────────────────────────────

function MessageGroup({ msg, isMine, showDate, showName }) {
  return (
    <>
      {showDate && (
        <div style={S.dateSep}>
          <span style={S.datePill}>
            {new Date(msg.created_at).toLocaleDateString("fr-FR", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </span>
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isMine ? "flex-end" : "flex-start",
          marginBottom: 4,
        }}
      >
        {showName && !isMine && (
          <div style={S.senderName}>{msg.sender?.name}</div>
        )}
        <div
          style={{
            ...S.bubble,
            background: isMine ? "#185FA5" : "var(--color-background-secondary)",
            color: isMine ? "#fff" : "var(--color-text-primary)",
            borderBottomRightRadius: isMine ? 4 : 16,
            borderBottomLeftRadius:  isMine ? 16 : 4,
          }}
        >
          {msg.body}
          {msg.attachment && (
            <a
              href={msg.attachment.url}
              style={{
                display: "block", marginTop: 6, fontSize: 12,
                color: isMine ? "#B5D4F4" : "var(--color-text-info)",
              }}
              target="_blank"
              rel="noreferrer"
            >
              Pièce jointe : {msg.attachment.name}
            </a>
          )}
        </div>
        <div style={S.msgMeta}>
          {fullTime(msg.created_at)}
          {isMine && (
            <span style={{ marginLeft: 5, opacity: 0.7 }}>
              {msg.status === "read" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

// ─── EmptyChat ────────────────────────────────────────────────────────────────

function EmptyChat({ onToggle }) {
  return (
    <div style={S.emptyChat}>
      <div style={S.emptyIco}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-text-tertiary)" strokeWidth="1.2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <p style={{ color: "var(--color-text-secondary)", fontSize: 15, margin: "8px 0 4px" }}>
        Sélectionnez une conversation
      </p>
      <p style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>
        ou attendez un message de votre encadrant
      </p>
      <button onClick={onToggle} style={{ ...S.showSidebarBtn, marginTop: 16 }}>
        Voir les conversations
      </button>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  root: {
    display: "flex",
    height: "100vh",
    background: "var(--color-background-tertiary)",
    fontFamily: "var(--font-sans)",
    overflow: "hidden",
  },

  // Sidebar
  sidebar: {
    width: 300,
    flexShrink: 0,
    background: "var(--color-background-primary)",
    borderRight: "0.5px solid var(--color-border-tertiary)",
    display: "flex",
    flexDirection: "column",
  },
  sidebarTop: {
    padding: "16px 16px 12px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  myName: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    marginBottom: 3,
  },
  totalBadge: {
    background: "#185FA5",
    color: "#fff",
    fontSize: 11,
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: 10,
  },
  searchRow: {
    margin: "10px 12px",
    padding: "7px 10px",
    background: "var(--color-background-secondary)",
    borderRadius: "var(--border-radius-md)",
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "0.5px solid var(--color-border-tertiary)",
  },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "var(--color-text-primary)",
    fontSize: 13,
    fontFamily: "var(--font-sans)",
  },
  convList: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 0",
  },
  emptyNote: {
    textAlign: "center",
    color: "var(--color-text-tertiary)",
    fontSize: 13,
    padding: "24px 0",
  },

  // ConvRow
  convRow: {
    display: "flex",
    alignItems: "center",
    padding: "10px 14px",
    cursor: "pointer",
    transition: "background 0.12s",
    borderRadius: 0,
  },
  convRowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  convName: {
    fontSize: 13,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 140,
  },
  convTime: {
    fontSize: 11,
    color: "var(--color-text-tertiary)",
    flexShrink: 0,
    marginLeft: 6,
  },
  convRowBot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  convPreview: {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  unread: {
    background: "#185FA5",
    color: "#fff",
    fontSize: 11,
    fontWeight: 500,
    padding: "1px 6px",
    borderRadius: 10,
    marginLeft: 6,
    flexShrink: 0,
  },

  // Main
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "var(--color-background-tertiary)",
    overflow: "hidden",
  },

  // Header
  chatHeader: {
    padding: "12px 20px",
    background: "var(--color-background-primary)",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    display: "flex",
    alignItems: "center",
    gap: 0,
  },
  backBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--color-text-secondary)",
    padding: "4px 8px 4px 0",
    display: "flex",
    alignItems: "center",
  },
  chatName: {
    fontSize: 15,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  chatSub: {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    marginTop: 2,
    display: "flex",
    alignItems: "center",
  },

  // Messages
  msgZone: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-text-tertiary)",
    fontSize: 14,
    marginTop: "auto",
    marginBottom: "auto",
  },
  startIcon: {
    fontSize: 36,
    marginBottom: 10,
    opacity: 0.3,
  },
  dateSep: {
    textAlign: "center",
    margin: "14px 0 8px",
  },
  datePill: {
    fontSize: 11,
    color: "var(--color-text-tertiary)",
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 10,
    padding: "3px 12px",
  },
  senderName: {
    fontSize: 11,
    color: "var(--color-text-secondary)",
    marginBottom: 3,
    marginLeft: 4,
    fontWeight: 500,
  },
  bubble: {
    maxWidth: "66%",
    padding: "10px 14px",
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.55,
    wordBreak: "break-word",
    border: "0.5px solid var(--color-border-tertiary)",
  },
  msgMeta: {
    fontSize: 11,
    color: "var(--color-text-tertiary)",
    marginTop: 3,
    paddingInline: 4,
  },

  // Input
  inputZone: {
    padding: "12px 20px",
    background: "var(--color-background-primary)",
    borderTop: "0.5px solid var(--color-border-tertiary)",
  },
  inputRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    background: "var(--color-background-secondary)",
    borderRadius: "var(--border-radius-lg)",
    border: "0.5px solid var(--color-border-secondary)",
    padding: "6px 8px 6px 14px",
  },
  textarea: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    resize: "none",
    color: "var(--color-text-primary)",
    fontSize: 14,
    fontFamily: "var(--font-sans)",
    lineHeight: 1.5,
    padding: "4px 0",
    minHeight: 28,
    maxHeight: 120,
    overflowY: "auto",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: "var(--border-radius-md)",
    background: "#185FA5",
    border: "none",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.15s",
    flexShrink: 0,
  },
  readOnly: {
    textAlign: "center",
    color: "var(--color-text-tertiary)",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "10px 0",
  },

  // Empty state
  emptyChat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIco: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  showSidebarBtn: {
    padding: "8px 20px",
    background: "none",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: "var(--border-radius-md)",
    cursor: "pointer",
    fontSize: 13,
    color: "var(--color-text-secondary)",
  },
};