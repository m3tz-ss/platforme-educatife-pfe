import { useEffect, useState, useRef } from "react";
import { IconButton } from "@material-tailwind/react";
import api from "../../services/api";

function notifMessage(n) {
  let d = n?.data;
  if (typeof d === "string") {
    try {
      d = JSON.parse(d);
    } catch {
      d = {};
    }
  }
  if (d && typeof d === "object" && d.message) return d.message;
  if (n?.type && typeof n.type === "string") {
    const short = n.type.split("\\").pop() || "";
    return short.replace(/([A-Z])/g, " $1").trim() || "Notification";
  }
  return "Notification";
}

export default function StudentNotificationBell() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState({ data: [] });
  const [unread, setUnread] = useState(0);
  const [err, setErr] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    api
      .get("/student/notifications/unread-count")
      .then((res) => setUnread(res.data.count))
      .catch(() => setUnread(0));
    api
      .get("/student/notifications", { params: { per_page: 15 } })
      .then((res) => {
        setList(res.data);
        setErr(null);
      })
      .catch((e) => setErr(e.response?.data?.message || "Erreur"));
  }, []);

  useEffect(() => {
    if (!open) return;
    api
      .get("/student/notifications", { params: { per_page: 15 } })
      .then((res) => {
        setList(res.data);
        setErr(null);
      })
      .catch((e) => setErr(e.response?.data?.message || "Erreur"));
  }, [open]);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const markRead = (id) => {
    api.post(`/student/notifications/${id}/read`).then(() => {
      setList((prev) => ({
        ...prev,
        data: prev.data.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      }));
      setUnread((c) => Math.max(0, c - 1));
    });
  };

  const markAll = () => {
    api.post("/student/notifications/read-all").then(() => {
      setList((prev) => ({
        ...prev,
        data: prev.data.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })),
      }));
      setUnread(0);
    });
  };

  return (
    <div className="relative" ref={ref}>
      <IconButton
        variant="text"
        color="blue-gray"
        className="relative"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.082M15.75 18H9.75a.75.75 0 01-.75-.75v-5.25a4.5 4.5 0 019 0v5.25a.75.75 0 01-.75.75zm.75-9H9.75V6a3 3 0 116 0v3z"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.15rem] h-5 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </IconButton>
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-blue-gray-100 bg-white shadow-xl z-[200] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-blue-gray-50 bg-blue-gray-50/80">
            <span className="text-sm font-semibold text-blue-gray-900">Notifications</span>
            <button type="button" onClick={markAll} className="text-xs text-blue-600 hover:underline">
              Tout lu
            </button>
          </div>
          {err && <p className="px-3 py-2 text-xs text-amber-800 bg-amber-50">{err}</p>}
          <ul className="max-h-80 overflow-y-auto">
            {(list.data || []).length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-blue-gray-500">
                Aucune notification.
                <span className="block text-xs mt-2 text-blue-gray-400">
                  Vous serez informé des nouvelles tâches, commentaires et évaluations.
                </span>
              </li>
            ) : (
              (list.data || []).map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 border-b border-blue-gray-50 text-sm ${n.read_at ? "opacity-70" : "bg-blue-50/50"}`}
                >
                  <button
                    type="button"
                    className="text-left w-full"
                    onClick={() => !n.read_at && markRead(n.id)}
                  >
                    <p className="text-blue-gray-900">{notifMessage(n)}</p>
                    <p className="text-xs text-blue-gray-500 mt-1">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
