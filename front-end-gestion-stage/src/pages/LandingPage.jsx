import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppFooter from "../components/layout/AppFooter";

const ROLES = [
  {
    icon: "👨‍🎓",
    label: "Étudiant",
    desc: "Postulez aux offres de stage, suivez vos candidatures et gérez votre parcours en temps réel.",
    color: "#3B82F6",
  },
  {
    icon: "🏢",
    label: "RH / Entreprise",
    desc: "Publiez vos offres, évaluez les profils et sélectionnez les meilleurs talents.",
    color: "#8B5CF6",
  },
  {
    icon: "👨‍🏫",
    label: "Encadrant",
    desc: "Suivez vos stagiaires, rédigez vos évaluations et communiquez facilement.",
    color: "#06B6D4",
  },
  {
    icon: "🛠",
    label: "Administrateur",
    desc: "Supervisez l'ensemble de la plateforme avec des outils de pilotage avancés.",
    color: "#10B981",
  },
];

const FEATURES = [
  {
    num: "01",
    title: "Gestion des Offres",
    desc: "Publiez, modifiez et gérez les offres de stage avec un workflow structuré et des notifications automatiques.",
    icon: "📋",
  },
  {
    num: "02",
    title: "Suivi des Candidatures",
    desc: "Consultez les candidatures, affectez des encadrants et suivez chaque étape du processus de sélection.",
    icon: "🔍",
  },
  {
    num: "03",
    title: "Tableaux de Bord",
    desc: "Visualisez les statistiques en temps réel avec des dashboards adaptatifs selon votre rôle.",
    icon: "📊",
  },
  {
    num: "04",
    title: "Messagerie Intégrée",
    desc: "Communiquez directement entre étudiants, encadrants et RH sans quitter la plateforme.",
    icon: "💬",
  },
  {
    num: "05",
    title: "Rapports & Évaluations",
    desc: "Générez des rapports de stage, soumettez et évaluez en quelques clics.",
    icon: "📝",
  },
  {
    num: "06",
    title: "Notifications Temps Réel",
    desc: "Restez informé à chaque étape : alertes instantanées pour toutes les actions importantes.",
    icon: "🔔",
  },
];

const STATS = [
  { value: "2 400+", label: "Étudiants actifs" },
  { value: "380+", label: "Entreprises partenaires" },
  { value: "95%", label: "Taux de satisfaction" },
  { value: "1 200+", label: "Stages réalisés" },
];

