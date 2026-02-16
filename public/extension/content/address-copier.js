/**
 * ShopOpti+ Pro - Address Copier
 * Copie automatique des adresses de livraison pour les commandes
 * Version: 6.0.0
 */

(function() {
  'use strict';

  // Configuration des sélecteurs par plateforme fournisseur
  const SUPPLIER_SELECTORS = {
    aliexpress: {
      name: ['.order-detail-item-content-row', '[data-pl="address-name"]', '.logistics-address .name'],
      address: ['.logistics-address .address', '.order-detail-item-content-row .address-row'],
      phone: ['.logistics-address .phone', '.order-detail-item-content-row .phone'],
      city: ['.logistics-address .city'],
      country: ['.logistics-address .country'],
      zip: ['.logistics-address .zip'],
    },
    cjdropshipping: {
      name: ['input[name="receiverName"]', '.address-name'],
      address: ['input[name="receiverAddress"]', 'textarea[name="address"]'],
      phone: ['input[name="receiverPhone"]', 'input[name="phone"]'],
      city: ['input[name="receiverCity"]', 'input[name="city"]'],
      country: ['select[name="country"]', 'input[name="country"]'],
      zip: ['input[name="receiverZip"]', 'input[name="zipCode"]'],
    },
    alibaba: {
      name: ['.consignee-info .name', '.order-address .name'],
      address: ['.consignee-info .address', '.order-address .detail'],
      phone: ['.consignee-info .phone'],
      city: ['.consignee-info .city'],
      country: ['.consignee-info .country'],
      zip: ['.consignee-info .zip'],
    },
  };

  // Détecte la plateforme actuelle
  function detectPlatform() {
    const host = window.location.hostname;
    if (host.includes('aliexpress')) return 'aliexpress';
    if (host.includes('cjdropshipping')) return 'cjdropshipping';
    if (host.includes('alibaba')) return 'alibaba';
    if (host.includes('1688')) return '1688';
    return null;
  }

  // Crée le bouton flottant de copie
  function createCopyButton() {
    const existingBtn = document.getElementById('shopopti-address-copier');
    if (existingBtn) return existingBtn;

    const btn = document.createElement('button');
    btn.id = 'shopopti-address-copier';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
      <span>Coller adresse ShopOpti</span>
    `;
    btn.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #8B5CF6, #6366F1);
      color: white;
      border: none;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
      transition: all 0.3s ease;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.05)';
      btn.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
    });

    btn.addEventListener('click', handlePasteAddress);

    document.body.appendChild(btn);
    return btn;
  }

  // Récupère l'adresse stockée
  async function getStoredAddress() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['pending_shipping_address'], (result) => {
        resolve(result.pending_shipping_address || null);
      });
    });
  }

  // Sauvegarde une adresse pour le copier/coller
  async function saveAddressForPaste(address) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ pending_shipping_address: address }, () => {
        resolve(true);
      });
    });
  }

  // Remplit un champ input
  function fillInput(selectors, value, platform) {
    if (!value) return false;
    
    const platformSelectors = SUPPLIER_SELECTORS[platform];
    if (!platformSelectors) return false;

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        if (element.tagName === 'SELECT') {
          // Pour les selects, cherche l'option correspondante
          const options = element.querySelectorAll('option');
          for (const option of options) {
            if (option.text.toLowerCase().includes(value.toLowerCase()) ||
                option.value.toLowerCase().includes(value.toLowerCase())) {
              element.value = option.value;
              element.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
        } else {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
    }
    return false;
  }

  // Colle l'adresse dans les champs
  async function handlePasteAddress() {
    const address = await getStoredAddress();
    
    if (!address) {
      showNotification('Aucune adresse en attente', 'warning');
      return;
    }

    const platform = detectPlatform();
    if (!platform || !SUPPLIER_SELECTORS[platform]) {
      showNotification('Plateforme non supportée pour le collage automatique', 'error');
      return;
    }

    const selectors = SUPPLIER_SELECTORS[platform];
    let filledCount = 0;

    // Remplit chaque champ
    if (fillInput(selectors.name || [], address.name, platform)) filledCount++;
    if (fillInput(selectors.address || [], address.address, platform)) filledCount++;
    if (fillInput(selectors.phone || [], address.phone, platform)) filledCount++;
    if (fillInput(selectors.city || [], address.city, platform)) filledCount++;
    if (fillInput(selectors.country || [], address.country, platform)) filledCount++;
    if (fillInput(selectors.zip || [], address.zipCode || address.zip, platform)) filledCount++;

    if (filledCount > 0) {
      showNotification(`${filledCount} champs remplis automatiquement`, 'success');
      // Nettoie l'adresse stockée après utilisation
      chrome.storage.local.remove(['pending_shipping_address']);
    } else {
      showNotification('Impossible de remplir les champs - Vérifiez manuellement', 'warning');
    }
  }

  // Affiche une notification
  function showNotification(message, type = 'info') {
    const existing = document.getElementById('shopopti-notification');
    if (existing) existing.remove();

    const colors = {
      success: { bg: '#10B981', border: '#059669' },
      error: { bg: '#EF4444', border: '#DC2626' },
      warning: { bg: '#F59E0B', border: '#D97706' },
      info: { bg: '#3B82F6', border: '#2563EB' },
    };

    const color = colors[type] || colors.info;

    const notification = document.createElement('div');
    notification.id = 'shopopti-notification';
    notification.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
        ${type === 'success' 
          ? '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
          : type === 'error'
          ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
          : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
        }
      </svg>
      <span>${message}</span>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999999;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      background: ${color.bg};
      color: white;
      border-radius: 10px;
      border: 2px solid ${color.border};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;

    // Animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Écoute les messages de l'extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'paste_address') {
      saveAddressForPaste(message.address).then(() => {
        handlePasteAddress();
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.action === 'show_address_button') {
      createCopyButton();
      sendResponse({ success: true });
    }
  });

  // Vérifie si on est sur une page de commande fournisseur
  function checkIfOrderPage() {
    const platform = detectPlatform();
    if (!platform) return false;

    const url = window.location.href.toLowerCase();
    const orderKeywords = ['order', 'checkout', 'payment', 'confirm', 'place-order', 'shipping'];
    
    return orderKeywords.some(keyword => url.includes(keyword));
  }

  // Initialisation
  async function init() {
    const platform = detectPlatform();
    if (!platform) return;

    // Affiche le bouton si on est sur une page de commande et qu'une adresse est en attente
    if (checkIfOrderPage()) {
      const address = await getStoredAddress();
      if (address) {
        createCopyButton();
      }
    }
  }

  // Lance l'initialisation quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-vérifie lors des changements d'URL (SPA)
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(init, 1000);
    }
  }).observe(document.body, { childList: true, subtree: true });

})();
