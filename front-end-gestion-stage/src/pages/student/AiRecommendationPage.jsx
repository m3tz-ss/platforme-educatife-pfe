import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Typography,
  Card,
  IconButton,
  Button,
  Chip,
  Tooltip,
  Input,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Tabs,
  TabsHeader,
  Tab,
} from "@material-tailwind/react";
import {
  SparklesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  XMarkIcon,
  BriefcaseIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";
import BaseLayout from "../../components/layout/BaseLayout";
import { StudentSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getStudentMenuItems } from "../../config/sidebarConfig";
import NotificationBell from "../../components/layout/NotificationBell";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
};

// ─── AI Card gradients ────────────────────────────────────────────────────────
const AI_GRADIENTS = [
  { card: "from-gray-900 via-gray-800 to-gray-700", badge: "bg-yellow-400 text-yellow-900" },
  { card: "from-pink-500 via-rose-500 to-orange-500", badge: "bg-cyan-400 text-cyan-900" },
  { card: "from-cyan-500 via-teal-500 to-emerald-600", badge: "bg-orange-400 text-orange-900" },
  { card: "from-orange-500 via-amber-500 to-yellow-400", badge: "bg-violet-400 text-violet-900" },
  { card: "from-indigo-600 via-blue-600 to-sky-500", badge: "bg-pink-400 text-pink-900" },
  { card: "from-violet-600 via-purple-600 to-fuchsia-500", badge: "bg-lime-400 text-lime-900" },
];

// ─── Score badge color ────────────────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200";
  if (score >= 55) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
};

