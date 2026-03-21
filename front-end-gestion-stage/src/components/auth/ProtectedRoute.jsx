import { Navigate, useLocation } from "react-router-dom";

/**
 * Récupère l'utilisateur et le rôle actuels depuis localStorage
 */
export function getAuthUser() {
  try {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const entrepriseRole = localStorage.getItem("entrepriseRole");

    if (!token || !userStr) return null;

    const user = JSON.parse(userStr);
    // Priorité: entrepriseRole > user.role > user.type (ex: type=enterprise, role=manager)
    const role = entrepriseRole || user.role || user.type;

    return {
      ...user,
      role: role?.toLowerCase?.(),
      type: (user.type || role)?.toLowerCase?.(),
      isAuthenticated: true,
    };
  } catch {
    return null;
  }
}

/**
 * Vérifie si l'utilisateur a un des rôles requis
 */
export function hasRequiredRole(user, allowedRoles) {
  if (!user || !allowedRoles?.length) return false;
  const r = (user.role || user.type || "").toLowerCase();
  return allowedRoles.some((allowed) => allowed.toLowerCase() === r);
}

/**
 * Route protégée par authentification et rôle
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenu à afficher si autorisé
 * @param {string[]} props.allowedRoles - Rôles autorisés (ex: ['manager'], ['student'], ['manager','rh','encadrant'])
 * @param {boolean} props.requireAuth - Si true, redirige vers login si non connecté (défaut: true)
 */
export function ProtectedRoute({ children, allowedRoles = [], requireAuth = true }) {
  const location = useLocation();
  const user = getAuthUser();

  if (!user) {
    if (requireAuth) {
      return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
    }
    return <Navigate to="/access-denied" replace />;
  }

  if (allowedRoles.length > 0 && !hasRequiredRole(user, allowedRoles)) {
    return <Navigate to="/access-denied" state={{ from: location, requiredRoles: allowedRoles }} replace />;
  }

  return children;
}
