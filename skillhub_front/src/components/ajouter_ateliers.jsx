// Modal pour créer une nouvelle formation. Champs : titre, description, prix, durée, niveau, catégorie (si dispo), image optionnelle.
// On valide avant envoi ; si on a une image on envoie en FormData, sinon en JSON. Après succès on appelle onSuccess et on ferme.
import { useState, useEffect, useRef } from "react";
import { formationsApi } from "../api/formations";
import { authApi } from "../api/auth";
import { getMessageErreurApi } from "../api/utils";
import "./css/ajouter_atelier.css";

// Options du select "niveau" pour les formations (aligné avec le back)
const LEVELS = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
];

function Ajouter_Ateliers({ show, onClose, onSuccess, categories = [] }) {
  // État du formulaire, fichier image, aperçu et erreurs
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
    level: "",
    id_categorie: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imagePreviewRef = useRef(null);
  const [erreurs, setErreurs] = useState({});
  const [erreurGlobale, setErreurGlobale] = useState("");
  const [chargement, setChargement] = useState(false);

  // Libère l'URL blob de l'aperçu image pour éviter les fuites mémoire
  const revokeImagePreview = () => {
    if (imagePreviewRef.current) {
      URL.revokeObjectURL(imagePreviewRef.current);
      imagePreviewRef.current = null;
    }
    setImagePreview(null);
  };

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
        imagePreviewRef.current = null;
      }
    };
  }, []);

  // Validation avant envoi : tous les champs obligatoires + catégorie si la liste n'est pas vide.
  const validate = () => {
    const err = {};
    if (!formData.title?.trim()) err.title = "Le titre est requis.";
    else if (formData.title.length > 200) err.title = "Le titre ne peut pas dépasser 200 caractères.";
    if (!formData.description?.trim()) err.description = "La description est requise.";
    else if (formData.description.length > 2000) err.description = "La description ne peut pas dépasser 2000 caractères.";
    if (formData.price === "" || formData.price === null || formData.price === undefined)
      err.price = "Le prix est requis.";
    else if (isNaN(Number(formData.price)) || Number(formData.price) < 0)
      err.price = "Le prix doit être un nombre positif.";
    if (formData.duration === "" || formData.duration === null || formData.duration === undefined)
      err.duration = "La durée est requise.";
    else if (isNaN(Number(formData.duration)) || Number(formData.duration) < 0)
      err.duration = "La durée doit être un nombre positif.";
    if (!formData.level) err.level = "Le niveau est requis.";
    else if (!["beginner", "intermediate", "advanced"].includes(formData.level))
      err.level = "Le niveau doit être beginner, intermediate ou advanced.";
    if (categories.length > 0 && !formData.id_categorie)
      err.id_categorie = "La catégorie est requise.";
    setErreurs(err);
    return Object.keys(err).length === 0;
  };

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
      if (erreurs.image) setErreurs((prev) => ({ ...prev, image: null }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (erreurs[name]) setErreurs((prev) => ({ ...prev, [name]: null }));
    setErreurGlobale("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreurGlobale("");
    if (!validate()) return;

    const utilisateur = authApi.getUtilisateur();
    if (!utilisateur?.id) {
      setErreurGlobale("Vous devez être connecté pour créer une formation.");
      return;
    }

    setChargement(true);
    try {
      let payload;
      if (imageFile) {
        const fd = new FormData();
        fd.append("title", formData.title.trim());
        fd.append("description", formData.description.trim());
        fd.append("price", Number(formData.price));
        fd.append("duration", Number(formData.duration));
        fd.append("level", formData.level);
        if (formData.id_categorie) fd.append("id_categorie", formData.id_categorie);
        fd.append("image", imageFile);
        payload = fd;
      } else {
        payload = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: Number(formData.price),
          duration: Number(formData.duration),
          level: formData.level,
        };
        if (formData.id_categorie) payload.id_categorie = Number(formData.id_categorie);
      }
      await formationsApi.createFormation(payload);
      setFormData({ title: "", description: "", price: "", duration: "", level: "", id_categorie: "" });
      setImageFile(null);
      revokeImagePreview();
      setErreurs({});
      setErreurGlobale("");
      onClose();
      onSuccess?.();
    } catch (err) {
      const validationErrs = err.erreurs || err.errors;
      setErreurGlobale(getMessageErreurApi(err, "Erreur lors de la création."));
      if (validationErrs && typeof validationErrs === "object") {
        const map = {};
        Object.entries(validationErrs).forEach(([k, v]) => {
          map[k] = Array.isArray(v) ? v[0] : v;
        });
        setErreurs(map);
      }
    } finally {
      setChargement(false);
    }
  };

  // Fermeture du modal : reset du formulaire et des erreurs
  const handleClose = () => {
    setFormData({ title: "", description: "", price: "", duration: "", level: "", id_categorie: "" });
    setImageFile(null);
    revokeImagePreview();
    setErreurs({});
    setErreurGlobale("");
    onClose();
  };

  if (!show) return null;

  return (
    <div
      className="overlay-modal"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-modal"
    >
      <div
        className="fenetre-modal modal-atelier"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="en-tete-modal">
          <h2 id="titre-modal">Ajouter une formation</h2>
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
          <div className="champ-modal">
            <label htmlFor="formation-title" className="libelle-modal">
              Titre *
            </label>
            <input
              id="formation-title"
              name="title"
              type="text"
              className="champ-saisie-modal"
              placeholder="Ex: Introduction à React"
              value={formData.title}
              onChange={handleChange}
            />
            {erreurs.title && <span className="erreur-champ">{erreurs.title}</span>}
          </div>

          <div className="champ-modal">
            <label htmlFor="formation-image" className="libelle-modal">
              Image (optionnel)
            </label>
            <input
              id="formation-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
              className="champ-saisie-modal"
              onChange={handleChange}
            />
            {imagePreview && (
              <div className="apercu-image-formation mt-2">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  style={{
                    maxWidth: 200,
                    maxHeight: 120,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
              </div>
            )}
            {erreurs.image && <span className="erreur-champ">{erreurs.image}</span>}
          </div>

          <div className="champ-modal">
            <label htmlFor="formation-description" className="libelle-modal">
              Description *
            </label>
            <textarea
              id="formation-description"
              name="description"
              className="champ-saisie-modal"
              placeholder="Décrivez la formation..."
              rows={4}
              value={formData.description}
              onChange={handleChange}
            />
            {erreurs.description && <span className="erreur-champ">{erreurs.description}</span>}
          </div>

          <div className="ligne-modal">
            <div className="champ-modal">
              <label htmlFor="formation-price" className="libelle-modal">
                Prix (€) *
              </label>
              <input
                id="formation-price"
                name="price"
                type="number"
                className="champ-saisie-modal"
                placeholder="Ex: 199"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
              />
              {erreurs.price && <span className="erreur-champ">{erreurs.price}</span>}
            </div>

            <div className="champ-modal">
              <label htmlFor="formation-duration" className="libelle-modal">
                Durée (heures) *
              </label>
              <input
                id="formation-duration"
                name="duration"
                type="number"
                className="champ-saisie-modal"
                placeholder="Ex: 24"
                min="0"
                step="0.5"
                value={formData.duration}
                onChange={handleChange}
              />
              {erreurs.duration && <span className="erreur-champ">{erreurs.duration}</span>}
            </div>
          </div>

          <div className="champ-modal">
            <label htmlFor="formation-level" className="libelle-modal">
              Niveau *
            </label>
            <select
              id="formation-level"
              name="level"
              className="select-modal"
              value={formData.level}
              onChange={handleChange}
            >
              <option value="">Sélectionnez un niveau</option>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            {erreurs.level && <span className="erreur-champ">{erreurs.level}</span>}
          </div>

          <div className="champ-modal">
            <label htmlFor="formation-categorie" className="libelle-modal">
              Catégorie *
            </label>
            {categories.length > 0 ? (
              <select
                id="formation-categorie"
                name="id_categorie"
                className="select-modal"
                value={formData.id_categorie}
                onChange={handleChange}
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-muted small mb-0">
                Aucune catégorie chargée. Vérifiez l&apos;API `/api/categories`.
              </p>
            )}
            {erreurs.id_categorie && <span className="erreur-champ">{erreurs.id_categorie}</span>}
          </div>

          {erreurGlobale && <p className="erreur-auth">{erreurGlobale}</p>}
          <div className="actions-modal">
            <button
              type="button"
              className="bouton-modal bouton-modal-secondaire"
              onClick={handleClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bouton-modal bouton-modal-principal"
              disabled={chargement}
            >
              {chargement ? "Création..." : "Créer la formation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Ajouter_Ateliers;
