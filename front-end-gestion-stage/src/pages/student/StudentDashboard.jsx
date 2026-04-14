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

// ─── AIRecommendationsSection ─────────────────────────────────────────���──────
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
      <Card className="p-8">
        <Typography className="text-center text-blue-gray-500">
          ⏳ Chargement des recommandations...
        </Typography>
      </Card>
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
      {aiRecommendations.map((rec, idx) => {
        const gradient = AI_GRADIENTS[idx % AI_GRADIENTS.length];
        const offer = rec.offer;
        return (
          <div
            key={rec.offer_id}
            className="rounded-lg overflow-hidden text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => onOpenDetails(offer)}
          >
            {/* Header gradient */}
            <div className={`bg-gradient-to-br ${gradient.card} p-6 pb-12 relative`}>
              <div className="absolute top-4 right-4">
                <span className={`${gradient.badge} px-3 py-1 rounded-full text-xs font-bold`}>
                  Score {rec.score}%
                </span>
              </div>
              <Typography variant="h6" className="font-bold mb-2">
                {offer.title}
              </Typography>
              <Typography variant="small" className="opacity-90">
                {offer.enterprise?.name}
              </Typography>
            </div>

            {/* Body */}
            <div className="bg-white p-6 text-blue-gray-900">
              <Typography variant="small" className="mb-3 leading-relaxed">
                <strong>Pourquoi :</strong> {rec.reason}
              </Typography>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                  📍 {offer.location}
                </span>
                <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                  ⏱️ {offer.duration}
                </span>
              </div>

              <Button
                size="sm"
                fullWidth
                color="blue"
                onClick={(e) => {
                  e.stopPropagation();
                  applyToOffer(offer.id);
                }}
                disabled={loading || hasApplied(offer.id)}
              >
                {hasApplied(offer.id) ? "✓ Déjà postulé" : "Postuler"}
              </Button>
            </div>
          </div>
        );
      })}
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