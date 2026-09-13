import { Router } from 'express';
import { scrapeProductUrl, generateFingerprint, inferGarmentType, inferCategory } from '../services/productScraper.js';

const router = Router();

/**
 * POST /api/extract-product
 */
router.post('/extract-product', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required.' });
  }

  try {
    const garment = await scrapeProductUrl(url);
    return res.json({ success: true, garment });
  } catch (err) {
    console.error(`URL extraction fallback for ${url}:`, err.message);

    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.replace('www.', '');
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      const slug = pathSegments[pathSegments.length - 1] || 'clothing-item';
      const cleanName = slug.replace(/[-_]/g, ' ').replace(/\.html?/i, '').replace(/\b\w/g, l => l.toUpperCase());
      const garmentType = inferGarmentType(cleanName);
      const category = inferCategory(cleanName, garmentType);
      const fingerprint = generateFingerprint(url);

      return res.json({
        success: true,
        isFallback: true,
        garment: {
          id: `garment-${fingerprint}`,
          fingerprint,
          name: cleanName,
          garmentType,
          category,
          brand: domain,
          price: null,
          image: null,
          source: 'url_extraction',
          sourceUrl: url,
          domain,
          availableSizes: ['S', 'M', 'L', 'XL'],
          selectedSize: 'M',
          sizeChart: null,
          unit: 'in',
          verified: true,
          extractedAt: new Date().toISOString()
        }
      });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to process product URL.' });
    }
  }
});

/**
 * POST /api/parse-sizechart
 */
router.post('/parse-sizechart', (req, res) => {
  const { ocrText, unit = 'in' } = req.body;

  if (!ocrText) {
    return res.status(400).json({ error: 'OCR text is required.' });
  }

  const lines = ocrText.split('\n').map(l => l.trim()).filter(Boolean);
  const sizeRows = [];
  const knownSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '28', '30', '32', '34', '36', '38'];

  for (const line of lines) {
    const tokens = line.split(/\s+|,|\t/);
    const sizeToken = tokens.find(t => knownSizes.includes(t.toUpperCase()));

    if (sizeToken) {
      const numbers = tokens.map(t => parseFloat(t.replace(/[^\d.]/g, ''))).filter(n => !isNaN(n) && n > 10 && n < 200);
      const entry = { size: sizeToken.toUpperCase() };

      if (numbers.length >= 1) entry.chest = numbers[0];
      if (numbers.length >= 2) entry.waist = numbers[1];
      if (numbers.length >= 3) entry.length = numbers[2];
      if (numbers.length >= 4) entry.hip = numbers[3];

      sizeRows.push(entry);
    }
  }

  return res.json({
    success: true,
    sizeChart: sizeRows,
    unit
  });
});

export default router;
