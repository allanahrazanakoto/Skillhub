import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../../components/header";
import { formationsApi, formatFormationForDisplay } from "../../api/formations";
import { getMessageErreurApi } from "../../api/utils";

export default function FormationDetailFormateur() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formation, setFormation] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [modules, setModules] = useState([]);
  const [moduleForm, setModuleForm] = useState({ titre: "", contenu: "", ordre: "" });
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [moduleSaving, setModuleSaving] = useState(false);
  const [moduleErreur, setModuleErreur] = useState("");

  const chargerFormation = useCallback(async () => {
    if (!id) return;
    try {
      const f = await formationsApi.getFormation(id);
      setFormation(formatFormationForDisplay(f) || f);
      setModules(Array.isArray(f.modules) ? f.modules : []);
      setErreur("");
    } catch (err) {
      setErreur(getMessageErreurApi(err, "Impossible de charger la formation."));
      setFormation(null);
    } finally {
      setChargement(false);
    }
  }, [id]);

  const chargerModules = async () => {
    if (!id) return;
    try {
      const list = await formationsApi.getModules(id);
      setModules(Array.isArray(list) ? list : []);
    } catch {
      setModules([]);
    }
  };

  useEffect(() => {
    chargerFormation();
  }, [chargerFormation]);

  const resetModuleForm = () => {
    setModuleForm({ titre: "", contenu: "", ordre: "" });
    setEditingModuleId(null);
    setModuleErreur("");
  };

  const handleSubmitModule = async (e) => {
    e.preventDefault();
    if (!id) return;
    if (!moduleForm.titre.trim()) {
      setModuleErreur("Le titre du module est requis.");
      return;
    }
    setModuleErreur("");
    setModuleSaving(true);
    try {
      const payload = { titre: moduleForm.titre.trim(), contenu: moduleForm.contenu.trim() || null };
      if (moduleForm.ordre !== "") payload.ordre = Number(moduleForm.ordre);
      if (editingModuleId) {
        await formationsApi.updateModule(editingModuleId, payload);
      } else {
        await formationsApi.createModule(Number(id), payload);
      }
      await chargerModules();
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
    if (!window.confirm("Supprimer ce module ?")) return;
    setModuleSaving(true);
    try {
      await formationsApi.deleteModule(moduleId);
      await chargerModules();
      if (editingModuleId === moduleId) resetModuleForm();
    } catch (err) {
      setModuleErreur(getMessageErreurApi(err, "Erreur lors de la suppression."));
    } finally {
      setModuleSaving(false);
    }
  };

  const handleDeleteFormation = async () => {
    if (!formation?.id) return;
    if (!window.confirm("Supprimer cette formation ?")) return;
    try {
      await formationsApi.deleteFormation(formation.id);
      navigate("/gestion-formations");
    } catch (err) {
      setErreur(getMessageErreurApi(err, "Erreur lors de la suppression de la formation."));
    }
  };

  if (chargement) {
    return (
      <>
        <Header />
        <main className="container py-4">
          <p>Chargement...</p>
        </main>
      </>
    );
  }

  if (!formation) {
    return (
      <>
        <Header />
        <main className="container py-4">
          <p className="alert alert-danger mb-3">{erreur || "Formation introuvable."}</p>
          <Link to="/mes-formations" className="btn btn-outline-secondary">
            Retour
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container py-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h1 className="h3 mb-0">{formation.nom || formation.title}</h1>
          <div className="d-flex gap-2">
            <Link to="/mes-formations" className="btn btn-outline-secondary btn-sm">
              Retour
            </Link>
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleDeleteFormation}>
              Supprimer la formation
            </button>
          </div>
        </div>

        {erreur && <p className="alert alert-danger">{erreur}</p>}

        <section className="card p-3 mb-4">
          <h2 className="h5">Détails de la formation</h2>
          <p className="mb-2">{formation.description || "Sans description."}</p>
          <div className="d-flex flex-wrap gap-3 text-muted">
            <span>Niveau: {formation.levelLabel || formation.level || "—"}</span>
            <span>Catégorie: {formation.domaine || formation.categorie?.libelle || "—"}</span>
            <span>Durée: {formation.heures ?? formation.duree_heures ?? "—"} h</span>
            <span>Apprenants: {formation.inscriptions_count ?? 0}</span>
          </div>
        </section>

        <section className="card p-3">
          <h2 className="h5">Modules</h2>

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
              className="form-control"
              placeholder="Titre du module"
              value={moduleForm.titre}
              onChange={(e) => setModuleForm((prev) => ({ ...prev, titre: e.target.value }))}
            />
            <textarea
              className="form-control"
              rows={4}
              placeholder="Contenu du module (texte, liens, ressources...)"
              value={moduleForm.contenu}
              onChange={(e) => setModuleForm((prev) => ({ ...prev, contenu: e.target.value }))}
            />
            <input
              type="number"
              min="1"
              className="form-control"
              placeholder="Ordre d'affichage (optionnel)"
              value={moduleForm.ordre}
              onChange={(e) => setModuleForm((prev) => ({ ...prev, ordre: e.target.value }))}
            />
            {moduleErreur && <p className="alert alert-danger py-2 mb-0">{moduleErreur}</p>}
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={moduleSaving}>
                {moduleSaving ? "Enregistrement..." : editingModuleId ? "Mettre à jour le module" : "Ajouter le module"}
              </button>
              {editingModuleId && (
                <button type="button" className="btn btn-outline-secondary" onClick={resetModuleForm}>
                  Annuler l'édition
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
