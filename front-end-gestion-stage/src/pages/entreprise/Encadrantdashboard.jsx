import { useEffect, useState } from "react";
import api from "../../services/api";
import "./css/EncadrantDashboard.css";
import { useNavigate } from "react-router-dom";
const statusConfig = {
  accepted: { label: "Accepté", color: "#10b981", bg: "#d1fae5" },
  pending:  { label: "En attente", color: "#f59e0b", bg: "#fef3c7" },
  rejected: { label: "Refusé", color: "#ef4444", bg: "#fee2e2" },
};

function getStatus(status) {
  return statusConfig[status] || { label: status, color: "#6366f1", bg: "#e0e7ff" };
}

function getInitials(name = "") {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function StudentCard({ app, index }) {
  const getCvUrl = (cv) => cv ? `http://127.0.0.1:8000/storage/${cv}` : null;
  const s = getStatus(app.status);

  return (
    <div className="student-card" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="card-accent" />

      <div className="card-header">
        <div className="avatar">{getInitials(app.student?.name)}</div>
        <div className="student-info">
          <h3 className="student-name">{app.student?.name}</h3>
          {/* ✅ Email ajouté ici */}
          {app.student?.email && (
            <p className="student-email">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {app.student?.email}
            </p>
          )}
          <p className="student-meta">Étudiant encadré</p>
        </div>
        <span className="status-badge" style={{ color: s.color, background: s.bg }}>
          <span className="status-dot" style={{ background: s.color }} />
          {s.label}
        </span>
      </div>

      <div className="card-divider" />

      <div className="offer-section">
        <div className="offer-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
        </div>
        <span className="offer-title">{app.offer?.title || "Offre non spécifiée"}</span>
      </div>

      {getCvUrl(app.cv) && (
        <a href={getCvUrl(app.cv)} target="_blank" rel="noopener noreferrer" className="cv-button">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Consulter le CV
        </a>
      )}
    </div>
  );
}

export default function EncadrantDashboard() {
  const navigate = useNavigate(); // ✅ ajouter
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fonction logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("entrepriseRole");
    navigate("/auth/sign-in");
  };

  useEffect(() => {
    api.get("/encadrant/students")
      .then(res => setStudents(res.data))
      .catch(err => console.error("Erreur chargement étudiants", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">Chargement des étudiants...</p>
      </div>
    );
  }

  return (
    <div className="encadrant-root">
      <div className="page-header">
    <div className="header-top">
      <div className="header-badge">Espace Encadrant</div>
      <button className="logout-btn" onClick={handleLogout}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Déconnexion
      </button>
    </div>
    <h1 className="page-title">Mes Étudiants</h1>
    <p className="page-subtitle">
      {students.length} étudiant{students.length !== 1 ? "s" : ""} affecté{students.length !== 1 ? "s" : ""}
    </p>
  </div>

      {students.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p className="empty-title">Aucun étudiant affecté</p>
          <p className="empty-sub">Les étudiants assignés apparaîtront ici.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {students.map((app, i) => (
            <StudentCard key={app.id} app={app} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}