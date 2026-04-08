import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Button,
  Typography,
  Card,
  CardHeader,
  CardBody,
  Input,
  Textarea,
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
  Chip,
  Select,
  Option,
  Tabs,
  TabsHeader,
  Tab,
} from "@material-tailwind/react";
import {
  PlusIcon,
  HomeIcon,
  BriefcaseIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";

export default function Offertable() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [editOffer, setEditOffer] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "", domain: "", location: "", duration: "",
    startDate: "", availablePlaces: "", description: "",
    requirements: "", advantages: "",
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  // ✅ Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
      });
    } catch { return dateStr; }
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/offers?per_page=10&page=1");
setOffers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setForm({
    title: "", domain: "", location: "", duration: "",
    startDate: "", availablePlaces: "", description: "",
    requirements: "", advantages: "",
  });

  const handleOpenCreate = () => {
    resetForm();
    setEditOffer(null);
    setOpenFormModal(true);
  };

  const handleOpenEdit = (offer) => {
    setEditOffer(offer);
    setForm({
      title:           offer.title || "",
      domain:          offer.domain || "",
      location:        offer.location || "",
      duration:        offer.duration || "",
      startDate:       offer.start_date || "",
      availablePlaces: offer.available_places || "",
      description:     offer.description || "",
      requirements:    offer.requirements || "",
      advantages:      offer.advantages || "",
    });
    setOpenFormModal(true);
  };

  const handleOpenDetail = (offer) => {
    setSelectedOffer(offer);
    setActiveTab("description");
    setOpenDetailModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.domain || !form.location || !form.duration) {
      Swal.fire({ icon: "warning", title: "Champs manquants", text: "Veuillez remplir tous les champs obligatoires.", confirmButtonColor: "#3b82f6" });
      return;
    }
    try {
      setSubmitting(true);
      const payload = { ...form, availablePlaces: Number(form.availablePlaces) || 0 };
      if (editOffer) {
        await api.put(`/offers/${editOffer.id}`, payload);
        Swal.fire({ icon: "success", title: "Offre mise à jour !", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      } else {
        await api.post("/offers", payload);
        Swal.fire({ icon: "success", title: "Offre publiée !", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      }
      setOpenFormModal(false);
      resetForm();
      fetchOffers();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: err.response?.data?.message || "Une erreur est survenue.", confirmButtonColor: "#ef4444" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Supprimer cette offre ?", text: "Cette action est irréversible.",
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Oui, supprimer", cancelButtonText: "Annuler",
      confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/offers/${id}`);
      Swal.fire({ icon: "success", title: "Offre supprimée", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchOffers();
    } catch {
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible de supprimer.", confirmButtonColor: "#ef4444" });
    }
  };

  const filteredOffers = offers.filter((offer) =>
    offer.title?.toLowerCase().includes(search.toLowerCase()) ||
    offer.description?.toLowerCase().includes(search.toLowerCase()) ||
    offer.location?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ["Informatique", "Finance", "Marketing", "Ressources Humaines", "Design", "Ingénierie", "Data Science", "Autre"];
  const durations  = ["1 mois", "2 mois", "3 mois", "4 mois", "5 mois", "6 mois"];
  const locations  = ["Tunis", "Ariana", "Ben Arous", "Sfax", "Sousse", "Gabès", "Autre"];

  const menuItems = [
    { icon: HomeIcon,           label: "Tableau de bord",  path: "/enterprise/offers",           badge: null },
    { icon: HomeIcon,           label: "Publier une offre", path: "/enterprise/publish",          badge: null },
    { icon: BriefcaseIcon,      label: "Mes offres",        path: "/enterprise/offersliste",      badge: offers.length },
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
            <Typography variant="small" className="text-blue-gray-600 mb-1">Offres publiées</Typography>
            <Progress value={offers.length > 0 ? 75 : 0} color="blue" className="h-2" />
            <Typography variant="caption" className="text-blue-gray-500 mt-2">{offers.length} offre(s)</Typography>
          </div>
          <Button fullWidth color="blue" variant="gradient" size="sm">✉️ Contacter support</Button>
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
            <Typography variant="h5" className="font-bold text-blue-gray-900">Mes Offres</Typography>
            <Button onClick={handleOpenCreate} color="blue" size="sm" className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" /> Nouvelle offre
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8">

            {/* ✅ Statistiques */}
            <div className="mb-8 grid gap-4 grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total offres",       value: offers.length,   color: "text-blue-gray-900", sub: "Publiées",   subColor: "text-blue-500" },
                { label: "Places disponibles", value: offers.reduce((a, o) => a + (o.available_places || 0), 0), color: "text-green-500", sub: "Total", subColor: "text-green-500" },
                { label: "Domaines couverts",  value: [...new Set(offers.map((o) => o.domain).filter(Boolean))].length, color: "text-purple-500", sub: "Catégories", subColor: "text-purple-500" },
                { label: "Ce mois",            value: offers.filter((o) => new Date(o.created_at).getMonth() === new Date().getMonth()).length, color: "text-orange-500", sub: "Nouvelles", subColor: "text-orange-500" },
              ].map((stat) => (
                <Card key={stat.label} className="p-4 shadow-sm border border-blue-gray-100 hover:shadow-lg transition">
                  <Typography className="text-blue-gray-500 text-sm">{stat.label}</Typography>
                  <Typography className={`text-2xl font-bold ${stat.color}`}>{stat.value}</Typography>
                  <Typography className={`text-xs font-medium ${stat.subColor}`}>{stat.sub}</Typography>
                </Card>
              ))}
            </div>

            {/* ✅ Tableau des offres */}
            <Card className="shadow-sm border border-blue-gray-100">
              <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6 border-b border-blue-gray-100">
                <div>
                  <Typography variant="h6" color="blue-gray" className="mb-1">Toutes les offres</Typography>
                  <Typography variant="small" className="text-blue-gray-600">
                    <strong>{filteredOffers.length} offre(s)</strong> trouvée(s)
                  </Typography>
                </div>
                <Menu placement="left-start">
                  <MenuHandler>
                    <IconButton size="sm" variant="text" color="blue-gray">
                      <EllipsisVerticalIcon strokeWidth={3} className="h-6 w-6" />
                    </IconButton>
                  </MenuHandler>
                  <MenuList>
                    <MenuItem onClick={fetchOffers}>🔄 Actualiser</MenuItem>
                    <MenuItem onClick={handleOpenCreate}>➕ Nouvelle offre</MenuItem>
                  </MenuList>
                </Menu>
              </CardHeader>

              {/* Recherche */}
              <CardBody className="px-6 py-4 border-b border-blue-gray-50">
                <Input
                  placeholder="Rechercher une offre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  className="!border-blue-gray-200"
                />
              </CardBody>

              <CardBody className="p-0">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mb-3 mx-auto"></div>
                      <Typography className="text-blue-gray-500">Chargement...</Typography>
                    </div>
                  </div>
                ) : filteredOffers.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <BriefcaseIcon className="w-16 h-16 mx-auto text-blue-gray-300 mb-4" />
                    <Typography className="text-blue-gray-500 mb-4">Aucune offre trouvée</Typography>
                    <Button color="blue" size="sm" onClick={handleOpenCreate} className="flex items-center gap-2 mx-auto">
                      <PlusIcon className="w-4 h-4" /> Créer une offre
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-blue-gray-100 bg-blue-gray-50">
                          {["Titre", "Domaine", "Lieu", "Durée", "Début", "Places", "Actions"].map((h) => (
                            <th key={h} className="px-6 py-4 text-left">
                              <Typography variant="small" className="text-xs font-semibold uppercase text-blue-gray-600">{h}</Typography>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOffers.map((offer) => (
                          <tr key={offer.id} className="border-b border-blue-gray-50 hover:bg-blue-gray-50 transition">
                            {/* Titre */}
                            <td className="px-6 py-4">
                              <Typography variant="small" className="font-bold text-blue-gray-900">{offer.title}</Typography>
                              <Typography variant="small" className="text-blue-gray-400 text-xs">{formatDate(offer.created_at)}</Typography>
                            </td>
                            {/* Domaine */}
                            <td className="px-6 py-4">
                              {offer.domain
                                ? <Chip value={offer.domain} variant="ghost" size="sm" color="blue" className="text-xs" />
                                : <Typography className="text-sm text-blue-gray-400">N/A</Typography>
                              }
                            </td>
                            {/* Lieu */}
                            <td className="px-6 py-4">
                              <Typography className="text-sm text-blue-gray-700 flex items-center gap-1">
                                <MapPinIcon className="w-3 h-3 text-blue-400" /> {offer.location || "N/A"}
                              </Typography>
                            </td>
                            {/* Durée */}
                            <td className="px-6 py-4">
                              <Typography className="text-sm text-blue-gray-700 flex items-center gap-1">
                                <ClockIcon className="w-3 h-3 text-blue-400" /> {offer.duration || "N/A"}
                              </Typography>
                            </td>
                            {/* ✅ start_date */}
                            <td className="px-6 py-4">
                              <Typography className="text-sm text-blue-gray-700 flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3 text-blue-400" /> {formatDate(offer.start_date)}
                              </Typography>
                            </td>
                            {/* ✅ available_places */}
                            <td className="px-6 py-4">
                              <Typography className="text-sm text-blue-gray-700 flex items-center gap-1">
                                <UsersIcon className="w-3 h-3 text-blue-400" />
                                {offer.available_places ? `${offer.available_places} place(s)` : "N/A"}
                              </Typography>
                            </td>
                            {/* Actions */}
                            <td className="px-6 py-4">
                              <div className="flex gap-1">
                                <IconButton variant="text" size="sm" color="blue" onClick={() => handleOpenDetail(offer)} title="Voir">
                                  <EyeIcon className="w-4 h-4" />
                                </IconButton>
                                <IconButton variant="text" size="sm" color="blue-gray" onClick={() => handleOpenEdit(offer)} title="Modifier">
                                  <PencilIcon className="w-4 h-4" />
                                </IconButton>
                                <IconButton variant="text" size="sm" color="red" onClick={() => handleDelete(offer.id)} title="Supprimer">
                                  <TrashIcon className="w-4 h-4" />
                                </IconButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </main>
      </div>

      {/* ✅ Modal Détail */}
      <Dialog open={openDetailModal} handler={() => setOpenDetailModal(false)} size="lg">
        <DialogHeader className="flex justify-between items-center border-b border-blue-gray-100">
          <Typography variant="h5" className="font-bold">{selectedOffer?.title}</Typography>
          <IconButton variant="text" color="blue-gray" onClick={() => setOpenDetailModal(false)}>
            <XMarkIcon className="w-6 h-6" />
          </IconButton>
        </DialogHeader>

        <DialogBody divider className="max-h-[70vh] overflow-y-auto">
          {selectedOffer && (
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  💼 {selectedOffer.domain || "N/A"}
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
              </div>

              {/* Tabs */}
              <Tabs value={activeTab}>
                <TabsHeader>
                  <Tab value="description" onClick={() => setActiveTab("description")} className="cursor-pointer">Description</Tab>
                  <Tab value="requirements" onClick={() => setActiveTab("requirements")} className="cursor-pointer">Prérequis</Tab>
                  <Tab value="advantages"   onClick={() => setActiveTab("advantages")}   className="cursor-pointer">Avantages</Tab>
                </TabsHeader>
              </Tabs>

              <div>
                {activeTab === "description" && (
                  <Typography className="text-blue-gray-700 leading-relaxed">
                    {selectedOffer.description || "Aucune description"}
                  </Typography>
                )}
                {activeTab === "requirements" && (
                  <ul className="space-y-2">
                    {selectedOffer.requirements ? (
                      selectedOffer.requirements.split(",").map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-gray-700">{r.trim()}</span>
                        </li>
                      ))
                    ) : (
                      <Typography className="text-blue-gray-500">Aucun prérequis spécifié</Typography>
                    )}
                  </ul>
                )}
                {activeTab === "advantages" && (
                  <ul className="space-y-2">
                    {selectedOffer.advantages ? (
                      selectedOffer.advantages.split(",").map((a, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-blue-gray-700">{a.trim()}</span>
                        </li>
                      ))
                    ) : (
                      <Typography className="text-blue-gray-500">Aucun avantage spécifié</Typography>
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-t border-blue-gray-100 gap-3">
          <Button variant="outlined" color="blue-gray" onClick={() => setOpenDetailModal(false)}>Fermer</Button>
          <Button color="blue" onClick={() => { setOpenDetailModal(false); handleOpenEdit(selectedOffer); }}>
            ✏️ Modifier
          </Button>
          <Button color="green" variant="outlined" onClick={() => navigate("/enterprise/condidateurliste")}>
            👥 Voir candidatures
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ✅ Modal Créer / Modifier */}
      <Dialog open={openFormModal} handler={() => setOpenFormModal(false)} size="lg">
        <DialogHeader className="flex justify-between items-center border-b border-blue-gray-100">
          <Typography variant="h5" className="font-bold">
            {editOffer ? "✏️ Modifier l'offre" : "➕ Créer une nouvelle offre"}
          </Typography>
          <IconButton variant="text" color="blue-gray" onClick={() => setOpenFormModal(false)}>
            <XMarkIcon className="w-6 h-6" />
          </IconButton>
        </DialogHeader>

        <DialogBody divider className="max-h-[70vh] overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Titre */}
            <div>
              <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
                Titre du stage <span className="text-red-500">*</span>
              </Typography>
              <Input placeholder="Ex: Développeur Full Stack React" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} className="!border-blue-gray-300" />
            </div>

            {/* Catégorie + Lieu */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
                  Catégorie <span className="text-red-500">*</span>
                </Typography>
                <Select value={form.domain} onChange={(v) => setForm({ ...form, domain: v })} label="Catégorie">
                  {categories.map((c) => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </div>
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
                  Lieu <span className="text-red-500">*</span>
                </Typography>
                <Select value={form.location} onChange={(v) => setForm({ ...form, location: v })} label="Ville">
                  {locations.map((l) => <Option key={l} value={l}>{l}</Option>)}
                </Select>
              </div>
            </div>

            {/* Durée + Date + Places */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
                  Durée <span className="text-red-500">*</span>
                </Typography>
                <Select value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} label="Durée">
                  {durations.map((d) => <Option key={d} value={d}>{d}</Option>)}
                </Select>
              </div>
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Date de début</Typography>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="!border-blue-gray-300" />
              </div>
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Places disponibles</Typography>
                <Input type="number" placeholder="Ex: 2" min="1" value={form.availablePlaces}
                  onChange={(e) => setForm({ ...form, availablePlaces: e.target.value })} className="!border-blue-gray-300" />
              </div>
            </div>

            {/* Description */}
            <div>
              <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
                Description <span className="text-red-500">*</span>
              </Typography>
              <Textarea placeholder="Décrivez les missions..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} className="!border-blue-gray-300" rows={4} />
            </div>

            {/* Prérequis */}
            <div>
              <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
                Prérequis (séparés par des virgules)
              </Typography>
              <Textarea placeholder="Ex: React, Node.js, SQL..." value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })} className="!border-blue-gray-300" rows={3} />
            </div>

            {/* Avantages */}
            <div>
              <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Avantages (optionnel)</Typography>
              <Textarea placeholder="Ex: Télétravail, tickets restaurant..." value={form.advantages}
                onChange={(e) => setForm({ ...form, advantages: e.target.value })} className="!border-blue-gray-300" rows={3} />
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="border-t border-blue-gray-100 gap-3">
          <Button color="blue-gray" variant="outlined" onClick={() => setOpenFormModal(false)}>Annuler</Button>
          <Button color="blue" onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4" />
            {submitting ? "Enregistrement..." : editOffer ? "Mettre à jour" : "Publier l'offre"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}