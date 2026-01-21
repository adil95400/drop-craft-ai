/**
 * Drop Craft AI - Variants Extractor Module
 * Extracts complete product variants (size, color, SKU, price, stock)
 */

class DropCraftVariantsExtractor {
  constructor() {
    this.variants = [];
    this.platform = this.detectPlatform();
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('aliexpress')) return 'aliexpress';
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('temu')) return 'temu';
    if (hostname.includes('ebay')) return 'ebay';
    if (hostname.includes('alibaba') || hostname.includes('1688')) return 'alibaba';
    if (hostname.includes('shein')) return 'shein';
    if (hostname.includes('etsy')) return 'etsy';
    if (hostname.includes('walmart')) return 'walmart';
    return 'unknown';
  }

  async extractVariants() {
    this.variants = [];
    
    switch (this.platform) {
      case 'aliexpress':
        await this.extractAliExpressVariants();
        break;
      case 'amazon':
        await this.extractAmazonVariants();
        break;
      case 'temu':
        await this.extractTemuVariants();
        break;
      case 'shein':
        await this.extractSheinVariants();
        break;
      case 'ebay':
        await this.extractEbayVariants();
        break;
      case 'walmart':
        await this.extractWalmartVariants();
        break;
      default:
        await this.extractGenericVariants();
    }

    return {
      variants: this.variants,
      options: this.groupVariantsByOption(),
      platform: this.platform,
      totalCombinations: this.variants.length
    };
  }

  async extractAliExpressVariants() {
    // Method 1: Extract from page scripts (most reliable)
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent || '';
      
      // Look for skuModule or similar data structures
      if (content.includes('skuModule') || content.includes('productSKUPropertyList')) {
        try {
          // Extract SKU data
          const skuMatch = content.match(/skuModule\s*[:=]\s*(\{[\s\S]*?\})\s*[,;]/);
          if (skuMatch) {
            const skuData = JSON.parse(skuMatch[1]);
            this.parseAliExpressSkuData(skuData);
          }
        } catch (e) {
          console.log('Error parsing AliExpress SKU data:', e);
        }

        // Alternative pattern
        try {
          const propsMatch = content.match(/"productSKUPropertyList"\s*:\s*(\[[\s\S]*?\])/);
          if (propsMatch) {
            const props = JSON.parse(propsMatch[1]);
            this.parseAliExpressPropertyList(props);
          }
        } catch (e) {
          console.log('Error parsing property list:', e);
        }
      }

      // Look for price matrix
      try {
        const priceMatch = content.match(/"skuPriceList"\s*:\s*(\[[\s\S]*?\])/);
        if (priceMatch) {
          const prices = JSON.parse(priceMatch[1]);
          this.mergeAliExpressPrices(prices);
        }
      } catch (e) {}
    }

    // Method 2: Extract from DOM if script parsing failed
    if (this.variants.length === 0) {
      await this.extractAliExpressVariantsFromDOM();
    }
  }

  parseAliExpressSkuData(skuData) {
    if (skuData.productSKUPropertyList) {
      this.parseAliExpressPropertyList(skuData.productSKUPropertyList);
    }

    if (skuData.skuPriceList) {
      this.mergeAliExpressPrices(skuData.skuPriceList);
    }
  }

  parseAliExpressPropertyList(props) {
    // Build option groups
    const optionGroups = props.map(prop => ({
      name: prop.skuPropertyName,
      values: prop.skuPropertyValues.map(val => ({
        id: val.propertyValueId || val.propertyValueIdLong,
        name: val.propertyValueDisplayName || val.propertyValueName,
        image: val.skuPropertyImagePath || null
      }))
    }));

    // Generate all combinations
    this.generateCombinations(optionGroups);
  }

  generateCombinations(optionGroups, current = {}, index = 0) {
    if (index === optionGroups.length) {
      this.variants.push({
        ...current,
        sku: this.generateSku(current),
        available: true
      });
      return;
    }

    const group = optionGroups[index];
    for (const value of group.values) {
      this.generateCombinations(
        optionGroups,
        {
          ...current,
          [group.name]: {
            value: value.name,
            id: value.id,
            image: value.image
          }
        },
        index + 1
      );
    }
  }

  mergeAliExpressPrices(prices) {
    prices.forEach(priceItem => {
      const skuId = priceItem.skuIdStr || priceItem.skuId;
      const variant = this.variants.find(v => v.skuId === skuId);
      if (variant) {
        variant.price = priceItem.skuVal?.actSkuCalPrice || priceItem.skuVal?.skuCalPrice;
        variant.originalPrice = priceItem.skuVal?.skuCalPrice;
        variant.stock = priceItem.skuVal?.availQuantity || 0;
        variant.available = priceItem.skuVal?.availQuantity > 0;
      }
    });
  }

  async extractAliExpressVariantsFromDOM() {
    // Fallback: Extract from visible DOM elements
    const optionContainers = document.querySelectorAll('.sku-property-item, [class*="sku-item"], [class*="property-item"]');
    
    const optionGroups = [];
    let currentGroup = null;

    optionContainers.forEach(container => {
      const titleEl = container.querySelector('.sku-title, [class*="property-title"]');
      const valueEls = container.querySelectorAll('.sku-property-value, [class*="property-value"], [class*="sku-value"]');
      
      if (titleEl && valueEls.length > 0) {
        const groupName = titleEl.textContent.trim().replace(':', '');
        const values = Array.from(valueEls).map(el => ({
          name: el.textContent.trim() || el.title || el.getAttribute('aria-label'),
          image: el.querySelector('img')?.src || null,
          id: el.dataset.skuId || el.dataset.propertyValue
        }));

        optionGroups.push({ name: groupName, values });
      }
    });

    if (optionGroups.length > 0) {
      this.generateCombinations(optionGroups);
    }
  }

  async extractAmazonVariants() {
    // Method 1: Extract from twister data
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent || '';
      
      // Look for twisterController data
      if (content.includes('twister') || content.includes('dimensionToAsinMap')) {
        try {
          const dimensionMatch = content.match(/dimensionToAsinMap\s*[:=]\s*(\{[\s\S]*?\})\s*[,;]/);
          if (dimensionMatch) {
            this.parseAmazonDimensionMap(JSON.parse(dimensionMatch[1]));
          }
        } catch (e) {}

        try {
          const variationMatch = content.match(/variationValues\s*[:=]\s*(\{[\s\S]*?\})/);
          if (variationMatch) {
            this.parseAmazonVariationValues(JSON.parse(variationMatch[1]));
          }
        } catch (e) {}
      }
    }

    // Method 2: Extract from DOM
    if (this.variants.length === 0) {
      await this.extractAmazonVariantsFromDOM();
    }
  }

  parseAmazonDimensionMap(dimensionMap) {
    Object.entries(dimensionMap).forEach(([key, asin]) => {
      const parts = key.split(' ');
      this.variants.push({
        asin: asin,
        options: parts,
        sku: asin,
        available: true
      });
    });
  }

  parseAmazonVariationValues(values) {
    const optionGroups = Object.entries(values).map(([name, vals]) => ({
      name: name,
      values: vals.map(v => ({ name: v, id: v }))
    }));

    if (optionGroups.length > 0) {
      this.generateCombinations(optionGroups);
    }
  }

  async extractAmazonVariantsFromDOM() {
    // Extract from visible variant selectors
    const variantContainers = document.querySelectorAll('#twister .a-row, #variation_color_name, #variation_size_name');
    
    const optionGroups = [];
    
    variantContainers.forEach(container => {
      const labelEl = container.querySelector('.a-form-label, .a-color-base');
      const optionEls = container.querySelectorAll('li[data-defaultasin], option:not([value=""])');
      
      if (labelEl && optionEls.length > 0) {
        const groupName = labelEl.textContent.trim().replace(':', '');
        const values = Array.from(optionEls).map(el => ({
          name: el.title || el.textContent.trim(),
          id: el.dataset.defaultasin || el.value,
          image: el.querySelector('img')?.src
        }));

        if (values.length > 0) {
          optionGroups.push({ name: groupName, values });
        }
      }
    });

    if (optionGroups.length > 0) {
      this.generateCombinations(optionGroups);
    }
  }

  async extractTemuVariants() {
    // Temu uses similar structure to AliExpress
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent || '';
      
      try {
        const skuMatch = content.match(/"skuList"\s*:\s*(\[[\s\S]*?\])/);
        if (skuMatch) {
          const skuList = JSON.parse(skuMatch[1]);
          skuList.forEach(sku => {
            this.variants.push({
              sku: sku.skuId || sku.sku_id,
              price: sku.price || sku.salePrice,
              originalPrice: sku.originalPrice || sku.marketPrice,
              stock: sku.stock || sku.quantity || 0,
              options: sku.specs || sku.specList || [],
              available: (sku.stock || sku.quantity || 0) > 0
            });
          });
        }
      } catch (e) {}
    }

    // Fallback to DOM
    if (this.variants.length === 0) {
      const optionGroups = [];
      const specContainers = document.querySelectorAll('[class*="spec-item"], [class*="sku-item"]');
      
      specContainers.forEach(container => {
        const title = container.querySelector('[class*="spec-title"]')?.textContent?.trim();
        const values = Array.from(container.querySelectorAll('[class*="spec-value"], [class*="option"]')).map(el => ({
          name: el.textContent.trim(),
          id: el.dataset.value
        }));

        if (title && values.length > 0) {
          optionGroups.push({ name: title, values });
        }
      });

      if (optionGroups.length > 0) {
        this.generateCombinations(optionGroups);
      }
    }
  }

  async extractSheinVariants() {
    // Shein specific extraction
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent || '';
      
      try {
        // Look for product info with SKU data
        const productMatch = content.match(/productIntroData\s*[:=]\s*(\{[\s\S]*?\});/);
        if (productMatch) {
          const productData = JSON.parse(productMatch[1]);
          if (productData.attrSizeList) {
            this.parseSheinSizeList(productData.attrSizeList);
          }
          if (productData.colorList) {
            this.parseSheinColorList(productData.colorList);
          }
        }
      } catch (e) {}
    }

    // DOM fallback
    if (this.variants.length === 0) {
      const colorEls = document.querySelectorAll('.product-intro__color-radio, [class*="color-item"]');
      const sizeEls = document.querySelectorAll('.product-intro__size-radio, [class*="size-item"]');

      const colors = Array.from(colorEls).map(el => ({
        name: el.title || el.getAttribute('aria-label'),
        image: el.querySelector('img')?.src,
        id: el.dataset.value
      }));

      const sizes = Array.from(sizeEls).map(el => ({
        name: el.textContent.trim(),
        id: el.dataset.value
      }));

      const optionGroups = [];
      if (colors.length > 0) optionGroups.push({ name: 'Color', values: colors });
      if (sizes.length > 0) optionGroups.push({ name: 'Size', values: sizes });

      if (optionGroups.length > 0) {
        this.generateCombinations(optionGroups);
      }
    }
  }

  parseSheinSizeList(sizeList) {
    // Store sizes for combination
    this.sheinSizes = sizeList.map(s => ({
      name: s.attr_value_name,
      id: s.attr_value_id,
      stock: s.stock
    }));
  }

  parseSheinColorList(colorList) {
    colorList.forEach(color => {
      const sizes = this.sheinSizes || [{ name: 'OneSize', id: 'default' }];
      sizes.forEach(size => {
        this.variants.push({
          sku: `${color.goods_sn || ''}-${size.id}`,
          color: color.goods_color_name,
          colorImage: color.goods_color_image,
          size: size.name,
          price: color.salePrice?.amount,
          originalPrice: color.retailPrice?.amount,
          stock: size.stock || 0,
          available: (size.stock || 0) > 0
        });
      });
    });
  }

  async extractEbayVariants() {
    // eBay variant extraction
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent || '';
      
      try {
        const menuMatch = content.match(/"menuItemMap"\s*:\s*(\{[\s\S]*?\})\s*,/);
        if (menuMatch) {
          this.parseEbayMenuItemMap(JSON.parse(menuMatch[1]));
        }
      } catch (e) {}
    }

    // DOM fallback
    if (this.variants.length === 0) {
      const selectEls = document.querySelectorAll('select[name*="var"], .x-msku__select-box');
      const optionGroups = [];

      selectEls.forEach(select => {
        const label = select.closest('.x-msku__box')?.querySelector('.x-msku__label')?.textContent?.trim();
        const options = Array.from(select.querySelectorAll('option:not([disabled])')).map(opt => ({
          name: opt.textContent.trim(),
          id: opt.value
        }));

        if (label && options.length > 0) {
          optionGroups.push({ name: label, values: options });
        }
      });

      if (optionGroups.length > 0) {
        this.generateCombinations(optionGroups);
      }
    }
  }

  parseEbayMenuItemMap(menuMap) {
    const optionGroups = Object.entries(menuMap).map(([name, items]) => ({
      name: name,
      values: Object.entries(items).map(([id, item]) => ({
        name: item.displayName || item.valueName,
        id: id,
        available: item.available !== false
      }))
    }));

    if (optionGroups.length > 0) {
      this.generateCombinations(optionGroups);
    }
  }

  async extractWalmartVariants() {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent || '';
      
      try {
        if (content.includes('variantCriteria')) {
          const variantMatch = content.match(/"variantCriteria"\s*:\s*(\[[\s\S]*?\])/);
          if (variantMatch) {
            this.parseWalmartVariantCriteria(JSON.parse(variantMatch[1]));
          }
        }
      } catch (e) {}
    }
  }

  parseWalmartVariantCriteria(criteria) {
    const optionGroups = criteria.map(c => ({
      name: c.name,
      values: c.variantList.map(v => ({
        name: v.name,
        id: v.id,
        image: v.image,
        available: v.availabilityStatus === 'AVAILABLE'
      }))
    }));

    if (optionGroups.length > 0) {
      this.generateCombinations(optionGroups);
    }
  }

  async extractGenericVariants() {
    // Generic fallback for unknown platforms
    const selectEls = document.querySelectorAll('select[name*="size"], select[name*="color"], select[name*="variant"]');
    const radioGroups = document.querySelectorAll('[role="radiogroup"], .variant-selector');

    const optionGroups = [];

    // From selects
    selectEls.forEach(select => {
      const label = select.closest('label')?.textContent || select.name || 'Option';
      const options = Array.from(select.querySelectorAll('option:not([disabled])')).map(opt => ({
        name: opt.textContent.trim(),
        id: opt.value
      }));

      if (options.length > 0) {
        optionGroups.push({ name: label.trim(), values: options });
      }
    });

    // From radio buttons
    radioGroups.forEach(group => {
      const label = group.getAttribute('aria-label') || 'Option';
      const options = Array.from(group.querySelectorAll('input[type="radio"]')).map(radio => ({
        name: radio.value || radio.getAttribute('aria-label'),
        id: radio.value
      }));

      if (options.length > 0) {
        optionGroups.push({ name: label, values: options });
      }
    });

    if (optionGroups.length > 0) {
      this.generateCombinations(optionGroups);
    }
  }

  generateSku(variant) {
    const parts = Object.values(variant)
      .filter(v => v && typeof v === 'object' && v.value)
      .map(v => v.value.substring(0, 3).toUpperCase());
    
    return parts.join('-') + '-' + Date.now().toString(36).substring(-4);
  }

  groupVariantsByOption() {
    const options = {};
    
    this.variants.forEach(variant => {
      Object.entries(variant).forEach(([key, value]) => {
        if (typeof value === 'object' && value?.value) {
          if (!options[key]) {
            options[key] = new Set();
          }
          options[key].add(value.value);
        }
      });
    });

    // Convert Sets to Arrays
    return Object.fromEntries(
      Object.entries(options).map(([key, values]) => [key, Array.from(values)])
    );
  }
}

// Make available globally
window.DropCraftVariantsExtractor = DropCraftVariantsExtractor;
