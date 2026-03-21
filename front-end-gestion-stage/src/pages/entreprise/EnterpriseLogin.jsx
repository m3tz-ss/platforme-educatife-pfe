import { useState } from "react";
import { Card, CardBody, Typography, Input, Button } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import api from "../../services/api";

export default function EnterpriseLogin() {
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState("manager");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const res = await api.post("/enterprise/login", { email, password, role });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/enterprise/offers");
    } catch (err) {
      setError(err?.response?.data?.message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardBody className="p-8">

            <div className="text-center mb-8">
              <Typography variant="h4" className="font-bold text-blue-gray-900">🏢 Espace Entreprise</Typography>
              <Typography variant="small" className="text-blue-gray-500 mt-1">
                Connexion Manager / RH / Encadrant
              </Typography>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Rôle */}
              <div>
                <Typography variant="small" className="font-semibold mb-2 block">Votre rôle</Typography>
                <select
                  className="w-full border border-blue-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-blue-500"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="manager">👔 Manager</option>
                  <option value="rh">👥 RH</option>
                  <option value="encadrant">🎓 Encadrant</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <Typography variant="small" className="font-semibold mb-2 block">Email</Typography>
                <Input size="lg" type="email" placeholder="email@entreprise.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  icon={<EnvelopeIcon className="w-5 h-5" />} required
                />
              </div>

              {/* Password */}
              <div>
                <Typography variant="small" className="font-semibold mb-2 block">Mot de passe</Typography>
                <Input size="lg" type="password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  icon={<LockClosedIcon className="w-5 h-5" />} required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  ❌ {error}
                </div>
              )}

              <Button type="submit" color="blue" fullWidth size="lg" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="text-center mt-6 space-y-2">
              <Typography variant="small" className="text-blue-gray-500">
                Pas encore de compte ?{" "}
                <Link to="/auth/sign-up" className="text-blue-500 font-semibold hover:text-blue-700">
                  S'inscrire
                </Link>
              </Typography>
            </div>

          </CardBody>
        </Card>
      </div>
    </div>
  );
}