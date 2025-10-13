# 📱 Guide Mobile - Shopopti+

## Vue d'ensemble

Shopopti+ est optimisé pour mobile avec Capacitor, offrant une expérience native sur iOS et Android.

## ✨ Fonctionnalités Mobile

- ✅ Navigation mobile optimisée avec bottom tab bar
- ✅ Header mobile avec recherche et notifications
- ✅ Support des safe areas (encoche iPhone, etc.)
- ✅ Animations et transitions fluides
- ✅ Design responsive adaptatif
- ✅ Dark mode compatible
- ✅ Performance optimisée

## 🚀 Tester en Développement

### Dans le navigateur (mode responsive)

1. Ouvrez l'app dans Lovable
2. Cliquez sur l'icône mobile/tablet au-dessus de la preview
3. Testez les différentes tailles d'écran

### Sur appareil physique ou émulateur

**Prérequis:**
- Node.js 18+ installé
- Android Studio (pour Android) ou Xcode (pour iOS sur Mac)

**Étapes:**

1. **Exportez vers GitHub**
   ```bash
   # Depuis Lovable, cliquez sur "Export to Github"
   git clone <votre-repo>
   cd <votre-projet>
   ```

2. **Installez les dépendances**
   ```bash
   npm install
   ```

3. **Ajoutez les plateformes**
   ```bash
   # Pour Android
   npx cap add android
   
   # Pour iOS (Mac uniquement)
   npx cap add ios
   ```

4. **Mettez à jour les dépendances natives**
   ```bash
   # Android
   npx cap update android
   
   # iOS
   npx cap update ios
   ```

5. **Build du projet web**
   ```bash
   npm run build
   ```

6. **Synchronisez avec les plateformes natives**
   ```bash
   npx cap sync
   ```

7. **Lancez sur l'émulateur/appareil**
   ```bash
   # Android
   npx cap run android
   
   # iOS (Mac uniquement)
   npx cap run ios
   ```

## 📐 Composants Mobile

### MobileNav
Navigation bottom bar avec 5 onglets principaux:
- 🏠 Accueil (Dashboard)
- 📦 Produits
- 🛒 Commandes
- 📊 Analytics
- ⚙️ Paramètres

### MobileHeader
Header sticky avec:
- Logo et branding
- Bouton de recherche
- Notifications avec badge

### MobileQuickActions
Actions rapides en grille pour:
- Import de produits
- IA Insights
- Analytics temps réel
- Gestion clients

## 🎨 Classes CSS Mobile

```css
.pt-safe  /* Padding top safe area */
.pb-safe  /* Padding bottom safe area */
.pl-safe  /* Padding left safe area */
.pr-safe  /* Padding right safe area */
```

## 🔧 Configuration Capacitor

Le fichier `capacitor.config.ts` est configuré pour:
- Hot reload depuis le sandbox Lovable
- Splash screen personnalisé
- Push notifications
- Local notifications

## 📱 Breakpoints Responsive

- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md/lg)
- **Desktop:** > 1024px (xl)

## 🎯 Optimisations Appliquées

1. **Performance**
   - Lazy loading des images
   - Code splitting par route
   - Compression des assets

2. **UX Mobile**
   - Touch targets ≥ 44px
   - Feedback visuel (active:scale-95)
   - Animations 60fps
   - Gestes natifs

3. **Accessibilité**
   - Contraste minimum WCAG AA
   - Labels ARIA
   - Navigation clavier
   - Support lecteur d'écran

## 📚 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Blog Lovable - Mobile Dev](https://lovable.dev/blog)
- [Safe Area Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/env)

## 🆘 Troubleshooting

### L'app ne démarre pas sur Android
```bash
# Nettoyez et rebuild
cd android
./gradlew clean
cd ..
npx cap sync android
npx cap run android
```

### L'app ne démarre pas sur iOS
```bash
# Ouvrez dans Xcode et rebuild
npx cap open ios
# Puis dans Xcode: Product > Clean Build Folder
# Puis: Product > Run
```

### Hot reload ne fonctionne pas
Vérifiez que l'URL dans `capacitor.config.ts` correspond à votre sandbox Lovable.

## 🎉 Prochaines Étapes

1. Testez sur différents appareils
2. Ajoutez des screenshots
3. Configurez les icônes et splash screens
4. Préparez pour les stores (App Store, Google Play)

---

**Besoin d'aide?** Consultez la [documentation Lovable](https://docs.lovable.dev) ou rejoignez le [Discord Lovable](https://discord.gg/lovable)
