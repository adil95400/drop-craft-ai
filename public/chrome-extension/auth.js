document.addEventListener('DOMContentLoaded', async () => {
  const tokenInput = document.getElementById('tokenInput');
  const saveBtn = document.getElementById('saveBtn');
  const messageDiv = document.getElementById('message');
  
  // Load existing token
  const result = await chrome.storage.local.get(['extensionToken']);
  if (result.extensionToken) {
    tokenInput.value = result.extensionToken;
  }
  
  saveBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    
    if (!token) {
      showMessage('Veuillez entrer un token', 'error');
      return;
    }
    
    // Validate token format
    if (!token.startsWith('ext_')) {
      showMessage('Format de token invalide', 'error');
      return;
    }
    
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Vérification...';
      
      // Test the token
      const response = await fetch('https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/extension-sync-realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token
        },
        body: JSON.stringify({
          action: 'sync_status'
        })
      });
      
      if (response.ok) {
        // Save token
        await chrome.storage.local.set({ extensionToken: token });
        showMessage('✓ Token sauvegardé avec succès!', 'success');
        
        // Close after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        const error = await response.json();
        showMessage('Token invalide: ' + (error.error || 'Erreur inconnue'), 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion: ' + error.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Sauvegarder le token';
    }
  });
  
  function showMessage(text, type) {
    messageDiv.className = type;
    messageDiv.textContent = text;
  }
});
