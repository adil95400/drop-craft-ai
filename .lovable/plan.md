

## Diagnostic : Ancienne version affichée (cache PWA)

Le problème est que le **Service Worker PWA** sert une version mise en cache de l'application. Même après un nouveau déploiement, le navigateur continue d'afficher l'ancienne version car le SW utilise `StaleWhileRevalidate` — il sert d'abord le cache, puis télécharge la mise à jour en arrière-plan. La mise à jour ne s'applique qu'au **prochain rechargement**.

### Cause racine

1. **`registerType: 'autoUpdate'`** dans Vite PWA est configuré, mais le composant `UpdateNotification` attend un message `SW_UPDATED` qui n'est jamais envoyé par le SW généré par Workbox (il utilise `controllerchange`)
2. Le SW Workbox par défaut avec `autoUpdate` appelle `skipWaiting()` automatiquement, mais le navigateur ne recharge pas la page — l'utilisateur reste sur l'ancienne version
3. Le `navigateFallback` sert le `index.html` mis en cache

### Plan de correction

1. **Forcer le rechargement quand un nouveau SW prend le contrôle** — Ajouter dans `src/services/PWAService.ts` (ou équivalent) un listener `controllerchange` qui recharge la page automatiquement quand le nouveau SW s'active

2. **Ajouter `skipWaiting: true` et `clientsClaim: true`** dans la config workbox de `vite.config.ts` pour que le nouveau SW prenne le contrôle immédiatement sans attendre que l'utilisateur ferme tous les onglets

3. **Réduire le cache des assets JS/CSS** — Passer de 30 jours à 7 jours pour `static-assets` et s'assurer que les fichiers hashés de Vite invalident correctement le cache

4. **Solution immédiate pour l'utilisateur** — Faire un hard refresh (Ctrl+Shift+R) ou vider le cache du navigateur pour forcer le chargement de la nouvelle version

### Modifications techniques

**`vite.config.ts`** — Ajouter dans la section `workbox`:
```ts
skipWaiting: true,
clientsClaim: true,
```

**`src/services/PWAService.ts`** — Ajouter un listener `controllerchange`:
```ts
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});
```

**`src/components/pwa/UpdateNotification.tsx`** — Simplifier pour écouter `controllerchange` au lieu d'un message custom `SW_UPDATED`

