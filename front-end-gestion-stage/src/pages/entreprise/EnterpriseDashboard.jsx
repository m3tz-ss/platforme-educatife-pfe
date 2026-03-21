import { Typography, Card } from "@material-tailwind/react";
import { Link } from "react-router-dom";

export default function EnterpriseDashboard() {
  return (
    <div className="p-8">
      <Typography variant="h3" className="mb-6">
        Dashboard
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <Typography variant="h5">espace RH</Typography>
          <Typography className="mt-2 text-gray-600">
            Gérer les offres
          </Typography>
          <Link to="/enterprise/offers" className="text-blue-600 mt-4 inline-block">
            Accéder →
          </Link>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <Typography variant="h5">espace encadrant</Typography>
          <Typography className="mt-2 text-gray-600">
            Gérer les offres
          </Typography>
          <Link to="/enterprise/offers" className="text-blue-600 mt-4 inline-block">
            Accéder →
          </Link>
        </Card>
      </div>

    </div>
  );
}