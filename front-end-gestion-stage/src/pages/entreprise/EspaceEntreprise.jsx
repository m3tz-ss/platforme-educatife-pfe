import { useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
} from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UsersIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";

export function EspaceEntreprise() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("Manager");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
  { id: "manager", title: "Manager", description: "...", icon: BuildingOfficeIcon, color: "blue" },
  { id: "rh", title: "RH", description: "...", icon: UsersIcon, color: "green" },
  { id: "encadrant", title: "Encadrant", description: "...", icon: AcademicCapIcon, color: "purple" },
];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simulation d'appel API - À remplacer par votre vraie API
      const res = await api.post("/enterprise/login", {
        email,
        password,
        role: selectedRole,
      });

      // 🔐 Sauvegarde du token et des infos
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("entrepriseRole", selectedRole);

      // 🎯 Redirection basée sur le rôle sélectionné
      if (selectedRole === "manager") {
        navigate("/enterprise/manager");
      } else if (selectedRole === "rh") {
        navigate("/enterprise/offers");
      } else if (selectedRole === "encadrant") {
        navigate("/enterprise/encadrant");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Email ou mot de passe incorrect"
      );
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    return role?.color || "blue";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Back link */}
        <Link
          to="/auth/sign-in"
          className="inline-flex items-center gap-2 text-blue-gray-700 hover:text-blue-600 transition mb-6 group"
        >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition" />
          <Typography variant="small" className="font-medium">
            Retour à la connexion
          </Typography>
        </Link>

        <Card className="w-full shadow-2xl border-0 overflow-hidden">
          <CardBody className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <Typography variant="h3" className="font-bold text-blue-900 mb-2">
                🏢 Espace Entreprise
              </Typography>
              <Typography
                variant="lead"
                className="text-blue-gray-600"
              >
                Sélectionnez votre rôle pour accéder à votre espace
              </Typography>
            </div>

            {/* Role Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                const color = role.color;

                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`relative p-6 rounded-xl border-2 transition-all text-left group ${
                      isSelected
                        ? `border-${color}-500 bg-${color}-50 shadow-lg`
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className={`absolute top-2 right-2 w-3 h-3 bg-${color}-500 rounded-full animate-pulse`} />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center ${
                        isSelected
                          ? `bg-${color}-500 text-white`
                          : `bg-${color}-50 text-${color}-600 group-hover:bg-${color}-100`
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <Typography
                      variant="h6"
                      className={`font-bold mb-2 ${
                        isSelected ? `text-${color}-700` : "text-blue-gray-900"
                      }`}
                    >
                      {role.title}
                    </Typography>
                    <Typography
                      variant="small"
                      className="text-blue-gray-600 leading-relaxed"
                    >
                      {role.description}
                    </Typography>
                  </button>
                );
              })}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <Typography
                  variant="small"
                  className="text-red-700 flex items-center gap-2"
                >
                  <span>⚠️</span>
                  {error}
                </Typography>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
              {/* Email */}
              <div>
                <Typography
                  variant="small"
                  className="font-semibold text-blue-gray-900 mb-2 block"
                >
                  Adresse email
                </Typography>
                <Input
                  size="lg"
                  type="email"
                  placeholder="exemple@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<EnvelopeIcon className="w-5 h-5" />}
                  className="!border-blue-gray-300 placeholder:text-blue-gray-400"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <Typography
                  variant="small"
                  className="font-semibold text-blue-gray-900 mb-2 block"
                >
                  Mot de passe
                </Typography>
                <div className="relative">
                  <Input
                    size="lg"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<LockClosedIcon className="w-5 h-5" />}
                    className="!border-blue-gray-300 placeholder:text-blue-gray-400"
                    required
                  />
                  <IconButton
                    variant="text"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5 text-blue-gray-600" />
                    ) : (
                      <EyeIcon className="w-5 h-5 text-blue-gray-600" />
                    )}
                  </IconButton>
                </div>
              </div>

              {/* Forgot password link */}
              <div className="text-right">
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-blue-500 hover:text-blue-700 transition"
                >
                  Mot de passe oublié?
                </Link>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                color={getRoleColor(selectedRole)}
                size="lg"
                fullWidth
                className="mt-6 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Connexion en cours...
                  </span>
                ) : (
                  `Se connecter en tant que ${selectedRole}`
                )}
              </Button>
            </form>

            {/* Demo accounts info */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Typography variant="small" className="text-blue-gray-700 mb-2 font-semibold">
                🔍 Comptes de démonstration:
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <Typography variant="small" className="text-blue-gray-600">
                  <span className="font-medium text-blue-700">Manager:</span> manager@demo.com / demo123
                </Typography>
                <Typography variant="small" className="text-blue-gray-600">
                  <span className="font-medium text-green-700">RH:</span> rh@demo.com / demo123
                </Typography>
                <Typography variant="small" className="text-blue-gray-600">
                  <span className="font-medium text-purple-700">Encadrant:</span> encadrant@demo.com / demo123
                </Typography>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default EspaceEntreprise;