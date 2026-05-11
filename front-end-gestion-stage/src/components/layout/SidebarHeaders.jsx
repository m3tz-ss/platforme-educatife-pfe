import { Typography, Chip } from "@material-tailwind/react";
import { BuildingOfficeIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

/** Header sidebar pour étudiant */
export function StudentSidebarHeader({ name, email, photoUrl }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Typography variant="h5" className="font-bold text-blue-500">
          🎓 MyStage
        </Typography>
      </div>
      
      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-200 flex-shrink-0 border-2 border-white shadow-sm">
          {photoUrl ? (
            <img src={photoUrl} alt="Profil" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-sm">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Typography variant="small" className="font-bold text-blue-gray-900 truncate">
            {name || "Étudiant"}
          </Typography>
          <Typography variant="small" className="text-[10px] text-blue-gray-500 truncate">
            {email || "Chargement..."}
          </Typography>
        </div>
      </div>
    </div>
  );
}

/** Header sidebar pour entreprise */
export function EnterpriseSidebarHeader({ enterpriseName, enterpriseEmail, roleConfig }) {
  const currentRole = roleConfig || { label: "Entreprise", color: "blue", icon: "🏢" };
  return (
    <>
      <Typography variant="h5" className="font-bold text-blue-500">
        🏢 MyStage
      </Typography>
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2 mb-1">
          <BuildingOfficeIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <Typography variant="small" className="font-bold text-blue-gray-900 truncate">
            {enterpriseName || "Mon Entreprise"}
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <EnvelopeIcon className="w-3 h-3 text-blue-gray-400 flex-shrink-0" />
          <Typography variant="small" className="text-blue-gray-500 text-xs truncate">
            {enterpriseEmail || "—"}
          </Typography>
        </div>
        <div className="mt-2">
          <Chip
            value={`${currentRole.icon} ${currentRole.label}`}
            color={currentRole.color}
            size="sm"
            className="text-xs"
          />
        </div>
      </div>
    </>
  );
}
