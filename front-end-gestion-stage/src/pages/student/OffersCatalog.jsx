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
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  FunnelIcon,
  CalendarIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { BookmarkIcon as BookmarkOutline } from "@heroicons/react/24/outline";
import api from "../../services/api";
import BaseLayout from "../../components/layout/BaseLayout";
import { StudentSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getStudentMenuItems } from "../../config/sidebarConfig";

export default function OffersCatalog() {
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("Tous");
  const [durationFilter, setDurationFilter] = useState("Toutes");
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cvFile, setCvFile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [savedOfferIds, setSavedOfferIds] = useState(new Set());
  const itemsPerPage = 6;

  useEffect(() => {
    fetchOffers();
    fetchApplications();
    fetchUserData();
    fetchSavedOfferIds();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await api.get("/user/profile");
      setUserData(res.data);
    } catch (err) {
      console.error("Erreur chargement profil:", err);
      // Fallback au localstorage
      const saved = JSON.parse(localStorage.getItem("user") || "{}");
      setUserData(saved);
    }
  };

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

  const fetchSavedOfferIds = async () => {
    try {
      const res = await api.get("/student/saved-offers");
      const ids = new Set((res.data.data || []).map(o => o.id));
      setSavedOfferIds(ids);
    } catch (err) {
      console.error("Erreur chargement favoris:", err);
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
    setIsSaved(false);
  };

  const toggleSave = async (offerId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post(`/student/saved-offers/${offerId}/toggle`);
      const newSaved = new Set(savedOfferIds);
      if (res.data.saved) {
        newSaved.add(offerId);
        setIsSaved(true);
      } else {
        newSaved.delete(offerId);
        setIsSaved(false);
      }
      setSavedOfferIds(newSaved);
    } catch (err) {
      console.error("Erreur favoris:", err);
    }
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

  const sidebarExtra = (
    <>
      <div className="bg-blue-50 rounded-lg p-4">
        <Typography variant="small" className="text-blue-gray-600 mb-1">Votre progression</Typography>
        <Progress value={65} color="blue" className="h-2" />
        <Typography variant="caption" className="text-blue-gray-500 mt-2">65% de profil complet</Typography>
      </div>
      <Button fullWidth color="blue" variant="gradient" size="sm">✉️ Contacter support</Button>
    </>
  );

  return (
    <BaseLayout
      title="Catalogue d'Offres"
      menuItems={getStudentMenuItems({ offers: offers.length, applications: applications.length })}
      sidebarHeader={
        <StudentSidebarHeader 
          name={userData?.name} 
          email={userData?.email} 
          photoUrl={userData?.photo_url} 
        />
      }
      sidebarExtra={sidebarExtra}
      headerActions={
        <>
          <IconButton variant="text" color="blue-gray"><ChatBubbleLeftIcon className="w-5 h-5" /></IconButton>
          <IconButton variant="text" color="blue-gray"><UserCircleIcon className="w-5 h-5" /></IconButton>
        </>
      }
    >
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
                  className="group shadow-sm border border-blue-gray-100 hover:shadow-xl hover:border-blue-100 hover:bg-blue-50/10 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => handleOpenDetails(offer)}
                >
                  <CardHeader
                    floated={false}
                    shadow={false}
                    color="transparent"
                    className="m-0 p-5 flex items-start justify-between"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-blue-gray-100 flex items-center justify-center bg-white shadow-sm group-hover:shadow-md transition-shadow">
                      {offer.enterprise?.logo_url ? (
                        <img
                          src={offer.enterprise.logo_url}
                          alt={offer.enterprise?.company_name || "Logo"}
                          className="w-full h-full object-contain p-1.5"
                        />
                      ) : (
                        <span className="text-blue-700 font-bold text-xl">{initial}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <IconButton
                        size="sm"
                        color={savedOfferIds.has(offer.id) ? "blue" : "blue-gray"}
                        variant="text"
                        className="rounded-full hover:bg-blue-50"
                        onClick={(e) => toggleSave(offer.id, e)}
                      >
                        {savedOfferIds.has(offer.id) ? (
                          <BookmarkSolid className="w-5 h-5 text-blue-500" />
                        ) : (
                          <BookmarkOutline className="w-5 h-5" />
                        )}
                      </IconButton>
                      <Chip
                        value={offer.domain || "Autre"}
                        variant="ghost"
                        size="sm"
                        className={`${categoryStyle} text-[10px] font-bold uppercase px-2 rounded-lg`}
                      />
                      {applied && (
                        <Chip
                          value="✓ Postulé"
                          variant="ghost"
                          size="sm"
                          className="bg-green-100 text-green-700 text-[10px] font-bold uppercase px-2 rounded-lg"
                        />
                      )}
                      {offer.is_full && (
                        <Chip
                          value="⚠️ Complet"
                          variant="ghost"
                          size="sm"
                          className="bg-red-100 text-red-700 text-[10px] font-bold uppercase px-2 rounded-lg"
                        />
                      )}
                    </div>
                  </CardHeader>

                  <CardBody className="px-6 pb-6 pt-0 flex-1 flex flex-col">
                    <Typography variant="h6" className="font-bold text-blue-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {offer.title}
                    </Typography>
                    <Typography className="text-sm text-blue-500 font-medium mb-3">
                      {offer.enterprise?.company_name || offer.enterprise?.name || "Entreprise"}
                    </Typography>
                    <Typography className="text-sm text-blue-gray-500 mb-5 line-clamp-2 leading-relaxed italic">
                      "{offer.description}"
                    </Typography>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-6">
                      <div className="flex items-center gap-2 text-xs text-blue-gray-600 bg-white/50 px-2 py-1.5 rounded-lg border border-blue-gray-50">
                        <MapPinIcon className="w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate">{offer.location || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-gray-600 bg-white/50 px-2 py-1.5 rounded-lg border border-blue-gray-50">
                        <ClockIcon className="w-3.5 h-3.5 text-purple-400" />
                        <span className="truncate">{offer.duration || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-gray-600 bg-white/50 px-2 py-1.5 rounded-lg border border-blue-gray-50">
                        <CalendarIcon className="w-3.5 h-3.5 text-green-400" />
                        <span className="truncate">{formatDate(offer.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-gray-600 bg-white/50 px-2 py-1.5 rounded-lg border border-blue-gray-50">
                        <UsersIcon className="w-3.5 h-3.5 text-orange-400" />
                        <span className="truncate">{offer.available_places || 0} places</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                       <Typography variant="small" className="text-blue-600 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Détails <span className="text-lg">→</span>
                      </Typography>
                      <Button
                        size="sm"
                        color={applied ? "green" : offer.is_full ? "red" : "blue"}
                        variant={applied || offer.is_full ? "outlined" : "filled"}
                        className="rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetails(offer);
                        }}
                      >
                        {applied ? "✓ Déjà postulé" : offer.is_full ? "Offre Complète" : "Postuler"}
                      </Button>
                    </div>
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

      {/* Modal Détails */}
      <Dialog open={openModal} handler={handleCloseModal} size="lg">
        <DialogHeader className={`flex flex-col p-0 overflow-hidden rounded-t-xl`}>
          <div className={`w-full bg-gradient-to-r from-blue-600 to-indigo-700 p-6 relative min-h-[120px] flex flex-col justify-end`}>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <IconButton variant="text" color="white" onClick={handleCloseModal} className="rounded-full bg-white/10 hover:bg-white/20">
                <XMarkIcon className="w-5 h-5" />
              </IconButton>
            </div>
            
            {selectedOffer?.enterprise?.logo_url && (
              <div className="absolute -bottom-6 right-8 w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-xl border-4 border-white flex items-center justify-center p-2 z-10">
                <img
                  src={selectedOffer.enterprise.logo_url}
                  alt={selectedOffer.enterprise?.company_name || "Logo"}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <Typography variant="h4" className="text-white font-bold pr-24 line-clamp-2">
              {selectedOffer?.title}
            </Typography>
            <Typography variant="small" className="text-blue-100 font-medium mt-1">
              {selectedOffer?.enterprise?.company_name || selectedOffer?.enterprise?.name}
            </Typography>
          </div>
        </DialogHeader>

        <DialogBody divider className="max-h-[70vh] overflow-y-auto p-0 border-none">
          {selectedOffer && (
            <div className="p-6 space-y-6">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100">
                  📍 {selectedOffer.location || "Non spécifié"}
                </span>
                <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-100">
                  ⏱️ {selectedOffer.duration || "N/A"}
                </span>
                <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100">
                  📅 Début : {formatDate(selectedOffer.start_date)}
                </span>
                <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-100">
                  👥 {selectedOffer.available_places || 0} places
                </span>
                <span className="flex items-center gap-1.5 bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-cyan-100">
                  💼 {selectedOffer.domain || "N/A"}
                </span>
                {selectedOffer.is_full && (
                  <span className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse">
                    ⚠️ OFFRE COMPLÈTE
                  </span>
                )}
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} className="w-full">
                <TabsHeader className="mx-6">
                  <Tab value="description" onClick={() => setActiveTab("description")} className="font-bold text-xs">
                    Description
                  </Tab>
                  <Tab value="requirements" onClick={() => setActiveTab("requirements")} className="font-bold text-xs">
                    Exigences
                  </Tab>
                  <Tab value="advantages" onClick={() => setActiveTab("advantages")} className="font-bold text-xs">
                    Avantages
                  </Tab>
                  <Tab value="company" onClick={() => setActiveTab("company")} className="font-bold text-xs">
                    Entreprise
                  </Tab>
                </TabsHeader>
              </Tabs>

              {/* Tab Content */}
              <div className="px-2">
                {activeTab === "description" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Typography variant="h6" className="mb-3 font-bold text-blue-gray-900">
                      À propos de cette offre
                    </Typography>
                    <Typography className="text-blue-gray-700 leading-relaxed">
                      {selectedOffer.description || "Description non disponible"}
                    </Typography>
                  </div>
                )}

                {activeTab === "requirements" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Typography variant="h6" className="mb-3 font-bold text-blue-gray-900">
                      Compétences requises
                    </Typography>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedOffer.requirements ? (
                        selectedOffer.requirements.split(",").map((req, idx) => (
                          <li key={idx} className="flex items-center gap-3 bg-blue-gray-50/50 p-3 rounded-xl border border-blue-gray-100">
                            <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-blue-gray-800">{req.trim()}</span>
                          </li>
                        ))
                      ) : (
                        <Typography className="text-blue-gray-500 italic">
                          Aucune exigence spécifiée
                        </Typography>
                      )}
                    </ul>
                  </div>
                )}

                {activeTab === "advantages" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Typography variant="h6" className="mb-3 font-bold text-blue-gray-900">
                      Avantages
                    </Typography>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedOffer.advantages ? (
                        selectedOffer.advantages.split(",").map((adv, idx) => (
                          <li key={idx} className="flex items-center gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                            <span className="text-xl">⭐</span>
                            <span className="text-sm font-medium text-blue-gray-800">{adv.trim()}</span>
                          </li>
                        ))
                      ) : (
                        <Typography className="text-blue-gray-500 italic">
                          Aucun avantage spécifié
                        </Typography>
                      )}
                    </ul>
                  </div>
                )}

                {activeTab === "company" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                    <Typography variant="h6" className="font-bold text-blue-gray-900">
                      À propos de l'entreprise
                    </Typography>
                    <Typography className="text-blue-gray-700 leading-relaxed">
                      {selectedOffer?.enterprise?.company_description || selectedOffer?.enterprise?.bio || "Information non disponible"}
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOffer.enterprise?.email && (
                        <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-blue-400">Email</p>
                            <p className="text-sm font-bold text-blue-900">{selectedOffer.enterprise.email}</p>
                          </div>
                        </div>
                      )}
                      {selectedOffer.enterprise?.phone && (
                        <div className="flex items-center gap-3 bg-green-50 p-3 rounded-xl border border-green-100">
                          <PhoneIcon className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-green-400">Téléphone</p>
                            <p className="text-sm font-bold text-green-900">{selectedOffer.enterprise.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-3">
          <Button
            color={savedOfferIds.has(selectedOffer?.id) ? "red" : "blue"}
            variant="outlined"
            onClick={(e) => toggleSave(selectedOffer?.id, e)}
            className="flex items-center gap-2"
          >
            {savedOfferIds.has(selectedOffer?.id) ? "❌ Retirer" : "❤️ Sauvegarder"}
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
              color={hasApplied(selectedOffer?.id) ? "green" : selectedOffer?.is_full ? "red" : "blue"}
              onClick={() => applyToOffer(selectedOffer?.id)}
              disabled={loading || hasApplied(selectedOffer?.id) || selectedOffer?.is_full}
            >
              {hasApplied(selectedOffer?.id)
                ? "✓ Déjà postulé"
                : selectedOffer?.is_full
                  ? "Désolé, quota atteint"
                  : loading
                    ? "Envoi en cours..."
                    : "✅ Postuler"}
            </Button>

          </div>
        </DialogFooter>
      </Dialog>
    </BaseLayout>
  );
}