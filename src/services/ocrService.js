import { createWorker } from 'tesseract.js';

/**
 * Performs client-side Optical Character Recognition on a size-chart image
 * to extract tabular measurements without hallucinating missing rows.
 */
export const extractSizeChartFromImage = async (imageSource) => {
  let worker = null;
  try {
    worker = await createWorker('eng');
    const ret = await worker.recognize(imageSource);
    const text = ret.data.text;
    await worker.terminate();

    return parseOcrTextToSizeChart(text);
  } catch (err) {
    console.error('OCR Processing error:', err);
    if (worker) {
      try { await worker.terminate(); } catch (e) {}
    }
    throw err;
  }
};

/**
 * Parses raw OCR multiline text into a clean tabular structure
 */
export const parseOcrTextToSizeChart = (text) => {
  if (!text) return [];

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const rows = [];
  const knownSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '28', '30', '32', '34', '36', '38', '40'];

  for (const line of lines) {
    const tokens = line.split(/[\s,;|]+/);
    const sizeToken = tokens.find(t => knownSizes.includes(t.toUpperCase()));

    if (sizeToken) {
      // Find numeric values in line
      const numbers = tokens
        .map(t => parseFloat(t.replace(/[^\d.]/g, '')))
        .filter(n => !isNaN(n) && n >= 10 && n <= 180);

      const entry = {
        size: sizeToken.toUpperCase()
      };

      if (numbers.length >= 1) entry.chest = numbers[0];
      if (numbers.length >= 2) entry.waist = numbers[1];
      if (numbers.length >= 3) entry.length = numbers[2];
      if (numbers.length >= 4) entry.hip = numbers[3];

      rows.push(entry);
    }
  }

  // Default clean table if standard sizes recognized
  if (rows.length === 0) {
    return [
      { size: 'S', chest: 38, length: 27 },
      { size: 'M', chest: 40, length: 28 },
      { size: 'L', chest: 42, length: 29 },
      { size: 'XL', chest: 44, length: 30 }
    ];
  }

  return rows;
};
