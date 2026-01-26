/**
 * ShopOpti+ CSV Exporter v5.7.0
 * Export products and import history to CSV
 */

const ShopOptiCSVExporter = {
  VERSION: '5.7.0',

  /**
   * Export products to CSV
   */
  exportProducts(products, options = {}) {
    const {
      filename = `shopopti-export-${new Date().toISOString().split('T')[0]}.csv`,
      includeImages = true,
      includeVariants = true,
      maxImages = 10,
      delimiter = ',',
      encoding = 'utf-8'
    } = options;

    // Define columns
    const columns = [
      'Handle',
      'Title',
      'Body (HTML)',
      'Vendor',
      'Product Category',
      'Tags',
      'Published',
      'Option1 Name',
      'Option1 Value',
      'Option2 Name',
      'Option2 Value',
      'Option3 Name',
      'Option3 Value',
      'Variant SKU',
      'Variant Price',
      'Variant Compare At Price',
      'Variant Inventory Qty',
      'Variant Inventory Policy',
      'Variant Fulfillment Service',
      'Variant Requires Shipping',
      'Variant Taxable',
      'Image Src',
      'Image Position',
      'Image Alt Text',
      'Status',
      'Source URL',
      'Source Platform'
    ];

    const rows = [];
    
    // Add header
    rows.push(columns);

    // Process each product
    products.forEach(product => {
      const handle = this.generateHandle(product.title);
      const variants = product.variants || [{}];
      const images = (product.images || []).slice(0, maxImages);
      
      // Main product row
      const mainRow = [
        handle,
        this.escapeCSV(product.title || ''),
        this.escapeCSV(product.description || product.body_html || ''),
        this.escapeCSV(product.brand || product.vendor || ''),
        this.escapeCSV(product.category || ''),
        this.escapeCSV((product.tags || []).join(', ')),
        'TRUE',
        variants[0]?.option1_name || 'Title',
        variants[0]?.option1_value || 'Default Title',
        variants[0]?.option2_name || '',
        variants[0]?.option2_value || '',
        variants[0]?.option3_name || '',
        variants[0]?.option3_value || '',
        variants[0]?.sku || product.sku || '',
        product.price || variants[0]?.price || 0,
        product.compareAtPrice || product.originalPrice || '',
        product.stock_quantity || variants[0]?.inventory_quantity || '',
        'deny',
        'manual',
        'TRUE',
        'TRUE',
        images[0] || product.image_url || '',
        images[0] ? 1 : '',
        this.escapeCSV(product.title || ''),
        'active',
        product.source_url || product.url || '',
        product.platform || ''
      ];
      rows.push(mainRow);

      // Additional variant rows
      if (includeVariants && variants.length > 1) {
        variants.slice(1).forEach((variant, index) => {
          const variantRow = new Array(columns.length).fill('');
          variantRow[0] = handle;
          variantRow[7] = variant.option1_name || '';
          variantRow[8] = variant.option1_value || variant.title || '';
          variantRow[9] = variant.option2_name || '';
          variantRow[10] = variant.option2_value || '';
          variantRow[11] = variant.option3_name || '';
          variantRow[12] = variant.option3_value || '';
          variantRow[13] = variant.sku || '';
          variantRow[14] = variant.price || product.price || 0;
          variantRow[15] = variant.compare_at_price || '';
          variantRow[16] = variant.inventory_quantity || '';
          variantRow[17] = 'deny';
          variantRow[18] = 'manual';
          variantRow[19] = 'TRUE';
          variantRow[20] = 'TRUE';
          if (variant.image) {
            variantRow[21] = variant.image;
            variantRow[22] = index + 2;
            variantRow[23] = this.escapeCSV(variant.title || product.title || '');
          }
          rows.push(variantRow);
        });
      }

      // Additional image rows
      if (includeImages && images.length > 1) {
        images.slice(1).forEach((img, index) => {
          const imageRow = new Array(columns.length).fill('');
          imageRow[0] = handle;
          imageRow[21] = img;
          imageRow[22] = index + 2;
          imageRow[23] = this.escapeCSV(`${product.title || 'Product'} - Image ${index + 2}`);
          rows.push(imageRow);
        });
      }
    });

    // Convert to CSV string
    const csvContent = rows.map(row => 
      row.map(cell => 
        typeof cell === 'string' && (cell.includes(delimiter) || cell.includes('"') || cell.includes('\n'))
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      ).join(delimiter)
    ).join('\n');

    // Download file
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8');

    return {
      success: true,
      filename,
      rowCount: rows.length - 1, // Exclude header
      productCount: products.length
    };
  },

  /**
   * Export import history to CSV
   */
  exportHistory(history, options = {}) {
    const {
      filename = `shopopti-history-${new Date().toISOString().split('T')[0]}.csv`,
      delimiter = ','
    } = options;

    const columns = [
      'Date',
      'Product Title',
      'Source URL',
      'Platform',
      'Price',
      'Status',
      'Store',
      'SKU',
      'Error'
    ];

    const rows = [columns];

    history.forEach(item => {
      rows.push([
        item.date || item.createdAt || item.imported_at || '',
        this.escapeCSV(item.title || item.productTitle || ''),
        item.url || item.source_url || '',
        item.platform || '',
        item.price || '',
        item.status || 'completed',
        item.store || item.storeName || '',
        item.sku || '',
        this.escapeCSV(item.error || '')
      ]);
    });

    const csvContent = rows.map(row =>
      row.map(cell =>
        typeof cell === 'string' && (cell.includes(delimiter) || cell.includes('"'))
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      ).join(delimiter)
    ).join('\n');

    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8');

    return { success: true, filename, count: history.length };
  },

  /**
   * Generate URL-safe handle from title
   */
  generateHandle(title) {
    if (!title) return `product-${Date.now()}`;
    
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100)
      .replace(/^-|-$/g, '');
  },

  /**
   * Escape CSV special characters
   */
  escapeCSV(str) {
    if (!str) return '';
    return String(str)
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .trim();
  },

  /**
   * Download file to user's computer
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob(['\ufeff' + content], { type: mimeType }); // BOM for Excel compatibility
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  },

  /**
   * Parse CSV content to products array
   */
  parseCSV(csvContent, options = {}) {
    const { delimiter = ',' } = options;
    const lines = csvContent.split(/\r?\n/);
    const headers = this.parseCSVLine(lines[0], delimiter);
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter);
      if (values.length === 0 || values.every(v => !v)) continue;

      const product = {};
      headers.forEach((header, index) => {
        product[header.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')] = values[index] || '';
      });
      products.push(product);
    }

    return products;
  },

  /**
   * Parse single CSV line handling quoted values
   */
  parseCSVLine(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiCSVExporter = ShopOptiCSVExporter;
}
