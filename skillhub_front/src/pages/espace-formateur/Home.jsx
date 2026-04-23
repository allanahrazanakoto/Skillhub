// Page d'accueil après connexion : stats (total, en cours, terminés) + les 9 derniers ateliers.
import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/header";
import Carte_Atelier from "../../components/carte_atelier";
import { formationsApi, formatAtelierForCarte } from "../../api/formations";
import { authApi } from "../../api/auth";
import "./css/home.css";
import formation from "../../assets/style/icons8-less-or-equal-100.png";
import done from "../../assets/style/icons8-done-94.png";
import time from "../../assets/style/icons8-time-100.png";

function Home() {
  // État des formations chargées et métadonnées de pagination
  const [formations, setFormations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [chargement, setChargement] = useState(true);
  const utilisateur = authApi.getUtilisateur();

  // Au montage on charge les formations du formateur connecté. meta.total sert pour le vrai total (même si on n'affiche que la 1ère page).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!utilisateur?.email) {
        if (!cancelled) setChargement(false);
        return;
      }
      try {
        const data = await formationsApi.getFormations({ page: 1, per_page: 15 });
        if (!cancelled) {
          setFormations(data.formations ?? []);
          setMeta(data.meta ?? null);
        }
      } catch {
        if (!cancelled) {
          setFormations([]);
          setMeta(null);
        }
      } finally {
        if (!cancelled) setChargement(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [utilisateur?.email]);

  // total = nombre total côté back si on a meta, sinon on se rabat sur la longueur de la liste (1ère page).
  const total = meta?.total ?? formations.length;
  const enCours = formations.filter((f) => f.statut === "En Cours").length;
  const termines = formations.filter((f) => f.statut === "Terminé").length;
  const ateliersRecents = formations
    .slice(0, 9)
    .map(formatAtelierForCarte)
    .filter(Boolean);

  return (
    <>
      <Header />
      <main className="tableau-bord-principal">
        <div className="conteneur-accueil">
          <h1 className="titre-tableau-bord">Tableau de bord Formateur</h1>

          <div className="actions-accueil">
            <Link to="/gestion-formations" className="bouton-ajouter-atelier">
              + Créer une formation
            </Link>
          </div>

          <section className="section-statistiques" aria-label="Statistiques">
            <div className="grille-statistiques">
              <div className="colonne-statistique">
                <div className="carte-statistique carte-stat-total">
                  <div className="icone-stat">
                    <img
                      src={formation}
                      alt="Total ateliers"
                      width={48}
                      height={48}
                      fetchPriority="high"
                      decoding="async"
                    />
                  </div>
                  <div className="contenu-stat">
                    <p className="libelle-stat">Nombre Total d&apos;ateliers</p>
                    <h2 className="valeur-stat">
                      {chargement ? "..." : total}
                    </h2>
                  </div>
                </div>
              </div>
              <div className="colonne-statistique">
                <div className="carte-statistique carte-stat-a-venir">
                  <div className="icone-stat">
                    <img
                      src={time}
                      alt="En Cours"
                      width={48}
                      height={48}
                      decoding="async"
                    />
                  </div>
                  <div className="contenu-stat">
                    <p className="libelle-stat">Ateliers en cours</p>
                    <h2 className="valeur-stat">
                      {chargement ? "..." : enCours}
                    </h2>
                  </div>
                </div>
              </div>
              <div className="colonne-statistique">
                <div className="carte-statistique carte-stat-termines">
                  <div className="icone-stat">
                    <img
                      src={done}
                      alt="Terminés"
                      width={48}
                      height={48}
                      decoding="async"
                    />
                  </div>
                  <div className="contenu-stat">
                    <p className="libelle-stat">Ateliers terminés</p>
                    <h2 className="valeur-stat">
                      {chargement ? "..." : termines}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="section-ateliers-recents"
            aria-label="Ateliers récents"
          >
            <h2 className="titre-section">
              <img
                src={formation}
                alt=""
                className="icone-titre-section"
                width={32}
                height={32}
                loading="lazy"
                decoding="async"
              />
              Ateliers récents
            </h2>
            {chargement ? (
              <p className="text-muted">Chargement...</p>
            ) : ateliersRecents.length === 0 ? (
              <p className="text-muted">Aucun atelier.</p>
            ) : (
              <div className="grille-ateliers">
                {ateliersRecents.map((atelier) => (
                  <Carte_Atelier key={atelier.id} atelier={atelier} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

export default memo(Home);
