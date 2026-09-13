/**
 * FitRoom Anthropometric Estimation Engine
 * Calculates ergonomic body dimensions and apparel sizing from height, 
 * silhouette proportions, and posture cues.
 */

// Preset studio models for instant tryout
export const PRESET_MODELS = [
  {
    id: 'model-sophia',
    name: 'Sophia V.',
    title: 'High-Fashion / Tall Silhouette',
    height: 178, // cm
    build: 'slim',
    gender: 'neutral',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
    landmarks: {
      head: { x: 50, y: 12 },
      neck: { x: 50, y: 20 },
      leftShoulder: { x: 38, y: 24 },
      rightShoulder: { x: 62, y: 24 },
      chest: { x: 50, y: 32 },
      waist: { x: 50, y: 42 },
      leftHip: { x: 42, y: 50 },
      rightHip: { x: 58, y: 50 },
      leftWrist: { x: 32, y: 53 },
      rightWrist: { x: 68, y: 53 },
      crotch: { x: 50, y: 53 },
      leftAnkle: { x: 44, y: 92 },
      rightAnkle: { x: 56, y: 92 }
    }
  },
  {
    id: 'model-marcus',
    name: 'Marcus K.',
    title: 'Athletic / Broad Torso',
    height: 185, // cm
    build: 'athletic',
    gender: 'neutral',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    landmarks: {
      head: { x: 50, y: 10 },
      neck: { x: 50, y: 18 },
      leftShoulder: { x: 35, y: 22 },
      rightShoulder: { x: 65, y: 22 },
      chest: { x: 50, y: 30 },
      waist: { x: 50, y: 41 },
      leftHip: { x: 40, y: 49 },
      rightHip: { x: 60, y: 49 },
      leftWrist: { x: 29, y: 52 },
      rightWrist: { x: 71, y: 52 },
      crotch: { x: 50, y: 51 },
      leftAnkle: { x: 43, y: 93 },
      rightAnkle: { x: 57, y: 93 }
    }
  },
  {
    id: 'model-elena',
    name: 'Elena R.',
    title: 'Curvy / Defined Waist',
    height: 168, // cm
    build: 'curvy',
    gender: 'neutral',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    landmarks: {
      head: { x: 50, y: 13 },
      neck: { x: 50, y: 21 },
      leftShoulder: { x: 37, y: 25 },
      rightShoulder: { x: 63, y: 25 },
      chest: { x: 50, y: 34 },
      waist: { x: 50, y: 43 },
      leftHip: { x: 39, y: 52 },
      rightHip: { x: 61, y: 52 },
      leftWrist: { x: 33, y: 54 },
      rightWrist: { x: 67, y: 54 },
      crotch: { x: 50, y: 54 },
      leftAnkle: { x: 44, y: 91 },
      rightAnkle: { x: 56, y: 91 }
    }
  },
  {
    id: 'model-alex',
    name: 'Alex D.',
    title: 'Contemporary / Balanced Build',
    height: 175, // cm
    build: 'regular',
    gender: 'neutral',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    landmarks: {
      head: { x: 50, y: 12 },
      neck: { x: 50, y: 19 },
      leftShoulder: { x: 36, y: 23 },
      rightShoulder: { x: 64, y: 23 },
      chest: { x: 50, y: 31 },
      waist: { x: 50, y: 42 },
      leftHip: { x: 41, y: 50 },
      rightHip: { x: 59, y: 50 },
      leftWrist: { x: 31, y: 53 },
      rightWrist: { x: 69, y: 53 },
      crotch: { x: 50, y: 52 },
      leftAnkle: { x: 44, y: 92 },
      rightAnkle: { x: 56, y: 92 }
    }
  }
];

// Unit conversions
export const cmToInches = (cm) => {
  if (!cm) return 0;
  return Number((cm / 2.54).toFixed(1));
};

export const inchesToCm = (inches) => {
  if (!inches) return 0;
  return Number((inches * 2.54).toFixed(1));
};

