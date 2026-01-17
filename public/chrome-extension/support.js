/**
 * DropCraft - Système de Support Intégré
 * Chat en direct, tickets et feedback utilisateur
 */

class DropCraftSupport {
  constructor() {
    this.isOpen = false;
    this.currentView = 'main'; // main, chat, ticket, feedback
    this.messages = [];
    this.tickets = [];
    this.init();
  }

  init() {
    this.injectStyles();
    this.createSupportPanel();
    this.bindEvents();
    this.loadTickets();
    console.log('💬 DropCraft Support initialisé');
  }

  injectStyles() {
    if (document.getElementById('dropcraft-support-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'dropcraft-support-styles';
    styles.textContent = `
      .dc-support-trigger {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
        z-index: 999995;
        transition: all 0.3s ease;
      }

      .dc-support-trigger:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(16, 185, 129, 0.5);
      }

      .dc-support-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        width: 20px;
        height: 20px;
        background: #ef4444;
        border-radius: 50%;
        font-size: 11px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        display: none;
      }

      .dc-support-panel {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 380px;
        max-height: 550px;
        background: linear-gradient(180deg, #1a1f2e 0%, #0f1419 100%);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        z-index: 999996;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .dc-support-panel.open {
        display: flex;
        animation: dc-support-slide-in 0.3s ease;
      }

      @keyframes dc-support-slide-in {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .dc-support-header {
        padding: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        position: relative;
      }

      .dc-support-header h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .dc-support-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .dc-support-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #86efac;
        animation: dc-pulse 2s infinite;
      }

      @keyframes dc-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .dc-support-close {
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

      .dc-support-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .dc-support-back {
        position: absolute;
        top: 15px;
        left: 15px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        font-size: 16px;
        display: none;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .dc-support-back:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .dc-support-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      /* Main Menu */
      .dc-support-menu {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .dc-support-menu-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: white;
        text-align: left;
      }

      .dc-support-menu-item:hover {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.2);
        transform: translateX(4px);
      }

      .dc-support-menu-icon {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .dc-support-menu-text h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
      }

      .dc-support-menu-text p {
        margin: 0;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
      }

      /* Chat View */
      .dc-support-chat {
        display: none;
        flex-direction: column;
        height: 100%;
      }

      .dc-support-chat.active {
        display: flex;
      }

      .dc-support-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .dc-support-message {
        max-width: 85%;
        padding: 12px 14px;
        border-radius: 16px;
        font-size: 13px;
        line-height: 1.5;
      }

      .dc-support-message.bot {
        align-self: flex-start;
        background: rgba(255, 255, 255, 0.08);
        color: white;
        border-bottom-left-radius: 4px;
      }

      .dc-support-message.user {
        align-self: flex-end;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border-bottom-right-radius: 4px;
      }

      .dc-support-message-time {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 4px;
      }

      .dc-support-typing {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 12px 14px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        align-self: flex-start;
        display: none;
      }

      .dc-support-typing.active {
        display: flex;
      }

      .dc-support-typing-dot {
        width: 6px;
        height: 6px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        animation: dc-typing 1.4s infinite;
      }

      .dc-support-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .dc-support-typing-dot:nth-child(3) { animation-delay: 0.4s; }

      @keyframes dc-typing {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1); }
      }

      .dc-support-input-area {
        padding: 12px;
        background: rgba(0, 0, 0, 0.2);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        gap: 10px;
      }

      .dc-support-input {
        flex: 1;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        color: white;
        font-size: 13px;
        outline: none;
      }

      .dc-support-input:focus {
        border-color: #10b981;
      }

      .dc-support-send {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .dc-support-send:hover {
        transform: scale(1.05);
      }

      /* Ticket View */
      .dc-support-ticket {
        display: none;
      }

      .dc-support-ticket.active {
        display: block;
      }

      .dc-support-ticket-form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .dc-support-form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .dc-support-form-group label {
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
        font-weight: 500;
      }

      .dc-support-form-group input,
      .dc-support-form-group select,
      .dc-support-form-group textarea {
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: white;
        font-size: 13px;
        outline: none;
      }

      .dc-support-form-group textarea {
        min-height: 100px;
        resize: vertical;
      }

      .dc-support-form-group input:focus,
      .dc-support-form-group select:focus,
      .dc-support-form-group textarea:focus {
        border-color: #10b981;
      }

      .dc-support-submit {
        padding: 14px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .dc-support-submit:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      }

      /* Feedback View */
      .dc-support-feedback {
        display: none;
      }

      .dc-support-feedback.active {
        display: block;
      }

      .dc-support-rating {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin: 20px 0;
      }

      .dc-support-star {
        font-size: 36px;
        cursor: pointer;
        transition: all 0.2s ease;
        filter: grayscale(1);
        opacity: 0.5;
      }

      .dc-support-star:hover,
      .dc-support-star.active {
        filter: grayscale(0);
        opacity: 1;
        transform: scale(1.1);
      }

      .dc-support-rating-text {
        text-align: center;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        margin-bottom: 20px;
      }

      /* Tickets List */
      .dc-support-tickets-list {
        margin-top: 20px;
      }

      .dc-support-tickets-title {
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
        margin-bottom: 10px;
        font-weight: 600;
      }

      .dc-support-ticket-item {
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        margin-bottom: 8px;
      }

      .dc-support-ticket-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }

      .dc-support-ticket-id {
        font-size: 11px;
        color: #10b981;
        font-weight: 600;
      }

      .dc-support-ticket-status {
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
      }

      .dc-support-ticket-status.open {
        background: rgba(234, 179, 8, 0.2);
        color: #fbbf24;
      }

      .dc-support-ticket-status.resolved {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      .dc-support-ticket-subject {
        color: white;
        font-size: 13px;
        margin-bottom: 4px;
      }

      .dc-support-ticket-date {
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
      }

      /* Quick Actions */
      .dc-support-quick-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      .dc-support-quick-action {
        padding: 8px 14px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .dc-support-quick-action:hover {
        background: rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.3);
        color: #10b981;
      }
    `;
    document.head.appendChild(styles);
  }

  createSupportPanel() {
    // Trigger button
    const trigger = document.createElement('button');
    trigger.className = 'dc-support-trigger';
    trigger.innerHTML = '💬<span class="dc-support-badge">0</span>';
    trigger.title = 'Support DropCraft';
    document.body.appendChild(trigger);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'dc-support-panel';
    panel.innerHTML = `
      <div class="dc-support-header">
        <button class="dc-support-back">←</button>
        <button class="dc-support-close">✕</button>
        <h3>💬 Support DropCraft</h3>
        <div class="dc-support-status">
          <span class="dc-support-status-dot"></span>
          <span>En ligne - Temps de réponse ~2 min</span>
        </div>
      </div>

      <div class="dc-support-content">
        <!-- Main Menu -->
        <div class="dc-support-menu" id="dc-support-main">
          <button class="dc-support-menu-item" data-view="chat">
            <div class="dc-support-menu-icon">🤖</div>
            <div class="dc-support-menu-text">
              <h4>Chat en Direct</h4>
              <p>Assistance instantanée avec notre bot IA</p>
            </div>
          </button>

          <button class="dc-support-menu-item" data-view="ticket">
            <div class="dc-support-menu-icon">🎫</div>
            <div class="dc-support-menu-text">
              <h4>Créer un Ticket</h4>
              <p>Pour les demandes complexes</p>
            </div>
          </button>

          <button class="dc-support-menu-item" data-view="feedback">
            <div class="dc-support-menu-icon">⭐</div>
            <div class="dc-support-menu-text">
              <h4>Donner un Avis</h4>
              <p>Aidez-nous à nous améliorer</p>
            </div>
          </button>

          <button class="dc-support-menu-item" id="dc-open-faq">
            <div class="dc-support-menu-icon">📚</div>
            <div class="dc-support-menu-text">
              <h4>Centre d'Aide</h4>
              <p>Questions fréquentes</p>
            </div>
          </button>
        </div>

        <!-- Chat View -->
        <div class="dc-support-chat" id="dc-support-chat">
          <div class="dc-support-quick-actions">
            <button class="dc-support-quick-action" data-message="J'ai un problème d'import">🔧 Problème import</button>
            <button class="dc-support-quick-action" data-message="Comment configurer ma boutique ?">⚙️ Configuration</button>
            <button class="dc-support-quick-action" data-message="Les prix ne se synchronisent pas">💰 Sync prix</button>
          </div>
          <div class="dc-support-messages" id="dc-chat-messages">
            <div class="dc-support-message bot">
              Bonjour ! 👋 Je suis l'assistant DropCraft. Comment puis-je vous aider aujourd'hui ?
              <div class="dc-support-message-time">${this.formatTime(new Date())}</div>
            </div>
          </div>
          <div class="dc-support-typing">
            <div class="dc-support-typing-dot"></div>
            <div class="dc-support-typing-dot"></div>
            <div class="dc-support-typing-dot"></div>
          </div>
        </div>

        <!-- Ticket View -->
        <div class="dc-support-ticket" id="dc-support-ticket">
          <form class="dc-support-ticket-form" id="dc-ticket-form">
            <div class="dc-support-form-group">
              <label>Catégorie *</label>
              <select name="category" required>
                <option value="">Sélectionner...</option>
                <option value="import">Problème d'import</option>
                <option value="sync">Synchronisation</option>
                <option value="payment">Facturation</option>
                <option value="bug">Bug technique</option>
                <option value="feature">Suggestion</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div class="dc-support-form-group">
              <label>Sujet *</label>
              <input type="text" name="subject" placeholder="Décrivez brièvement votre problème" required>
            </div>

            <div class="dc-support-form-group">
              <label>Description *</label>
              <textarea name="description" placeholder="Détaillez votre demande..." required></textarea>
            </div>

            <div class="dc-support-form-group">
              <label>Email de contact *</label>
              <input type="email" name="email" placeholder="votre@email.com" required>
            </div>

            <button type="submit" class="dc-support-submit">
              📤 Envoyer le ticket
            </button>
          </form>

          <div class="dc-support-tickets-list" id="dc-tickets-list">
            <div class="dc-support-tickets-title">📋 Mes tickets récents</div>
          </div>
        </div>

        <!-- Feedback View -->
        <div class="dc-support-feedback" id="dc-support-feedback">
          <p style="color: rgba(255, 255, 255, 0.8); text-align: center; margin-bottom: 10px;">
            Comment évaluez-vous DropCraft ?
          </p>

          <div class="dc-support-rating" id="dc-rating">
            <span class="dc-support-star" data-rating="1">⭐</span>
            <span class="dc-support-star" data-rating="2">⭐</span>
            <span class="dc-support-star" data-rating="3">⭐</span>
            <span class="dc-support-star" data-rating="4">⭐</span>
            <span class="dc-support-star" data-rating="5">⭐</span>
          </div>

          <div class="dc-support-rating-text" id="dc-rating-text">
            Cliquez sur une étoile
          </div>

          <form class="dc-support-ticket-form" id="dc-feedback-form" style="display: none;">
            <div class="dc-support-form-group">
              <label>Qu'est-ce qui pourrait être amélioré ?</label>
              <textarea name="feedback" placeholder="Vos suggestions..."></textarea>
            </div>

            <button type="submit" class="dc-support-submit">
              ✨ Envoyer mon avis
            </button>
          </form>
        </div>
      </div>

      <div class="dc-support-input-area" id="dc-chat-input-area" style="display: none;">
        <input type="text" class="dc-support-input" id="dc-chat-input" placeholder="Écrivez votre message...">
        <button class="dc-support-send" id="dc-chat-send">➤</button>
      </div>
    `;
    document.body.appendChild(panel);

    this.trigger = trigger;
    this.panel = panel;
  }

  bindEvents() {
    // Toggle panel
    this.trigger.addEventListener('click', () => this.toggle());
    
    // Close button
    this.panel.querySelector('.dc-support-close').addEventListener('click', () => this.close());

    // Back button
    this.panel.querySelector('.dc-support-back').addEventListener('click', () => this.showView('main'));

    // Menu items
    this.panel.querySelectorAll('.dc-support-menu-item[data-view]').forEach(item => {
      item.addEventListener('click', () => {
        this.showView(item.dataset.view);
      });
    });

    // Open FAQ
    this.panel.querySelector('#dc-open-faq').addEventListener('click', () => {
      this.close();
      if (window.DropCraftFAQ) {
        window.DropCraftFAQ.open();
      }
    });

    // Quick actions
    this.panel.querySelectorAll('.dc-support-quick-action').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sendMessage(btn.dataset.message);
      });
    });

    // Chat input
    const chatInput = this.panel.querySelector('#dc-chat-input');
    const chatSend = this.panel.querySelector('#dc-chat-send');

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && chatInput.value.trim()) {
        this.sendMessage(chatInput.value.trim());
        chatInput.value = '';
      }
    });

    chatSend.addEventListener('click', () => {
      if (chatInput.value.trim()) {
        this.sendMessage(chatInput.value.trim());
        chatInput.value = '';
      }
    });

    // Ticket form
    this.panel.querySelector('#dc-ticket-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitTicket(e.target);
    });

    // Rating stars
    this.panel.querySelectorAll('.dc-support-star').forEach(star => {
      star.addEventListener('click', () => {
        this.setRating(parseInt(star.dataset.rating));
      });
    });

    // Feedback form
    this.panel.querySelector('#dc-feedback-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitFeedback(e.target);
    });
  }

  showView(view) {
    this.currentView = view;
    const backBtn = this.panel.querySelector('.dc-support-back');
    const inputArea = this.panel.querySelector('#dc-chat-input-area');

    // Hide all views
    this.panel.querySelector('#dc-support-main').style.display = 'none';
    this.panel.querySelector('#dc-support-chat').classList.remove('active');
    this.panel.querySelector('#dc-support-ticket').classList.remove('active');
    this.panel.querySelector('#dc-support-feedback').classList.remove('active');
    inputArea.style.display = 'none';

    // Show selected view
    switch (view) {
      case 'main':
        this.panel.querySelector('#dc-support-main').style.display = 'flex';
        backBtn.style.display = 'none';
        break;
      case 'chat':
        this.panel.querySelector('#dc-support-chat').classList.add('active');
        inputArea.style.display = 'flex';
        backBtn.style.display = 'flex';
        break;
      case 'ticket':
        this.panel.querySelector('#dc-support-ticket').classList.add('active');
        backBtn.style.display = 'flex';
        this.renderTickets();
        break;
      case 'feedback':
        this.panel.querySelector('#dc-support-feedback').classList.add('active');
        backBtn.style.display = 'flex';
        break;
    }
  }

  sendMessage(text) {
    const messagesContainer = this.panel.querySelector('#dc-chat-messages');
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'dc-support-message user';
    userMsg.innerHTML = `
      ${text}
      <div class="dc-support-message-time">${this.formatTime(new Date())}</div>
    `;
    messagesContainer.appendChild(userMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Show typing indicator
    const typing = this.panel.querySelector('.dc-support-typing');
    typing.classList.add('active');

    // Simulate bot response
    setTimeout(() => {
      typing.classList.remove('active');
      this.addBotResponse(text);
    }, 1500);
  }

  addBotResponse(userMessage) {
    const messagesContainer = this.panel.querySelector('#dc-chat-messages');
    const response = this.generateBotResponse(userMessage);

    const botMsg = document.createElement('div');
    botMsg.className = 'dc-support-message bot';
    botMsg.innerHTML = `
      ${response}
      <div class="dc-support-message-time">${this.formatTime(new Date())}</div>
    `;
    messagesContainer.appendChild(botMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  generateBotResponse(message) {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('import') || lowerMsg.includes('importer')) {
      return `Pour importer un produit :
1. Naviguez vers la page du produit fournisseur
2. Cliquez sur le bouton vert DropCraft
3. Configurez vos options et importez !

Avez-vous besoin d'aide supplémentaire ? 📦`;
    }

    if (lowerMsg.includes('config') || lowerMsg.includes('boutique')) {
      return `Pour configurer votre boutique :
1. Ouvrez les Paramètres de l'extension
2. Entrez votre token API DropCraft
3. Testez la connexion

Vous trouverez votre token dans votre tableau de bord DropCraft. 🔧`;
    }

    if (lowerMsg.includes('sync') || lowerMsg.includes('prix')) {
      return `Les problèmes de synchronisation peuvent être dus à :
• Token API expiré
• Connexion boutique inactive
• Limite d'API atteinte

Vérifiez vos paramètres et relancez une sync manuelle. 🔄`;
    }

    if (lowerMsg.includes('merci') || lowerMsg.includes('thanks')) {
      return `Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.`;
    }

    return `Je comprends votre demande concernant "${message.substring(0, 30)}...". 

Pour une assistance plus détaillée, je vous suggère de :
• Consulter notre FAQ 📚
• Créer un ticket de support 🎫

Un agent humain pourra vous répondre sous 24h. 🙂`;
  }

  submitTicket(form) {
    const formData = new FormData(form);
    const ticket = {
      id: `DC-${Date.now().toString(36).toUpperCase()}`,
      category: formData.get('category'),
      subject: formData.get('subject'),
      description: formData.get('description'),
      email: formData.get('email'),
      status: 'open',
      createdAt: new Date().toISOString()
    };

    this.tickets.push(ticket);
    this.saveTickets();

    form.reset();
    this.renderTickets();

    this.showToast('✅ Ticket créé avec succès !', 'Nous vous répondrons sous 24h.');
  }

  loadTickets() {
    try {
      const saved = localStorage.getItem('dc_support_tickets');
      this.tickets = saved ? JSON.parse(saved) : [];
    } catch (e) {
      this.tickets = [];
    }
  }

  saveTickets() {
    localStorage.setItem('dc_support_tickets', JSON.stringify(this.tickets));
  }

  renderTickets() {
    const container = this.panel.querySelector('#dc-tickets-list');
    const recentTickets = this.tickets.slice(-3).reverse();

    if (recentTickets.length === 0) {
      container.innerHTML = `
        <div class="dc-support-tickets-title">📋 Mes tickets récents</div>
        <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; text-align: center;">
          Aucun ticket pour le moment
        </p>
      `;
      return;
    }

    container.innerHTML = `
      <div class="dc-support-tickets-title">📋 Mes tickets récents</div>
      ${recentTickets.map(ticket => `
        <div class="dc-support-ticket-item">
          <div class="dc-support-ticket-item-header">
            <span class="dc-support-ticket-id">${ticket.id}</span>
            <span class="dc-support-ticket-status ${ticket.status}">${ticket.status === 'open' ? 'En cours' : 'Résolu'}</span>
          </div>
          <div class="dc-support-ticket-subject">${ticket.subject}</div>
          <div class="dc-support-ticket-date">${new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</div>
        </div>
      `).join('')}
    `;
  }

  setRating(rating) {
    const stars = this.panel.querySelectorAll('.dc-support-star');
    const ratingText = this.panel.querySelector('#dc-rating-text');
    const feedbackForm = this.panel.querySelector('#dc-feedback-form');

    stars.forEach((star, index) => {
      star.classList.toggle('active', index < rating);
    });

    const texts = [
      '',
      '😞 Très déçu',
      '😕 Peut mieux faire',
      '😊 Correct',
      '😃 Très bien',
      '🤩 Excellent !'
    ];

    ratingText.textContent = texts[rating];
    feedbackForm.style.display = 'block';
    feedbackForm.dataset.rating = rating;
  }

  submitFeedback(form) {
    const rating = parseInt(form.dataset.rating) || 0;
    const feedback = form.querySelector('textarea[name="feedback"]').value;

    console.log('Feedback submitted:', { rating, feedback });

    form.reset();
    form.style.display = 'none';
    this.panel.querySelector('#dc-rating-text').textContent = 'Cliquez sur une étoile';
    this.panel.querySelectorAll('.dc-support-star').forEach(star => star.classList.remove('active'));

    this.showToast('⭐ Merci pour votre avis !', 'Votre feedback nous aide à nous améliorer.');
  }

  formatTime(date) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  showToast(title, message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 14px 24px;
      border-radius: 10px;
      font-size: 13px;
      z-index: 999999;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
      animation: dc-toast-in 0.3s ease;
    `;
    toast.innerHTML = `<strong>${title}</strong><br><span style="opacity: 0.9;">${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'dc-toast-out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.panel.classList.add('open');
    this.isOpen = true;
    this.showView('main');
  }

  close() {
    this.panel.classList.remove('open');
    this.isOpen = false;
  }
}

// Initialize
if (!window.DropCraftSupport) {
  window.DropCraftSupport = new DropCraftSupport();
}
