import { createClient } from "npm:@supabase/supabase-js@2"
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'

function detectPlatform(url: string): { platform: string; productId: string | null } {
  const u = url.toLowerCase()
  const m = (patterns: RegExp[]) => { for (const p of patterns) { const r = url.match(p); if (r) return r[1] || null } return null }
  if (u.includes('aliexpress.') || u.includes('ali.ski')) return { platform: 'aliexpress', productId: m([/item\/(\d+)/, /\/(\d+)\.html/, /productId=(\d+)/]) }
  if (u.includes('amazon.')) return { platform: 'amazon', productId: m([/\/dp\/([A-Z0-9]+)/i, /\/gp\/product\/([A-Z0-9]+)/i, /asin=([A-Z0-9]+)/i]) }
  if (u.includes('ebay.')) return { platform: 'ebay', productId: m([/\/itm\/(\d+)/, /item=(\d+)/, /itm\/[^\/]+\/(\d+)/]) }
  if (u.includes('temu.com') || u.includes('share.temu')) return { platform: 'temu', productId: m([/goods\/(\d+)/, /g-(\d+)/]) }
  if (u.includes('wish.com')) return { platform: 'wish', productId: m([/product\/([a-zA-Z0-9]+)/]) }
  if (u.includes('cjdropshipping.com')) return { platform: 'cjdropshipping', productId: m([/product\/([^\/\?]+)/]) }
  if (u.includes('bigbuy.')) return { platform: 'bigbuy', productId: m([/\/([^\/]+)\.html/, /sku=([^&]+)/]) }
  if (u.includes('banggood.com')) return { platform: 'banggood', productId: m([/-p-(\d+)\.html/]) }
  if (u.includes('dhgate.com')) return { platform: 'dhgate', productId: m([/product\/([^\/\.]+)/]) }
  if (u.includes('shein.com') || u.includes('shein.fr')) return { platform: 'shein', productId: m([/-p-(\d+)/]) }
  if (u.includes('etsy.com')) return { platform: 'etsy', productId: m([/listing\/(\d+)/]) }
  if (u.includes('walmart.com')) return { platform: 'walmart', productId: m([/\/ip\/[^\/]+\/(\d+)/]) }
  if (u.includes('cdiscount.com')) return { platform: 'cdiscount', productId: m([/\/dp\/([^\/\?]+)/]) }
  if (u.includes('fnac.com')) return { platform: 'fnac', productId: m([/\/a(\d+)\//]) }
  if (u.includes('rakuten.')) return { platform: 'rakuten', productId: m([/\/product\/(\d+)/]) }
  if ((u.includes('/products/') || u.includes('.myshopify.com')) && !u.includes('amazon') && !u.includes('ebay')) return { platform: 'shopify', productId: m([/\/products\/([^\/\?#]+)/]) }
  if (u.includes('/product/') && !u.includes('amazon') && !u.includes('ebay')) return { platform: 'woocommerce', productId: m([/\/product\/([^\/\?]+)/]) }
  return { platform: 'unknown', productId: null }
}

function canonicalizeAmazonUrl(url: string, asin: string | null): string {
  if (!asin) return url
  try { const u = new URL(url); return `${u.protocol}//${u.host}/dp/${asin}?th=1&psc=1` } catch { return url }
}

function isBlocked(html: string): boolean {
  const h = html.toLowerCase()
  return h.includes('robot check') || h.includes('enter the characters you see below') || h.includes('captcha') || h.includes('automated access')
}

function extractImages(html: string, platform: string, md: string = ''): string[] {
  const imgs: string[] = [], seen = new Set<string>(), seenKeys = new Set<string>()
  const add = (u: string) => {
    if (!u || imgs.length >= 20) return
    let c = u.replace(/\\u002F/g, '/').replace(/\\/g, '')
    if (platform === 'amazon') {
      c = c.replace(/^https?:\/\/images-[a-z0-9-]+\.ssl-images-amazon\.com\//i, 'https://m.media-amazon.com/')
      try { const p = new URL(c); p.search = ''; p.hash = ''; c = p.toString() } catch {}
      c = c.replace(/\._[^.]+_\./g, '.')
      const k = c.match(/\/images\/I\/([^._/]+)/i)?.[1]
      if (k) { if (seenKeys.has(k)) return; seenKeys.add(k) }
      if (/\/images\/[GS]\//i.test(c) || /prime|badge|logo|loading|placeholder|pixel|spacer|nav[_-]|header[_-]/i.test(c)) return
      if (/[._]1x1[._]|[._]SR1,1[._]/i.test(c)) return
    }
    if (!c.startsWith('http') || seen.has(c) || c.includes('icon') || c.includes('sprite')) return
    imgs.push(c); seen.add(c)
  }

  if (platform === 'amazon') {
    const ci = html.match(/colorImages['"]\s*:\s*({[^}]+\[[^\]]+\][^}]*})/s) || html.match(/'colorImages'\s*:\s*({.+?})\s*,\s*'color/s)
    if (ci) { for (const m of ci[1].matchAll(/"hiRes"\s*:\s*"([^"]+)"/g)) add(m[1]); for (const m of ci[1].matchAll(/"large"\s*:\s*"([^"]+)"/g)) add(m[1]) }
    const gd = html.match(/imageGalleryData['"]\s*:\s*\[([^\]]+)\]/s)
    if (gd) for (const m of gd[1].matchAll(/"mainUrl"\s*:\s*"([^"]+)"/g)) add(m[1])
    for (const m of html.matchAll(/data-(?:old-hires|a-dynamic-image)=["']([^"']+)["']/gi)) {
      if (m[1].includes('{')) { try { for (const u of Object.keys(JSON.parse(m[1].replace(/&quot;/g, '"')))) add(u) } catch {} } else add(m[1])
    }
    if (imgs.length < 5) for (const m of html.matchAll(/(https?:\/\/m\.media-amazon\.com\/images\/I\/[^"'\s]+\.(?:jpg|png|webp))/gi)) add(m[1])
    if (imgs.length < 3 && md) for (const m of md.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+media-amazon[^)]+\/images\/I\/[^)]+)\)/gi)) add(m[1])
  } else if (platform === 'aliexpress') {
    const j = html.match(/imagePathList['"]\s*:\s*\[(.*?)\]/s)
    if (j) for (const m of j[1].matchAll(/"(https?:\/\/[^"]+)"/g)) add(m[1].replace(/_\d+x\d+\.[a-z]+$/i, '.jpg'))
    for (const m of html.matchAll(/data-zoom-image="([^"]+)"/gi)) add(m[1])
  } else if (platform === 'shopify') {
    for (const m of html.matchAll(/"(?:featured_image|src|url)"\s*:\s*"(https?:\/\/cdn\.shopify\.com\/[^"]+)"/gi)) add(m[1].replace(/_\d+x(\d+)?\./, '.'))
    for (const m of html.matchAll(/(?:data-src|src)=["'](https?:\/\/cdn\.shopify\.com\/[^"'\s]+)["']/gi)) add(m[1].replace(/_\d+x(\d+)?\./, '.'))
  }
  // Generic fallbacks
  if (imgs.length < 3) {
    for (const m of html.matchAll(/og:image"[^>]*content="([^"]+)"/gi)) if (!m[1].includes('logo')) add(m[1])
    for (const m of html.matchAll(/data-(?:src|original|zoom|large-src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)) add(m[1])
  }
  // JSON-LD images
  const jlds = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const jm of jlds) { try { const d = JSON.parse(jm[1].replace(/<\/?script[^>]*>/gi, '')); if (d.image) { const ia = Array.isArray(d.image) ? d.image : [d.image]; for (const i of ia) add(typeof i === 'string' ? i : i?.url || '') } } catch {} }
  return imgs
}

function extractVideos(html: string, platform: string): string[] {
  const vids: string[] = [], seen = new Set<string>()
  const add = (u: string) => { if (!u || vids.length >= 5) return; const c = String(u).replace(/\\u002F/g, '/').trim(); if (c.startsWith('http') && !seen.has(c)) { vids.push(c); seen.add(c) } }
  for (const m of html.matchAll(/"(?:url|videoUrl|video_url|src|streamingUrl)"[^:]*:\s*"(https?:\/\/[^"]+(?:\.mp4|\.webm|\.m3u8)[^"]*)"/gi)) add(m[1])
  for (const m of html.matchAll(/["'](https?:\/\/[^"']+\.(?:mp4|webm)[^"']*)["']/gi)) if (m[1].includes('video') || m[1].includes('media')) add(m[1])
  return vids
}

function extractVariants(html: string, platform: string, md: string = ''): any[] {
  const vars: any[] = [], seen = new Set<string>()
  const push = (attrs: Record<string, any>, sku?: string) => {
    const k = JSON.stringify({ sku, attrs }); if (seen.has(k)) return; seen.add(k)
    vars.push({ sku: sku || '', name: Object.values(attrs).filter(Boolean).join(' / ') || sku || 'Variante', price: 0, stock: 0, image: null, attributes: attrs })
  }
  if (platform === 'amazon') {
    // asinToDimensionValuesMap
    const findJson = (key: string) => { const i = html.indexOf(`"${key}"`); if (i === -1) return null; const ci = html.indexOf(':', i); if (ci === -1) return null; let j = ci + 1; while (j < html.length && /\s/.test(html[j])) j++; const f = html[j]; if (f !== '{' && f !== '[') return null; const cl = f === '{' ? '}' : ']'; let d = 0, inS = false, esc = false; for (let x = j; x < html.length; x++) { const c = html[x]; if (inS) { if (esc) { esc = false } else if (c === '\\') esc = true; else if (c === '"') inS = false; continue } if (c === '"') { inS = true; continue } if (c === f) d++; if (c === cl) { d--; if (d === 0) { try { return JSON.parse(html.slice(j, x + 1)) } catch { return null } } } } return null }
    const a2d = findJson('asinToDimensionValuesMap'), dvd = findJson('dimensionValuesDisplayData')
    if (a2d && typeof a2d === 'object') { for (const [asin, dim] of Object.entries(a2d as Record<string, any>)) { if (dim && typeof dim === 'object') { const a: Record<string, any> = {}; for (const [k, v] of Object.entries(dim)) a[k] = dvd?.[k]?.[v as any] || v; push(a, asin) } } }
    else {
      const vv = findJson('variationValues')
      if (vv && typeof vv === 'object') for (const [k, vs] of Object.entries(vv as Record<string, any>)) if (Array.isArray(vs)) for (const v of vs) push({ [k]: v })
    }
    if (vars.length === 0) {
      for (const m of html.matchAll(/id="color_name_\d+"[^>]*>[\s\S]{0,800}?alt="([^"]+)"/gis)) push({ color: m[1].trim() })
    }
  } else if (platform === 'aliexpress') {
    const sk = html.match(/skuProducts['"]\s*:\s*(\[[^\]]+\])/s)
    if (sk) try { for (const s of JSON.parse(sk[1].replace(/'/g, '"')).slice(0, 50)) vars.push({ sku: s.skuId || '', name: s.skuAttr || '', price: parseFloat(s.skuVal?.skuAmount?.value || 0), stock: s.skuVal?.availQuantity || 0, image: s.skuVal?.image || null, attributes: {} }) } catch {}
  }
  // Generic option/variant detection
  if (vars.length === 0) {
    for (const m of html.matchAll(/data-(?:variant|option|sku)=["']([^"']+)["'][^>]*>([^<]*)</gi)) if (m[2]?.trim()) push({ option: m[2].trim() }, m[1])
  }
  return vars.slice(0, 100)
}

function extractSpecs(html: string, platform: string): Record<string, string> {
  const s: Record<string, string> = {}
  if (platform === 'amazon') {
    const dt = html.match(/id="productDetails_techSpec_section_1"[^>]*>([\s\S]*?)<\/table>/i) || html.match(/id="technicalSpecifications_section_1"[^>]*>([\s\S]*?)<\/table>/i)
    if (dt) for (const m of dt[1].matchAll(/<th[^>]*>([^<]+)<\/th>\s*<td[^>]*>([^<]+)<\/td>/gi)) { const k = m[1].trim(), v = m[2].trim(); if (k && v) s[k] = v }
  }
  for (const m of html.matchAll(/<tr[^>]*>\s*<t[hd][^>]*>([^<]+)<\/t[hd]>\s*<t[hd][^>]*>([^<]+)<\/t[hd]>/gi)) { const k = m[1].trim().replace(/:$/, ''), v = m[2].trim(); if (k && v && k.length < 50 && v.length < 200) s[k] = v }
  for (const m of html.matchAll(/<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/gi)) { const k = m[1].trim().replace(/:$/, ''), v = m[2].trim(); if (k && v && k.length < 50) s[k] = v }
  return s
}

function extractReviews(html: string, platform: string, md: string = ''): any[] {
  const revs: any[] = []
  if (platform === 'amazon') {
    for (const m of html.matchAll(/id="customer_review-([^"]+)"[\s\S]*?(?=id="customer_review-|$)/gi)) {
      if (revs.length >= 15) break
      const b = m[0]
      const nm = b.match(/a-profile-name[^>]*>([^<]+)/i)?.[1]?.trim() || 'Client'
      const rt = b.match(/(\d+(?:[,.]?\d*)?)\s*(?:out of|sur|\/)\s*5/i) || b.match(/a-star-(\d)/i)
      const ti = b.match(/review-title[^>]*>(?:<span[^>]*>)?([^<]+)/i)?.[1]?.trim() || ''
      const bd = b.match(/review-body[^>]*>[\s\S]*?<span[^>]*>([^<]+)/i)?.[1]?.trim().slice(0, 2000) || ''
      if (bd || ti) revs.push({ customer_name: nm, rating: rt ? Math.min(5, parseFloat(rt[1].replace(',', '.'))) : 5, title: ti, comment: bd, verified_purchase: /v[ée]rifi[ée]|verified/i.test(b), helpful_count: 0, review_date: null, images: [] })
    }
    // Markdown fallback
    if (revs.length === 0 && md) {
      const blocks = md.split(/(?=\d+[.,]\d*\s*(?:out of|sur)\s*5)/gi)
      for (let i = 1; i < blocks.length && revs.length < 10; i++) {
        const rm = blocks[i].match(/^(\d+[.,]?\d*)\s*(?:out of|sur)\s*5/i)
        if (!rm) continue
        const lines = blocks[i].split('\n').map(l => l.trim()).filter(Boolean)
        let title = '', comment = ''
        for (let j = 1; j < lines.length && j < 8; j++) { const l = lines[j]; if (/v[ée]rifi|Reviewed|Signaler|personnes/i.test(l)) continue; if (!title && l.length < 100 && l.length > 3) { title = l; continue }; if (l.length > 20) comment += (comment ? '\n' : '') + l }
        if (comment || title) revs.push({ customer_name: 'Client', rating: Math.min(5, parseFloat(rm[1].replace(',', '.'))), title, comment: comment.slice(0, 2000), verified_purchase: false, helpful_count: 0, review_date: null, images: [] })
      }
    }
  } else if (platform === 'aliexpress') {
    const fb = html.match(/feedbackList['"]\s*:\s*(\[[^\]]+\])/s)
    if (fb) try { for (const f of JSON.parse(fb[1]).slice(0, 15)) revs.push({ customer_name: f.buyerName || 'Client', rating: Math.min(5, f.star || f.rating || 5), title: '', comment: (f.content || f.feedback || '').slice(0, 2000), verified_purchase: true, helpful_count: 0, review_date: null, images: f.images || [] }) } catch {}
  }
  // Schema.org fallback
  if (revs.length === 0) for (const m of html.matchAll(/"@type"\s*:\s*"Review"[\s\S]*?(?="@type"|$)/gi)) {
    if (revs.length >= 10) break
    const au = m[0].match(/"author"[^}]*"name"\s*:\s*"([^"]+)"/i), rv = m[0].match(/"ratingValue"\s*:\s*"?(\d+(?:\.\d+)?)"?/i), rb = m[0].match(/"reviewBody"\s*:\s*"([^"]+)"/i)
    if (rb || rv) revs.push({ customer_name: au?.[1] || 'Client', rating: rv ? Math.min(5, parseFloat(rv[1])) : 5, title: '', comment: (rb?.[1] || '').slice(0, 2000), verified_purchase: false, helpful_count: 0, review_date: null, images: [] })
  }
  return revs
}

function extractTitle(html: string, md: string, platform: string): string {
  if (platform === 'amazon') {
    const t = html.match(/id="productTitle"[^>]*>([^<]+)/i)?.[1]?.trim()
    if (t) return t
  }
  if (platform === 'aliexpress') {
    const t = html.match(/class="product-title[^"]*"[^>]*>([^<]+)/i)?.[1]?.trim()
    if (t) return t
    const at = html.match(/data-pl="product-title"[^>]*>([^<]+)/i)?.[1]?.trim()
    if (at) return at
  }
  // JSON-LD
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) { try { const d = JSON.parse(m[1].replace(/<\/?script[^>]*>/gi, '')); if (d.name) return d.name; if (d['@graph']) for (const i of d['@graph']) if (i.name) return i.name } catch {} }
  const og = html.match(/og:title"[^>]*content="([^"]+)"/i)
  if (og) return og[1].replace(/\s*[-|].*$/, '').trim()
  const ht = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (ht) return ht[1].replace(/\s*[-|].*$/, '').trim()
  // Markdown title extraction (critical for Jina fallback)
  if (md) {
    const mt = md.match(/^#\s+(.+)$/m)
    if (mt && mt[1].length > 5 && mt[1].length < 300) return mt[1].trim()
    // Look for bold title patterns in markdown
    const bt = md.match(/\*\*([^*]{10,200})\*\*/m)
    if (bt) return bt[1].trim()
    // First meaningful line
    const lines = md.split('\n').map(l => l.trim()).filter(l => l.length > 10 && l.length < 300 && !l.startsWith('http') && !l.startsWith('[') && !l.startsWith('!')  && !/^\d+$/.test(l))
    if (lines.length > 0) return lines[0].replace(/^#+\s*/, '').trim()
  }
  return 'Produit importé'
}

function extractPrice(html: string, md: string, platform: string): { price: number; currency: string; originalPrice: number | null } {
  let price = 0, originalPrice: number | null = null, currency = 'EUR'
  const parseMoney = (r: string) => { if (!r) return 0; let c = r.replace(/[^\d,\.]/g, ''); if ((c.match(/,/g) || []).length === 1 && !(c.match(/\./g) || []).length) c = c.replace(',', '.'); else if ((c.match(/,/g) || []).length === 1 && (c.match(/\./g) || []).length >= 1) c = c.replace(/\./g, '').replace(',', '.'); const n = parseFloat(c); return (!isNaN(n) && n > 0 && n < 50000) ? n : 0 }
  if (html.includes('£')) currency = 'GBP'; else if (html.includes('$') && !html.includes('€')) currency = 'USD'

  if (platform === 'amazon') {
    // Core price display
    const cb = html.match(/id="corePrice[^"]*"[\s\S]{0,2000}/i)
    if (cb) { const pm = cb[0].match(/(\d{1,5})[,\.](\d{2})\s*€/) || cb[0].match(/priceToPay[\s\S]*?(\d{1,5})[,\.](\d{2})/); if (pm) { const w = parseInt(pm[1]), f = parseInt(pm[2]); if (w > 0) price = w + f / 100 } }
    if (!price) { const wm = html.match(/a-price-whole[^>]*>(\d+)/i), fm = html.match(/a-price-fraction[^>]*>(\d+)/i); if (wm) { price = parseInt(wm[1]) + (fm ? parseInt(fm[1]) / 100 : 0) } }
    if (!price && md) { const pm = md.match(/\*?\*?(\d{1,4})[,\.](\d{2})\s*€/i); if (pm) price = parseInt(pm[1]) + parseInt(pm[2]) / 100 }
    if (!price) { const mm = html.match(/product:price:amount"[^>]*content="([\d,\.]+)"/i) || html.match(/itemprop="price"[^>]*content="([\d,\.]+)"/i); if (mm) price = parseMoney(mm[1]) }
    if (!price) { const jm = html.match(/"price"\s*:\s*"?(\d+(?:[,\.]\d+)?)"?/i); if (jm) price = parseMoney(jm[1]) }
    // Original price
    const op = html.match(/a-text-price[^>]*>[\s\S]{0,100}?<span[^>]*>([^<]{1,20})/i) || html.match(/a-text-strike[^>]*>([^<]{1,20})/i)
    if (op) { const e = parseMoney(op[1]); if (e > price) originalPrice = e }
  } else {
    const pm = html.match(/product:price:amount"[^>]*content="([\d,.]+)"/i) || html.match(/price[^>]*>[\s]*[€$£]?\s*([\d,.]+)/i)
    if (pm) price = parseMoney(pm[1])
    const cm = html.match(/product:price:currency"[^>]*content="([^"]+)"/i)
    if (cm) currency = cm[1].toUpperCase()
    if (!currency || currency === 'EUR') { if (platform === 'aliexpress') currency = 'USD' }
  }
  return { price, currency, originalPrice }
}

function extractBrand(html: string, md: string, platform: string): string {
  if (platform === 'amazon') {
    const bl = html.match(/id="bylineInfo"[^>]*>([\s\S]*?)<\/a>/i)
    if (bl) { const t = bl[1].replace(/<[^>]+>/g, '').trim().replace(/^Visiter\s*la\s*boutique\s*/i, '').replace(/^Visit\s*the\s*/i, '').replace(/\s*Store$/i, '').replace(/^Marque\s*:\s*/i, '').trim(); if (t.length > 1 && t.length < 80) return t }
    const mr = html.match(/>\s*Marque\s*<\/t[hd]>\s*<td[^>]*>([^<]+)/i) || html.match(/>\s*Brand\s*<\/t[hd]>\s*<td[^>]*>([^<]+)/i)
    if (mr) { const b = mr[1].trim(); if (b.length > 1) return b }
  }
  const gb = html.match(/"brand"\s*:\s*\{\s*"name"\s*:\s*"([^"]+)"/i) || html.match(/"brand"\s*:\s*"([^"]+)"/i)
  if (gb) { const b = gb[1].trim(); if (b.length > 1 && b.length < 80) return b }
  return ''
}

function extractStock(html: string, platform: string): number {
  if (platform === 'amazon') {
    const av = html.match(/id="availability"[\s\S]{0,500}/i)
    if (av) { const qm = av[0].match(/(\d+)\s*(?:exemplaire|left|restant|en stock)/i); if (qm) return parseInt(qm[1]); if (/en\s+stock|in\s+stock|disponible/i.test(av[0])) return 99; if (/indisponible|unavailable|rupture/i.test(av[0])) return 0 }
  }
  const im = html.match(/"inventory"\s*:\s*(\d+)/i) || html.match(/"stock_quantity"\s*:\s*(\d+)/i)
  if (im) return parseInt(im[1])
  if (/in\s*stock|en\s*stock|disponible/i.test(html)) return 99
  return 0
}

function extractCategory(html: string, md: string, platform: string): string {
  if (platform === 'amazon') { const bc = html.match(/id="wayfinding-breadcrumbs[^"]*"([\s\S]{0,3000}?)<\/div>\s*<\/div>/i); if (bc) { const links = bc[1].matchAll(/<a[^>]*>\s*([^<]+)/gi); for (const m of links) { const c = m[1].trim(); if (c.length > 1) return c } } }
  const ot = html.match(/og:product:category"[^>]*content="([^"]+)"/i) || html.match(/"category"\s*:\s*"([^"]+)"/i)
  if (ot) return ot[1].trim()
  return ''
}

function extractTags(html: string, md: string, platform: string): string[] {
  const tags: string[] = []
  if (platform === 'amazon') { const bc = html.match(/id="wayfinding-breadcrumbs[^"]*"([\s\S]{0,3000}?)<\/div>\s*<\/div>/i); if (bc) for (const m of bc[1].matchAll(/<a[^>]*>\s*([^<]+)/gi)) { const t = m[1].trim(); if (t.length > 1 && t.length < 60 && !tags.includes(t)) tags.push(t) } }
  const mk = html.match(/name="keywords"[^>]*content="([^"]+)"/i)
  if (mk) for (const k of mk[1].split(',').map(k => k.trim()).filter(k => k.length > 1 && k.length < 50)) if (!tags.includes(k)) tags.push(k)
  return tags.slice(0, 20)
}

function extractSeo(html: string) {
  return {
    metaTitle: html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || '',
    metaDescription: (html.match(/name="description"[^>]*content="([^"]+)"/i) || html.match(/og:description"[^>]*content="([^"]+)"/i))?.[1]?.trim() || '',
    canonicalUrl: (html.match(/rel="canonical"[^>]*href="([^"]+)"/i) || html.match(/href="([^"]+)"[^>]*rel="canonical"/i))?.[1] || '',
  }
}

function calcQuality(d: any): { score: number; breakdown: Record<string, any> } {
  let s = 0, max = 100
  if (d.title?.length > 10) s += 10; if (d.title?.length > 30) s += 5
  if (d.description?.length > 20) s += 8; if (d.description?.length > 100) s += 7
  const ic = d.images?.length || 0; s += Math.min(20, ic * 4)
  if (d.price > 0) s += 10
  s += Math.min(10, (d.variants?.length || 0) * 3)
  s += Math.min(10, (d.extracted_reviews?.length || 0) * 2)
  if (d.brand) s += 5; if (d.category) s += 5
  return { score: Math.min(100, Math.round(s / max * 100)), breakdown: {} }
}

function calcReviewDist(reviews: any[]) {
  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  if (!reviews?.length) return { distribution: dist, averageRating: 0, totalReviews: 0 }
  let total = 0
  for (const r of reviews) { const rt = Math.min(5, Math.max(1, Math.round(r.rating || 5))); dist[rt]++; total += rt }
  return { distribution: dist, averageRating: Math.round((total / reviews.length) * 10) / 10, totalReviews: reviews.length }
}

async function scrapeShopify(url: string, handle: string | null): Promise<any | null> {
  try {
    const u = new URL(url), base = `${u.protocol}//${u.host}`
    const h = handle || url.match(/\/products\/([^\/\?#]+)/)?.[1]
    if (!h) return null
    const r = await fetch(`${base}/products/${h}.json`, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } })
    if (!r.ok) return null
    const p = (await r.json()).product
    if (!p) return null
    const images = (p.images || []).map((i: any) => (i.src || '').replace(/_\d+x(\d+)?\./, '.').replace(/\?.*$/, '')).filter(Boolean)
    const variants = (p.variants || []).map((v: any) => {
      const attrs: Record<string, string> = {}
      if (v.option1) attrs[p.options?.[0]?.name || 'Option 1'] = v.option1
      if (v.option2) attrs[p.options?.[1]?.name || 'Option 2'] = v.option2
      if (v.option3) attrs[p.options?.[2]?.name || 'Option 3'] = v.option3
      return { sku: v.sku || v.id?.toString() || '', name: v.title || Object.values(attrs).join(' / '), price: parseFloat(v.price) || 0, compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null, stock: v.inventory_quantity ?? (v.available ? 99 : 0), available: v.available ?? true, image: v.featured_image?.src || null, attributes: attrs, variant_id: v.id?.toString() }
    })
    const prices = variants.map((v: any) => v.price).filter((p: number) => p > 0)
    const tagsArray = Array.isArray(p.tags) ? p.tags : typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    return { title: p.title || 'Produit Shopify', description: p.body_html?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '', price: prices.length > 0 ? Math.min(...prices) : 0, original_price: null, currency: 'EUR', sku: p.variants?.[0]?.sku || p.handle || `SHOPIFY-${p.id}`, brand: p.vendor || '', category: p.product_type || '', images, videos: [], variants, specifications: {}, handle: p.handle, product_type: p.product_type || '', tags: tagsArray, vendor: p.vendor || '' }
  } catch { return null }
}

function normalizeAliExpressUrl(url: string, productId: string | null): string {
  if (productId) return `https://www.aliexpress.com/item/${productId}.html`
  return url.replace(/\/\/[a-z]{2}\.aliexpress/i, '//www.aliexpress')
}

async function scrapeProduct(url: string, platform: string, productId?: string | null): Promise<any> {
  const effectiveUrl = platform === 'amazon' ? canonicalizeAmazonUrl(url, productId || null)
    : platform === 'aliexpress' ? normalizeAliExpressUrl(url, productId || null) : url
  if (platform === 'shopify') { const sd = await scrapeShopify(url, productId || null); if (sd) return { source_url: url, platform, scraped_at: new Date().toISOString(), ...sd } }

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
  let html = '', markdown = ''
  const urlsToTry = [effectiveUrl, ...(effectiveUrl !== url ? [url] : [])]

  // Strategy 1: Firecrawl (best for JS-heavy sites)
  if (firecrawlKey) {
    for (const tryUrl of urlsToTry) {
      try {
        const waitMs = platform === 'amazon' ? 8000 : platform === 'aliexpress' ? 10000 : 5000
        const r = await fetch('https://api.firecrawl.dev/v1/scrape', { method: 'POST', headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: tryUrl, formats: ['html', 'markdown', 'rawHtml'], onlyMainContent: false, waitFor: waitMs }) })
        if (r.ok) { const d = await r.json(); const ch = d.data?.rawHtml || d.data?.html || ''; const cm = d.data?.markdown || ''; if (ch.length > 5000 && !isBlocked(ch)) { html = ch; markdown = cm; break } else if (ch.length > html.length) { html = ch; markdown = cm } } else { await r.text() }
      } catch {}
    }
  }

  // Strategy 2: Direct fetch with Chrome UA
  if (!html || html.length < 5000 || isBlocked(html)) {
    for (const tryUrl of urlsToTry) {
      try {
        const r = await fetch(tryUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7', 'Accept-Encoding': 'gzip, deflate, br', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Site': 'none', 'Sec-Ch-Ua': '"Chromium";v="131", "Google Chrome";v="131"', 'Sec-Ch-Ua-Mobile': '?0', 'Sec-Ch-Ua-Platform': '"Windows"', 'Upgrade-Insecure-Requests': '1', 'Cache-Control': 'max-age=0' }, redirect: 'follow' })
        if (r.ok) { const fh = await r.text(); if (fh.length > html.length && !isBlocked(fh)) { html = fh; break } } else { await r.text() }
      } catch {}
    }
  }

  // Strategy 3: Jina Reader fallback for ALL platforms (not just Amazon)
  if (!html || html.length < 5000 || isBlocked(html)) {
    const jinaUrl = effectiveUrl
    try {
      const r = await fetch(`https://r.jina.ai/${jinaUrl}`, { headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' } })
      if (r.ok) { const t = await r.text(); if (t.length > 500) { if (t.length > markdown.length) markdown = t; console.log(`[Jina] Got ${t.length} chars for ${platform}`) } } else { await r.text() }
    } catch {}
  }

  // Strategy 4: For AliExpress, try mobile API endpoint
  if (platform === 'aliexpress' && (!html || html.length < 5000 || isBlocked(html)) && productId) {
    try {
      const mobileUrl = `https://m.aliexpress.com/item/${productId}.html`
      const r = await fetch(mobileUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9' }, redirect: 'follow' })
      if (r.ok) { const mh = await r.text(); if (mh.length > html.length && !isBlocked(mh)) html = mh } else { await r.text() }
    } catch {}
  }

  if ((!html || html.length < 500) && markdown.length > 500) html = markdown
  if (!html || html.length < 500) {
    // Last resort: try to extract from markdown if available
    if (markdown.length > 200) html = markdown
    else throw new Error(`Impossible de récupérer la page (${platform}). Le site bloque probablement les requêtes automatiques. Essayez avec une URL différente ou importez manuellement.`)
  }
  if (isBlocked(html) && markdown.length > 500) { html = markdown }
  if (isBlocked(html) && markdown.length < 500) throw new Error(`Le site ${platform} a bloqué la requête (anti-bot). Réessayez dans quelques minutes.`)

  const priceData = extractPrice(html, markdown, platform)
  const desc = html.match(/og:description"[^>]*content="([^"]+)"/i)?.[1]?.trim()?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').slice(0, 5000) || ''
  const sku = platform === 'amazon' ? (() => { const mp = [/Numéro\s*de\s*modèle[^:]*:\s*<[^>]*>([A-Z0-9][\w-]{2,20})/i, /Model\s*Number[^:]*:\s*<[^>]*>([A-Z0-9][\w-]{2,20})/i]; for (const p of mp) { const m = html.match(p); if (m) return m[1].trim() }; return `AMZ-${productId || Date.now()}` })() : (html.match(/"sku"\s*:\s*"([^"]+)"/i)?.[1] || `IMPORT-${Date.now()}`)
  const images = extractImages(html, platform, markdown)
  const videos = extractVideos(html, platform)
  const variants = extractVariants(html, platform, markdown)
  const specifications = extractSpecs(html, platform)
  const extracted_reviews = extractReviews(html, platform, markdown)
  const ratingMatch = html.match(/(\d+[,.]?\d*)\s*(?:out of|sur|\/)\s*5/i)
  const reviewCountMatch = html.match(/(\d+(?:[,.\s]\d+)?)\s*(?:reviews?|avis|évaluations?)/i)
  const category = extractCategory(html, markdown, platform)
  const tags = extractTags(html, markdown, platform)
  const seo = extractSeo(html)
  const inventory_quantity = extractStock(html, platform)
  const brand = extractBrand(html, markdown, platform)

  const data: any = {
    source_url: url, platform, scraped_at: new Date().toISOString(),
    title: extractTitle(html, markdown, platform),
    description: desc, price: priceData.price, currency: priceData.currency, original_price: priceData.originalPrice,
    sku, brand, images, videos, variants, specifications,
    tags, category, product_type: category, seo,
    inventory_quantity,
    reviews: { rating: ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null, count: reviewCountMatch ? parseInt(reviewCountMatch[1].replace(/[,.\s]/g, '')) : null },
    extracted_reviews,
    review_distribution: calcReviewDist(extracted_reviews),
    quality_score: null, // set below
    shipping: { methods: [], estimated_delivery: null, free_shipping: /free\s*shipping|livraison\s*gratuite/i.test(html) || (platform === 'amazon' && /prime/i.test(html)) },
    seller: { name: platform === 'amazon' ? (html.match(/sellerProfileTriggerId[^>]*>([^<]+)/i)?.[1]?.trim() || 'Amazon') : null, rating: null },
  }
  data.quality_score = calcQuality(data)
  return data
}

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  if (req.method === 'OPTIONS') return handleCorsPreflightSecure(req)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader = req.headers.get('authorization')
    let user_id: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const sb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } })
      const { data: ud, error: ue } = await sb.auth.getUser(token)
      if (!ue && ud?.user?.id) user_id = ud.user.id
    }

    const body = await req.json()
    const { url, action = 'preview', price_multiplier = 1.5 } = body
    if (!url) throw new Error('URL requise')

    const { platform, productId } = detectPlatform(url)
    if (platform === 'unknown') throw new Error('Plateforme non reconnue. Supportées: AliExpress, Amazon, eBay, Temu, Shopify, etc.')

    const productData = await scrapeProduct(url, platform, productId)

    if (action === 'preview') {
      const suggestedPrice = Math.ceil(productData.price * price_multiplier * 100) / 100
      const totalStock = productData.variants?.length > 0 ? productData.variants.reduce((s: number, v: any) => s + (typeof v.stock === 'number' ? v.stock : 0), 0) : (productData.inventory_quantity || 0)
      return new Response(JSON.stringify({ success: true, action: 'preview', data: { ...productData, suggested_price: suggestedPrice, stock_quantity: totalStock, profit_margin: productData.price > 0 ? Math.round(((suggestedPrice - productData.price) / suggestedPrice) * 100) : 0, platform_detected: platform, product_id: productId, has_variants: productData.variants?.length > 0, has_videos: productData.videos?.length > 0, has_reviews: productData.extracted_reviews?.length > 0 } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'import') {
      if (!user_id) return new Response(JSON.stringify({ success: false, error: 'Authentification requise' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
      const ov = body.override_data || {}
      const finalTitle = ov.title || productData.title
      const finalImages = ov.images || productData.images
      const finalVariants = ov.variants || productData.variants
      const suggestedPrice = ov.suggested_price || Math.ceil(productData.price * price_multiplier * 100) / 100
      const costPrice = ov.price || productData.price
      const finalTags = ov.tags || productData.tags || []
      const { data: ins, error: ie } = await admin.from('products').insert({
        user_id, title: finalTitle, description: ov.description || productData.description, price: suggestedPrice, cost_price: costPrice, currency: productData.currency || 'EUR', sku: ov.sku || productData.sku, brand: ov.brand || productData.brand, category: ov.category || productData.category || 'Importé', product_type: productData.product_type || '', tags: finalTags.length > 0 ? finalTags : null, status: ov.status || 'draft', stock_quantity: (() => { if (typeof ov.stock_quantity === 'number') return ov.stock_quantity; if (finalVariants?.length) return finalVariants.reduce((s: number, v: any) => s + (typeof v.stock === 'number' ? v.stock : 0), 0); return productData.inventory_quantity || 0 })(), images: finalImages, image_url: finalImages?.[0] || null, primary_image_url: finalImages?.[0] || null, main_image_url: finalImages?.[0] || null, variants: finalVariants || null, supplier: platform, supplier_url: url, supplier_name: platform, supplier_product_id: productId || null, source_url: url, source_type: platform, vendor: ov.brand || productData.brand || platform, compare_at_price: productData.original_price || null
      }).select().single()
      if (ie) throw ie
      let reviewsImported = 0
      if (productData.extracted_reviews?.length > 0) {
        const { data: ir, error: re } = await admin.from('product_reviews').insert(productData.extracted_reviews.map((r: any) => ({ user_id, product_id: ins.id, author: r.customer_name || 'Client', rating: Math.min(5, Math.max(1, Math.round(r.rating || 5))), text: [r.title, r.comment].filter(Boolean).join('\n\n') || 'Avis importé', verified_purchase: r.verified_purchase || false, helpful_count: r.helpful_count || 0, review_date: r.review_date || null, source_platform: platform, source_url: url, images: r.images?.length > 0 ? r.images : null, external_id: r.source_review_id || null }))).select('id')
        if (!re) reviewsImported = ir?.length || 0
      }
      return new Response(JSON.stringify({ success: true, action: 'imported', data: ins, message: `Produit "${finalTitle}" importé${reviewsImported > 0 ? ` avec ${reviewsImported} avis` : ''}`, summary: { images: finalImages?.length || 0, videos: (ov.videos || productData.videos)?.length || 0, variants: finalVariants?.length || 0, reviews: reviewsImported } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    throw new Error('Action non reconnue')
  } catch (error) {
    console.error('Quick import error:', error)
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
