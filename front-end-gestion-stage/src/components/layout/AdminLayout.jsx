import { NavLink } from "react-router-dom";
import { getAdminMenuItems } from "../../config/sidebarConfig";

export default function AdminLayout({ children }) {
  const menuItems = getAdminMenuItems();

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4">

        <h2 className="text-xl font-bold text-gray-800 mb-8">
          Admin Panel
        </h2>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

      </aside>

      {/* Page */}
      <main className="flex-1">
        {children}
      </main>

    </div>
  );
}