import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
  Chip,
} from "@material-tailwind/react";
import {
  HomeIcon,
  BriefcaseIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  CheckIcon,
  CameraIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";

export default function EnterpriseProfile() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const photoInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = localStorage.getItem("entrepriseRole") || user.type || "rh";

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    position: "",
    department: "",
    company_name: "",
    company_description: "",
    company_website: "",
    photo: null,
    photo_url: null,
    logo: null,
    logo_url: null,
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/profile");
      setProfile((prev) => ({ ...prev, ...res.data }));
    } catch {
      setProfile((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      Object.entries(profile).forEach(([key, value]) => {
        if (value !== null && key !== "photo_url" && key !== "logo_url") {
          formData.append(key, value);
        }
      });
      await api.post("/user/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: profile.name, email: profile.email }));
      setEditMode(false);
      Swal.fire({ icon: "success", title: "Profil mis à jour !", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: err.response?.data?.message || "Erreur lors de la mise à jour", confirmButtonColor: "#ef4444" });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setProfile((p) => ({ ...p, photo: file, photo_url: URL.createObjectURL(file) }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setProfile((p) => ({ ...p, logo: file, logo_url: URL.createObjectURL(file) }));
  };

  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.new_password_confirmation) {
      Swal.fire({ icon: "warning", title: "Mots de passe différents", confirmButtonColor: "#f59e0b" });
      return;
    }
    try {
      setLoading(true);
      await api.post("/user/change-password", passwords);
      setPasswords({ current_password: "", new_password: "", new_password_confirmation: "" });
      Swal.fire({ icon: "success", title: "Mot de passe modifié !", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: err.response?.data?.message || "Mot de passe actuel incorrect.", confirmButtonColor: "#ef4444" });
    } finally {
      setLoading(false);
    }
  };

  const roleConfig = {
    manager:   { label: "Manager",   color: "blue",   icon: "🏢" },
    rh:        { label: "RH",        color: "green",  icon: "👥" },
    encadrant: { label: "Encadrant", color: "purple", icon: "🎓" },
  };
  const currentRole = roleConfig[role] || roleConfig.rh;

  const menuItems = [
    { icon: HomeIcon,           label: "Tableau de bord", path: "/enterprise/offers" },
    { icon: HomeIcon,           label: "Publier une offre", path: "/enterprise/publish" },
    { icon: BriefcaseIcon,      label: "Mes offres",      path: "/enterprise/offersliste" },
    { icon: CheckCircleIcon,    label: "Candidatures",    path: "/enterprise/condidateurliste" },
    { icon: ChatBubbleLeftIcon, label: "Entretiens",      path: "/enterprise/enterview" },
    { icon: UserCircleIcon,     label: "Mon profil",      path: "/enterprise/profile" },
  ];

  const sections = [
    { id: "personal",  label: "Infos personnelles",  icon: UserCircleIcon },
    { id: "company",   label: "Infos entreprise",     icon: BuildingOfficeIcon },
    { id: "password",  label: "Mot de passe",         icon: LockClosedIcon },
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
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-blue-gray-100">
          <Link to="/auth/sign-in">
            <Button fullWidth color="red" variant="outlined" size="sm" className="flex items-center justify-center gap-2">
              <ArrowRightOnRectangleIcon className="w-4 h-4" /> Déconnexion
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-blue-gray-100">
          <div className="px-6 py-4 flex justify-between items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-blue-gray-50 rounded-lg transition-colors">
              {sidebarOpen ? <XMarkIcon className="w-6 h-6 text-blue-gray-600" /> : <Bars3Icon className="w-6 h-6 text-blue-gray-600" />}
            </button>
            <Typography variant="h5" className="font-bold text-blue-gray-900">Mon Profil</Typography>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-4xl mx-auto">

            {/* ✅ Header profil */}
            <Card className="mb-8 shadow-sm border border-blue-gray-100">
              <CardBody className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Photo */}
                  <div className="relative flex-shrink-0">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-4 border-white shadow-lg">
                      {profile.photo_url ? (
                        <img src={profile.photo_url} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircleIcon className="w-16 h-16 text-blue-400" />
                      )}
                    </div>
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition"
                    >
                      <CameraIcon className="w-4 h-4" />
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                      <Typography variant="h4" className="font-bold text-blue-gray-900">
                        {profile.name || "Votre nom"}
                      </Typography>
                      <Chip value={`${currentRole.icon} ${currentRole.label}`} color={currentRole.color} size="sm" />
                    </div>
                    <Typography className="text-blue-500 font-medium mb-1">
                      {profile.position || "Poste"} {profile.company_name ? `• ${profile.company_name}` : ""}
                    </Typography>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-3">
                      {profile.email && (
                        <span className="flex items-center gap-1 text-xs text-blue-gray-600 bg-blue-gray-50 px-3 py-1 rounded-full">
                          <EnvelopeIcon className="w-3 h-3" /> {profile.email}
                        </span>
                      )}
                      {profile.phone && (
                        <span className="flex items-center gap-1 text-xs text-blue-gray-600 bg-blue-gray-50 px-3 py-1 rounded-full">
                          <PhoneIcon className="w-3 h-3" /> {profile.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Navigation sections */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeSection === s.id
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-white text-blue-gray-700 border border-blue-gray-200 hover:bg-blue-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* ✅ Section : Infos personnelles */}
            {activeSection === "personal" && (
              <Card className="shadow-sm border border-blue-gray-100">
                <CardBody className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <Typography variant="h6" className="font-bold text-blue-gray-900">👤 Informations personnelles</Typography>
                    <Button size="sm" color={editMode ? "green" : "blue"} variant="outlined"
                      onClick={() => editMode ? handleSaveProfile() : setEditMode(true)} disabled={loading}
                      className="flex items-center gap-2">
                      {editMode ? <CheckIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
                      {editMode ? (loading ? "Enregistrement..." : "Enregistrer") : "Modifier"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Nom complet",  name: "name",       icon: UserCircleIcon,    type: "text",  placeholder: "Votre nom" },
                      { label: "Email",         name: "email",      icon: EnvelopeIcon,      type: "email", placeholder: "votre@email.com" },
                      { label: "Téléphone",     name: "phone",      icon: PhoneIcon,         type: "tel",   placeholder: "+216 XX XXX XXX" },
                      { label: "Adresse",       name: "address",    icon: MapPinIcon,        type: "text",  placeholder: "Ville, Pays" },
                      { label: "Poste",         name: "position",   icon: UserCircleIcon,    type: "text",  placeholder: "Ex: Responsable RH" },
                      { label: "Département",   name: "department", icon: BuildingOfficeIcon, type: "text", placeholder: "Ex: Ressources Humaines" },
                    ].map(({ label, name, icon: Icon, type, placeholder }) => (
                      <div key={name}>
                        <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">{label}</Typography>
                        {editMode ? (
                          <Input type={type} placeholder={placeholder} value={profile[name] || ""}
                            onChange={(e) => setProfile((p) => ({ ...p, [name]: e.target.value }))}
                            icon={<Icon className="w-5 h-5" />} className="!border-blue-gray-300" />
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 bg-blue-gray-50 rounded-lg">
                            <Icon className="w-4 h-4 text-blue-gray-400" />
                            <Typography variant="small" className="text-blue-gray-700">
                              {profile[name] || <span className="text-blue-gray-400 italic">Non renseigné</span>}
                            </Typography>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {editMode && (
                    <div className="flex gap-3 mt-6">
                      <Button color="green" onClick={handleSaveProfile} disabled={loading} className="flex items-center gap-2">
                        <CheckIcon className="w-4 h-4" />
                        {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                      </Button>
                      <Button color="blue-gray" variant="outlined" onClick={() => { setEditMode(false); fetchProfile(); }}>Annuler</Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* ✅ Section : Infos entreprise */}
            {activeSection === "company" && (
              <Card className="shadow-sm border border-blue-gray-100">
                <CardBody className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <Typography variant="h6" className="font-bold text-blue-gray-900">🏢 Informations entreprise</Typography>
                    <Button size="sm" color={editMode ? "green" : "blue"} variant="outlined"
                      onClick={() => editMode ? handleSaveProfile() : setEditMode(true)} disabled={loading}
                      className="flex items-center gap-2">
                      {editMode ? <CheckIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
                      {editMode ? (loading ? "Enregistrement..." : "Enregistrer") : "Modifier"}
                    </Button>
                  </div>

                  {/* Logo entreprise */}
                  <div className="mb-6 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-blue-gray-100 flex items-center justify-center border border-blue-gray-200">
                      {profile.logo_url ? (
                        <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <BuildingOfficeIcon className="w-10 h-10 text-blue-gray-400" />
                      )}
                    </div>
                    <div>
                      <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Logo de l'entreprise</Typography>
                      <Button size="sm" color="blue" variant="outlined" onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2">
                        <DocumentArrowUpIcon className="w-4 h-4" /> Changer le logo
                      </Button>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Nom de l'entreprise", name: "company_name",        icon: BuildingOfficeIcon, type: "text", placeholder: "Nom de votre entreprise" },
                      { label: "Site web",            name: "company_website",     icon: EnvelopeIcon,       type: "url",  placeholder: "https://www.entreprise.com" },
                    ].map(({ label, name, icon: Icon, type, placeholder }) => (
                      <div key={name}>
                        <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">{label}</Typography>
                        {editMode ? (
                          <Input type={type} placeholder={placeholder} value={profile[name] || ""}
                            onChange={(e) => setProfile((p) => ({ ...p, [name]: e.target.value }))}
                            icon={<Icon className="w-5 h-5" />} className="!border-blue-gray-300" />
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 bg-blue-gray-50 rounded-lg">
                            <Icon className="w-4 h-4 text-blue-gray-400" />
                            <Typography variant="small" className="text-blue-gray-700">
                              {profile[name] || <span className="text-blue-gray-400 italic">Non renseigné</span>}
                            </Typography>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="md:col-span-2">
                      <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Description de l'entreprise</Typography>
                      {editMode ? (
                        <textarea rows={4} placeholder="Décrivez votre entreprise..."
                          value={profile.company_description || ""}
                          onChange={(e) => setProfile((p) => ({ ...p, company_description: e.target.value }))}
                          className="w-full px-3 py-2 border border-blue-gray-300 rounded-lg text-sm text-blue-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-blue-gray-50 rounded-lg min-h-[80px]">
                          <Typography variant="small" className="text-blue-gray-700">
                            {profile.company_description || <span className="text-blue-gray-400 italic">Aucune description renseignée</span>}
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>

                  {editMode && (
                    <div className="flex gap-3 mt-6">
                      <Button color="green" onClick={handleSaveProfile} disabled={loading} className="flex items-center gap-2">
                        <CheckIcon className="w-4 h-4" />
                        {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                      </Button>
                      <Button color="blue-gray" variant="outlined" onClick={() => { setEditMode(false); fetchProfile(); }}>Annuler</Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* ✅ Section : Mot de passe */}
            {activeSection === "password" && (
              <Card className="shadow-sm border border-blue-gray-100">
                <CardBody className="p-8">
                  <Typography variant="h6" className="font-bold text-blue-gray-900 mb-6">🔒 Modifier le mot de passe</Typography>
                  <div className="max-w-md space-y-5">
                    <div>
                      <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Mot de passe actuel</Typography>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••"
                          value={passwords.current_password}
                          onChange={(e) => setPasswords((p) => ({ ...p, current_password: e.target.value }))}
                          icon={<LockClosedIcon className="w-5 h-5" />} className="!border-blue-gray-300" />
                        <IconButton variant="text" size="sm" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2">
                          {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </IconButton>
                      </div>
                    </div>
                    <div>
                      <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Nouveau mot de passe</Typography>
                      <div className="relative">
                        <Input type={showNewPassword ? "text" : "password"} placeholder="••••••••"
                          value={passwords.new_password}
                          onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
                          icon={<LockClosedIcon className="w-5 h-5" />} className="!border-blue-gray-300" />
                        <IconButton variant="text" size="sm" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-1/2 -translate-y-1/2">
                          {showNewPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </IconButton>
                      </div>
                    </div>
                    <div>
                      <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Confirmer le nouveau mot de passe</Typography>
                      <Input type="password" placeholder="••••••••"
                        value={passwords.new_password_confirmation}
                        onChange={(e) => setPasswords((p) => ({ ...p, new_password_confirmation: e.target.value }))}
                        icon={<LockClosedIcon className="w-5 h-5" />} className="!border-blue-gray-300"
                        error={passwords.new_password_confirmation && passwords.new_password !== passwords.new_password_confirmation}
                        success={passwords.new_password_confirmation && passwords.new_password === passwords.new_password_confirmation}
                      />
                    </div>
                    <Button color="blue" onClick={handleChangePassword} disabled={loading} className="flex items-center gap-2">
                      <LockClosedIcon className="w-4 h-4" />
                      {loading ? "Modification..." : "Modifier le mot de passe"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}