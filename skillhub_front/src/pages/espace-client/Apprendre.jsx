import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import NavbarPublic from "../../components/NavbarPublic";
import { formationsApi } from "../../api/formations";
import { inscriptionsApi } from "../../api/inscriptions";
import { getMessageErreurApi } from "../../api/utils";
import "./css/apprendre.css";

export default function Apprendre() {
  const { id } = useParams();
  const [formation, setFormation] = useState(null);
  const [progression, setProgression] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [sauvegardeProgression, setSauvegardeProgression] = useState(false);
  const [modules, setModules] = useState([]);
  const [moduleErreur, setModuleErreur] = useState("");
  const [updatingModuleIds, setUpdatingModuleIds] = useState([]);

  useEffect(() => {
    if (!id) return;
    formationsApi
      .getFormation(id)
      .then((f) => {
        setFormation(f);
      })
      .catch(() => setFormation(null))
      .finally(() => setChargement(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    formationsApi
      .getModules(Number(id))
      .then((list) => {
        const data = Array.isArray(list) ? list : [];
        setModules(data);
      })
      .catch(() => {
        setModules([]);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    inscriptionsApi
      .getFormationsSuivies()
      .then((list) => {
        const f = list.find((x) => String(x.id) === String(id));
        if (f && f.progression != null) setProgression(Number(f.progression));
      })
      .catch(() => {});
  }, [id]);

  const handleToggleModule = async (moduleId, checked) => {
    setModuleErreur("");
    const previousModules = modules;
    const optimisticModules = previousModules.map((m) =>
      m.id === moduleId ? { ...m, est_fait: checked } : m,
    );
    setModules(optimisticModules);
    setUpdatingModuleIds((prev) => [...prev, moduleId]);
    setSauvegardeProgression(true);
    try {
      const data = await formationsApi.updateModuleCompletion(Number(id), moduleId, checked);
      const updated = optimisticModules.map((m) =>
        m.id === moduleId ? { ...m, est_fait: data.module?.est_fait ?? checked } : m,
      );
      setModules(updated);
      if (data.progression != null) {
        setProgression(Number(data.progression));
      } else {
        const total = updated.length;
        const faits = updated.filter((m) => m.est_fait).length;
        setProgression(total > 0 ? Math.round((faits / total) * 100) : 0);
      }
    } catch (err) {
      // rollback UI si l'API refuse la mise à jour (ex: non inscrit, token expiré)
      setModules(previousModules);
      setModuleErreur(getMessageErreurApi(err, "Le statut du module n'a pas pu être enregistré."));
    } finally {
      setUpdatingModuleIds((prev) => prev.filter((x) => x !== moduleId));
      setSauvegardeProgression(false);
    }
  };

  if (chargement || !formation) {
    return (
      <>
        <NavbarPublic />
        <main className="page-apprendre"><p className="text-muted">Chargement...</p></main>
      </>
    );
  }

  return (
    <>
      <NavbarPublic />
      <main className="page-apprendre">
        <div className="container-apprendre">
          <div className="apprendre-header">
            <h1>{formation.nom || formation.title}</h1>
            <p className="apprendre-description">{formation.description}</p>
          </div>

          <section className="apprendre-progression">
            <h2>Votre progression</h2>
            <div className="progression-control">
              <div
                className="progress w-100"
                role="progressbar"
                aria-valuenow={progression}
                aria-valuemin="0"
                aria-valuemax="100"
                style={{ height: 10 }}
              >
                <div className="progress-bar" style={{ width: `${progression}%` }} />
              </div>
              <span>{progression} %</span>
              {sauvegardeProgression && <span className="text-muted small"> (enregistrement…)</span>}
            </div>
          </section>

          <section className="mt-4">
            <h2>Modules de la formation</h2>
            {moduleErreur && <p className="alert alert-warning py-2">{moduleErreur}</p>}
            {modules.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {modules.map((module, index) => (
                  <article key={module.id} className="card p-3">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <h3 className="h5 mb-2">
                        Module {module.ordre || index + 1} - {module.titre}
                      </h3>
                      <label className="form-check-label d-flex align-items-center gap-2">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={!!module.est_fait}
                          onChange={(e) => handleToggleModule(module.id, e.target.checked)}
                          disabled={updatingModuleIds.includes(module.id)}
                        />
                        Fait
                      </label>
                    </div>
                    <p className="mb-0">{module.contenu || "Aucun contenu pour ce module."}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-muted">Aucun module disponible pour cette formation.</p>
            )}
          </section>

          <p className="mt-4 pt-2">
            <Link to="/dashboard/apprenant" className="btn btn-outline-secondary">
              Retour à mon espace
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
