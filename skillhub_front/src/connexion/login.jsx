// Page de connexion - style SkillHub1.0
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavbarPublic from "../components/NavbarPublic";
import Footer from "../components/Footer";
import { authApi } from "../api/auth";
import { getMessageErreurApi } from "../api/utils";
import "./css/login.css";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    mot_de_passe: "",
  });
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const handleChange = (e) => {
    // Met à jour le champ concerné et efface l'erreur affichée
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErreur("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const res = await authApi.connexion(formData);
      const role = res.utilisateur?.role;
      const roleAutorise = role === "formateur" || role === "participant";

      if (!roleAutorise) {
        authApi.removeToken();
        authApi.setUtilisateur(null);
        setErreur("Ce compte n'est pas autorisé sur cette interface.");
        return;
      }

      authApi.setToken(res.token);
      authApi.setUtilisateur(res.utilisateur);
      const dashboard = role === "formateur" ? "/dashboard/formateur" : "/dashboard/apprenant";
      navigate(dashboard);
    } catch (err) {
      setErreur(getMessageErreurApi(err, "Erreur de connexion. Vérifiez que le backend est démarré."));
    } finally {
      setChargement(false);
    }
  };

  return (
    <>
      <NavbarPublic />
      <main className="page-auth">
        <div className="conteneur-auth">
          <div className="carte-auth">
            <h1 className="titre-auth">Connexion</h1>
            <p className="sous-titre-auth">Connectez-vous à votre compte SkillHub</p>

            <form onSubmit={handleSubmit} className="formulaire-auth">
              <div className="champ-auth">
                <label htmlFor="login-email" className="libelle-auth">
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className="champ-saisie-auth"
                  placeholder="exemple@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="champ-auth">
                <label htmlFor="login-mot-de-passe" className="libelle-auth">
                  Mot de passe
                </label>
                <input
                  id="login-mot-de-passe"
                  name="mot_de_passe"
                  type="password"
                  className="champ-saisie-auth"
                  placeholder="••••••••"
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
              </div>

              {erreur && <p className="erreur-auth">{erreur}</p>}
              <button type="submit" className="bouton-auth bouton-auth-principal" disabled={chargement}>
                {chargement ? "Connexion..." : "Se connecter"}
              </button>

              <p className="lien-bas-auth">
                Pas encore de compte ?{" "}
                <Link to="/inscription" className="lien-auth">
                  S&apos;inscrire
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Login;
