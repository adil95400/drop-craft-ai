/**
 * DropCraft - FAQ Intégré & Centre d'Aide
 * Base de connaissances searchable avec suggestions intelligentes
 */

class DropCraftFAQ {
  constructor() {
    this.isOpen = false;
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.faqData = this.initFAQData();
    this.init();
  }

  initFAQData() {
    return {
      categories: [
        { id: 'all', name: 'Tout', icon: '📚' },
        { id: 'import', name: 'Import', icon: '📥' },
        { id: 'pricing', name: 'Prix', icon: '💰' },
        { id: 'sync', name: 'Synchronisation', icon: '🔄' },
        { id: 'fulfillment', name: 'Fulfillment', icon: '📦' },
        { id: 'troubleshooting', name: 'Dépannage', icon: '🔧' }
      ],
      questions: [
        // Import
        {
          id: 1,
          category: 'import',
          question: 'Comment importer un produit depuis AliExpress ?',
          answer: `Pour importer un produit depuis AliExpress :
1. Naviguez vers la page produit AliExpress
2. Cliquez sur le bouton vert "Importer vers DropCraft" qui apparaît
3. Configurez les options (marge, catégorie, variantes)
4. Cliquez sur "Importer"

Le produit sera automatiquement ajouté à votre catalogue avec les images, descriptions et variantes.`,
          tags: ['aliexpress', 'import', 'produit', 'catalogue'],
          helpful: 156,
          views: 1250
        },
        {
          id: 2,
          category: 'import',
          question: 'Puis-je importer plusieurs produits en même temps ?',
          answer: `Oui ! Utilisez notre Grabber Multi-Produits :
1. Sur une page de recherche ou catégorie, cliquez sur l'icône DropCraft
2. Sélectionnez "Grabber Multi-Produits"
3. Cochez les produits à importer (jusqu'à 100)
4. Cliquez sur "Importer la sélection"

Vous pouvez aussi utiliser l'import CSV pour des imports massifs.`,
          tags: ['bulk', 'masse', 'multiple', 'grabber'],
          helpful: 89,
          views: 720
        },
        {
          id: 3,
          category: 'import',
          question: 'Quelles plateformes sont supportées pour l\'import ?',
          answer: `DropCraft supporte actuellement :
• AliExpress (complet)
• Amazon (images + descriptions)
• eBay (produits)
• Temu (produits)
• Walmart (produits US)
• Shein (mode)
• 1688 (Chine)
• DHgate (wholesale)
• CJDropshipping (API complète)

D'autres plateformes sont ajoutées régulièrement !`,
          tags: ['plateformes', 'fournisseurs', 'support', 'marketplace'],
          helpful: 234,
          views: 1890
        },
        // Pricing
        {
          id: 4,
          category: 'pricing',
          question: 'Comment configurer ma marge automatique ?',
          answer: `Pour configurer votre marge par défaut :
1. Ouvrez les Paramètres de l'extension
2. Allez dans "Règles d'Import"
3. Définissez votre marge minimum (ex: 30%)
4. Activez "Appliquer automatiquement"

Vous pouvez aussi créer des règles par catégorie ou fournisseur.`,
          tags: ['marge', 'prix', 'automatique', 'profit'],
          helpful: 178,
          views: 1430
        },
        {
          id: 5,
          category: 'pricing',
          question: 'Le calculateur de profit ne fonctionne pas ?',
          answer: `Vérifiez les points suivants :
1. Le prix d'achat est-il bien détecté ? (vérifiez la devise)
2. Avez-vous configuré vos frais de shipping ?
3. Les taxes sont-elles activées dans vos paramètres ?

Si le problème persiste, rechargez la page ou contactez le support.`,
          tags: ['calculateur', 'profit', 'erreur', 'bug'],
          helpful: 45,
          views: 380
        },
        // Sync
        {
          id: 6,
          category: 'sync',
          question: 'Comment synchroniser les stocks automatiquement ?',
          answer: `La synchronisation automatique des stocks :
1. Connectez votre boutique dans DropCraft
2. Allez dans "Synchronisation" > "Paramètres"
3. Activez "Sync automatique des stocks"
4. Définissez la fréquence (toutes les 6h recommandé)

Les stocks seront mis à jour automatiquement selon la disponibilité fournisseur.`,
          tags: ['stock', 'inventaire', 'sync', 'automatique'],
          helpful: 167,
          views: 1340
        },
        {
          id: 7,
          category: 'sync',
          question: 'Que faire si les prix ne se synchronisent pas ?',
          answer: `Si les prix ne se synchronisent pas :
1. Vérifiez votre connexion API dans les paramètres
2. Assurez-vous que la boutique est bien connectée
3. Vérifiez les logs de synchronisation
4. Relancez une sync manuelle

Si le problème persiste, vérifiez que votre abonnement est actif.`,
          tags: ['prix', 'sync', 'erreur', 'api'],
          helpful: 56,
          views: 450
        },
        // Fulfillment
        {
          id: 8,
          category: 'fulfillment',
          question: 'Comment utiliser le copieur d\'adresse ?',
          answer: `Le copieur d'adresse universel :
1. Ouvrez une commande dans DropCraft
2. Cliquez sur "Copier l'adresse"
3. Allez sur le site fournisseur (AliExpress, Amazon...)
4. Cliquez sur "Coller l'adresse" dans le formulaire

L'adresse sera automatiquement remplie dans les champs correspondants.`,
          tags: ['adresse', 'copier', 'fulfillment', 'commande'],
          helpful: 198,
          views: 1560
        },
        {
          id: 9,
          category: 'fulfillment',
          question: 'Comment suivre mes expéditions ?',
          answer: `Pour suivre vos expéditions :
1. Allez dans "Commandes" > "En cours d'expédition"
2. Le numéro de tracking est affiché pour chaque commande
3. Cliquez sur le numéro pour voir le suivi détaillé
4. Activez les notifications pour être alerté des changements

Le tracking multi-transporteurs est supporté (17Track, AfterShip).`,
          tags: ['tracking', 'suivi', 'expédition', 'livraison'],
          helpful: 145,
          views: 1180
        },
        // Troubleshooting
        {
          id: 10,
          category: 'troubleshooting',
          question: 'Le bouton d\'import n\'apparaît pas sur AliExpress',
          answer: `Si le bouton n'apparaît pas :
1. Vérifiez que l'extension est activée (icône colorée)
2. Rechargez la page (Ctrl+R ou Cmd+R)
3. Vérifiez que vous êtes sur une page produit
4. Désactivez les bloqueurs de pub temporairement
5. Réinstallez l'extension si nécessaire

Note: Certaines pages spéciales (flash sales) peuvent ne pas être supportées.`,
          tags: ['bouton', 'apparait', 'aliexpress', 'bug'],
          helpful: 234,
          views: 1890
        },
        {
          id: 11,
          category: 'troubleshooting',
          question: 'L\'extension est lente ou ne répond pas',
          answer: `Pour améliorer les performances :
1. Fermez les onglets inutiles
2. Videz le cache de l'extension (Paramètres > Effacer les données)
3. Réduisez le nombre d'imports simultanés (max 3 recommandé)
4. Mettez à jour Chrome vers la dernière version
5. Désactivez les autres extensions conflictuelles

Si le problème persiste, contactez le support avec les logs.`,
          tags: ['lent', 'performance', 'freeze', 'bug'],
          helpful: 89,
          views: 720
        },
        {
          id: 12,
          category: 'troubleshooting',
          question: 'Erreur de connexion à la boutique',
          answer: `En cas d'erreur de connexion :
1. Vérifiez votre token API dans les paramètres
2. Assurez-vous que votre boutique est accessible
3. Vérifiez les permissions accordées à DropCraft
4. Regénérez le token depuis votre tableau de bord
5. Testez la connexion avec le bouton "Tester"

Contactez le support si l'erreur persiste avec le code d'erreur.`,
          tags: ['connexion', 'token', 'api', 'erreur'],
          helpful: 167,
          views: 1340
        }
      ]
    };
  }

