# Branch Protection Configuration

Pour configurer la protection de la branche `main`, suivez ces étapes dans GitHub :

## Configuration via GitHub Web UI

1. **Accéder aux paramètres du repository**
   - Aller dans Settings > Branches

2. **Ajouter une règle de protection pour `main`**
   - Cliquer sur "Add rule"
   - Branch name pattern: `main`

3. **Activer les options suivantes :**

### Protection de Base
- ✅ **Restrict pushes that create files larger than 100 MB**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners
  - ✅ Restrict pushes that create files larger than 100 MB

### Vérifications de Status
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

#### Status checks requis :
- `quality` (Code Quality & Build)
- `security` (Security Audit) 
- `codeql` (CodeQL Analysis)

### Restrictions Administrateur
- ✅ **Restrict pushes that create files larger than 100 MB**
- ✅ **Include administrators** (même les admins doivent suivre les règles)
- ✅ **Allow force pushes** → ❌ DÉSACTIVER
- ✅ **Allow deletions** → ❌ DÉSACTIVER

## Configuration via GitHub CLI (Alternatif)

```bash
# Installer GitHub CLI si pas déjà fait
# https://cli.github.com/

# Créer la règle de protection
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["quality","security","codeql"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## Vérification de la Configuration

Pour vérifier que la protection est active :

```bash
gh api repos/:owner/:repo/branches/main/protection
```

## Avantages de cette Configuration

- **🔒 Sécurité** : Aucun push direct sur main
- **👥 Review** : Code review obligatoire par les pairs
- **🧪 Qualité** : Tests et linting automatiques
- **🔍 Sécurité** : Analyse de sécurité systématique
- **📋 Traçabilité** : Historique complet des changements
- **🚫 Accidents** : Protection contre les force push destructeurs