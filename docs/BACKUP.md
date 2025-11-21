# 💾 Guide de Sauvegarde & Restauration - Drop Craft AI

## Vue d'ensemble

Ce document décrit la stratégie complète de sauvegarde (backup) et de restauration (recovery) pour garantir la résilience des données et la continuité de service.

---

## 🎯 Objectifs

### RTO & RPO

| Composant | RTO (Recovery Time) | RPO (Recovery Point) |
|-----------|-------------------|---------------------|
| **Base de données** | < 1 heure | < 15 minutes |
| **Fichiers utilisateurs** | < 2 heures | < 1 heure |
| **Configuration** | < 30 minutes | 0 (versionnée Git) |
| **Code application** | < 15 minutes | 0 (Git) |

**Définitions:**
- **RTO**: Temps maximum acceptable pour restaurer le service
- **RPO**: Quantité maximale de données acceptables à perdre

---

## 🗄️ Stratégie de Sauvegarde

### 1. Base de Données Supabase

#### Backups Automatiques

**Supabase gère automatiquement:**
- **Daily backups**: Conservés 7 jours (tous plans)
- **PITR** (Point-in-Time Recovery): Conservé 7-30 jours (plans Pro+)

**Configuration:**
```toml
# supabase/config.toml
[db.backup]
enabled = true
retention_days = 7

[db.pitr]
enabled = true  # Pro+ uniquement
retention_days = 30
```

#### Backups Manuels

##### Via Supabase CLI

```bash
# Backup complet
npx supabase db dump \
  --project-ref YOUR_PROJECT_REF \
  --file backup-$(date +%Y%m%d-%H%M%S).sql

# Backup structure seule (sans données)
npx supabase db dump \
  --project-ref YOUR_PROJECT_REF \
  --schema-only \
  --file schema-$(date +%Y%m%d).sql

# Backup données seules
npx supabase db dump \
  --project-ref YOUR_PROJECT_REF \
  --data-only \
  --file data-$(date +%Y%m%d).sql
```

##### Via pg_dump (Avancé)

```bash
# Connexion directe avec pg_dump
pg_dump \
  --host db.YOUR_PROJECT_REF.supabase.co \
  --port 5432 \
  --username postgres \
  --dbname postgres \
  --format custom \
  --file backup.dump

# Avec compression
pg_dump \
  --host db.YOUR_PROJECT_REF.supabase.co \
  --port 5432 \
  --username postgres \
  --dbname postgres \
  --format custom \
  --compress 9 \
  --file backup-$(date +%Y%m%d).dump.gz
```

#### Script de Backup Automatisé

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

PROJECT_REF="YOUR_PROJECT_REF"
BACKUP_DIR="./backups/database"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Créer répertoire
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."

# Backup complet
npx supabase db dump \
  --project-ref "$PROJECT_REF" \
  --file "$BACKUP_DIR/backup-$DATE.sql"

# Compression
gzip "$BACKUP_DIR/backup-$DATE.sql"

echo "✅ Backup completed: backup-$DATE.sql.gz"

# Upload vers S3/Backblaze/etc.
if [ -n "$AWS_S3_BUCKET" ]; then
  aws s3 cp \
    "$BACKUP_DIR/backup-$DATE.sql.gz" \
    "s3://$AWS_S3_BUCKET/backups/database/"
  echo "☁️ Uploaded to S3"
fi

# Nettoyage anciens backups locaux
find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "🧹 Cleaned old backups (>$RETENTION_DAYS days)"

echo "✨ Backup process completed successfully"
```

**Cron Job:**
```bash
# Exécuter tous les jours à 2h du matin
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

#### Backup de Tables Spécifiques

```bash
# Backup d'une table critique
npx supabase db dump \
  --project-ref YOUR_PROJECT_REF \
  --table products \
  --file products-backup-$(date +%Y%m%d).sql

# Backup de plusieurs tables
npx supabase db dump \
  --project-ref YOUR_PROJECT_REF \
  --table products \
  --table orders \
  --table users \
  --file critical-tables-$(date +%Y%m%d).sql
```

### 2. Fichiers & Storage

#### Supabase Storage

##### Backup via API

