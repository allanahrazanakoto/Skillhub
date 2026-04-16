import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Accueil from "./pages/public/Accueil";
import Login from "./connexion/login";
import Inscription from "./connexion/inscription";
import FormationsCatalogue from "./pages/public/FormationsCatalogue";
import FormationDetail from "./pages/public/FormationDetail";
import DashboardApprenant from "./pages/espace-client/DashboardApprenant";
import Apprendre from "./pages/espace-client/Apprendre";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

const Home = lazy(() => import("./pages/espace-formateur/Home"));
const MesAteliers = lazy(() => import("./pages/espace-formateur/MesAteliers"));
const GestionAteliers = lazy(() => import("./pages/espace-formateur/GestionAteliers"));
const FormationDetailFormateur = lazy(() => import("./pages/espace-formateur/FormationDetailFormateur"));

function App() {
  return (
    <Suspense fallback={<div className="d-flex justify-content-center align-items-center min-vh-100">Chargement...</div>}>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/formations" element={<FormationsCatalogue />} />
        <Route path="/formation/:id" element={<FormationDetail />} />

        <Route
          path="/dashboard/apprenant"
          element={
            <ProtectedRoute role="participant">
              <DashboardApprenant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apprendre/:id"
          element={
            <ProtectedRoute role="participant">
              <Apprendre />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/formateur"
          element={
            <ProtectedRoute role="formateur">
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mes-formations"
          element={
            <ProtectedRoute role="formateur">
              <MesAteliers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-formations"
          element={
            <ProtectedRoute role="formateur">
              <GestionAteliers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/formateur/formation/:id"
          element={
            <ProtectedRoute role="formateur">
              <FormationDetailFormateur />
            </ProtectedRoute>
          }
        />

        <Route path="/Mes_Ateliers" element={<Navigate to="/mes-formations" replace />} />
        <Route path="/Gestion_Ateliers" element={<Navigate to="/gestion-formations" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
