# Branch Protection Configuration

## Branches protégées : `main` et `develop`

### Configuration via GitHub Web UI

1. **Settings → Branches → Add rule**
2. Branch name pattern: `main` (puis répéter pour `develop`)

### Protection de Base
- ✅ **Require a pull request before merging**
  - Require approvals: **1**
  - Dismiss stale PR approvals when new commits are pushed
  - Require review from code owners
- ✅ **Restrict pushes that create files larger than 100 MB**

### Status Checks Requis

#### Pour `main` :
- `✅ Merge Gate` (ci.yml)
- `✅ Security Gate` (security.yml)
- `🎭 E2E Summary` (playwright.yml)

#### Pour `develop` :
- `✅ Merge Gate` (ci.yml)

### Restrictions
- ✅ **Include administrators**
- ❌ **Allow force pushes** → DÉSACTIVER
- ❌ **Allow deletions** → DÉSACTIVER

### Environnements GitHub

| Environnement | Branche         | Reviewers | Usage              |
|---------------|-----------------|-----------|---------------------|
| `preview`     | PR branches     | Aucun     | Deploy preview auto |
| `staging`     | `develop`       | 1 reviewer| Tests d'intégration |
| `production`  | `main`          | 1 reviewer| Déploiement prod    |

Configurer dans **Settings → Environments**.

## Configuration via GitHub CLI

```bash
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["✅ Merge Gate","✅ Security Gate","🎭 E2E Summary"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```
