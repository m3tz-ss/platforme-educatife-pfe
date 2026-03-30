import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        .nav-link {
          color: #64748B;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .nav-link:hover { color: #0F172A; background: rgba(0,0,0,0.05); }

        .nav-btn-primary {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          color: white;
          padding: 0.6rem 1.4rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 16px rgba(59,130,246,0.3);
        }
        .nav-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(59,130,246,0.45);
          opacity: 0.92;
        }

        .navbar-links-desktop {
          display: flex;
          gap: 0.25rem;
          align-items: center;
        }

        @media (max-width: 768px) {
          .navbar-links-desktop { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 2.5rem",
        background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid #E2E8F0" : "1px solid transparent",
        transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none",
        fontFamily: "'Sora', 'DM Sans', sans-serif",
      }}>

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", color: "inherit" }}>
          <div style={{
            width: 34, height: 34,
            background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem",
          }}>
            🎓
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em", color: "#0F172A" }}>
            MyStage
          </span>
        </Link>

        

        {/* Auth buttons */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link to="/auth/sign-in" className="nav-link" style={{ fontWeight: 600 }}>
            Connexion
          </Link>
          <Link to="/auth/sign-up" className="nav-btn-primary">
            S'inscrire →
          </Link>
        </div>

      </nav>
    </>
  );
}