```typescript
// scripts/backup-storage.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function backupBucket(bucketName: string) {
  console.log(`📦 Backing up bucket: ${bucketName}`);
  
  // Lister tous les fichiers
  const { data: files, error } = await supabase
    .storage
    .from(bucketName)
    .list();
  
  if (error) throw error;
  
  const backupDir = `./backups/storage/${bucketName}`;
  fs.mkdirSync(backupDir, { recursive: true });
  
  // Télécharger chaque fichier
  for (const file of files) {
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .download(file.name);
    
    if (error) {
      console.error(`❌ Error downloading ${file.name}:`, error);
      continue;
    }
    
    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(
      path.join(backupDir, file.name),
      buffer
    );
    
    console.log(`✅ Downloaded: ${file.name}`);
  }
  
  console.log(`✨ Backup completed for bucket: ${bucketName}`);
}

// Backup tous les buckets
async function backupAllStorage() {
  const buckets = ['avatars', 'product-images', 'documents'];
  
  for (const bucket of buckets) {
    await backupBucket(bucket);
  }
}

backupAllStorage().catch(console.error);
```

##### Script de Synchronisation

```bash
#!/bin/bash
# scripts/sync-storage.sh

# Utiliser rclone pour sync incrémental
rclone sync \
  supabase-storage:product-images \
  ./backups/storage/product-images \
  --progress \
  --transfers 8

rclone sync \
  supabase-storage:avatars \
  ./backups/storage/avatars \
  --progress \
  --transfers 8
```

### 3. Configuration & Secrets

#### Variables d'Environnement

```bash
# scripts/backup-env.sh

# Backup .env (ATTENTION: fichier sensible!)
cp .env "./backups/env/.env.$(date +%Y%m%d)"

# Chiffrer le backup
gpg --symmetric --cipher-algo AES256 \
  "./backups/env/.env.$(date +%Y%m%d)"

# Supprimer version non chiffrée
rm "./backups/env/.env.$(date +%Y%m%d)"
```

#### Secrets Supabase

```bash
# Exporter les secrets Edge Functions
npx supabase secrets list --project-ref YOUR_PROJECT_REF > secrets-backup.txt

# Chiffrer
gpg --symmetric --cipher-algo AES256 secrets-backup.txt
rm secrets-backup.txt
```

### 4. Code & Configuration Git

Le code est automatiquement versionné via Git, mais pensez à:

```bash
# Tag des releases
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0

# Backup du repository
git bundle create drop-craft-ai-$(date +%Y%m%d).bundle --all

# Upload du bundle
aws s3 cp \
  drop-craft-ai-$(date +%Y%m%d).bundle \
  s3://backups/git/
```

---

## 🔄 Stratégie de Restauration

### 1. Restauration Base de Données

#### Restauration Complète

```bash
# Via Supabase CLI
npx supabase db push \
  --project-ref YOUR_PROJECT_REF \
  --file backup-20240115.sql

# Via psql
psql \
  --host db.YOUR_PROJECT_REF.supabase.co \
  --port 5432 \
  --username postgres \
  --dbname postgres \
  < backup-20240115.sql
```

#### Restauration Point-in-Time (PITR)

**Via Supabase Dashboard:**
1. Database → Backups → Point in Time Recovery
2. Sélectionner la date/heure
3. Cliquer "Restore"
4. ⚠️ Créera un nouveau projet

**Via CLI (bientôt disponible):**
```bash
npx supabase db restore \
  --project-ref YOUR_PROJECT_REF \
  --timestamp "2024-01-15 14:30:00"
```

#### Restauration Table Spécifique

```sql
-- 1. Créer une table temporaire depuis le backup
CREATE TABLE products_backup AS 
SELECT * FROM products;

-- 2. Restaurer depuis le backup
DROP TABLE products;
CREATE TABLE products (...);  -- structure depuis backup
\COPY products FROM 'products-backup.csv' WITH CSV HEADER;

-- 3. Vérifier
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM products_backup;
```

### 2. Restauration Storage

```typescript
// scripts/restore-storage.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function restoreBucket(bucketName: string) {
  console.log(`📦 Restoring bucket: ${bucketName}`);
  
  const backupDir = `./backups/storage/${bucketName}`;
  const files = fs.readdirSync(backupDir);
  
  for (const filename of files) {
    const filePath = path.join(backupDir, filename);
    const fileBuffer = fs.readFileSync(filePath);
    
    const { error } = await supabase
      .storage
      .from(bucketName)
      .upload(filename, fileBuffer, {
        upsert: true
      });
    
    if (error) {
      console.error(`❌ Error uploading ${filename}:`, error);
      continue;
    }
    
    console.log(`✅ Uploaded: ${filename}`);
  }
  
  console.log(`✨ Restore completed for bucket: ${bucketName}`);
}

restoreBucket('product-images').catch(console.error);
```

