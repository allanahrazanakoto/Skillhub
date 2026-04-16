import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NavbarPublic from "../../components/NavbarPublic";
import Footer from "../../components/Footer";
import { formationsApi, formatFormationForDisplay } from "../../api/formations";
import { inscriptionsApi } from "../../api/inscriptions";
import { authApi } from "../../api/auth";
import FormationImage from "../../components/FormationImage";
import "./css/formation-detail.css";

const LEVEL_LABELS = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" };

export default function FormationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formation, setFormation] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [inscrit, setInscrit] = useState(false);
  const [enCoursInscription, setEnCoursInscription] = useState(false);

  const user = authApi.getUtilisateur();

  useEffect(() => {
    if (!id) return;
    formationsApi
      .getFormation(id)
      .then((f) => {
        setFormation(formatFormationForDisplay(f) || f);
      })
      .catch(() => setFormation(null))
      .finally(() => setChargement(false));
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== "participant" || !id) return;
    inscriptionsApi
      .getFormationsSuivies()
      .then((list) => setInscrit(list.some((f) => String(f.id) === String(id))))
      .catch(() => setInscrit(false));
  }, [user, id]);

  const handleSuivre = async () => {
    if (!user) {
      navigate("/connexion", { state: { from: { pathname: `/formation/${id}` } } });
      return;
    }
    if (user.role !== "participant") return;
    setEnCoursInscription(true);
    try {
      await inscriptionsApi.inscrire(Number(id));
      setInscrit(true);
      navigate(`/apprendre/${id}`);
    } catch (e) {
      if (e.status === 422) setInscrit(true);
    } finally {
      setEnCoursInscription(false);
    }
  };

  if (chargement || !formation) {
    return (
      <>
        <NavbarPublic />
        <main className="page-formation-detail"><p className="text-muted">Chargement...</p></main>
        <Footer />
      </>
    );
  }

  const niveauLabel = LEVEL_LABELS[formation.level] || formation.levelLabel || formation.level;
  const modules = Array.isArray(formation.modules) ? formation.modules : [];

  return (
    <>
      <NavbarPublic />
      <main className="page-formation-detail">
        <div className="container-detail">
          <div className="detail-header">
            <div className="detail-image">
              <FormationImage imageUrl={formation.image_url} alt="" />
            </div>
            <div className="detail-infos">
              <h1>{formation.nom || formation.title}</h1>
              <p className="detail-description">{formation.description}</p>
              <div className="detail-meta">
                <span className="badge-niveau">{niveauLabel}</span>
                <span>Catégorie : {formation.domaine || formation.categorie?.libelle || "—"}</span>
                <span>Formateur : {formation.formateur || "—"}</span>
                <span>{formation.inscriptions_count ?? 0} apprenant(s)</span>
              </div>
              <div className="detail-actions">
                {user?.role === "participant" && (
                  inscrit ? (
                    <Link to={`/apprendre/${id}`} className="btn btn-primary">
                      Continuer la formation
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSuivre}
                      disabled={enCoursInscription}
                    >
                      {enCoursInscription ? "Inscription..." : "Suivre la formation"}
                    </button>
                  )
                )}
                {!user && (
                  <button type="button" className="btn btn-primary" onClick={handleSuivre}>
                    Suivre la formation
                  </button>
                )}
                {user?.role === "formateur" && user.id === formation.id_formateur && (
                  <Link to="/dashboard/formateur" className="btn btn-outline-secondary">
                    Gérer dans mon espace
                  </Link>
                )}
              </div>
            </div>
          </div>

          <section className="mt-4">
            <h2>Modules</h2>
            {modules.length === 0 ? (
              <p className="text-muted mb-0">Aucun module disponible pour le moment.</p>
            ) : (
              <ul className="mb-0">
                {modules.map((m, index) => (
                  <li key={m.id}>
                    <strong>Module {m.ordre || index + 1}</strong> - {m.titre}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
