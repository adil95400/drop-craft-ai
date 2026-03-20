

# Plan : Corriger l'affichage noir et blanc

## Diagnostic

L'application apparaît en noir et blanc parce que **le build échoue** à cause d'une erreur de compilation dans `main.tsx`. L'erreur "Duplicate data-lov-id attribute" est injectée par le système de build Lovable (pas par votre code source).

Le fichier `src/main.tsx` source est propre — pas de duplication. Le problème vient du plugin de transformation qui injecte les attributs `data-lov-id` deux fois.

## Cause racine

Le build échoue →