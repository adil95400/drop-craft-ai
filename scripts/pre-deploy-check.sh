#!/bin/bash

# DropCraft AI - Pre-Deployment Verification Script
# =================================================

set -e

echo "🔍 DropCraft AI - Vérification pré-déploiement commercial..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Helper functions
check_passed() {
    echo -e "${GREEN}✓ $1${NC}"
    ((CHECKS_PASSED++))
}

check_failed() {
    echo -e "${RED}✗ $1${NC}"
    ((CHECKS_FAILED++))
}

check_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNINGS++))
}

echo -e "${BLUE}📋 Début des vérifications...${NC}"
echo ""

# 1. Check Node.js and npm versions
echo "🔧 Vérification de l'environnement..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    if [[ $NODE_VERSION =~ ^v1[8-9]\.|^v[2-9][0-9] ]]; then
        check_passed "Node.js version $NODE_VERSION"
    else
        check_failed "Node.js version $NODE_VERSION (minimum v18 requis)"
    fi
else
    check_failed "Node.js n'est pas installé"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_passed "npm version $NPM_VERSION"
else
    check_failed "npm n'est pas installé"
fi

# 2. Check if dependencies are installed
echo ""
echo "📦 Vérification des dépendances..."
if [ -f "package.json" ]; then
    check_passed "package.json trouvé"
    
    if [ -d "node_modules" ]; then
        check_passed "node_modules installé"
    else
        check_failed "node_modules manquant - exécutez 'npm install'"
    fi
else
    check_failed "package.json manquant"
fi

# 3. TypeScript compilation check
echo ""
echo "🔍 Vérification TypeScript..."
if command -v tsc &> /dev/null || [ -f "node_modules/.bin/tsc" ]; then
    if npm run type-check &> /dev/null; then
        check_passed "Compilation TypeScript réussie"
    else
        check_failed "Erreurs TypeScript détectées"
    fi
else
    check_warning "TypeScript compiler non trouvé"
fi

# 4. Build test
echo ""
echo "🏗️ Test de build de production..."
if npm run build &> /dev/null; then
    check_passed "Build de production réussi"
    
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        check_passed "Dossier dist généré ($DIST_SIZE)"
    else
        check_failed "Dossier dist manquant"
    fi
else
    check_failed "Échec du build de production"
fi

# 5. Environment variables check
echo ""
echo "🔐 Vérification des variables d'environnement..."
if [ -f ".env.production" ]; then
    check_passed "Fichier .env.production trouvé"
    
    # Check required variables
    required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_PUBLISHABLE_KEY" "VITE_APP_URL")
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env.production; then
            check_passed "Variable $var configurée"
        else
            check_failed "Variable $var manquante dans .env.production"
        fi
    done
else
    check_failed "Fichier .env.production manquant"
fi

# 6. Supabase connectivity check
echo ""
echo "🗄️ Vérification de la connectivité Supabase..."
SUPABASE_URL="https://dtozyrmmekdnvekissuh.supabase.co"
if curl -s "$SUPABASE_URL/health" > /dev/null; then
    check_passed "Supabase accessible"
else
    check_warning "Impossible de vérifier la connectivité Supabase"
fi

# 7. Critical files check
echo ""
echo "📄 Vérification des fichiers critiques..."
critical_files=("vercel.json" "scripts/deploy.sh" "README.md")
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        check_passed "Fichier $file présent"
    else
        check_failed "Fichier $file manquant"
    fi
done

# 8. Security check
echo ""
echo "🛡️ Vérification de sécurité basique..."
if [ -f ".env" ]; then
    check_warning "Fichier .env trouvé - assurez-vous qu'il n'est pas committé"
fi

if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        check_passed ".env est dans .gitignore"
    else
        check_warning ".env devrait être dans .gitignore"
    fi
else
    check_warning "Fichier .gitignore manquant"
fi

# 9. Performance check
echo ""
echo "⚡ Vérification des optimisations de performance..."
if [ -d "dist" ]; then
    # Check if files are compressed
    if find dist -name "*.js" -size +100k | grep -q .; then
        check_warning "Gros fichiers JS détectés - vérifiez le code splitting"
    else
        check_passed "Taille des fichiers JS optimale"
    fi
fi

# Final report
echo ""
echo "=========================================="
echo -e "${BLUE}📊 RAPPORT FINAL${NC}"
echo "=========================================="
echo -e "✅ Vérifications réussies: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "❌ Vérifications échouées: ${RED}$CHECKS_FAILED${NC}"
echo -e "⚠️  Avertissements: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 APPLICATION PRÊTE POUR DÉPLOIEMENT COMMERCIAL!${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Exécutez: ./scripts/deploy.sh production"
    echo "2. Configurez votre domaine personnalisé"
    echo "3. Testez en production"
    echo "4. Activez le monitoring"
    echo ""
    exit 0
else
    echo -e "${RED}❌ DÉPLOIEMENT NON RECOMMANDÉ${NC}"
    echo ""
    echo "Veuillez corriger les erreurs avant de déployer:"
    echo "- Vérifiez les dépendances manquantes"
    echo "- Corrigez les erreurs TypeScript"
    echo "- Configurez les variables d'environnement"
    echo ""
    exit 1
fi