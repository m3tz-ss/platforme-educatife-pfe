import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Typography,
  Card,
  CardHeader,
  CardBody,
  Input,
  Textarea,
  Select,
  Option,
  IconButton,
  Progress,
} from "@material-tailwind/react";
import {
  HomeIcon,
  BriefcaseIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  UsersIcon,
  DocumentTextIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";
import Swal from "sweetalert2";

export default function PublishOffer() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    domain: "",
    location: "",
    duration: "",
    startDate: "",
    availablePlaces: "",
    description: "",
    requirements: "",
    advantages: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      title: "", domain: "", location: "", duration: "",
      startDate: "", availablePlaces: "", description: "",
      requirements: "", advantages: "",
    });
  };

  // ✅ Calcul progression formulaire
  const filledFields = Object.values(formData).filter((v) => v !== "").length;
  const progressPct = Math.round((filledFields / Object.keys(formData).length) * 100);

  // ✅ handleSubmit — toutes les validations DANS la fonction
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.domain || !formData.location || !formData.duration) {
      Swal.fire({
        icon: "warning",
        title: "Champs manquants",
        text: "Veuillez remplir les champs : Titre, Catégorie, Lieu et Durée.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (!formData.startDate || !formData.availablePlaces) {
      Swal.fire({
        icon: "warning",
        title: "Champs manquants",
        text: "La date de début et les places disponibles sont obligatoires.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (!formData.description || !formData.requirements) {
      Swal.fire({
        icon: "warning",
        title: "Champs manquants",
        text: "La description et les prérequis sont obligatoires.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post("/offers", {
        ...formData,
        availablePlaces: Number(formData.availablePlaces),
      });

      await Swal.fire({
        icon: "success",
        title: "Offre publiée !",
        text: "Votre offre de stage a été publiée avec succès.",
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "Voir mes offres",
        timer: 3000,
        timerProgressBar: true,
      });

      handleReset();
      navigate("/enterprise/offersliste");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erreur de publication",
        text: err.response?.data?.message || "Une erreur est survenue.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = ["Informatique", "Finance", "Marketing", "Ressources Humaines", "Ventes", "Design", "Ingénierie", "Data Science", "Autre"];
  const durations  = ["1 mois", "2 mois", "3 mois", "4 mois", "5 mois", "6 mois"];
  const locations  = ["Tunis", "Ariana", "Ben Arous", "Manouba", "Sfax", "Sousse", "Kairouan", "Gabès", "Gafsa", "Autre"];

  const menuItems = [
    { icon: HomeIcon,           label: "Tableau de bord",  path: "/enterprise/offers",           badge: null },
    { icon: HomeIcon,           label: "Publier une offre", path: "/enterprise/publish",          badge: null },
    { icon: BriefcaseIcon,      label: "Mes offres",        path: "/enterprise/offersliste",      badge: null },
    { icon: CheckCircleIcon,    label: "Candidatures",      path: "/enterprise/condidateurliste", badge: null },
    { icon: ChatBubbleLeftIcon, label: "Entretiens",        path: "/enterprise/enterview",        badge: null },
    { icon: UserCircleIcon,     label: "Mon profil",        path: "/enterprise/profile",          badge: null },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-6 border-b border-blue-gray-100">
          <Typography variant="h5" className="font-bold text-blue-500">🏢 MyStage</Typography>
          <Typography variant="small" className="text-blue-gray-500">Espace Entreprise</Typography>
        </div>

        <nav className="p-6 space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer">
                  <Icon className="w-5 h-5 text-blue-gray-600 group-hover:text-blue-500" />
                  <span className="text-sm font-medium text-blue-gray-700 group-hover:text-blue-600">{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{item.badge}</span>
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
              Formulaire complété
            </Typography>
            <Progress value={progressPct} color={progressPct === 100 ? "green" : "blue"} className="h-2" />
            <Typography variant="caption" className="text-blue-gray-500 mt-2">
              {progressPct}% rempli
            </Typography>
          </div>
          <Button fullWidth color="blue" variant="gradient" size="sm">✉️ Support</Button>
        </div>

        <div className="p-6 border-t border-blue-gray-100">
          <Link to="/auth/sign-in">
            <Button fullWidth color="red" variant="outlined" size="sm" className="flex items-center justify-center gap-2">
              <ArrowRightOnRectangleIcon className="w-4 h-4" /> Déconnexion
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-blue-gray-100">
          <div className="px-6 py-4 flex justify-between items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-blue-gray-50 rounded-lg transition-colors">
              {sidebarOpen ? <XMarkIcon className="w-6 h-6 text-blue-gray-600" /> : <Bars3Icon className="w-6 h-6 text-blue-gray-600" />}
            </button>
            <Typography variant="h5" className="font-bold text-blue-gray-900">Publier une Offre</Typography>
            <IconButton variant="text" color="blue-gray"><UserCircleIcon className="w-5 h-5" /></IconButton>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">

            <div className="mb-8">
              <Typography variant="h4" className="font-bold mb-2 text-blue-gray-900">
                Publier une nouvelle offre de stage
              </Typography>
              <Typography variant="paragraph" className="text-blue-gray-600">
                Remplissez le formulaire ci-dessous pour publier votre offre
              </Typography>
            </div>

            {/* Progression */}
            <Card className="mb-6 shadow-sm border border-blue-gray-100">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Typography variant="small" className="font-semibold text-blue-gray-700">
                    Progression du formulaire
                  </Typography>
                  <Typography variant="small" className={`font-bold ${progressPct === 100 ? "text-green-500" : "text-blue-500"}`}>
                    {progressPct}%
                  </Typography>
                </div>
                <Progress value={progressPct} color={progressPct === 100 ? "green" : "blue"} className="h-2" />
              </CardBody>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Section 1 */}
              <Card className="shadow-sm border border-blue-gray-100">
                <CardHeader floated={false} shadow={false} color="transparent"
                  className="m-0 p-6 border-b border-blue-gray-100 bg-blue-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">1</div>
                    <Typography variant="h6" className="font-bold text-blue-gray-900">Informations générales</Typography>
                  </div>
                </CardHeader>

                <CardBody className="space-y-5 p-6">
                  {/* Titre */}
                  <div>
                    <Typography variant="small" className="font-semibold mb-2 text-blue-gray-900 block">
                      Titre du stage <span className="text-red-500">*</span>
                    </Typography>
                    <Input
                      name="title" value={formData.title} onChange={handleChange}
                      placeholder="Ex: Développeur Full Stack React"
                      className="!border-blue-gray-200"
                    />
                  </div>

                  {/* Catégorie + Lieu */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Typography variant="small" className="font-semibold mb-2 text-blue-gray-900 block">
                        <span className="flex items-center gap-1">
                          <DocumentTextIcon className="w-4 h-4" /> Catégorie <span className="text-red-500">*</span>
                        </span>
                      </Typography>
                      <Select value={formData.domain} onChange={(v) => handleSelect("domain", v)} label="Sélectionner une catégorie">
                        {categories.map((cat) => <Option key={cat} value={cat}>{cat}</Option>)}
                      </Select>
                    </div>
                    <div>
                      <Typography variant="small" className="font-semibold mb-2 text-blue-gray-900 block">
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" /> Lieu <span className="text-red-500">*</span>
                        </span>
                      </Typography>
                      <Select value={formData.location} onChange={(v) => handleSelect("location", v)} label="Sélectionner une ville">
                        {locations.map((loc) => <Option key={loc} value={loc}>{loc}</Option>)}
                      </Select>
                    </div>
                  </div>

                  {/* Durée + Date + Places */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Typography variant="small" className="font-semibold mb-2 text-blue-gray-900 block">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" /> Durée <span className="text-red-500">*</span>
                        </span>
                      </Typography>
                      <Select value={formData.duration} onChange={(v) => handleSelect("duration", v)} label="Sélectionner la durée">
                        {durations.map((dur) => <Option key={dur} value={dur}>{dur}</Option>)}
                      </Select>
                    </div>
                    <div>
                      <Typography variant="small" className="font-semibold mb-2 text-blue-gray-900 block">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" /> Date de début <span className="text-red-500">*</span>
                        </span>
                      </Typography>
                      <Input
                        name="startDate" type="date" value={formData.startDate}
                        onChange={handleChange} className="!border-blue-gray-200"
                      />
                    </div>
                    <div>
                      <Typography variant="small" className="font-semibold mb-2 text-blue-gray-900 block">
                        <span className="flex items-center gap-1">
                          <UsersIcon className="w-4 h-4" /> Places disponibles <span className="text-red-500">*</span>
                        </span>
                      </Typography>
                      <Input
                        name="availablePlaces" type="number" value={formData.availablePlaces}
                        onChange={handleChange} placeholder="Ex: 2"
                        className="!border-blue-gray-200" min="1"
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Section 2 */}
              <Card className="shadow-sm border border-blue-gray-100">
                <CardHeader floated={false} shadow={false} color="transparent"
                  className="m-0 p-6 border-b border-blue-gray-100 bg-blue-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">2</div>
                    <Typography variant="h6" className="font-bold text-blue-gray-900">Description du stage</Typography>
                  </div>
                </CardHeader>

                <CardBody className="space-y-5 p-6">
                  <div>
                    <Typography variant="small" className="font-semibold mb-2 text-blue-gray-900 block">
                      Description détaillée <span className="text-red-500">*</span>
                    </Typography>
                    <Textarea
                      name="description" value={formData.description} onChange={handleChange}
                      placeholder="Décrivez les missions, le contexte et les objectifs du stage..."
                      className="!border-blue-gray-200" rows={6}
                    />
                    <div className="flex justify-between mt-1">
                      <Typography variant="small" className="text-blue-gray-400">
                        Décrivez les missions en détail
                      </Typography>
                      <Typography variant="small" className={`font-medium ${formData.description.length > 1800 ? "text-red-500" : "text-blue-gray-400"}`}>
                        {formData.description.length}/2000
                      </Typography>
                    </div>
                  </div>

                  <div>
                    <Typography variant="small" className="font-semibold mb-2 text-blue-gray-900 block">
                      Prérequis et compétences requises <span className="text-red-500">*</span>
                    </Typography>
                    <Textarea
                      name="requirements" value={formData.requirements} onChange={handleChange}
                      placeholder="Ex: React, Node.js, SQL — séparés par des virgules..."
                      className="!border-blue-gray-200" rows={4}
                    />
                  </div>

                  <div>
                    <Typography variant="small" className="font-semibold mb-2 text-blue-gray-900 block">
                      <span className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-yellow-500" />
                        Avantages <span className="text-blue-gray-400 font-normal">(optionnel)</span>
                      </span>
                    </Typography>
                    <Textarea
                      name="advantages" value={formData.advantages} onChange={handleChange}
                      placeholder="Ex: Télétravail possible, tickets restaurant, transport remboursé..."
                      className="!border-blue-gray-200" rows={3}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Aperçu rapide */}
              {(formData.title || formData.domain || formData.location) && (
                <Card className="shadow-sm border border-blue-200 bg-blue-50">
                  <CardBody className="p-5">
                    <Typography variant="small" className="font-bold text-blue-gray-700 mb-3">
                      👁️ Aperçu de votre offre
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {formData.title && (
                        <Typography variant="h6" className="font-bold text-blue-gray-900 w-full">
                          {formData.title}
                        </Typography>
                      )}
                      {formData.domain && (
                        <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-medium">💼 {formData.domain}</span>
                      )}
                      {formData.location && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">📍 {formData.location}</span>
                      )}
                      {formData.duration && (
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">⏱️ {formData.duration}</span>
                      )}
                      {formData.startDate && (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                          📅 Début : {new Date(formData.startDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {formData.availablePlaces && (
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                          👥 {formData.availablePlaces} place(s)
                        </span>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Boutons */}
              <div className="flex gap-4">
                <Button
                  type="submit" color="blue" variant="gradient" size="lg"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Publication en cours...
                    </span>
                  ) : "Publier l'offre"}
                </Button>
                <Button
                  type="button" color="blue-gray" variant="outlined" size="lg"
                  className="flex-1" onClick={handleReset} disabled={loading}
                >
                  🔄 Réinitialiser
                </Button>
              </div>
            </form>

            {/* Info importante */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex gap-3">
                <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <Typography variant="small" className="font-bold text-blue-gray-900 mb-1">
                    ℹ️ Information importante
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-700">
                    Votre offre sera visible immédiatement après publication. Vous pouvez
                    la modifier ou la supprimer à tout moment depuis "Mes offres".
                  </Typography>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}