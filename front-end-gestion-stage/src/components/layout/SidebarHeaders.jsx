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
export function EnterpriseSidebarHeader({ enterpriseName, logoUrl, logo, roleConfig, name, email }) {
  const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");
  
  const getLogoUrl = (url, fallback) => {
    const path = url || fallback;
    if (!path) return null;
    if (path.startsWith("http")) return path;
    
    // Si ça commence par /storage ou storage, on s'assure d'avoir l'API_ORIGIN
    const cleanPath = path.replace(/^\//, "");
    return `${API_ORIGIN}/${cleanPath.startsWith("storage/") ? cleanPath : "storage/" + cleanPath}`;
  };

  const finalLogoUrl = getLogoUrl(logoUrl, logo);
  const currentRole = roleConfig || { label: "Entreprise", color: "blue", icon: "🏢" };
  const isEncadrant = currentRole.label === "Encadrant";
  const primaryText = isEncadrant ? "text-indigo-600" : "text-blue-600";
  const primaryBg = isEncadrant ? "bg-indigo-50/50" : "bg-blue-50/50";
  const primaryBorder = isEncadrant ? "border-indigo-100" : "border-blue-100";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5 px-1">
        <div className={`w-10 h-10 rounded-xl ${isEncadrant ? 'bg-indigo-600' : 'bg-blue-600'} flex items-center justify-center shadow-lg shadow-indigo-200/50`}>
          <Typography variant="h5" className="font-black text-white">
            {isEncadrant ? "🎓" : "🏢"}
          </Typography>
        </div>
        <div>
          <Typography variant="h5" className={`font-black tracking-tight ${primaryText}`}>
            MyStage
          </Typography>
          <Typography className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            {isEncadrant ? "" : "Portal Entreprise"}
          </Typography>
        </div>
      </div>

      {/* Enterprise & User Info Card */}
      <div className={`p-4 ${primaryBg} rounded-2xl border ${primaryBorder} shadow-sm space-y-4`}>
        <div className="flex items-center gap-3">
           <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
             {finalLogoUrl ? (
               <img src={finalLogoUrl} alt="Logo" className="w-full h-full object-cover" />
             ) : (
               <BuildingOfficeIcon className={`w-6 h-6 ${isEncadrant ? 'text-indigo-500' : 'text-blue-500'}`} />
             )}
           </div>
           <div className="min-w-0 flex-1">
             <Typography variant="small" className="font-black text-slate-900 truncate leading-tight">
               {enterpriseName || "Mon Entreprise"}
             </Typography>
             <Typography className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tighter">
               Espace Professionnel
             </Typography>
           </div>
        </div>

        <div className={`border-t ${isEncadrant ? 'border-indigo-100/50' : 'border-blue-100/50'} pt-3 flex items-center gap-3`}>
          <div className={`w-8 h-8 rounded-lg ${isEncadrant ? 'bg-indigo-600' : 'bg-blue-600'} flex items-center justify-center flex-shrink-0 text-xs font-black text-white shadow-sm`}>
            {name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <Typography variant="small" className="font-bold text-slate-800 text-[11px] truncate leading-tight">
              {name || "Utilisateur"}
            </Typography>
            <Typography className="text-slate-500 block truncate text-[10px] leading-tight">
              {email || "Mon compte"}
            </Typography>
          </div>
        </div>
        
        <div className="pt-1">
          <Chip
            value={`${currentRole.icon} ${currentRole.label}`}
            color={currentRole.color}
            size="sm"
            className="py-1 px-3 text-[10px] rounded-xl font-black shadow-sm uppercase"
            variant="gradient"
          />
        </div>
      </div>
    </div>
  );
}
/** Header sidebar pour les utilisateurs internes (Manager, RH, Encadrant) */
export function InternalSidebarHeader({ name, email, role, photoUrl, logoUrl, logo, enterpriseName }) {
  const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");
  
  const getLogoUrl = (url, fallback) => {
    const path = url || fallback;
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_ORIGIN}/storage/${path.replace(/^\//, "")}`;
  };

  const finalLogoUrl = getLogoUrl(logoUrl, logo);
  const roleLabels = {
    rh: { label: "RH", color: "purple" },
    encadrant: { label: "Encadrant", color: "emerald" },
    manager: { label: "Manager", color: "blue" },
    admin: { label: "Admin", color: "red" }
  };

  const current = roleLabels[role?.toLowerCase()] || { label: role || "Utilisateur", color: "blue" };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
          {finalLogoUrl ? (
            <img src={finalLogoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div>
          <Typography variant="h6" className="font-bold text-blue-gray-900 leading-tight">
            {enterpriseName || "MyStage"}
          </Typography>
          <Typography className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
            Espace Entreprise
          </Typography>
        </div>
      </div>

      <div className="flex items-center gap-3 p-2 bg-blue-50/30 rounded-xl border border-blue-100">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-blue-200 flex-shrink-0 flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-blue-600 font-bold text-lg">{name?.charAt(0).toUpperCase() || "?"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Typography variant="small" className="font-bold text-blue-gray-900 truncate">
            {name || "Utilisateur"}
          </Typography>
          <Typography variant="caption" className="text-blue-gray-500 block truncate text-[10px]">
            {email || "Chargement..."}
          </Typography>
        </div>
      </div>
      <div className="px-1">
        <Chip
          value={current.label}
          color={current.color}
          size="sm"
          variant="ghost"
          className="rounded-full w-fit text-[9px] font-bold py-0.5"
        />
      </div>
    </div>
  );
}
