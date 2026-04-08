import { useEffect, useState, useCallback } from "react";
import api from "./../services/api";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ChevronUpDownIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { getAdminMenuItems } from "../config/sidebarConfig";
import AdminLayout from "../components/layout/AdminLayout";

// ── Role config ──────────────────────────────────────────────────────────────
const ROLES = {
  admin:      { label: "Admin",      bg: "bg-red-100",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     icon: ShieldCheckIcon },
  manager:    { label: "Manager",    bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500",   icon: BuildingOfficeIcon },
  rh:         { label: "RH",         bg: "bg-violet-100",  text: "text-violet-700",  border: "border-violet-200",  dot: "bg-violet-500",  icon: UsersIcon },
  encadrant:  { label: "encadrant",  bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: UserCircleIcon },
  student:    { label: "Étudiant",   bg: "bg-sky-100",     text: "text-sky-700",     border: "border-sky-200",     dot: "bg-sky-500",     icon: AcademicCapIcon },
};

const ROLE_OPTIONS = ["Tous", "admin", "manager", "rh", "encadrant", "student"];

const AVATAR_GRADIENTS = [
  "from-blue-400 to-blue-600",
  "from-emerald-400 to-emerald-600",
  "from-violet-400 to-violet-600",
  "from-amber-400 to-amber-600",
  "from-cyan-400 to-cyan-600",
  "from-rose-400 to-rose-600",
  "from-indigo-400 to-indigo-600",
  "from-teal-400 to-teal-600",
];
const getGradient = (i) => AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
};

// ── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const cfg = ROLES[role] ?? { label: role, bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ user, onConfirm, onCancel }) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in duration-150">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <TrashIcon className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-1">Supprimer l'utilisateur</h3>
        <p className="text-sm text-gray-400 text-center mb-6">
          Voulez-vous vraiment supprimer <span className="font-semibold text-gray-600">{user.name}</span> ? Cette action est irréversible.
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

