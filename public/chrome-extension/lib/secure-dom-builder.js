// ============================================================================
// SHOPOPTI+ - SECURE DOM BUILDER v1.0.0
// Safe DOM construction utilities to prevent XSS vulnerabilities
// ============================================================================

;(function() {
  'use strict';

  /**
   * SecureDOMBuilder - Creates DOM elements safely without innerHTML
   */
  const SecureDOMBuilder = {
    /**
     * Create an element with properties and children
     * @param {string} tag - HTML tag name
     * @param {Object} props - Properties (className, id, style, etc.)
     * @param {...(Node|string)} children - Child nodes or text
     * @returns {HTMLElement}
     */
    create(tag, props = {}, ...children) {
      const element = document.createElement(tag);

      // Apply properties
      Object.entries(props).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else if (key === 'dataset' && typeof value === 'object') {
          Object.entries(value).forEach(([dataKey, dataValue]) => {
            element.dataset[dataKey] = dataValue;
          });
        } else if (key === 'events' && typeof value === 'object') {
          Object.entries(value).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
          });
        } else if (key.startsWith('on') && typeof value === 'function') {
          const eventName = key.slice(2).toLowerCase();
          element.addEventListener(eventName, value);
        } else if (key === 'htmlFor') {
          element.htmlFor = value;
        } else {
          element.setAttribute(key, value);
        }
      });

      // Add children
      children.flat().forEach(child => {
        if (child instanceof Node) {
          element.appendChild(child);
        } else if (child !== null && child !== undefined) {
          element.appendChild(document.createTextNode(String(child)));
        }
      });

      return element;
    },

    /**
     * Create a text node
     * @param {string} text
     * @returns {Text}
     */
    text(text) {
      return document.createTextNode(String(text || ''));
    },

    /**
     * Create a fragment with children
     * @param {...Node} children
     * @returns {DocumentFragment}
     */
    fragment(...children) {
      const frag = document.createDocumentFragment();
      children.flat().forEach(child => {
        if (child instanceof Node) {
          frag.appendChild(child);
        } else if (child !== null && child !== undefined) {
          frag.appendChild(document.createTextNode(String(child)));
        }
      });
      return frag;
    },

    /**
     * Create a styled button
     * @param {string} text
     * @param {string} className
     * @param {Function} onClick
     * @returns {HTMLButtonElement}
     */
    button(text, className, onClick) {
      return this.create('button', {
        className,
        events: { click: onClick }
      }, text);
    },

    /**
     * Create an icon + text span
     * @param {string} icon - Emoji or icon character
     * @param {string} text
     * @returns {HTMLSpanElement}
     */
    iconText(icon, text) {
      return this.create('span', {},
        this.create('span', { style: { marginRight: '4px' } }, icon),
        text
      );
    },

    /**
     * Create a toast notification element
     * @param {string} message
     * @param {'success'|'error'|'info'} type
     * @returns {HTMLDivElement}
     */
    toast(message, type = 'info') {
      const icons = { success: '✓', error: '✕', info: 'ℹ' };
      return this.create('div', { className: `shopopti-toast ${type}` },
        this.create('span', {}, icons[type] || 'ℹ'),
        this.create('span', {}, message)
      );
    },

    /**
     * Create a loading spinner
     * @returns {HTMLDivElement}
     */
    spinner() {
      return this.create('div', { className: 'shopopti-spinner' });
    },

    /**
     * Create a progress bar
     * @param {number} percent - 0-100
     * @returns {HTMLDivElement}
     */
    progressBar(percent) {
      return this.create('div', { className: 'shopopti-progress-bar' },
        this.create('div', {
          className: 'shopopti-progress-fill',
          style: { width: `${Math.min(100, Math.max(0, percent))}%` }
        })
      );
    },

    /**
     * Create a badge element
     * @param {string|number} value
     * @param {string} className
     * @returns {HTMLSpanElement}
     */
    badge(value, className = '') {
      return this.create('span', { className: `shopopti-badge ${className}` }, String(value));
    },

    /**
     * Create an image with error handling
     * @param {string} src
     * @param {string} alt
     * @param {string} className
     * @returns {HTMLImageElement}
     */
    image(src, alt = '', className = '') {
      const img = this.create('img', {
        src,
        alt,
        className,
        events: {
          error: (e) => e.target.style.display = 'none'
        }
      });
      return img;
    },

    /**
     * Create a modal overlay
     * @param {string} id
     * @param {HTMLElement} content
     * @returns {HTMLDivElement}
     */
    modal(id, content) {
      const overlay = this.create('div', {
        className: 'shopopti-modal-overlay',
        id
      });
      const modal = this.create('div', { className: 'shopopti-modal' });
      modal.appendChild(content);
      overlay.appendChild(modal);
      return overlay;
    },

    /**
     * Create a card element
     * @param {Object} props
     * @param {...Node} children
     * @returns {HTMLDivElement}
     */
    card(props = {}, ...children) {
      return this.create('div', {
        className: `shopopti-card ${props.className || ''}`,
        ...props
      }, ...children);
    },

    /**
     * Create a data grid (3 columns)
     * @param {Array<{value: string|number, label: string}>} items
     * @returns {HTMLDivElement}
     */
    dataGrid(items) {
      return this.create('div', { className: 'dc-data-grid' },
        ...items.map(item => 
          this.create('div', { className: 'dc-data-card' },
            this.create('div', { className: 'dc-data-value' }, String(item.value)),
            this.create('div', { className: 'dc-data-label' }, item.label)
          )
        )
      );
    },

    /**
     * Create a list of items
     * @param {Array<string>} items
     * @param {string} className
     * @returns {HTMLUListElement}
     */
    list(items, className = '') {
      return this.create('ul', { className },
        ...items.map(item => this.create('li', {}, item))
      );
    },

    /**
     * Clear all children from an element
     * @param {HTMLElement} element
     */
    clear(element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    },

    /**
     * Replace content of an element safely
     * @param {HTMLElement} element
     * @param {...Node} children
     */
    replaceContent(element, ...children) {
      this.clear(element);
      children.flat().forEach(child => {
        if (child instanceof Node) {
          element.appendChild(child);
        } else if (child !== null && child !== undefined) {
          element.appendChild(document.createTextNode(String(child)));
        }
      });
    }
  };

  // Shorthand aliases
  const $ = SecureDOMBuilder.create.bind(SecureDOMBuilder);
  const $text = SecureDOMBuilder.text.bind(SecureDOMBuilder);
  const $frag = SecureDOMBuilder.fragment.bind(SecureDOMBuilder);

  // Export
  if (typeof window !== 'undefined') {
    window.SecureDOMBuilder = SecureDOMBuilder;
    window.ShopOptiDOM = SecureDOMBuilder;
    window.$ = $;
    window.$text = $text;
    window.$frag = $frag;
  }

  console.log('[ShopOpti+] SecureDOMBuilder v1.0.0 loaded');
})();
