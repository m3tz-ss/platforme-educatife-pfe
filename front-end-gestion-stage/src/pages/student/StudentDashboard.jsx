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
  Tooltip,
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
  EnvelopeIcon,
  PhoneIcon,
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
  { card: "from-gray-900 via-gray-800 to-gray-700", badge: "bg-yellow-400 text-yellow-900", score: "bg-white/20" },
  { card: "from-pink-500 via-rose-500 to-orange-500", badge: "bg-cyan-400 text-cyan-900", score: "bg-white/20" },
  { card: "from-cyan-500 via-teal-500 to-emerald-600", badge: "bg-orange-400 text-orange-900", score: "bg-white/20" },
  { card: "from-orange-500 via-amber-500 to-yellow-400", badge: "bg-violet-400 text-violet-900", score: "bg-white/20" },
  { card: "from-indigo-600 via-blue-600 to-sky-500", badge: "bg-pink-400 text-pink-900", score: "bg-white/20" },
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

// ─── OfferCard (AVEC EMAIL ET TÉLÉPHONE) ──────────────────────────────────────
const OfferCard = memo(({ offer, applied, onOpen }) => {
  const copyToClipboard = (text, label, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: "success",
      title: `${label} copié`,
      timer: 1200,
      showConfirmButton: false,
    });
  };

  return (
    <div className="pb-4 border-b border-blue-gray-50 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between mb-1">
        <Typography variant="h6" className="text-blue-gray-900 font-bold">{offer.title}</Typography>
      </div>
      <Typography className="text-sm text-blue-500 font-medium mb-2">{offer.enterprise?.name || "Entreprise"}</Typography>

      <div className="flex flex-wrap gap-2 text-xs text-blue-gray-600 mb-3">
        <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" /> {offer.location || "N/A"}</span>
        <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {offer.duration || "N/A"}</span>
        <span className="flex items-center gap-1">📅 {formatDate(offer.start_date)}</span>
        <span className="flex items-center gap-1">👥 {offer.available_places ? `${offer.available_places} place(s)` : "N/A"}</span>
      </div>

      {/* ✅ Email et Téléphone */}
      {(offer.enterprise?.email || offer.enterprise?.phone) && (
        <div className="bg-gray-50 p-2 rounded mb-3 space-y-1">
          {offer.enterprise?.email && (
            <Tooltip title="Cliquez pour copier" placement="bottom">
              <div
                onClick={(e) => copyToClipboard(offer.enterprise.email, "Email", e)}
                className="flex items-center gap-2 cursor-pointer hover:bg-blue-100 p-1 rounded transition text-xs"
              >
                <EnvelopeIcon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="text-blue-700 font-semibold truncate">{offer.enterprise.email}</span>
              </div>
            </Tooltip>
          )}
          {offer.enterprise?.phone && (
            <Tooltip title="Cliquez pour copier" placement="bottom">
              <div
                onClick={(e) => copyToClipboard(offer.enterprise.phone, "Téléphone", e)}
                className="flex items-center gap-2 cursor-pointer hover:bg-green-100 p-1 rounded transition text-xs"
              >
                <PhoneIcon className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="text-green-700 font-semibold truncate">{offer.enterprise.phone}</span>
              </div>
            </Tooltip>
          )}
        </div>
      )}

      <Button size="sm" color={applied ? "green" : "blue"} variant="outlined" className="text-xs" onClick={() => onOpen(offer)} disabled={applied}>
        {applied ? "✓ Déjà postulé" : "Postuler"}
      </Button>
    </div>
  );
});
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

