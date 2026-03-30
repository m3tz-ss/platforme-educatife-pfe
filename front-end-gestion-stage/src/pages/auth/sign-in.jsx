import { useState } from "react";
import {
  Input,
  Button,
  Typography,
  Card,
  CardBody,
  IconButton,
  Checkbox,
} from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import LandingNavbar from "../Landingnavbar";

export function SignIn() {
  const navigate = useNavigate();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/login", { email, password });

      const token = res.data.token;
      const user  = res.data.user;

      // ✅ Sauvegarder token et user
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (rememberMe) localStorage.setItem("rememberMe", email);

      // ✅ Redirection selon le type — tous les cas gérés
      const type = user.type;

      const routes = {
        admin:     "/admin",
        student:   "/student",
        manager:   "/enterprise/manager",
        rh:        "/enterprise/offers",
        encadrant:  "/enterprise/encadrant",
        enterprise: "/enterprise/offers",
      };

      navigate(routes[type] || "/");

    } catch (err) {
      setError(err.response?.data?.message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LandingNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* Left side - Info */}
            <div className="hidden lg:flex flex-col justify-center space-y-6">
              <div>
                <Typography variant="h2" className="font-bold text-blue-900 mb-4">
                  🎓 MyStage
                </Typography>
                <Typography variant="h4" className="font-bold text-blue-gray-900 mb-4">
                  Plateforme de Stages
                </Typography>
                <Typography variant="paragraph" className="text-blue-gray-700 text-lg leading-relaxed">
                  Connectez-vous pour accéder à votre tableau de bord et gérer vos
                  offres de stage ou vos candidatures.
                </Typography>
              </div>

              <div className="space-y-4 pt-6">
                {[
                  { title: "Pour les RH",        desc: "Publiez vos offres et gérez les candidatures facilement" },
                  { title: "Pour les Étudiants",  desc: "Découvrez les meilleures offres de stage" },
                  { title: "Sécurisé et Fiable",  desc: "Vos données sont protégées avec les plus hauts standards" },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-blue-500 text-white font-bold">
                      ✓
                    </div>
                    <div>
                      <Typography variant="h6" className="font-semibold">{f.title}</Typography>
                      <Typography variant="small" className="text-blue-gray-600">{f.desc}</Typography>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Form */}
            <div className="flex items-center justify-center">
              <Card className="w-full shadow-2xl border-0">
                <CardBody className="p-8 md:p-10">

                  <div className="text-center mb-8">
                    <Typography variant="h4" className="font-bold mb-2">Se connecter</Typography>
                    <Typography variant="paragraph" className="text-blue-gray-600">
                      Entrez vos identifiants pour accéder à votre compte
                    </Typography>
                  </div>

                  {/* Erreur */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <Typography variant="small" className="text-red-700 flex items-center gap-2">
                        <span>⚠️</span> {error}
                      </Typography>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                      <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
                        Email
                      </Typography>
                      <Input
                        size="lg" type="email"
                        placeholder="votre.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<EnvelopeIcon className="w-5 h-5" />}
                        className="!border-blue-gray-300 placeholder:text-blue-gray-400"
                        required
                      />
                    </div>

                    {/* Mot de passe */}
                    <div>
                      <Typography variant="small" className="font-semibold text-blue-gray-900 mb-2 block">
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
                          variant="text" size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          {showPassword
                            ? <EyeSlashIcon className="w-5 h-5 text-blue-gray-600" />
                            : <EyeIcon className="w-5 h-5 text-blue-gray-600" />}
                        </IconButton>
                      </div>
                    </div>

                    {/* Remember me + Forgot */}
                    <div className="flex justify-between items-center pt-2">
                      <Checkbox
                        label="Se souvenir de moi"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <Link to="/auth/forgot-password" className="text-sm text-blue-500 hover:text-blue-700 transition">
                        Mot de passe oublié?
                      </Link>
                    </div>

                    {/* Bouton */}
                    <Button type="submit" color="blue" size="lg" fullWidth className="mt-6 font-semibold" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Connexion en cours...
                        </span>
                      ) : "Se connecter"}
                    </Button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-blue-gray-200"></div>
                    <Typography variant="small" className="text-blue-gray-600">ou</Typography>
                    <div className="flex-1 h-px bg-blue-gray-200"></div>
                  </div>

                  {/* Sign up */}
                  <div className="text-center">
                    <Typography variant="small" className="text-blue-gray-600">
                      Vous n'avez pas de compte?{" "}
                      <Link to="/auth/sign-up" className="font-semibold text-blue-500 hover:text-blue-700 transition">
                        Créer un compte
                      </Link>
                    </Typography>
                  </div>

                  {/* Comptes démo */}
                  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Typography variant="small" className="text-blue-gray-700 mb-2 font-bold">
                      🔍 Comptes de démonstration:
                    </Typography>
                    <Typography variant="small" className="text-blue-gray-600">
                      <strong>Étudiant:</strong> student@example.com / password
                    </Typography>
                    <Typography variant="small" className="text-blue-gray-600">
                      <strong>RH:</strong> rh@demo.com / demo123
                    </Typography>
                    <Typography variant="small" className="text-blue-gray-600">
                      <strong>Manager:</strong> manager@demo.com / demo123
                    </Typography>
                  </div>

                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default SignIn;

