import { useState } from "react";
import {
  Input, Checkbox, Button, Typography, Card, CardBody, IconButton,
} from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import {
  EnvelopeIcon, LockClosedIcon, UserIcon,
  EyeIcon, EyeSlashIcon, BuildingOfficeIcon, AcademicCapIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";

export function SignUp() {
  const navigate = useNavigate();

  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [companyName, setCompanyName] = useState(""); // ✅
  const [agree, setAgree]             = useState(false);
  const [loading, setLoading]         = useState(false);
  const [userType, setUserType]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!userType)              return setError("Choisissez Student ou Enterprise");
    if (!agree)                 return setError("Acceptez les conditions");
    if (!name || !email || !password) return setError("Tous les champs sont requis");
    if (userType === "enterprise" && !companyName) return setError("Le nom de l'entreprise est requis");

    try {
      setLoading(true);

      const res = await api.post("/register", {
        name,
        email,
        password,
        type:            userType,
        role:            userType === "enterprise" ? "manager" : null, // ✅
        enterprise_name: userType === "enterprise" ? companyName : undefined, // ✅
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (userType === "enterprise") {
        navigate("/enterprise/manager"); // ✅ dashboard direct
      } else {
        navigate("/auth/sign-in");
      }
    } catch (error) {
      setError(error?.response?.data?.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardBody className="p-8 md:p-10">

            {/* Header */}
            <div className="text-center mb-8">
              <Typography variant="h5" className="font-bold text-blue-900 mb-1">🎓 MyStage</Typography>
              <Typography variant="h4" className="font-bold mb-2">Créer un compte</Typography>
              <Typography variant="paragraph" className="text-blue-gray-600">
                Rejoignez notre plateforme de stages
              </Typography>
            </div>

            {/* User Type Selection */}
            <div className="mb-6">
              <Typography variant="small" className="font-semibold text-blue-gray-900 mb-3 block text-center">
                Choisissez votre profil
              </Typography>
              <div className="grid grid-cols-2 gap-4">

                {/* Student */}
                <Card onClick={() => setUserType("student")}
                  className={`p-4 cursor-pointer border-2 transition-all hover:shadow-lg ${
                    userType === "student" ? "border-blue-500 bg-blue-50" : "border-blue-gray-200"
                  }`}>
                  <CardBody className="p-0 text-center">
                    <div className="flex justify-center mb-3">
                      <div className={`p-3 rounded-lg ${userType === "student" ? "bg-blue-100" : "bg-blue-gray-100"}`}>
                        <AcademicCapIcon className={`w-8 h-8 ${userType === "student" ? "text-blue-600" : "text-blue-gray-600"}`} />
                      </div>
                    </div>
                    <Typography variant="small" className="font-semibold">Étudiant</Typography>
                    <Typography variant="small" className="text-blue-gray-500 text-xs">Chercher un stage</Typography>
                  </CardBody>
                </Card>

                {/* Enterprise */}
                <Card onClick={() => setUserType("enterprise")}
                  className={`p-4 cursor-pointer border-2 transition-all hover:shadow-lg ${
                    userType === "enterprise" ? "border-blue-500 bg-blue-50" : "border-blue-gray-200"
                  }`}>
                  <CardBody className="p-0 text-center">
                    <div className="flex justify-center mb-3">
                      <div className={`p-3 rounded-lg ${userType === "enterprise" ? "bg-blue-100" : "bg-blue-gray-100"}`}>
                        <BuildingOfficeIcon className={`w-8 h-8 ${userType === "enterprise" ? "text-blue-600" : "text-blue-gray-600"}`} />
                      </div>
                    </div>
                    <Typography variant="small" className="font-semibold">Entreprise</Typography>
                    <Typography variant="small" className="text-blue-gray-500 text-xs">Publier une offre</Typography>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Nom */}
              <div>
                <Typography variant="small" className="font-semibold mb-2 block">Nom complet</Typography>
                <Input size="lg" type="text" placeholder="Jean Dupont"
                  value={name} onChange={(e) => setName(e.target.value)}
                  icon={<UserIcon className="w-5 h-5" />} required
                />
              </div>

              {/* Email */}
              <div>
                <Typography variant="small" className="font-semibold mb-2 block">Email</Typography>
                <Input size="lg" type="email" placeholder="jean@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  icon={<EnvelopeIcon className="w-5 h-5" />} required
                />
              </div>

              {/* ✅ Company Name — visible seulement si enterprise */}
              {userType === "enterprise" && (
                <div>
                  <Typography variant="small" className="font-semibold mb-2 block">
                    Nom de l'entreprise
                  </Typography>
                  <Input size="lg" type="text" placeholder="MyEntreprise SARL"
                    value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    icon={<BuildingOfficeIcon className="w-5 h-5" />} required
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <Typography variant="small" className="font-semibold mb-2 block">Mot de passe</Typography>
                <div className="relative">
                  <Input size="lg" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    icon={<LockClosedIcon className="w-5 h-5" />} required
                  />
                  <IconButton variant="text" size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2">
                    {showPassword
                      ? <EyeSlashIcon className="w-5 h-5 text-blue-gray-600" />
                      : <EyeIcon className="w-5 h-5 text-blue-gray-600" />}
                  </IconButton>
                </div>
              </div>

              {/* Terms */}
              <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)}
                label={
                  <Typography variant="small" className="text-blue-gray-700">
                    J'accepte les{" "}
                    <Link to="/terms" className="text-blue-500 font-semibold">conditions d'utilisation</Link>
                  </Typography>
                }
              />

              {/* Erreur */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  ❌ {error}
                </div>
              )}

              {/* Submit */}
              <Button type="submit" color="blue" size="lg" fullWidth
                className="mt-4 font-semibold" disabled={loading || !userType}>
                {loading ? "Création en cours..." : "Créer un compte"}
              </Button>
            </form>

            {/* Sign in link */}
            <div className="text-center mt-6">
              <Typography variant="small" className="text-blue-gray-600">
                Vous avez déjà un compte?{" "}
                <Link to="/auth/sign-in" className="font-semibold text-blue-500 hover:text-blue-700">
                  Se connecter
                </Link>
              </Typography>
            </div>

          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default SignUp;