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
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";
import BaseLayout from "../../components/layout/BaseLayout";
import { StudentSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getStudentMenuItems } from "../../config/sidebarConfig";
import NotificationBell from "../../components/layout/NotificationBell";

// ─── Format date (en dehors du composant → ne se recrée jamais) ───────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// ─── Status helpers (en dehors du composant) ─────────────────────────────────
const STATUS_MAP = {
  nouveau: "pending",
  preselectionnee: "reviewing",
  entretien: "interview",
  acceptee: "accepted",
  refusee: "rejected",
};

const normalizeStatus = (status) => STATUS_MAP[status] ?? status;

const STATUS_COLOR = {
  accepted: "green",
  rejected: "red",
  interview: "purple",
  reviewing: "amber",
  pending: "orange",
};

const STATUS_LABEL = {
  accepted: "✅ Acceptée",
  rejected: "❌ Refusée",
  interview: "📞 Entretien",
  reviewing: "👀 Présélectionnée",
  pending: "⏳ En attente",
};

const statusColor = (status) => STATUS_COLOR[normalizeStatus(status)] ?? "orange";
const statusLabel = (status) => STATUS_LABEL[normalizeStatus(status)] ?? "⏳ En attente";

// ─── STATS config (constante, hors composant) ────────────────────────────────
const STAT_CONFIG = [
  {
    key: "applications",
    label: "Candidatures envoyées",
    icon: BriefcaseIcon,
    bg: "bg-blue-100",
    iconColor: "text-blue-500",
  },
  {
    key: "offers",
    label: "Offres disponibles",
    icon: MagnifyingGlassIcon,
    bg: "bg-purple-100",
    iconColor: "text-purple-500",
  },
  {
    key: "interview",
    label: "Entretiens planifiés",
    icon: CalendarIcon,
    bg: "bg-green-100",
    iconColor: "text-green-500",
  },
  {
    key: "accepted",
    label: "Candidatures acceptées",
    icon: CheckCircleIcon,
    bg: "bg-orange-100",
    iconColor: "text-orange-500",
  },
];

// ─── StatCard mémoïsé → ne re-render que si value change ─────────────────────
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

// ─── OfferCard mémoïsé ────────────────────────────────────────────────────────
const OfferCard = memo(({ offer, applied, onOpen }) => (
  <div className="pb-4 border-b border-blue-gray-50 last:border-b-0 last:pb-0">
    <Typography variant="h6" className="text-blue-gray-900 font-bold mb-1">
      {offer.title}
    </Typography>
    <Typography className="text-sm text-blue-500 font-medium mb-2">
      {offer.enterprise?.name || "Entreprise"}
    </Typography>
    <div className="flex flex-wrap gap-2 text-xs text-blue-gray-600 mb-2">
      <span className="flex items-center gap-1">
        <MapPinIcon className="w-3 h-3" /> {offer.location || "N/A"}
      </span>
      <span className="flex items-center gap-1">
        <ClockIcon className="w-3 h-3" /> {offer.duration || "N/A"}
      </span>
      <span className="flex items-center gap-1">📅 {formatDate(offer.start_date)}</span>
      <span className="flex items-center gap-1">
        👥 {offer.available_places ? `${offer.available_places} place(s)` : "N/A"}
      </span>
    </div>
    <Button
      size="sm"
      color={applied ? "green" : "blue"}
      variant="outlined"
      className="text-xs"
      onClick={() => onOpen(offer)}
      disabled={applied}
    >
      {applied ? "✓ Déjà postulé" : "Postuler"}
    </Button>
  </div>
));
OfferCard.displayName = "OfferCard";

