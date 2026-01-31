// ============================================
// ShopOpti+ Encrypted Storage Module v5.7.2
// Local encryption for sensitive data (tokens, credentials)
// AES-GCM encryption via Web Crypto API
// ============================================

const ShopOptiEncryptedStorage = {
  VERSION: '5.7.2',
  
  // Encryption key derivation from user password or device fingerprint
  async deriveKey(passphrase) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('shopopti_salt_v1'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },
  
  // Generate a device-specific passphrase for automatic encryption
  async getDevicePassphrase() {
    // Use extension ID + user agent as a pseudo-unique device identifier
    const extensionId = chrome?.runtime?.id || 'shopopti_extension';
    const userAgent = navigator.userAgent || '';
    const baseKey = extensionId + '_' + userAgent.substring(0, 50);
    return baseKey;
  },
  
  // Encrypt data
  async encrypt(data, passphrase = null) {
    try {
      const key = await this.deriveKey(passphrase || await this.getDevicePassphrase());
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12)); // GCM recommends 12 bytes
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(JSON.stringify(data))
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (e) {
      console.error('[ShopOpti+ EncryptedStorage] Encryption failed:', e);
      throw new Error('Encryption failed');
    }
  },
  
  // Decrypt data
  async decrypt(encryptedData, passphrase = null) {
    try {
      const key = await this.deriveKey(passphrase || await this.getDevicePassphrase());
      
      // Decode base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (e) {
      console.error('[ShopOpti+ EncryptedStorage] Decryption failed:', e);
      throw new Error('Decryption failed');
    }
  },
  
  // ============================================
  // SECURE STORAGE API
  // ============================================
  
  // Store encrypted value
  async setSecure(key, value) {
    const encrypted = await this.encrypt(value);
    return new Promise((resolve) => {
      chrome.storage.local.set({ [`secure_${key}`]: encrypted }, resolve);
    });
  },
  
  // Get decrypted value
  async getSecure(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([`secure_${key}`], async (result) => {
        const encrypted = result[`secure_${key}`];
        if (!encrypted) {
          resolve(null);
          return;
        }
        
        try {
          const decrypted = await this.decrypt(encrypted);
          resolve(decrypted);
        } catch (e) {
          console.warn('[ShopOpti+ EncryptedStorage] Could not decrypt, returning null');
          resolve(null);
        }
      });
    });
  },
  
  // Remove secure value
  async removeSecure(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([`secure_${key}`], resolve);
    });
  },
  
  // ============================================
  // TOKEN MANAGEMENT (SPECIALIZED)
  // ============================================
  
  async storeToken(token) {
    await this.setSecure('extensionToken', {
      token,
      storedAt: Date.now(),
      encrypted: true
    });
  },
  
  async getToken() {
    const data = await this.getSecure('extensionToken');
    return data?.token || null;
  },
  
  async clearToken() {
    await this.removeSecure('extensionToken');
  },
  
  // ============================================
  // LIGHT MODE (unencrypted, faster)
  // For users who prefer speed over security
  // ============================================
  
  lightModeEnabled: false,
  
  async enableLightMode() {
    this.lightModeEnabled = true;
    return new Promise((resolve) => {
      chrome.storage.local.set({ encryptionMode: 'light' }, resolve);
    });
  },
  
  async enableSecureMode() {
    this.lightModeEnabled = false;
    return new Promise((resolve) => {
      chrome.storage.local.set({ encryptionMode: 'secure' }, resolve);
    });
  },
  
  async loadMode() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['encryptionMode'], (result) => {
        this.lightModeEnabled = result.encryptionMode === 'light';
        resolve(this.lightModeEnabled);
      });
    });
  },
  
  // Unified setter that respects mode
  async set(key, value) {
    await this.loadMode();
    if (this.lightModeEnabled) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
      });
    }
    return this.setSecure(key, value);
  },
  
  // Unified getter that respects mode
  async get(key) {
    await this.loadMode();
    if (this.lightModeEnabled) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => resolve(result[key]));
      });
    }
    return this.getSecure(key);
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShopOptiEncryptedStorage;
}
