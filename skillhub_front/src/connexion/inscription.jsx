// Inscription avec choix du rôle - style SkillHub1.0
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavbarPublic from "../components/NavbarPublic";
import Footer from "../components/Footer";
import { authApi } from "../api/auth";
import { getMessageErreurApi } from "../api/utils";
import "./css/login.css";
import "./css/inscription.css";

function Inscription() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    mot_de_passe: "",
    confirmer_mot_de_passe: "",
    nom: "",
    prenom: "",
    role: "participant",
  });
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [chargement, setChargement] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErreur("");
  };

  const calculerForceMdp = (mdp) => {
    if (!mdp) return { score: 0, label: "", couleur: "" };
    let score = 0;
    if (mdp.length >= 12) score++;
    if (/[A-Z]/.test(mdp)) score++;
    if (/[a-z]/.test(mdp)) score++;
    if (/[0-9]/.test(mdp)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(mdp)) score++;
    if (score <= 2) return { score, label: "Faible", couleur: "#e53935" };
    if (score <= 3) return { score, label: "Moyen", couleur: "#fb8c00" };
    return { score, label: "Fort", couleur: "#43a047" };
  };

  const validerMotDePasse = (mdp) => {
    if (mdp.length < 12) return "Le mot de passe doit contenir au moins 12 caractères.";
    if (!/[A-Z]/.test(mdp)) return "Le mot de passe doit contenir au moins 1 majuscule.";
    if (!/[a-z]/.test(mdp)) return "Le mot de passe doit contenir au moins 1 minuscule.";
    if (!/[0-9]/.test(mdp)) return "Le mot de passe doit contenir au moins 1 chiffre.";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(mdp)) return "Le mot de passe doit contenir au moins 1 caractère spécial (!@#$...).";
    return null;
  };

  // Envoie les données au back ; en cas de succès, redirige vers la page de connexion après 2 s
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setSucces("");

    const errMdp = validerMotDePasse(formData.mot_de_passe);
    if (errMdp) { setErreur(errMdp); return; }
    if (formData.mot_de_passe !== formData.confirmer_mot_de_passe) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);
    try {
      const res = await authApi.inscription(formData);
      setSucces(
        res.message ||
          "Utilisateur créé avec succès. Vous pouvez maintenant vous connecter.",
      );
      setFormData({
        email: "",
        mot_de_passe: "",
        confirmer_mot_de_passe: "",
        nom: "",
        prenom: "",
        role: formData.role,
      });
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setErreur(
        getMessageErreurApi(
          err,
          "Erreur d'inscription. Vérifiez que le backend est démarré.",
        ),
      );
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
          <h1 className="titre-auth">Inscription</h1>
          <p className="sous-titre-auth">Créez votre compte SkillHub</p>

          <form onSubmit={handleSubmit} className="formulaire-auth">
            <div className="ligne-auth">
              <div className="champ-auth">
                <label htmlFor="inscription-prenom" className="libelle-auth">
                  Prénom
                </label>
                <input
                  id="inscription-prenom"
                  name="prenom"
                  type="text"
                  className="champ-saisie-auth"
                  placeholder="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                />
              </div>
              <div className="champ-auth">
                <label htmlFor="inscription-nom" className="libelle-auth">
                  Nom
                </label>
                <input
                  id="inscription-nom"
                  name="nom"
                  type="text"
                  className="champ-saisie-auth"
                  placeholder="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="champ-auth">
              <label htmlFor="inscription-email" className="libelle-auth">
                Email
              </label>
              <input
                id="inscription-email"
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
              <label htmlFor="inscription-role" className="libelle-auth">
                Je suis
              </label>
              <select
                id="inscription-role"
                name="role"
                className="champ-saisie-auth"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="participant">Apprenant</option>
                <option value="formateur">Formateur</option>
              </select>
            </div>

            <div className="champ-auth">
              <label
                htmlFor="inscription-mot-de-passe"
                className="libelle-auth"
              >
                Mot de passe
              </label>
              <input
                id="inscription-mot-de-passe"
                name="mot_de_passe"
                type="password"
                className="champ-saisie-auth"
                placeholder="••••••••"
                value={formData.mot_de_passe}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <p style={{ fontSize: "0.78rem", color: "#888", marginTop: "4px" }}>
                12 caractères min. · 1 majuscule · 1 minuscule · 1 chiffre · 1 caractère spécial (!@#$...)
              </p>
              {formData.mot_de_passe && (() => {
                const force = calculerForceMdp(formData.mot_de_passe);
                return (
                  <div style={{ marginTop: "6px" }}>
                    <div style={{ height: "6px", borderRadius: "3px", background: "#e0e0e0", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${(force.score / 5) * 100}%`,
                        background: force.couleur,
                        borderRadius: "3px",
                        transition: "width 0.3s, background 0.3s"
                      }} />
                    </div>
                    <p style={{ fontSize: "0.78rem", color: force.couleur, marginTop: "3px", fontWeight: 600 }}>
                      {force.label}
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="champ-auth">
              <label
                htmlFor="inscription-confirmer-mot-de-passe"
                className="libelle-auth"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="inscription-confirmer-mot-de-passe"
                name="confirmer_mot_de_passe"
                type="password"
                className="champ-saisie-auth"
                placeholder="••••••••"
                value={formData.confirmer_mot_de_passe}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            {succes && <p className="succes-auth">{succes}</p>}
            {erreur && <p className="erreur-auth">{erreur}</p>}
            <button
              type="submit"
              className="bouton-auth bouton-auth-principal"
              disabled={chargement}
            >
              {chargement ? "Inscription..." : "S'inscrire"}
            </button>

            <p className="lien-bas-auth">
              Déjà un compte ?{" "}
              <Link to="/connexion" className="lien-auth">
                Se connecter
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

export default Inscription;
