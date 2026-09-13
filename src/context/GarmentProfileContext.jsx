import React, { createContext, useContext, useState, useEffect } from 'react';

const WARDROBE_STORAGE_KEY = 'fitroom_garment_wardrobe_v2';
const ACTIVE_GARMENT_KEY = 'fitroom_active_garment_id_v2';

const GarmentProfileContext = createContext(null);

// Start with clean wardrobe: zero mock/preset garments
const INITIAL_WARDROBE = [];

export const GarmentProfileProvider = ({ children }) => {
  const [wardrobe, setWardrobe] = useState(() => {
    try {
      const saved = localStorage.getItem(WARDROBE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any legacy preset IDs
          return parsed.filter(g => g.id !== 'garment-uniqlo-tee-01' && g.id !== 'garment-zara-blazer-02');
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved wardrobe:', e);
    }
    return INITIAL_WARDROBE;
  });

  const [activeGarmentId, setActiveGarmentId] = useState(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_GARMENT_KEY);
      if (savedId) return savedId;
    } catch (e) {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const activeGarment = wardrobe.find(g => g.id === activeGarmentId) || wardrobe[0] || null;

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(wardrobe));
      localStorage.setItem(ACTIVE_GARMENT_KEY, activeGarmentId);
    } catch (e) {
      console.error('Failed to save wardrobe to localStorage:', e);
    }
  }, [wardrobe, activeGarmentId]);

  // Compute a simple hash from string or URL
  const computeFingerprint = (input) => {
    let hash = 0;
    const str = (input || '').trim().toLowerCase();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  };

  /**
   * Import product from URL via backend endpoint
   */
  const importFromUrl = async (url) => {
    setIsLoading(true);
    setDuplicateWarning(null);

    try {
      // 1. Check for duplicate URL in current wardrobe before fetching
      const cleanUrl = url.trim();
      const existing = wardrobe.find(g => 
        (g.sourceUrl && g.sourceUrl.toLowerCase() === cleanUrl.toLowerCase()) ||
        (g.fingerprint && g.fingerprint === computeFingerprint(cleanUrl))
      );

      if (existing) {
        setIsLoading(false);
        setDuplicateWarning({
          type: 'duplicate_url',
          existingGarment: existing,
          message: `Duplicate Product Detected: "${existing.name}" is already in your Wardrobe.`
        });
        setActiveGarmentId(existing.id);
        return { duplicate: true, garment: existing };
      }

      // 2. Fetch from backend endpoint
      const res = await fetch('/api/extract-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await res.json();

      if (data && data.success && data.garment) {
        const newGarment = data.garment;

        // Check if name and brand duplicate
        const nameDuplicate = wardrobe.find(g => 
          g.name.toLowerCase() === newGarment.name.toLowerCase() && g.brand === newGarment.brand
        );

        if (nameDuplicate) {
          setIsLoading(false);
          setDuplicateWarning({
            type: 'duplicate_product',
            existingGarment: nameDuplicate,
            message: `Identical product found in wardrobe: "${nameDuplicate.name}".`
          });
          setActiveGarmentId(nameDuplicate.id);
          return { duplicate: true, garment: nameDuplicate };
        }

        // Add to wardrobe
        setWardrobe(prev => [newGarment, ...prev]);
        setActiveGarmentId(newGarment.id);
        setIsLoading(false);
        return { success: true, garment: newGarment };
      } else {
        throw new Error(data.error || 'Could not parse clothing details from URL.');
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Extraction error:', err);
      throw err;
    }
  };

  /**
   * Import product from manual image upload + optional OCR size chart
   */
  const importFromUpload = ({ name, garmentType, category, image, sizeChart, availableSizes, price, brand }) => {
    setDuplicateWarning(null);

    // Stable fingerprint from image length/name
    const fingerprint = computeFingerprint(`${name}-${image?.substring(0, 50)}`);

    const existing = wardrobe.find(g => g.fingerprint === fingerprint || (g.name.toLowerCase() === name.toLowerCase() && g.image === image));
    if (existing) {
      setDuplicateWarning({
        type: 'duplicate_upload',
        existingGarment: existing,
        message: `Duplicate Image / Garment Detected: "${existing.name}" already exists in your wardrobe.`
      });
      setActiveGarmentId(existing.id);
      return { duplicate: true, garment: existing };
    }

    const newGarment = {
      id: `garment-${fingerprint}-${Date.now()}`,
      fingerprint,
      name: name || `${garmentType || 'Custom'} Item`,
      garmentType: garmentType || 'T-Shirt',
      category: category || 'Top',
      brand: brand || 'Custom Upload',
      price: price || null,
      image: image || null,
      source: 'manual_upload',
      sourceUrl: null,
      availableSizes: availableSizes && availableSizes.length > 0 ? availableSizes : ['S', 'M', 'L', 'XL'],
      selectedSize: availableSizes?.[0] || 'M',
      sizeChart: sizeChart && sizeChart.length > 0 ? sizeChart : null,
      unit: 'in',
      verified: true,
      extractedAt: new Date().toISOString()
    };

    setWardrobe(prev => [newGarment, ...prev]);
    setActiveGarmentId(newGarment.id);
    return { success: true, garment: newGarment };
  };

  /**
   * Select a specific size for active garment
   */
  const setSelectedSize = (size) => {
    setWardrobe(prev =>
      prev.map(g => (g.id === activeGarment.id ? { ...g, selectedSize: size } : g))
    );
  };

  /**
   * Remove garment from wardrobe
   */
  const removeGarment = (id) => {
    if (wardrobe.length <= 1) return;
    const remaining = wardrobe.filter(g => g.id !== id);
    setWardrobe(remaining);
    if (activeGarmentId === id) {
      setActiveGarmentId(remaining[0].id);
    }
  };

  const clearDuplicateWarning = () => {
    setDuplicateWarning(null);
  };

  return (
    <GarmentProfileContext.Provider
      value={{
        wardrobe,
        activeGarment,
        activeGarmentId,
        setActiveGarmentId,
        setSelectedSize,
        importFromUrl,
        importFromUpload,
        removeGarment,
        isLoading,
        duplicateWarning,
        clearDuplicateWarning
      }}
    >
      {children}
    </GarmentProfileContext.Provider>
  );
};

export const useGarmentProfile = () => {
  const context = useContext(GarmentProfileContext);
  if (!context) {
    throw new Error('useGarmentProfile must be used within a GarmentProfileProvider');
  }
  return context;
};
