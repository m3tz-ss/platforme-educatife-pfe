import { useEffect, useState } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { Bar } from "react-chartjs-2";
import api from "./../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  UsersIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  ArrowUpIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    enterprises: 0,
    offers: 0,
    applications: 0,
    latest_students: [],
    latest_enterprises: [],
    latest_applications: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setStats(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");
  const avatarColors = [
    "bg-blue-500", "bg-emerald-500", "bg-violet-500",
    "bg-orange-500", "bg-cyan-500", "bg-rose-500",
  ];
  const getAvatarColor = (index) => avatarColors[index % avatarColors.length];

  const getStatusStyle = (status) => {
    switch (status) {
      case "nouveau":        return "bg-blue-100 text-blue-700";
      case "preselectionnee": return "bg-amber-100 text-amber-700";
      case "entretien":      return "bg-purple-100 text-purple-700";
      case "acceptee":       return "bg-green-100 text-green-700";
      case "refusee":        return "bg-red-100 text-red-700";
      default:               return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      nouveau: "Nouveau", preselectionnee: "Présélectionnée",
      entretien: "Entretien", acceptee: "Acceptée", refusee: "Refusée",
    };
    return map[status] ?? status ?? "—";
  };

  // ── Stat cards ────────────────────────────────────────────────────────────
  const statCards = [
    { label: "Étudiants",      value: stats.students,     icon: UsersIcon,                  accentBg: "bg-blue-500",    iconBg: "bg-blue-50",    iconColor: "text-blue-500",    border: "border-blue-100"   },
    { label: "Entreprises",    value: stats.enterprises,  icon: BuildingOfficeIcon,         accentBg: "bg-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-500", border: "border-emerald-100"},
    { label: "Offres de stage",value: stats.offers,       icon: BriefcaseIcon,              accentBg: "bg-amber-500",   iconBg: "bg-amber-50",   iconColor: "text-amber-500",   border: "border-amber-100"  },
    { label: "Candidatures",   value: stats.applications, icon: ClipboardDocumentListIcon,  accentBg: "bg-violet-500",  iconBg: "bg-violet-50",  iconColor: "text-violet-500",  border: "border-violet-100" },
  ];

  // ── Chart ─────────────────────────────────────────────────────────────────
  const chartData = {
    labels: ["Étudiants", "Entreprises", "Offres", "Candidatures"],
    datasets: [{
      label: "Statistiques",
      data: [stats.students, stats.enterprises, stats.offers, stats.applications],
      backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
      borderRadius: 8,
      borderSkipped: false,
      barThickness: 52,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, weight: "500" }, color: "#64748b" },
        border: { display: false },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: { font: { size: 11 }, color: "#94a3b8" },
        border: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin mx-auto mb-4"></div>
          <Typography variant="small" className="text-blue-gray-500 font-medium">
            Chargement du dashboard...
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">

      {/* ── Header ── */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Typography variant="h4" className="font-bold text-blue-gray-900 mb-1">
            Tableau de bord
          </Typography>
          <Typography variant="small" className="text-blue-gray-500">
            Vue d'ensemble de la plateforme MyStage
          </Typography>
        </div>
        <div className="flex items-center gap-2 bg-white border border-blue-gray-100 rounded-xl px-4 py-2 shadow-sm">
          <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
          <Typography variant="small" className="text-blue-gray-700 font-medium text-xs">
            Activité en hausse ce mois
          </Typography>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className={`shadow-sm border ${card.border} hover:shadow-md transition-all duration-200 overflow-hidden`}>
              <CardBody className="p-0">
                {/* Top accent bar */}
                <div className={`h-1 w-full ${card.accentBg}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                    <div className="flex items-center gap-1 bg-green-50 text-green-600 text-xs font-semibold px-2 py-1 rounded-full">
                      <ArrowUpIcon className="w-3 h-3" />
                      +12%
                    </div>
                  </div>
                  <Typography className="text-3xl font-bold text-blue-gray-900 mb-1 tabular-nums">
                    {Number(card.value).toLocaleString()}
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500 font-medium">
                    {card.label}
                  </Typography>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* ── Chart ── */}
      <Card className="shadow-sm border border-blue-gray-100 mb-6">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <Typography variant="h6" className="font-bold text-blue-gray-900">
                Statistiques globales
              </Typography>
              <Typography variant="small" className="text-blue-gray-500">
                Répartition par catégorie
              </Typography>
            </div>
            {/* Custom legend */}
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { label: "Étudiants",    color: "bg-blue-500"    },
                { label: "Entreprises",  color: "bg-emerald-500" },
                { label: "Offres",       color: "bg-amber-500"   },
                { label: "Candidatures", color: "bg-violet-500"  },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <Typography variant="small" className="text-blue-gray-500 text-xs">{item.label}</Typography>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: "260px" }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardBody>
      </Card>

      {/* ── Latest Data ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Latest Students */}
        <Card className="shadow-sm border border-blue-gray-100">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <Typography variant="h6" className="font-bold text-blue-gray-900">Derniers étudiants</Typography>
                <Typography variant="small" className="text-blue-gray-400 text-xs">Inscrits récemment</Typography>
              </div>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <div className="space-y-2">
              {stats.latest_students.length === 0 ? (
                <Typography variant="small" className="text-blue-gray-400 text-center py-6">
                  Aucun étudiant
                </Typography>
              ) : (
                stats.latest_students.map((student, idx) => (
                  <div key={student.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
                    <div className={`w-9 h-9 rounded-full ${getAvatarColor(idx)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {getInitial(student.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography variant="small" className="font-semibold text-blue-gray-800 truncate block">
                        {student.name}
                      </Typography>
                      {student.email && (
                        <Typography variant="small" className="text-blue-gray-400 text-xs truncate block">
                          {student.email}
                        </Typography>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        {/* Latest Enterprises */}
        <Card className="shadow-sm border border-blue-gray-100">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <Typography variant="h6" className="font-bold text-blue-gray-900">Dernières entreprises</Typography>
                <Typography variant="small" className="text-blue-gray-400 text-xs">Inscrites récemment</Typography>
              </div>
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              {stats.latest_enterprises.length === 0 ? (
                <Typography variant="small" className="text-blue-gray-400 text-center py-6">
                  Aucune entreprise
                </Typography>
              ) : (
                stats.latest_enterprises.map((enterprise, idx) => (
                  <div key={enterprise.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
                    <div className={`w-9 h-9 rounded-lg ${getAvatarColor(idx + 2)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {getInitial(enterprise.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography variant="small" className="font-semibold text-blue-gray-800 truncate block">
                        {enterprise.name}
                      </Typography>
                      {enterprise.email && (
                        <Typography variant="small" className="text-blue-gray-400 text-xs truncate block">
                          {enterprise.email}
                        </Typography>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        {/* Latest Applications */}
        <Card className="shadow-sm border border-blue-gray-100">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <Typography variant="h6" className="font-bold text-blue-gray-900">Dernières candidatures</Typography>
                <Typography variant="small" className="text-blue-gray-400 text-xs">Soumises récemment</Typography>
              </div>
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <ClipboardDocumentListIcon className="w-4 h-4 text-violet-500" />
              </div>
            </div>
            <div className="space-y-2">
              {stats.latest_applications.length === 0 ? (
                <Typography variant="small" className="text-blue-gray-400 text-center py-6">
                  Aucune candidature
                </Typography>
              ) : (
                stats.latest_applications.map((app, idx) => (
  <div key={app.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
      <ClipboardDocumentListIcon className="w-4 h-4 text-violet-500" />
    </div>
    <div className="flex-1 min-w-0">
      <Typography variant="small" className="font-semibold text-blue-gray-800 truncate block">
        {/* ✅ Cherche le nom dans toutes les clés possibles */}
        {app.student?.name ?? app.student_name ?? app.name ?? `Candidature #${app.id}`}
      </Typography>
      <Typography variant="small" className="text-blue-gray-400 text-xs truncate block">
        {app.offer?.title ?? app.offer_title ?? app.title ?? "Offre non spécifiée"}
      </Typography>
    </div>
    {app.status && (
      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusStyle(app.status)}`}>
        {getStatusLabel(app.status)}
      </span>
    )}
  </div>
))
              )}
            </div>
          </CardBody>
        </Card>

      </div>
    </div>
  );
}