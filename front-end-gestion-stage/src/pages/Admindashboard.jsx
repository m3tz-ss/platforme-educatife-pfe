import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import api from "./../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  UsersIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "../components/layout/AdminLayout";
import { getAdminMenuItems } from "../config/sidebarConfig";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// ── Helpers ─────────────────────────────────────────────────────────────────
const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

const AVATAR_COLORS = [
  "from-blue-400 to-blue-600",
  "from-emerald-400 to-emerald-600",
  "from-violet-400 to-violet-600",
  "from-amber-400 to-amber-600",
  "from-cyan-400 to-cyan-600",
  "from-rose-400 to-rose-600",
];
const getAvatarGradient = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

const STATUS_MAP = {
  nouveau:          { label: "Nouveau",         cls: "bg-sky-100 text-sky-700 border border-sky-200",        icon: SparklesIcon },
  preselectionnee:  { label: "Présélectionnée", cls: "bg-amber-100 text-amber-700 border border-amber-200",  icon: ClockIcon },
  entretien:        { label: "Entretien",        cls: "bg-violet-100 text-violet-700 border border-violet-200", icon: CalendarDaysIcon },
  acceptee:         { label: "Acceptée",         cls: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: CheckCircleIcon },
  refusee:          { label: "Refusée",          cls: "bg-red-100 text-red-700 border border-red-200",       icon: XCircleIcon },
};
const getStatus = (s) => STATUS_MAP[s] ?? { label: s ?? "—", cls: "bg-gray-100 text-gray-500 border border-gray-200", icon: ClockIcon };

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, gradient, trend = "+12%", delay = 0 }) {
  return (
    <div
      className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* gradient accent top */}
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            <ArrowTrendingUpIcon className="w-3 h-3" />
            {trend}
          </span>
        </div>
        <p className="text-3xl font-bold text-gray-900 tabular-nums leading-none mb-1">
          {Number(value).toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
      </div>
      {/* hover glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`} />
    </div>
  );
}

function SectionCard({ title, subtitle, icon: Icon, iconBg, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PersonRow({ name, email, index, extra }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors duration-150 group">
      <div
        className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(index)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
      >
        {getInitial(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
        {email && <p className="text-xs text-gray-400 truncate">{email}</p>}
      </div>
      {extra}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-300">
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
        <MagnifyingGlassIcon className="w-5 h-5" />
      </div>
      <p className="text-xs text-gray-400">{message}</p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    enterprises: 0,
    offers: 0,
    applications: 0,
    latest_students: [],
    latest_enterprises: [],
    latest_applications: [],
    applications_by_status: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboard = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get("/admin/dashboard");
      setStats(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ── Chart configs ──────────────────────────────────────────────────────────
  const barData = {
    labels: ["Étudiants", "Entreprises", "Offres", "Candidatures"],
    datasets: [
      {
        label: "Total",
        data: [stats.students, stats.enterprises, stats.offers, stats.applications],
        backgroundColor: [
          "rgba(59,130,246,0.85)",
          "rgba(16,185,129,0.85)",
          "rgba(245,158,11,0.85)",
          "rgba(139,92,246,0.85)",
        ],
        borderRadius: 10,
        borderSkipped: false,
        barThickness: 48,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 12,
        cornerRadius: 10,
        titleFont: { size: 12, weight: "600" },
        bodyFont: { size: 12 },
        callbacks: {
          label: (ctx) => `  ${ctx.parsed.y.toLocaleString()} total`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, weight: "500" }, color: "#94a3b8" },
        border: { display: false },
      },
      y: {
        grid: { color: "#f8fafc", lineWidth: 1 },
        ticks: { font: { size: 11 }, color: "#cbd5e1", stepSize: 10 },
        border: { display: false },
      },
    },
  };

  // Doughnut from applications_by_status or fallback
  const statusCounts = stats.applications_by_status ?? {
    nouveau: 0, preselectionnee: 0, entretien: 0, acceptee: 0, refusee: 0,
  };
  const doughnutData = {
    labels: ["Nouveau", "Présélectionnée", "Entretien", "Acceptée", "Refusée"],
    datasets: [
      {
        data: [
          statusCounts.nouveau,
          statusCounts.preselectionnee,
          statusCounts.entretien,
          statusCounts.acceptee,
          statusCounts.refusee,
        ],
        backgroundColor: [
          "rgba(14,165,233,0.9)",
          "rgba(245,158,11,0.9)",
          "rgba(139,92,246,0.9)",
          "rgba(16,185,129,0.9)",
          "rgba(239,68,68,0.9)",
        ],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 8,
        bodyFont: { size: 12 },
      },
    },
  };

  const totalStatusSum = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400 font-medium">Chargement du dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Stat cards config ──────────────────────────────────────────────────────
  const statCards = [
    { label: "Étudiants",       value: stats.students,     icon: UsersIcon,                 gradient: "from-blue-400 to-blue-600",    delay: 0   },
    { label: "Entreprises",     value: stats.enterprises,  icon: BuildingOfficeIcon,        gradient: "from-emerald-400 to-emerald-600", delay: 60  },
    { label: "Offres de stage", value: stats.offers,       icon: BriefcaseIcon,             gradient: "from-amber-400 to-amber-600",  delay: 120 },
    { label: "Candidatures",    value: stats.applications, icon: ClipboardDocumentListIcon, gradient: "from-violet-400 to-violet-600", delay: 180 },
  ];
const menuItems = getAdminMenuItems({
  users: stats.students,
  enterprises: stats.enterprises,
  offers: stats.offers,
  applications: stats.applications,
});
  return (
    <AdminLayout menuItems={menuItems}>
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tableau de bord</h1>
            <p className="text-sm text-gray-400 mt-1">
              Vue d'ensemble · MyStage
              <span className="mx-2 text-gray-200">|</span>
              Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboard(true)}
              className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-xl px-3.5 py-2 hover:bg-gray-50 transition-all active:scale-95"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-500" : ""}`} />
              Actualiser
            </button>
            <button className="relative flex items-center justify-center w-9 h-9 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95">
              <BellIcon className="w-4 h-4 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {statCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          {/* Bar chart — takes 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Statistiques globales</h3>
                <p className="text-xs text-gray-400 mt-0.5">Répartition par catégorie</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {[
                  { label: "Étudiants",    color: "bg-blue-500"    },
                  { label: "Entreprises",  color: "bg-emerald-500" },
                  { label: "Offres",       color: "bg-amber-500"   },
                  { label: "Candidatures", color: "bg-violet-500"  },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="text-xs text-gray-400">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: "240px" }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Doughnut — candidatures by status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Statuts candidatures</h3>
            <p className="text-xs text-gray-400 mb-5">
              {totalStatusSum.toLocaleString()} au total
            </p>
            <div style={{ height: "160px" }} className="relative mx-auto" >
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-900">{totalStatusSum}</span>
                <span className="text-xs text-gray-400">total</span>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {[
                { key: "acceptee",        label: "Acceptées",       color: "bg-emerald-500" },
                { key: "entretien",       label: "En entretien",    color: "bg-violet-500"  },
                { key: "preselectionnee", label: "Présélectionnées",color: "bg-amber-500"   },
                { key: "nouveau",         label: "Nouvelles",       color: "bg-sky-500"     },
                { key: "refusee",         label: "Refusées",        color: "bg-red-500"     },
              ].map(({ key, label, color }) => {
                const count = statusCounts[key] ?? 0;
                const pct = totalStatusSum > 0 ? Math.round((count / totalStatusSum) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                    <span className="text-xs text-gray-500 flex-1">{label}</span>
                    <span className="text-xs font-semibold text-gray-700 tabular-nums">{count}</span>
                    <span className="text-xs text-gray-300 w-8 text-right tabular-nums">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Latest data — 3 columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Latest Students */}
          <SectionCard
            title="Derniers étudiants"
            subtitle="Inscrits récemment"
            icon={UsersIcon}
            iconBg="bg-blue-50"
          >
            {stats.latest_students.length === 0 ? (
              <EmptyState message="Aucun étudiant" />
            ) : (
              <div className="space-y-0.5">
                {stats.latest_students.map((s, i) => (
                  <PersonRow key={s.id} name={s.name} email={s.email} index={i} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Latest Enterprises */}
          <SectionCard
            title="Dernières entreprises"
            subtitle="Inscrites récemment"
            icon={BuildingOfficeIcon}
            iconBg="bg-emerald-50"
          >
            {stats.latest_enterprises.length === 0 ? (
              <EmptyState message="Aucune entreprise" />
            ) : (
              <div className="space-y-0.5">
                {stats.latest_enterprises.map((e, i) => (
                  <PersonRow key={e.id} name={e.name} email={e.email} index={i + 2} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Latest Applications */}
          <SectionCard
            title="Dernières candidatures"
            subtitle="Soumises récemment"
            icon={ClipboardDocumentListIcon}
            iconBg="bg-violet-50"
          >
            {stats.latest_applications.length === 0 ? (
              <EmptyState message="Aucune candidature" />
            ) : (
              <div className="space-y-0.5">
                {stats.latest_applications.map((app, i) => {
                  const studentName =
                    app.student?.name ?? app.student_name ?? app.name ?? `Candidature #${app.id}`;
                  const offerTitle =
                    app.offer?.title ?? app.offer_title ?? app.title ?? "Offre non spécifiée";
                  const { label, cls } = getStatus(app.status);
                  return (
                    <PersonRow
                      key={app.id}
                      name={studentName}
                      email={offerTitle}
                      index={i + 4}
                      extra={
                        app.status ? (
                          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
                            {label}
                          </span>
                        ) : null
                      }
                    />
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

      </div>
      
    </div>
    </AdminLayout>
  );
}