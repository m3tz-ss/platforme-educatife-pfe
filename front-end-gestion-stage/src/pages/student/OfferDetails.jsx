import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  Button,
  IconButton,
  Progress,
  Tabs,
  TabsHeader,
  Tab,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  BookmarkIcon,
  ShareIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";

export function OfferDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchOfferDetails();
  }, [id]);

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/public/offers/${id}`);
      setOffer(res.data);
    } catch (err) {
      console.error("Erreur lors du chargement de l'offre:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Typography>Chargement...</Typography>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <Typography className="mb-4">Offre non trouvée</Typography>
          <Link to="/student">
            <Button color="blue">Retour au tableau de bord</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Retour
          </button>

          <Typography variant="h5" className="font-bold text-blue-gray-900">
            Détails de l'offre
          </Typography>

          <div className="flex gap-2">
            <IconButton
              variant="text"
              color="blue-gray"
              onClick={() => setIsSaved(!isSaved)}
            >
              <BookmarkIcon
                className={`w-5 h-5 ${
                  isSaved ? "fill-red-500 text-red-500" : "text-blue-gray-600"
                }`}
              />
            </IconButton>
            <IconButton variant="text" color="blue-gray">
              <ShareIcon className="w-5 h-5" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Card */}
            <Card className="overflow-hidden shadow-sm border border-blue-gray-100">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32 flex items-center justify-center">
                {offer.enterprise?.logo ? (
                  <img
                    src={offer.enterprise.logo}
                    alt={offer.enterprise.name}
                    className="h-20 w-20 rounded-lg"
                  />
                ) : (
                  <BriefcaseIcon className="w-16 h-16 text-white" />
                )}
              </div>

              <CardBody className="pt-6">
                <Typography variant="h4" className="mb-2 font-bold">
                  {offer.title}
                </Typography>

                <Typography className="text-blue-500 font-medium mb-4">
                  {offer.enterprise?.name}
                </Typography>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    📍 {offer.location || "Non spécifié"}
                  </span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    ⏱️ {offer.duration || "Durée non spécifiée"}
                  </span>
                  {offer.salary && (
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                      💰 {offer.salary}
                    </span>
                  )}
                </div>

                {/* Onglets */}
                <Tabs value={activeTab} className="mt-8">
                  <TabsHeader>
                    <Tab
                      value="description"
                      onClick={() => setActiveTab("description")}
                      className="cursor-pointer"
                    >
                      Description
                    </Tab>
                    <Tab
                      value="requirements"
                      onClick={() => setActiveTab("requirements")}
                      className="cursor-pointer"
                    >
                      Exigences
                    </Tab>
                    <Tab
                      value="company"
                      onClick={() => setActiveTab("company")}
                      className="cursor-pointer"
                    >
                      Entreprise
                    </Tab>
                  </TabsHeader>
                </Tabs>

                {/* Contenu des onglets */}
                <div className="mt-6">
                  {activeTab === "description" && (
                    <div>
                      <Typography variant="h6" className="mb-3 font-semibold">
                        À propos de cette offre
                      </Typography>
                      <Typography className="text-blue-gray-700 leading-relaxed">
                        {offer.description || "Description non disponible"}
                      </Typography>
                    </div>
                  )}

                  {activeTab === "requirements" && (
                    <div>
                      <Typography variant="h6" className="mb-3 font-semibold">
                        Compétences requises
                      </Typography>
                      <ul className="space-y-2">
                        {offer.requirements ? (
                          offer.requirements.split(",").map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
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

                  {activeTab === "company" && (
                    <div>
                      <Typography variant="h6" className="mb-3 font-semibold">
                        À propos de l'entreprise
                      </Typography>
                      <Typography className="text-blue-gray-700 leading-relaxed">
                        {offer.enterprise?.description ||
                          "Information sur l'entreprise non disponible"}
                      </Typography>
                      <div className="mt-4 space-y-2">
                        <Typography className="text-sm text-blue-gray-600">
                          <strong>Secteur:</strong> {offer.enterprise?.sector || "N/A"}
                        </Typography>
                        <Typography className="text-sm text-blue-gray-600">
                          <strong>Email:</strong> {offer.enterprise?.email || "N/A"}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Card d'action */}
            <Card className="shadow-sm border border-blue-gray-100">
              <CardBody className="space-y-4">
                <Button fullWidth color="blue" variant="gradient" size="lg">
                  ✉️ Postuler maintenant
                </Button>
                <Button
                  fullWidth
                  color="blue"
                  variant="outlined"
                  size="lg"
                  onClick={() => setIsSaved(!isSaved)}
                >
                  {isSaved ? "❌ Retirer" : "❤️ Sauvegarder"}
                </Button>
              </CardBody>
            </Card>

            {/* Informations */}
            <Card className="shadow-sm border border-blue-gray-100">
              <CardBody className="space-y-4">
                <Typography variant="h6" className="font-semibold">
                  Informations
                </Typography>

                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-5 h-5 text-blue-500" />
                  <div>
                    <Typography variant="small" className="text-blue-gray-500">
                      Localisation
                    </Typography>
                    <Typography className="font-medium">
                      {offer.location || "N/A"}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-blue-500" />
                  <div>
                    <Typography variant="small" className="text-blue-gray-500">
                      Durée
                    </Typography>
                    <Typography className="font-medium">
                      {offer.duration || "N/A"}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <BriefcaseIcon className="w-5 h-5 text-blue-500" />
                  <div>
                    <Typography variant="small" className="text-blue-gray-500">
                      Type
                    </Typography>
                    <Typography className="font-medium">
                      {offer.type || "Stage"}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <UserGroupIcon className="w-5 h-5 text-blue-500" />
                  <div>
                    <Typography variant="small" className="text-blue-gray-500">
                      Candidats
                    </Typography>
                    <Typography className="font-medium">
                      {offer.applicants_count || 0}
                    </Typography>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Progression de l'application */}
            <Card className="shadow-sm border border-blue-gray-100">
              <CardBody className="space-y-3">
                <Typography variant="small" className="text-blue-gray-500">
                  Taux de correspondance
                </Typography>
                <Progress value={75} color="blue" className="h-2" />
                <Typography className="text-xs text-blue-gray-600">
                  Vous correspondez à 75% des critères
                </Typography>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OfferDetails;