// ─── AIRecommendationCard (AVEC EMAIL ET TÉLÉPHONE) ──────────────────────────
const AIRecommendationCard = memo(
  ({ rec, index, onOpenDetails, applyToOffer, hasApplied, loading }) => {
    const gradient = AI_GRADIENTS[index % AI_GRADIENTS.length];
    const offer = rec.offer;

    const copyToClipboard = (text, label) => {
      navigator.clipboard.writeText(text);
      Swal.fire({
        icon: "success",
        title: `${label} copié`,
        timer: 1200,
        showConfirmButton: false,
      });
    };

    return (
      <div
        className="rounded-lg overflow-hidden text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col"
        onClick={() => onOpenDetails(offer)}
      >
        {/* Header gradient */}
        <div className={`bg-gradient-to-br ${gradient.card} p-6 pb-12 relative flex-shrink-0`}>
          <div className="absolute top-4 right-4">
            <span className={`${gradient.badge} px-3 py-1 rounded-full text-xs font-bold`}>
              Score {rec.score}%
            </span>
          </div>
          <Typography variant="h6" className="font-bold mb-2 line-clamp-2">
            {offer.title}
          </Typography>
          <Typography variant="small" className="opacity-90">
            {offer.enterprise?.name}
          </Typography>
        </div>

        {/* Body */}
        <div className="bg-white p-6 text-blue-gray-900 flex-1 flex flex-col gap-3">
          {/* Raison */}
          <Typography variant="small" className="mb-2 leading-relaxed line-clamp-2">
            <strong>Pourquoi :</strong> {rec.reason}
          </Typography>

          {/* Localisation et durée */}
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
              📍 {offer.location}
            </span>
            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
              ⏱️ {offer.duration}
            </span>
          </div>

          {/* ✅ Email et Téléphone */}
          {(offer.enterprise?.email || offer.enterprise?.phone) && (
            <div className="bg-gray-50 p-2 rounded space-y-1 border border-gray-200">
              {offer.enterprise?.email && (
                <Tooltip title="Cliquez pour copier" placement="bottom">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(offer.enterprise.email, "Email");
                    }}
                    className="flex items-center gap-2 cursor-pointer hover:bg-blue-100 p-1 rounded transition"
                  >
                    <EnvelopeIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs text-blue-700 font-semibold truncate">
                      {offer.enterprise.email}
                    </span>
                  </div>
                </Tooltip>
              )}

              {offer.enterprise?.phone && (
                <Tooltip title="Cliquez pour copier" placement="bottom">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(offer.enterprise.phone, "Téléphone");
                    }}
                    className="flex items-center gap-2 cursor-pointer hover:bg-green-100 p-1 rounded transition"
                  >
                    <PhoneIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs text-green-700 font-semibold truncate">
                      {offer.enterprise.phone}
                    </span>
                  </div>
                </Tooltip>
              )}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <Button
              size="sm"
              fullWidth
              variant="outlined"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(offer);
              }}
            >
              Détails
            </Button>
            <Button
              size="sm"
              fullWidth
              color={hasApplied(offer.id) ? "green" : "blue"}
              onClick={(e) => {
                e.stopPropagation();
                applyToOffer(offer.id);
              }}
              disabled={loading || hasApplied(offer.id)}
            >
              {hasApplied(offer.id) ? "✓" : "Postuler"}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);
AIRecommendationCard.displayName = "AIRecommendationCard";

