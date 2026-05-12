import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import BaseLayout from "../../components/layout/BaseLayout";
import { EnterpriseSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getEnterpriseMenuItems } from "../../config/sidebarConfig";
import NotificationBell from "../../components/layout/NotificationBell";
import { 
  ClipboardDocumentCheckIcon, 
  UserIcon, 
  AcademicCapIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon
} from "@heroicons/react/24/outline";

const DECISION_STYLES = {
  valide: { label: "Validé", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
  a_ameliorer: { label: "À améliorer", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
  non_conforme: { label: "Non conforme", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100" },
  pending: { label: "En attente", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-100" },
};

export default function EncadrantEvaluationHistory() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  const fetchEvaluations = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/encadrant/evaluations/history", {
        params: { page: p, per_page: 10 }
      });
      setEvaluations(res.data.data || []);
      setMeta({
        current_page: res.data.meta?.current_page || 1,
        last_page: res.data.meta?.last_page || 1,
        total: res.data.meta?.total || 0
      });
    } catch (err) {
      console.error("Erreur chargement historique:", err);
      setError("Impossible de charger l'historique des évaluations. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await api.get("/user/profile");
      setUserData(res.data);
    } catch (err) {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      setUserData(stored);
    }
  };

  useEffect(() => {
    fetchEvaluations(page);
    fetchUserData();
  }, [page, fetchEvaluations]);

  const filteredEvals = evaluations.filter(ev => {
    const studentName = ev.application?.student?.name?.toLowerCase() || "";
    const offerTitle = ev.application?.offer?.title?.toLowerCase() || "";
    const q = search.toLowerCase();
    return studentName.includes(q) || offerTitle.includes(q);
  });

  const roleConfig = { label: "Encadrant", color: "purple", icon: "🎓" };
  const menuItems = getEnterpriseMenuItems({}, "encadrant");

  return (
    <BaseLayout
      variant="encadrant"
      title="Historique des Évaluations"
      headerSubtitle="Retrouvez toutes les évaluations que vous avez soumises"
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
      headerActions={<NotificationBell apiPrefix="encadrant" />}
    >
      <div className="space-y-6">
        {/* Barre de recherche */}
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Rechercher un étudiant ou une offre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm font-medium">
            <span className="text-lg">⚠️</span>
            {error}
            <button 
              onClick={() => fetchEvaluations(page)}
              className="ml-auto underline hover:text-rose-900 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {loading && evaluations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Chargement de votre historique...</p>
          </div>
        ) : filteredEvals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold text-lg">Aucune évaluation trouvée</p>
            <p className="text-slate-400 text-sm mt-1">Vous n'avez pas encore soumis d'évaluation ou aucun résultat ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredEvals.map((ev) => {
              const student = ev.application?.student;
              const offer = ev.application?.offer;
              const style = DECISION_STYLES[ev.final_decision] || DECISION_STYLES.pending;
              
              return (
                <div key={ev.id} className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm">
                        {student?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{student?.name || "Étudiant inconnu"}</h3>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
                            {style.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-2">
                          <BriefcaseIcon className="h-4 w-4 text-slate-400" />
                          {offer?.title || "Offre supprimée"}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            Évalué le {new Date(ev.updated_at).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-indigo-600">
                            <AcademicCapIcon className="h-3.5 w-3.5" />
                            Note: {ev.score != null ? `${ev.score}/20` : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Link
                        to={`/enterprise/encadrant/student/${ev.application_id}`}
                        className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        Voir dossier
                      </Link>
                    </div>
                  </div>
                  
                  {ev.notes && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <ClipboardDocumentCheckIcon className="h-3.5 w-3.5" />
                        Votre appréciation
                      </p>
                      <p className="text-sm text-slate-700 line-clamp-2 italic">"{ev.notes}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-slate-700">
              Page {page} sur {meta.last_page}
            </span>
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={page === meta.last_page || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
