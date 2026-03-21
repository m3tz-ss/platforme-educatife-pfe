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
  UserIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";

export function Manager() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      await api.post(
  "/enterprise/setup-manager",
  {
    name: form.name,
    email: form.email,
    password: form.password,
  },
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }
);

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

      <div className="relative z-10 w-full max-w-md">

        {/* Back link */}
        <Link
          to="/enterprise/login"
          className="inline-flex items-center gap-2 text-blue-gray-700 hover:text-blue-600 transition mb-6 group"
        >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition" />
          <Typography variant="small" className="font-medium">
            Retour au dashboard
          </Typography>
        </Link>

        <Card className="w-full shadow-2xl border-0 overflow-hidden">
          <CardBody className="p-8 md:p-10">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-blue-500" />
              </div>
              <Typography variant="h4" className="font-bold text-blue-900 mb-2">
                Créer un Manager
              </Typography>
              <Typography variant="small" className="text-blue-gray-600">
                Le manager pourra gérer les RH, encadrants et candidatures
              </Typography>
            </div>

            {/* Success state */}
            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 border-2 border-green-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
                <Typography variant="h5" className="font-bold text-blue-gray-900 mb-2">
                  Manager créé avec succès ! 🎉
                </Typography>
                <Typography variant="small" className="text-blue-gray-600 mb-6">
                  Le compte manager a été créé. Il peut maintenant se connecter.
                </Typography>

                {/* Récap */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6 text-left">
                  <Typography variant="small" className="font-semibold text-blue-gray-700 mb-3 uppercase tracking-wide">
                    🔍 Récapitulatif
                  </Typography>
                  <div className="space-y-2">
                    {[
                      { label: "Nom", value: form.name },
                      { label: "Email", value: form.email },
                      { label: "Rôle", value: "Manager" },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b border-blue-100 last:border-0">
                        <Typography variant="small" className="text-blue-gray-500">{item.label}</Typography>
                        <Typography variant="small" className="font-semibold text-blue-gray-800">{item.value}</Typography>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  color="blue"
                  size="lg"
                  fullWidth
                  className="font-semibold mb-3"
                  onClick={() => {
                    setSuccess(false);
                    setForm({ name: "", email: "", password: "" });
                  }}
                >
                  Créer un autre manager
                </Button>

                <Button
                  variant="outlined"
                  color="blue-gray"
                  size="lg"
                  fullWidth
                  className="font-semibold"
                  onClick={() => navigate("/enterprise/login")}
                >
                  Retour au dashboard
                </Button>
              </div>
            ) : (
              <>
                {/* Info box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                  <Typography variant="small" className="text-blue-gray-700 flex items-start gap-2">
                    <span className="mt-0.5">💡</span>
                    <span>
                      Le manager aura accès à la gestion des{" "}
                      <strong>RH, encadrants</strong> et pourra suivre
                      les <strong>candidatures</strong>.
                    </span>
                  </Typography>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <Typography variant="small" className="text-red-700 flex items-center gap-2">
                      <span>⚠️</span> {error}
                    </Typography>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Nom */}
                  <div>
                    <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
                      Nom du manager <span className="text-red-500">*</span>
                    </Typography>
                    <Input
                      size="lg"
                      type="text"
                      placeholder="Ex: Alice Martin"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      icon={<UserIcon className="w-5 h-5" />}
                      className="!border-blue-gray-300 placeholder:text-blue-gray-400"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
                      Email du manager <span className="text-red-500">*</span>
                    </Typography>
                    <Input
                      size="lg"
                      type="email"
                      placeholder="alice.manager@entreprise.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      icon={<EnvelopeIcon className="w-5 h-5" />}
                      className="!border-blue-gray-300 placeholder:text-blue-gray-400"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
                      Mot de passe <span className="text-red-500">*</span>
                    </Typography>
                    <div className="relative">
                      <Input
                        size="lg"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 6 caractères"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
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

                  {/* Submit */}
                  <Button
                    type="submit"
                    color="blue"
                    size="lg"
                    fullWidth
                    className="mt-4 font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Création en cours...
                      </span>
                    ) : (
                      "Créer le manager →"
                    )}
                  </Button>

                </form>
              </>
            )}

          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Manager;