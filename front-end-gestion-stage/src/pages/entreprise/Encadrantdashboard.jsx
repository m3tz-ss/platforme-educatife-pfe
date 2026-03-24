import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

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

  const notifMessage = (n) => {
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
  };

  const loadSupervision = (p = 1) => {
    setLoading(true);
    api
      .get("/encadrant/supervision", { params: { page: p, per_page: 12 } })
      .then((res) => setMeta(res.data))
      .catch((err) => console.error("Supervision", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSupervision(page);
  }, [page]);

  useEffect(() => {
    api
      .get("/encadrant/notifications/unread-count")
      .then((res) => setUnread(res.data.count))
      .catch(() => setUnread(0));
    api
      .get("/encadrant/notifications", { params: { per_page: 15 } })
      .then((res) => {
        setNotifList(res.data);
        setNotifError(null);
      })
      .catch((err) => {
        setNotifError(err.response?.data?.message || "Impossible de charger les notifications.");
      });
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    api
      .get("/encadrant/notifications", { params: { per_page: 15 } })
      .then((res) => {
        setNotifList(res.data);
        setNotifError(null);
      })
      .catch((err) => setNotifError(err.response?.data?.message || "Erreur réseau"));
  }, [notifOpen]);

  useEffect(() => {
    function onDocClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
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

  const apps = meta.data || [];

  if (loading && apps.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-slate-600 text-sm">Chargement du tableau de bord…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Espace encadrant</p>
            <h1 className="text-xl font-bold text-slate-900">Tableau de bord</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifOpen((o) => !o);
                }}
                className="relative p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.082M15.75 18H9.75a.75.75 0 01-.75-.75v-5.25a4.5 4.5 0 019 0v5.25a.75.75 0 01-.75.75zm.75-9H9.75V6a3 3 0 116 0v3z"
                  />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 z-[200] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/80">
                    <span className="text-sm font-semibold text-slate-800">Notifications</span>
                    <button type="button" onClick={markAll} className="text-xs text-indigo-600 hover:underline">
                      Tout marquer lu
                    </button>
                  </div>
                  {notifError && (
                    <p className="px-4 py-2 text-xs text-amber-800 bg-amber-50 border-b border-amber-100">{notifError}</p>
                  )}
                  <ul className="max-h-80 overflow-y-auto">
                    {(notifList.data || []).length === 0 ? (
                      <li className="px-4 py-8 text-center text-sm text-slate-500">
                        Aucune notification pour l’instant.
                        <span className="block text-xs mt-2 text-slate-400">
                          Elles apparaissent quand on vous affecte un stagiaire ou qu’un entretien est planifié.
                        </span>
                      </li>
                    ) : (
                      (notifList.data || []).map((n) => (
                        <li
                          key={n.id}
                          className={`px-4 py-3 border-b border-slate-50 text-sm ${n.read_at ? "opacity-70" : "bg-indigo-50/30"}`}
                        >
                          <button
                            type="button"
                            className="text-left w-full"
                            onClick={() => !n.read_at && markRead(n.id)}
                          >
                            <p className="text-slate-800">{notifMessage(n)}</p>
                            <p className="text-xs text-slate-500 mt-1">
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
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-slate-600 mb-6">
          <span className="font-semibold text-slate-900">{meta.total ?? apps.length}</span> candidature
          {(meta.total ?? apps.length) !== 1 ? "s" : ""} sous votre supervision
        </p>

        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-center">
            <p className="text-slate-700 font-medium">Aucun étudiant assigné pour le moment</p>
            <p className="text-slate-500 text-sm mt-2">Les affectations apparaîtront ici dès qu’un RH vous assignera une candidature.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {apps.map((app) => {
              const s = app.student;
              const cv = storageUrl(s?.cv_path || app.cv);
              return (
                <article
                  key={app.id}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200/60 transition-all"
                >
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
                    <span
                      className={`shrink-0 text-xs font-medium px-2 py-1 rounded-lg ring-1 ${statusClass(app.status)}`}
                    >
                      {statusLabel(app.status)}
                    </span>
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
                      <a
                        href={cv}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        CV
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {meta.last_page > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="px-4 py-2 text-sm text-slate-600">
              Page {meta.current_page} / {meta.last_page}
            </span>
            <button
              type="button"
              disabled={page >= meta.last_page || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
