import React, { useState, useRef } from 'react';
import { 
  Link2, 
  Upload, 
  Sparkles, 
  Shirt, 
  AlertTriangle, 
  FileSpreadsheet, 
  Check, 
  Layers, 
  Loader2, 
  ExternalLink 
} from 'lucide-react';
import { useGarmentProfile } from '../../context/GarmentProfileContext';
import { extractSizeChartFromImage } from '../../services/ocrService';

export const GarmentImportStudio = ({ onImportComplete }) => {
  const { 
    importFromUrl, 
    importFromUpload, 
    isLoading, 
    duplicateWarning, 
    clearDuplicateWarning 
  } = useGarmentProfile();

  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState(null);

  // Manual Upload States
  const [garmentImage, setGarmentImage] = useState(null);
  const [garmentName, setGarmentName] = useState('Classic Boxy Crewneck');
  const [garmentType, setGarmentType] = useState('T-Shirt');
  const [garmentCategory, setGarmentCategory] = useState('Top');
  const [sizeChartImage, setSizeChartImage] = useState(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [extractedSizeChart, setExtractedSizeChart] = useState(null);

  const garmentFileRef = useRef(null);
  const sizeChartFileRef = useRef(null);

  // Preset E-Commerce URLs for fast testing
  const sampleUrls = [
    {
      name: 'Uniqlo Supima Crew Neck',
      url: 'https://www.uniqlo.com/us/en/products/E422992-000/00'
    },
    {
      name: 'Zara Tailored Blazer',
      url: 'https://www.zara.com/us/en/structured-suit-blazer-p02010.html'
    },
    {
      name: "Levi's 501 Original Denim",
      url: 'https://www.levi.com/US/en_US/clothing/men/jeans/501-original-fit-mens-jeans/p/005010193'
    },
    {
      name: 'ASOS Silk Slip Dress',
      url: 'https://www.asos.com/us/women/dresses/silk-charmeuse-slip-dress/prd/2049921'
    }
  ];

  const handleUrlSubmit = async (e) => {
    e?.preventDefault();
    if (!urlInput.trim()) {
      setUrlError('Please paste a clothing product URL.');
      return;
    }
    setUrlError(null);
    try {
      const result = await importFromUrl(urlInput.trim());
      if (result?.success && onImportComplete) {
        onImportComplete(result.garment);
      }
    } catch (err) {
      setUrlError('Could not scrape product information. Check URL or try manual image upload.');
    }
  };

  const handleGarmentFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setGarmentImage(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSizeChartFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result;
        setSizeChartImage(dataUrl);
        setIsOcrProcessing(true);
        try {
          const parsedChart = await extractSizeChartFromImage(dataUrl);
          setExtractedSizeChart(parsedChart);
        } catch (err) {
          console.warn('OCR error fallback:', err);
        } finally {
          setIsOcrProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualUploadSubmit = () => {
    if (!garmentImage) {
      alert('Please upload a garment photo.');
      return;
    }

    const sizes = extractedSizeChart?.map(r => r.size) || ['S', 'M', 'L', 'XL'];
    const result = importFromUpload({
      name: garmentName.trim() || 'Custom Garment',
      garmentType,
      category: garmentCategory,
      image: garmentImage,
      sizeChart: extractedSizeChart || [
        { size: 'S', chest: 38, length: 27 },
        { size: 'M', chest: 40, length: 28 },
        { size: 'L', chest: 42, length: 29 },
        { size: 'XL', chest: 44, length: 30 }
      ],
      availableSizes: sizes
    });

    if (result?.success && onImportComplete) {
      onImportComplete(result.garment);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Duplicate Warning Banner */}
      {duplicateWarning && (
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid var(--state-ai-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="var(--state-ai-text)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--state-ai-text)' }}>
                Duplicate Product Flagged
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {duplicateWarning.message}
              </div>
            </div>
          </div>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={clearDuplicateWarning}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two Clear Options Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 60px 1fr',
          alignItems: 'stretch',
          gap: '12px'
        }}
        className="importer-split-grid"
      >
        {/* OPTION 1: 🔗 Product URL */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="field-icon" style={{ background: 'rgba(224, 192, 151, 0.12)', color: 'var(--gold-primary)' }}>
                <Link2 size={18} />
              </div>
              <h4 style={{ fontSize: '1.15rem' }}>🔗 Product URL</h4>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Paste clothing URL to automatically extract verified product name, sizing, and dimensions.
            </p>

            <form onSubmit={handleUrlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="url"
                className="stepper-input"
                placeholder="https://www.uniqlo.com/product/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem'
                }}
              />

              {urlError && (
                <div style={{ fontSize: '0.74rem', color: '#f87171' }}>
                  {urlError}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
                style={{ width: '100%', marginTop: '4px' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Extracting Metadata...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>[ Analyze Product ]</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Presets for Demo / Instant Testing */}
          <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px dashed var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Quick Sample URLs:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {sampleUrls.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-chip"
                  style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                  onClick={() => {
                    setUrlInput(s.url);
                  }}
                >
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center "OR" Divider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ flex: 1, width: '1px', background: 'var(--border-subtle)' }} />
          <span 
            style={{ 
              padding: '6px 10px', 
              borderRadius: 'var(--radius-full)', 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-medium)', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: 'var(--text-muted)' 
            }}
          >
            OR
          </span>
          <div style={{ flex: 1, width: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* OPTION 2: 👕 Upload Garment */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="field-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--cyan-accent)' }}>
              <Shirt size={18} />
            </div>
            <h4 style={{ fontSize: '1.15rem' }}>👕 Upload Garment</h4>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Drag garment image here or browse your device.
          </p>

          {/* Garment Image Upload Box */}
          <div
            onClick={() => garmentFileRef.current?.click()}
            style={{
              border: '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: garmentImage ? '#0c0c10' : 'rgba(255,255,255,0.02)',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {garmentImage ? (
              <img 
                src={garmentImage} 
                alt="Uploaded Garment" 
                style={{ maxHeight: '100px', objectFit: 'contain' }} 
              />
            ) : (
              <>
                <Upload size={24} color="var(--gold-primary)" style={{ marginBottom: '6px' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  Drag garment image here
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  or [ Browse Files ]
                </span>
              </>
            )}
            <input 
              ref={garmentFileRef}
              type="file" 
              accept="image/*" 
              onChange={handleGarmentFileChange} 
              style={{ display: 'none' }} 
            />
          </div>

          {/* Garment Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
            <input
              type="text"
              placeholder="Garment Name (e.g. Linen T-Shirt)"
              value={garmentName}
              onChange={(e) => setGarmentName(e.target.value)}
              className="stepper-input"
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem'
              }}
            />

            <select
              value={garmentType}
              onChange={(e) => {
                setGarmentType(e.target.value);
                setGarmentCategory(e.target.value === 'Trousers' || e.target.value === 'Jeans' ? 'Bottom' : (e.target.value === 'Blazer' || e.target.value === 'Coat' ? 'Outerwear' : 'Top'));
              }}
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px',
                fontSize: '0.82rem'
              }}
            >
              <option value="T-Shirt">T-Shirt</option>
              <option value="Shirt">Shirt</option>
              <option value="Blazer">Blazer</option>
              <option value="Trousers">Trousers</option>
              <option value="Jeans">Jeans</option>
              <option value="Dress">Dress</option>
              <option value="Coat">Coat</option>
            </select>
          </div>

          {/* Optional Size-Chart OCR Image Upload */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Optional Size-Chart (OCR Extractor):
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
              onClick={() => sizeChartFileRef.current?.click()}
            >
              <FileSpreadsheet size={13} />
              <span>{isOcrProcessing ? 'Scanning OCR...' : (sizeChartImage ? 'Chart Added' : 'Add Size Chart')}</span>
            </button>
            <input 
              ref={sizeChartFileRef}
              type="file" 
              accept="image/*" 
              onChange={handleSizeChartFileChange} 
              style={{ display: 'none' }} 
            />
          </div>

          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleManualUploadSubmit}
            disabled={!garmentImage}
            style={{ width: '100%', marginTop: 'auto' }}
          >
            <Check size={16} />
            <span>Create Garment Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
