import { useState, useEffect } from "react";
import {
  Button,
  Input,
  IconButton,
  Tooltip,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import {
  BriefcaseIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  MapPinIcon,
  TagIcon,
  UsersIcon,
  EyeIcon,
  XMarkIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  StarIcon,
  AcademicCapIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { InternalSidebarHeader } from "../../components/layout/SidebarHeaders";
import NotificationBell from "../../components/layout/NotificationBell";
import "./css/ManagerDashboard.css";

const AVATAR_COLORS = ["blue", "violet", "emerald", "orange", "rose", "cyan"];

export default function ManagerOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await api.get("/user/profile");
      setUser(res.data);
    } catch (err) {
      console.error("Erreur profil:", err);
    }
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/manager/offers");
      setOffers(res.data);
    } catch (err) {
      console.error("Erreur chargement offres:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = (offer) => {
    setSelectedOffer(offer);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedOffer(null);
  };

  useEffect(() => {
    fetchOffers();
    fetchUser();
  }, []);

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";
  const getAvatarColor = (idx) => AVATAR_COLORS[idx % AVATAR_COLORS.length];

  const filteredOffers = offers.filter((off) =>
    off.title?.toLowerCase().includes(search.toLowerCase()) ||
    off.domain?.toLowerCase().includes(search.toLowerCase()) ||
    off.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const menuItems = [
    { icon: UsersIcon, label: "Gestion Utilisateurs", path: "/enterprise/manager" },
    { icon: MagnifyingGlassIcon, label: "Candidatures & Validations", path: "/enterprise/manager/applications" },
    { icon: BriefcaseIcon, label: "Toutes les Offres", path: "/enterprise/manager/offers" },
    { icon: ChartBarIcon, label: "Suivi & Supervision", path: "/enterprise/manager/supervision" },
    { icon: ClipboardDocumentCheckIcon, label: "Évaluations Encadrants", path: "/enterprise/manager/evaluations" }
  ];

  return (
    <div className="dashboard-container flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col z-10 flex-shrink-0 border-r border-blue-gray-100">
        <div className="p-6 border-b border-blue-gray-100">
          <InternalSidebarHeader
            name={user?.name}
            email={user?.email}
            role={user?.role || 'manager'}
            photoUrl={user?.photo_url}
            enterpriseName={user?.company_name}
          />
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = window.location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group cursor-pointer ${active ? "bg-blue-50 text-blue-600 font-bold" : "text-blue-gray-600 hover:bg-slate-50 hover:text-slate-900 font-medium"}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? "text-blue-600" : "text-blue-gray-400 group-hover:text-blue-gray-600"}`} />
                  <span className="text-sm truncate">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-blue-gray-100">
          <Link to="/auth/sign-in">
            <Button fullWidth color="red" variant="text" size="sm" className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 active:bg-red-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Déconnexion
            </Button>
          </Link>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 relative overflow-y-auto w-full">
        <div className="blob-top-right fixed pointer-events-none" />
        <div className="blob-bottom-left fixed pointer-events-none" />

        <div className="dashboard-wrapper min-h-screen relative z-10 w-full p-4 sm:p-6 lg:p-8">
          <div className="main-card">
            <div className="main-card-body">
              {/* ── Header ── */}
              <div className="dashboard-header">
                <div>
                  <p className="dashboard-title">💼 Gestion des Offres</p>
                  <p className="dashboard-subtitle">Liste de toutes les offres de stage publiées</p>
                </div>
                <div className="flex items-center gap-3">
                    <NotificationBell apiPrefix="rh" />
                    <Button color="blue" variant="outlined" className="bg-white flex items-center gap-2" onClick={fetchOffers}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Actualiser
                    </Button>
                    <Link to="/enterprise/publish">
                        <Button color="blue" className="flex items-center gap-2">
                            <PlusIcon className="w-4 h-4" />
                            Nouvelle offre
                        </Button>
                    </Link>
                </div>
              </div>

              {/* ── Table ── */}
              <div className="table-card mt-6">
                <div className="table-header">
                  <p className="table-title">Offres en ligne</p>
                  <div className="search-wrapper">
                    <Input
                      placeholder="Titre, domaine, recruteur..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                      className="!border-blue-gray-200"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="loading-state">
                    <div className="spinner" />
                    <p className="loading-text">Chargement des offres...</p>
                  </div>
                ) : filteredOffers.length === 0 ? (
                  <div className="empty-state">
                    <BriefcaseIcon className="empty-icon" />
                    <p className="empty-text">Aucune offre trouvée</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          {["Titre de l'offre", "Domaine", "Lieu", "Recruteur (RH)", "Places", "Candidatures", "Actions"].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOffers.map((off, idx) => {
                          return (
                            <tr key={off.id}>
                              <td>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-800">{off.title}</span>
                                    <span className="text-[10px] text-gray-400">ID: #{off.id}</span>
                                </div>
                              </td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <TagIcon className="w-3.5 h-3.5 text-blue-400" />
                                  <span className="text-sm text-slate-600">{off.domain}</span>
                                </div>
                              </td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-sm text-slate-600">{off.location}</span>
                                </div>
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <UserCircleIcon className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm text-slate-600 font-medium">
                                    {off.user?.name}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                        {off.available_places}
                                    </span>
                                </div>
                              </td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${off.applications_count > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-50'}`}>
                                        {off.applications_count} postulations
                                    </span>
                                </div>
                              </td>
                              <td>
                                <div className="actions-cell">
                                    <IconButton variant="text" size="sm" color="blue" onClick={() => handleShowDetails(off)}>
                                        <EyeIcon className="w-4 h-4" />
                                    </IconButton>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Details Modal ── */}
      <Dialog open={openModal} handler={handleCloseModal} size="lg" className="rounded-2xl">
        <DialogHeader className="border-b border-gray-100 p-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BriefcaseIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">{selectedOffer?.title}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <TagIcon className="w-3 h-3" /> {selectedOffer?.domain}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPinIcon className="w-3 h-3" /> {selectedOffer?.location}
                  </span>
                </div>
              </div>
            </div>
            <IconButton variant="text" color="blue-gray" onClick={handleCloseModal}>
              <XMarkIcon className="w-5 h-5" />
            </IconButton>
          </div>
        </DialogHeader>

        <DialogBody className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Info Cards */}
            <div className="md:col-span-1 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Informations Clés</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Durée</span>
                    <span className="text-xs font-bold text-slate-900">{selectedOffer?.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Places</span>
                    <span className="text-xs font-bold text-blue-600">{selectedOffer?.available_places}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Début</span>
                    <span className="text-xs font-bold text-slate-900">{selectedOffer?.start_date || 'Dès que possible'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Responsable</p>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {selectedOffer?.user?.name?.charAt(0)}
                   </div>
                   <div>
                    <p className="text-xs font-bold text-slate-900">{selectedOffer?.user?.name}</p>
                    <p className="text-[10px] text-slate-500">{selectedOffer?.user?.email}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Column: Text Content */}
            <div className="md:col-span-2 space-y-6">
              <section>
                <h4 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                  <BuildingOfficeIcon className="w-4 h-4 text-blue-600" />
                  Description du poste
                </h4>
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                  {selectedOffer?.description || "Aucune description fournie."}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                  <AcademicCapIcon className="w-4 h-4 text-violet-600" />
                  Profil recherché
                </h4>
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                  {selectedOffer?.requirements || "Aucun pré-requis spécifié."}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                  <StarIcon className="w-4 h-4 text-emerald-600" />
                  Avantages
                </h4>
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                  {selectedOffer?.advantages || "Aucun avantage mentionné."}
                </div>
              </section>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="p-4 border-t border-gray-100">
          <Button variant="text" color="red" onClick={handleCloseModal} className="flex items-center gap-2">
            Fermer
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
