import { useState } from "react";
import { Link } from "react-router-dom";
import { Typography, Button } from "@material-tailwind/react";
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import AppFooter from "./AppFooter";

/**
 
 * Contient : Sidebar + Header + Main + Footer
 * @param {Object} props
 * @param {string} props.title - Titre de la page (header)
 * @param {Array} props.menuItems - Items du menu sidebar [{ icon, label, path, badge }]
 * @param {React.ReactNode} props.sidebarHeader - Contenu personnalisé en haut de la sidebar (logo, infos entreprise...)
 * @param {React.ReactNode} props.sidebarExtra - Widget optionnel (progression, stats...) avant le bouton déconnexion
 * @param {React.ReactNode} props.headerActions - Actions dans le header (à droite)
 * @param {string} props.headerSubtitle - Sous-titre optionnel dans le header
 * @param {React.ReactNode} props.children - Contenu principal
 */
export default function BaseLayout({
  title,
  menuItems = [],
  sidebarHeader,
  sidebarExtra,
  headerActions,
  headerSubtitle,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col flex-shrink-0`}
        >
          <div className="p-6 border-b border-blue-gray-100">
            {sidebarHeader || (
              <>
                <Typography variant="h5" className="font-bold text-blue-500">
                  🎓 MyStage
                </Typography>
                <Typography variant="small" className="text-blue-gray-500">
                  Plateforme de stages
                </Typography>
              </>
            )}
          </div>

          <nav className="p-6 space-y-2 flex-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer">
                    <Icon className="w-5 h-5 text-blue-gray-600 group-hover:text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-blue-gray-700 group-hover:text-blue-600 truncate">
                      {item.label}
                    </span>
                    {item.badge != null && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {sidebarExtra && (
            <>
              <div className="mx-6 border-t border-blue-gray-100" />
              <div className="p-6 space-y-4">{sidebarExtra}</div>
            </>
          )}

          <div className="p-6 border-t border-blue-gray-100">
            <Link to="/auth/sign-in">
              <Button
                fullWidth
                color="red"
                variant="outlined"
                size="sm"
                className="flex items-center justify-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Déconnexion
              </Button>
            </Link>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="bg-white shadow-sm border-b border-blue-gray-100 flex-shrink-0">
            <div className="px-6 py-4 flex justify-between items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-blue-gray-50 rounded-lg transition-colors"
              >
                {sidebarOpen ? (
                  <XMarkIcon className="w-6 h-6 text-blue-gray-600" />
                ) : (
                  <Bars3Icon className="w-6 h-6 text-blue-gray-600" />
                )}
              </button>
              <div className="text-center">
                <Typography variant="h5" className="font-bold text-blue-gray-900">
                  {title}
                </Typography>
                {headerSubtitle && (
                  <Typography variant="small" className="text-blue-gray-400 text-xs">
                    {headerSubtitle}
                  </Typography>
                )}
              </div>
              <div className="min-w-[40px] flex justify-end gap-2">
                {headerActions || <span />}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="p-6 md:p-8">{children}</div>
          </main>

          <AppFooter />
        </div>
      </div>
    </div>
  );
}
