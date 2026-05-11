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

      <div className="flex items-center gap-3 p-2 bg-blue-50/50 rounded-xl border border-blue-100">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-blue-200 flex-shrink-0 flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-blue-500 font-bold text-lg">{name?.charAt(0).toUpperCase() || "?"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Typography variant="small" className="font-bold text-blue-gray-900 truncate">
            {name || "Étudiant"}
          </Typography>
          <Typography variant="caption" className="text-blue-gray-500 block truncate">
            {email || "Mon compte"}
          </Typography>
        </div>
      </div>
    </div>
  );
}

/** Header sidebar pour entreprise */
export function EnterpriseSidebarHeader({ enterpriseName, logoUrl, roleConfig }) {
  const currentRole = roleConfig || { label: "Entreprise", color: "blue", icon: "🏢" };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Typography variant="h5" className="font-bold text-blue-500">
          🏢 MyStage
        </Typography>
      </div>

      {/* Enterprise Info with Logo */}
      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-3 mb-3">
           <div className="w-10 h-10 rounded-lg bg-white border border-blue-100 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
             {logoUrl ? (
               <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
             ) : (
               <BuildingOfficeIcon className="w-6 h-6 text-blue-500" />
             )}
           </div>
           <div className="min-w-0 flex-1">
             <Typography variant="small" className="font-bold text-blue-gray-900 truncate">
               {enterpriseName || "Mon Entreprise"}
             </Typography>
             <Typography variant="small" className="text-[10px] text-blue-gray-500 truncate">
               Espace Professionnel
             </Typography>
           </div>
        </div>
        
        <Chip
          value={`${currentRole.icon} ${currentRole.label}`}
          color={currentRole.color}
          size="sm"
          className="py-0.5 px-2 text-[10px]"
        />
      </div>
    </div>
  );
}
