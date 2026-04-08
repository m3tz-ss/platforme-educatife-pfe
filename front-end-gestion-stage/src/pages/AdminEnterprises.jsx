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
    <tr className="border-b border-gray-50">
      {[40, 180, 160, 90, 120].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Confirm Dialog ───────────────────────────
function ConfirmDialog({ enterprise, onConfirm, onCancel }) {
  if (!enterprise) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border p-6 w-full max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <TrashIcon className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-1">
          Supprimer l'entreprise
        </h3>
        <p className="text-sm text-gray-400 text-center mb-6">
          Voulez-vous vraiment supprimer <span className="font-semibold text-gray-600">{enterprise.name}</span> ?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100">
            Annuler
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600">
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

  if (!enterprise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">Modifier l'entreprise</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex flex-col gap-3 mb-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de l'entreprise"
            className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Secteur"
            className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100">
            Annuler
          </button>
          <button
            onClick={() => onSave(enterprise.id, { name, email, sector })}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
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
      setEnterprises(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEnterprises(); }, [fetchEnterprises]);

  const filtered = enterprises.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.sector?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSave = async (id, data) => {
    setSaving(true);
    try {
      await api.put(`/admin/enterprises/${id}`, data);
      setEnterprises((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
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
      setEnterprises((prev) => prev.filter((e) => e.id !== deleteEnterprise.id));
      showToast("Entreprise supprimée");
      setDeleteEnterprise(null);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  return (
    <AdminLayout menuItems={[]}>
      <div className="min-h-screen bg-gray-50/80 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestion des entreprises</h1>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, secteur..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <XMarkIcon className="w-4 h-4 text-gray-300 hover:text-gray-500" />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left w-10">#</th>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Secteur</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <UsersIcon className="w-10 h-10" />
                        Aucun entreprise trouvée
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((e, idx) => (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3.5">{(page - 1) * PER_PAGE + idx + 1}</td>
                      <td className="px-4 py-3.5">{e.name}</td>
                      <td className="px-4 py-3.5">{e.email}</td>
                      <td className="px-4 py-3.5">{e.sector}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditEnterprise(e)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteEnterprise(e)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-300 hover:bg-red-50 hover:text-red-500"
                          >
                            <TrashIcon className="w-4 h-4" />
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
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} sur {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs font-medium rounded-lg ${page === p ? "bg-blue-500 text-white" : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40">
                  <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <EditEnterpriseModal enterprise={editEnterprise} onSave={handleSave} onClose={() => setEditEnterprise(null)} saving={saving} />
        <ConfirmDialog enterprise={deleteEnterprise} onConfirm={handleDelete} onCancel={() => setDeleteEnterprise(null)} />

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all ${toast.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
            {toast.type === "error" ? <XMarkIcon className="w-4 h-4 shrink-0" /> : <CheckIcon className="w-4 h-4 shrink-0" />}
            {toast.msg}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}