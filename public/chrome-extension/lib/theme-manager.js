/**
 * ShopOpti+ Theme Manager v5.7.0
 * Unified design system with dark mode support
 */

const ShopOptiThemeManager = {
  VERSION: '5.7.0',
  
  // Unified design tokens
  themes: {
    light: {
      '--so-bg-primary': '#ffffff',
      '--so-bg-secondary': '#f8fafc',
      '--so-bg-elevated': '#f1f5f9',
      '--so-bg-hover': '#e2e8f0',
      '--so-border': '#e2e8f0',
      '--so-border-light': '#cbd5e1',
      '--so-text': '#1e293b',
      '--so-text-secondary': '#475569',
      '--so-text-muted': '#94a3b8',
      '--so-primary': '#7c3aed',
      '--so-primary-light': '#a78bfa',
      '--so-primary-dark': '#6d28d9',
      '--so-accent': '#06b6d4',
      '--so-success': '#10b981',
      '--so-warning': '#f59e0b',
      '--so-error': '#ef4444',
      '--so-gradient': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      '--so-gradient-accent': 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
      '--so-shadow': '0 4px 20px rgba(0, 0, 0, 0.08)',
      '--so-shadow-elevated': '0 10px 40px rgba(0, 0, 0, 0.12)'
    },
    dark: {
      '--so-bg-primary': '#0c0f1a',
      '--so-bg-secondary': '#151929',
      '--so-bg-elevated': '#1e2438',
      '--so-bg-hover': '#252b40',
      '--so-border': '#2a3148',
      '--so-border-light': '#3b4461',
      '--so-text': '#f1f5f9',
      '--so-text-secondary': '#94a3b8',
      '--so-text-muted': '#64748b',
      '--so-primary': '#8b5cf6',
      '--so-primary-light': '#a78bfa',
      '--so-primary-dark': '#7c3aed',
      '--so-accent': '#06b6d4',
      '--so-success': '#10b981',
      '--so-warning': '#f59e0b',
      '--so-error': '#ef4444',
      '--so-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      '--so-gradient-accent': 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
      '--so-shadow': '0 4px 20px rgba(0, 0, 0, 0.4)',
      '--so-shadow-elevated': '0 10px 40px rgba(0, 0, 0, 0.5)'
    }
  },

  currentTheme: 'dark',
  listeners: [],

  /**
   * Initialize theme manager
   */
  async init() {
    // Load saved preference
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['shopoptiTheme', 'shopoptiCustomColors']);
      this.currentTheme = result.shopoptiTheme || 'dark';
      
      if (result.shopoptiCustomColors) {
        this.applyCustomColors(result.shopoptiCustomColors);
      }
    }
    
    this.applyTheme(this.currentTheme);
    return this;
  },

  /**
   * Apply theme to document
   */
  applyTheme(themeName) {
    const theme = this.themes[themeName] || this.themes.dark;
    const root = document.documentElement;
    
    Object.entries(theme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Add theme class to body
    document.body.classList.remove('so-theme-light', 'so-theme-dark');
    document.body.classList.add(`so-theme-${themeName}`);
    
    this.currentTheme = themeName;
    this.notifyListeners();
    this.savePreference();
  },

  /**
   * Toggle between light and dark
   */
  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    return newTheme;
  },

  /**
   * Apply custom accent colors
   */
  applyCustomColors(colors) {
    const root = document.documentElement;
    
    if (colors.primary) {
      root.style.setProperty('--so-primary', colors.primary);
    }
    if (colors.accent) {
      root.style.setProperty('--so-accent', colors.accent);
    }
  },

  /**
   * Save theme preference
   */
  async savePreference() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ shopoptiTheme: this.currentTheme });
    }
  },

  /**
   * Add theme change listener
   */
  onThemeChange(callback) {
    this.listeners.push(callback);
  },

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(cb => cb(this.currentTheme));
  },

  /**
   * Get current theme
   */
  getTheme() {
    return this.currentTheme;
  },

  /**
   * Create theme toggle button HTML
   */
  createToggleButton() {
    return `
      <button id="themeToggleBtn" class="so-theme-toggle" title="Changer le thème">
        <svg class="so-theme-icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg class="so-theme-icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    `;
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiThemeManager = ShopOptiThemeManager;
}
