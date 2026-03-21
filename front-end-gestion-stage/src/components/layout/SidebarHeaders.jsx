import { Typography, Chip } from "@material-tailwind/react";
import { BuildingOfficeIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

/** Header sidebar pour étudiant */
export function StudentSidebarHeader() {
  return (
    <>
      <Typography variant="h5" className="font-bold text-blue-500">
        🎓 MyStage
      </Typography>
      <Typography variant="small" className="text-blue-gray-500">
        Plateforme de stages
      </Typography>
    </>
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
