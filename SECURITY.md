# Politique de Sécurité - Drop Craft AI

## 🔒 Signalement de Vulnérabilités de Sécurité

La sécurité de Drop Craft AI est notre priorité absolue. Si vous découvrez une vulnérabilité de sécurité, nous vous remercions de nous la signaler de manière responsable.

### Comment signaler une vulnérabilité

**NE PAS** créer d'issue publique sur GitHub pour les vulnérabilités de sécurité.

À la place, veuillez :

1. **Envoyer un email privé** à : **security@dropcraft.ai**
2. **Inclure les informations suivantes** :
   - Description détaillée de la vulnérabilité
   - Étapes pour reproduire le problème
   - Impact potentiel
   - Toute preuve de concept (si applicable)
   - Votre nom et coordonnées pour les crédits

### Ce que vous pouvez attendre

- **Accusé de réception** : Sous 24 heures
- **Première évaluation** : Sous 72 heures
- **Mise à jour régulière** : Au moins une fois par semaine
- **Résolution** : Selon la criticité (voir tableau ci-dessous)

| Criticité | Temps de résolution |
|-----------|-------------------|
| Critique  | 24-48 heures     |
| Élevée    | 3-7 jours        |
| Moyenne   | 7-30 jours       |
| Faible    | 30-90 jours      |

## 🛡️ Versions Supportées

Nous maintenons activement la sécurité pour les versions suivantes :

| Version | Support Sécurité |
|---------|------------------|
| 1.x.x   | ✅ Supportée     |
| 0.x.x   | ❌ Non supportée |

## 🔍 Périmètre de Sécurité

### Dans le périmètre ✅

- **Application principale** (Frontend React)
- **Edge Functions Supabase** (Backend)
- **Configuration d'authentification**
- **Gestion des API keys**
- **Pipeline CI/CD**
- **Configuration Supabase (RLS, policies)**

### Hors périmètre ❌

- **Services tiers** (Shopify, AliExpress, etc.)
- **Infrastructure Supabase/Vercel**
- **Attaques DDoS**
- **Ingénierie sociale**
- **Vulnérabilités nécessitant un accès physique**

## 🏆 Programme de Reconnaissance

### Crédits de Sécurité

Les chercheurs qui nous aident à améliorer la sécurité recevront :

- **Mention publique** dans nos notes de version
- **Profil sur notre page de remerciements**
- **Badge "Security Researcher"** sur notre Discord
- **Accès early-access** aux nouvelles fonctionnalités

### Récompenses (Bug Bounty)

Nous opérons un programme de récompenses informel :

| Type de Vulnérabilité | Récompense |
|----------------------|------------|
| RCE / SQLi Critique  | 200-500€   |
| XSS / Auth Bypass    | 100-300€   |
| IDOR / Info Leak     | 50-150€    |
| Config / Logic Flaw  | 25-100€    |

*Les récompenses sont à la discrétion de l'équipe de sécurité*

## 🛠️ Mesures de Sécurité Implémentées

### Authentification & Autorisation
- ✅ **Row Level Security (RLS)** sur toutes les tables
- ✅ **JWT avec expiration courte**
- ✅ **Gestion des rôles** (admin, user, staff)
- ✅ **2FA disponible** pour les comptes admin
- ✅ **Rate limiting** sur les endpoints sensibles

### Protection des Données
- ✅ **Chiffrement en transit** (HTTPS obligatoire)
- ✅ **Chiffrement au repos** (Supabase)
- ✅ **Hashage sécurisé** des mots de passe
- ✅ **Clés API chiffrées** côté utilisateur
- ✅ **Logs d'audit** pour les actions sensibles

### Sécurité Application
- ✅ **Content Security Policy (CSP)**
- ✅ **Protection CSRF**
- ✅ **Validation stricte des inputs**
- ✅ **Sanitisation des données**
- ✅ **Gestion sécurisée des erreurs**

### Infrastructure
- ✅ **Pipeline CI/CD sécurisé**
- ✅ **Audit automatique des dépendances**
- ✅ **Scan de sécurité automatisé**
- ✅ **Variables d'environnement chiffrées**
- ✅ **Backup automatiques**

## 🚨 Types de Vulnérabilités Prioritaires

### Critique
- **Remote Code Execution (RCE)**
- **SQL Injection**
- **Authentication Bypass**
- **Privilege Escalation**
- **Data Exposure massive**

### Élevée
- **Cross-Site Scripting (XSS)**
- **Cross-Site Request Forgery (CSRF)**
- **Insecure Direct Object Reference (IDOR)**
- **Sensitive Information Disclosure**
- **API Security Issues**

### Moyenne
- **Business Logic Flaws**
- **Information Leakage**
- **Session Management Issues**
- **Input Validation Problems**

## 📋 Checklist de Sécurité pour Développeurs

### Avant chaque commit
- [ ] Pas de secrets dans le code
- [ ] Validation des inputs utilisateur
- [ ] Gestion appropriée des erreurs
- [ ] Tests de sécurité passés

### Avant chaque release
- [ ] Scan de dépendances mis à jour
- [ ] Tests de pénétration effectués
- [ ] Configuration de sécurité vérifiée
- [ ] Documentation sécurité à jour

## 🔗 Ressources de Sécurité

### Outils utilisés
- **ESLint Security Plugin** - Analyse statique
- **npm audit** - Scan des dépendances
- **Supabase Security** - Monitoring backend
- **GitHub Security Advisories** - Alertes vulnérabilités

### Standards suivis
- **OWASP Top 10** - Vulnérabilités web
- **SANS Top 25** - Erreurs de programmation
- **NIST Cybersecurity Framework**
- **ISO 27001** - Gestion sécurité information

## 📞 Contact Sécurité

- **Email principal** : security@dropcraft.ai
- **Email backup** : adil95400+security@gmail.com
- **PGP Key** : [Disponible sur demande]

---

**Nous remercions la communauté de sécurité pour son aide précieuse dans l'amélioration continue de la sécurité de Drop Craft AI.**