// ── Edit Role Modal ──────────────────────────────────────────────────────────
function EditRoleModal({ user, onSave, onClose, saving }) {
  const [selectedRole, setSelectedRole] = useState(user?.roles?.[0] ?? "student");

  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">Modifier le rôle</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5 border border-gray-100">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient(user.id ?? 0)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>

        {/* Role grid */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Choisir un rôle</p>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {Object.entries(ROLES).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const isSelected = selectedRole === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedRole(key)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                  isSelected
                    ? `${cfg.border} ${cfg.bg}`
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? cfg.bg : "bg-gray-100"}`}>
                  <Icon className={`w-4 h-4 ${isSelected ? cfg.text : "text-gray-400"}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isSelected ? cfg.text : "text-gray-600"}`}>{cfg.label}</p>
                </div>
                {isSelected && (
                  <div className={`ml-auto w-5 h-5 rounded-full ${cfg.dot.replace("bg-", "bg-")} flex items-center justify-center`}
                    style={{ background: "" }}
                  >
                    <CheckIcon className={`w-3 h-3 ${cfg.text}`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
            Annuler
          </button>
          <button
            onClick={() => onSave(user.id, selectedRole)}
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


// ── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[40, 180, 160, 90, 80, 70].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
const PER_PAGE = 10;

export default function AdminUsers() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("Tous");
  const [sortField, setSortField]   = useState("name");
  const [sortDir, setSortDir]       = useState("asc");
  const [page, setPage]             = useState(1);
  const [editUser, setEditUser]     = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get("/admin/users");
      // Support both { data: [...] } and plain array
      setUsers(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Filter + sort + paginate ───────────────────────────────────────────────
  const filtered = users
    .filter((u) => {
      const role = u.role ?? u.type ?? "student";
      const matchRole = roleFilter === "Tous" || role === roleFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        role.toLowerCase().includes(q);
      return matchRole && matchSearch;
    })
    .sort((a, b) => {
      let av = sortField === "role" ? (a.roles?.[0] ?? a.role ?? "") : (a[sortField] ?? "");
      let bv = sortField === "role" ? (b.roles?.[0] ?? b.role ?? "") : (b[sortField] ?? "");
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  // ── Counts per role ────────────────────────────────────────────────────────
  const roleCounts = users.reduce((acc, u) => {
  const r = u.roles?.[0]?.name ?? u.role ?? u.type ?? "unknown";
  acc[r] = (acc[r] ?? 0) + 1;
  return acc;
}, {});

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSaveRole = async (userId, newRole) => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, roles: [newRole] } : u))
      );
      showToast("Rôle mis à jour avec succès");
      setEditUser(null);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la mise à jour", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      await api.delete(`/admin/users/${deleteUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      showToast("Utilisateur supprimé");
      setDeleteUser(null);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const SortIcon = ({ field }) => (
    <ChevronUpDownIcon
      className={`w-3.5 h-3.5 transition-colors ${sortField === field ? "text-blue-500" : "text-gray-300"}`}
    />
  );
const menuItems = getAdminMenuItems({
  users: users.length,
});
  return (
    <AdminLayout menuItems={menuItems}>
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Utilisateurs</h1>
            <p className="text-sm text-gray-400 mt-1">
              {users.length} utilisateur{users.length !== 1 ? "s" : ""} enregistré{users.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers(true)}
              className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-xl px-3.5 py-2 hover:bg-gray-50 transition-all active:scale-95"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-500" : ""}`} />
              Actualiser
            </button>
            <button className="flex items-center gap-2 text-xs font-medium text-white bg-blue-500 rounded-xl px-3.5 py-2 hover:bg-blue-600 transition-all active:scale-95 shadow-sm shadow-blue-100">
              <UserPlusIcon className="w-3.5 h-3.5" />
              Ajouter
            </button>
          </div>
        </div>

        {/* ── Role summary cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {Object.entries(ROLES).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const count = roleCounts[key] ?? 0;
            return (
              <button
                key={key}
                onClick={() => { setRoleFilter(roleFilter === key ? "Tous" : key); setPage(1); }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all duration-150 ${
                  roleFilter === key
                    ? `${cfg.border} ${cfg.bg}`
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${roleFilter === key ? cfg.bg : "bg-gray-50"}`}>
                  <Icon className={`w-4 h-4 ${roleFilter === key ? cfg.text : "text-gray-400"}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold leading-none ${roleFilter === key ? cfg.text : "text-gray-800"}`}>{count}</p>
                  <p className={`text-xs mt-0.5 ${roleFilter === key ? cfg.text : "text-gray-400"} opacity-80`}>{cfg.label}{count !== 1 ? "s" : ""}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Search + filters ── */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder-gray-300"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <XMarkIcon className="w-4 h-4 text-gray-300 hover:text-gray-500" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-300" />
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setRoleFilter(r); setPage(1); }}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                    roleFilter === r
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {r === "Tous" ? "Tous" : ROLES[r]?.label ?? r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left w-10">
                    <span className="text-xs font-semibold text-gray-400">#</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                      Utilisateur <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort("email")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                      Email <SortIcon field="email" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort("role")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                      Rôle <SortIcon field="role" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                      Inscrit le <SortIcon field="created_at" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <span className="text-xs font-semibold text-gray-400">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-300">
                        <UsersIcon className="w-10 h-10" />
                        <p className="text-sm font-medium text-gray-400">Aucun utilisateur trouvé</p>
                        {(search || roleFilter !== "Tous") && (
                          <button onClick={() => { setSearch(""); setRoleFilter("Tous"); }} className="text-xs text-blue-500 hover:underline mt-1">
                            Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((user, idx) => {
                    const role = user.role ?? user.type ?? "student";
                    const globalIdx = (page - 1) * PER_PAGE + idx;
                    const createdAt = user.created_at
                      ? new Date(user.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                      : "—";
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors duration-100 group"
                      >
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-300 tabular-nums">{globalIdx + 1}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getGradient(globalIdx)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                              {getInitials(user.name)}
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <RoleBadge role={role} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-400">{createdAt}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => setEditUser(user)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              title="Modifier le rôle"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteUser(user)}
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
                      <span key={`dots-${i}`} className="w-8 text-center text-xs text-gray-300">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                          page === p
                            ? "bg-blue-500 text-white shadow-sm"
                            : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
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

        {/* ── Modals ── */}
        <EditRoleModal user={editUser} onSave={handleSaveRole} onClose={() => setEditUser(null)} saving={saving} />
        <ConfirmDialog user={deleteUser} onConfirm={handleDelete} onCancel={() => setDeleteUser(null)} />

        {/* ── Toast ── */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}>
            {toast.type === "error"
              ? <XMarkIcon className="w-4 h-4 shrink-0" />
              : <CheckIcon className="w-4 h-4 shrink-0" />}
            {toast.msg}
          </div>
        )}

      </div>
      
    </div>
    </AdminLayout>
  );
  
}
