import { Link, useLocation } from "react-router-dom";
import { Typography, Button } from "@material-tailwind/react";
import { ShieldExclamationIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function AccessDenied() {
  const location = useLocation();
  const from = location.state?.from?.pathname;
  const requiredRoles = location.state?.requiredRoles;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
          <ShieldExclamationIcon className="w-12 h-12 text-red-600" />
        </div>

        <Typography variant="h3" className="font-bold text-gray-900 mb-2">
          Accès non autorisé
        </Typography>

        <Typography className="text-gray-600 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          {requiredRoles?.length > 0 && (
            <span className="block mt-2 text-sm text-gray-500">
              Rôle(s) requis : {requiredRoles.join(", ")}
            </span>
          )}
        </Typography>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {from && (
            <Link to={from}>
              <Button color="blue" variant="outlined" className="flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4" />
                Retour
              </Button>
            </Link>
          )}
          <Link to="/">
            <Button color="blue">Retour à l'accueil</Button>
          </Link>
          <Link to="/auth/sign-in">
            <Button color="gray" variant="outlined">
              Se connecter
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
