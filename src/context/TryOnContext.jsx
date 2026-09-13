import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBodyProfile } from './BodyProfileContext';
import { useGarmentProfile } from './GarmentProfileContext';
import { useFitEngine } from './FitEngineContext';

const TRYON_STORAGE_KEY = 'fitroom_layer4_tryon_result_v2';

const TryOnContext = createContext(null);

export const TryOnProvider = ({ children }) => {
  const { activeProfile } = useBodyProfile();
  const { activeGarment } = useGarmentProfile();
  const { selectedSize, fitAnalysis } = useFitEngine();

  const [tryonResult, setTryonResult] = useState(() => {
    try {
      localStorage.removeItem('fitroom_layer4_tryon_result_v1');
      const saved = localStorage.getItem(TRYON_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'segmenting' | 'warping' | 'blending' | 'completed' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeViewMode, setActiveViewMode] = useState('split'); // 'split' | 'side-by-side' | 'drape-only'

  // Persist tryon result to localStorage
  useEffect(() => {
    if (tryonResult) {
      try {
        localStorage.setItem(TRYON_STORAGE_KEY, JSON.stringify(tryonResult));
      } catch (e) {
        console.warn('Could not cache try-on result:', e);
      }
    }
  }, [tryonResult]);

  /**
   * Generates real Virtual Try-On by calling FastAPI backend pipeline
   */
  const generateTryOn = async (overrideSize = null) => {
    if (!activeProfile?.image) {
      setErrorMessage('User full-body photo from Layer 1 is required.');
      return null;
    }
    if (!activeGarment?.image) {
      setErrorMessage('Garment image from Layer 2 is required.');
      return null;
    }

    const targetSize = overrideSize || selectedSize || activeGarment.selectedSize || 'M';

    setStatus('parsing');
    setErrorMessage(null);

    // Progressive real status updates matching neural pipeline
    const t1 = setTimeout(() => setStatus('conditioning'), 800);
    const t2 = setTimeout(() => setStatus('diffusion'), 2500);

    try {
      const payload = {
        person_image: activeProfile.image,
        garment_image: activeGarment.image,
        body_profile: activeProfile,
        garment_profile: activeGarment,
        selected_size: targetSize
      };

      const res = await fetch('/api/tryon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      clearTimeout(t1);
      clearTimeout(t2);

      const data = await res.json();

      if (data && data.success && data.tryon_image_url) {
        setTryonResult(data);
        setStatus('completed');
        return data;
      } else {
        throw new Error(data.detail || 'Virtual try-on generation failed.');
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      console.error('Try-On generation error:', err);
      setErrorMessage(err.message || 'Error running Virtual Try-On pipeline.');
      setStatus('error');
      return null;
    }
  };

  return (
    <TryOnContext.Provider
      value={{
        tryonResult,
        status,
        errorMessage,
        activeViewMode,
        setActiveViewMode,
        generateTryOn
      }}
    >
      {children}
    </TryOnContext.Provider>
  );
};

export const useTryOn = () => {
  const context = useContext(TryOnContext);
  if (!context) {
    throw new Error('useTryOn must be used within a TryOnProvider');
  }
  return context;
};
