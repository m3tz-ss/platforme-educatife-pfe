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
  UsersIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "../components/layout/AdminLayout";

// ── Skeleton row ─────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[40, 180, 160, 90, 120].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-3 bg-gray-100 rounded-full animate-pulse"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Confirm Dialog ───────────────────────────
function ConfirmDialog({ enterprise, onConfirm, onCancel }) {
  if (!enterprise) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-sm mx-4">
        <div className="w-10 h-10 rounded-full border border-red-100 bg-red-50 flex items-center justify-center mx-auto mb-4">
          <TrashIcon className="w-4 h-4 text-red-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 text-center mb-1">
          Supprimer l'entreprise
        </h3>
        <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
          Voulez-vous vraiment supprimer{" "}
          <span className="font-medium text-gray-600">{enterprise.name}</span> ?
          Cette action est irréversible.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-xs font-medium text-white bg-red-400 rounded-xl hover:bg-red-500 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Enterprise Modal ───────────────────
function EditEnterpriseModal({ enterprise, onSave, onClose, saving }) {
  const [name, setName] = useState(enterprise?.name ?? "");
  const [email, setEmail] = useState(enterprise?.email ?? "");
  const [sector, setSector] = useState(enterprise?.sector ?? "");

  useEffect(() => {
    if (enterprise) {
      setName(enterprise.name ?? "");
      setEmail(enterprise.email ?? "");
      setSector(enterprise.sector ?? "");
    }
  }, [enterprise]);

  if (!enterprise) return null;

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-medium text-gray-900">
            Modifier l'entreprise
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 mb-5">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 ml-0.5">
              Nom de l'entreprise
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Acme Corp"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 ml-0.5">
              Adresse email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex. contact@acme.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 ml-0.5">
              Secteur d'activité
            </label>
            <input
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="ex. Technologie"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(enterprise.id, { name, email, sector })}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-sm text-xs font-medium border transition-all ${
        toast.type === "error"
          ? "bg-red-50 text-red-600 border-red-100"
          : "bg-green-50 text-green-700 border-green-100"
      }`}
    >
      {toast.type === "error" ? (
        <XMarkIcon className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <CheckIcon className="w-3.5 h-3.5 shrink-0" />
      )}
      {toast.msg}
    </div>
  );
}

// ── Main Page ───────────────────────────────
const PER_PAGE = 10;

export default function AdminEnterprises() {
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editEnterprise, setEditEnterprise] = useState(null);
  const [deleteEnterprise, setDeleteEnterprise] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEnterprises = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/enterprises");
      setEnterprises(Array.isArray(res.data) ? res.data : (res.data.data ?? []));
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnterprises();
  }, [fetchEnterprises]);

  // ── Filtering & pagination ──────────────────
  const filtered = enterprises.filter((e) => {
    const q = search.toLowerCase();
    return (
      !q ||
      e.name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.sector?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // ── Handlers ───────────────────────────────
  const handleSave = async (id, data) => {
    setSaving(true);
    try {
      await api.put(`/admin/enterprises/${id}`, data);
      setEnterprises((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...data } : e))
      );
      showToast("Entreprise mise à jour");
      setEditEnterprise(null);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la mise à jour", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEnterprise) return;
    try {
      await api.delete(`/admin/enterprises/${deleteEnterprise.id}`);
      setEnterprises((prev) =>
        prev.filter((e) => e.id !== deleteEnterprise.id)
      );
      showToast("Entreprise supprimée");
      setDeleteEnterprise(null);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  // ── Pagination buttons ──────────────────────
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (safePage <= 4) {
      pages.push(1, 2, 3, 4, 5, "…", totalPages);
    } else if (safePage >= totalPages - 3) {
      pages.push(1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "…", safePage - 1, safePage, safePage + 1, "…", totalPages);
    }
    return pages;
  };

  // ── Styles helpers ──────────────────────────
  const thClass = "px-5 py-3 text-left text-xs font-medium text-gray-400 tracking-wide whitespace-nowrap";
  const tdClass = "px-5 py-4 text-sm text-gray-700 whitespace-nowrap";

  return (
    <AdminLayout menuItems={[]}>
      <div className="min-h-screen bg-white p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-0.5">
            Gestion des entreprises
          </h1>
          <p className="text-sm text-gray-400">
            {loading ? "Chargement…" : `${filtered.length} entreprise${filtered.length !== 1 ? "s" : ""} au total`}
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <XMarkIcon className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 transition-colors" />
              </button>
            )}
          </div>

          <button
            onClick={fetchEnterprises}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Actualiser"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 text-gray-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Table */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className={`${thClass} w-12`}>#</th>
                  <th className={thClass}>Entreprise</th>
                  <th className={thClass}>Email</th>
                  <th className={thClass}>Secteur</th>
                  <th className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-300">
                        <UsersIcon className="w-8 h-8" />
                        <span className="text-sm">Aucune entreprise trouvée</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((e, idx) => (
                    <tr
                      key={e.id}
                      className="group hover:bg-gray-50/60 transition-colors"
                    >
                      <td className={`${tdClass} text-gray-300 text-xs`}>
                        {(safePage - 1) * PER_PAGE + idx + 1}
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          {/* Avatar initiales */}
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
                            {e.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <span className="font-medium text-gray-800">{e.name}</span>
                        </div>
                      </td>
                      <td className={`${tdClass} text-gray-400`}>{e.email}</td>
                      <td className={tdClass}>
                        {e.sector && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-medium">
                            {e.sector}
                          </span>
                        )}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditEnterprise(e)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-gray-600 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
                            title="Modifier"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteEnterprise(e)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-400 hover:border-red-100 border border-transparent transition-all"
                            title="Supprimer"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filtered.length > PER_PAGE && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50 bg-gray-50/40">
              <p className="text-xs text-gray-400">
                {(safePage - 1) * PER_PAGE + 1}–
                {Math.min(safePage * PER_PAGE, filtered.length)} sur{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeftIcon className="w-3 h-3 text-gray-500" />
                </button>

                {getPageNumbers().map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="w-7 text-center text-xs text-gray-300">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${
                        safePage === p
                          ? "bg-gray-900 text-white"
                          : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  <ChevronRightIcon className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <EditEnterpriseModal
          enterprise={editEnterprise}
          onSave={handleSave}
          onClose={() => setEditEnterprise(null)}
          saving={saving}
        />
        <ConfirmDialog
          enterprise={deleteEnterprise}
          onConfirm={handleDelete}
          onCancel={() => setDeleteEnterprise(null)}
        />

        {/* Toast */}
        <Toast toast={toast} />
      </div>
    </AdminLayout>
  );
}