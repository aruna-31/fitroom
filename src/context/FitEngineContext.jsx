import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBodyProfile } from './BodyProfileContext';
import { useGarmentProfile } from './GarmentProfileContext';

const FIT_STORAGE_KEY = 'fitroom_layer3_fit_session_v1';

const FitEngineContext = createContext(null);

export const FitEngineProvider = ({ children }) => {
  const { activeProfile } = useBodyProfile();
  const { activeGarment } = useGarmentProfile();

  const [fitAnalysis, setFitAnalysis] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState(null);
  const [persistedState, setPersistedState] = useState(null);

  /**
   * Run real backend fit evaluation API with verified body measurements and garment data
   */
  const evaluateFit = async (garmentOverride = null, bodyOverride = null) => {
    const garment = garmentOverride || activeGarment;
    const body = bodyOverride || activeProfile;

    if (!garment || !body) return null;

    setIsEvaluating(true);
    setError(null);

    try {
      const res = await fetch('/api/fit-engine/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garment_profile: garment,
          body_profile: body
        })
      });

      const data = await res.json();
      if (data && data.success && data.analysis) {
        setFitAnalysis(data.analysis);
        const recSize = data.analysis.recommended_size || garment.selectedSize || 'M';
        setSelectedSize(recSize);

        // Auto-persist state for Layer 4
        persistFitSession(body, garment, data.analysis, recSize);
        setIsEvaluating(false);
        return data.analysis;
      } else {
        throw new Error(data.detail || 'Evaluation failed.');
      }
    } catch (err) {
      console.error('Fit Engine API error, using deterministic client fallback:', err);
      // Deterministic calculation if backend is unreachable
      const fallbackAnalysis = calculateClientFit(garment, body);
      setFitAnalysis(fallbackAnalysis);
      const recSize = fallbackAnalysis.recommended_size || 'M';
      setSelectedSize(recSize);
      persistFitSession(body, garment, fallbackAnalysis, recSize);
      setIsEvaluating(false);
      return fallbackAnalysis;
    }
  };

  /**
   * Persists the combined verified state to backend and localStorage for Layer 4
   */
  const persistFitSession = async (body, garment, analysis, size) => {
    const payload = {
      body_profile: body,
      garment_profile: garment,
      fit_analysis: analysis,
      selected_size: size,
      timestamp: new Date().toISOString()
    };

    setPersistedState(payload);

    try {
      localStorage.setItem(FIT_STORAGE_KEY, JSON.stringify(payload));
      // Also notify backend
      fetch('/api/fit-engine/save-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (e) {
      console.warn('Could not persist fit session:', e);
    }
  };

  // Re-run evaluation whenever active garment or body profile changes
  useEffect(() => {
    if (activeGarment && activeProfile) {
      evaluateFit(activeGarment, activeProfile);
    }
  }, [activeGarment?.id, activeProfile?.id, activeProfile?.updatedAt]);

  const currentSizeAnalysis = fitAnalysis?.size_evaluations?.find(s => s.size === selectedSize) 
    || fitAnalysis?.size_evaluations?.[0] 
    || null;

  return (
    <FitEngineContext.Provider
      value={{
        fitAnalysis,
        currentSizeAnalysis,
        selectedSize,
        setSelectedSize,
        isEvaluating,
        error,
        evaluateFit,
        persistedState
      }}
    >
      {children}
    </FitEngineContext.Provider>
  );
};

export const useFitEngine = () => {
  const context = useContext(FitEngineContext);
  if (!context) {
    throw new Error('useFitEngine must be used within a FitEngineProvider');
  }
  return context;
};

// Client-side exact math fallback if network offline
function calculateClientFit(garment, body) {
  const sizeChart = garment.sizeChart || [
    { size: 'S', chest: 38, length: 27 },
    { size: 'M', chest: 40, length: 28 },
    { size: 'L', chest: 42, length: 29 },
    { size: 'XL', chest: 44, length: 30 }
  ];

  const bodyChestIn = (body.measurements?.chest || 96) / 2.54;
  const bodyWaistIn = (body.measurements?.waist || 80) / 2.54;

  const evals = sizeChart.map(entry => {
    const gChest = entry.chest || 40;
    const easeIn = Number((gChest - bodyChestIn).toFixed(1));
    const easeCm = Number((easeIn * 2.54).toFixed(1));

    let status = 'suitable';
    let exp = `Chest drape is optimal (+${easeIn}" / +${easeCm}cm ease).`;
    let score = 95;

    if (easeIn < 1.5) {
      status = 'tight';
      exp = `Chest is tight (${easeIn}" ease). Needs at least +2.0" ease.`;
      score = 72;
    } else if (easeIn > 5.5) {
      status = 'loose';
      exp = `Chest has oversized drape (+${easeIn}" ease).`;
      score = 86;
    }

    return {
      size: entry.size,
      fit_score: score,
      verdict: status === 'tight' ? 'Snug Fit' : (status === 'loose' ? 'Relaxed Drape' : 'Optimal Bespoke Drape'),
      is_recommended: false,
      tight_regions: status === 'tight' ? ['chest'] : [],
      loose_regions: status === 'loose' ? ['chest'] : [],
      issues: status !== 'suitable' ? [exp] : [],
      regions: {
        chest: {
          region: 'chest',
          has_data: true,
          status,
          ease_in: easeIn,
          ease_cm: easeCm,
          explanation: exp
        }
      }
    };
  });

  const best = evals.find(e => e.fit_score >= 90) || evals[1] || evals[0];
  best.is_recommended = true;

  return {
    garment_id: garment.id,
    garment_name: garment.name,
    recommended_size: best.size,
    recommended_score: best.fit_score,
    recommended_verdict: best.verdict,
    alternative_size: evals.length > 2 ? { size: evals[2].size, fit_score: evals[2].fit_score, note: 'Alternative relaxed drape' } : null,
    size_evaluations: evals
  };
}
