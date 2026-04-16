import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import logoSkillhub from "../assets/logo/sk.png";
import "./css/navbar-skillhub.css";

export default function NavbarPublic() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionValide, setSessionValide] = useState(true);
  const token = authApi.getToken();
  const utilisateur = authApi.getUtilisateur();
  const roleValide = utilisateur?.role === "participant" || utilisateur?.role === "formateur";
  const estConnecte = Boolean(token && utilisateur && roleValide && sessionValide);

  useEffect(() => {
    // Evite les états incohérents en nettoyant une session partielle (utilisateur sans token) ou avec rôle non autorisé.
    if ((!token && utilisateur) || (utilisateur && !roleValide)) {
      authApi.removeToken();
      authApi.setUtilisateur(null);
      setSessionValide(false);
      return;
    }
    setSessionValide(true);
  }, [token, utilisateur, roleValide]);

  const handleDeconnexion = async () => {
    try {
      await authApi.deconnexion();
    } finally {
      authApi.removeToken();
      authApi.setUtilisateur(null);
      navigate("/");
    }
  };

  const dashboardPath =
    utilisateur?.role === "formateur"
      ? "/dashboard/formateur"
      : utilisateur?.role === "participant"
        ? "/dashboard/apprenant"
        : "/connexion";
  const profilLabel = utilisateur ? [utilisateur.prenom, utilisateur.nom].filter(Boolean).join(" ") || utilisateur.email : "";

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar-skillhub">
      <div className="navbar-container">
        <div className="navbar-start">
          <Link className="navbar-logo" to="/" onClick={closeMenu}>
            <img src={logoSkillhub} alt="SkillHub" className="navbar-logo-img" width={160} height={48} />
          </Link>
          <nav className="nav-main-left" aria-label="Navigation principale">
            <ul className="nav-list">
              <li><Link className="nav-link" to="/" onClick={closeMenu}>Accueil</Link></li>
              <li><Link className="nav-link" to="/formations" onClick={closeMenu}>Formations</Link></li>
            </ul>
          </nav>
        </div>

        <div className="navbar-end">
          <ul className="nav-list nav-list-actions-desktop">
            {estConnecte ? (
              <>
                <li>
                  <Link className="nav-link" to={dashboardPath} onClick={closeMenu}>
                    {profilLabel || "Mon espace"}
                  </Link>
                </li>
                <li>
                  <button type="button" className="btn-deconnexion" onClick={handleDeconnexion}>
                    Déconnexion
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link className="btn-profile" to="/connexion" onClick={closeMenu}>
                    Connexion
                  </Link>
                </li>
                <li>
                  <Link className="btn-profile btn-inscription" to="/inscription" onClick={closeMenu}>
                    S&apos;inscrire
                  </Link>
                </li>
              </>
            )}
          </ul>

          <button
            type="button"
            className="navbar-toggle"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`nav-list-wrap ${menuOpen ? "active" : ""}`}>
            <ul className="nav-list">
              <li>
                <Link className="nav-link" to="/" onClick={closeMenu}>Accueil</Link>
              </li>
              <li>
                <Link className="nav-link" to="/formations" onClick={closeMenu}>Formations</Link>
              </li>
              {estConnecte ? (
                <>
                  <li>
                    <Link className="nav-link" to={dashboardPath} onClick={closeMenu}>
                      {profilLabel || "Mon espace"}
                    </Link>
                  </li>
                  <li>
                    <button type="button" className="btn-deconnexion" onClick={handleDeconnexion}>
                      Déconnexion
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link className="btn-profile" to="/connexion" onClick={closeMenu}>
                      Connexion
                    </Link>
                  </li>
                  <li>
                    <Link className="btn-profile btn-inscription" to="/inscription" onClick={closeMenu}>
                      S&apos;inscrire
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
