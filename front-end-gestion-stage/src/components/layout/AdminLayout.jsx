import { NavLink } from "react-router-dom";
import { getAdminMenuItems } from "../../config/sidebarConfig";

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconDashboard = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.4" />
    <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.4" />
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
  </svg>
);

const IconLogout = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none">
    <path d="M6 8h7M11 6l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 3H3a1 1 0 00-1 1v8a1 1 0 001 1h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ─── AdminLayout ──────────────────────────────────────────────────────────────

export default function AdminLayout({ children }) {
  const menuItems = getAdminMenuItems();

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@500;600;700&display=swap');
      `}</style>

      <div style={styles.root}>
        {/* ── Sidebar ── */}
        <aside style={styles.sidebar}>
          {/* Brand */}
          <div style={styles.brand}>
            <div style={styles.brandIcon}>
              <IconDashboard style={{ width: 17, height: 17 }} />
            </div>
            <span style={styles.brandName}>Admin</span>
          </div>

          {/* Section label */}
          <p style={styles.sectionLabel}>Menu</p>

          {/* Nav */}
          <nav style={styles.nav}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    ...styles.navItem,
                    ...(isActive ? styles.navItemActive : {}),
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon style={{ ...styles.navIcon, opacity: isActive ? 1 : 0.55 }} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && <span style={styles.dot} />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Divider */}
          <div style={styles.divider} />

          {/* Déconnexion */}
          <NavLink to="/auth/sign-in" style={styles.logout}>
            <IconLogout style={{ width: 15, height: 15, flexShrink: 0 }} />
            Déconnexion
          </NavLink>
        </aside>

        {/* ── Main ── */}
        <main style={styles.main}>
          {children}
        </main>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: "#f0f4fb",
    fontFamily: "'DM Sans', sans-serif",
  },

  // Sidebar
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: "#1b3a6b",
    display: "flex",
    flexDirection: "column",
    padding: "28px 14px 20px",
    position: "relative",
  },

  // Brand
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 36,
    padding: "0 6px",
  },
  brandIcon: {
    width: 32,
    height: 32,
    background: "#ffffff",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1b3a6b",
    flexShrink: 0,
  },
  brandName: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "0.02em",
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
    padding: "0 8px",
    margin: "0 0 8px",
  },

  // Nav
  nav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 10px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 400,
    color: "rgba(255,255,255,0.5)",
    textDecoration: "none",
    transition: "all 0.15s ease",
    border: "none",
    background: "none",
    width: "100%",
  },
  navItemActive: {
    background: "rgba(255,255,255,0.13)",
    color: "#ffffff",
    fontWeight: 500,
  },
  navIcon: {
    width: 15,
    height: 15,
    flexShrink: 0,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#7eb3f5",
    flexShrink: 0,
    marginLeft: "auto",
  },

  // Divider
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    margin: "16px 4px",
  },

  // Logout
  logout: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 10px",
    borderRadius: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    textDecoration: "none",
    transition: "all 0.15s",
    border: "none",
    background: "none",
    width: "100%",
  },

  // Main
  main: {
    flex: 1,
    padding: "30px 26px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    minHeight: "100vh",
    boxSizing: "border-box",
  },
};