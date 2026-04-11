import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import ChatBox from "../../components/ChatBox";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Input,
  Button,
  Progress,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Tabs,
  TabsHeader,
  Tab,
  Chip,
} from "@material-tailwind/react";
import {
  MagnifyingGlassIcon,
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, StarIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";
import BaseLayout from "../../components/layout/BaseLayout";
import { StudentSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getStudentMenuItems } from "../../config/sidebarConfig";
import NotificationBell from "../../components/layout/NotificationBell";

// ─── Format date ──────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_MAP = {
  nouveau: "pending", preselectionnee: "reviewing",
  entretien: "interview", acceptee: "accepted", refusee: "rejected",
};
const normalizeStatus = (status) => STATUS_MAP[status] ?? status;
const STATUS_COLOR = { accepted: "green", rejected: "red", interview: "purple", reviewing: "amber", pending: "orange" };
const STATUS_LABEL = { accepted: "✅ Acceptée", rejected: "❌ Refusée", interview: "📞 Entretien", reviewing: "👀 Présélectionnée", pending: "⏳ En attente" };
const statusColor = (status) => STATUS_COLOR[normalizeStatus(status)] ?? "orange";
const statusLabel = (status) => STATUS_LABEL[normalizeStatus(status)] ?? "⏳ En attente";

// ─── STATS config ─────────────────────────────────────────────────────────────
const STAT_CONFIG = [
  { key: "applications", label: "Candidatures envoyées", icon: BriefcaseIcon, bg: "bg-blue-100", iconColor: "text-blue-500" },
  { key: "offers", label: "Offres disponibles", icon: MagnifyingGlassIcon, bg: "bg-purple-100", iconColor: "text-purple-500" },
  { key: "interview", label: "Entretiens planifiés", icon: CalendarIcon, bg: "bg-green-100", iconColor: "text-green-500" },
  { key: "accepted", label: "Candidatures acceptées", icon: CheckCircleIcon, bg: "bg-orange-100", iconColor: "text-orange-500" },
];

