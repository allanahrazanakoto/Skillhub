// Barre du haut : logo, liens Dashboard / Mes Ateliers / Gestion, bouton Déconnexion.
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import logoSkillhub from "../assets/logo/sk.png";
import "./css/header.css";

function Header() {
  const navigate = useNavigate();
  const utilisateur = authApi.getUtilisateur();
  const estFormateur = utilisateur?.role === "formateur";

  // Même si le back échoue (ex. réseau), on se déconnecte côté front et on redirige.
  const handleDeconnexion = async () => {
    try {
      await authApi.deconnexion();
    } finally {
      authApi.removeToken();
      authApi.setUtilisateur(null);
      navigate("/");
    }
  };
  return (
    <>
      <header className="en-tete-skillhub">
        <nav className="navbar navbar-expand-lg navbar-dark" aria-label="Navigation principale">
          <div className="container">
            {/* Logo : redirige vers dashboard (formateur) ou Mes Ateliers selon le rôle */}
            <Link className="navbar-brand d-flex align-items-center" to={estFormateur ? "/dashboard/formateur" : "/dashboard/apprenant"}>
              <img src={logoSkillhub} alt="SkillHub" className="header-logo-img" width={140} height={42} />
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon" />
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav nav-centre">
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard/formateur">
                    Tableau de bord
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/mes-formations">
                    Mes formations
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/gestion-formations">
                    Gestion d&apos;Ateliers
                  </Link>
                </li>
              </ul>
              <button
                type="button"
                className="btn btn-deconnexion"
                onClick={handleDeconnexion}
              >
                Déconnexion
              </button>
              {utilisateur && (
                <span className="header-user-name">
                  {[utilisateur.prenom, utilisateur.nom].filter(Boolean).join(" ") || utilisateur.email}
                </span>
              )}
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}

export default Header;
