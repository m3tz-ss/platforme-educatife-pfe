// src/components/Navbar.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import "./Navbar.css";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* ── Logo ── */}
        <Link to="/" className="navbar-logo">
          <span>🎓 MyStage</span>
        </Link>

        {/* ── Desktop Links ── */}
        <div className="navbar-links">
          <Link to="/" className={`navbar-link ${isActive("/") ? "active" : ""}`}>
            Accueil
          </Link>
        </div>

        {/* ── Desktop Buttons ── */}
        <div className="navbar-actions">
          <Link to="/auth/sign-in" className="btn-login">
            Se connecter
          </Link>
          <Link to="/auth/sign-up" className="btn-register">
            S'inscrire
          </Link>
        </div>

        {/* ── Mobile Menu Toggle ── */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen
            ? <XMarkIcon className="w-6 h-6" />
            : <Bars3Icon className="w-6 h-6" />
          }
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="navbar-mobile">
          <Link
            to="/"
            className={`mobile-link ${isActive("/") ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Accueil
          </Link>
          <div className="mobile-divider" />
          <Link
            to="/auth/sign-in"
            className="mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            Se connecter
          </Link>
          <Link
            to="/auth/sign-up"
            className="mobile-btn-register"
            onClick={() => setMenuOpen(false)}
          >
            S'inscrire
          </Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;