// ─── AIRecommendationsSection ─────────────────────────────────────────   ──────
const AIRecommendationsSection = memo(({
  aiLoading,
  aiError,
  aiRecommendations,
  aiCached,
  onRefresh,
  onOpenDetails,
  applyToOffer,
  hasApplied,
  loading,
}) => {
  if (aiLoading) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center mb-8">
          <SparklesIcon className="w-8 h-8 text-yellow-500 animate-bounce mb-2" />
          <Typography variant="h6" className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
            L'IA analyse les offres pour vous...
          </Typography>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white border border-blue-gray-50 shadow-sm animate-pulse">
              {/* Header skeleton */}
              <div className="h-32 bg-gradient-to-r from-blue-gray-50 to-blue-gray-100" />
              {/* Body skeleton */}
              <div className="p-6 space-y-4">
                <div className="h-4 bg-blue-gray-100 rounded-full w-3/4" />
                <div className="h-4 bg-blue-gray-50 rounded-full w-full" />
                <div className="h-4 bg-blue-gray-50 rounded-full w-5/6" />
                <div className="flex gap-2 pt-4">
                  <div className="h-8 bg-blue-gray-100 rounded-lg w-1/2" />
                  <div className="h-8 bg-blue-gray-100 rounded-lg w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (aiError === "profile_incomplete") {
    return (
      <Card className="bg-orange-50 border border-orange-200 p-6">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 mt-1" />
          <div>
            <Typography className="font-bold text-orange-700">
              Profil incomplet
            </Typography>
            <Typography variant="small" className="text-orange-600 mt-1">
              Veuillez compléter votre profil (compétences, bio, domaine d'études)
              pour recevoir des recommandations personnalisées.
            </Typography>
            <Link to="/student/profile">
              <Button size="sm" color="orange" variant="text" className="mt-2">
                Compléter mon profil →
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  if (aiError === "api_quota_exceeded") {
    return (
      <Card className="bg-red-50 border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mt-1" />
          <div>
            <Typography className="font-bold text-red-700">
              Quota API dépassé
            </Typography>
            <Typography variant="small" className="text-red-600 mt-1">
              Le service IA a atteint sa limite. Réessayez dans quelques heures.
            </Typography>
          </div>
        </div>
      </Card>
    );
  }

  if (aiError === "no_offers") {
    return (
      <Card className="bg-blue-50 border border-blue-200 p-6">
        <Typography className="text-center text-blue-700">
          Aucune offre disponible pour le moment
        </Typography>
      </Card>
    );
  }

  if (aiError === "generic") {
    return (
      <Card className="bg-red-50 border border-red-200 p-6">
        <Typography className="text-center text-red-700">
          ❌ Erreur lors du chargement des recommandations
        </Typography>
      </Card>
    );
  }

  if (aiRecommendations.length === 0) {
    return (
      <Card className="p-8">
        <Typography className="text-center text-blue-gray-500">
          Aucune recommandation disponible
        </Typography>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {aiRecommendations.map((rec, idx) => (
        <AIRecommendationCard
          key={rec.offer_id}
          rec={rec}
          index={idx}
          onOpenDetails={onOpenDetails}
          applyToOffer={applyToOffer}
          hasApplied={hasApplied}
          loading={loading}
        />
      ))}
    </div>
  );
});
AIRecommendationsSection.displayName = "AIRecommendationsSection";

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
  const [cvFile, setCvFile] = useState(null);

  // ── État IA ────────────────────────────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiError, setAiError] = useState(null);
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
    // ✅ Lancer les 3 appels en PARALLÈLE — plus de séquence bloquante
    Promise.allSettled([
      fetchOffers(),
      fetchApplications(),
      fetchAIRecommendations(),
    ]);
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
    if (!cvFile) {
      Swal.fire({
        icon: "warning",
        title: "CV manquant",
        text: "Veuillez sélectionner votre CV (PDF) avant de postuler.",
        confirmButtonColor: "#f59e0b",
      });
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

      await api.post("/applications", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await Swal.fire({
        icon: "success",
        title: "Candidature envoyée !",
        timer: 2500,
        timerProgressBar: true,
        showConfirmButton: false
      });

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
  }, [handleCloseModal, fetchApplications, cvFile]);

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

      {/* 🤖 Section Recommandations IA */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-yellow-500" />
            <Typography variant="h5" className="font-bold">
              Recommandations IA
            </Typography>
            {aiCached && (
              <Chip value="En cache" size="sm" variant="ghost" color="blue" />
            )}
          </div>
          <Button
            size="sm"
            color="blue"
            variant="outlined"
            onClick={() => fetchAIRecommendations(true)}
            disabled={aiLoading}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Actualiser
          </Button>
        </div>

        <AIRecommendationsSection
          aiLoading={aiLoading}
          aiError={aiError}
          aiRecommendations={aiRecommendations}
          aiCached={aiCached}
          onRefresh={() => fetchAIRecommendations(true)}
          onOpenDetails={handleOpenDetails}
          applyToOffer={applyToOffer}
          hasApplied={hasApplied}
          loading={loading}
        />
      </div>

      {/* ✅ MODAL AVEC COORDONNÉES COMPLÈTES */}
      <Dialog open={openModal} handler={handleCloseModal} size="lg">
        <DialogHeader className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <Typography variant="h5" className="font-bold">{selectedOffer?.title}</Typography>
          <IconButton variant="text" color="white" onClick={handleCloseModal}>
            <XMarkIcon className="w-6 h-6" />
          </IconButton>
        </DialogHeader>

        <DialogBody divider className="max-h-[70vh] overflow-y-auto p-6">
          {selectedOffer && (
            <div className="space-y-6">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">🏢 {selectedOffer.enterprise?.name || "Non spécifiée"}</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">📍 {selectedOffer.location || "N/A"}</span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">⏱️ {selectedOffer.duration || "N/A"}</span>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">📅 Début : {formatDate(selectedOffer.start_date)}</span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">👥 {selectedOffer.available_places ? `${selectedOffer.available_places} place(s)` : "N/A"}</span>
                <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-medium">💼 {selectedOffer.domain || "N/A"}</span>
              </div>

              {/* Tabs */}
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
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <Typography variant="h6" className="mb-3 font-semibold">À propos de l'entreprise</Typography>
                      <Typography className="text-blue-gray-700 leading-relaxed mb-4">{selectedOffer.enterprise?.description || "Information non disponible"}</Typography>
                    </div>

                    {/* ✅ Coordonnées améliorées */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <Typography variant="h6" className="font-bold text-blue-900 mb-4">
                        📞 Coordonnées de l'entreprise
                      </Typography>

                      <div className="space-y-3">
                        {selectedOffer.enterprise?.email && (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 hover:shadow-md transition">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <Typography variant="caption" className="text-blue-600 font-bold block">
                                Email
                              </Typography>
                              <a
                                href={`mailto:${selectedOffer.enterprise.email}`}
                                className="text-blue-700 font-semibold hover:text-blue-900 underline break-all text-sm"
                              >
                                {selectedOffer.enterprise.email}
                              </a>
                            </div>
                            <Tooltip title="Copier l'email">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedOffer.enterprise.email);
                                  Swal.fire({
                                    icon: "success",
                                    title: "Email copié",
                                    timer: 1500,
                                    showConfirmButton: false,
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-900 font-bold text-lg"
                              >
                                📋
                              </button>
                            </Tooltip>
                          </div>
                        )}

                        {selectedOffer.enterprise?.phone && (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200 hover:shadow-md transition">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <PhoneIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <Typography variant="caption" className="text-green-600 font-bold block">
                                Téléphone
                              </Typography>
                              <a
                                href={`tel:${selectedOffer.enterprise.phone}`}
                                className="text-green-700 font-semibold hover:text-green-900 underline text-sm"
                              >
                                {selectedOffer.enterprise.phone}
                              </a>
                            </div>
                            <Tooltip title="Copier le téléphone">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedOffer.enterprise.phone);
                                  Swal.fire({
                                    icon: "success",
                                    title: "Téléphone copié",
                                    timer: 1500,
                                    showConfirmButton: false,
                                  });
                                }}
                                className="text-green-600 hover:text-green-900 font-bold text-lg"
                              >
                                📋
                              </button>
                            </Tooltip>
                          </div>
                        )}

                        {selectedOffer.enterprise?.sector && (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200 hover:shadow-md transition">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <BriefcaseIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <Typography variant="caption" className="text-purple-600 font-bold block">
                                Secteur
                              </Typography>
                              <Typography className="text-purple-700 font-semibold text-sm">
                                {selectedOffer.enterprise.sector}
                              </Typography>
                            </div>
                          </div>
                        )}

                        {!selectedOffer.enterprise?.email && !selectedOffer.enterprise?.phone && !selectedOffer.enterprise?.sector && (
                          <Typography className="text-gray-500 text-center py-4">
                            Aucune information de contact disponible
                          </Typography>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
              </div>

              {/* Download CV Section */}
              {!hasApplied(selectedOffer.id) && (
                <div className="mt-8 pt-6 border-t border-blue-gray-50">
                  <Typography variant="h6" color="blue-gray" className="mb-4 flex items-center gap-2">
                    📄 Votre Candidature
                  </Typography>
                  <div className="bg-blue-gray-50/50 p-6 rounded-xl border-2 border-dashed border-blue-gray-100">
                    <Typography variant="small" color="blue-gray" className="font-bold mb-2">
                      Télécharger votre CV (PDF uniquement, max 2MB)
                    </Typography>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.type !== "application/pdf") {
                            Swal.fire("Erreur", "Seuls les fichiers PDF sont acceptés.", "error");
                            e.target.value = null;
                            return;
                          }
                          if (file.size > 2 * 1024 * 1024) {
                            Swal.fire("Erreur", "Le fichier est trop volumineux (max 2MB).", "error");
                            e.target.value = null;
                            return;
                          }
                          setCvFile(file);
                        }
                      }}
                      className="block w-full text-sm text-blue-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
                    />
                    {cvFile && (
                      <Typography variant="small" className="mt-2 text-green-600 font-medium flex items-center gap-1">
                        ✅ Fichier sélectionné : {cvFile.name}
                      </Typography>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="space-x-3 p-6 bg-gray-50">
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