// ============================================
// ShopOpti+ Logger System v5.7.2
// Configurable logging with levels (prod vs debug)
// Reduces noise and prevents info leakage
// ============================================

const ShopOptiLogger = {
  VERSION: '5.7.2',
  
  // Log levels
  LEVELS: {
    OFF: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
    TRACE: 5
  },
  
  // Current log level (default: INFO in prod, DEBUG in dev)
  currentLevel: 3,
  
  // Whether to include timestamps
  showTimestamps: true,
  
  // Whether to show source location
  showSource: false,
  
  // Prefix for all logs
  prefix: '[ShopOpti+]',
  
  // Storage key for settings
  STORAGE_KEY: 'loggerSettings',
  
  /**
   * Initialize logger with stored settings
   */
  async init() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        const result = await new Promise(resolve => {
          chrome.storage.local.get([this.STORAGE_KEY, 'debugMode'], resolve);
        });
        
        if (result[this.STORAGE_KEY]) {
          const settings = result[this.STORAGE_KEY];
          this.currentLevel = settings.level ?? this.currentLevel;
          this.showTimestamps = settings.showTimestamps ?? this.showTimestamps;
          this.showSource = settings.showSource ?? this.showSource;
        }
        
        // Debug mode overrides to max verbosity
        if (result.debugMode) {
          this.currentLevel = this.LEVELS.TRACE;
          this.showSource = true;
        }
      } catch (e) {
        // Silent fail - use defaults
      }
    }
    
    return this;
  },
  
  /**
   * Set log level
   * @param {number|string} level - Level number or name
   */
  setLevel(level) {
    if (typeof level === 'string') {
      level = this.LEVELS[level.toUpperCase()] ?? this.LEVELS.INFO;
    }
    this.currentLevel = Math.max(0, Math.min(5, level));
    this._saveSettings();
  },
  
  /**
   * Enable debug mode (max verbosity)
   */
  enableDebug() {
    this.currentLevel = this.LEVELS.TRACE;
    this.showSource = true;
    this._saveSettings();
  },
  
  /**
   * Disable debug mode (production level)
   */
  disableDebug() {
    this.currentLevel = this.LEVELS.INFO;
    this.showSource = false;
    this._saveSettings();
  },
  
  /**
   * Save settings to storage
   */
  async _saveSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        await chrome.storage.local.set({
          [this.STORAGE_KEY]: {
            level: this.currentLevel,
            showTimestamps: this.showTimestamps,
            showSource: this.showSource
          }
        });
      } catch (e) {
        // Silent fail
      }
    }
  },
  
  /**
   * Format log message
   */
  _format(level, args) {
    const parts = [this.prefix];
    
    if (this.showTimestamps) {
      const now = new Date();
      const time = now.toTimeString().split(' ')[0];
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      parts.push(`[${time}.${ms}]`);
    }
    
    parts.push(`[${level}]`);
    
    if (this.showSource) {
      try {
        const stack = new Error().stack;
        const lines = stack.split('\n');
        // Find first line that's not from this file
        for (let i = 2; i < lines.length; i++) {
          const line = lines[i];
          if (!line.includes('logger.js')) {
            const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):/);
            if (match) {
              parts.push(`[${match[1]}:${match[3]}]`);
            }
            break;
          }
        }
      } catch (e) {
        // Ignore
      }
    }
    
    return parts.join(' ');
  },
  
  /**
   * Log at ERROR level
   */
  error(...args) {
    if (this.currentLevel >= this.LEVELS.ERROR) {
      console.error(this._format('ERROR', args), ...args);
    }
  },
  
  /**
   * Log at WARN level
   */
  warn(...args) {
    if (this.currentLevel >= this.LEVELS.WARN) {
      console.warn(this._format('WARN', args), ...args);
    }
  },
  
  /**
   * Log at INFO level
   */
  info(...args) {
    if (this.currentLevel >= this.LEVELS.INFO) {
      console.info(this._format('INFO', args), ...args);
    }
  },
  
  /**
   * Log at DEBUG level
   */
  debug(...args) {
    if (this.currentLevel >= this.LEVELS.DEBUG) {
      console.log(this._format('DEBUG', args), ...args);
    }
  },
  
  /**
   * Log at TRACE level (most verbose)
   */
  trace(...args) {
    if (this.currentLevel >= this.LEVELS.TRACE) {
      console.log(this._format('TRACE', args), ...args);
    }
  },
  
  /**
   * Log structured event (always captured, level-filtered for output)
   */
  event(name, data = {}, level = 'INFO') {
    const levelNum = this.LEVELS[level.toUpperCase()] ?? this.LEVELS.INFO;
    if (this.currentLevel >= levelNum) {
      console.log(this._format('EVENT', [name]), { event: name, ...data });
    }
  },
  
  /**
   * Performance timing helper
   */
  time(label) {
    if (this.currentLevel >= this.LEVELS.DEBUG) {
      console.time(`${this.prefix} ${label}`);
    }
  },
  
  timeEnd(label) {
    if (this.currentLevel >= this.LEVELS.DEBUG) {
      console.timeEnd(`${this.prefix} ${label}`);
    }
  },
  
  /**
   * Group logs
   */
  group(label, collapsed = true) {
    if (this.currentLevel >= this.LEVELS.DEBUG) {
      if (collapsed) {
        console.groupCollapsed(`${this.prefix} ${label}`);
      } else {
        console.group(`${this.prefix} ${label}`);
      }
    }
  },
  
  groupEnd() {
    if (this.currentLevel >= this.LEVELS.DEBUG) {
      console.groupEnd();
    }
  },
  
  /**
   * Sanitize sensitive data from logs
   */
  sanitize(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveKeys = ['password', 'token', 'apikey', 'secret', 'authorization', 'cookie', 'session'];
    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
    
    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(s => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }
    
    return sanitized;
  }
};

// Auto-initialize
ShopOptiLogger.init();

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiLogger = ShopOptiLogger;
  // Convenience alias
  window.Logger = ShopOptiLogger;
}
