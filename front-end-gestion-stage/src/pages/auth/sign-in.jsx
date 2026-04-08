import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import LandingNavbar from "../Landingnavbar";

/* ─── SVG Icons (no external icon lib needed) ─── */
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = ({ open }) => open ? (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconSpinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}svg{animation:spin .8s linear infinite;transform-origin:center}`}</style>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ─── Role redirect map ─── */
const ROLE_ROUTES = {
  admin:      "/admin",
  student:    "/student",
  manager:    "/enterprise/manager",
  rh:         "/enterprise/offers",
  encadrant:  "/enterprise/encadrant",
  enterprise: "/enterprise/offers",
};

/* ─── Feature list ─── */
const FEATURES = [
  { label: "Pour les RH",       desc: "Publiez vos offres et gérez les candidatures facilement" },
  { label: "Pour les Étudiants", desc: "Découvrez les meilleures offres de stage" },
  { label: "Sécurisé & Fiable", desc: "Vos données protégées avec les plus hauts standards" },
];

/* ─── Demo accounts ─── */
const DEMO_ACCOUNTS = [
  { role: "Étudiant", email: "student@example.com", password: "password" },
  { role: "RH",       email: "rh@demo.com",         password: "demo123"  },
  { role: "Manager",  email: "manager@demo.com",     password: "demo123"  },
];

export function SignIn() {
  const navigate = useNavigate();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [rememberMe,   setRememberMe]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success,      setSuccess]      = useState(false);

  // ✅ Guard contre double-submit
  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // ✅ Empêche toute soumission multiple même si disabled ne s'applique pas encore
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError("");
    setLoading(true);

    let destination = null;

    try {
      const res = await api.post("/login", { email, password });

      const { token, user } = res.data;

      // ✅ Batch les écritures localStorage (synchrones mais groupées)
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (rememberMe) localStorage.setItem("rememberMe", email);

      destination = ROLE_ROUTES[user.type] || "/";
      setSuccess(true);

    } catch (err) {
      setError(err.response?.data?.message || "Email ou mot de passe incorrect");
    } finally {
      // ✅ setLoading AVANT navigate pour éviter setState sur composant démonté
      setLoading(false);
      submittingRef.current = false;
      if (destination) navigate(destination);
    }
  }, [email, password, rememberMe, navigate]);

  // ✅ Remplissage rapide des comptes démo
  const fillDemo = useCallback((account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }, []);

  return (
    <>
      <LandingNavbar />

      <div style={styles.page}>
        {/* ── Décoration de fond ── */}
        <div style={{ ...styles.blob, top: "-80px", right: "-80px", background: "radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)" }} />
        <div style={{ ...styles.blob, bottom: "-60px", left: "-60px", background: "radial-gradient(circle, rgba(139,92,246,.14) 0%, transparent 70%)" }} />

        <div style={styles.grid}>

          {/* ── Panneau gauche ── */}
          <div style={styles.leftPanel}>
            <div style={styles.logoRow}>
              <span style={styles.logoIcon}>🎓</span>
              <span style={styles.logoText}>MyStage</span>
            </div>

            <h2 style={styles.leftTitle}>Plateforme de Stages</h2>
            <p style={styles.leftSub}>
              Connectez-vous pour accéder à votre tableau de bord
              et gérer vos offres de stage ou vos candidatures.
            </p>

            <div style={styles.featureList}>
              {FEATURES.map((f) => (
                <div key={f.label} style={styles.featureItem}>
                  <div style={styles.featureIcon}><IconCheck /></div>
                  <div>
                    <div style={styles.featureLabel}>{f.label}</div>
                    <div style={styles.featureDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Formulaire ── */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Se connecter</h3>
              <p style={styles.cardSub}>Entrez vos identifiants pour accéder à votre compte</p>
            </div>

            {/* Erreur */}
            {error && (
              <div style={styles.errorBox} role="alert">
                <span style={{ fontSize: 15 }}>⚠️</span>
                <span style={styles.errorText}>{error}</span>
              </div>
            )}

            {/* Succès */}
            {success && (
              <div style={styles.successBox} role="status">
                <span style={{ fontSize: 15 }}>✅</span>
                <span style={styles.successText}>Connexion réussie, redirection…</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={styles.form}>

              {/* Email */}
              <div style={styles.field}>
                <label htmlFor="login-email" style={styles.label}>Email</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}><IconMail /></span>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="votre.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div style={styles.field}>
                <label htmlFor="login-password" style={styles.label}>Mot de passe</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}><IconLock /></span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...styles.input, paddingRight: "44px" }}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={styles.eyeBtn}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    <IconEye open={showPassword} />
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div style={styles.rememberRow}>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span style={styles.checkText}>Se souvenir de moi</span>
                </label>
                <Link to="/auth/forgot-password" style={styles.forgotLink}>
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Bouton submit */}
              <button
                type="submit"
                disabled={loading || success}
                style={{
                  ...styles.submitBtn,
                  ...(loading || success ? styles.submitBtnDisabled : {}),
                }}
              >
                {loading ? (
                  <span style={styles.loadingRow}>
                    <IconSpinner />
                    Connexion en cours…
                  </span>
                ) : "Se connecter"}
              </button>
            </form>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>ou</span>
              <span style={styles.dividerLine} />
            </div>

            {/* Créer un compte */}
            <p style={styles.signupText}>
              Vous n'avez pas de compte ?{" "}
              <Link to="/auth/sign-up" style={styles.signupLink}>Créer un compte</Link>
            </p>

            {/* Comptes démo */}
            <div style={styles.demoBox}>
              <p style={styles.demoTitle}>🔍 Comptes de démonstration</p>
              <div style={styles.demoGrid}>
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.role}
                    type="button"
                    onClick={() => fillDemo(a)}
                    style={styles.demoBtn}
                  >
                    <span style={styles.demoBtnRole}>{a.role}</span>
                    <span style={styles.demoBtnEmail}>{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f4f0ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Geist', 'DM Sans', system-ui, sans-serif",
  },
  blob: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
  },
  grid: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "960px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "40px",
    alignItems: "center",
    "@media (max-width: 768px)": { gridTemplateColumns: "1fr" },
  },
  /* ─ Left panel ─ */
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    "@media (max-width: 768px)": { display: "none" },
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: { fontSize: "28px" },
  logoText: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1e1b4b",
    letterSpacing: "-0.5px",
  },
  leftTitle: {
    fontSize: "30px",
    fontWeight: "700",
    color: "#1e1b4b",
    lineHeight: "1.25",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  leftSub: {
    fontSize: "15px",
    color: "#4c4a7a",
    lineHeight: "1.65",
    margin: 0,
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "8px",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  featureIcon: {
    flexShrink: 0,
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "#4f46e5",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "2px",
  },
  featureLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e1b4b",
    marginBottom: "2px",
  },
  featureDesc: {
    fontSize: "13px",
    color: "#6460a0",
    lineHeight: "1.5",
  },
  /* ─ Card ─ */
  card: {
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 4px 6px -1px rgba(79,70,229,.07), 0 20px 60px -10px rgba(79,70,229,.12)",
    padding: "36px 32px",
    width: "100%",
    boxSizing: "border-box",
  },
  cardHeader: { marginBottom: "24px" },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 6px",
    letterSpacing: "-0.4px",
  },
  cardSub: {
    fontSize: "13.5px",
    color: "#6b7280",
    margin: 0,
  },
  /* ─ Error / success ─ */
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "10px 14px",
    marginBottom: "16px",
  },
  errorText: { fontSize: "13.5px", color: "#dc2626" },
  successBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    padding: "10px 14px",
    marginBottom: "16px",
  },
  successText: { fontSize: "13.5px", color: "#16a34a" },
  /* ─ Form ─ */
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#374151",
    userSelect: "none",
  },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: {
    position: "absolute",
    left: "12px",
    color: "#9ca3af",
    display: "flex",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    paddingLeft: "40px",
    paddingRight: "16px",
    paddingTop: "11px",
    paddingBottom: "11px",
    fontSize: "14px",
    color: "#111827",
    background: "#f9fafb",
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    outline: "none",
    transition: "border-color .15s, box-shadow .15s",
  },
  eyeBtn: {
    position: "absolute",
    right: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    display: "flex",
    alignItems: "center",
    padding: "4px",
    borderRadius: "6px",
  },
  /* ─ Remember / forgot ─ */
  rememberRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "-4px",
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    cursor: "pointer",
    userSelect: "none",
  },
  checkbox: { width: "15px", height: "15px", accentColor: "#4f46e5", cursor: "pointer" },
  checkText: { fontSize: "13.5px", color: "#374151" },
  forgotLink: {
    fontSize: "13.5px",
    color: "#4f46e5",
    textDecoration: "none",
    fontWeight: "500",
  },
  /* ─ Submit ─ */
  submitBtn: {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#fff",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    border: "none",
    borderRadius: "11px",
    cursor: "pointer",
    transition: "opacity .15s, transform .1s",
    marginTop: "4px",
    letterSpacing: "0.01em",
  },
  submitBtnDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  /* ─ Divider ─ */
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "20px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#e5e7eb",
  },
  dividerText: { fontSize: "12.5px", color: "#9ca3af" },
  /* ─ Signup ─ */
  signupText: {
    textAlign: "center",
    fontSize: "13.5px",
    color: "#6b7280",
    margin: "0 0 20px",
  },
  signupLink: {
    color: "#4f46e5",
    fontWeight: "600",
    textDecoration: "none",
  },
  /* ─ Demo ─ */
  demoBox: {
    background: "#f5f3ff",
    border: "1px solid #ddd6fe",
    borderRadius: "12px",
    padding: "14px 16px",
  },
  demoTitle: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#4c1d95",
    margin: "0 0 10px",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },
  demoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  demoBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#fff",
    border: "1px solid #ede9fe",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    transition: "background .12s",
    textAlign: "left",
  },
  demoBtnRole: {
    fontSize: "12.5px",
    fontWeight: "600",
    color: "#5b21b6",
    minWidth: "64px",
  },
  demoBtnEmail: {
    fontSize: "12px",
    color: "#7c3aed",
    fontFamily: "monospace",
  },
};

export default SignIn;