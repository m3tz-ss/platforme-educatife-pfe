import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import LandingNavbar from "../Landingnavbar";

/* ─── SVG Icons ─── */
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
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
const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M9 8h1m-1 4h1m-1 4h1m4-8h1m-1 4h1m-1 4h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
  </svg>
);
const IconGradCap = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const IconOffice = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M9 8h1m-1 4h1m-1 4h1m4-8h1m-1 4h1m-1 4h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
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
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ─── Password strength ─── */
const getStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "#e5e7eb" };
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { score: 0, label: "",          color: "#e5e7eb" },
    { score: 1, label: "Très faible", color: "#ef4444" },
    { score: 2, label: "Faible",     color: "#f97316" },
    { score: 3, label: "Moyen",      color: "#eab308" },
    { score: 4, label: "Fort",       color: "#22c55e" },
    { score: 5, label: "Très fort",  color: "#16a34a" },
  ];
  return map[Math.min(score, 5)];
};

export function SignUp() {
  const navigate = useNavigate();

  const [name,         setName]         = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [companyName,  setCompanyName]  = useState("");
  const [agree,        setAgree]        = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [userType,     setUserType]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState(false);

  // ✅ Guard anti-double-submit
  const submittingRef = useRef(false);

  const strength = getStrength(password);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Validations client
    if (!userType)                                        return setError("Choisissez Étudiant ou Entreprise");
    if (!agree)                                           return setError("Acceptez les conditions d'utilisation");
    if (!name || !email || !password)                    return setError("Tous les champs sont requis");
    if (userType === "enterprise" && !companyName)       return setError("Le nom de l'entreprise est requis");
    if (password.length < 6)                             return setError("Le mot de passe doit contenir au moins 6 caractères");

    // ✅ Guard contre double-submit
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError("");
    setLoading(true);

    let destination = null;

    try {
      const res = await api.post("/register", {
        name,
        email,
        password,
        type:            userType,
        role:            userType === "enterprise" ? "manager" : null,
        enterprise_name: userType === "enterprise" ? companyName : undefined,
      });

      // ✅ Batch localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      destination = userType === "enterprise" ? "/enterprise/manager" : "/auth/sign-in";
      setSuccess(true);

    } catch (err) {
      setError(err?.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      // ✅ setLoading AVANT navigate pour éviter setState sur composant démonté
      setLoading(false);
      submittingRef.current = false;
      if (destination) navigate(destination);
    }
  }, [name, email, password, companyName, userType, agree, navigate]);

  return (
    <>
      <LandingNavbar />

      <div style={styles.page}>
        {/* Décoration de fond */}
        <div style={{ ...styles.blob, top: "-80px", right: "-80px", background: "radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)" }} />
        <div style={{ ...styles.blob, bottom: "-60px", left: "-60px", background: "radial-gradient(circle, rgba(139,92,246,.14) 0%, transparent 70%)" }} />

        <div style={styles.card}>

          {/* ── Header ── */}
          <div style={styles.cardHeader}>
            <div style={styles.logoRow}>
              <span style={{ fontSize: 24 }}>🎓</span>
              <span style={styles.logoText}>MyStage</span>
            </div>
            <h3 style={styles.cardTitle}>Créer un compte</h3>
            <p style={styles.cardSub}>Rejoignez notre plateforme de stages</p>
          </div>

          {/* ── Sélection du profil ── */}
          <div style={styles.typeSection}>
            <p style={styles.typeLabel}>Choisissez votre profil</p>
            <div style={styles.typeGrid}>

              {/* Étudiant */}
              <button
                type="button"
                onClick={() => { setUserType("student"); setError(""); }}
                style={{
                  ...styles.typeCard,
                  ...(userType === "student" ? styles.typeCardActive : {}),
                }}
              >
                <div style={{
                  ...styles.typeIconWrap,
                  background: userType === "student" ? "#ede9fe" : "#f3f4f6",
                  color:      userType === "student" ? "#7c3aed" : "#6b7280",
                }}>
                  <IconGradCap />
                </div>
                <span style={styles.typeCardTitle}>Étudiant</span>
                <span style={styles.typeCardSub}>Chercher un stage</span>
              </button>

              {/* Entreprise */}
              <button
                type="button"
                onClick={() => { setUserType("enterprise"); setError(""); }}
                style={{
                  ...styles.typeCard,
                  ...(userType === "enterprise" ? styles.typeCardActive : {}),
                }}
              >
                <div style={{
                  ...styles.typeIconWrap,
                  background: userType === "enterprise" ? "#ede9fe" : "#f3f4f6",
                  color:      userType === "enterprise" ? "#7c3aed" : "#6b7280",
                }}>
                  <IconOffice />
                </div>
                <span style={styles.typeCardTitle}>Entreprise</span>
                <span style={styles.typeCardSub}>Publier une offre</span>
              </button>
            </div>
          </div>

          {/* ── Erreur ── */}
          {error && (
            <div style={styles.errorBox} role="alert">
              <span style={{ fontSize: 15 }}>⚠️</span>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {/* ── Succès ── */}
          {success && (
            <div style={styles.successBox} role="status">
              <span style={{ fontSize: 15 }}>✅</span>
              <span style={styles.successText}>Compte créé avec succès, redirection…</span>
            </div>
          )}

          {/* ── Formulaire ── */}
          <form onSubmit={handleSubmit} noValidate style={styles.form}>

            {/* Nom complet */}
            <div style={styles.field}>
              <label htmlFor="signup-name" style={styles.label}>Nom complet</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}><IconUser /></span>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={styles.input}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div style={styles.field}>
              <label htmlFor="signup-email" style={styles.label}>Email</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}><IconMail /></span>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="jean@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Nom entreprise — visible uniquement si enterprise */}
            {userType === "enterprise" && (
              <div style={styles.field}>
                <label htmlFor="signup-company" style={styles.label}>Nom de l'entreprise</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}><IconBuilding /></span>
                  <input
                    id="signup-company"
                    type="text"
                    placeholder="MyEntreprise SARL"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={styles.input}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Mot de passe */}
            <div style={styles.field}>
              <label htmlFor="signup-password" style={styles.label}>Mot de passe</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}><IconLock /></span>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  <IconEye open={showPassword} />
                </button>
              </div>

              {/* Barre de force du mot de passe */}
              {password && (
                <div style={styles.strengthWrap}>
                  <div style={styles.strengthBar}>
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} style={{
                        ...styles.strengthSegment,
                        background: i <= strength.score ? strength.color : "#e5e7eb",
                      }} />
                    ))}
                  </div>
                  <span style={{ ...styles.strengthLabel, color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Conditions */}
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                style={styles.checkbox}
                disabled={loading}
              />
              <span style={styles.checkText}>
                J'accepte les{" "}
                <Link to="/terms" style={styles.link}>conditions d'utilisation</Link>
              </span>
            </label>

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={loading || !userType || success}
              style={{
                ...styles.submitBtn,
                ...((loading || !userType || success) ? styles.submitBtnDisabled : {}),
              }}
            >
              {loading ? (
                <span style={styles.loadingRow}>
                  <IconSpinner />
                  Création en cours…
                </span>
              ) : "Créer un compte"}
            </button>
          </form>

          {/* ── Divider ── */}
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>ou</span>
            <span style={styles.dividerLine} />
          </div>

          {/* ── Lien connexion ── */}
          <p style={styles.signinText}>
            Vous avez déjà un compte ?{" "}
            <Link to="/auth/sign-in" style={styles.link}>Se connecter</Link>
          </p>

          {/* ── Avantages ── */}
          <div style={styles.benefitsBox}>
            <p style={styles.benefitsTitle}>✨ Pourquoi rejoindre MyStage ?</p>
            <div style={styles.benefitsList}>
              {[
                "Accès à des centaines d'offres de stage",
                "Suivi en temps réel de vos candidatures",
                "Messagerie directe avec les entreprises",
              ].map((b) => (
                <div key={b} style={styles.benefitItem}>
                  <span style={styles.benefitIcon}><IconCheck /></span>
                  <span style={styles.benefitText}>{b}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Styles — cohérents avec SignIn.jsx
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
  /* ─ Card ─ */
  card: {
    position: "relative",
    zIndex: 1,
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 4px 6px -1px rgba(79,70,229,.07), 0 20px 60px -10px rgba(79,70,229,.12)",
    padding: "36px 32px",
    width: "100%",
    maxWidth: "460px",
    boxSizing: "border-box",
  },
  cardHeader: { textAlign: "center", marginBottom: "24px" },
  logoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e1b4b",
    letterSpacing: "-0.4px",
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 6px",
    letterSpacing: "-0.4px",
  },
  cardSub: { fontSize: "13.5px", color: "#6b7280", margin: 0 },
  /* ─ Type selection ─ */
  typeSection: { marginBottom: "20px" },
  typeLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: "12px",
  },
  typeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  typeCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "16px 12px",
    background: "#f9fafb",
    border: "1.5px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "border-color .15s, background .15s, box-shadow .15s",
    textAlign: "center",
  },
  typeCardActive: {
    border: "1.5px solid #7c3aed",
    background: "#faf5ff",
    boxShadow: "0 0 0 3px rgba(124,58,237,.1)",
  },
  typeIconWrap: {
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background .15s, color .15s",
  },
  typeCardTitle: { fontSize: "13.5px", fontWeight: "600", color: "#111827" },
  typeCardSub:   { fontSize: "11.5px", color: "#9ca3af" },
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
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13.5px", fontWeight: "600", color: "#374151", userSelect: "none" },
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
  /* ─ Strength bar ─ */
  strengthWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "6px",
  },
  strengthBar: { display: "flex", gap: "4px", flex: 1 },
  strengthSegment: {
    flex: 1,
    height: "4px",
    borderRadius: "2px",
    transition: "background .3s",
  },
  strengthLabel: { fontSize: "11.5px", fontWeight: "600", minWidth: "60px", textAlign: "right" },
  /* ─ Checkbox ─ */
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    userSelect: "none",
    marginTop: "-2px",
  },
  checkbox: { width: "15px", height: "15px", accentColor: "#7c3aed", cursor: "pointer", flexShrink: 0 },
  checkText: { fontSize: "13px", color: "#374151", lineHeight: "1.5" },
  link: { color: "#7c3aed", fontWeight: "600", textDecoration: "none" },
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
    marginTop: "2px",
    letterSpacing: "0.01em",
  },
  submitBtnDisabled: { opacity: 0.6, cursor: "not-allowed" },
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
  dividerLine:  { flex: 1, height: "1px", background: "#e5e7eb" },
  dividerText:  { fontSize: "12.5px", color: "#9ca3af" },
  /* ─ Sign in ─ */
  signinText: {
    textAlign: "center",
    fontSize: "13.5px",
    color: "#6b7280",
    margin: "0 0 20px",
  },
  /* ─ Benefits ─ */
  benefitsBox: {
    background: "#f5f3ff",
    border: "1px solid #ddd6fe",
    borderRadius: "12px",
    padding: "14px 16px",
  },
  benefitsTitle: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#4c1d95",
    margin: "0 0 10px",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },
  benefitsList:  { display: "flex", flexDirection: "column", gap: "7px" },
  benefitItem:   { display: "flex", alignItems: "center", gap: "8px" },
  benefitIcon:   {
    flexShrink: 0,
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#7c3aed",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { fontSize: "12.5px", color: "#5b21b6" },
};

export default SignUp;