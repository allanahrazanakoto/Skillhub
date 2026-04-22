// Modal qui affiche une formation : soit en lecture seule (voir), soit en édition (modifier).
// En mode voir : boutons Modifier et Supprimer. En mode modifier : formulaire + Enregistrer. Les badges prix/niveau/statut en haut ne s'affichent qu'en lecture.
// On attend la fin de onSave avant de fermer : c'est le parent qui ferme après succès, donc on ne appelle pas onClose dans handleSubmit.
import { useState, useEffect, useRef, useCallback } from "react";
import { getMessageErreurApi } from "../api/utils";
import { formationsApi } from "../api/formations";
import FormationImage from "./FormationImage";
import "./css/ajouter_atelier.css";
import "./css/modal_formation.css";

function Modal_Formation({
  formation,
  mode = "voir",
  show,
  onClose,
  onSave,
  onDelete,
  categories = [],
}) {
  const [isEditing, setIsEditing] = useState(mode === "modifier");
  // Données du formulaire (synchronisées avec la formation à l'ouverture)
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    formateur: "",
    id_formateur: null,
    id_categorie: "",
    domaine: "",
    heures: "",
    prix: "",
    level: "",
    statut: "",
    image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [erreurSauvegarde, setErreurSauvegarde] = useState("");
  const [modules, setModules] = useState([]);
  const [moduleForm, setModuleForm] = useState({ titre: "", contenu: "", ordre: "" });
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [moduleSaving, setModuleSaving] = useState(false);
  const [moduleErreur, setModuleErreur] = useState("");
  const imagePreviewRef = useRef(null);

  // Traduction des codes niveau pour l'affichage
  const LEVEL_LABELS = {
    beginner: "Débutant",
    intermediate: "Intermédiaire",
    advanced: "Avancé",
  };

  // Réinitialise les champs du formulaire avec les données de la formation courante
  const resetFormData = useCallback(() => {
    if (formation) {
      setFormData({
        nom: formation.nom || "",
        description: formation.description || "",
        formateur: formation.formateur || "",
        id_formateur: formation.id_formateur || formation.formateur?.id,
        id_categorie: formation.id_categorie || "",
        domaine: formation.domaine || "",
        heures: formation.heures ?? formation.duree_heures ?? "",
        prix: formation.prix ?? "",
        level: formation.level || "",
        statut: formation.statut || "",
        image_url: formation.image_url || "",
      });
      setImageFile(null);
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
        imagePreviewRef.current = null;
      }
      setImagePreview(null);
      setModules(Array.isArray(formation.modules) ? formation.modules : []);
      setModuleForm({ titre: "", contenu: "", ordre: "" });
      setEditingModuleId(null);
      setModuleErreur("");
    }
  }, [formation]);

  useEffect(() => {
    if (formation && show) {
      resetFormData();
      setIsEditing(mode === "modifier");
      setErreurSauvegarde("");
      formationsApi
        .getModules(formation.id)
        .then((data) => setModules(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [formation, mode, show, resetFormData]);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
        imagePreviewRef.current = null;
      }
    };
  }, []);

  // Gestion des champs texte/select ou du fichier image (avec aperçu blob)
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "image") {
      const file = e.target.files?.[0];
      setImageFile(file || null);
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
        imagePreviewRef.current = null;
      }
      const url = file ? URL.createObjectURL(file) : null;
      imagePreviewRef.current = url;
      setImagePreview(url);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSave || !formation) return;
    setErreurSauvegarde("");
    setSaving(true);
    try {
      // onSave est async ; on attend que ça se termine. Si erreur, on affiche dans le modal et on ne ferme pas.
      const catId =
        formData.id_categorie ||
        categories.find((c) => c.libelle === formData.domaine)?.id;
      await Promise.resolve(
        onSave({
          ...formation,
          ...formData,
          id_categorie: catId ? Number(catId) : formation.id_categorie,
          heures: formData.heures,
          imageFile,
        }),
      );
      // La fermeture est gérée par le parent après succès
    } catch (err) {
      setErreurSauvegarde(getMessageErreurApi(err));
    } finally {
      setSaving(false);
    }
  };

  // Suppression : confirmation puis appel du callback parent et fermeture
  const handleDelete = () => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer la formation "${formation?.nom}" ?`,
      )
    ) {
      if (onDelete && formation) onDelete(formation.id);
      onClose();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    resetFormData();
    onClose();
  };

  const resetModuleForm = () => {
    setModuleForm({ titre: "", contenu: "", ordre: "" });
    setEditingModuleId(null);
  };

  const handleSubmitModule = async (e) => {
    e.preventDefault();
    if (!formation?.id) return;
    if (!moduleForm.titre.trim()) {
      setModuleErreur("Le titre du module est requis.");
      return;
    }
    setModuleErreur("");
    setModuleSaving(true);
    try {
      const payload = {
        titre: moduleForm.titre.trim(),
        contenu: moduleForm.contenu.trim() || null,
      };
      if (moduleForm.ordre !== "") payload.ordre = Number(moduleForm.ordre);
      if (editingModuleId) {
        await formationsApi.updateModule(editingModuleId, payload);
      } else {
        await formationsApi.createModule(formation.id, payload);
      }
      const list = await formationsApi.getModules(formation.id);
      setModules(Array.isArray(list) ? list : []);
      resetModuleForm();
    } catch (err) {
      setModuleErreur(getMessageErreurApi(err, "Erreur lors de l'enregistrement du module."));
    } finally {
      setModuleSaving(false);
    }
  };

  const handleEditModule = (module) => {
    setEditingModuleId(module.id);
    setModuleForm({
      titre: module.titre || "",
      contenu: module.contenu || "",
      ordre: module.ordre ?? "",
    });
    setModuleErreur("");
  };

  const handleDeleteModule = async (moduleId) => {
    if (!formation?.id) return;
    if (!window.confirm("Supprimer ce module ?")) return;
    setModuleErreur("");
    setModuleSaving(true);
    try {
      await formationsApi.deleteModule(moduleId);
      const list = await formationsApi.getModules(formation.id);
      setModules(Array.isArray(list) ? list : []);
      if (editingModuleId === moduleId) resetModuleForm();
    } catch (err) {
      setModuleErreur(getMessageErreurApi(err, "Erreur lors de la suppression du module."));
    } finally {
      setModuleSaving(false);
    }
  };

  if (!show || !formation) return null;

  return (
    <div
      className="overlay-modal"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-modal-formation"
    >
      <div
        className="fenetre-modal modal-formation-detail"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="en-tete-modal">
          <h2 id="titre-modal-formation">
            {isEditing ? "Modifier la formation" : "Détails de la formation"}
          </h2>
          <button
            type="button"
            className="bouton-fermer-modal"
            onClick={handleClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="corps-modal">
          <div className="conteneur-info-header">
            <div className="image-modal-formation-vignette">
              <FormationImage
                src={imagePreview || undefined}
                imageUrl={formData.image_url || formation?.image_url}
                alt={formation.nom}
              />
            </div>
            <div className="info-formation-header">
              <h3 className="nom-formation-modal">{formation.nom}</h3>
              {formData.domaine && (
                <p className="domaine-formation-modal">{formData.domaine}</p>
              )}
            </div>
          </div>

          <div className="grille-champs-modal">
            {isEditing && (
              <div className="champ-modal champ-modal-inline">
                <label htmlFor="formation-image-edit" className="libelle-modal">
                  Changer l&apos;image
                </label>
                <input
                  id="formation-image-edit"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                  className="champ-saisie-modal"
                  onChange={handleChange}
                />
                {imagePreview && (
                  <p className="text-muted small mt-1">
                    Nouvelle image sélectionnée
                  </p>
                )}
              </div>
            )}

            <div className="champ-modal champ-modal-inline">
              <label htmlFor="formation-formateur" className="libelle-modal">
                Formateur
              </label>
              <div className="valeur-lecture">{formData.formateur}</div>
            </div>

            <div className="section-modal">
              <h4 className="titre-section-modal">Description</h4>
            </div>
            <div className="champ-modal champ-modal-full">
              <label htmlFor="formation-description" className="libelle-modal">
                Description
              </label>
              {isEditing ? (
                <textarea
                  id="formation-description"
                  name="description"
                  className="champ-saisie-modal"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description de la formation"
                />
              ) : (
                <div className="valeur-lecture valeur-description">
                  {formData.description || "—"}
                </div>
              )}
            </div>

            <div className="section-modal section-modal-informations">
              <h4 className="titre-section-modal">Informations</h4>
            </div>
            <div className="champ-modal champ-modal-inline">
              <label htmlFor="formation-heures" className="libelle-modal">
                Durée (h)
              </label>
              {isEditing ? (
                <input
                  id="formation-heures"
                  name="heures"
                  type="number"
                  className="champ-saisie-modal"
                  value={formData.heures}
                  onChange={handleChange}
                  min="1"
                  step="0.5"
                  required
                />
              ) : (
                <div className="valeur-lecture">{formData.heures}h</div>
              )}
            </div>

            <div className="champ-modal champ-modal-inline">
              <label htmlFor="formation-prix" className="libelle-modal">
                Prix
              </label>
              {isEditing ? (
                <input
                  id="formation-prix"
                  name="prix"
                  type="number"
                  className="champ-saisie-modal"
                  value={formData.prix}
                  onChange={handleChange}
                  min="0"
                  required
                />
              ) : (
                <div className="valeur-lecture">{formData.prix}€</div>
              )}
            </div>

            {isEditing && (
              <div className="champ-modal champ-modal-inline">
                <label htmlFor="formation-categorie" className="libelle-modal">
                  Catégorie
                </label>
                {categories.length > 0 ? (
                  <select
                    id="formation-categorie"
                    name="id_categorie"
                    className="select-modal"
                    value={formData.id_categorie}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.libelle}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <div className="valeur-lecture">{formData.domaine || "—"}</div>
                    <p className="text-muted small mb-0">
                      Liste des catégories indisponible. Vérifiez l&apos;API `/api/categories`.
                    </p>
                  </>
                )}
              </div>
            )}

            {!isEditing && (
              <div className="champ-modal champ-modal-inline">
                <label className="libelle-modal">Catégorie</label>
                <div className="valeur-lecture">{formData.domaine}</div>
              </div>
            )}

            <div className="champ-modal champ-modal-inline">
              <label htmlFor="formation-level" className="libelle-modal">
                Niveau
              </label>
              {isEditing ? (
                <select
                  id="formation-level"
                  name="level"
                  className="select-modal"
                  value={formData.level}
                  onChange={handleChange}
                >
                  <option value="">—</option>
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                </select>
              ) : (
                <div className="valeur-lecture">
                  {LEVEL_LABELS[formData.level] || formData.level || "—"}
                </div>
              )}
            </div>

            <div className="champ-modal champ-modal-inline">
              <label htmlFor="formation-statut" className="libelle-modal">
                Statut
              </label>
              {isEditing ? (
                <select
                  id="formation-statut"
                  name="statut"
                  className="select-modal"
                  value={formData.statut}
                  onChange={handleChange}
                  required
                >
                  <option value="En Cours">En Cours</option>
                  <option value="Terminé">Terminé</option>
                </select>
              ) : (
                <div className="valeur-lecture">
                  <span className="badge-statut">{formData.statut}</span>
                </div>
              )}
            </div>
          </div>

          {onSave && onDelete && (
            <section className="mt-3">
              <h4 className="titre-section-modal">Modules de la formation</h4>
              {modules.length === 0 ? (
                <p className="text-muted">Aucun module pour le moment.</p>
              ) : (
                <div className="d-flex flex-column gap-2 mb-3">
                  {modules.map((module, index) => (
                    <div key={module.id} className="border rounded p-2">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <strong>
                            Module {module.ordre || index + 1} - {module.titre}
                          </strong>
                          {module.contenu && <p className="mb-0 mt-1">{module.contenu}</p>}
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleEditModule(module)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteModule(module.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmitModule} className="d-flex flex-column gap-2">
                <input
                  type="text"
                  className="champ-saisie-modal"
                  placeholder="Titre du module"
                  value={moduleForm.titre}
                  onChange={(e) => setModuleForm((prev) => ({ ...prev, titre: e.target.value }))}
                />
                <textarea
                  className="champ-saisie-modal"
                  rows={3}
                  placeholder="Contenu du module (optionnel)"
                  value={moduleForm.contenu}
                  onChange={(e) => setModuleForm((prev) => ({ ...prev, contenu: e.target.value }))}
                />
                <input
                  type="number"
                  min="1"
                  className="champ-saisie-modal"
                  placeholder="Ordre (optionnel)"
                  value={moduleForm.ordre}
                  onChange={(e) => setModuleForm((prev) => ({ ...prev, ordre: e.target.value }))}
                />
                {moduleErreur && <p className="erreur-auth mb-0">{moduleErreur}</p>}
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={moduleSaving}
                  >
                    {moduleSaving
                      ? "Enregistrement..."
                      : editingModuleId
                        ? "Mettre à jour le module"
                        : "Ajouter le module"}
                  </button>
                  {editingModuleId && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={resetModuleForm}
                      disabled={moduleSaving}
                    >
                      Annuler l'édition
                    </button>
                  )}
                </div>
              </form>
            </section>
          )}

          {isEditing && erreurSauvegarde && (
            <p className="erreur-auth">{erreurSauvegarde}</p>
          )}

          <div className="actions-modal">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="bouton-modal bouton-modal-secondaire"
                  onClick={handleClose}
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bouton-modal bouton-modal-principal"
                  disabled={saving}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </>
            ) : onSave && onDelete ? (
              <>
                <button
                  type="button"
                  className="bouton-modal bouton-modal-danger"
                  onClick={handleDelete}
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  className="bouton-modal bouton-modal-principal"
                  onClick={() => setIsEditing(true)}
                >
                  Modifier
                </button>
              </>
            ) : (
              <button
                type="button"
                className="bouton-modal bouton-modal-secondaire"
                onClick={handleClose}
              >
                Fermer
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Modal_Formation;
