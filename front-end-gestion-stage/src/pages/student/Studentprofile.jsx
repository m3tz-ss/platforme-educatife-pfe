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
  Progress,
  Chip,
} from "@material-tailwind/react";
import {
  HomeIcon,
  BriefcaseIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  CheckIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  CameraIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";

export default function StudentProfile() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [applications, setApplications] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const photoInputRef = useRef(null);
  const cvInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    school: "",
    field: "",
    graduation_year: "",
    bio: "",
    photo: null,
    photo_url: null,
    cv: null,
    cv_name: null,
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  useEffect(() => {
    const load = async () => {
      setInitialLoading(true);
      await Promise.all([fetchProfile(), fetchApplications()]);
      setInitialLoading(false);
    };
    load();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
      });
    } catch { return dateStr; }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/profile");
      setProfile((prev) => ({ ...prev, ...res.data }));
    } catch {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setProfile((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get("/my-applications");
      setApplications(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch { setApplications([]); }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      Object.entries(profile).forEach(([key, value]) => {
        if (value !== null && key !== "photo_url" && key !== "cv_name") {
          formData.append(key, value);
        }
      });

      await api.post("/user/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...user, name: profile.name, email: profile.email }));

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
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire({ icon: "warning", title: "Format invalide", text: "Veuillez choisir une image.", confirmButtonColor: "#f59e0b" });
      return;
    }
    const url = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, photo: file, photo_url: url }));
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      Swal.fire({ icon: "warning", title: "Format invalide", text: "Veuillez choisir un fichier PDF.", confirmButtonColor: "#f59e0b" });
      return;
    }
    setProfile((prev) => ({ ...prev, cv: file, cv_name: file.name }));
  };

  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.new_password_confirmation) {
      Swal.fire({ icon: "warning", title: "Mots de passe différents", text: "La confirmation ne correspond pas.", confirmButtonColor: "#f59e0b" });
      return;
    }
    if (passwords.new_password.length < 8) {
      Swal.fire({ icon: "warning", title: "Trop court", text: "Le nouveau mot de passe doit contenir au moins 8 caractères.", confirmButtonColor: "#f59e0b" });
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

  // Statut mapping
  const statusMap = { nouveau: "pending", preselectionnee: "reviewing", entretien: "interview", acceptee: "accepted", refusee: "rejected" };
  const normalizeStatus = (s) => statusMap[s] || s;
  const statusColor = (s) => ({ accepted: "green", rejected: "red", interview: "purple", reviewing: "amber" }[normalizeStatus(s)] || "orange");
  const statusLabel = (s) => ({ accepted: "✅ Acceptée", rejected: "❌ Refusée", interview: "📞 Entretien", reviewing: "👀 Présélectionnée" }[normalizeStatus(s)] || "⏳ En attente");

  const completionFields = [profile.name, profile.email, profile.phone, profile.school, profile.field, profile.photo_url, profile.cv_name];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  const menuItems = [
    { icon: HomeIcon,           label: "Tableau de bord",     path: "/student" },
    { icon: BriefcaseIcon,      label: "Offres de stage",     path: "/student/offers" },
    { icon: CheckCircleIcon,    label: "Mes candidatures",    path: "/student/applications" },
    { icon: BookmarkIcon,       label: "Offres sauvegardées", path: "/student/saved" },
    { icon: ChatBubbleLeftIcon, label: "Messages",            path: "/student/messages" },
    { icon: UserCircleIcon,     label: "Mon profil",          path: "/student/profile" },
  ];

  const sections = [
    { id: "personal",      label: "Infos personnelles", icon: UserCircleIcon },
    { id: "cv",            label: "CV & Documents",      icon: DocumentArrowUpIcon },
    { id: "applications",  label: "Historique",          icon: BriefcaseIcon },
    { id: "password",      label: "Mot de passe",        icon: LockClosedIcon },
  ];

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <Typography variant="small" className="text-blue-gray-500">Chargement du profil...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-6 border-b border-blue-gray-100">
          <Typography variant="h5" className="font-bold text-blue-500">🎓 MyStage</Typography>
          <Typography variant="small" className="text-blue-gray-500">Plateforme de stages</Typography>
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
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <Typography variant="small" className="text-blue-gray-600 mb-1">Votre progression</Typography>
            <Progress value={completionPct} color="blue" className="h-2" />
            <Typography variant="caption" className="text-blue-gray-500 mt-2">{completionPct}% de profil complet</Typography>
          </div>
        </div>
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
          <div className="p-8 max-w-5xl mx-auto">

            {/* ✅ Photo + Nom + Progression */}
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
                    <Typography variant="h4" className="font-bold text-blue-gray-900 mb-1">
                      {profile.name || "Votre nom"}
                    </Typography>
                    <Typography className="text-blue-500 font-medium mb-1">
                      {profile.field || "Domaine d'études"}
                    </Typography>
                    <Typography variant="small" className="text-blue-gray-500 mb-4">
                      {profile.school || "Établissement"} {profile.graduation_year ? `• Promotion ${profile.graduation_year}` : ""}
                    </Typography>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
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
                      {profile.address && (
                        <span className="flex items-center gap-1 text-xs text-blue-gray-600 bg-blue-gray-50 px-3 py-1 rounded-full">
                          <MapPinIcon className="w-3 h-3" /> {profile.address}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progression */}
                  <div className="flex-shrink-0 text-center">
                    <div className="relative w-20 h-20 mx-auto mb-2">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"
                          strokeDasharray={`${completionPct} 100`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-blue-600">
                        {completionPct}%
                      </span>
                    </div>
                    <Typography variant="small" className="text-blue-gray-500">Profil complété</Typography>
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
                    <Typography variant="h6" className="font-bold text-blue-gray-900">
                      👤 Informations personnelles
                    </Typography>
                    <Button
                      size="sm"
                      color={editMode ? "green" : "blue"}
                      variant="outlined"
                      onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {editMode ? <CheckIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
                      {editMode ? (loading ? "Enregistrement..." : "Enregistrer") : "Modifier"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Nom complet",       name: "name",            icon: UserCircleIcon,  type: "text",  placeholder: "Votre nom complet" },
                      { label: "Email",              name: "email",           icon: EnvelopeIcon,    type: "email", placeholder: "votre@email.com" },
                      { label: "Téléphone",          name: "phone",           icon: PhoneIcon,       type: "tel",   placeholder: "+216 XX XXX XXX" },
                      { label: "Adresse",            name: "address",         icon: MapPinIcon,      type: "text",  placeholder: "Ville, Pays" },
                      { label: "Établissement",      name: "school",          icon: AcademicCapIcon, type: "text",  placeholder: "Nom de votre école" },
                      { label: "Domaine d'études",   name: "field",           icon: BriefcaseIcon,   type: "text",  placeholder: "Ex: Informatique" },
                      { label: "Année de diplôme",   name: "graduation_year", icon: AcademicCapIcon, type: "number", placeholder: "2025" },
                    ].map(({ label, name, icon: Icon, type, placeholder }) => (
                      <div key={name}>
                        <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">{label}</Typography>
                        {editMode ? (
                          <Input
                            type={type}
                            placeholder={placeholder}
                            value={profile[name] || ""}
                            onChange={(e) => setProfile((prev) => ({ ...prev, [name]: e.target.value }))}
                            icon={<Icon className="w-5 h-5" />}
                            className="!border-blue-gray-300"
                          />
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

                    {/* Bio */}
                    <div className="md:col-span-2">
                      <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Bio / Présentation</Typography>
                      {editMode ? (
                        <textarea
                          rows={4}
                          placeholder="Parlez de vous en quelques mots..."
                          value={profile.bio || ""}
                          onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                          className="w-full px-3 py-2 border border-blue-gray-300 rounded-lg text-sm text-blue-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-blue-gray-50 rounded-lg min-h-[80px]">
                          <Typography variant="small" className="text-blue-gray-700">
                            {profile.bio || <span className="text-blue-gray-400 italic">Aucune biographie renseignée</span>}
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
                      <Button color="blue-gray" variant="outlined" onClick={() => { setEditMode(false); fetchProfile(); }}>
                        Annuler
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* ✅ Section : CV & Documents */}
            {activeSection === "cv" && (
              <Card className="shadow-sm border border-blue-gray-100">
                <CardBody className="p-8">
                  <Typography variant="h6" className="font-bold text-blue-gray-900 mb-6">
                    📄 CV & Documents
                  </Typography>

                  {/* Upload CV */}
                  <div className="mb-8">
                    <Typography variant="small" className="font-semibold text-blue-gray-900 mb-4 block">
                      Curriculum Vitae (PDF)
                    </Typography>

                    {profile.cv_name ? (
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="text-red-600 font-bold text-xs">PDF</span>
                          </div>
                          <div>
                            <Typography variant="small" className="font-semibold text-blue-gray-900">
                              {profile.cv_name}
                            </Typography>
                            <Typography variant="small" className="text-green-600">✓ CV téléchargé</Typography>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" color="blue" variant="outlined" onClick={() => cvInputRef.current?.click()}>
                            Remplacer
                          </Button>
                          <IconButton size="sm" color="red" variant="outlined" onClick={() => setProfile((p) => ({ ...p, cv: null, cv_name: null }))}>
                            <TrashIcon className="w-4 h-4" />
                          </IconButton>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => cvInputRef.current?.click()}
                        className="border-2 border-dashed border-blue-gray-300 hover:border-blue-400 rounded-xl p-10 text-center cursor-pointer transition group"
                      >
                        <DocumentArrowUpIcon className="w-12 h-12 mx-auto text-blue-gray-300 group-hover:text-blue-400 mb-3 transition" />
                        <Typography className="text-blue-gray-500 mb-1">Cliquez pour télécharger votre CV</Typography>
                        <Typography variant="small" className="text-blue-gray-400">PDF uniquement • Max 5MB</Typography>
                      </div>
                    )}
                    <input ref={cvInputRef} type="file" accept=".pdf" className="hidden" onChange={handleCvChange} />
                  </div>

                  {profile.cv && (
                    <Button color="blue" onClick={handleSaveProfile} disabled={loading} className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4" />
                      {loading ? "Enregistrement..." : "Sauvegarder le CV"}
                    </Button>
                  )}
                </CardBody>
              </Card>
            )}

            {/* ✅ Section : Historique candidatures */}
            {activeSection === "applications" && (
              <Card className="shadow-sm border border-blue-gray-100">
                <CardBody className="p-8">
                  <Typography variant="h6" className="font-bold text-blue-gray-900 mb-6">
                    📋 Historique des candidatures ({applications.length})
                  </Typography>

                  {applications.length === 0 ? (
                    <div className="text-center py-12">
                      <BriefcaseIcon className="w-12 h-12 mx-auto text-blue-gray-300 mb-3" />
                      <Typography className="text-blue-gray-500">Aucune candidature pour le moment</Typography>
                      <Link to="/student/offers">
                        <Button color="blue" size="sm" className="mt-4">Découvrir les offres</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-4 border border-blue-gray-100 rounded-xl hover:bg-blue-gray-50 transition">
                          <div className="flex-1">
                            <Typography variant="h6" className="font-bold text-blue-gray-900 mb-1">
                              {app.offer?.title || "Offre inconnue"}
                            </Typography>
                            <Typography variant="small" className="text-blue-500 font-medium mb-1">
                              {app.offer?.enterprise?.name || "Entreprise"}
                            </Typography>
                            <div className="flex flex-wrap gap-3 text-xs text-blue-gray-500">
                              <span>📍 {app.offer?.location || "N/A"}</span>
                              <span>⏱️ {app.offer?.duration || "N/A"}</span>
                              <span>📅 Début : {formatDate(app.offer?.start_date)}</span>
                              <span>🗓️ Postulé le {formatDate(app.created_at)}</span>
                            </div>
                          </div>
                          <Chip
                            value={statusLabel(app.status)}
                            color={statusColor(app.status)}
                            size="sm"
                            className="ml-4 font-semibold flex-shrink-0"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* ✅ Section : Mot de passe */}
            {activeSection === "password" && (
              <Card className="shadow-sm border border-blue-gray-100">
                <CardBody className="p-8">
                  <Typography variant="h6" className="font-bold text-blue-gray-900 mb-6">
                    🔒 Modifier le mot de passe
                  </Typography>

                  <div className="max-w-md space-y-5">
                    {/* Mot de passe actuel */}
                    <div>
                      <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Mot de passe actuel</Typography>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwords.current_password}
                          onChange={(e) => setPasswords((p) => ({ ...p, current_password: e.target.value }))}
                          icon={<LockClosedIcon className="w-5 h-5" />}
                          className="!border-blue-gray-300"
                        />
                        <IconButton variant="text" size="sm" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2">
                          {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </IconButton>
                      </div>
                    </div>

                    {/* Nouveau mot de passe */}
                    <div>
                      <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Nouveau mot de passe</Typography>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwords.new_password}
                          onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
                          icon={<LockClosedIcon className="w-5 h-5" />}
                          className="!border-blue-gray-300"
                        />
                        <IconButton variant="text" size="sm" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-1/2 -translate-y-1/2">
                          {showNewPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </IconButton>
                      </div>
                      {passwords.new_password && (
                        <div className="mt-2">
                          <Progress
                            value={passwords.new_password.length >= 12 ? 100 : passwords.new_password.length >= 8 ? 66 : 33}
                            color={passwords.new_password.length >= 12 ? "green" : passwords.new_password.length >= 8 ? "amber" : "red"}
                            className="h-1"
                          />
                          <Typography variant="small" className="text-blue-gray-500 mt-1">
                            {passwords.new_password.length >= 12 ? "Fort" : passwords.new_password.length >= 8 ? "Moyen" : "Faible"}
                          </Typography>
                        </div>
                      )}
                    </div>

                    {/* Confirmation */}
                    <div>
                      <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">Confirmer le nouveau mot de passe</Typography>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={passwords.new_password_confirmation}
                        onChange={(e) => setPasswords((p) => ({ ...p, new_password_confirmation: e.target.value }))}
                        icon={<LockClosedIcon className="w-5 h-5" />}
                        className="!border-blue-gray-300"
                        error={passwords.new_password_confirmation && passwords.new_password !== passwords.new_password_confirmation}
                        success={passwords.new_password_confirmation && passwords.new_password === passwords.new_password_confirmation}
                      />
                      {passwords.new_password_confirmation && passwords.new_password !== passwords.new_password_confirmation && (
                        <Typography variant="small" className="text-red-500 mt-1">Les mots de passe ne correspondent pas</Typography>
                      )}
                    </div>

                    <Button color="blue" onClick={handleChangePassword} disabled={loading} className="flex items-center gap-2 mt-2">
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