const TESTIMONIALS = [
  {
    name: "Yasmine Belhaj",
    role: "Étudiante en Génie Informatique",
    avatar: "YB",
    color: "#3B82F6",
    text: "MyStage m'a permis de trouver mon stage en moins d'une semaine. L'interface est intuitive et le suivi des candidatures en temps réel est vraiment pratique.",
    stars: 5,
  },
  {
    name: "Karim Mansouri",
    role: "Responsable RH · TechCorp Tunisie",
    avatar: "KM",
    color: "#8B5CF6",
    text: "Nous avons réduit notre temps de recrutement de 40%. La centralisation des candidatures et les outils de filtrage sont excellents. Je recommande vivement.",
    stars: 5,
  },
  {
    name: "Dr. Sonia Trabelsi",
    role: "Encadrante · Université de Sfax",
    avatar: "ST",
    color: "#06B6D4",
    text: "Le suivi des stagiaires est devenu beaucoup plus simple. Je peux communiquer, évaluer et consulter les rapports depuis un seul endroit. Gain de temps énorme.",
    stars: 5,
  },
  {
    name: "Mehdi Chaabane",
    role: "Étudiant en Finance",
    avatar: "MC",
    color: "#10B981",
    text: "Grâce à MyStage, j'ai décroché un stage dans une multinationale. Les notifications en temps réel m'ont évité de rater des opportunités importantes.",
    stars: 4,
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

export default function LandingPage() {
  const [heroRef, heroVisible] = useInView(0.1);
  const [featRef, featVisible] = useInView(0.1);
  const [rolesRef, rolesVisible] = useInView(0.1);
  const [statsRef, statsVisible] = useInView(0.1);
  const [testiRef, testiVisible] = useInView(0.1);

  return (
    <div style={{ fontFamily: "'Sora', 'DM Sans', sans-serif", background: "#FFFFFF", color: "#0F172A", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

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

        .btn-primary {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          color: white;
          padding: 0.85rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 24px rgba(59,130,246,0.35);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(59,130,246,0.5); opacity: 0.92; }

        .btn-ghost {
          background: #F8FAFC;
          color: #0F172A;
          padding: 0.85rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid #E2E8F0;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .btn-ghost:hover { background: #F1F5F9; border-color: #CBD5E1; transform: translateY(-2px); }

        .fade-up {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1);
        }
        .fade-up.visible { opacity: 1; transform: none; }

        .stagger-1 { transition-delay: 0.1s; }
        .stagger-2 { transition-delay: 0.2s; }
        .stagger-3 { transition-delay: 0.3s; }
        .stagger-4 { transition-delay: 0.4s; }
        .stagger-5 { transition-delay: 0.5s; }
        .stagger-6 { transition-delay: 0.6s; }

        .feature-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 2rem;
          transition: border-color 0.3s, background 0.3s, transform 0.3s, box-shadow 0.3s;
          cursor: default;
        }
        .feature-card:hover {
          background: #FFFFFF;
          border-color: #BFDBFE;
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(59,130,246,0.1);
        }

        .role-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 2.5rem 2rem;
          transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
          cursor: default;
          text-align: center;
        }
        .role-card:hover {
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
          transform: translateY(-6px);
        }

        .stat-box {
          text-align: center;
          padding: 2rem;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.2);
          color: #2563EB;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.35rem 0.9rem;
          border-radius: 100px;
          margin-bottom: 1.5rem;
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        .section-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3B82F6;
          margin-bottom: 0.75rem;
        }

        .divider-line {
          width: 48px;
          height: 3px;
          background: linear-gradient(90deg, #3B82F6, #8B5CF6);
          border-radius: 4px;
          margin: 0 auto 1.5rem;
        }

        @media (max-width: 768px) {
          .nav-links { display: none; }
          .hero-btns { flex-direction: column; align-items: center; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .roles-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1rem 2.5rem",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid #E2E8F0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: 34, height: 34,
            background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem",
          }}>🎓</div>
          <span style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em" }}>
            MyStage
          </span>
        </div>

        <div className="nav-links" style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
          <a href="#features" className="nav-link">Fonctionnalités</a>
          <a href="#roles" className="nav-link">Pour qui ?</a>
          <a href="#stats" className="nav-link">Chiffres</a>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link to="/auth/sign-in" className="nav-link" style={{ fontWeight: 600 }}>Connexion</Link>
          <Link to="/auth/sign-up" className="btn-primary" style={{ padding: "0.6rem 1.4rem", fontSize: "0.875rem" }}>
            S'inscrire →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{
        position: "relative",
        minHeight: "92vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center",
        padding: "6rem 2rem 4rem",
        overflow: "hidden",
      }}>
        {/* background orbs */}
        <div className="glow-orb" style={{ width: 600, height: 600, background: "rgba(59,130,246,0.18)", top: -200, left: -150 }} />
        <div className="glow-orb" style={{ width: 500, height: 500, background: "rgba(139,92,246,0.15)", top: 100, right: -100 }} />
        <div className="glow-orb" style={{ width: 400, height: 400, background: "rgba(6,182,212,0.10)", bottom: -100, left: "40%" }} />

        {/* grid overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }} />

        <div className={`fade-up ${heroVisible ? "visible" : ""}`} style={{ position: "relative", zIndex: 1 }}>
          <div className="badge">✦ Plateforme de stages nouvelle génération</div>

          <h1 style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            maxWidth: 820,
            margin: "0 auto 1.5rem",
          }}>
            Gérez vos stages{" "}
            <span style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              intelligemment
            </span>
          </h1>

          <p style={{
            maxWidth: 580,
            margin: "0 auto 2.5rem",
            fontSize: "1.125rem",
            lineHeight: 1.7,
            color: "#64748B",
            fontWeight: 300,
          }}>
            Connectez étudiants, entreprises et encadrants dans un écosystème fluide, moderne et collaboratif.
          </p>

          <div className="hero-btns" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/auth/sign-up" className="btn-primary">
              Commencer gratuitement →
            </Link>
            <Link to="/auth/sign-in" className="btn-ghost">
              Se connecter
            </Link>
          </div>

          {/* trust line */}
          <p style={{ marginTop: "3rem", fontSize: "0.8rem", color: "#475569", letterSpacing: "0.04em" }}>
            Déjà adopté par <strong style={{ color: "#64748B" }}>+380 entreprises</strong> et <strong style={{ color: "#64748B" }}>+2 400 étudiants</strong>
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" ref={statsRef} style={{ padding: "4rem 2.5rem", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 900, margin: "0 auto", gap: "1rem" }}>
          {STATS.map((s, i) => (
            <div key={i} className={`stat-box fade-up stagger-${i + 1} ${statsVisible ? "visible" : ""}`}>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #2563EB, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.875rem", color: "#64748B", marginTop: "0.4rem", fontWeight: 400 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" ref={featRef} style={{ padding: "7rem 2.5rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p className="section-label">Fonctionnalités</p>
          <div className="divider-line" />
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
            Tout ce dont vous avez besoin
          </h2>
          <p style={{ maxWidth: 480, margin: "1rem auto 0", color: "#64748B", lineHeight: 1.7 }}>
            Une suite complète d'outils pensée pour simplifier chaque étape du processus de stage.
          </p>
        </div>

        <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
          {FEATURES.map((f, i) => (
            <div key={i} className={`feature-card fade-up stagger-${(i % 3) + 1} ${featVisible ? "visible" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "1.75rem" }}>{f.icon}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", letterSpacing: "0.05em" }}>{f.num}</span>
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.6rem", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "#64748B", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles" ref={rolesRef} style={{ padding: "7rem 2.5rem", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <p className="section-label">Utilisateurs</p>
            <div className="divider-line" />
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.025em" }}>
              Une plateforme pour tous
            </h2>
            <p style={{ maxWidth: 440, margin: "1rem auto 0", color: "#64748B", lineHeight: 1.7 }}>
              Chaque profil dispose d'un espace personnalisé adapté à ses besoins.
            </p>
          </div>

          <div className="roles-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
            {ROLES.map((r, i) => (
              <div key={i} className={`role-card fade-up stagger-${i + 1} ${rolesVisible ? "visible" : ""}`}
                style={{ borderColor: `${r.color}22` }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${r.color}55`}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${r.color}22`}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: `${r.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.75rem", margin: "0 auto 1.25rem",
                  border: `1px solid ${r.color}30`,
                }}>
                  {r.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{r.label}</h3>
                <p style={{ fontSize: "0.875rem", color: "#64748B", lineHeight: 1.6 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section ref={testiRef} style={{ padding: "7rem 2.5rem", background: "#FFFFFF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <p className="section-label">Témoignages</p>
            <div className="divider-line" />
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
              Ce qu'ils en disent
            </h2>
            <p style={{ maxWidth: 440, margin: "1rem auto 0", color: "#64748B", lineHeight: 1.7 }}>
              Des étudiants, encadrants et entreprises qui font confiance à MyStage au quotidien.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`fade-up stagger-${(i % 2) + 1} ${testiVisible ? "visible" : ""}`}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 20,
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  transition: "box-shadow 0.3s, transform 0.3s, border-color 0.3s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = `${t.color}44`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                }}
              >
                {/* Stars */}
                <div style={{ display: "flex", gap: "0.2rem" }}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <span key={s} style={{ color: s < t.stars ? "#F59E0B" : "#E2E8F0", fontSize: "1rem" }}>★</span>
                  ))}
                </div>

                {/* Quote */}
                <p style={{
                  fontSize: "0.95rem",
                  lineHeight: 1.75,
                  color: "#334155",
                  fontStyle: "italic",
                  flexGrow: 1,
                }}>
                  "{t.text}"
                </p>

                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid #F1F5F9" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: `${t.color}18`,
                    border: `2px solid ${t.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.8rem", color: t.color,
                    flexShrink: 0,
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0F172A" }}>{t.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "#94A3B8", marginTop: "0.1rem" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: "8rem 2.5rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div className="glow-orb" style={{ width: 700, height: 400, background: "rgba(59,130,246,0.08)", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="section-label">Prêt à démarrer ?</p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.03em", maxWidth: 640, margin: "0 auto 1.5rem", lineHeight: 1.1 }}>
            Rejoignez MyStage <br />
            <span style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              dès aujourd'hui
            </span>
          </h2>
          <p style={{ color: "#64748B", marginBottom: "2.5rem", fontSize: "1.05rem" }}>
            Inscription gratuite · Accès immédiat · Aucune carte bancaire requise
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/auth/sign-up" className="btn-primary">
              Créer un compte gratuit →
            </Link>
            <Link to="/auth/sign-in" className="btn-ghost">
              J'ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      <AppFooter variant="dark" />
    </div>
  );
}