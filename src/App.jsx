import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BodyProfileProvider, useBodyProfile } from './context/BodyProfileContext';
import { GarmentProfileProvider, useGarmentProfile } from './context/GarmentProfileContext';
import { FitEngineProvider, useFitEngine } from './context/FitEngineContext';
import { TryOnProvider, useTryOn } from './context/TryOnContext';
import { FloatingGarments } from './components/common/FloatingGarments';
import { BrandSplashScreen } from './components/common/BrandSplashScreen';
import { AuthGateway } from './components/auth/AuthGateway';
import { ProfileCreationFlow } from './components/auth/ProfileCreationFlow';
import { Header } from './components/Header';
import { BodyImageDropzone } from './components/scanner/BodyImageDropzone';
import { MeasurementMatrix } from './components/measurements/MeasurementMatrix';
import { VerifiedProfileSummary } from './components/profile/VerifiedProfileSummary';
import { Layer2GarmentView } from './components/garment-importer/Layer2GarmentView';
import { Layer3FitEngineView } from './components/fit-engine/Layer3FitEngineView';
import { Layer4VirtualTryonView } from './components/tryon/Layer4VirtualTryonView';
import { Layer5FinalExperienceView } from './components/experience/Layer5FinalExperienceView';
import { ProfileModal } from './components/profile/ProfileModal';
import { Toast } from './components/ui/Toast';
import { 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  ShoppingBag, 
  Shirt, 
  TrendingUp 
} from 'lucide-react';

