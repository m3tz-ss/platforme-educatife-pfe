import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Swal from 'sweetalert2';
import {
  Input,
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
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
  HomeIcon,
  BriefcaseIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  ClockIcon,
  FunnelIcon,
  CalendarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";

export default function OffersCatalog() {
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("Tous");
  const [durationFilter, setDurationFilter] = useState("Toutes");
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cvFile, setCvFile] = useState(null);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchOffers();
    fetchApplications();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await api.get("/public/offers");
      // Handle both paginated { data: [...] } and plain array responses
      setOffers(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des offres:", err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get("/my-applications");
      setApplications(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Erreur chargement candidatures", err);
    }
  };

  // Format date helper
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

  // Check if already applied
  const hasApplied = (offerId) => {
    return applications.some(
      (app) => app.offer_id === offerId || app.offer?.id === offerId
    );
  };

  // Filtered offers
  const filteredOffers = offers.filter((offer) => {
    const matchSearch =
      offer.title?.toLowerCase().includes(search.toLowerCase()) ||
      offer.description?.toLowerCase().includes(search.toLowerCase()) ||
      offer.enterprise?.name?.toLowerCase().includes(search.toLowerCase());

    const matchLocation =
      locationFilter === "Tous" ||
      offer.location?.toLowerCase().includes(locationFilter.toLowerCase());

    const matchDuration =
      durationFilter === "Toutes" ||
      offer.duration?.toLowerCase().includes(durationFilter.toLowerCase());

    const matchCategory =
      categoryFilter === "Tous" ||
      offer.domain?.toLowerCase().includes(categoryFilter.toLowerCase());

    return matchSearch && matchLocation && matchDuration && matchCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOffers = filteredOffers.slice(startIndex, startIndex + itemsPerPage);

  const handleOpenDetails = (offer) => {
    setSelectedOffer(offer);
    setOpenModal(true);
    setActiveTab("description");
    setIsSaved(false);
    setCvFile(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedOffer(null);
    setCvFile(null);
  };

  const applyToOffer = async (offerId) => {
    if (!cvFile) {
      Swal.fire({
        icon: "warning",
        title: "CV requis",
        text: "Veuillez ajouter votre CV avant de postuler.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

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
    const formData = new FormData();
    formData.append("offer_id", offerId);
    formData.append("cv", cvFile);

    // ✅ Supprimer le header Content-Type — Axios le gère seul
    await api.post("/applications", formData);

      await Swal.fire({
        icon: "success",
        title: "Candidature envoyée !",
        text: "Votre CV a été envoyé avec succès.",
        confirmButtonText: "Super !",
        confirmButtonColor: "#22c55e",
        timer: 3000,
        timerProgressBar: true,
      });

      setCvFile(null);
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
          text: err.response?.data?.message || "Erreur lors de l'envoi de la candidature.",
          confirmButtonColor: "#ef4444",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const getColorByLetter = (letter) => {
    const colors = {
      A: "bg-orange-100 text-orange-700",
      B: "bg-blue-100 text-blue-700",
      C: "bg-purple-100 text-purple-700",
      D: "bg-green-100 text-green-700",
      E: "bg-red-100 text-red-700",
      T: "bg-blue-100 text-blue-700",
      default: "bg-gray-100 text-gray-700",
    };
    return colors[letter] || colors.default;
  };

  const getCategoryStyle = (domain) => {
    const map = {
      informatique: "bg-cyan-100 text-cyan-700",
      data: "bg-violet-100 text-violet-700",
      design: "bg-pink-100 text-pink-700",
      marketing: "bg-yellow-100 text-yellow-700",
      finance: "bg-emerald-100 text-emerald-700",
      "ressources humaines": "bg-orange-100 text-orange-700",
      ingénierie: "bg-blue-100 text-blue-700",
    };
    const key = domain?.toLowerCase() || "";
    for (const [k, v] of Object.entries(map)) {
      if (key.includes(k)) return v;
    }
    return "bg-gray-100 text-gray-700";
  };

  const menuItems = [
    { icon: HomeIcon, label: "Tableau de bord", path: "/student", badge: null },
    { icon: BriefcaseIcon, label: "Offres de stage", path: "/student/offers", badge: offers.length },
    { icon: CheckCircleIcon, label: "Mes candidatures", path: "/student/applications", badge: applications.length },
    { icon: BookmarkIcon, label: "Offres sauvegardées", path: "/student/saved", badge: null },
    { icon: ChatBubbleLeftIcon, label: "Messages", path: "/student/messages", badge: 3 },
    { icon: UserCircleIcon, label: "Mon profil", path: "/student/profile", badge: null },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-blue-gray-100">
          <Typography variant="h5" className="font-bold text-blue-500">
            🎓 MyStage
          </Typography>
          <Typography variant="small" className="text-blue-gray-500">
            Plateforme de stages
          </Typography>
        </div>

        <nav className="p-6 space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer">
                  <Icon className="w-5 h-5 text-blue-gray-600 group-hover:text-blue-500" />
                  <span className="text-sm font-medium text-blue-gray-700 group-hover:text-blue-600">
                    {item.label}
                  </span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mx-6 border-t border-blue-gray-100"></div>

        <div className="p-6 space-y-4">
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
        </div>

        <div className="p-6 border-t border-blue-gray-100">
          <Link to="/auth/sign-in">
            <Button
              fullWidth
              color="red"
              variant="outlined"
              size="sm"
              className="flex items-center justify-center gap-2"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Déconnexion
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-blue-gray-100">
          <div className="px-6 py-4 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-blue-gray-50 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <XMarkIcon className="w-6 h-6 text-blue-gray-600" />
              ) : (
                <Bars3Icon className="w-6 h-6 text-blue-gray-600" />
              )}
            </button>
            <Typography variant="h5" className="font-bold text-blue-gray-900">
              Catalogue d'Offres
            </Typography>
            <div className="flex gap-3">
              <IconButton variant="text" color="blue-gray">
                <ChatBubbleLeftIcon className="w-5 h-5" />
              </IconButton>
              <IconButton variant="text" color="blue-gray">
                <UserCircleIcon className="w-5 h-5" />
              </IconButton>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="mb-8">
              <Typography variant="h4" className="font-bold text-blue-gray-900 mb-2">
                Rechercher des stages
              </Typography>
              <Typography variant="small" className="text-blue-500 font-medium">
                {filteredOffers.length} offre{filteredOffers.length > 1 ? "s" : ""} trouvée
                {filteredOffers.length > 1 ? "s" : ""}
              </Typography>
            </div>

            {/* Filters */}
            <Card className="mb-8 shadow-sm border border-blue-gray-100">
              <CardBody className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <Input
                    placeholder="Rechercher par titre ou entreprise..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                    className="!border-blue-gray-200"
                  />
                  <Menu placement="bottom-start">
                    <MenuHandler>
                      <Button variant="outlined" className="flex items-center justify-between" fullWidth>
                        <MapPinIcon className="w-5 h-5" />
                        <span>{locationFilter}</span>
                      </Button>
                    </MenuHandler>
                    <MenuList>
                      {["Tous", "Tunis", "Ariana", "Sfax", "Sousse", "Autre"].map((loc) => (
                        <MenuItem key={loc} onClick={() => { setLocationFilter(loc); setCurrentPage(1); }}>
                          {loc}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                  <Menu placement="bottom-start">
                    <MenuHandler>
                      <Button variant="outlined" className="flex items-center justify-between" fullWidth>
                        <ClockIcon className="w-5 h-5" />
                        <span>{durationFilter}</span>
                      </Button>
                    </MenuHandler>
                    <MenuList>
                      {["Toutes", "1 mois", "2 mois", "3 mois", "4 mois", "6 mois"].map((dur) => (
                        <MenuItem key={dur} onClick={() => { setDurationFilter(dur); setCurrentPage(1); }}>
                          {dur}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                  <Menu placement="bottom-start">
                    <MenuHandler>
                      <Button variant="outlined" className="flex items-center justify-between" fullWidth>
                        <FunnelIcon className="w-5 h-5" />
                        <span>{categoryFilter}</span>
                      </Button>
                    </MenuHandler>
                    <MenuList>
                      {["Tous", "Informatique", "Data", "Design", "Marketing", "Finance", "Ingénierie"].map((cat) => (
                        <MenuItem key={cat} onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}>
                          {cat}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                </div>
              </CardBody>
            </Card>

            {/* Offers Grid */}
            {paginatedOffers.length === 0 ? (
              <div className="text-center py-12">
                <Typography className="text-blue-gray-500 mb-4">
                  Aucune offre trouvée avec vos critères de recherche.
                </Typography>
                <Button
                  color="blue"
                  variant="outlined"
                  onClick={() => {
                    setSearch("");
                    setLocationFilter("Tous");
                    setDurationFilter("Toutes");
                    setCategoryFilter("Tous");
                    setCurrentPage(1);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {paginatedOffers.map((offer) => {
                    const initial = getInitial(offer.enterprise?.name);
                    const colorClass = getColorByLetter(initial);
                    const categoryStyle = getCategoryStyle(offer.domain);
                    const applied = hasApplied(offer.id);

                    return (
                      <Card
                        key={offer.id}
                        className="shadow-sm border border-blue-gray-100 hover:shadow-lg transition overflow-hidden flex flex-col"
                      >
                        <CardHeader
                          floated={false}
                          shadow={false}
                          color="transparent"
                          className="m-0 p-6 flex items-start justify-between"
                        >
                          <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center font-bold text-lg`}>
                            {initial}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Chip
                              value={offer.domain || "Autre"}
                              variant="ghost"
                              size="sm"
                              className={`${categoryStyle} text-xs`}
                            />
                            {applied && (
                              <Chip
                                value="✓ Postulé"
                                variant="ghost"
                                size="sm"
                                className="bg-green-100 text-green-700 text-xs"
                              />
                            )}
                          </div>
                        </CardHeader>

                        <CardBody className="p-6 flex-1 flex flex-col">
                          <Typography variant="h6" className="font-bold text-blue-gray-900 mb-1">
                            {offer.title}
                          </Typography>
                          <Typography className="text-sm text-blue-500 font-medium mb-3">
{offer.enterprise?.company_name || offer.enterprise?.name || "Entreprise"}
                          </Typography>
                          <Typography className="text-sm text-blue-gray-600 mb-4 line-clamp-2 flex-1">
                            {offer.description}
                          </Typography>

                          {/* ✅ Tous les champs en snake_case */}
                          <div className="space-y-2 mb-4 text-sm text-blue-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="w-4 h-4 text-blue-400" />
                              <span>{offer.location || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ClockIcon className="w-4 h-4 text-blue-400" />
                              <span>{offer.duration || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-blue-400" />
                              <span>Début : {formatDate(offer.start_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <UsersIcon className="w-4 h-4 text-blue-400" />
                              <span>
                                {offer.available_places
                                  ? `${offer.available_places} place(s) disponible(s)`
                                  : "Places N/A"}
                              </span>
                            </div>
                          </div>

                          <Button
                            color={applied ? "green" : "blue"}
                            fullWidth
                            onClick={() => handleOpenDetails(offer)}
                            className="mt-auto"
                            variant={applied ? "outlined" : "filled"}
                          >
                            {applied ? "✓ Déjà postulé" : "Voir & Postuler"}
                          </Button>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <IconButton
                      variant="outlined"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      ←
                    </IconButton>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "filled" : "outlined"}
                        color={currentPage === page ? "blue" : "blue-gray"}
                        onClick={() => setCurrentPage(page)}
                        className="w-10 h-10 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                    <IconButton
                      variant="outlined"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      →
                    </IconButton>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal Détails */}
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
              {/* ✅ Tous les badges avec snake_case */}
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  🏢 {selectedOffer.enterprise?.company_name || selectedOffer.enterprise?.name || "Non spécifiée"}
                </span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  📍 {selectedOffer.location || "Non spécifié"}
                </span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                  ⏱️ {selectedOffer.duration || "N/A"}
                </span>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                  📅 Début : {formatDate(selectedOffer.start_date)}
                </span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                  👥 {selectedOffer.available_places
                    ? `${selectedOffer.available_places} place(s)`
                    : "Places N/A"}
                </span>
                <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-medium">
                  💼 {selectedOffer.domain || "N/A"}
                </span>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab}>
                <TabsHeader>
                  <Tab value="description" onClick={() => setActiveTab("description")} className="cursor-pointer">
                    Description
                  </Tab>
                  <Tab value="requirements" onClick={() => setActiveTab("requirements")} className="cursor-pointer">
                    Exigences
                  </Tab>
                  <Tab value="advantages" onClick={() => setActiveTab("advantages")} className="cursor-pointer">
                    Avantages
                  </Tab>
                  <Tab value="company" onClick={() => setActiveTab("company")} className="cursor-pointer">
                    Entreprise
                  </Tab>
                </TabsHeader>
              </Tabs>

              {/* Tab Content */}
              <div>
                {activeTab === "description" && (
                  <div>
                    <Typography variant="h6" className="mb-3 font-semibold">
                      À propos de cette offre
                    </Typography>
                    <Typography className="text-blue-gray-700 leading-relaxed">
                      {selectedOffer.description || "Description non disponible"}
                    </Typography>
                  </div>
                )}

                {activeTab === "requirements" && (
                  <div>
                    <Typography variant="h6" className="mb-3 font-semibold">
                      Compétences requises
                    </Typography>
                    <ul className="space-y-2">
                      {selectedOffer.requirements ? (
                        selectedOffer.requirements.split(",").map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-blue-gray-700">{req.trim()}</span>
                          </li>
                        ))
                      ) : (
                        <Typography className="text-blue-gray-500">
                          Aucune exigence spécifiée
                        </Typography>
                      )}
                    </ul>
                  </div>
                )}

                {activeTab === "advantages" && (
                  <div>
                    <Typography variant="h6" className="mb-3 font-semibold">
                      Avantages
                    </Typography>
                    <ul className="space-y-2">
                      {selectedOffer.advantages ? (
                        selectedOffer.advantages.split(",").map((adv, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">⭐</span>
                            <span className="text-blue-gray-700">{adv.trim()}</span>
                          </li>
                        ))
                      ) : (
                        <Typography className="text-blue-gray-500">
                          Aucun avantage spécifié
                        </Typography>
                      )}
                    </ul>
                  </div>
                )}

                {activeTab === "company" && (
                  <div>
                    <Typography variant="h6" className="mb-3 font-semibold">
                      À propos de l'entreprise
                    </Typography>
                    <Typography className="text-blue-gray-700 leading-relaxed mb-4">
                      {selectedOffer.enterprise?.company_description || selectedOffer.enterprise?.bio || "Information non disponible"}
                    </Typography>
                    <div className="space-y-2">
                      <Typography className="text-sm text-blue-gray-600">
                        <strong>Email :</strong>{" "}
                        {selectedOffer.enterprise?.email || "N/A"}
                      </Typography>
                      <Typography className="text-sm text-blue-gray-600">
                        <strong>Téléphone :</strong>{" "}
                        {selectedOffer.enterprise?.phone || "N/A"}
                      </Typography>
                      <Typography className="text-sm text-blue-gray-600">
                        <strong>Secteur :</strong>{" "}
                        {selectedOffer.enterprise?.sector || "N/A"}
                      </Typography>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-3">
          <Button
            color="blue"
            variant="outlined"
            onClick={() => setIsSaved(!isSaved)}
            className="flex items-center gap-2"
          >
            {isSaved ? "❌ Retirer" : "❤️ Sauvegarder"}
          </Button>

          <div className="flex items-center gap-3 ml-auto">
            {/* Upload CV */}
            <label className="cursor-pointer flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg transition border border-gray-300">
              <span>📎</span>
              <span className="max-w-[140px] truncate">
                {cvFile ? cvFile.name : "Ajouter CV (PDF)"}
              </span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setCvFile(e.target.files[0])}
              />
            </label>
            {cvFile && (
              <button
                onClick={() => setCvFile(null)}
                className="text-red-400 hover:text-red-600 text-lg font-bold"
                title="Supprimer le CV"
              >
                ✕
              </button>
            )}

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
          </div>
        </DialogFooter>
      </Dialog>
    </div>
  );
}