  init() {
    this.injectStyles();
    this.createFAQPanel();
    this.bindEvents();
    console.log('📚 DropCraft FAQ initialisé');
  }

  injectStyles() {
    if (document.getElementById('dropcraft-faq-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'dropcraft-faq-styles';
    styles.textContent = `
      .dc-faq-trigger {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        z-index: 999996;
        transition: all 0.3s ease;
      }

      .dc-faq-trigger:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
      }

      .dc-faq-panel {
        position: fixed;
        bottom: 150px;
        right: 20px;
        width: 420px;
        max-height: 600px;
        background: linear-gradient(180deg, #1a1f2e 0%, #0f1419 100%);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        z-index: 999997;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .dc-faq-panel.open {
        display: flex;
        animation: dc-faq-slide-in 0.3s ease;
      }

      @keyframes dc-faq-slide-in {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .dc-faq-header {
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .dc-faq-header h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .dc-faq-header p {
        margin: 0;
        font-size: 13px;
        opacity: 0.9;
      }

      .dc-faq-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .dc-faq-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
      }

      .dc-faq-search {
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .dc-faq-search-input {
        width: 100%;
        padding: 12px 16px 12px 42px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: white;
        font-size: 14px;
        outline: none;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }

      .dc-faq-search-input:focus {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }

      .dc-faq-search-icon {
        position: absolute;
        left: 30px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;
        opacity: 0.5;
      }

      .dc-faq-categories {
        display: flex;
        gap: 6px;
        padding: 12px 16px;
        overflow-x: auto;
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .dc-faq-category {
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .dc-faq-category:hover {
        background: rgba(102, 126, 234, 0.2);
        border-color: rgba(102, 126, 234, 0.3);
      }

      .dc-faq-category.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-color: transparent;
        color: white;
      }

      .dc-faq-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .dc-faq-item {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        margin-bottom: 12px;
        overflow: hidden;
        transition: all 0.2s ease;
      }

      .dc-faq-item:hover {
        border-color: rgba(102, 126, 234, 0.3);
      }

      .dc-faq-question {
        padding: 14px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
      }

      .dc-faq-question:hover {
        background: rgba(255, 255, 255, 0.02);
      }

      .dc-faq-toggle {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(102, 126, 234, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        transition: all 0.3s ease;
        flex-shrink: 0;
      }

      .dc-faq-item.expanded .dc-faq-toggle {
        transform: rotate(180deg);
        background: #667eea;
      }

      .dc-faq-answer {
        padding: 0 16px;
        max-height: 0;
        overflow: hidden;
        transition: all 0.3s ease;
        color: rgba(255, 255, 255, 0.7);
        font-size: 13px;
        line-height: 1.6;
      }

      .dc-faq-item.expanded .dc-faq-answer {
        padding: 0 16px 16px;
        max-height: 500px;
      }

      .dc-faq-answer-text {
        white-space: pre-line;
      }

      .dc-faq-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
      }

      .dc-faq-helpful {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dc-faq-helpful-btn {
        padding: 4px 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .dc-faq-helpful-btn:hover {
        background: rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.3);
        color: #10b981;
      }

      .dc-faq-no-results {
        text-align: center;
        padding: 40px 20px;
        color: rgba(255, 255, 255, 0.5);
      }

      .dc-faq-no-results-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .dc-faq-footer {
        padding: 16px;
        background: rgba(0, 0, 0, 0.3);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        text-align: center;
      }

      .dc-faq-support-btn {
        padding: 12px 24px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .dc-faq-support-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      }

      .dc-faq-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }

      .dc-faq-tag {
        padding: 2px 8px;
        background: rgba(102, 126, 234, 0.15);
        border-radius: 10px;
        font-size: 10px;
        color: #a5b4fc;
      }
    `;
    document.head.appendChild(styles);
  }

  createFAQPanel() {
    // Trigger button
    const trigger = document.createElement('button');
    trigger.className = 'dc-faq-trigger';
    trigger.innerHTML = '❓';
    trigger.title = 'Centre d\'aide DropCraft';
    document.body.appendChild(trigger);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'dc-faq-panel';
    panel.innerHTML = `
      <div class="dc-faq-header">
        <button class="dc-faq-close">✕</button>
        <h3>📚 Centre d'Aide</h3>
        <p>Trouvez rapidement des réponses à vos questions</p>
      </div>

      <div class="dc-faq-search" style="position: relative;">
        <span class="dc-faq-search-icon">🔍</span>
        <input type="text" class="dc-faq-search-input" placeholder="Rechercher dans la FAQ...">
      </div>

      <div class="dc-faq-categories">
        ${this.faqData.categories.map(cat => `
          <button class="dc-faq-category ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
            ${cat.icon} ${cat.name}
          </button>
        `).join('')}
      </div>

      <div class="dc-faq-content">
        ${this.renderQuestions()}
      </div>

      <div class="dc-faq-footer">
        <button class="dc-faq-support-btn" id="dc-open-support">
          💬 Contacter le Support
        </button>
      </div>
    `;
    document.body.appendChild(panel);

    this.trigger = trigger;
    this.panel = panel;
  }

  renderQuestions(query = '', category = 'all') {
    let questions = this.faqData.questions;

    // Filter by category
    if (category !== 'all') {
      questions = questions.filter(q => q.category === category);
    }

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      questions = questions.filter(q => 
        q.question.toLowerCase().includes(lowerQuery) ||
        q.answer.toLowerCase().includes(lowerQuery) ||
        q.tags.some(tag => tag.includes(lowerQuery))
      );
    }

    if (questions.length === 0) {
      return `
        <div class="dc-faq-no-results">
          <div class="dc-faq-no-results-icon">🔍</div>
          <p>Aucun résultat trouvé</p>
          <p style="font-size: 12px;">Essayez d'autres mots-clés ou contactez le support</p>
        </div>
      `;
    }

    return questions.map(q => `
      <div class="dc-faq-item" data-id="${q.id}">
        <div class="dc-faq-question">
          <span>${q.question}</span>
          <span class="dc-faq-toggle">▼</span>
        </div>
        <div class="dc-faq-answer">
          <div class="dc-faq-answer-text">${q.answer}</div>
          <div class="dc-faq-tags">
            ${q.tags.map(tag => `<span class="dc-faq-tag">#${tag}</span>`).join('')}
          </div>
          <div class="dc-faq-meta">
            <span>👁️ ${q.views} vues</span>
            <div class="dc-faq-helpful">
              <span>Utile ?</span>
              <button class="dc-faq-helpful-btn" data-id="${q.id}">👍 ${q.helpful}</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  bindEvents() {
    // Toggle panel
    this.trigger.addEventListener('click', () => this.toggle());
    
    // Close button
    this.panel.querySelector('.dc-faq-close').addEventListener('click', () => this.close());

    // Search
    const searchInput = this.panel.querySelector('.dc-faq-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.updateContent();
    });

    // Categories
    this.panel.querySelectorAll('.dc-faq-category').forEach(btn => {
      btn.addEventListener('click', () => {
        this.panel.querySelectorAll('.dc-faq-category').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedCategory = btn.dataset.category;
        this.updateContent();
      });
    });

    // Questions toggle
    this.panel.querySelector('.dc-faq-content').addEventListener('click', (e) => {
      const question = e.target.closest('.dc-faq-question');
      if (question) {
        const item = question.closest('.dc-faq-item');
        item.classList.toggle('expanded');
      }

      // Helpful button
      const helpfulBtn = e.target.closest('.dc-faq-helpful-btn');
      if (helpfulBtn) {
        const id = parseInt(helpfulBtn.dataset.id);
        this.markHelpful(id, helpfulBtn);
      }
    });

    // Support button
    this.panel.querySelector('#dc-open-support').addEventListener('click', () => {
      this.close();
      if (window.DropCraftSupport) {
        window.DropCraftSupport.open();
      }
    });
  }

  updateContent() {
    const content = this.panel.querySelector('.dc-faq-content');
    content.innerHTML = this.renderQuestions(this.searchQuery, this.selectedCategory);
  }

  markHelpful(id, button) {
    const question = this.faqData.questions.find(q => q.id === id);
    if (question) {
      question.helpful++;
      button.innerHTML = `👍 ${question.helpful}`;
      button.style.background = 'rgba(16, 185, 129, 0.3)';
      button.style.color = '#10b981';
    }
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.panel.classList.add('open');
    this.isOpen = true;
  }

  close() {
    this.panel.classList.remove('open');
    this.isOpen = false;
  }
}

// Initialize
if (!window.DropCraftFAQ) {
  window.DropCraftFAQ = new DropCraftFAQ();
}
