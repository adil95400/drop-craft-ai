// Utilitaire pour remplacer les console.log par des actions appropriées

export const logAction = (action: string, data?: any) => {
  // En mode développement, on peut garder les logs
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ACTION] ${action}:`, data);
  }
  
  // En production, on peut envoyer à un service de monitoring
  if (process.env.NODE_ENV === 'production') {
    // Ici on pourrait envoyer vers Sentry, LogRocket, etc.
    // pour l'instant on ne fait rien pour éviter le spam
  }
};

export const logError = (error: string | Error, context?: string) => {
  // En mode développement
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR]${context ? ` [${context}]` : ''}:`, error);
  }
  
  // En production, on peut envoyer vers un service d'erreur
  if (process.env.NODE_ENV === 'production') {
    // Ici on pourrait envoyer vers Sentry
    // pour l'instant on ne fait rien
  }
};

export const logWarning = (warning: string, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[WARN]${context ? ` [${context}]` : ''}:`, warning);
  }
};