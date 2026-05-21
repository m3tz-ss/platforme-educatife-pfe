import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Typography,
  Card,
  CardBody,
  Button,
  IconButton,
  Tooltip,
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
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  BookmarkIcon as BookmarkOutline,
  TrashIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon as CheckCircleOutline,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid, CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";
import BaseLayout from "../../components/layout/BaseLayout";
import { StudentSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getStudentMenuItems } from "../../config/sidebarConfig";
import Swal from "sweetalert2";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
};

export default function SavedOffersPage() {
  const [savedOffers, setSavedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [cvFile, setCvFile] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applications, setApplications] = useState([]);
  const navigate = useNavigate();

  const fetchSavedOffers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/student/saved-offers");
      setSavedOffers(res.data.data || []);
    } catch (err) {
      console.error("Erreur chargement favoris:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await api.get("/user/profile");
      setUserData(res.data);
    } catch (err) {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      setUserData(stored);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await api.get("/my-applications");
      setApplications(res.data.data || res.data || []);
    } catch (err) {
      console.error("Erreur chargement candidatures", err);
    }
  }, []);

  useEffect(() => {
    fetchSavedOffers();
    fetchUserData();
    fetchApplications();
  }, [fetchSavedOffers, fetchUserData, fetchApplications]);

  const toggleSave = async (offerId, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/student/saved-offers/${offerId}/toggle`);
      if (!res.data.saved) {
        setSavedOffers(prev => prev.filter(o => o.id !== offerId));
        Swal.fire({
          icon: "success",
          title: "Retiré",
          text: "L'offre a été retirée de vos favoris",
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de modifier les favoris"
      });
    }
  };

  const handleOpenDetails = (offer) => {
    setSelectedOffer(offer);
    setOpenModal(true);
    setActiveTab("description");
    setCvFile(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedOffer(null);
    setCvFile(null);
  };

  const hasApplied = (offerId) => {
    return applications.some(app => app.offer_id === offerId || app.offer?.id === offerId);
  };

  const applyToOffer = async (offerId) => {
    if (!cvFile) {
      Swal.fire({ icon: "warning", title: "CV requis", text: "Veuillez ajouter votre CV." });
      return;
    }

    const result = await Swal.fire({
      title: "Confirmer ?",
      text: "Voulez-vous postuler à cette offre ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui",
      cancelButtonText: "Non"
    });

    if (!result.isConfirmed) return;

    try {
      setIsApplying(true);
      const formData = new FormData();
      formData.append("offer_id", offerId);
      formData.append("cv", cvFile);
      await api.post("/applications", formData);
      Swal.fire({ icon: "success", title: "Envoyé !", timer: 1500 });
      handleCloseModal();
      fetchApplications();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: err.response?.data?.message || "Erreur" });
    } finally {
      setIsApplying(false);
    }
  };

  const menuItems = getStudentMenuItems({ offers: savedOffers.length });

  return (
    <BaseLayout
      title="Offres Sauvegardées"
      menuItems={menuItems}
      sidebarHeader={
        <StudentSidebarHeader
          name={userData?.name}
          email={userData?.email}
          photoUrl={userData?.photo_url}
        />
      }
    >
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Typography variant="h3" className="font-bold text-blue-gray-900 flex items-center gap-3">
              <BookmarkSolid className="w-8 h-8 text-blue-500" />
              Mes Favoris
            </Typography>
            <Typography className="text-blue-gray-500 mt-1">
              Retrouvez ici toutes les offres que vous avez sauvegardées.
            </Typography>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse h-64 bg-gray-100" />
            ))}
          </div>
        ) : savedOffers.length === 0 ? (
          <Card className="p-12 text-center bg-blue-50/50 border-dashed border-2 border-blue-100">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <BookmarkOutline className="w-10 h-10 text-blue-400" />
              </div>
              <Typography variant="h5" className="text-blue-gray-800 font-bold mb-2">
                Aucun favori pour le moment
              </Typography>
              <Typography className="text-blue-gray-500 max-w-sm mx-auto mb-6">
                Parcourez le catalogue des offres et cliquez sur l'icône de sauvegarde pour les retrouver ici.
              </Typography>
              <Link to="/student/offers">
                <Button color="blue" variant="gradient">
                  Parcourir les offres
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savedOffers.map((offer) => {
              const companyInitial = offer.enterprise?.name?.charAt(0)?.toUpperCase() || "?";
              return (
                <Card
                  key={offer.id}
                  className="hover:shadow-xl transition-all duration-300 group cursor-pointer border border-blue-gray-50 overflow-hidden"
                  onClick={() => handleOpenDetails(offer)}
                >
                  <CardBody className="p-0">
                    {/* Top Banner with Logo */}
                    <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 p-4 relative">
                      <div className="absolute -bottom-6 left-6 w-16 h-16 bg-white rounded-xl shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
                        {offer.enterprise?.logo_url ? (
                          <img src={offer.enterprise.logo_url} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-2xl font-bold text-blue-700">{companyInitial}</span>
                        )}
                      </div>
                      <div className="absolute top-4 right-4">
                        <IconButton
                          size="sm"
                          color="white"
                          variant="text"
                          className="bg-white/20 hover:bg-white/40 text-white rounded-full"
                          onClick={(e) => toggleSave(offer.id, e)}
                        >
                          <BookmarkSolid className="w-5 h-5" />
                        </IconButton>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-10 p-6">
                      <Typography variant="h6" className="text-blue-gray-900 font-bold mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {offer.title}
                      </Typography>
                      <Typography variant="small" className="text-blue-500 font-bold mb-4">
                        {offer.enterprise?.name || "Entreprise"}
                      </Typography>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-3 text-sm text-blue-gray-600">
                          <MapPinIcon className="w-4 h-4 text-red-400" />
                          <span>{offer.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-blue-gray-600">
                          <ClockIcon className="w-4 h-4 text-purple-400" />
                          <span>{offer.duration}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-blue-gray-600">
                          <CalendarIcon className="w-4 h-4 text-green-400" />
                          <span>Dès le {formatDate(offer.start_date)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-blue-gray-50">
                        <Button
                          size="sm"
                          variant="text"
                          color="red"
                          className="flex items-center gap-2 hover:bg-red-50"
                          onClick={(e) => toggleSave(offer.id, e)}
                        >
                          <TrashIcon className="w-4 h-4" />
                          Supprimer
                        </Button>
                        <Button
                          size="sm"
                          color="blue"
                          variant="outlined"
                          className="rounded-lg"
                        >
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      {/* Modal Détails */}
      <Dialog open={openModal} handler={handleCloseModal} size="lg">
        <DialogHeader className="flex flex-col p-0 overflow-hidden rounded-t-xl">
          <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 p-6 relative min-h-[120px] flex flex-col justify-end">
            <div className="absolute top-4 right-4">
              <IconButton variant="text" color="white" onClick={handleCloseModal} className="rounded-full bg-white/10 hover:bg-white/20">
                <XMarkIcon className="w-5 h-5" />
              </IconButton>
            </div>

            {selectedOffer?.enterprise?.logo_url && (
              <div className="absolute -bottom-6 right-8 w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-xl border-4 border-white flex items-center justify-center p-2 z-10">
                <img src={selectedOffer.enterprise.logo_url} alt="Logo" className="w-full h-full object-contain" />
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
              </div>

              <Tabs value={activeTab} className="w-full">
                <TabsHeader className="mx-6">
                  <Tab value="description" onClick={() => setActiveTab("description")} className="font-bold text-xs">Description</Tab>
                  <Tab value="requirements" onClick={() => setActiveTab("requirements")} className="font-bold text-xs">Exigences</Tab>
                  <Tab value="company" onClick={() => setActiveTab("company")} className="font-bold text-xs">Entreprise</Tab>
                </TabsHeader>
              </Tabs>

              <div className="px-2">
                {activeTab === "description" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Typography variant="h6" className="mb-3 font-bold text-blue-gray-900">À propos de cette offre</Typography>
                    <Typography className="text-blue-gray-700 leading-relaxed">{selectedOffer.description || "Description non disponible"}</Typography>
                  </div>
                )}
                {activeTab === "requirements" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Typography variant="h6" className="mb-3 font-bold text-blue-gray-900">Compétences requises</Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedOffer.requirements?.split(",").map((req, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-blue-gray-50/50 p-3 rounded-xl border border-blue-gray-100">
                          <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-blue-gray-800">{req.trim()}</span>
                        </div>
                      )) || <Typography className="italic text-gray-500">Aucune exigence</Typography>}
                    </div>
                  </div>
                )}
                {activeTab === "company" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                    <Typography variant="h6" className="font-bold text-blue-gray-900">À propos de l'entreprise</Typography>
                    <Typography className="text-blue-gray-700 leading-relaxed">
                      {selectedOffer.enterprise?.company_description || selectedOffer.enterprise?.bio || "Information non disponible"}
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOffer.enterprise?.email && (
                        <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                          <div className="truncate">
                            <p className="text-[10px] uppercase font-bold text-blue-400">Email</p>
                            <p className="text-sm font-bold text-blue-900 truncate">{selectedOffer.enterprise.email}</p>
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
          <Button color="red" variant="outlined" onClick={(e) => toggleSave(selectedOffer?.id, e)} className="flex items-center gap-2">
            ❌ Retirer des favoris
          </Button>

          <div className="flex items-center gap-3 ml-auto">
            <label className="cursor-pointer flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg transition border border-gray-300">
              <span>📎</span>
              <span className="max-w-[140px] truncate">{cvFile ? cvFile.name : "Ajouter CV"}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={(e) => setCvFile(e.target.files[0])} />
            </label>
            <Button
              size="sm"
              color={hasApplied(selectedOffer?.id) ? "green" : "blue"}
              onClick={() => applyToOffer(selectedOffer?.id)}
              disabled={isApplying || hasApplied(selectedOffer?.id)}
            >
              {hasApplied(selectedOffer?.id) ? "✓ Déjà postulé" : isApplying ? "Envoi..." : "✅ Postuler"}
            </Button>
          </div>
        </DialogFooter>
      </Dialog>
    </BaseLayout>
  );
}