// ─── ApplicationCard mémoïsé ──────────────────────────────────────────────────
const ApplicationCard = memo(({ app }) => (
  <div className="pb-4 border-b border-blue-gray-50 last:border-b-0 last:pb-0">
    <Typography variant="h6" className="text-blue-gray-900 font-bold mb-1">
      {app.offer?.title || "Offre inconnue"}
    </Typography>
    <Typography className="text-sm text-blue-500 font-medium mb-1">
      {app.offer?.enterprise?.name || "Entreprise"}
    </Typography>
    <div className="flex flex-wrap gap-2 text-xs text-blue-gray-600 mb-2">
      <span>📍 {app.offer?.location || "N/A"}</span>
      <span>⏱️ {app.offer?.duration || "N/A"}</span>
      <span>📅 Début : {formatDate(app.offer?.start_date)}</span>
    </div>
    <div className="flex items-center justify-between">
      <Typography className="text-xs text-blue-gray-500">
        Postulé le {formatDate(app.created_at)}
      </Typography>
      <Chip
        value={statusLabel(app.status)}
        color={statusColor(app.status)}
        size="sm"
        variant="ghost"
      />
    </div>
  </div>
));
ApplicationCard.displayName = "ApplicationCard";

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

  // ✅ Lecture localStorage une seule fois
  const [userName] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")?.name || "Étudiant";
    } catch {
      return "Étudiant";
    }
  });

  // ✅ Fonctions stables grâce à useCallback
  const fetchOffers = useCallback(async () => {
    try {
      const res = await api.get("/public/offers");
      setOffers(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch (err) {
      console.error("Erreur lors du chargement des offres:", err);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await api.get("/my-applications");
      setApplications(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch (err) {
      console.error("Erreur chargement candidatures:", err);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
    fetchApplications();
  }, [fetchOffers, fetchApplications]);

  // ✅ Set pour lookup O(1) au lieu de O(n) à chaque render
  const appliedOfferIds = useMemo(
    () => new Set(applications.map((app) => app.offer_id ?? app.offer?.id)),
    [applications]
  );

  const hasApplied = useCallback(
    (offerId) => appliedOfferIds.has(offerId),
    [appliedOfferIds]
  );

  // ✅ Filtrage mémoïsé — ne recalcule que si offers ou search changent
  const filteredOffers = useMemo(
    () =>
      offers.filter((offer) => {
        const q = search.toLowerCase();
        return (
          offer.title?.toLowerCase().includes(q) ||
          offer.description?.toLowerCase().includes(q) ||
          offer.location?.toLowerCase().includes(q)
        );
      }),
    [offers, search]
  );

  // ✅ Compteurs mémoïsés
  const { acceptedCount, interviewCount } = useMemo(() => {
    let accepted = 0;
    let interview = 0;
    for (const a of applications) {
      const s = normalizeStatus(a.status);
      if (s === "accepted") accepted++;
      else if (s === "interview") interview++;
    }
    return { acceptedCount: accepted, interviewCount: interview };
  }, [applications]);

  // ✅ Valeurs des stats mémoïsées
  const statValues = useMemo(
    () => ({
      applications: applications.length,
      offers: offers.length,
      interview: interviewCount,
      accepted: acceptedCount,
    }),
    [applications.length, offers.length, interviewCount, acceptedCount]
  );

  // ─── Handlers stables ────────────────────────────────────────────────────
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

  const applyToOffer = useCallback(
    async (offerId) => {
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

        await Swal.fire({
          icon: "success",
          title: "Candidature envoyée !",
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        handleCloseModal();
        fetchApplications();
      } catch (err) {
        if (err.response?.status === 409) {
          Swal.fire({
            icon: "warning",
            title: "Déjà postulé",
            text: "Vous avez déjà postulé à cette offre.",
            confirmButtonColor: "#f59e0b",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: err.response?.data?.message || "Erreur lors de la candidature.",
            confirmButtonColor: "#ef4444",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [handleCloseModal, fetchApplications]
  );

  // ✅ sidebarExtra mémoïsé → ne se recrée pas à chaque render
  const sidebarExtra = useMemo(
    () => (
      <>
        <div className="bg-blue-50 rounded-lg p-4">
          <Typography variant="small" className="text-blue-gray-600 mb-1">
            Votre progression
          </Typography>
          <Progress value={65} color="blue" className="h-2" />
          <Typography variant="caption" className="text-blue-gray-500 mt-2">
            65% de profil complet
          </Typography>
        </div>
        <Button fullWidth color="blue" variant="gradient" size="sm">
          ✉️ Contacter support
        </Button>
      </>
    ),
    []
  );

  // ✅ menuItems mémoïsé
  const menuItems = useMemo(
    () => getStudentMenuItems({ offers: offers.length, applications: applications.length }),
    [offers.length, applications.length]
  );

  // ✅ headerActions mémoïsé
  const headerActions = useMemo(
    () => (
      <>
        <NotificationBell apiPrefix="student" />
        <IconButton variant="text" color="blue-gray">
          <ChatBubbleLeftIcon className="w-5 h-5" />
        </IconButton>
        <IconButton variant="text" color="blue-gray">
          <UserCircleIcon className="w-5 h-5" />
        </IconButton>
      </>
    ),
    []
  );

  // ─── Slices mémoïsés (évite slice() à chaque render) ─────────────────────
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Offres récentes */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100"
          >
            <Typography variant="h6" color="blue-gray" className="font-bold">
              Offres récentes
            </Typography>
            <Link to="/student/offers">
              <Typography variant="small" className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer">
                Voir tout
              </Typography>
            </Link>
          </CardHeader>

          <CardBody className="p-6 space-y-4">
            {topOffers.length === 0 ? (
              <Typography className="text-center text-blue-gray-500 py-4">
                Aucune offre disponible
              </Typography>
            ) : (
              topOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  applied={hasApplied(offer.id)}
                  onOpen={handleOpenDetails}
                />
              ))
            )}
          </CardBody>
        </Card>

        {/* Mes candidatures */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100"
          >
            <Typography variant="h6" color="blue-gray" className="font-bold">
              Mes candidatures
            </Typography>
            <Link to="/student/applications">
              <Typography variant="small" className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer">
                Voir tout
              </Typography>
            </Link>
          </CardHeader>

          <CardBody className="p-6 space-y-4">
            {topApplications.length === 0 ? (
              <Typography className="text-center text-blue-gray-500 py-4">
                Aucune candidature encore
              </Typography>
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
          <Typography variant="h5" className="font-bold">
            {selectedOffer?.title}
          </Typography>
          <IconButton variant="text" color="blue-gray" onClick={handleCloseModal}>
            <XMarkIcon className="w-6 h-6" />
          </IconButton>
        </DialogHeader>

        <DialogBody divider className="max-h-[70vh] overflow-y-auto">
          {selectedOffer && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  🏢 {selectedOffer.enterprise?.name || "Non spécifiée"}
                </span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  📍 {selectedOffer.location || "N/A"}
                </span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                  ⏱️ {selectedOffer.duration || "N/A"}
                </span>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                  📅 Début : {formatDate(selectedOffer.start_date)}
                </span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                  👥 {selectedOffer.available_places ? `${selectedOffer.available_places} place(s)` : "N/A"}
                </span>
                <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-medium">
                  💼 {selectedOffer.domain || "N/A"}
                </span>
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
                    <Typography className="text-blue-gray-700 leading-relaxed">
                      {selectedOffer.description || "Description non disponible"}
                    </Typography>
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
                    <Typography className="text-blue-gray-700 leading-relaxed mb-4">
                      {selectedOffer.enterprise?.description || "Information non disponible"}
                    </Typography>
                    <div className="space-y-2">
                      <Typography variant="small" className="text-blue-gray-600">
                        <strong>Email :</strong> {selectedOffer.enterprise?.email || "N/A"}
                      </Typography>
                      <Typography variant="small" className="text-blue-gray-600">
                        <strong>Téléphone :</strong> {selectedOffer.enterprise?.phone || "N/A"}
                      </Typography>
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
            {hasApplied(selectedOffer?.id)
              ? "✓ Déjà postulé"
              : loading
                ? "Envoi en cours..."
                : "✅ Postuler"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ChatBox />
    </BaseLayout>
  );
}

export default StudentDashboard;
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

  {/* Offres récentes */}
  <Card className="border border-blue-gray-100 shadow-sm">
    <CardHeader
      floated={false}
      shadow={false}
      color="transparent"
      className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100"
    >
      <Typography variant="h6" color="blue-gray" className="font-bold">
        Offres récentes
      </Typography>
      <Link to="/student/offers">
        <Typography variant="small" className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer">
          Voir tout
        </Typography>
      </Link>
    </CardHeader>

    <CardBody className="p-6 space-y-4">
      {topOffers.length === 0 ? (
        <Typography className="text-center text-blue-gray-500 py-4">
          Aucune offre disponible
        </Typography>
      ) : (
        topOffers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            applied={hasApplied(offer.id)}
            onOpen={handleOpenDetails}
          />
        ))
      )}
    </CardBody>
  </Card>

  {/* Mes candidatures */}
  <Card className="border border-blue-gray-100 shadow-sm">
    <CardHeader
      floated={false}
      shadow={false}
      color="transparent"
      className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100"
    >
      <Typography variant="h6" color="blue-gray" className="font-bold">
        Mes candidatures
      </Typography>
      <Link to="/student/applications">
        <Typography variant="small" className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer">
          Voir tout
        </Typography>
      </Link>
    </CardHeader>

    <CardBody className="p-6 space-y-4">
      {topApplications.length === 0 ? (
        <Typography className="text-center text-blue-gray-500 py-4">
          Aucune candidature encore
        </Typography>
      ) : (
        topApplications.map((app) => (
          <ApplicationCard key={app.id} app={app} />
        ))
      )}
    </CardBody>
  </Card>
</div>

{/* Modal Détails Offre */ }
      <Dialog open={openModal} handler={handleCloseModal} size="lg">
        <DialogHeader className="flex justify-between items-center">
          <Typography variant="h5" className="font-bold">
            {selectedOffer?.title}
          </Typography>
          <IconButton variant="text" color="blue-gray" onClick={handleCloseModal}>
            <XMarkIcon className="w-6 h-6" />
          </IconButton>
        </DialogHeader>

        <DialogBody divider className="max-h-[70vh] overflow-y-auto">
          {selectedOffer && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  🏢 {selectedOffer.enterprise?.name || "Non spécifiée"}
                </span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  📍 {selectedOffer.location || "N/A"}
                </span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                  ⏱️ {selectedOffer.duration || "N/A"}
                </span>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                  📅 Début : {formatDate(selectedOffer.start_date)}
                </span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                  👥 {selectedOffer.available_places ? `${selectedOffer.available_places} place(s)` : "N/A"}
                </span>
                <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-medium">
                  💼 {selectedOffer.domain || "N/A"}
                </span>
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
                    <Typography className="text-blue-gray-700 leading-relaxed">
                      {selectedOffer.description || "Description non disponible"}
                    </Typography>
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
                    <Typography className="text-blue-gray-700 leading-relaxed mb-4">
                      {selectedOffer.enterprise?.description || "Information non disponible"}
                    </Typography>
                    <div className="space-y-2">
                      <Typography variant="small" className="text-blue-gray-600">
                        <strong>Email :</strong> {selectedOffer.enterprise?.email || "N/A"}
                      </Typography>
                      <Typography variant="small" className="text-blue-gray-600">
                        <strong>Téléphone :</strong> {selectedOffer.enterprise?.phone || "N/A"}
                      </Typography>
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
            {hasApplied(selectedOffer?.id)
              ? "✓ Déjà postulé"
              : loading
              ? "Envoi en cours..."
              : "✅ Postuler"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ChatBox />
    </BaseLayout >
  );
}

export default StudentDashboard;