### 3. Restauration après Incident

#### Procédure Complète

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

set -e

echo "🚨 Starting Disaster Recovery Process..."

# 1. Vérifier les backups disponibles
echo "📋 Available backups:"
ls -lh ./backups/database/ | tail -5

# 2. Demander confirmation
read -p "Enter backup filename to restore: " BACKUP_FILE
read -p "⚠️  This will overwrite current data. Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Recovery cancelled"
  exit 1
fi

# 3. Créer un backup de sécurité avant restauration
echo "💾 Creating safety backup..."
npx supabase db dump \
  --project-ref $PROJECT_REF \
  --file "./backups/safety-backup-$(date +%Y%m%d-%H%M%S).sql"

# 4. Restaurer la base de données
echo "🔄 Restoring database..."
npx supabase db push \
  --project-ref $PROJECT_REF \
  --file "./backups/database/$BACKUP_FILE"

# 5. Restaurer le storage
echo "📦 Restoring storage..."
./scripts/restore-storage.sh

# 6. Vérifications
echo "✅ Running post-restore checks..."
npx supabase db test

# 7. Notification
echo "📧 Sending notification..."
curl -X POST $SLACK_WEBHOOK \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"✅ Disaster recovery completed for $BACKUP_FILE\"}"

echo "✨ Disaster Recovery Process Completed!"
```

---

## 🧪 Tests de Restauration

### Plan de Test Mensuel

```bash
#!/bin/bash
# scripts/test-restore.sh

# 1. Créer un environnement de test
echo "🧪 Creating test environment..."
npx supabase db reset --test-environment

