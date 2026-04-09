import { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import api from "./../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "../components/layout/AdminLayout";
import { getAdminMenuItems } from "../config/sidebarConfig";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminStatistics() {
  const [period, setPeriod] = useState("month"); // "day", "month", "year"
  const [data, setData] = useState({
    labels: [],
    users: [],
    offers: [],
    applications: [],
    acceptance_rate: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchStatistics = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get(`/admin/statistics?period=${period}`);
      setData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Erreur chargement statistiques:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch when period changes
  useEffect(() => {
    fetchStatistics();
  }, [period]);

  // ── Chart Configs ──────────────────────────────────────────────────────────
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: { position: "top" },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, weight: "bold" },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { border: { display: false }, grid: { color: "#f1f5f9" } },
    },
  };

  // Nouveaux inscrits (Users)
  const usersChartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Nouveaux inscrits",
        data: data.users,
        borderColor: "#3b82f6", // blue-500
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: "#3b82f6",
      },
    ],
  };

  // Offres publiées vs Candidatures
  const activityChartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Candidatures soumises",
        data: data.applications,
        backgroundColor: "#8b5cf6", // violet-500
        borderRadius: 4,
      },
      {
        label: "Offres publiées",
        data: data.offers,
        backgroundColor: "#f59e0b", // amber-500
        borderRadius: 4,
      },
    ],
  };

  // Taux d'acceptation
  const acceptanceChartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Taux d'acceptation (%)",
        data: data.acceptance_rate,
        borderColor: "#10b981", // emerald-500
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: "#10b981",
      },
    ],
  };

  const menuItems = getAdminMenuItems();

  return (
    <AdminLayout menuItems={menuItems}>
      <div className="min-h-screen bg-gray-50/80">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <ChartBarIcon className="w-6 h-6 text-blue-500" />
                Statistiques Détaillées
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Visualisez l'évolution de la plateforme dans le temps
                <span className="mx-2 text-gray-200">|</span>
                Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                {[
                  { value: "day", label: "Jour" },
                  { value: "month", label: "Mois" },
                  { value: "year", label: "Année" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      period === opt.value
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => fetchStatistics(true)}
                className="flex items-center justify-center p-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                title="Actualiser"
              >
                <ArrowPathIcon className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* ── Page Content ── */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin mx-auto mb-4" />
            </div>
          ) : data.labels.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              <CalendarDaysIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune donnée disponible pour cette période.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Graph 1: Nouvelles Inscriptions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900">Évolution des Inscriptions</h3>
                  <p className="text-xs text-gray-400">Nouveaux comptes étudiants et entreprises créés par {period === "day" ? "jour" : period === "month" ? "mois" : "année"}</p>
                </div>
                <div style={{ height: "300px" }}>
                  <Line data={usersChartData} options={lineOptions} />
                </div>
              </div>

              {/* Graph 2: Activité (Offres & Candidatures) */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900">Volume d'Activité</h3>
                  <p className="text-xs text-gray-400">Comparaison entre le nombre d'offres publiées et les candidatures soumises</p>
                </div>
                <div style={{ height: "300px" }}>
                  <Bar data={activityChartData} options={{ ...lineOptions, interaction: { mode: "index" } }} />
                </div>
              </div>

              {/* Graph 3: Taux d'acceptation */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900">Taux d'Acceptation Global</h3>
                  <p className="text-xs text-gray-400">Candidatures acceptées divisées par le total des candidatures du {period === "day" ? "jour" : period === "month" ? "mois" : "année"} (%)</p>
                </div>
                <div style={{ height: "300px" }}>
                  <Line data={acceptanceChartData} options={lineOptions} />
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}