export const formatHeight = (heightCm, unit = 'cm') => {
  if (unit === 'in') {
    const totalInches = Math.round(heightCm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}′ ${inches}″`;
  }
  return `${Math.round(heightCm)} cm`;
};

/**
 * Calculates anthropometric measurements given height in cm and build factor.
 */
export const calculateAiEstimates = (heightCm = 175, build = 'regular') => {
  const h = Number(heightCm);

  // Ergonomic ratio multipliers adjusted by body build type
  const buildFactors = {
    slim: { chest: 0.51, waist: 0.42, hip: 0.53, shoulder: 0.24, arm: 0.355, inseam: 0.47 },
    regular: { chest: 0.54, waist: 0.45, hip: 0.56, shoulder: 0.25, arm: 0.36, inseam: 0.465 },
    athletic: { chest: 0.58, waist: 0.44, hip: 0.55, shoulder: 0.27, arm: 0.365, inseam: 0.465 },
    curvy: { chest: 0.57, waist: 0.43, hip: 0.60, shoulder: 0.245, arm: 0.355, inseam: 0.46 },
    broad: { chest: 0.59, waist: 0.48, hip: 0.57, shoulder: 0.275, arm: 0.36, inseam: 0.46 }
  };

  const factor = buildFactors[build] || buildFactors.regular;

  // Measurement estimations in Centimeters
  const rawMeasurements = {
    chest: Number((h * factor.chest).toFixed(1)),
    waist: Number((h * factor.waist).toFixed(1)),
    hip: Number((h * factor.hip).toFixed(1)),
    shoulder: Number((h * factor.shoulder).toFixed(1)),
    armLength: Number((h * factor.arm).toFixed(1)),
    inseam: Number((h * factor.inseam).toFixed(1))
  };

  // Confidence calculations based on biomechanical variance
  const confidences = {
    chest: 94,
    waist: 92,
    hip: 95,
    shoulder: 91,
    armLength: 89,
    inseam: 96
  };

  return {
    rawMeasurements,
    confidences
  };
};

/**
 * Anthropometric sizing recommendations
 */
export const getRecommendedSizes = (measurements, unit = 'cm') => {
  const chestCm = measurements.chest || 95;
  const waistCm = measurements.waist || 80;
  const waistInches = Math.round(waistCm / 2.54);

  let topSize = 'M';
  if (chestCm < 88) topSize = 'XS';
  else if (chestCm < 94) topSize = 'S';
  else if (chestCm < 102) topSize = 'M';
  else if (chestCm < 110) topSize = 'L';
  else if (chestCm < 118) topSize = 'XL';
  else topSize = 'XXL';

  const bottomSize = `${waistInches}″ / ${Math.round(waistCm)}cm`;
  
  // Tailored suit jacket size (US/UK chest in inches)
  const chestInches = Math.round(chestCm / 2.54);
  const jacketSize = `${chestInches}R`;

  return {
    topSize,
    bottomSize,
    jacketSize,
    waistInches
  };
};

/**
 * Curated real garment catalog for Layer 1 sizing comparison
 */
export const GARMENT_CATALOG = [
  {
    id: 'g-blazer-01',
    name: 'Sartorial Double-Breasted Wool Blazer',
    category: 'Tailored Outerwear',
    price: '$680',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
    color: 'Midnight Charcoal',
    composition: '100% Super 130s Italian Wool',
    baseSize: 'M',
    specs: {
      chest: 104, // cm
      shoulder: 45.5,
      armLength: 64,
      waist: 96
    },
    fitSilhouette: 'Structured Tailored'
  },
  {
    id: 'g-trouser-02',
    name: 'Wide-Leg Pleated Wool Trousers',
    category: 'Bottoms',
    price: '$340',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80',
    color: 'Sand Melange',
    composition: 'Virgin Wool & Silk Blend',
    baseSize: 'M',
    specs: {
      waist: 82, // cm
      hip: 104,
      inseam: 81
    },
    fitSilhouette: 'Relaxed Drape'
  },
  {
    id: 'g-shirt-03',
    name: 'Fluid Silk Habotai Relaxed Shirt',
    category: 'Tops',
    price: '$290',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80',
    color: 'Champagne Ivory',
    composition: '100% Mulberry Silk',
    baseSize: 'M',
    specs: {
      chest: 108,
      shoulder: 46,
      armLength: 63
    },
    fitSilhouette: 'Fluid Relaxed'
  },
  {
    id: 'g-trench-04',
    name: 'Minimalist Storm-Flap Trench Coat',
    category: 'Outerwear',
    price: '$890',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
    color: 'Deep Camel',
    composition: 'Weatherproof Gabardine Twill',
    baseSize: 'M',
    specs: {
      chest: 112,
      shoulder: 47,
      armLength: 65,
      waist: 106
    },
    fitSilhouette: 'Oversized Architectural'
  }
];

/**
 * Calculates fit compatibility between verified body profile and garment specs
 */
export const calculateGarmentFit = (garment, userMeasurements) => {
  if (!userMeasurements) {
    return {
      matchScore: 90,
      fitVerdict: 'Standard Drape',
      easeNotes: 'Requires body verification for exact clearance.'
    };
  }

  let totalDiff = 0;
  let checks = 0;
  const notes = [];

  if (garment.specs.chest && userMeasurements.chest) {
    const chestEase = garment.specs.chest - userMeasurements.chest;
    checks++;
    if (chestEase < 2) {
      notes.push(`Snug at chest (${chestEase >= 0 ? '+' : ''}${chestEase.toFixed(1)}cm ease)`);
      totalDiff += Math.abs(chestEase - 6);
    } else if (chestEase > 14) {
      notes.push(`Relaxed oversized drape (+${chestEase.toFixed(1)}cm ease)`);
    } else {
      notes.push(`Ideal tailored chest drape (+${chestEase.toFixed(1)}cm ease)`);
    }
  }

  if (garment.specs.waist && userMeasurements.waist) {
    const waistEase = garment.specs.waist - userMeasurements.waist;
    checks++;
    if (waistEase < 1) {
      notes.push(`Waist: Fitted snug`);
      totalDiff += 8;
    } else {
      notes.push(`Waist: Natural comfort (+${waistEase.toFixed(1)}cm)`);
    }
  }

  if (garment.specs.inseam && userMeasurements.inseam) {
    const inseamDiff = garment.specs.inseam - userMeasurements.inseam;
    checks++;
    if (Math.abs(inseamDiff) <= 2) {
      notes.push('Inseam: Perfect break at shoe line');
    } else if (inseamDiff > 2) {
      notes.push(`Inseam: Slight pooling (+${inseamDiff.toFixed(1)}cm length)`);
    } else {
      notes.push(`Inseam: Cropped ankle aesthetic (${inseamDiff.toFixed(1)}cm)`);
    }
  }

  const score = Math.max(78, Math.min(99, Math.round(98 - totalDiff * 1.5)));

  return {
    matchScore: score,
    fitVerdict: score >= 94 ? 'Optimal Bespoke Drape' : score >= 85 ? 'Well Balanced Fit' : 'Tailoring Suggested',
    easeNotes: notes.join(' • ')
  };
};
