import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authApi } from "../api/auth";

/**
 * Affiche les enfants seulement si l'utilisateur est connecté avec le rôle attendu (participant ou formateur).
 * Sinon redirection vers /connexion (avec retour prévu via state.from).
 */
export default function ProtectedRoute({ children, role }) {
  const [verification, setVerification] = useState({ ok: null, loading: true });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await Promise.resolve();
      const token = authApi.getToken();
      if (!token) {
        if (!cancelled) {
          setVerification({ ok: false, loading: false });
        }
        return;
      }
      try {
        const utilisateur = await authApi.me();
        if (cancelled) {
          return;
        }
        if (!utilisateur) {
          authApi.removeToken();
          setVerification({ ok: false, loading: false });
          return;
        }
        if (utilisateur.role !== role) {
          authApi.removeToken();
          setVerification({ ok: false, loading: false });
          return;
        }
        authApi.setUtilisateur(utilisateur);
        setVerification({ ok: true, loading: false });
      } catch {
        if (!cancelled) {
          authApi.removeToken();
          setVerification({ ok: false, loading: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [role]);

  if (verification.loading) {
    return <div className="d-flex justify-content-center align-items-center min-vh-100">Chargement...</div>;
  }
  if (!verification.ok) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }
  return children;
}
