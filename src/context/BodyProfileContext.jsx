import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  calculateAiEstimates, 
  cmToInches, 
  inchesToCm 
} from '../services/estimationEngine';

const STORAGE_KEY = 'fitroom_body_profiles_v2';
const ACTIVE_PROFILE_KEY = 'fitroom_active_profile_id_v2';

const BodyProfileContext = createContext(null);

const DEFAULT_INITIAL_PROFILE = {
  id: 'profile-user-main',
  name: 'My Profile',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  unit: 'cm', // 'cm' or 'in'
  height: 170, // in cm
  build: 'regular', // 'slim', 'regular', 'athletic', 'curvy', 'broad'
  fitPreference: 'tailored', // 'slim', 'tailored', 'relaxed', 'oversized'
  image: null,
  isCustomImage: false,
  landmarks: {},
  // Initial measurements generated from default model
  measurements: {
    chest: 92.0,
    waist: 76.0,
    hip: 94.0,
    shoulder: 42.0,
    armLength: 60.0,
    inseam: 78.0
  },
  // Status flags for each measurement: 'ai_estimated' | 'user_verified'
  status: {
    chest: 'ai_estimated',
    waist: 'ai_estimated',
    hip: 'ai_estimated',
    shoulder: 'ai_estimated',
    armLength: 'ai_estimated',
    inseam: 'ai_estimated'
  },
  confidences: {
    chest: 95,
    waist: 95,
    hip: 95,
    shoulder: 95,
    armLength: 95,
    inseam: 95
  },
  originalAiEstimates: {
    chest: 92.0,
    waist: 76.0,
    hip: 94.0,
    shoulder: 42.0,
    armLength: 60.0,
    inseam: 78.0
  }
};

