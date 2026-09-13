import * as cheerio from 'cheerio';
import axios from 'axios';
import crypto from 'crypto';

export function inferCategory(title = '', garmentType = '') {
  const text = `${title} ${garmentType}`.toLowerCase();
  if (text.includes('jean') || text.includes('trouser') || text.includes('pant') || text.includes('short') || text.includes('skirt') || text.includes('jogger')) {
    return 'Bottom';
  }
  if (text.includes('blazer') || text.includes('coat') || text.includes('jacket') || text.includes('trench') || text.includes('parka') || text.includes('cardigan')) {
    return 'Outerwear';
  }
  if (text.includes('dress') || text.includes('jumpsuit') || text.includes('romper') || text.includes('gown')) {
    return 'Dress';
  }
  if (text.includes('t-shirt') || text.includes('tee') || text.includes('shirt') || text.includes('top') || text.includes('hoodie') || text.includes('sweater') || text.includes('tank') || text.includes('polo')) {
    return 'Top';
  }
  return 'Top';
}

export function inferGarmentType(title = '') {
  const text = title.toLowerCase();
  if (text.includes('t-shirt') || text.includes('tee')) return 'T-Shirt';
  if (text.includes('hoodie')) return 'Hoodie';
  if (text.includes('sweater') || text.includes('knitwear')) return 'Sweater';
  if (text.includes('shirt') || text.includes('oxford') || text.includes('button-up')) return 'Shirt';
  if (text.includes('blazer')) return 'Blazer';
  if (text.includes('trench') || text.includes('coat')) return 'Coat';
  if (text.includes('jacket')) return 'Jacket';
  if (text.includes('jeans') || text.includes('denim')) return 'Jeans';
  if (text.includes('trousers') || text.includes('pants')) return 'Trousers';
  if (text.includes('dress')) return 'Dress';
  if (text.includes('skirt')) return 'Skirt';
  return 'Apparel';
}

export function generateFingerprint(inputString) {
  return crypto.createHash('sha256').update(inputString.trim().toLowerCase()).digest('hex').substring(0, 16);
}

export async function scrapeProductUrl(url) {
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname.replace('www.', '');

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    timeout: 10000
  });

  const html = response.data;
  const $ = cheerio.load(html);

  let title = '';
  let image = '';
  let brand = domain;
  let price = '';
  let availableSizes = [];
  let sizeChart = [];

  // JSON-LD Parsing
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      const data = json['@graph'] ? json['@graph'].find(item => item['@type'] === 'Product' || item['@type'] === 'IndividualProduct') || json : json;

      if (data && (data['@type'] === 'Product' || data['@type'] === 'IndividualProduct')) {
        if (!title && data.name) title = data.name;
        if (!image && data.image) {
          image = Array.isArray(data.image) ? data.image[0] : (typeof data.image === 'object' ? data.image.url : data.image);
        }
        if (data.brand) {
          brand = typeof data.brand === 'object' ? (data.brand.name || domain) : data.brand;
        }
        if (data.offers) {
          const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
          if (offer.price) price = `${offer.priceCurrency || '$'}${offer.price}`;
        }
      }
    } catch (e) {}
  });

  // OpenGraph fallback
  if (!title) {
    title = $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('h1').first().text().trim() ||
            $('title').text().trim();
  }

  if (!image) {
    image = $('meta[property="og:image"]').attr('content') ||
            $('meta[property="og:image:secure_url"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('link[rel="image_src"]').attr('href') ||
            $('.product-gallery img, .product-image img, main img').first().attr('src');
  }

  if (image && !image.startsWith('http')) {
    image = new URL(image, url).href;
  }

  // Sizes
  const foundSizes = new Set();
  $('select[name*="size"] option, select[id*="size"] option, .size-selector button, .size-options button, [data-size], .variant-size').each((_, el) => {
    const sizeText = $(el).text().trim().toUpperCase();
    if (sizeText && !sizeText.includes('SELECT') && !sizeText.includes('CHOOSE') && sizeText.length <= 6) {
      foundSizes.add(sizeText);
    }
  });

  availableSizes = foundSizes.size > 0 ? Array.from(foundSizes) : ['S', 'M', 'L', 'XL'];

  // Size chart
  $('table').each((_, table) => {
    const tableText = $(table).text().toLowerCase();
    if (tableText.includes('size') || tableText.includes('chest') || tableText.includes('waist') || tableText.includes('bust')) {
      const rows = [];
      $(table).find('tr').each((_, tr) => {
        const cells = [];
        $(tr).find('th, td').each((_, td) => {
          cells.push($(td).text().trim());
        });
        if (cells.length >= 2) rows.push(cells);
      });

      if (rows.length >= 2) {
        const headers = rows[0].map(h => h.toLowerCase());
        const sizeIdx = headers.findIndex(h => h.includes('size'));
        const chestIdx = headers.findIndex(h => h.includes('chest') || h.includes('bust'));
        const waistIdx = headers.findIndex(h => h.includes('waist'));
        const hipIdx = headers.findIndex(h => h.includes('hip'));
        const lengthIdx = headers.findIndex(h => h.includes('length'));

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const sizeVal = sizeIdx >= 0 ? row[sizeIdx] : row[0];
          if (sizeVal && sizeVal.length <= 6) {
            const entry = { size: sizeVal };
            if (chestIdx >= 0 && row[chestIdx]) entry.chest = parseFloat(row[chestIdx].replace(/[^\d.]/g, '')) || row[chestIdx];
            if (waistIdx >= 0 && row[waistIdx]) entry.waist = parseFloat(row[waistIdx].replace(/[^\d.]/g, '')) || row[waistIdx];
            if (hipIdx >= 0 && row[hipIdx]) entry.hip = parseFloat(row[hipIdx].replace(/[^\d.]/g, '')) || row[hipIdx];
            if (lengthIdx >= 0 && row[lengthIdx]) entry.length = parseFloat(row[lengthIdx].replace(/[^\d.]/g, '')) || row[lengthIdx];
            sizeChart.push(entry);
          }
        }
      }
    }
  });

  const garmentType = inferGarmentType(title);
  const category = inferCategory(title, garmentType);
  const fingerprint = generateFingerprint(url);

  return {
    id: `garment-${fingerprint}`,
    fingerprint,
    name: title || 'Extracted Garment',
    garmentType,
    category,
    brand,
    price: price || null,
    image: image || null,
    source: 'url_extraction',
    sourceUrl: url,
    domain,
    availableSizes,
    selectedSize: availableSizes[0] || 'M',
    sizeChart: sizeChart.length > 0 ? sizeChart : null,
    unit: 'in',
    verified: true,
    extractedAt: new Date().toISOString()
  };
}
