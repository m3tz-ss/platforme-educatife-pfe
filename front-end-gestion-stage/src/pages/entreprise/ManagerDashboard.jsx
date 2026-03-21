// src/ManagerDashboard.jsx
import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  IconButton,
} from "@material-tailwind/react";
import {
  UsersIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./css/ManagerDashboard.css";

const AVATAR_COLORS = ["blue", "violet", "emerald", "orange", "rose", "cyan"];

export function ManagerDashboard() {
  const [accounts, setAccounts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [openModal, setOpenModal]   = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "rh" });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/internal-users");
      setAccounts(res.data);
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (editUser && !payload.password) delete payload.password;
      if (editUser) {
        await api.put(`/internal-users/${editUser.id}`, payload);
      } else {
        await api.post("/internal-users", payload);
      }
      closeModal();
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    try {
      await api.delete(`/internal-users/${id}`);
      fetchAccounts();
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditUser(null);
    setForm({ name: "", email: "", password: "", role: "rh" });
  };

  const getInitial     = (name) => name ? name.charAt(0).toUpperCase() : "?";
  const getAvatarColor = (idx)  => AVATAR_COLORS[idx % AVATAR_COLORS.length];

  const filteredAccounts = accounts.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Total comptes", value: accounts.length,                                  color: "blue"    },
    { label: "RH",            value: accounts.filter((u) => u.role === "rh").length,   color: "violet"  },
    { label: "Encadrants",    value: accounts.filter((u) => u.role === "encadrant").length, color: "emerald" },
  ];

  return (
    <div className="dashboard-container">

      {/* ── Background blobs ── */}
      <div className="blob-top-right" />
      <div className="blob-bottom-left" />

      <div className="dashboard-wrapper">

        {/* ── Back link ── */}
        <Link to="/auth/sign-in" className="back-link">
          <ArrowLeftIcon className="back-link-icon" />
          Retour à la connexion
        </Link>

        {/* ── Main Card ── */}
        <div className="main-card">
          <div className="main-card-body">

            {/* ── Header ── */}
            <div className="dashboard-header">
              <div>
                <p className="dashboard-title">🏢 Dashboard Manager</p>
                <p className="dashboard-subtitle">Gérez les comptes internes de la plateforme</p>
              </div>
              <Button
                color="blue"
                className="flex items-center gap-2"
                onClick={() => setOpenModal(true)}
              >
                <UserPlusIcon className="w-4 h-4" />
                Nouveau compte
              </Button>
            </div>

            {/* ── Stat Cards ── */}
            <div className="stats-grid">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <div className={`stat-card-bar ${stat.color}`} />
                  <div className="stat-card-content">
                    <div className={`stat-icon-wrapper ${stat.color}`}>
                      <UsersIcon className={`stat-icon ${stat.color}`} />
                    </div>
                    <div>
                      <p className="stat-value">{stat.value}</p>
                      <p className="stat-label">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Table Card ── */}
            <div className="table-card">
              <div className="table-header">
                <div>
                  <p className="table-title">Comptes internes</p>
                  <p className="table-count">
                    {filteredAccounts.length} utilisateur{filteredAccounts.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="search-wrapper">
                  <Input
                    placeholder="Rechercher..."
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
                  <p className="loading-text">Chargement...</p>
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="empty-state">
                  <UsersIcon className="empty-icon" />
                  <p className="empty-text">Aucun compte trouvé</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {["Utilisateur", "Email", "Rôle", "Actions"].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map((user, idx) => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-cell">
                              <div className={`avatar ${getAvatarColor(idx)}`}>
                                {getInitial(user.name)}
                              </div>
                              <span className="user-name">{user.name}</span>
                            </div>
                          </td>
                          <td><span className="user-email">{user.email}</span></td>
                          <td>
                            <span className={`role-badge ${user.role === "rh" ? "rh" : "encadrant"}`}>
                              {user.role === "rh" ? "RH" : "Encadrant"}
                            </span>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <IconButton variant="text" size="sm" color="blue" onClick={() => openEditModal(user)}>
                                <PencilIcon className="w-4 h-4" />
                              </IconButton>
                              <IconButton variant="text" size="sm" color="red" onClick={() => handleDelete(user.id)}>
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
            </div>

          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      <Dialog open={openModal} handler={closeModal} size="sm">
        <DialogHeader>
          <div className="modal-header" style={{ width: "100%" }}>
            <div>
              <p className="modal-title">{editUser ? "Modifier l'utilisateur" : "Créer un compte"}</p>
              <p className="modal-subtitle">{editUser ? "Mettez à jour les informations" : "Remplissez les informations"}</p>
            </div>
            <IconButton variant="text" color="blue-gray" onClick={closeModal}>
              <XMarkIcon className="w-5 h-5" />
            </IconButton>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="modal-body">
            <div>
              <label className="field-label">Nom complet</label>
              <Input placeholder="Ex: Ahmed Ben Ali" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="!border-blue-gray-200" />
            </div>
            <div>
              <label className="field-label">Adresse email</label>
              <Input type="email" placeholder="exemple@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="!border-blue-gray-200" />
            </div>
            {!editUser && (
              <div>
                <label className="field-label">Mot de passe</label>
                <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="!border-blue-gray-200" />
              </div>
            )}
            <div>
              <label className="field-label">Rôle</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="role-select">
                <option value="rh">RH</option>
                <option value="encadrant">Encadrant</option>
              </select>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <div className="modal-footer" style={{ width: "100%" }}>
            <Button variant="outlined" color="blue-gray" onClick={closeModal} disabled={submitting}>Annuler</Button>
            <Button color="blue" onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2">
              {submitting ? (
                <><div className="spinner" style={{ width: "1rem", height: "1rem", borderWidth: "2px" }} /> Enregistrement...</>
              ) : (
                editUser ? "✅ Modifier" : "✅ Créer"
              )}
            </Button>
          </div>
        </DialogFooter>
      </Dialog>

    </div>
  );
}

export default ManagerDashboard;