const MainAppContent = () => {
  const { isAuthenticated, hasProfile, userProfile, isLoading: isAuthLoading } = useAuth();
  const { activeProfile, updateMeasurement, setUnit, updateProfileName } = useBodyProfile();
  const { activeGarment } = useGarmentProfile();
  const [activeLayer, setActiveLayer] = useState(1); // 1 = Body Profile, 2 = Choose Garment, 3 = Fit Engine, 4 = Virtual Try-On, 5 = Lookbook Dossier
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  // Sync authenticated profile from database into BodyProfileContext
  useEffect(() => {
    if (userProfile) {
      if (userProfile.name) {
        updateProfileName(userProfile.name);
      }
      if (userProfile.unit) {
        setUnit(userProfile.unit);
      }
      if (userProfile.measurements) {
        Object.entries(userProfile.measurements).forEach(([k, v]) => {
          if (v !== null && v !== undefined) {
            updateMeasurement(k, v);
          }
        });
      }
    }
  }, [userProfile]);

  const verifiedCount = Object.values(activeProfile.status || {}).filter(s => s === 'user_verified').length;
  const isFullyVerified = verifiedCount === 6;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLayer1Continue = () => {
    showToast('Body Profile verified! Proceeding to Choose Your Garment (Layer 2).');
    setActiveLayer(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLayer2Continue = (garment) => {
    showToast(`Garment "${garment.name}" imported! Proceeding to Real Fit Engine (Layer 3).`);
    setActiveLayer(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLayer3Continue = () => {
    showToast('Layer 3 Fit Analysis verified! Launching Real Virtual Try-On Studio (Layer 4).');
    setActiveLayer(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLayer4Continue = () => {
    showToast('Virtual Try-On Render complete! Launching Final Lookbook Dossier (Layer 5).');
    setActiveLayer(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLayer3 = () => {
    setActiveLayer(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToLayer = (layerNum) => {
    setActiveLayer(layerNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fitroom-app" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Subtle Floating Garments Animation in Background */}
      <FloatingGarments />

      {/* Haute Couture Brand Splash Screen */}
      {showSplash && (
        <BrandSplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* AUTH GATEWAY: If user is not yet authenticated via phone OTP */}
      {!isAuthenticated && !isAuthLoading && (
        <AuthGateway 
          onLoginSuccess={() => showToast('Welcome to FitRoom Haute Couture!')}
          onShowToast={showToast}
        />
      )}

      {/* FULL FITROOM WORKSPACE: Rendered directly once authenticated with auto-created profile */}
      {isAuthenticated && (
        <>
          {/* Top Navigation with Layer Switcher */}
          <Header 
            onOpenProfileModal={() => setIsProfileModalOpen(true)} 
            activeLayer={activeLayer}
            onSelectLayer={(l) => {
              setActiveLayer(l);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* Main Workspace Content */}
          <main className="app-main" style={{ position: 'relative', zIndex: 2 }}>
            {activeLayer === 1 && (
              /* ================= LAYER 1: BODY PROFILING ================= */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Hero Banner */}
                <section className="hero-banner">
                  <div className="hero-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="brand-badge">
                        <Cpu size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                        Layer 1: Anthropometric Engine
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• ISO 8559-1 Compliant</span>
                    </div>
                    <h2>Full-Body Capture & Measurement Calibration</h2>
                    <p className="hero-subtitle">
                      Upload or capture a full-body silhouette to extract AI-estimated measurements. 
                      Review, edit, and verify each dimension to build your permanent bespoke Body Profile for Virtual Try-On.
                    </p>
                  </div>

                  <div className="hero-stats">
                    <div className="stat-item">
                      <span className="stat-value">{activeProfile.height}cm</span>
                      <span className="stat-label">Stature Reference</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value" style={{ color: isFullyVerified ? 'var(--state-verified-text)' : 'var(--state-ai-text)' }}>
                        {verifiedCount}/6
                      </span>
                      <span className="stat-label">Verified Dimensions</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value" style={{ color: 'var(--cyan-accent)' }}>
                        94%
                      </span>
                      <span className="stat-label">AI Scan Accuracy</span>
                    </div>
                  </div>
                </section>

                {/* Two-Column Studio & Calibration Grid */}
                <div className="workspace-grid">
                  {/* Left Column: Full Body Image Studio */}
                  <div>
                    <BodyImageDropzone />
                  </div>

                  {/* Right Column: Calibration Matrix */}
                  <div>
                    <MeasurementMatrix 
                      onSavedSuccess={showToast} 
                      onContinue={handleLayer1Continue} 
                    />
                  </div>
                </div>

                {/* Bespoke Verified Specification Card */}
                <div style={{ marginTop: '8px' }}>
                  <VerifiedProfileSummary onContinue={handleLayer1Continue} />
                </div>
              </div>
            )}

            {activeLayer === 2 && (
              /* ================= LAYER 2: CHOOSE YOUR GARMENT ================= */
              <Layer2GarmentView 
                onProceedToTryOn={handleLayer2Continue}
                onShowToast={showToast}
              />
            )}

            {activeLayer === 3 && (
              /* ================= LAYER 3: REAL FIT ENGINE ================= */
              <Layer3FitEngineView 
                onProceedToLayer4={handleLayer3Continue}
                onShowToast={showToast}
              />
            )}

            {activeLayer === 4 && (
              /* ================= LAYER 4: REAL VIRTUAL TRY-ON STUDIO ================= */
              <Layer4VirtualTryonView 
                onBackToLayer3={handleBackToLayer3}
                onProceedToLayer5={handleLayer4Continue}
                onShowToast={showToast}
              />
            )}

            {activeLayer === 5 && (
              /* ================= LAYER 5: FINAL LOOKBOOK & FITTING DOSSIER ================= */
              <Layer5FinalExperienceView 
                onNavigateToLayer={handleNavigateToLayer}
                onShowToast={showToast}
              />
            )}
          </main>

          {/* Profile Management Modal */}
          <ProfileModal 
            isOpen={isProfileModalOpen} 
            onClose={() => setIsProfileModalOpen(false)} 
          />
        </>
      )}

      {/* Toast Alert */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BodyProfileProvider>
        <GarmentProfileProvider>
          <FitEngineProvider>
            <TryOnProvider>
              <MainAppContent />
            </TryOnProvider>
          </FitEngineProvider>
        </GarmentProfileProvider>
      </BodyProfileProvider>
    </AuthProvider>
  );
}
