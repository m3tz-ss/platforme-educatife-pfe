import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  TagIcon,
  BuildingOfficeIcon,
  PlusIcon,
  FunnelIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "../components/layout/AdminLayout";

// ── Domain color config ──────────────────────────────────────────────────────
const DOMAIN_COLORS = {
  informatique:         { bg: "bg-indigo-100",  text: "text-indigo-700",  dot: "bg-indigo-500" },
  design:               { bg: "bg-purple-100",  text: "text-purple-700",  dot: "bg-purple-500" },
  marketing:            { bg: "bg-teal-100",    text: "text-teal-700",    dot: "bg-teal-500" },
  ventes:               { bg: "bg-yellow-100",  text: "text-yellow-700",  dot: "bg-yellow-500" },
  "ressources humaines":{ bg: "bg-green-100",   text: "text-green-700",   dot: "bg-green-500" },
  finance:              { bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500" },
  cloud:                { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500" },
  default:              { bg: "bg-zinc-100",    text: "text-zinc-600",    dot: "bg-zinc-400" },
};
const getDomainColor = (domain) => {
  if (!domain) return DOMAIN_COLORS.default;
  const key = Object.keys(DOMAIN_COLORS).find((k) =>
    domain.toLowerCase().includes(k)
  );
  return DOMAIN_COLORS[key ?? "default"];
};

const AVATAR_GRADIENTS = [
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-rose-400 to-pink-500",
];
const getGradient = (i) => AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
};

// ── Domain Badge ─────────────────────────────────────────────────────────────
function DomainBadge({ domain }) {
  const cfg = getDomainColor(domain);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {domain ?? "—"}
    </span>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient, sub }) {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none mb-1">{value}</p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[32, 200, 140, 100, 100, 80, 60].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ offer, onConfirm, onCancel }) {
  if (!offer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-full max-w-sm mx-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <TrashIcon className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-1">Supprimer l'offre</h3>
        <p className="text-sm text-gray-400 text-center mb-6">
          Voulez-vous vraiment supprimer{" "}
          <span className="font-semibold text-gray-700">"{offer.title}"</span> ?
          Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors active:scale-95">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared Offer Form Fields ──────────────────────────────────────────────────
function OfferFormFields({ form, setForm }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const DOMAIN_SUGGESTIONS = [
    "Informatique", "Design", "Marketing", "Finance", "Cloud",
    "Ressources Humaines", "Ventes", "Gestion", "Électronique",
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Title */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
          Titre de l'offre <span className="text-red-400">*</span>
        </label>
        <input
          value={form.title}
          onChange={set("title")}
          placeholder="Ex: Développeur React/Laravel"
          className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all placeholder-gray-300"
        />
      </div>

      {/* Domain */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Domaine</label>
        <input
          list="domain-list"
          value={form.domain}
          onChange={set("domain")}
          placeholder="Ex: Informatique, Web, Design..."
          className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all placeholder-gray-300"
        />
        <datalist id="domain-list">
          {DOMAIN_SUGGESTIONS.map((d) => <option key={d} value={d} />)}
        </datalist>
      </div>

      {/* Location */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
          Lieu <span className="text-red-400">*</span>
        </label>
        <input
          value={form.location}
          onChange={set("location")}
          placeholder="Ex: Tunis, Sfax, Sousse..."
          className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all placeholder-gray-300"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
          Durée <span className="text-red-400">*</span>
        </label>
        <input
          list="duration-list"
          value={form.duration}
          onChange={set("duration")}
          placeholder="Ex: 3 mois, 6 semaines..."
          className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all placeholder-gray-300"
        />
        <datalist id="duration-list">
          {["1 mois", "2 mois", "3 mois", "4 mois", "6 mois", "1 an"].map((d) => <option key={d} value={d} />)}
        </datalist>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Description</label>
        <textarea
          value={form.description}
          onChange={set("description")}
          placeholder="Description du poste, missions, profil recherché..."
          rows={3}
          className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all placeholder-gray-300 resize-none"
        />
      </div>
    </div>
  );
}

// ── Edit Modal ───────────────────────────────────────────────────────────────
function EditOfferModal({ offer, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    title:       offer?.title ?? "",
    domain:      offer?.domain ?? "",
    location:    offer?.location ?? "",
    duration:    offer?.duration ?? "",
    description: offer?.description ?? "",
  });

  if (!offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Modifier l'offre</h3>
            <p className="text-xs text-gray-400 mt-0.5">ID #{offer.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <OfferFormFields form={form} setForm={setForm} />

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
            Annuler
          </button>
          <button
            onClick={() => onSave(offer.id, form)}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Offer Modal ───────────────────────────────────────────────────────────
function AddOfferModal({ onSave, onClose, saving }) {
  const [form, setForm] = useState({ title: "", domain: "", location: "", duration: "", description: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Titre requis";
    if (!form.location.trim()) errs.location = "Lieu requis";
    if (!form.duration.trim()) errs.duration = "Durée requise";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Nouvelle offre de stage</h3>
            <p className="text-xs text-gray-400 mt-0.5">Créée par l'administrateur</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <OfferFormFields form={form} setForm={setForm} />

        {/* Inline errors */}
        {Object.values(errors).length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            {Object.values(errors).map((e, i) => (
              <p key={i} className="text-xs text-red-600">{e}</p>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            <PlusIcon className="w-4 h-4" />
            Créer l'offre
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
const PER_PAGE = 10;

export default function AdminOffers() {
  const [offers, setOffers]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState("");
  const [domainFilter, setDomainFilter] = useState("Tous");
  const [page, setPage]               = useState(1);
  const [editOffer, setEditOffer]     = useState(null);
  const [deleteOffer, setDeleteOffer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOffers = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get("/admin/offers");
      setOffers(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const domains = ["Tous", ...new Set(offers.map((o) => o.domain).filter(Boolean))];

  const filtered = offers.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.title?.toLowerCase().includes(q) ||
      o.company?.toLowerCase().includes(q) ||
      o.domain?.toLowerCase().includes(q) ||
      o.location?.toLowerCase().includes(q);
    const matchDomain = domainFilter === "Tous" || o.domain === domainFilter;
    return matchSearch && matchDomain;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const uniqueCompanies = new Set(offers.map((o) => o.company ?? o.enterprise?.name).filter(Boolean)).size;
  const uniqueDomains   = new Set(offers.map((o) => o.domain).filter(Boolean)).size;
  const totalApplications = offers.reduce((acc, o) => acc + (o.applications_count ?? 0), 0);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSave = async (id, data) => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/offers/${id}`, data);
      setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...data, ...res.data } : o)));
      showToast("Offre mise à jour");
      setEditOffer(null);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la mise à jour", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteOffer) return;
    try {
      await api.delete(`/admin/offers/${deleteOffer.id}`);
      setOffers((prev) => prev.filter((o) => o.id !== deleteOffer.id));
      showToast("Offre supprimée");
      setDeleteOffer(null);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const res = await api.post("/admin/offers", form);
      setOffers((prev) => [res.data, ...prev]);
      showToast("Offre créée avec succès");
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : "Erreur lors de la création";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout menuItems={[]}>
      <div className="min-h-screen bg-gray-50/80">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Offres de stage</h1>
              <p className="text-sm text-gray-400 mt-1">
                {offers.length} offre{offers.length !== 1 ? "s" : ""} enregistrée{offers.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchOffers(true)}
                className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-xl px-3.5 py-2 hover:bg-gray-50 transition-all active:scale-95"
              >
                <ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-500" : ""}`} />
                Actualiser
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 text-xs font-medium text-white bg-blue-500 rounded-xl px-3.5 py-2 hover:bg-blue-600 transition-all active:scale-95 shadow-sm shadow-blue-100"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Nouvelle offre
              </button>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Offres totales"
              value={offers.length}
              icon={BriefcaseIcon}
              gradient="from-blue-400 to-indigo-500"
              sub="Toutes entreprises confondues"
            />
            <StatCard
              label="Entreprises"
              value={uniqueCompanies}
              icon={BuildingOfficeIcon}
              gradient="from-emerald-400 to-teal-500"
              sub="Ayant publié au moins 1 offre"
            />
            <StatCard
              label="Domaines"
              value={uniqueDomains}
              icon={TagIcon}
              gradient="from-violet-400 to-purple-500"
              sub="Secteurs représentés"
            />
            <StatCard
              label="Candidatures"
              value={totalApplications}
              icon={DocumentTextIcon}
              gradient="from-amber-400 to-orange-500"
              sub="Total reçues"
            />
          </div>

          {/* ── Search + domain filter ── */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher par titre, entreprise..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder-gray-300"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <XMarkIcon className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                </button>
              )}
            </div>
            {domains.length > 1 && (
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-gray-300" />
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 flex-wrap">
                  {domains.slice(0, 6).map((d) => (
                    <button
                      key={d}
                      onClick={() => { setDomainFilter(d); setPage(1); }}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                        domainFilter === d ? "bg-blue-500 text-white shadow-sm" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {["#", "Offre", "Entreprise", "Domaine", "Lieu", "Durée", "Candidatures", "Actions"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold text-gray-400 ${i === 7 ? "text-right" : "text-left"} ${i === 0 ? "w-10" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-300">
                          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                            <BriefcaseIcon className="w-7 h-7" />
                          </div>
                          <p className="text-sm font-medium text-gray-400 mt-1">Aucune offre trouvée</p>
                          {(search || domainFilter !== "Tous") && (
                            <button
                              onClick={() => { setSearch(""); setDomainFilter("Tous"); }}
                              className="text-xs text-blue-500 hover:underline"
                            >
                              Réinitialiser les filtres
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((o, idx) => {
                      const globalIdx = (page - 1) * PER_PAGE + idx;
                      const companyName = o.company ?? o.enterprise?.name ?? "—";
                      return (
                        <tr
                          key={o.id}
                          className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors duration-100 group"
                        >
                          <td className="px-4 py-4">
                            <span className="text-xs text-gray-300 tabular-nums">{globalIdx + 1}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(globalIdx)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                                {getInitials(o.title)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{o.title}</p>
                                <p className="text-xs text-gray-400">ID #{o.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <BuildingOfficeIcon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                              <span className="text-sm text-gray-600">{companyName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <DomainBadge domain={o.domain} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5">
                              <MapPinIcon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                              <span className="text-sm text-gray-500">{o.location ?? "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5">
                              <ClockIcon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                              <span className="text-sm text-gray-500">{o.duration ?? "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-blue-600">{o.applications_count ?? 0}</span>
                              <span className="text-xs text-gray-400">candidatures</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <button
                                onClick={() => setEditOffer(o)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                title="Modifier"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteOffer(o)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                title="Supprimer"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {!loading && filtered.length > PER_PAGE && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50 bg-gray-50/40">
                <p className="text-xs text-gray-400">
                  {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} sur {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`d-${i}`} className="w-8 text-center text-xs text-gray-300">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                            page === p ? "bg-blue-500 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <EditOfferModal offer={editOffer} onSave={handleSave} onClose={() => setEditOffer(null)} saving={saving} />
      <ConfirmDialog offer={deleteOffer} onConfirm={handleDelete} onCancel={() => setDeleteOffer(null)} />
      {showAddModal && (
        <AddOfferModal onSave={handleCreate} onClose={() => setShowAddModal(false)} saving={saving} />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`}>
          {toast.type === "error" ? <XMarkIcon className="w-4 h-4 shrink-0" /> : <CheckIcon className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
}