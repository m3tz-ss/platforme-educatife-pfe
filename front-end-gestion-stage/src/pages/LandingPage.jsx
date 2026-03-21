import React from "react";
import { Link } from "react-router-dom";
import AppFooter from "../components/layout/AppFooter";

export default function LandingPage() {
  return (
    <div className="bg-gray-50 text-gray-800">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-10 py-6 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600">
          🎓 MyStage
        </h1>

        <div className="space-x-6 hidden md:flex">
          <Link
            to="/auth/sign-in"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            connecte
          </Link>
          <Link
            to="/auth/sign-up"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            s'insrire
          </Link>
          <Link
            to="/"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            acceuil
          </Link>
         
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="px-10 py-20 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Plateforme Intelligente de Gestion des Stages
        </h2>

        <p className="max-w-2xl mx-auto text-lg mb-8">
          Simplifiez la gestion des stages, suivez les candidatures
          et connectez étudiants, entreprises et encadrants
          dans un seul système moderne.
        </p>

        <div className="space-x-4">
          <Link
            to="/auth/sign-up"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Créer un compte
          </Link>

          <Link
            to="/auth/sign-in"
            className="border border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
          >
            Se connecter
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-10 py-20">
        <h3 className="text-3xl font-bold text-center mb-16">
          Fonctionnalités principales
        </h3>

        <div className="grid md:grid-cols-3 gap-10">

          <div className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-4">Gestion des Offres</h4>
            <p>
              Publiez, modifiez et gérez les offres de stage
              facilement avec un système structuré.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-4">Suivi des Candidatures</h4>
            <p>
              Consultez les candidatures, affectez des encadrants
              et suivez l'évolution des demandes.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-4">Tableaux de Bord</h4>
            <p>
              Visualisez les statistiques en temps réel
              avec des dashboards adaptés à chaque rôle.
            </p>
          </div>

        </div>
      </section>

      {/* ROLES SECTION */}
      <section id="roles" className="bg-gray-100 px-10 py-20">
        <h3 className="text-3xl font-bold text-center mb-16">
          Pour qui ?
        </h3>

        <div className="grid md:grid-cols-4 gap-8 text-center">

          <div className="bg-white p-6 rounded-xl shadow">
            <h4 className="font-semibold text-lg mb-2">👨‍🎓 Étudiant</h4>
            <p>Postuler et suivre son stage.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h4 className="font-semibold text-lg mb-2">🏢 RH</h4>
            <p>Gérer les offres et évaluer les candidats.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h4 className="font-semibold text-lg mb-2">👨‍🏫 Encadrant</h4>
            <p>Suivre et évaluer les stagiaires.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h4 className="font-semibold text-lg mb-2">🛠 Admin</h4>
            <p>Superviser toute la plateforme.</p>
          </div>

        </div>
      </section>

      <AppFooter variant="dark" />

    </div>
  );
}