# 2. Restaurer dernier backup
LATEST_BACKUP=$(ls -t ./backups/database/*.sql.gz | head -1)
echo "📦 Testing restore of: $LATEST_BACKUP"

gunzip -c "$LATEST_BACKUP" | \
  npx supabase db push --test-environment

# 3. Vérifications
echo "✅ Running validation tests..."

# Vérifier nombre de tables
TABLE_COUNT=$(psql --test-environment -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
echo "Tables restored: $TABLE_COUNT"

# Vérifier données critiques
PRODUCT_COUNT=$(psql --test-environment -t -c "SELECT COUNT(*) FROM products")
echo "Products restored: $PRODUCT_COUNT"

USER_COUNT=$(psql --test-environment -t -c "SELECT COUNT(*) FROM profiles")
echo "Users restored: $USER_COUNT"

# 4. Rapport
echo "📊 Restore Test Report"
echo "===================="
echo "Backup tested: $LATEST_BACKUP"
echo "Status: ✅ SUCCESS"
echo "Tables: $TABLE_COUNT"
echo "Products: $PRODUCT_COUNT"
echo "Users: $USER_COUNT"
echo "===================="

# 5. Nettoyage
npx supabase db destroy --test-environment
```

**Cron Job (1er de chaque mois):**
```bash
0 3 1 * * /path/to/scripts/test-restore.sh >> /var/log/restore-test.log 2>&1
```

---

## 📦 Stockage des Backups

### Stratégie 3-2-1

**Recommandation:**
- **3** copies des données
- Sur **2** supports différents
- **1** copie hors site

#### Configuration

```bash
# 1. Local (NAS, disque externe)
BACKUP_LOCAL="/mnt/nas/backups/drop-craft-ai"

# 2. Cloud (S3, Backblaze B2)
BACKUP_CLOUD="s3://company-backups/drop-craft-ai"

# 3. Offsite (autre région cloud)
BACKUP_OFFSITE="s3://eu-west-1/company-backups-dr/drop-craft-ai"
```

#### Script de Distribution

```bash
#!/bin/bash
# scripts/distribute-backups.sh

BACKUP_FILE="backup-$(date +%Y%m%d).sql.gz"

# Upload vers Cloud primary
aws s3 cp "$BACKUP_FILE" "$BACKUP_CLOUD/"

# Upload vers Cloud offsite
aws s3 cp "$BACKUP_FILE" "$BACKUP_OFFSITE/" --region eu-west-1

# Copie locale
cp "$BACKUP_FILE" "$BACKUP_LOCAL/"

echo "✅ Backup distributed to 3 locations"
```

### Providers Recommandés

| Provider | Prix | Avantages |
|----------|------|-----------|
| **AWS S3** | ~$0.023/GB/mois | Intégration native, versioning |
| **Backblaze B2** | $0.005/GB/mois | Économique, S3-compatible |
| **Google Cloud Storage** | ~$0.020/GB/mois | Performance, multi-région |
| **Azure Blob Storage** | ~$0.018/GB/mois | Intégration Microsoft |

---

## 🔐 Sécurité des Backups

### Chiffrement

```bash
# Chiffrer avec GPG
gpg --symmetric --cipher-algo AES256 backup.sql
# Créé: backup.sql.gpg

# Déchiffrer
gpg --decrypt backup.sql.gpg > backup.sql
```

### Gestion des Clés

```bash
# Générer une clé de chiffrement
openssl rand -base64 32 > backup-encryption.key

# Stocker la clé de manière sécurisée
# - Gestionnaire de mots de passe (1Password, LastPass)
# - Vault (HashiCorp)
# - AWS Secrets Manager
# - JAMAIS dans Git!
```

### Permissions d'Accès

```bash
# Backups accessibles uniquement par le script
chmod 700 ./backups/
chmod 600 ./backups/database/*
chmod 600 ./backups/env/*

# Logs accessibles en lecture
chmod 644 /var/log/backup.log
```

---

## 📊 Monitoring des Backups

### Vérifications Automatiques

```typescript
// Edge Function: verify-backups
import { serve } from 'https://deno.land/std/http/server.ts';

serve(async () => {
  const checks = {
    databaseBackup: await checkDatabaseBackup(),
    storageBackup: await checkStorageBackup(),
    offlineBackup: await checkOfflineBackup()
  };
  
  const allOk = Object.values(checks).every(check => check.status === 'ok');
  
  if (!allOk) {
    await sendAlert({
      severity: 'high',
      title: 'Backup Verification Failed',
      details: checks
    });
  }
  
  return new Response(JSON.stringify(checks), {
    status: allOk ? 200 : 500
  });
});

async function checkDatabaseBackup() {
  // Vérifier que le dernier backup a < 24h
  const lastBackup = await getLastBackupTimestamp();
  const ageHours = (Date.now() - lastBackup) / (1000 * 60 * 60);
  
  return {
    status: ageHours < 24 ? 'ok' : 'failed',
    lastBackup: new Date(lastBackup).toISOString(),
    ageHours: ageHours.toFixed(2)
  };
}
```

### Dashboard de Backups

```typescript
// src/pages/admin/backup-dashboard.tsx
export function BackupDashboard() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>Backup Status</CardHeader>
        <CardContent>
          <BackupStatusGrid>
            <BackupStatus
              type="Database"
              lastRun="2024-01-15 02:00"
              status="success"
              size="2.4 GB"
            />
            <BackupStatus
              type="Storage"
              lastRun="2024-01-15 03:00"
              status="success"
              size="15.8 GB"
            />
            <BackupStatus
              type="Offsite"
              lastRun="2024-01-15 04:00"
              status="success"
              size="18.2 GB"
            />
          </BackupStatusGrid>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>Recent Backups</CardHeader>
        <CardContent>
          <BackupHistoryTable backups={recentBackups} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>Quick Actions</CardHeader>
        <CardContent>
          <Button onClick={triggerBackup}>
            Trigger Manual Backup
          </Button>
          <Button onClick={testRestore}>
            Test Restore
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📋 Checklist de Backup

### Quotidienne
- [ ] Backup automatique DB exécuté
- [ ] Backup storage synchronisé
- [ ] Logs de backup vérifiés
- [ ] Espace disque suffisant

### Hebdomadaire
- [ ] Backup offsite vérifié
- [ ] Nettoyage anciens backups
- [ ] Test de restauration table
- [ ] Rapport envoyé

### Mensuelle
- [ ] Test de restauration complète
- [ ] Vérification chiffrement
- [ ] Audit accès backups
- [ ] Mise à jour documentation

---

## 🆘 Contacts d'Urgence

| Situation | Contact | Téléphone |
|-----------|---------|-----------|
| **Perte de données** | ops@drop-craft-ai.com | +33 1 XX XX XX XX |
| **Support Supabase** | support.supabase.com | - |
| **Oncall Engineer** | oncall@drop-craft-ai.com | +33 6 XX XX XX XX |

---

## 📚 Ressources

- [Supabase Backup Guide](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [AWS S3 Backup Strategies](https://aws.amazon.com/backup/)
- [3-2-1 Backup Rule](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/)

---

**Dernière mise à jour**: 2024-01-XX  
**Responsable Backups**: ops@drop-craft-ai.com  
**Prochaine révision**: 2024-02-01
