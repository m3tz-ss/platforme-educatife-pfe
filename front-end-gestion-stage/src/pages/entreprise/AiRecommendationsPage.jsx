import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Button,
  Typography,
  Card,
  CardBody,
  Select,
  Option,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import {
  SparklesIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  XMarkIcon,
  HomeIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CalendarIcon,
  UsersIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import api from "../../services/api";
import BaseLayout from "../../components/layout/BaseLayout";
import { EnterpriseSidebarHeader } from "../../components/layout/SidebarHeaders";
import NotificationBell from "../../components/layout/NotificationBell";
import CandidateHistoryModal from "../../components/CandidateHistoryModal";

// ─── helpers ─────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return "N/A";
  try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};
const formatDateTime = (d) => {
  if (!d) return "N/A";
  try { return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return d; }
};
const getScoreColor = (s) => {
  if (s >= 80) return { text: "text-emerald-600", bg: "bg-emerald-500", ring: "ring-emerald-200" };
  if (s >= 60) return { text: "text-amber-600",   bg: "bg-amber-400",   ring: "ring-amber-200"   };
  return              { text: "text-red-500",      bg: "bg-red-400",     ring: "ring-red-200"     };
};
const PROPOSAL_STATUS = {
  pending:  { label: "En attente",  cls: "bg-amber-100 text-amber-700",     dot: "bg-amber-400"   },
  accepted: { label: "Acceptée",    cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  rejected: { label: "Refusée",     cls: "bg-red-100 text-red-600",         dot: "bg-red-400"     },
  sent:     { label: "Envoyée",     cls: "bg-blue-100 text-blue-700",       dot: "bg-blue-500"    },
};

const getCvUrl = (p) => {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/storage/${p}`;
};

const avatarColors = ["bg-blue-500","bg-indigo-500","bg-cyan-500","bg-teal-500","bg-purple-500","bg-violet-500","bg-green-500","bg-orange-500"];
const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AiRecommendationsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const enterpriseRole = localStorage.getItem("entrepriseRole") || user.type || "rh";

  const [userData,        setUserData]        = useState(null);
  const [offers,          setOffers]          = useState([]);
  const [loadingOffers,   setLoadingOffers]   = useState(true);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [selectedOffer,   setSelectedOffer]   = useState(null);

  // IA
  const [aiStudents,  setAiStudents]  = useState([]);
  const [loadingAi,   setLoadingAi]   = useState(false);
  const [aiError,     setAiError]     = useState(null);
  const [aiCached,    setAiCached]    = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Contact modal
  const [contactModal,       setContactModal]       = useState({ open: false, student: null, offer: null });
  const [personalMessage,    setPersonalMessage]    = useState("");
  const [sendingProposal,    setSendingProposal]    = useState(false);
  const [proposedStudentIds, setProposedStudentIds] = useState(new Set());

  // Onglets principaux
  const [activeMainTab, setActiveMainTab] = useState("recommendations");

  // ─── Historique propositions IA ─────────────────────────────────────────────
  const [history,         setHistory]         = useState([]);
  const [loadingHistory,  setLoadingHistory]  = useState(false);
  const [historyError,    setHistoryError]    = useState(null);
  const [historySearch,   setHistorySearch]   = useState("");
  const [historyFilter,   setHistoryFilter]   = useState("all");
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [historyPage,     setHistoryPage]     = useState(1);

  // ─── CandidateHistoryModal ───────────────────────────────────────────────────
  const [selectedStudent,    setSelectedStudent]    = useState(null);
  const [openHistoryModal,   setOpenHistoryModal]   = useState(false);
  const [candidateHistory,   setCandidateHistory]   = useState(null);
  const [historyLoading,     setHistoryLoading]     = useState(false);

  const PER_PAGE = 8;

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchUserData(); fetchOffers(); }, []);
  useEffect(() => { if (activeMainTab === "history") fetchHistory(); }, [activeMainTab]);

  const fetchUserData = async () => {
    try { const r = await api.get("/user/profile"); setUserData(r.data); }
    catch { setUserData(user); }
  };
  const fetchOffers = async () => {
    try {
      setLoadingOffers(true);
      const r = await api.get("/offers?per_page=100&page=1");
      setOffers(r.data.data || []);
    } catch { } finally { setLoadingOffers(false); }
  };
  const fetchAiStudents = async (id) => {
    setLoadingAi(true); setAiError(null); setAiStudents([]);
    try {
      const r = await api.get(`/rh/offers/${id}/recommend-students`);
      setAiStudents(r.data.recommendations || []);
      setAiCached(r.data.cached || false);
    } catch (e) { setAiError(e.response?.data?.message || "Erreur IA."); }
    finally { setLoadingAi(false); }
  };
  const fetchHistory = async () => {
    setLoadingHistory(true); setHistoryError(null);
    try {
      const r = await api.get("/rh/offer-proposals");
      setHistory(Array.isArray(r.data) ? r.data : (r.data.data || []));
    } catch (e) { setHistoryError(e.response?.data?.message || "Impossible de charger l'historique."); }
    finally { setLoadingHistory(false); }
  };

  // ─── CandidateHistory handler ─────────────────────────────────────────────
  const handleViewCandidateHistory = async (student) => {
    if (!student?.id) return;
    setSelectedStudent(student);
    setOpenHistoryModal(true);
    setHistoryLoading(true);
    setCandidateHistory(null);
    try {
      const res = await api.get(`/rh/candidates/${student.id}/history`);
      setCandidateHistory(res.data);
    } catch (err) {
      console.error("Erreur historique candidat:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de charger l'historique du candidat.",
        confirmButtonColor: "#ef4444",
      });
      setOpenHistoryModal(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ─── Selects / actions ────────────────────────────────────────────────────
  const handleSelectOffer = (id) => {
    setSelectedOfferId(id);
    const o = offers.find((x) => String(x.id) === String(id));
    setSelectedOffer(o || null);
    setAiStudents([]); setAiError(null); setAiCached(false); setProposedStudentIds(new Set());
    if (id) fetchAiStudents(id);
  };
  const handleOpenContact = (student, offer) => { setContactModal({ open: true, student, offer }); setPersonalMessage(""); };
  const handleSendProposal = async () => {
    const { student, offer } = contactModal;
    if (!student || !offer) return;
    try {
      setSendingProposal(true);
      await api.post("/rh/offer-proposals", { offer_id: offer.id, student_id: student.id, personal_message: personalMessage });
      setProposedStudentIds((prev) => new Set([...prev, student.id]));
      setContactModal({ open: false, student: null, offer: null });
      Swal.fire({ icon: "success", title: "📬 Proposition envoyée !", text: `${student.name} a reçu votre proposition.`, timer: 3000, timerProgressBar: true, showConfirmButton: false });
      if (activeMainTab === "history") fetchHistory();
    } catch (e) {
      const msg = e.response?.data?.message || "Erreur lors de l'envoi.";
      e.response?.status === 409
        ? Swal.fire({ icon: "warning", title: "Déjà envoyé", text: msg, confirmButtonColor: "#f59e0b" })
        : Swal.fire({ icon: "error",   title: "Erreur",      text: msg, confirmButtonColor: "#ef4444" });
    } finally { setSendingProposal(false); }
  };

  // ─── Filtered data ────────────────────────────────────────────────────────
  const filteredStudents = aiStudents.filter((rec) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return rec.student?.name?.toLowerCase().includes(q) || rec.student?.field?.toLowerCase().includes(q)
      || rec.student?.school?.toLowerCase().includes(q) || rec.student?.skills?.some((s) => s.toLowerCase().includes(q));
  });

  const filteredHistory = history.filter((h) => {
    const matchStatus = historyFilter === "all" || h.status === historyFilter;
    const q = historySearch.toLowerCase();
    return matchStatus && (!q || h.student?.name?.toLowerCase().includes(q) || h.offer?.title?.toLowerCase().includes(q));
  });
  const paginatedHistory     = filteredHistory.slice((historyPage - 1) * PER_PAGE, historyPage * PER_PAGE);
  const totalHistoryPages    = Math.ceil(filteredHistory.length / PER_PAGE);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const avgScore = aiStudents.length ? Math.round(aiStudents.reduce((a, r) => a + (r.score || 0), 0) / aiStudents.length) : 0;
  const topScore = aiStudents.length ? Math.max(...aiStudents.map((r) => r.score || 0)) : 0;
  const hStats   = { total: history.length, pending: history.filter(h => !h.status || h.status==="pending").length, accepted: history.filter(h=>h.status==="accepted").length, rejected: history.filter(h=>h.status==="rejected").length };

  // ─── Sidebar ──────────────────────────────────────────────────────────────
  const menuItems = [
    { icon: HomeIcon,           label: "Tableau de bord",   path: "/enterprise/offers",             badge: null },
    { icon: BriefcaseIcon,      label: "Mes offres",         path: "/enterprise/offersliste",        badge: offers.length },
    { icon: SparklesIcon,       label: "Recommandations IA", path: "/enterprise/ai-recommendations", badge: null },
    { icon: CheckCircleIcon,    label: "Candidatures",       path: "/enterprise/condidateurliste",   badge: null },
    { icon: ChatBubbleLeftIcon, label: "Entretiens",         path: "/enterprise/enterview",          badge: null },
    { icon: UserCircleIcon,     label: "Mon profil",         path: "/enterprise/profile",            badge: null },
  ];
  const roleConfigs = {
    manager:    { label: "Manager",    color: "blue",   icon: "🏢" },
    rh:         { label: "RH",         color: "green",  icon: "👥" },
    encadrant:  { label: "Encadrant",  color: "purple", icon: "🎓" },
    enterprise: { label: "Entreprise", color: "blue",   icon: "🏢" },
  };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <BaseLayout
        title="Recommandations IA"
        menuItems={menuItems}
        sidebarHeader={
          <EnterpriseSidebarHeader name={userData?.name} email={userData?.email}
            photoUrl={userData?.photo_url} enterpriseName={userData?.company_name}
            logoUrl={userData?.logo_url} roleConfig={roleConfigs[enterpriseRole]} />
        }
        sidebarExtra={
          <div className="bg-purple-50 rounded-lg p-4 space-y-2">
            <Typography variant="small" className="text-purple-700 font-semibold">✨ IA Active</Typography>
            <Typography variant="small" className="text-blue-gray-500 text-xs">Matching automatique des profils étudiants</Typography>
            {history.length > 0 && (
              <div className="pt-1 border-t border-purple-100">
                <Typography variant="small" className="text-blue-gray-500 text-xs">{history.length} proposition(s) envoyée(s)</Typography>
              </div>
            )}
          </div>
        }
        headerActions={<NotificationBell apiPrefix="rh" />}
      >
        <div className="space-y-6">

          {/* ── Hero ───────────────────────────────────────────────────────── */}
          <div className="relative rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white shadow-lg">
            <div className="absolute top-2 right-4 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
            <div className="absolute bottom-2 left-20 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <Typography variant="h5" className="font-extrabold tracking-tight">Recommandations IA</Typography>
                  <Typography variant="small" className="text-purple-200">Matching intelligent + historique des propositions</Typography>
                </div>
              </div>
              {activeMainTab === "recommendations" && (
                <div className="md:ml-auto w-full md:w-80">
                  <Select label="Choisir une offre" value={selectedOfferId ? String(selectedOfferId) : ""}
                    onChange={handleSelectOffer} disabled={loadingOffers} menuProps={{ className: "z-[9999]" }}>
                    {offers.map((o) => <Option key={o.id} value={String(o.id)}>{o.title}</Option>)}
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* ── Tabs principaux ─────────────────────────────────────────────── */}
          <div className="flex gap-1 border-b border-blue-gray-100">
            {[
              { key: "recommendations", label: "🤖 Recommandations IA",     count: filteredStudents.length || null },
              { key: "history",         label: "📋 Historique propositions", count: history.length || null },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveMainTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
                  activeMainTab === tab.key
                    ? "border-purple-600 text-purple-700 bg-purple-50"
                    : "border-transparent text-blue-gray-500 hover:text-blue-gray-800 hover:bg-blue-gray-50"
                }`}>
                {tab.label}
                {tab.count !== null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    activeMainTab === tab.key ? "bg-purple-200 text-purple-700" : "bg-blue-gray-100 text-blue-gray-500"
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 : RECOMMANDATIONS
          ══════════════════════════════════════════════════════════════════ */}
          {activeMainTab === "recommendations" && (
            <>
              {aiStudents.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label:"Profils analysés", value: aiStudents.length,      icon:"👥", color:"text-purple-600" },
                    { label:"Score moyen",       value:`${avgScore}%`,          icon:"📊", color:"text-blue-600"   },
                    { label:"Meilleur score",    value:`${topScore}%`,          icon:"🏆", color:"text-emerald-600"},
                    { label:"Propositions",      value: proposedStudentIds.size,icon:"📨", color:"text-orange-500" },
                  ].map((s) => (
                    <Card key={s.label} className="p-4 shadow-sm border border-purple-100 hover:shadow-md transition">
                      <div className="flex items-center gap-2 mb-1"><span className="text-lg">{s.icon}</span>
                        <Typography variant="small" className="text-blue-gray-500 text-xs">{s.label}</Typography>
                      </div>
                      <Typography className={`text-2xl font-extrabold ${s.color}`}>{s.value}</Typography>
                    </Card>
                  ))}
                </div>
              )}

              {aiStudents.length > 0 && (
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 text-blue-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Filtrer par nom, domaine, école…" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-blue-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 transition" />
                </div>
              )}

              {!selectedOfferId && !loadingAi && (
                <Card className="border border-dashed border-purple-200 bg-purple-50/40">
                  <CardBody className="flex flex-col items-center py-16 text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <SparklesIcon className="w-10 h-10 text-purple-400" />
                    </div>
                    <Typography variant="h6" className="text-purple-700 font-bold mb-2">Sélectionnez une offre</Typography>
                    <Typography variant="small" className="text-blue-gray-500 max-w-xs">
                      Choisissez une offre dans le menu ci-dessus pour lancer l'analyse IA.
                    </Typography>
                  </CardBody>
                </Card>
              )}

              {loadingAi && (
                <Card className="border border-purple-100">
                  <CardBody className="flex flex-col items-center py-16 gap-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-purple-100 border-t-purple-500 animate-spin" />
                      <SparklesIcon className="w-7 h-7 text-purple-400 absolute inset-0 m-auto" />
                    </div>
                    <div className="text-center">
                      <Typography className="text-purple-600 font-semibold animate-pulse">L'IA analyse les profils…</Typography>
                      <Typography variant="small" className="text-blue-gray-400 mt-1">Matching pour « {selectedOffer?.title} »</Typography>
                    </div>
                  </CardBody>
                </Card>
              )}

              {!loadingAi && aiError && (
                <Card className="border border-red-200 bg-red-50">
                  <CardBody className="flex items-start gap-4 py-6">
                    <span className="text-3xl">⚠️</span>
                    <div>
                      <Typography className="font-bold text-red-700">Erreur IA</Typography>
                      <Typography variant="small" className="text-red-500 mt-1">{aiError}</Typography>
                      <button onClick={() => fetchAiStudents(selectedOfferId)} className="mt-3 text-sm text-red-600 underline">Réessayer</button>
                    </div>
                  </CardBody>
                </Card>
              )}

              {!loadingAi && !aiError && selectedOfferId && aiStudents.length === 0 && (
                <Card className="border border-blue-gray-100">
                  <CardBody className="flex flex-col items-center py-14 text-center">
                    <AcademicCapIcon className="w-14 h-14 text-blue-gray-300 mb-4" />
                    <Typography className="text-blue-gray-500 font-medium">Aucune recommandation disponible.</Typography>
                  </CardBody>
                </Card>
              )}

              {!loadingAi && !aiError && filteredStudents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-purple-500" />
                      <Typography variant="h6" className="font-bold text-purple-700">Top {filteredStudents.length} Profils</Typography>
                      {aiCached && <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full font-medium">⚡ Cache</span>}
                    </div>
                    <button onClick={() => fetchAiStudents(selectedOfferId)} className="text-xs text-purple-500 hover:text-purple-700 font-medium flex items-center gap-1">
                      <ArrowPathIcon className="w-3 h-3" /> Actualiser
                    </button>
                  </div>

                  {selectedOffer && (
                    <div className="mb-5 flex flex-wrap gap-2 items-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <span className="text-xs font-semibold text-purple-700">Offre :</span>
                      <span className="text-xs font-bold text-blue-gray-800">{selectedOffer.title}</span>
                      {selectedOffer.domain   && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">💼 {selectedOffer.domain}</span>}
                      {selectedOffer.location && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">📍 {selectedOffer.location}</span>}
                      {selectedOffer.duration && <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">⏱️ {selectedOffer.duration}</span>}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {filteredStudents.map((rec, idx) => {
                      const sc = getScoreColor(rec.score);
                      const isProposed = proposedStudentIds.has(rec.student?.id);
                      return (
                        <div key={rec.student_id} className="relative border border-purple-100 rounded-2xl p-5 bg-white hover:shadow-lg transition-all flex flex-col gap-3">
                          <div className="absolute -top-3 -left-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow">{idx + 1}</div>
                          </div>
                          <div className="flex items-start justify-between gap-3 pt-1">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                                {rec.student?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <Typography className="font-bold text-blue-gray-900 text-sm leading-tight">{rec.student?.name || "Étudiant"}</Typography>
                                {rec.student?.email && (
                                  <span className="flex items-center gap-1 text-xs text-blue-gray-400">
                                    <EnvelopeIcon className="w-3 h-3 flex-shrink-0" />{rec.student.email}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={`flex-shrink-0 w-14 h-14 rounded-full ring-4 ${sc.ring} flex flex-col items-center justify-center`}>
                              <span className={`text-base font-extrabold leading-none ${sc.text}`}>{rec.score}%</span>
                              <span className="text-[9px] text-blue-gray-400 leading-none mt-0.5">match</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full transition-all duration-700 ${sc.bg}`} style={{ width: `${rec.score}%` }} />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.student?.field        && <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">🎓 {rec.student.field}</span>}
                            {rec.student?.school       && <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">🏫 {rec.student.school}</span>}
                            {rec.student?.graduation_year && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">📅 Promo {rec.student.graduation_year}</span>}
                            {rec.student?.cv_path ? (
                              <a href={getCvUrl(rec.student.cv_path)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium hover:bg-emerald-100 transition flex items-center gap-1">📎 CV</a>
                            ) : (
                              <span className="bg-gray-100 text-gray-400 text-xs px-2 py-0.5 rounded-full font-medium">Pas de CV</span>
                            )}
                          </div>
                          {rec.student?.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {rec.student.skills.slice(0, 6).map((sk, si) => (
                                <span key={si} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-md font-medium border border-purple-100">{sk}</span>
                              ))}
                              {rec.student.skills.length > 6 && <span className="text-xs text-blue-gray-400 self-center">+{rec.student.skills.length - 6}</span>}
                            </div>
                          )}
                          {rec.reason && (
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-3">
                              <p className="text-xs text-purple-600 font-semibold mb-1 flex items-center gap-1"><SparklesIcon className="w-3 h-3" /> Analyse IA</p>
                              <p className="text-xs text-blue-gray-600 leading-relaxed">{rec.reason}</p>
                            </div>
                          )}

                          {/* ✅ Boutons : Historique + Contacter */}
                          <div className="mt-auto flex gap-2">
                            {/* Historique des stages du candidat */}
                            <button
                              onClick={() => handleViewCandidateHistory(rec.student)}
                              className="flex-shrink-0 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                              title="Voir l'historique des stages"
                            >
                              <ClockIcon className="w-3.5 h-3.5" />
                              Historique
                            </button>

                            {/* Contacter & Proposer */}
                            <button
                              onClick={() => handleOpenContact(rec.student, selectedOffer)}
                              disabled={isProposed}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                                isProposed
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md hover:scale-[1.01]"
                              }`}
                            >
                              {isProposed ? "✅ Proposition envoyée" : "📨 Contacter & Proposer"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 : HISTORIQUE PROPOSITIONS IA
          ══════════════════════════════════════════════════════════════════ */}
          {activeMainTab === "history" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label:"Total envoyées", value: hStats.total,    color:"text-blue-gray-800", bg:"bg-blue-gray-50", icon:"📨" },
                  { label:"En attente",     value: hStats.pending,  color:"text-amber-600",     bg:"bg-amber-50",     icon:"⏳" },
                  { label:"Acceptées",      value: hStats.accepted, color:"text-emerald-600",   bg:"bg-emerald-50",   icon:"✅" },
                  { label:"Refusées",       value: hStats.rejected, color:"text-red-500",       bg:"bg-red-50",       icon:"❌" },
                ].map((s) => (
                  <Card key={s.label} className={`p-4 border-0 shadow-sm ${s.bg}`}>
                    <div className="flex items-center gap-2 mb-1"><span>{s.icon}</span>
                      <Typography variant="small" className="text-blue-gray-500 text-xs">{s.label}</Typography>
                    </div>
                    <Typography className={`text-2xl font-extrabold ${s.color}`}>{s.value}</Typography>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="w-4 h-4 text-blue-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Rechercher étudiant, offre…" value={historySearch}
                    onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                    className="w-full pl-9 pr-4 py-2.5 border border-blue-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 transition" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[{key:"all",label:"Tous"},{key:"pending",label:"En attente"},{key:"accepted",label:"Acceptées"},{key:"rejected",label:"Refusées"}].map((f) => (
                    <button key={f.key} onClick={() => { setHistoryFilter(f.key); setHistoryPage(1); }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        historyFilter === f.key ? "bg-purple-600 text-white border-purple-600" : "bg-white text-blue-gray-600 border-blue-gray-200 hover:border-purple-300"
                      }`}>
                      {f.label}
                    </button>
                  ))}
                  <button onClick={fetchHistory} className="px-3 py-2 rounded-xl text-xs font-semibold border border-blue-gray-200 bg-white text-blue-gray-600 hover:border-purple-300 flex items-center gap-1 transition">
                    <ArrowPathIcon className="w-3 h-3" /> Actualiser
                  </button>
                </div>
              </div>

              {loadingHistory && (
                <div className="flex items-center justify-center py-12 gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-purple-200 border-t-purple-500 animate-spin" />
                  <Typography variant="small" className="text-purple-400 animate-pulse">Chargement…</Typography>
                </div>
              )}
              {!loadingHistory && historyError && (
                <Card className="border border-red-200 bg-red-50">
                  <CardBody className="flex items-start gap-3 py-5">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <Typography className="font-bold text-red-700 text-sm">Erreur</Typography>
                      <Typography variant="small" className="text-red-500">{historyError}</Typography>
                      <button onClick={fetchHistory} className="mt-2 text-xs text-red-600 underline">Réessayer</button>
                    </div>
                  </CardBody>
                </Card>
              )}
              {!loadingHistory && !historyError && filteredHistory.length === 0 && (
                <Card className="border border-dashed border-blue-gray-200">
                  <CardBody className="flex flex-col items-center py-14 text-center">
                    <ClockIcon className="w-14 h-14 text-blue-gray-300 mb-4" />
                    <Typography className="text-blue-gray-500 font-medium">
                      {history.length === 0 ? "Aucune proposition envoyée." : "Aucun résultat."}
                    </Typography>
                  </CardBody>
                </Card>
              )}

              {!loadingHistory && !historyError && paginatedHistory.length > 0 && (
                <div className="space-y-3">
                  {paginatedHistory.map((item) => {
                    const sc = PROPOSAL_STATUS[item.status || "sent"] || PROPOSAL_STATUS.sent;
                    const isExp = expandedHistory === item.id;
                    return (
                      <div key={item.id} className={`border rounded-2xl bg-white transition-all ${isExp ? "border-purple-300 shadow-md" : "border-blue-gray-100 hover:border-purple-200 hover:shadow-sm"}`}>
                        <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedHistory(isExp ? null : item.id)}>
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {item.student?.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Typography className="font-bold text-blue-gray-900 text-sm truncate">{item.student?.name || "Étudiant"}</Typography>
                              {item.student?.field && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{item.student.field}</span>}
                            </div>
                            <Typography variant="small" className="text-blue-gray-400 truncate">📋 {item.offer?.title || "Offre inconnue"}</Typography>
                          </div>
                          <div className="hidden sm:block flex-shrink-0">
                            <Typography variant="small" className="text-blue-gray-400 text-xs"><ClockIcon className="w-3 h-3 inline mr-0.5" />{formatDateTime(item.created_at)}</Typography>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${sc.cls}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                          </div>
                          {/* ✅ Bouton historique inline dans la liste */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewCandidateHistory(item.student); }}
                            className="hidden sm:flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition flex-shrink-0"
                            title="Historique des stages"
                          >
                            <ClockIcon className="w-3 h-3" /> Historique
                          </button>
                          {isExp ? <ChevronUpIcon className="w-4 h-4 text-blue-gray-300 flex-shrink-0" /> : <ChevronDownIcon className="w-4 h-4 text-blue-gray-300 flex-shrink-0" />}
                        </div>
                        {isExp && (
                          <div className="px-4 pb-4 pt-0 space-y-3 border-t border-purple-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                              <div className="bg-purple-50 rounded-xl p-3 space-y-1">
                                <Typography variant="small" className="font-semibold text-purple-700 text-xs uppercase">Étudiant</Typography>
                                <Typography className="font-bold text-sm">{item.student?.name}</Typography>
                                {item.student?.email && <p className="text-xs text-blue-gray-500 flex items-center gap-1"><EnvelopeIcon className="w-3 h-3" />{item.student.email}</p>}
                                {item.student?.school && <p className="text-xs text-blue-gray-500">🏫 {item.student.school}</p>}
                                {item.student?.cv_path && <a href={getCvUrl(item.student.cv_path)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-600 hover:underline font-medium">📎 Voir CV</a>}
                                {/* ✅ Bouton historique dans le détail expandé */}
                                <button
                                  onClick={() => handleViewCandidateHistory(item.student)}
                                  className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition"
                                >
                                  <ClockIcon className="w-3 h-3" /> Voir l'historique des stages
                                </button>
                              </div>
                              <div className="bg-blue-50 rounded-xl p-3 space-y-1">
                                <Typography variant="small" className="font-semibold text-blue-700 text-xs uppercase">Offre</Typography>
                                <Typography className="font-bold text-sm">{item.offer?.title || "—"}</Typography>
                                {item.offer?.domain   && <p className="text-xs text-blue-gray-500">💼 {item.offer.domain}</p>}
                                {item.offer?.location && <p className="text-xs text-blue-gray-500">📍 {item.offer.location}</p>}
                                {item.offer?.duration && <p className="text-xs text-blue-gray-500">⏱️ {item.offer.duration}</p>}
                              </div>
                            </div>
                            {item.personal_message && (
                              <div className="bg-white border border-purple-100 rounded-xl p-3">
                                <Typography variant="small" className="font-semibold text-purple-600 mb-1 text-xs uppercase">Message envoyé</Typography>
                                <Typography variant="small" className="text-blue-gray-600 leading-relaxed">{item.personal_message}</Typography>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs text-blue-gray-400">
                              <span>🕐 Envoyé le {formatDateTime(item.created_at)}</span>
                              {item.updated_at && item.updated_at !== item.created_at && <span>🔄 Mis à jour le {formatDateTime(item.updated_at)}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {totalHistoryPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button onClick={() => setHistoryPage(p => Math.max(1,p-1))} disabled={historyPage===1}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium text-blue-gray-600 disabled:opacity-40 hover:border-purple-300 transition">← Précédent</button>
                  <span className="text-xs text-blue-gray-500">Page <strong>{historyPage}</strong> / {totalHistoryPages}</span>
                  <button onClick={() => setHistoryPage(p => Math.min(totalHistoryPages,p+1))} disabled={historyPage===totalHistoryPages}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium text-blue-gray-600 disabled:opacity-40 hover:border-purple-300 transition">Suivant →</button>
                </div>
              )}
            </div>
          )}

        </div>
      </BaseLayout>

      {/* ── Modal contact ─────────────────────────────────────────────────── */}
      <Dialog open={contactModal.open} handler={() => setContactModal({ open: false, student: null, offer: null })} size="sm">
        <DialogHeader className="flex justify-between items-center border-b border-blue-gray-100">
          <div>
            <Typography variant="h6" className="font-bold text-purple-700">Proposer cette offre</Typography>
            <Typography variant="small" className="text-blue-gray-500">{contactModal.student?.name}</Typography>
          </div>
          <button onClick={() => setContactModal({ open: false, student: null, offer: null })} className="text-blue-gray-400 hover:text-blue-gray-700 transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </DialogHeader>
        <DialogBody className="p-6 space-y-4">
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {contactModal.student?.name?.[0] || "?"}
            </div>
            <div>
              <Typography className="font-bold text-sm">{contactModal.student?.name}</Typography>
              <Typography variant="small" className="text-blue-gray-500">{contactModal.student?.email}</Typography>
              {contactModal.student?.field && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block">{contactModal.student.field}</span>}
            </div>
          </div>
          {contactModal.offer && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
              <span className="font-semibold">Offre : </span>{contactModal.offer.title}
            </div>
          )}
          <div>
            <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
              Message personnel <span className="text-blue-gray-400 font-normal">(optionnel)</span>
            </Typography>
            <textarea rows={4} placeholder="Bonjour, votre profil correspond à notre offre…"
              value={personalMessage} onChange={(e) => setPersonalMessage(e.target.value)}
              className="w-full border border-blue-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-400 resize-none transition" />
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-700 leading-relaxed">
            Un email et une notification seront envoyés. Une conversation sera ouverte automatiquement.
          </div>
        </DialogBody>
        <DialogFooter className="border-t border-blue-gray-100 gap-3">
          <Button variant="outlined" color="blue-gray" onClick={() => setContactModal({ open: false, student: null, offer: null })}>Annuler</Button>
          <Button style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }} onClick={handleSendProposal} disabled={sendingProposal} className="text-white flex items-center gap-2">
            {sendingProposal ? "Envoi…" : "📨 Envoyer la proposition"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ✅ CandidateHistoryModal */}
      <CandidateHistoryModal
        open={openHistoryModal}
        student={selectedStudent}
        history={candidateHistory}
        loading={historyLoading}
        onClose={() => {
          setOpenHistoryModal(false);
          setSelectedStudent(null);
          setCandidateHistory(null);
        }}
      />
    </>
  );
}