// ─── AIRecommendationCard ─────────────────────────────────────────────────────
const AIRecommendationCard = memo(({ rec, index, onOpenDetails, applyToOffer, hasApplied, loading }) => {
  const gradient = AI_GRADIENTS[index % AI_GRADIENTS.length];
  const offer = rec.offer;

  const copyToClipboard = (text, label, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    Swal.fire({ icon: "success", title: `${label} copié`, timer: 1200, showConfirmButton: false });
  };

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col border border-blue-gray-100 hover:-translate-y-1"
      onClick={() => onOpenDetails(offer, rec)}
    >
      {/* Header gradient */}
      <div className={`bg-gradient-to-br ${gradient.card} p-6 pb-10 relative flex-shrink-0`}>
        {/* Score badge */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
          <span className={`${gradient.badge} px-3 py-1 rounded-full text-xs font-bold shadow`}>
            Score {rec.score}%
          </span>
        </div>

        {/* Logo entreprise */}
        {offer.enterprise?.logo_url && (
          <div className="absolute bottom-3 right-4 w-10 h-10 rounded-xl overflow-hidden bg-white/90 border-2 border-white/60 shadow-lg flex items-center justify-center p-0.5">
            <img src={offer.enterprise.logo_url} alt="Logo" className="w-full h-full object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        <div className="pr-16">
          <Typography variant="h6" className="font-bold text-white mb-1.5 line-clamp-2 leading-tight">
            {offer.title}
          </Typography>
          <Typography variant="small" className="text-white/80 font-medium">
            {offer.enterprise?.company_name || offer.enterprise?.name || "Entreprise"}
          </Typography>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white p-5 flex-1 flex flex-col gap-3">
        {/* Raison IA */}
        <div className="bg-violet-50 rounded-lg p-3 border border-violet-100">
          <Typography variant="small" className="text-violet-700 leading-relaxed line-clamp-3 text-[11px]">
            <span className="font-bold text-violet-900">✨ Pourquoi : </span>{rec.reason}
          </Typography>
        </div>

        {/* Localisation + durée */}
        <div className="flex flex-wrap gap-1.5">
          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
            <MapPinIcon className="w-3 h-3" /> {offer.location || "N/A"}
          </span>
          <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
            <ClockIcon className="w-3 h-3" /> {offer.duration || "N/A"}
          </span>
          {offer.start_date && (
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" /> {formatDate(offer.start_date)}
            </span>
          )}
        </div>

        {/* Coordonnées */}
        {(offer.enterprise?.email || offer.enterprise?.phone) && (
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 space-y-1.5">
            {offer.enterprise?.email && (
              <div
                onClick={(e) => { e.stopPropagation(); copyToClipboard(offer.enterprise.email, "Email"); }}
                className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded-md transition group"
              >
                <EnvelopeIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-[11px] text-blue-700 font-semibold truncate group-hover:text-blue-900">{offer.enterprise.email}</span>
              </div>
            )}
            {offer.enterprise?.phone && (
              <div
                onClick={(e) => { e.stopPropagation(); copyToClipboard(offer.enterprise.phone, "Téléphone"); }}
                className="flex items-center gap-2 cursor-pointer hover:bg-green-50 px-2 py-1 rounded-md transition group"
              >
                <PhoneIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="text-[11px] text-green-700 font-semibold group-hover:text-green-900">{offer.enterprise.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-auto pt-1">
          <Button
            size="sm"
            fullWidth
            variant="outlined"
            color="blue"
            className="text-xs"
            onClick={(e) => { e.stopPropagation(); onOpenDetails(offer, rec); }}
          >
            Voir détails
          </Button>
          <Button
            size="sm"
            fullWidth
            color={hasApplied(offer.id) ? "green" : "blue"}
            className="text-xs"
            onClick={(e) => { e.stopPropagation(); applyToOffer(offer.id); }}
            disabled={loading || hasApplied(offer.id)}
          >
            {hasApplied(offer.id) ? "✓ Postulé" : "Postuler"}
          </Button>
        </div>
      </div>
    </div>
  );
});
AIRecommendationCard.displayName = "AIRecommendationCard";

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden bg-white border border-blue-gray-50 shadow-sm animate-pulse">
    <div className="h-32 bg-gradient-to-r from-blue-gray-50 to-blue-gray-100" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-blue-gray-100 rounded-full w-3/4" />
      <div className="h-3 bg-blue-gray-50 rounded-full w-full" />
      <div className="h-3 bg-blue-gray-50 rounded-full w-5/6" />
      <div className="flex gap-2 pt-3">
        <div className="h-8 bg-blue-gray-100 rounded-lg w-1/2" />
        <div className="h-8 bg-blue-gray-100 rounded-lg w-1/2" />
      </div>
    </div>
  </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────
export function AIRecommendationsPage() {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiError, setAiError] = useState(null);
  const [aiCached, setAiCached] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("score"); // "score" | "date"
  const [userData, setUserData] = useState(null);
  const [offers, setOffers] = useState([]);

  const userName = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}")?.name || "Étudiant"; }
    catch { return "Étudiant"; }
  })();

  const fetchAIRecommendations = useCallback(async (force = false) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const url = force ? "/ai/recommendations?refresh=1" : "/ai/recommendations";
      const res = await api.get(url);
      setAiRecommendations(res.data.recommendations || []);
      setAiCached(res.data.cached || false);
    } catch (err) {
      const code = err.response?.data?.error;
      setAiError(code === "profile_incomplete" ? "profile_incomplete"
        : code === "api_quota_exceeded" ? "api_quota_exceeded"
        : code === "no_offers" ? "no_offers"
        : "generic");
    } finally {
      setAiLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await api.get("/my-applications");
      setApplications(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await api.get("/user/profile");
      setUserData(res.data);
    } catch {
      setUserData(JSON.parse(localStorage.getItem("user") || "{}"));
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    try {
      const res = await api.get("/public/offers");
      setOffers(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    Promise.allSettled([fetchAIRecommendations(), fetchApplications(), fetchUserData(), fetchOffers()]);
  }, [fetchAIRecommendations, fetchApplications, fetchUserData, fetchOffers]);

  const appliedOfferIds = useMemo(
    () => new Set(applications.map((app) => app.offer_id ?? app.offer?.id)),
    [applications]
  );
  const hasApplied = useCallback((offerId) => appliedOfferIds.has(offerId), [appliedOfferIds]);

  // Stats rapides
  const stats = useMemo(() => ({
    total: aiRecommendations.length,
    highScore: aiRecommendations.filter(r => r.score >= 80).length,
    applied: aiRecommendations.filter(r => hasApplied(r.offer?.id)).length,
    avgScore: aiRecommendations.length
      ? Math.round(aiRecommendations.reduce((s, r) => s + r.score, 0) / aiRecommendations.length)
      : 0,
  }), [aiRecommendations, hasApplied]);

  // Filtrage + tri
  const filteredRecs = useMemo(() => {
    let recs = [...aiRecommendations];
    if (search) {
      const q = search.toLowerCase();
      recs = recs.filter(r =>
        r.offer?.title?.toLowerCase().includes(q) ||
        r.offer?.enterprise?.company_name?.toLowerCase().includes(q) ||
        r.offer?.location?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "score") recs.sort((a, b) => b.score - a.score);
    return recs;
  }, [aiRecommendations, search, sortBy]);

  const handleOpenDetails = useCallback((offer, rec = null) => {
    setSelectedOffer(offer);
    setSelectedRecommendation(rec);
    setOpenModal(true);
    setActiveTab("description");
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
    setSelectedOffer(null);
    setSelectedRecommendation(null);
  }, []);

  const applyToOffer = useCallback(async (offerId) => {
    if (!cvFile) {
      Swal.fire({ icon: "warning", title: "CV manquant", text: "Sélectionnez votre CV (PDF) avant de postuler.", confirmButtonColor: "#f59e0b" });
      return;
    }
    const result = await Swal.fire({
      title: "Confirmer la candidature ?",
      text: "Vous allez postuler à cette offre avec votre CV.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, postuler !",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("offer_id", offerId);
      formData.append("cv", cvFile);
      await api.post("/applications", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await Swal.fire({ icon: "success", title: "Candidature envoyée !", timer: 2500, timerProgressBar: true, showConfirmButton: false });
      handleCloseModal();
      fetchApplications();
    } catch (err) {
      if (err.response?.status === 409) {
        Swal.fire({ icon: "warning", title: "Déjà postulé", text: "Vous avez déjà postulé à cette offre.", confirmButtonColor: "#f59e0b" });
      } else {
        Swal.fire({ icon: "error", title: "Erreur", text: err.response?.data?.message || "Erreur lors de la candidature.", confirmButtonColor: "#ef4444" });
      }
    } finally {
      setLoading(false);
    }
  }, [cvFile, handleCloseModal, fetchApplications]);

  const menuItems = useMemo(
    () => getStudentMenuItems({ offers: offers.length, applications: applications.length }),
    [offers.length, applications.length]
  );

  const headerActions = useMemo(() => (
    <NotificationBell apiPrefix="student" />
  ), []);

  // ─── Render Error states ──────────────────────────────────────────────────
  const renderError = () => {
    if (aiError === "profile_incomplete") return (
      <Card className="bg-orange-50 border border-orange-200 p-8 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-orange-500 mx-auto mb-3" />
        <Typography className="font-bold text-orange-700 text-lg mb-2">Profil incomplet</Typography>
        <Typography variant="small" className="text-orange-600 mb-4">
          Complétez votre profil (compétences, bio, domaine d'études) pour recevoir des recommandations personnalisées.
        </Typography>
        <Link to="/student/profile">
          <Button color="orange" size="sm">Compléter mon profil →</Button>
        </Link>
      </Card>
    );
    if (aiError === "api_quota_exceeded") return (
      <Card className="bg-red-50 border border-red-200 p-8 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <Typography className="font-bold text-red-700 text-lg mb-2">Quota API dépassé</Typography>
        <Typography variant="small" className="text-red-600">Le service IA a atteint sa limite. Réessayez dans quelques heures.</Typography>
      </Card>
    );
    if (aiError === "no_offers") return (
      <Card className="bg-blue-50 border border-blue-200 p-8 text-center">
        <SparklesIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <Typography className="text-blue-700 font-medium">Aucune offre disponible pour le moment.</Typography>
      </Card>
    );
    return (
      <Card className="bg-red-50 border border-red-200 p-8 text-center">
        <Typography className="text-red-700 font-bold">❌ Erreur lors du chargement des recommandations.</Typography>
        <Button size="sm" color="red" variant="outlined" className="mt-3" onClick={() => fetchAIRecommendations(true)}>Réessayer</Button>
      </Card>
    );
  };

  return (
    <BaseLayout
      title="Recommandations IA"
      menuItems={menuItems}
      sidebarHeader={
        <StudentSidebarHeader name={userData?.name} email={userData?.email} photoUrl={userData?.photo_url} />
      }
      headerActions={headerActions}
    >
      {/* En-tête de page */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-lg">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <Typography variant="h4" className="font-bold text-blue-gray-900">
                Recommandations IA
              </Typography>
              <Typography variant="small" className="text-blue-gray-500">
                Offres sélectionnées pour vous par intelligence artificielle
              </Typography>
            </div>
            {aiCached && (
              <Chip value="En cache" size="sm" variant="ghost" color="blue" className="rounded-full" />
            )}
          </div>
          <Button
            color="blue"
            variant="outlined"
            onClick={() => fetchAIRecommendations(true)}
            disabled={aiLoading}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={`w-4 h-4 ${aiLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      {!aiLoading && !aiError && aiRecommendations.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Recommandations", value: stats.total, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Score ≥ 80%", value: stats.highScore, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Score moyen", value: `${stats.avgScore}%`, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Déjà postulé", value: stats.applied, color: "text-orange-600", bg: "bg-orange-50" },
          ].map((s) => (
            <Card key={s.label} className={`${s.bg} border-0 shadow-sm p-4`}>
              <Typography className={`text-2xl font-bold ${s.color}`}>{s.value}</Typography>
              <Typography variant="small" className="text-blue-gray-500 mt-1">{s.label}</Typography>
            </Card>
          ))}
        </div>
      )}

      {/* Barre recherche + tri */}
      {!aiLoading && !aiError && aiRecommendations.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Rechercher dans les recommandations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              className="!border-blue-gray-200"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-blue-gray-200 rounded-lg px-3">
            <FunnelIcon className="w-4 h-4 text-blue-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm text-blue-gray-700 bg-transparent outline-none py-2 cursor-pointer"
            >
              <option value="score">Trier par score</option>
              <option value="none">Ordre original</option>
            </select>
          </div>
        </div>
      )}

      {/* Résultats filtrés */}
      {!aiLoading && !aiError && aiRecommendations.length > 0 && search && (
        <Typography variant="small" className="text-blue-gray-500 mb-4">
          {filteredRecs.length} résultat(s) pour "{search}"
        </Typography>
      )}

      {/* Contenu principal */}
      {aiLoading ? (
        <div>
          <div className="flex flex-col items-center justify-center mb-8 py-6">
            <SparklesIcon className="w-10 h-10 text-yellow-500 animate-bounce mb-3" />
            <Typography variant="h6" className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
              L'IA analyse les offres pour vous...
            </Typography>
            <Typography variant="small" className="text-blue-gray-400 mt-1">
              Analyse de votre profil et des offres disponibles
            </Typography>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : aiError ? (
        renderError()
      ) : filteredRecs.length === 0 ? (
        <Card className="p-10 text-center border border-blue-gray-100">
          <SparklesIcon className="w-12 h-12 text-blue-gray-200 mx-auto mb-3" />
          <Typography className="text-blue-gray-500 font-medium">
            {search ? `Aucun résultat pour "${search}"` : "Aucune recommandation disponible"}
          </Typography>
          {search && (
            <Button size="sm" variant="text" color="blue" className="mt-2" onClick={() => setSearch("")}>
              Effacer la recherche
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecs.map((rec, idx) => (
            <AIRecommendationCard
              key={rec.offer_id}
              rec={rec}
              index={idx}
              onOpenDetails={handleOpenDetails}
              applyToOffer={applyToOffer}
              hasApplied={hasApplied}
              loading={loading}
            />
          ))}
        </div>
      )}

      {/* ─── Modal détails ─────────────────────────────────────────────────── */}
      <Dialog open={openModal} handler={handleCloseModal} size="lg">
        <DialogHeader className="flex flex-col p-0 overflow-hidden rounded-t-xl">
          <div className="w-full bg-gradient-to-r from-violet-600 to-indigo-700 p-6 relative min-h-[120px] flex flex-col justify-end">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {selectedRecommendation && (
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(selectedRecommendation.score)}`}>
                  Score IA : {selectedRecommendation.score}%
                </div>
              )}
              <IconButton variant="text" color="white" onClick={handleCloseModal} className="rounded-full bg-white/10 hover:bg-white/20">
                <XMarkIcon className="w-5 h-5" />
              </IconButton>
            </div>
            {selectedOffer?.enterprise?.logo_url && (
              <div className="absolute -bottom-6 right-8 w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-xl border-4 border-white flex items-center justify-center p-2 z-10">
                <img src={selectedOffer.enterprise.logo_url} alt="Logo" className="w-full h-full object-contain" />
              </div>
            )}
            <Typography variant="h4" className="text-white font-bold pr-24 line-clamp-2">{selectedOffer?.title}</Typography>
            <Typography variant="small" className="text-violet-200 font-medium mt-1">
              {selectedOffer?.enterprise?.company_name || selectedOffer?.enterprise?.name}
            </Typography>
          </div>
        </DialogHeader>

        <DialogBody divider className="max-h-[70vh] overflow-y-auto p-0 border-none">
          {selectedOffer && (
            <div className="p-6 space-y-5">
              {selectedRecommendation && (
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-4 items-start">
                  <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                    <SparklesIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <Typography variant="small" className="font-bold text-indigo-900 mb-1">
                      Pourquoi cette offre vous correspond :
                    </Typography>
                    <Typography variant="small" className="text-indigo-800 leading-relaxed italic">
                      "{selectedRecommendation.reason}"
                    </Typography>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5" /> {selectedOffer.location || "N/A"}</span>
                <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-100 flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> {selectedOffer.duration || "N/A"}</span>
                <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100 flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> Début : {formatDate(selectedOffer.start_date)}</span>
                {selectedOffer.available_places && (
                  <span className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-100">👥 {selectedOffer.available_places} places</span>
                )}
                {selectedOffer.domain && (
                  <span className="bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-cyan-100">💼 {selectedOffer.domain}</span>
                )}
              </div>

              <Tabs value={activeTab}>
                <TabsHeader>
                  {["description", "requirements", "advantages", "company"].map((tab) => (
                    <Tab key={tab} value={tab} onClick={() => setActiveTab(tab)} className="cursor-pointer">
                      {{ description: "Description", requirements: "Exigences", advantages: "Avantages", company: "Entreprise" }[tab]}
                    </Tab>
                  ))}
                </TabsHeader>
              </Tabs>

              <div>
                {activeTab === "description" && (
                  <div>
                    <Typography variant="h6" className="mb-3 font-semibold">À propos de cette offre</Typography>
                    <Typography className="text-blue-gray-700 leading-relaxed">{selectedOffer.description || "Description non disponible"}</Typography>
                  </div>
                )}
                {activeTab === "requirements" && (
                  <div>
                    <Typography variant="h6" className="mb-3 font-semibold">Compétences requises</Typography>
                    <ul className="space-y-2">
                      {selectedOffer.requirements
                        ? selectedOffer.requirements.split(",").map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                            <span className="text-blue-gray-700">{req.trim()}</span>
                          </li>
                        ))
                        : <Typography className="text-blue-gray-500">Aucune exigence spécifiée</Typography>
                      }
                    </ul>
                  </div>
                )}
                {activeTab === "advantages" && (
                  <div>
                    <Typography variant="h6" className="mb-3 font-semibold">Avantages</Typography>
                    <ul className="space-y-2">
                      {selectedOffer.advantages
                        ? selectedOffer.advantages.split(",").map((adv, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-blue-gray-700">{adv.trim()}</span>
                          </li>
                        ))
                        : <Typography className="text-blue-gray-500">Aucun avantage spécifié</Typography>
                      }
                    </ul>
                  </div>
                )}
                {activeTab === "company" && (
                  <div className="space-y-4">
                    <div>
                      <Typography variant="h6" className="mb-3 font-semibold">À propos de l'entreprise</Typography>
                      <Typography className="text-blue-gray-700 leading-relaxed">
                        {selectedOffer?.enterprise?.company_description || selectedOffer?.enterprise?.description || "Information non disponible"}
                      </Typography>
                    </div>
                    <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <Typography variant="h6" className="font-bold text-blue-900 mb-4">📞 Coordonnées</Typography>
                      <div className="space-y-3">
                        {selectedOffer.enterprise?.email && (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 hover:shadow-md transition">
                            <div className="p-2 bg-blue-100 rounded-lg"><EnvelopeIcon className="w-5 h-5 text-blue-600" /></div>
                            <div className="flex-1">
                              <Typography variant="caption" className="text-blue-600 font-bold block">Email</Typography>
                              <a href={`mailto:${selectedOffer.enterprise.email}`} className="text-blue-700 font-semibold hover:underline text-sm break-all">{selectedOffer.enterprise.email}</a>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(selectedOffer.enterprise.email); Swal.fire({ icon: "success", title: "Email copié", timer: 1500, showConfirmButton: false }); }} className="text-blue-600 hover:text-blue-900 text-lg">📋</button>
                          </div>
                        )}
                        {selectedOffer.enterprise?.phone && (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200 hover:shadow-md transition">
                            <div className="p-2 bg-green-100 rounded-lg"><PhoneIcon className="w-5 h-5 text-green-600" /></div>
                            <div className="flex-1">
                              <Typography variant="caption" className="text-green-600 font-bold block">Téléphone</Typography>
                              <a href={`tel:${selectedOffer.enterprise.phone}`} className="text-green-700 font-semibold hover:underline text-sm">{selectedOffer.enterprise.phone}</a>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(selectedOffer.enterprise.phone); Swal.fire({ icon: "success", title: "Téléphone copié", timer: 1500, showConfirmButton: false }); }} className="text-green-600 hover:text-green-900 text-lg">📋</button>
                          </div>
                        )}
                        {selectedOffer.enterprise?.sector && (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200">
                            <div className="p-2 bg-purple-100 rounded-lg"><BriefcaseIcon className="w-5 h-5 text-purple-600" /></div>
                            <div>
                              <Typography variant="caption" className="text-purple-600 font-bold block">Secteur</Typography>
                              <Typography className="text-purple-700 font-semibold text-sm">{selectedOffer.enterprise.sector}</Typography>
                            </div>
                          </div>
                        )}
                        {!selectedOffer.enterprise?.email && !selectedOffer.enterprise?.phone && (
                          <Typography className="text-gray-500 text-center py-4">Aucune information de contact disponible</Typography>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
              </div>

              {/* Upload CV */}
              {!hasApplied(selectedOffer.id) && (
                <div className="mt-6 pt-5 border-t border-blue-gray-50">
                  <Typography variant="h6" color="blue-gray" className="mb-4">📄 Votre Candidature</Typography>
                  <div className="bg-blue-gray-50/50 p-5 rounded-xl border-2 border-dashed border-blue-gray-100">
                    <Typography variant="small" color="blue-gray" className="font-bold mb-2">
                      Télécharger votre CV (PDF uniquement, max 2MB)
                    </Typography>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.type !== "application/pdf") { Swal.fire("Erreur", "Seuls les fichiers PDF sont acceptés.", "error"); e.target.value = null; return; }
                        if (file.size > 2 * 1024 * 1024) { Swal.fire("Erreur", "Le fichier est trop volumineux (max 2MB).", "error"); e.target.value = null; return; }
                        setCvFile(file);
                      }}
                      className="block w-full text-sm text-blue-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition cursor-pointer"
                    />
                    {cvFile && (
                      <Typography variant="small" className="mt-2 text-green-600 font-medium">
                        ✅ {cvFile.name}
                      </Typography>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="space-x-3 p-5 bg-gray-50">
          <Button color="blue" variant="outlined" onClick={() => window.location.href = `mailto:${selectedOffer?.enterprise?.email || ''}`}>
            <EnvelopeIcon className="w-4 h-4 mr-2 inline" /> Contacter
          </Button>
          <Button
            color={hasApplied(selectedOffer?.id) ? "green" : "blue"}
            onClick={() => applyToOffer(selectedOffer?.id)}
            disabled={loading || hasApplied(selectedOffer?.id)}
          >
            {hasApplied(selectedOffer?.id) ? "✓ Déjà postulé" : loading ? "Envoi en cours..." : "✅ Postuler"}
          </Button>
        </DialogFooter>
      </Dialog>
    </BaseLayout>
  );
}

export default AIRecommendationsPage;