// ─── AI Recommendation Card gradients ────────────────────────────────────────
const AI_GRADIENTS = [
  { card: "from-violet-600 via-purple-600 to-indigo-700", badge: "bg-yellow-400 text-yellow-900", score: "bg-white/20" },
  { card: "from-pink-500 via-rose-500 to-orange-500",     badge: "bg-cyan-400 text-cyan-900",    score: "bg-white/20" },
  { card: "from-cyan-500 via-teal-500 to-emerald-600",    badge: "bg-orange-400 text-orange-900",score: "bg-white/20" },
  { card: "from-orange-500 via-amber-500 to-yellow-400",  badge: "bg-violet-400 text-violet-900",score: "bg-white/20" },
  { card: "from-indigo-600 via-blue-600 to-sky-500",      badge: "bg-pink-400 text-pink-900",    score: "bg-white/20" },
];

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = memo(({ label, value, icon: Icon, bg, iconColor }) => (
  <Card className="p-6 shadow-sm border border-blue-gray-100 hover:shadow-lg transition">
    <div className="flex items-start justify-between">
      <div>
        <Typography className="text-blue-gray-500 text-sm mb-2">{label}</Typography>
        <Typography className="text-3xl font-bold text-blue-gray-900">{value}</Typography>
      </div>
      <div className={`p-3 ${bg} rounded-lg`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
    </div>
  </Card>
));
StatCard.displayName = "StatCard";

// ─── OfferCard ────────────────────────────────────────────────────────────────
const OfferCard = memo(({ offer, applied, onOpen }) => (
  <div className="pb-4 border-b border-blue-gray-50 last:border-b-0 last:pb-0">
    <Typography variant="h6" className="text-blue-gray-900 font-bold mb-1">{offer.title}</Typography>
    <Typography className="text-sm text-blue-500 font-medium mb-2">{offer.enterprise?.name || "Entreprise"}</Typography>
    <div className="flex flex-wrap gap-2 text-xs text-blue-gray-600 mb-2">
      <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" /> {offer.location || "N/A"}</span>
      <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {offer.duration || "N/A"}</span>
      <span className="flex items-center gap-1">📅 {formatDate(offer.start_date)}</span>
      <span className="flex items-center gap-1">👥 {offer.available_places ? `${offer.available_places} place(s)` : "N/A"}</span>
    </div>
    <Button size="sm" color={applied ? "green" : "blue"} variant="outlined" className="text-xs" onClick={() => onOpen(offer)} disabled={applied}>
      {applied ? "✓ Déjà postulé" : "Postuler"}
    </Button>
  </div>
));
OfferCard.displayName = "OfferCard";

// ─── ApplicationCard ──────────────────────────────────────────────────────────
const ApplicationCard = memo(({ app }) => (
  <div className="pb-4 border-b border-blue-gray-50 last:border-b-0 last:pb-0">
    <Typography variant="h6" className="text-blue-gray-900 font-bold mb-1">{app.offer?.title || "Offre inconnue"}</Typography>
    <Typography className="text-sm text-blue-500 font-medium mb-1">{app.offer?.enterprise?.name || "Entreprise"}</Typography>
    <div className="flex flex-wrap gap-2 text-xs text-blue-gray-600 mb-2">
      <span>📍 {app.offer?.location || "N/A"}</span>
      <span>⏱️ {app.offer?.duration || "N/A"}</span>
      <span>📅 Début : {formatDate(app.offer?.start_date)}</span>
    </div>
    <div className="flex items-center justify-between">
      <Typography className="text-xs text-blue-gray-500">Postulé le {formatDate(app.created_at)}</Typography>
      <Chip value={statusLabel(app.status)} color={statusColor(app.status)} size="sm" variant="ghost" />
    </div>
  </div>
));
ApplicationCard.displayName = "ApplicationCard";

// ─── AI Recommendation Card ───────────────────────────────────────────────────
const AIRecommendationCard = memo(({ rec, index, applied, onApply, onOpen }) => {
  const gradient = AI_GRADIENTS[index % AI_GRADIENTS.length];
  const offer = rec.offer;
  if (!offer) return null;

  return (
    <div className={`relative rounded-2xl bg-gradient-to-br ${gradient.card} p-[2px] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="bg-gradient-to-br from-black/10 to-black/20 rounded-2xl h-full">
        <div className={`rounded-2xl bg-gradient-to-br ${gradient.card} p-5 h-full flex flex-col`}>
          {/* Badges */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-col gap-1">
              {index === 0 && (
                <span className={`${gradient.badge} text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit`}>
                  <StarIcon className="w-3 h-3" /> Meilleure correspondance
                </span>
              )}
              <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
                💼 {offer.domain || "Stage"}
              </span>
            </div>
            {/* Score */}
            <div className="text-center bg-white/25 backdrop-blur rounded-xl px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-black text-white">{rec.score}</div>
              <div className="text-white/70 text-xs font-medium">/ 100</div>
            </div>
          </div>

          {/* Title */}
          <Typography variant="h6" className="text-white font-bold mb-1 leading-tight">
            {offer.title}
          </Typography>
          <Typography variant="small" className="text-white/80 font-medium mb-3">
            🏢 {offer.enterprise?.name || "Entreprise"}
          </Typography>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 mb-3">
            {offer.location && (
              <span className="bg-white/15 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <MapPinIcon className="w-3 h-3" /> {offer.location}
              </span>
            )}
            {offer.duration && (
              <span className="bg-white/15 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <ClockIcon className="w-3 h-3" /> {offer.duration}
              </span>
            )}
          </div>

          {/* Score bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>Compatibilité</span>
              <span>{rec.score}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${rec.score}%` }}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="bg-white/10 rounded-xl p-3 mb-4 flex-1">
            <Typography variant="small" className="text-white/90 text-xs leading-relaxed italic">
              💡 {rec.reason}
            </Typography>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            <button
              onClick={() => onOpen(offer)}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-2 rounded-xl transition"
            >
              Voir l'offre
            </button>
            <button
              onClick={() => onApply(offer.id)}
              disabled={applied}
              className={`flex-1 text-xs font-bold py-2 rounded-xl transition ${
                applied
                  ? "bg-white/20 text-white/60 cursor-not-allowed"
                  : "bg-white text-gray-800 hover:bg-white/90"
              }`}
            >
              {applied ? "✓ Postulé" : "✅ Postuler"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
AIRecommendationCard.displayName = "AIRecommendationCard";

// ─── AI Section Skeleton ──────────────────────────────────────────────────────
const AISkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {[0, 1, 2].map((i) => (
      <div key={i} className="rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 p-5 h-72 animate-pulse">
        <div className="h-4 bg-gray-400/30 rounded-full w-2/3 mb-3" />
        <div className="h-6 bg-gray-400/30 rounded-full w-full mb-2" />
        <div className="h-4 bg-gray-400/30 rounded-full w-1/2 mb-4" />
        <div className="h-2 bg-gray-400/30 rounded-full w-full mb-6" />
        <div className="h-16 bg-gray-400/20 rounded-xl mb-4" />
        <div className="flex gap-2">
          <div className="h-8 bg-gray-400/30 rounded-xl flex-1" />
          <div className="h-8 bg-gray-400/30 rounded-xl flex-1" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Composant principal ──────────────────────────────────────────────────────
export function StudentDashboard() {
  const [applications, setApplications] = useState([]);
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── État IA ────────────────────────────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiError, setAiError] = useState(null); // null | 'profile_incomplete' | 'api_quota_exceeded' | 'no_offers' | 'generic'
  const [aiCached, setAiCached] = useState(false);

  const [userName] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}")?.name || "Étudiant"; }
    catch { return "Étudiant"; }
  });

  const fetchOffers = useCallback(async () => {
    try {
      const res = await api.get("/public/offers");
      setOffers(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch (err) { console.error("Erreur offres:", err); }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await api.get("/my-applications");
      setApplications(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch (err) { console.error("Erreur candidatures:", err); }
  }, []);

  const fetchAIRecommendations = useCallback(async (force = false) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const url = force ? "/ai/recommendations?refresh=1" : "/ai/recommendations";
      const res = await api.get(url);
      setAiRecommendations(res.data.recommendations || []);
      setAiCached(res.data.cached || false);
    } catch (err) {
      const errorCode = err.response?.data?.error;
      if (errorCode === "profile_incomplete") {
        setAiError("profile_incomplete");
      } else if (errorCode === "api_quota_exceeded") {
        setAiError("api_quota_exceeded");
      } else if (errorCode === "no_offers") {
        setAiError("no_offers");
      } else {
        setAiError("generic");
      }
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
    fetchApplications();
    fetchAIRecommendations();
  }, [fetchOffers, fetchApplications, fetchAIRecommendations]);

  const appliedOfferIds = useMemo(
    () => new Set(applications.map((app) => app.offer_id ?? app.offer?.id)),
    [applications]
  );
  const hasApplied = useCallback((offerId) => appliedOfferIds.has(offerId), [appliedOfferIds]);

  const filteredOffers = useMemo(
    () => offers.filter((offer) => {
      const q = search.toLowerCase();
      return offer.title?.toLowerCase().includes(q) || offer.description?.toLowerCase().includes(q) || offer.location?.toLowerCase().includes(q);
    }),
    [offers, search]
  );

  const { acceptedCount, interviewCount } = useMemo(() => {
    let accepted = 0, interview = 0;
    for (const a of applications) {
      const s = normalizeStatus(a.status);
      if (s === "accepted") accepted++;
      else if (s === "interview") interview++;
    }
    return { acceptedCount: accepted, interviewCount: interview };
  }, [applications]);

  const statValues = useMemo(() => ({
    applications: applications.length, offers: offers.length,
    interview: interviewCount, accepted: acceptedCount,
  }), [applications.length, offers.length, interviewCount, acceptedCount]);

  const handleOpenDetails = useCallback((offer) => {
    setSelectedOffer(offer);
    setOpenModal(true);
    setActiveTab("description");
    setIsSaved(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
    setSelectedOffer(null);
  }, []);

  const handleSearchChange = useCallback((e) => setSearch(e.target.value), []);
  const toggleSaved = useCallback(() => setIsSaved((prev) => !prev), []);

  const applyToOffer = useCallback(async (offerId) => {
    const result = await Swal.fire({
      title: "Confirmer la candidature ?",
      text: "Vous allez postuler à cette offre.",
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
      await api.post("/applications", { offer_id: offerId });
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
  }, [handleCloseModal, fetchApplications]);

  const sidebarExtra = useMemo(() => (
    <>
      <div className="bg-blue-50 rounded-lg p-4">
        <Typography variant="small" className="text-blue-gray-600 mb-1">Votre progression</Typography>
        <Progress value={65} color="blue" className="h-2" />
        <Typography variant="caption" className="text-blue-gray-500 mt-2">65% de profil complet</Typography>
      </div>
      <Button fullWidth color="blue" variant="gradient" size="sm">✉️ Contacter support</Button>
    </>
  ), []);

  const menuItems = useMemo(
    () => getStudentMenuItems({ offers: offers.length, applications: applications.length }),
    [offers.length, applications.length]
  );

  const headerActions = useMemo(() => (
    <>
      <NotificationBell apiPrefix="student" />
      <IconButton variant="text" color="blue-gray"><ChatBubbleLeftIcon className="w-5 h-5" /></IconButton>
      <IconButton variant="text" color="blue-gray"><UserCircleIcon className="w-5 h-5" /></IconButton>
    </>
  ), []);

  const topOffers = useMemo(() => filteredOffers.slice(0, 4), [filteredOffers]);
  const topApplications = useMemo(() => applications.slice(0, 4), [applications]);

  return (
    <BaseLayout
      title="Tableau de Bord"
      menuItems={menuItems}
      sidebarHeader={<StudentSidebarHeader />}
      sidebarExtra={sidebarExtra}
      headerActions={headerActions}
    >
      {/* Salut personnalisé */}
      <div className="mb-8">
        <Typography variant="h4" className="font-bold text-blue-gray-900">
          Bonjour, {userName} 👋
        </Typography>
        <Typography variant="small" className="text-blue-gray-500">
          Voici un aperçu de votre activité
        </Typography>
      </div>

      {/* Statistiques */}
      <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {STAT_CONFIG.map((stat) => (
          <StatCard key={stat.key} {...stat} value={statValues[stat.key]} />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🤖 SECTION RECOMMANDATIONS IA                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="mb-10">
        {/* Header section IA */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <Typography variant="h5" className="font-bold text-blue-gray-900">
                Recommandations IA
              </Typography>
              <Typography variant="small" className="text-blue-gray-500">
                {aiCached ? "📦 Résultats en cache — " : ""}Les meilleures offres pour votre profil
              </Typography>
            </div>
          </div>
          {aiRecommendations.length > 0 && (
            <button
              onClick={() => fetchAIRecommendations(true)}
              disabled={aiLoading}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl"
            >
              <ArrowPathIcon className={`w-4 h-4 ${aiLoading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          )}
        </div>

        {/* === États IA === */}

        {/* Chargement */}
        {aiLoading && <AISkeleton />}

        {/* Erreur : profil incomplet */}
        {!aiLoading && aiError === "profile_incomplete" && (
          <div className="relative overflow-hidden rounded-2xl p-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400">
            <div className="rounded-2xl bg-white p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ExclamationTriangleIcon className="w-8 h-8 text-white" />
              </div>
              <Typography variant="h6" className="font-bold text-blue-gray-900 mb-2">
                🔔 Améliorez votre profil !
              </Typography>
              <Typography className="text-blue-gray-600 mb-6 max-w-md mx-auto">
                Pour recevoir des recommandations personnalisées, ajoutez vos compétences dans votre profil. L'IA analysera votre profil pour vous suggérer les meilleures offres.
              </Typography>
              <Link to="/student/profile">
                <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-3 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5">
                  ✨ Compléter mon profil →
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Erreur : quota API dépassé */}
        {!aiLoading && aiError === "api_quota_exceeded" && (
          <div className="relative overflow-hidden rounded-2xl p-[2px] bg-gradient-to-r from-red-400 via-rose-400 to-pink-400">
            <div className="rounded-2xl bg-white p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ExclamationTriangleIcon className="w-8 h-8 text-white" />
              </div>
              <Typography variant="h6" className="font-bold text-blue-gray-900 mb-2">
                ⚠️ Gemini API Failed
              </Typography>
              <Typography className="text-blue-gray-600 mb-2">
                Le quota de l'API est temporairement dépassé.
              </Typography>
              <Typography variant="small" className="text-blue-gray-500 mb-6 bg-red-50 px-4 py-2 rounded-lg inline-block">
                Les recommandations seront disponibles dans quelques heures.
              </Typography>
              <br />
              <button
                onClick={() => fetchAIRecommendations(true)}
                className="bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold px-6 py-2.5 rounded-xl hover:shadow-lg transition-all mt-2"
              >
                <ArrowPathIcon className="w-4 h-4 inline mr-2" />
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Erreur générique */}
        {!aiLoading && aiError === "generic" && (
          <div className="rounded-2xl bg-blue-gray-50 border-2 border-dashed border-blue-gray-200 p-8 text-center">
            <ExclamationTriangleIcon className="w-10 h-10 text-blue-gray-400 mx-auto mb-3" />
            <Typography className="text-blue-gray-600 mb-4">
              Impossible de charger les recommandations.
            </Typography>
            <button
              onClick={() => fetchAIRecommendations()}
              className="bg-blue-500 text-white font-medium px-6 py-2 rounded-xl hover:bg-blue-600 transition"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Recommandations disponibles */}
        {!aiLoading && !aiError && aiRecommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {aiRecommendations.map((rec, idx) => (
              <AIRecommendationCard
                key={rec.offer_id}
                rec={rec}
                index={idx}
                applied={hasApplied(rec.offer_id)}
                onApply={applyToOffer}
                onOpen={handleOpenDetails}
              />
            ))}
          </div>
        )}
      </div>
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Barre de recherche */}
      <div className="mb-6">
        <Input
          placeholder="Rechercher une offre..."
          value={search}
          onChange={handleSearchChange}
          icon={<MagnifyingGlassIcon className="h-5 w-5" />}
          className="!border-blue-gray-200"
        />
      </div>

      {/* Grille 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Offres récentes */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100">
            <Typography variant="h6" color="blue-gray" className="font-bold">Offres récentes</Typography>
            <Link to="/student/offers">
              <Typography variant="small" className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer">Voir tout</Typography>
            </Link>
          </CardHeader>
          <CardBody className="p-6 space-y-4">
            {topOffers.length === 0 ? (
              <Typography className="text-center text-blue-gray-500 py-4">Aucune offre disponible</Typography>
            ) : (
              topOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} applied={hasApplied(offer.id)} onOpen={handleOpenDetails} />
              ))
            )}
          </CardBody>
        </Card>

        {/* Mes candidatures */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100">
            <Typography variant="h6" color="blue-gray" className="font-bold">Mes candidatures</Typography>
            <Link to="/student/applications">
              <Typography variant="small" className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer">Voir tout</Typography>
            </Link>
          </CardHeader>
          <CardBody className="p-6 space-y-4">
            {topApplications.length === 0 ? (
              <Typography className="text-center text-blue-gray-500 py-4">Aucune candidature encore</Typography>
            ) : (
              topApplications.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal Détails Offre */}
      <Dialog open={openModal} handler={handleCloseModal} size="lg">
        <DialogHeader className="flex justify-between items-center">
          <Typography variant="h5" className="font-bold">{selectedOffer?.title}</Typography>
          <IconButton variant="text" color="blue-gray" onClick={handleCloseModal}>
            <XMarkIcon className="w-6 h-6" />
          </IconButton>
        </DialogHeader>

        <DialogBody divider className="max-h-[70vh] overflow-y-auto">
          {selectedOffer && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">🏢 {selectedOffer.enterprise?.name || "Non spécifiée"}</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">📍 {selectedOffer.location || "N/A"}</span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">⏱️ {selectedOffer.duration || "N/A"}</span>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">📅 Début : {formatDate(selectedOffer.start_date)}</span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">👥 {selectedOffer.available_places ? `${selectedOffer.available_places} place(s)` : "N/A"}</span>
                <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-medium">💼 {selectedOffer.domain || "N/A"}</span>
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
                      {selectedOffer.requirements ? (
                        selectedOffer.requirements.split(",").map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                            <span className="text-blue-gray-700">{req.trim()}</span>
                          </li>
                        ))
                      ) : (
                        <Typography className="text-blue-gray-500">Aucune exigence spécifiée</Typography>
                      )}
                    </ul>
                  </div>
                )}
                {activeTab === "advantages" && (
                  <div>
                    <Typography variant="h6" className="mb-3 font-semibold">Avantages</Typography>
                    <ul className="space-y-2">
                      {selectedOffer.advantages ? (
                        selectedOffer.advantages.split(",").map((adv, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-blue-gray-700">{adv.trim()}</span>
                          </li>
                        ))
                      ) : (
                        <Typography className="text-blue-gray-500">Aucun avantage spécifié</Typography>
                      )}
                    </ul>
                  </div>
                )}
                {activeTab === "company" && (
                  <div>
                    <Typography variant="h6" className="mb-3 font-semibold">À propos de l'entreprise</Typography>
                    <Typography className="text-blue-gray-700 leading-relaxed mb-4">{selectedOffer.enterprise?.description || "Information non disponible"}</Typography>
                    <div className="space-y-2">
                      <Typography variant="small" className="text-blue-gray-600"><strong>Email :</strong> {selectedOffer.enterprise?.email || "N/A"}</Typography>
                      <Typography variant="small" className="text-blue-gray-600"><strong>Téléphone :</strong> {selectedOffer.enterprise?.phone || "N/A"}</Typography>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="space-x-3">
          <Button color="blue" variant="outlined" onClick={toggleSaved}>
            {isSaved ? "❌ Retirer" : "❤️ Sauvegarder"}
          </Button>
          <Button
            size="sm"
            color={hasApplied(selectedOffer?.id) ? "green" : "blue"}
            onClick={() => applyToOffer(selectedOffer?.id)}
            disabled={loading || hasApplied(selectedOffer?.id)}
          >
            {hasApplied(selectedOffer?.id) ? "✓ Déjà postulé" : loading ? "Envoi en cours..." : "✅ Postuler"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ChatBox />
    </BaseLayout>
  );
}

export default StudentDashboard;