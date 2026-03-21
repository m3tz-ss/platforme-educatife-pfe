import { Link } from "react-router-dom";
import { Typography } from "@material-tailwind/react";

/** variant: "light" (blanc, pour dashboard) | "dark" (sombre, pour landing) */
export default function AppFooter({ variant = "light" }) {
  const currentYear = new Date().getFullYear();
  const isDark = variant === "dark";

  return (
    <footer className={`py-4 px-6 mt-auto shrink-0 ${isDark ? "bg-gray-900 text-white border-t border-gray-800" : "bg-white border-t border-blue-gray-100"}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
        <div>
          <Typography variant="small" className={isDark ? "text-gray-400" : "text-blue-gray-500"}>
            © {currentYear} MyStage — Plateforme de gestion des stages
          </Typography>
        </div>
        <div className="flex gap-4">
          <Link to="/" className={`text-sm transition ${isDark ? "text-blue-300 hover:text-white" : "text-blue-500 hover:text-blue-700"}`}>
            Accueil
          </Link>
          <Link to="/auth/sign-in" className={`text-sm transition ${isDark ? "text-blue-300 hover:text-white" : "text-blue-500 hover:text-blue-700"}`}>
            Connexion
          </Link>
          <a href="mailto:contact@mystage.com" className={`text-sm transition ${isDark ? "text-blue-300 hover:text-white" : "text-blue-500 hover:text-blue-700"}`}>
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