export const BodyProfileProvider = ({ children }) => {
  // Load saved profiles from localStorage
  const [profiles, setProfiles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out preset model photos
          return parsed.map(p => p.isCustomImage ? p : { ...p, image: null, landmarks: {} });
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved profiles from localStorage:', e);
    }
    return [DEFAULT_INITIAL_PROFILE];
  });

  const [activeProfileId, setActiveProfileId] = useState(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (savedId) return savedId;
    } catch (e) {
      // ignore
    }
    return DEFAULT_INITIAL_PROFILE.id;
  });

  const [unit, setUnit] = useState('cm'); // Display unit
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(null); // 'detecting', 'segmenting', 'extracting', 'done'

  // Get active profile object
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || DEFAULT_INITIAL_PROFILE;

  // Persist profiles to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
    } catch (e) {
      console.error('Failed to save profiles to localStorage:', e);
    }
  }, [profiles, activeProfileId]);

  /**
   * Updates a single measurement field and automatically marks it as User Verified
   */
  const updateMeasurement = (field, valueInDisplayUnit, markAsVerified = true) => {
    const valueInCm = unit === 'in' ? inchesToCm(valueInDisplayUnit) : Number(valueInDisplayUnit);

    setProfiles(prevProfiles =>
      prevProfiles.map(p => {
        if (p.id !== activeProfile.id) return p;

        return {
          ...p,
          updatedAt: new Date().toISOString(),
          measurements: {
            ...p.measurements,
            [field]: Number(valueInCm.toFixed(1))
          },
          status: {
            ...p.status,
            [field]: markAsVerified ? 'user_verified' : p.status[field]
          }
        };
      })
    );
  };

  /**
   * Toggles verification state for a measurement field
   */
  const toggleVerificationStatus = (field) => {
    setProfiles(prevProfiles =>
      prevProfiles.map(p => {
        if (p.id !== activeProfile.id) return p;

        const currentStatus = p.status[field];
        const nextStatus = currentStatus === 'user_verified' ? 'ai_estimated' : 'user_verified';

        return {
          ...p,
          updatedAt: new Date().toISOString(),
          status: {
            ...p.status,
            [field]: nextStatus
          }
        };
      })
    );
  };

  /**
   * Verifies all AI-estimated measurements in one click
   */
  const verifyAllMeasurements = () => {
    setProfiles(prevProfiles =>
      prevProfiles.map(p => {
        if (p.id !== activeProfile.id) return p;

        const allVerified = {
          chest: 'user_verified',
          waist: 'user_verified',
          hip: 'user_verified',
          shoulder: 'user_verified',
          armLength: 'user_verified',
          inseam: 'user_verified'
        };

        return {
          ...p,
          updatedAt: new Date().toISOString(),
          status: allVerified
        };
      })
    );
  };

  /**
   * Updates master height and recalculates unverified AI estimations
   */
  const updateHeight = (newHeightInDisplayUnit) => {
    const heightCm = unit === 'in' ? inchesToCm(newHeightInDisplayUnit) : Number(newHeightInDisplayUnit);
    const { rawMeasurements, confidences } = calculateAiEstimates(heightCm, activeProfile.build);

    setProfiles(prevProfiles =>
      prevProfiles.map(p => {
        if (p.id !== activeProfile.id) return p;

        // Keep values for user-verified fields, update unverified AI fields
        const updatedMeasurements = { ...p.measurements };
        const updatedStatus = { ...p.status };

        Object.keys(rawMeasurements).forEach(field => {
          if (updatedStatus[field] !== 'user_verified') {
            updatedMeasurements[field] = rawMeasurements[field];
          }
        });

        return {
          ...p,
          height: Number(heightCm.toFixed(1)),
          updatedAt: new Date().toISOString(),
          measurements: updatedMeasurements,
          originalAiEstimates: rawMeasurements,
          confidences
        };
      })
    );
  };

  /**
   * Updates body build or silhouette persona
   */
  const updateBuild = (buildType) => {
    const { rawMeasurements } = calculateAiEstimates(activeProfile.height, buildType);

    setProfiles(prevProfiles =>
      prevProfiles.map(p => {
        if (p.id !== activeProfile.id) return p;

        const updatedMeasurements = { ...p.measurements };
        Object.keys(rawMeasurements).forEach(field => {
          if (p.status[field] !== 'user_verified') {
            updatedMeasurements[field] = rawMeasurements[field];
          }
        });

        return {
          ...p,
          build: buildType,
          updatedAt: new Date().toISOString(),
          measurements: updatedMeasurements,
          originalAiEstimates: rawMeasurements
        };
      })
    );
  };

  /**
   * Updates fit preference (Slim, Tailored, Relaxed, Oversized)
   */
  const updateFitPreference = (fitPref) => {
    setProfiles(prevProfiles =>
      prevProfiles.map(p =>
        p.id === activeProfile.id
          ? { ...p, fitPreference: fitPref, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  /**
   * Resets all measurements back to initial AI raw scan estimates
   */
  const resetToAiEstimates = () => {
    const { rawMeasurements, confidences } = calculateAiEstimates(activeProfile.height, activeProfile.build);

    setProfiles(prevProfiles =>
      prevProfiles.map(p => {
        if (p.id !== activeProfile.id) return p;

        return {
          ...p,
          updatedAt: new Date().toISOString(),
          measurements: { ...rawMeasurements },
          status: {
            chest: 'ai_estimated',
            waist: 'ai_estimated',
            hip: 'ai_estimated',
            shoulder: 'ai_estimated',
            armLength: 'ai_estimated',
            inseam: 'ai_estimated'
          },
          confidences,
          originalAiEstimates: rawMeasurements
        };
      })
    );
  };

  /**
   * Loads a studio preset model
   */
  const loadPresetModel = (preset) => {
    setIsScanning(true);
    setScanStep('segmenting');

    setTimeout(() => {
      setScanStep('extracting');
      setTimeout(() => {
        const { rawMeasurements, confidences } = calculateAiEstimates(preset.height, preset.build);

        setProfiles(prevProfiles =>
          prevProfiles.map(p => {
            if (p.id !== activeProfile.id) return p;

            return {
              ...p,
              name: `${preset.name}'s Profile`,
              height: preset.height,
              build: preset.build,
              image: preset.image,
              isCustomImage: false,
              landmarks: preset.landmarks,
              measurements: rawMeasurements,
              originalAiEstimates: rawMeasurements,
              confidences,
              status: {
                chest: 'ai_estimated',
                waist: 'ai_estimated',
                hip: 'ai_estimated',
                shoulder: 'ai_estimated',
                armLength: 'ai_estimated',
                inseam: 'ai_estimated'
              },
              updatedAt: new Date().toISOString()
            };
          })
        );
        setIsScanning(false);
        setScanStep(null);
      }, 700);
    }, 800);
  };

  /**
   * Sets custom uploaded full body image and triggers AI scanning telemetry
   */
  const setCustomImage = (imageDataUrl) => {
    setIsScanning(true);
    setScanStep('detecting');

    setTimeout(() => {
      setScanStep('segmenting');
      setTimeout(() => {
        setScanStep('extracting');
        setTimeout(() => {
          const { rawMeasurements, confidences } = calculateAiEstimates(activeProfile.height, activeProfile.build);

          setProfiles(prevProfiles =>
            prevProfiles.map(p => {
              if (p.id !== activeProfile.id) return p;

              return {
                ...p,
                image: imageDataUrl,
                isCustomImage: true,
                measurements: rawMeasurements,
                originalAiEstimates: rawMeasurements,
                confidences,
                status: {
                  chest: 'ai_estimated',
                  waist: 'ai_estimated',
                  hip: 'ai_estimated',
                  shoulder: 'ai_estimated',
                  armLength: 'ai_estimated',
                  inseam: 'ai_estimated'
                },
                updatedAt: new Date().toISOString()
              };
            })
          );
          setIsScanning(false);
          setScanStep(null);
        }, 600);
      }, 700);
    }, 700);
  };

  /**
   * Profile Management (Create, Switch, Export, Import)
   */
  const createNewProfile = (name = 'New Body Profile') => {
    const newProfile = {
      ...DEFAULT_INITIAL_PROFILE,
      id: `profile-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
  };

  const updateProfileName = (newName) => {
    if (!newName) return;
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return { ...p, name: newName, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
  };

  const deleteProfile = (profileId) => {
    if (profiles.length <= 1) return; // Prevent deleting last remaining profile
    const remaining = profiles.filter(p => p.id !== profileId);
    setProfiles(remaining);
    if (activeProfileId === profileId) {
      setActiveProfileId(remaining[0].id);
    }
  };

  const exportProfileJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeProfile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FitRoom_${activeProfile.name.replace(/\s+/g, '_')}_profile.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importProfileJson = (jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      if (imported && imported.measurements && imported.height) {
        const importedWithId = {
          ...imported,
          id: `profile-imp-${Date.now()}`,
          name: imported.name ? `${imported.name} (Imported)` : 'Imported Profile',
          updatedAt: new Date().toISOString()
        };
        setProfiles(prev => [...prev, importedWithId]);
        setActiveProfileId(importedWithId.id);
        return true;
      }
    } catch (e) {
      console.error('Invalid profile JSON:', e);
    }
    return false;
  };

  // Helper value converter for components
  const getDisplayValue = (valInCm) => {
    if (valInCm === undefined || valInCm === null) return 0;
    return unit === 'in' ? cmToInches(valInCm) : Number(valInCm);
  };

  return (
    <BodyProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        activeProfileId,
        setActiveProfileId,
        unit,
        setUnit,
        getDisplayValue,
        updateMeasurement,
        toggleVerificationStatus,
        verifyAllMeasurements,
        updateHeight,
        updateBuild,
        updateFitPreference,
        resetToAiEstimates,
        loadPresetModel,
        setCustomImage,
        createNewProfile,
        updateProfileName,
        deleteProfile,
        exportProfileJson,
        importProfileJson,
        isScanning,
        scanStep
      }}
    >
      {children}
    </BodyProfileContext.Provider>
  );
};

export const useBodyProfile = () => {
  const context = useContext(BodyProfileContext);
  if (!context) {
    throw new Error('useBodyProfile must be used within a BodyProfileProvider');
  }
  return context;
};
