// Page de gestion des formations : liste des formations du formateur + bouton Ajouter + Modifier/Supprimer dans le modal.
// On charge aussi les catégories pour le formulaire d'ajout et pour l'édition.
import { useState, useEffect } from "react";
import Header from "../../components/header";
import Ajouter_Ateliers from "../../components/ajouter_ateliers";
import Modal_Formation from "../../components/modal_formation";
import { formationsApi, formatFormationForDisplay } from "../../api/formations";
import { authApi } from "../../api/auth";
import { getMessageErreurApi } from "../../api/utils";
import FormationImage from "../../components/FormationImage";
import "./css/gestion_ateliers.css";

function Gestion_Ateliers() {
  const [formations, setFormations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [showAjouterFormation, setShowAjouterFormation] = useState(false);
  const [showModalFormation, setShowModalFormation] = useState(false);
  const [formationSelectionnee, setFormationSelectionnee] = useState(null);
  const [modeModal, setModeModal] = useState("voir"); // "voir" | "modifier"
  const [recherche, setRecherche] = useState("");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  const [meta, setMeta] = useState(null);

  const utilisateur = authApi.getUtilisateur();

  // Même logique de filtre que mes_ateliers : recherche texte + prix min/max sur la page courante.
  const formationsFiltrees = formations.filter((f) => {
    const matchRecherche =
      !recherche ||
      [f.nom, f.domaine, f.formateur, f.description, f.levelLabel]
        .filter(Boolean)
        .some(
          (v) =>
            String(v)
              .toLowerCase()
              .includes(recherche.toLowerCase().trim())
        );
    const prix = Number(f.prix);
    const matchPrixMin = !prixMin || prix >= Number(prixMin);
    const matchPrixMax = !prixMax || prix <= Number(prixMax);
    return matchRecherche && matchPrixMin && matchPrixMax;
  });

  const chargerFormations = async (pageNum = 1) => {
    if (!utilisateur?.email) return;
    setChargement(true);
    setErreur("");
    try {
      const data = await formationsApi.getFormations({
        page: pageNum,
        per_page: 15,
      });
      setFormations((data.formations ?? []).map(formatFormationForDisplay));
      setMeta(data.meta ?? null);
    } catch (err) {
      setErreur(getMessageErreurApi(err));
    } finally {
      setChargement(false);
    }
  };

  // Charge les catégories pour les selects du formulaire d'ajout et du modal d'édition
  const chargerCategories = async () => {
    try {
      const data = await formationsApi.getCategories();
      setCategories(data);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    chargerCategories();
    chargerFormations(1);
  }, [utilisateur?.email]);

  // Ouvre le modal en mode édition pour la formation donnée
  const handleModifier = (id) => {
    setShowAjouterFormation(false);
    const formation = formations.find((f) => f.id === id);
    setFormationSelectionnee(formation);
    setModeModal("modifier");
    setShowModalFormation(true);
  };

  // Sauvegarde des modifs : si une nouvelle image a été choisie on envoie en FormData, sinon en JSON.
  // On rethrow pour que le modal puisse rester ouvert et afficher l'erreur si ça échoue.
  const handleSaveFormation = async (formationModifiee) => {
    try {
      let payload;
      if (formationModifiee.imageFile) {
        const fd = new FormData();
        fd.append("id_formateur", formationModifiee.id_formateur);
        fd.append("id_categorie", formationModifiee.id_categorie);
        fd.append("nom", formationModifiee.nom);
        fd.append("duree_heures", formationModifiee.heures);
        fd.append("prix", formationModifiee.prix);
        fd.append("statut", formationModifiee.statut);
        if (formationModifiee.description != null) fd.append("description", formationModifiee.description);
        if (formationModifiee.level) fd.append("level", formationModifiee.level);
        fd.append("image", formationModifiee.imageFile);
        payload = fd;
      } else {
        payload = {
          id_formateur: formationModifiee.id_formateur,
          id_categorie: formationModifiee.id_categorie,
          nom: formationModifiee.nom,
          duree_heures: Number(formationModifiee.heures),
          prix: Number(formationModifiee.prix),
          statut: formationModifiee.statut,
          image_url: formationModifiee.image_url || null,
        };
        if (formationModifiee.description != null) payload.description = formationModifiee.description;
        if (formationModifiee.level) payload.level = formationModifiee.level;
      }
      await formationsApi.updateFormation(formationModifiee.id, payload);
      await chargerFormations(1);
      setShowModalFormation(false);
      setModeModal("voir");
      setFormationSelectionnee(null);
    } catch (err) {
      alert(getMessageErreurApi(err));
      throw err;
    }
  };

  // Suppression après confirmation ; rafraîchit la liste et ferme le modal
  const handleDeleteFormation = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")) return;
    try {
      await formationsApi.deleteFormation(id);
      await chargerFormations(1);
      setShowModalFormation(false);
      setModeModal("voir");
      setFormationSelectionnee(null);
    } catch (err) {
      alert(getMessageErreurApi(err, "Erreur lors de la suppression."));
    }
  };

  const handleCloseModal = () => {
    setShowModalFormation(false);
    setModeModal("voir");
    setFormationSelectionnee(null);
  };

  // Callback après création réussie : ferme le modal d'ajout et rafraîchit la liste
  const handleFormationCreee = () => {
    setShowAjouterFormation(false);
    chargerFormations(1);
  };

  return (
    <>
      <Header />
      <main className="main-espace-formateur">
        <div className="container">
          <h1 className="titre-page">Espace Formateur</h1>
          <p className="sous-titre-page">Formations que vous animez</p>

          <div className="actions-gestion-formations mb-4">
            <button
              type="button"
              className="btn bouton-ajouter-formation"
              onClick={() => {
                setShowModalFormation(false);
                setFormationSelectionnee(null);
                setShowAjouterFormation(true);
              }}
              aria-label="Ajouter une formation"
            >
              + Ajouter formation
            </button>
          </div>

          <Ajouter_Ateliers
            show={showAjouterFormation}
            onClose={() => setShowAjouterFormation(false)}
            onSuccess={handleFormationCreee}
            categories={categories}
          />

          <Modal_Formation
            formation={formationSelectionnee}
            mode={modeModal}
            show={showModalFormation}
            onClose={handleCloseModal}
            onSave={handleSaveFormation}
            onDelete={handleDeleteFormation}
            categories={categories}
          />

          {erreur && <p className="alert alert-danger">{erreur}</p>}
          {chargement ? (
            <p className="text-center py-5">Chargement...</p>
          ) : (meta?.total === 0 || (!meta && formations.length === 0)) ? (
            <p className="text-center py-5 text-muted">Aucune formation. Créez-en une.</p>
          ) : (
            <>
              <div className="barre-filtre-compacte d-flex flex-wrap gap-2 align-items-center mb-4">
                <input
                  type="text"
                  className="form-control champ-filtre-input"
                  placeholder="Rechercher (nom, description, niveau...)"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  aria-label="Recherche"
                />
                <input
                  type="number"
                  className="form-control champ-filtre-input"
                  placeholder="Prix min (€)"
                  value={prixMin}
                  onChange={(e) => setPrixMin(e.target.value)}
                  min="0"
                  step="0.01"
                  aria-label="Prix minimum"
                  style={{ maxWidth: "120px" }}
                />
                <input
                  type="number"
                  className="form-control champ-filtre-input"
                  placeholder="Prix max (€)"
                  value={prixMax}
                  onChange={(e) => setPrixMax(e.target.value)}
                  min="0"
                  step="0.01"
                  aria-label="Prix maximum"
                  style={{ maxWidth: "120px" }}
                />
              </div>

              {formationsFiltrees.length === 0 ? (
                <p className="text-center py-5 text-muted">
                  Aucun résultat pour ces critères de recherche.
                </p>
              ) : (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
              {formationsFiltrees.map((formation) => (
                <div key={formation.id} className="col">
                  <div className="carte-formation h-100">
                    <div className="conteneur-image-formation">
                      <FormationImage
                        imageUrl={formation.image_url}
                        alt={formation.nom}
                        className="image-formation"
                      />
                      {formation.levelLabel && (
                        <span className={`badge-niveau-carte niveau-${formation.level || "default"}`}>
                          {formation.levelLabel}
                        </span>
                      )}
                      <div className="carte-prix-overlay">{formation.prix}€</div>
                    </div>
                    <div className="contenu-formation">
                      {formation.domaine && (
                        <span className="badge-domaine-carte">{formation.domaine}</span>
                      )}
                      <h2 className="nom-formation">{formation.nom}</h2>
                      {formation.description && (
                        <p className="description-formation-carte">{formation.description}</p>
                      )}
                      <div className="infos-formation">
                        <p className="formateur">
                          <span className="libelle">Formateur</span>
                          <span className="valeur">{formation.formateur}</span>
                        </p>
                        <p className="date">
                          <span className="libelle">Créée le</span>
                          <span className="valeur">{formation.date}</span>
                        </p>
                        <p className="heures">
                          <span className="libelle">Durée</span>
                          <span className="valeur">{formation.heures}h</span>
                        </p>
                        <p className="statut">
                          <span className="libelle">Statut</span>
                          <span className="valeur">{formation.statut}</span>
                        </p>
                      </div>
                      <div className="actions-formation">
                        <button
                          type="button"
                          className="bouton-modifier"
                          onClick={() => handleModifier(formation.id)}
                          aria-label={`Modifier ${formation.nom}`}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="bouton-supprimer"
                          onClick={() => handleDeleteFormation(formation.id)}
                          aria-label={`Supprimer ${formation.nom}`}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
              )}

              {meta && (meta.last_page > 1 || meta.total > 0) && (
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4">
                  <p className="text-muted mb-0 small">
                    {meta.total} formation{meta.total !== 1 ? "s" : ""}
                    {meta.last_page > 1 && ` · Page ${meta.current_page} sur ${meta.last_page}`}
                  </p>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      disabled={meta.current_page <= 1 || chargement}
                      onClick={() => chargerFormations(meta.current_page - 1)}
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      disabled={meta.current_page >= meta.last_page || chargement}
                      onClick={() => chargerFormations(meta.current_page + 1)}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default Gestion_Ateliers;
