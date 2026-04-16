# CONTRIBUTING — SkillHub Groupe

## Membres et rôles

| Membre        | Rôle principal          | Responsabilités                                                         |
| ------------- | ----------------------- | ----------------------------------------------------------------------- |
| Dayan         | DevOps Engineer         | Docker, conteneurisation, docker-compose.yml, .env.example              |
| Steve/Allanah | Tech Lead + Tests       | Tests unitaires back-end, CI/CD, Git, README, sécurité, coordination    |
| Steve/Allanah | Tests + Cloud Architect | Tests unitaires front-end, rapport d'audit, analyse besoins, schémas C4 |

---

## Stratégie de branches

```
main          → code stable uniquement, aucun commit direct autorisé
dev           → branche d'intégration, accumule les fonctionnalités validées
feature/<nom> → une branche par tâche ou fonctionnalité
hotfix/<nom>  → correctifs urgents, mergés vers main ET dev
```

**Règles strictes :**

- Aucun commit direct sur `main` ou `dev`
- Tout développement passe obligatoirement par une branche `feature/`
- Le nom de branche doit être explicite : `feature/docker-healthchecks`, `feature/tests-unit-back`, `feature/rapport-audit`
- La branche `dev` est la branche de travail par défaut

---

## Format des commits — Conventional Commits

Chaque message de commit respecte la structure suivante :

```
<type>(<scope>): <description courte en minuscules>
```

### Types acceptés

| Type     | Usage                                                  |
| -------- | ------------------------------------------------------ |
| `feat`   | Nouvelle fonctionnalité ou livrable                    |
| `fix`    | Correction de bug                                      |
| `docker` | Ajout ou modification de fichiers de conteneurisation  |
| `ci`     | Modification du pipeline CI/CD                         |
| `test`   | Ajout ou correction de tests unitaires (back ou front) |
| `docs`   | Documentation (README, CONTRIBUTING, rapport)          |
| `chore`  | Maintenance, configuration, refactoring mineur         |

### Exemples attendus dans le contexte SkillHub

```
feat(api): add JWT authentication middleware
docker: add multi-stage Dockerfile for backend
docker: add healthcheck on PostgreSQL service
ci: add trigger on dev branch and PR
ci: replace static tag with github.sha
test(back): add unit tests for FormationController
test(front): add rendering tests for LoginForm component
docs: update README with docker compose up instructions
docs(contrib): add PR procedure to CONTRIBUTING
fix: resolve port conflict in docker-compose.yml
chore: move .env.example to repository root
```

---

## Procédure de Pull Request

1. Créer une branche depuis `dev` :

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/ma-tache
   ```

2. Développer et committer régulièrement avec des messages conformes.

3. Pousser la branche :

   ```bash
   git push origin feature/ma-tache
   ```

4. Ouvrir une Pull Request vers `dev` sur GitHub avec :
   - Un titre explicite décrivant le travail effectué
   - Le nom de l'auteur
   - La liste des changements principaux
   - La tâche du backlog correspondante (ex. : `Tâche #9 — Health checks`)

5. Un autre membre du groupe relit et approuve avant le merge.

6. Supprimer la branche après merge.

---

## Résolution de conflits

1. Récupérer les dernières modifications de `dev` :

   ```bash
   git fetch origin
   git rebase origin/dev
   ```

2. Résoudre les conflits fichier par fichier dans l'éditeur.

3. Marquer les conflits comme résolus :

   ```bash
   git add <fichier-resolu>
   git rebase --continue
   ```

4. En cas de blocage, contacter le Tech Lead avant de forcer un push.

5. Ne jamais utiliser `git push --force` sur `dev` ou `main`.

---

## Règles de contribution individuelle

- Chaque membre doit avoir des commits **réguliers et identifiables** dans l'historique Git tout au long du projet.
- Un historique avec un seul auteur pour les trois membres, ou des commits massifs en fin de projet, entraîne une pénalité sur le critère Versionning.
- Chaque membre travaille sur **ses propres branches** et soumet ses propres Pull Requests.
- Les commits doivent refléter un travail progressif, pas un dépôt en bloc.
