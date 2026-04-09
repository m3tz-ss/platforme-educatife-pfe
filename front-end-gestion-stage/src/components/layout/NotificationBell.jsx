import { useState, useEffect, useRef, useCallback } from "react";
import { BellIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { BellAlertIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";

// ── Status badge colors ───────────────────────────────────────────────────────
const STATUS_STYLES = {
  acceptee:        { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  refusee:         { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500" },
  entretien:       { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500" },
  preselectionnee: { bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500" },
  nouveau:         { bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400" },
  new_application: { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500" },
};

const getStyle = (notif) => {
  const type = notif.data?.type;
  if (type === "new_application") return STATUS_STYLES.new_application;
  const status = notif.data?.new_status;
  return STATUS_STYLES[status] ?? { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" };
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

// ── Single notification item ──────────────────────────────────────────────────
function NotifItem({ notif, onRead }) {
  const isRead = !!notif.read_at;
  const style  = getStyle(notif);
  const msg    = notif.data?.message ?? "Nouvelle notification";

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer group ${
        !isRead ? "bg-blue-50/30" : ""
      }`}
      onClick={() => !isRead && onRead(notif.id)}
    >
      {/* Dot indicator */}
      <div className="flex-shrink-0 mt-1">
        <span className={`inline-block w-2 h-2 rounded-full ${!isRead ? style.dot : "bg-gray-200"}`} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Type badge */}
        <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-1 ${style.bg} ${style.text}`}>
          {notif.data?.type === "new_application" ? "📩 Candidature" :
           notif.data?.type === "application_status_changed" ? "📬 Statut" : "🔔 Notif"}
        </span>

        {/* Message */}
        <p className={`text-xs leading-snug ${!isRead ? "font-semibold text-gray-800" : "text-gray-500"}`}>
          {msg}
        </p>

        {/* Time */}
        <p className="text-[10px] text-gray-400 mt-0.5">
          {formatTime(notif.created_at)}
        </p>
      </div>

      {/* Mark read on hover */}
      {!isRead && (
        <button
          onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center transition-opacity"
          title="Marquer comme lu"
        >
          <CheckIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── Main Bell Component ───────────────────────────────────────────────────────
/**
 * @param {string} apiPrefix — "student" | "rh" | "encadrant"
 * @param {number} pollInterval — ms (default 30000)
 */
export default function NotificationBell({ apiPrefix = "student", pollInterval = 30000 }) {
  const [open, setOpen]           = useState(false);
  const [notifications, setNotifs] = useState([]);
  const [unread, setUnread]        = useState(0);
  const [loading, setLoading]      = useState(false);
  const dropdownRef                = useRef(null);

  // ── API helpers ───────────────────────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get(`/${apiPrefix}/notifications/unread-count`);
      setUnread(res.data.count ?? 0);
    } catch { /* silently fail */ }
  }, [apiPrefix]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/${apiPrefix}/notifications?per_page=15`);
      const data = res.data?.data ?? res.data ?? [];
      setNotifs(Array.isArray(data) ? data : []);
      const unreadNb = (Array.isArray(data) ? data : []).filter((n) => !n.read_at).length;
      setUnread(unreadNb);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiPrefix]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.post(`/${apiPrefix}/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnread((c) => Math.max(0, c - 1));
    } catch { /* silently fail */ }
  }, [apiPrefix]);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post(`/${apiPrefix}/notifications/read-all`);
      setNotifs((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnread(0);
    } catch { /* silently fail */ }
  }, [apiPrefix]);

  // ── Polling ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, pollInterval);
    return () => clearInterval(interval);
  }, [fetchCount, pollInterval]);

  // ── Open dropdown → fetch full list ───────────────────────────────────────
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // ── Click outside → close ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        {unread > 0
          ? <BellAlertIcon className="w-5 h-5 text-blue-500" />
          : <BellIcon className="w-5 h-5 text-gray-500" />
        }
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2">
              <BellIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">Notifications</span>
              {unread > 0 && (
                <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
                >
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-gray-200 mt-2 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded-md" />
                      <div className="h-2.5 bg-gray-100 rounded-md w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-300">
                <BellIcon className="w-10 h-10" />
                <p className="text-sm font-medium text-gray-400">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotifItem key={notif.id} notif={notif} onRead={markAsRead} />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-50 text-center">
              <span className="text-xs text-gray-400">
                {notifications.length} notification{notifications.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
